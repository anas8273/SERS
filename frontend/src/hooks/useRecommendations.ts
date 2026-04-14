'use client';

/**
 * useRecommendations — Intelligent AI-powered recommendation engine.
 *
 * Strategy:
 *  1. Client-side: Tracks user browsing history in localStorage (template views).
 *  2. On demand: Sends the browsing context to the backend /ai/recommendations
 *     endpoint which uses Groq (LLaMA 3.3) to generate smart, diverse picks.
 *  3. Fallback: If the user has no history OR the AI call fails, falls back to
 *     simple in-memory frequency scoring (original algorithm).
 *
 * The AI endpoint receives:
 *   - A concise browsing context (template IDs, section slugs, category names)
 *   - The full template catalog (id + name_ar + section_id + category_id)
 *   And returns an ordered list of recommended template IDs.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Template } from '@/types';

const BROWSING_KEY = 'sers_browsing_history';
const MAX_HISTORY = 30;

interface BrowsingEntry {
  sectionId?: string;
  categoryId?: string;
  templateId: string;
  timestamp: number;
}

interface RecommendationsState {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
}

export function useRecommendations() {
  const [history, setHistory] = useState<BrowsingEntry[]>([]);
  const [aiRecs, setAiRecs] = useState<RecommendationsState>({
    templates: [],
    isLoading: false,
    error: null,
  });
  const fetchedRef = useRef(false);

  // Load from localStorage (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BROWSING_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* invalid JSON or SSR */ }
  }, []);

  // Track a template view
  const trackView = useCallback((templateId: string, sectionId?: string, categoryId?: string) => {
    setHistory(prev => {
      const entry: BrowsingEntry = { templateId, sectionId, categoryId, timestamp: Date.now() };
      const updated = [entry, ...prev.filter(e => e.templateId !== templateId)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(BROWSING_KEY, JSON.stringify(updated)); } catch { /* quota */ }
      return updated;
    });
    // Reset so next getAIRecommendations() re-fetches
    fetchedRef.current = false;
  }, []);

  // ─── AI-Powered Recommendations ────────────────────────────────────────────
  /**
   * Calls the backend /ai/recommendations endpoint with browsing context.
   * The backend calls Groq (LLaMA 3.3) and returns sorted template IDs.
   * We then map those IDs back to full Template objects from allTemplates.
   */
  const getAIRecommendations = useCallback(async (allTemplates: Template[], limit = 4): Promise<Template[]> => {
    if (history.length === 0 || allTemplates.length === 0) return [];

    // Don't re-fetch if already done for this session
    if (fetchedRef.current && aiRecs.templates.length > 0) {
      return aiRecs.templates.slice(0, limit);
    }

    setAiRecs(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Build a lightweight context payload for the AI engine
      const viewedIds = new Set(history.map(e => e.templateId));
      const browsedSections = [...new Set(history.map(e => e.sectionId).filter(Boolean))].slice(0, 5);
      const browsedCategories = [...new Set(history.map(e => e.categoryId).filter(Boolean))].slice(0, 5);

      // Candidate templates (not yet viewed)
      const candidates = allTemplates
        .filter(t => !viewedIds.has(t.id))
        .map(t => ({
          id: t.id,
          name_ar: t.name_ar,
          section_id: (t as any).section_id,
          category_id: t.category_id,
        }));

      if (candidates.length === 0) {
        setAiRecs({ templates: [], isLoading: false, error: null });
        return [];
      }

      const stored = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
      let token: string | null = null;
      if (stored) {
        try { token = JSON.parse(stored)?.state?.token || null; } catch { /* ignore */ }
      }

      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          browsed_sections: browsedSections,
          browsed_categories: browsedCategories,
          recently_viewed: history.slice(0, 10).map(e => e.templateId),
          candidates: candidates.slice(0, 50), // Keep payload small
          limit,
        }),
        signal: AbortSignal.timeout(8000), // 8-second timeout
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const recommendedIds: string[] = data?.data?.recommended_ids || data?.recommended_ids || [];

      // Map IDs back to full Template objects
      const idToTemplate = new Map(allTemplates.map(t => [t.id, t]));
      const recommendations = recommendedIds
        .map(id => idToTemplate.get(id))
        .filter((t): t is Template => !!t)
        .slice(0, limit);

      fetchedRef.current = true;
      setAiRecs({ templates: recommendations, isLoading: false, error: null });
      return recommendations;

    } catch (err) {
      // Graceful fallback to local frequency scoring
      const fallback = getFallbackRecommendations(allTemplates, history, limit);
      fetchedRef.current = true;
      setAiRecs({ templates: fallback, isLoading: false, error: null });
      return fallback;
    }
  }, [history, aiRecs.templates]);

  // ─── Local Fallback (original algorithm) ───────────────────────────────────
  /**
   * Pure in-memory frequency scoring — used when AI is unavailable OR
   * user has no network. No API calls.
   */
  const getRecommendations = useCallback(<T extends { id: string; section_id?: string; category_id?: string }>(
    templates: T[],
    limit = 4
  ): T[] => {
    return getFallbackRecommendations(templates as unknown as Template[], history, limit) as unknown as T[];
  }, [history]);

  return {
    trackView,
    getRecommendations,
    getAIRecommendations,
    hasHistory: history.length > 0,
    aiRecs,
  };
}

// ─── Shared fallback scorer (used by both getRecommendations & error path) ─────
function getFallbackRecommendations<T extends { id: string }>(
  templates: T[],
  history: BrowsingEntry[],
  limit: number
): T[] {
  if (history.length === 0) return [];

  const viewedIds = new Set(history.map(e => e.templateId));
  const freq: Record<string, number> = {};
  history.forEach(e => {
    if (e.sectionId) freq[e.sectionId] = (freq[e.sectionId] || 0) + 1;
  });

  const topSections = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  const now = Date.now();
  const DAY = 86400000;

  const scored = templates
    .filter(t => !viewedIds.has(t.id))
    .map(t => {
      const sid = (t as any).section_id || '';
      const sIdx = topSections.indexOf(sid);
      const recency = history.find(e => e.sectionId === sid)
        ? ((now - (history.find(e => e.sectionId === sid)!.timestamp)) < DAY ? 2 : 1.5)
        : 1;
      const score = sIdx !== -1 ? (3 - sIdx) * 3 * recency : 0;
      return { template: t, score, sid };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const result: T[] = [];
  const sectionCount: Record<string, number> = {};
  for (const s of scored) {
    if (result.length >= limit) break;
    const cnt = sectionCount[s.sid] || 0;
    if (cnt >= 2) continue;
    result.push(s.template);
    sectionCount[s.sid] = cnt + 1;
  }
  return result;
}
