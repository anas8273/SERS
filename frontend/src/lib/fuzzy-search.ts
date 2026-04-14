/**
 * fuzzy-search.ts — SERS Smart Search Engine
 *
 * Features:
 *   1. Arabic normalization (tashkeel, alef variants, teh marbuta)
 *   2. Exact phrase mode: wrap query in quotes → exact substring match only
 *   3. Auto-detection of quoted phrases ("...")
 *   4. 5-tier scoring: exact title > prefix > substring > word-match > fuzzy
 *   5. Levenshtein distance for typo tolerance
 *   6. Match highlighting
 */

// ── Arabic normalization ──────────────────────────────────────────────────────
const ARABIC_NORM: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ة': 'ه',
  'ى': 'ي',
  'ؤ': 'و',
  'ئ': 'ي',
};

const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;

/** Normalize Arabic text for comparison */
export function normalizeArabic(text: string): string {
  let result = text.replace(TASHKEEL_RE, '');
  for (const [from, to] of Object.entries(ARABIC_NORM)) {
    result = result.replaceAll(from, to);
  }
  return result.toLowerCase().trim();
}

// ── Levenshtein distance ──────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function isFuzzyWordMatch(queryWord: string, textWord: string, threshold: number): boolean {
  if (textWord.includes(queryWord)) return true;
  if (queryWord.length <= 2) return textWord.startsWith(queryWord);
  return levenshtein(queryWord, textWord) <= threshold;
}

// ── Scoring tiers (lower = better) ───────────────────────────────────────────
const SCORE = {
  EXACT_TITLE: 0,   // full normalized query === full normalized first-field value
  PREFIX: 1,        // text starts with query
  SUBSTRING: 2,     // text contains query as exact substring
  WORD_MATCH: 3,    // all query words match (substring or fuzzy)
  FUZZY_PARTIAL: 4, // some words match
} as const;

// ── Public types ──────────────────────────────────────────────────────────────
export interface FuzzySearchResult<T> {
  item: T;
  score: number;       // lower = better
  matches: string[];   // matched field names
}

export interface SmartSearchOptions {
  /** Force exact phrase matching (overrides auto-detect) */
  exactPhrase?: boolean;
  /** Max Levenshtein distance (default: auto based on word length) */
  threshold?: number;
  /** Minimum query length (default: 1) */
  minLength?: number;
}

/**
 * Detect if user intentionally typed an exact phrase (wrapped in quotes).
 * e.g. `"شهادة تقدير"` → returns the inner phrase, strips quotes
 * Returns `{ isExact: true, phrase: 'شهادة تقدير' }` or `{ isExact: false, phrase: query }`
 */
export function detectExactPhrase(query: string): { isExact: boolean; phrase: string } {
  const trimmed = query.trim();
  // Matches: "...", «...», '...', or starts with a star * (prefix match request)
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) ||
    (trimmed.startsWith('«') && trimmed.endsWith('»') && trimmed.length > 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 2)
  ) {
    return { isExact: true, phrase: trimmed.slice(1, -1).trim() };
  }
  return { isExact: false, phrase: trimmed };
}

// ── Core search function ──────────────────────────────────────────────────────
/**
 * Perform smart search over items.
 *
 * @param items        - Array to search
 * @param query        - User's search query (can include "quotes" for exact phrase)
 * @param getFields    - Returns `[fieldName, fieldValue][]` for each item
 * @param options      - Search options
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => [string, string][],
  options: SmartSearchOptions = {}
): FuzzySearchResult<T>[] {
  const { minLength = 1 } = options;

  // Auto-detect quoted exact phrase
  const { isExact, phrase } = detectExactPhrase(query);
  const forceExact = options.exactPhrase ?? isExact;

  const normalizedQuery = normalizeArabic(phrase);
  if (normalizedQuery.length < minLength) {
    return items.map(item => ({ item, score: SCORE.FUZZY_PARTIAL, matches: [] }));
  }

  // ── Exact Phrase Mode ──
  if (forceExact) {
    const results: FuzzySearchResult<T>[] = [];
    for (const item of items) {
      const fields = getFields(item);
      const matchedFields: string[] = [];
      let bestScore = Infinity;

      for (const [fieldName, fieldValue] of fields) {
        if (!fieldValue) continue;
        const normalizedField = normalizeArabic(fieldValue);
        if (normalizedField.includes(normalizedQuery)) {
          matchedFields.push(fieldName);
          const score = normalizedField === normalizedQuery
            ? SCORE.EXACT_TITLE
            : normalizedField.startsWith(normalizedQuery)
              ? SCORE.PREFIX
              : SCORE.SUBSTRING;
          bestScore = Math.min(bestScore, score);
        }
      }

      if (matchedFields.length > 0) {
        results.push({ item, score: bestScore, matches: matchedFields });
      }
    }
    return results.sort((a, b) => a.score - b.score);
  }

  // ── Fuzzy / Smart Mode ──
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const results: FuzzySearchResult<T>[] = [];

  for (const item of items) {
    const fields = getFields(item);
    let bestScore = Infinity;
    const matchedFields: string[] = [];
    const isFirst = (fi: number) => fi === 0; // first field = primary (title)

    for (let fi = 0; fi < fields.length; fi++) {
      const [fieldName, fieldValue] = fields[fi];
      if (!fieldValue) continue;

      const normalizedField = normalizeArabic(fieldValue);
      const fieldWords = normalizedField.split(/\s+/).filter(Boolean);

      // Tier 1 — exact title match
      if (isFirst(fi) && normalizedField === normalizedQuery) {
        matchedFields.push(fieldName);
        bestScore = Math.min(bestScore, SCORE.EXACT_TITLE);
        continue;
      }

      // Tier 2 — prefix match (title starts with query)
      if (isFirst(fi) && normalizedField.startsWith(normalizedQuery)) {
        matchedFields.push(fieldName);
        bestScore = Math.min(bestScore, SCORE.PREFIX);
        continue;
      }

      // Tier 3 — exact substring (full phrase found in value)
      if (queryWords.length > 1 && normalizedField.includes(normalizedQuery)) {
        matchedFields.push(fieldName);
        bestScore = Math.min(bestScore, SCORE.SUBSTRING);
        continue;
      }

      // Tier 4 — all words match
      let allWordsMatch = true;
      let wordScore: number = SCORE.WORD_MATCH;

      for (const qw of queryWords) {
        const threshold = options.threshold ?? (qw.length <= 3 ? 1 : qw.length <= 6 ? 2 : 3);

        if (normalizedField.includes(qw)) {
          continue; // exact substring of this word — perfect
        }

        const wordMatch = fieldWords.some(fw => isFuzzyWordMatch(qw, fw, threshold));
        if (wordMatch) {
          wordScore = Math.max(wordScore, SCORE.FUZZY_PARTIAL);
          continue;
        }

        allWordsMatch = false;
        break;
      }

      if (allWordsMatch) {
        matchedFields.push(fieldName);
        bestScore = Math.min(bestScore, wordScore);
      }
    }

    if (matchedFields.length > 0) {
      results.push({ item, score: bestScore, matches: matchedFields });
    }
  }

  return results.sort((a, b) => a.score - b.score);
}

// ── Highlight helper ──────────────────────────────────────────────────────────
/**
 * Highlight matched text within a string.
 * Returns segments of `{ text, highlighted }`.
 */
export function highlightMatches(
  text: string,
  query: string
): { text: string; highlighted: boolean }[] {
  if (!query || !text) return [{ text, highlighted: false }];

  const { phrase } = detectExactPhrase(query);
  const normalizedQuery = normalizeArabic(phrase);
  const normalizedText = normalizeArabic(text);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

  const highlights: boolean[] = new Array(text.length).fill(false);

  // Try to highlight the full phrase first (for exact/multi-word)
  if (queryWords.length > 1) {
    let idx = normalizedText.indexOf(normalizedQuery);
    while (idx !== -1) {
      for (let i = idx; i < idx + normalizedQuery.length && i < text.length; i++) {
        highlights[i] = true;
      }
      idx = normalizedText.indexOf(normalizedQuery, idx + 1);
    }
  }

  // Then highlight individual words
  for (const qw of queryWords) {
    let idx = normalizedText.indexOf(qw);
    while (idx !== -1) {
      for (let i = idx; i < idx + qw.length && i < text.length; i++) {
        highlights[i] = true;
      }
      idx = normalizedText.indexOf(qw, idx + 1);
    }
  }

  // Build segments
  const segments: { text: string; highlighted: boolean }[] = [];
  let current = { text: '', highlighted: highlights[0] || false };

  for (let i = 0; i < text.length; i++) {
    const isHighlighted = highlights[i];
    if (isHighlighted !== current.highlighted) {
      if (current.text) segments.push(current);
      current = { text: text[i], highlighted: isHighlighted };
    } else {
      current.text += text[i];
    }
  }
  if (current.text) segments.push(current);

  return segments;
}
