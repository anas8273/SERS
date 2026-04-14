'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
interface UserBehavior {
  /** Number of visits (session count) */
  visitCount: number;
  /** Most used tool/service slugs — sorted by frequency */
  frequentTools: string[];
  /** Last visited service slug */
  lastService: string | null;
  /** Time of day category */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** User experience level based on visit count */
  experienceLevel: 'new' | 'returning' | 'power';
  /** Days since first visit */
  daysSinceFirstVisit: number;
  /** Dynamic accent gradient based on time of day */
  accentGradient: string;
  /** Suggested greeting key */
  greetingVariant: 'welcome_new' | 'welcome_back' | 'good_morning' | 'good_evening' | 'late_night';
}

interface AdaptiveUIContextValue {
  behavior: UserBehavior;
  /** Track a tool/service usage */
  trackToolUsage: (slug: string) => void;
  /** Check if user should see onboarding hints */
  showOnboardingHints: boolean;
}

// ─── Defaults ────────────────────────────────────────────────────────
const defaultBehavior: UserBehavior = {
  visitCount: 1,
  frequentTools: [],
  lastService: null,
  timeOfDay: 'morning',
  experienceLevel: 'new',
  daysSinceFirstVisit: 0,
  accentGradient: 'from-violet-500 to-purple-600',
  greetingVariant: 'welcome_new',
};

const AdaptiveUIContext = createContext<AdaptiveUIContextValue>({
  behavior: defaultBehavior,
  trackToolUsage: () => {},
  showOnboardingHints: true,
});

// ─── LS Keys ─────────────────────────────────────────────────────────
const LS_KEY = 'sers_adaptive_ui';

interface StoredData {
  visitCount: number;
  firstVisit: string;
  toolUsage: Record<string, number>;
  lastService: string | null;
}

function getStoredData(): StoredData {
  if (typeof window === 'undefined') {
    return { visitCount: 1, firstVisit: new Date().toISOString(), toolUsage: {}, lastService: null };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { visitCount: 1, firstVisit: new Date().toISOString(), toolUsage: {}, lastService: null };
    return JSON.parse(raw);
  } catch {
    return { visitCount: 1, firstVisit: new Date().toISOString(), toolUsage: {}, lastService: null };
  }
}

function saveStoredData(data: StoredData) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// ─── Time helpers ────────────────────────────────────────────────────
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function getAccentGradient(tod: string): string {
  switch (tod) {
    case 'morning':   return 'from-amber-400 via-orange-400 to-rose-400';
    case 'afternoon': return 'from-blue-500 via-violet-500 to-purple-500';
    case 'evening':   return 'from-indigo-500 via-purple-600 to-pink-500';
    case 'night':     return 'from-slate-700 via-indigo-800 to-purple-900';
    default:          return 'from-violet-500 to-purple-600';
  }
}

function getGreetingVariant(tod: string, visitCount: number, daysSinceFirst: number): UserBehavior['greetingVariant'] {
  if (visitCount <= 2) return 'welcome_new';
  if (tod === 'morning') return 'good_morning';
  if (tod === 'evening' || tod === 'night') return 'good_evening';
  if (daysSinceFirst > 7 && visitCount > 5) return 'welcome_back';
  return 'good_morning';
}

// ─── Provider ────────────────────────────────────────────────────────
export function AdaptiveUIProvider({ children }: { children: ReactNode }) {
  const [behavior, setBehavior] = useState<UserBehavior>(defaultBehavior);

  // Initialize on mount
  useEffect(() => {
    const stored = getStoredData();
    const newVisitCount = stored.visitCount + 1;
    const firstVisitDate = new Date(stored.firstVisit);
    const daysSinceFirst = Math.floor((Date.now() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    const tod = getTimeOfDay();

    // Sort tools by usage frequency
    const toolEntries = Object.entries(stored.toolUsage).sort((a, b) => b[1] - a[1]);
    const frequentTools = toolEntries.map(([slug]) => slug);

    const experienceLevel: UserBehavior['experienceLevel'] =
      newVisitCount <= 3 ? 'new' : newVisitCount <= 15 ? 'returning' : 'power';

    const newBehavior: UserBehavior = {
      visitCount: newVisitCount,
      frequentTools,
      lastService: stored.lastService,
      timeOfDay: tod,
      experienceLevel,
      daysSinceFirstVisit: daysSinceFirst,
      accentGradient: getAccentGradient(tod),
      greetingVariant: getGreetingVariant(tod, newVisitCount, daysSinceFirst),
    };

    setBehavior(newBehavior);

    // Persist visit count
    saveStoredData({ ...stored, visitCount: newVisitCount });
  }, []);

  const trackToolUsage = useCallback((slug: string) => {
    const stored = getStoredData();
    const usage = stored.toolUsage || {};
    usage[slug] = (usage[slug] || 0) + 1;
    const updated = { ...stored, toolUsage: usage, lastService: slug };
    saveStoredData(updated);

    // Update behavior in-memory
    const toolEntries = Object.entries(usage).sort((a, b) => b[1] - a[1]);
    setBehavior(prev => ({
      ...prev,
      frequentTools: toolEntries.map(([s]) => s),
      lastService: slug,
    }));
  }, []);

  const showOnboardingHints = behavior.experienceLevel === 'new';

  return (
    <AdaptiveUIContext.Provider value={{ behavior, trackToolUsage, showOnboardingHints }}>
      {children}
    </AdaptiveUIContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────
export function useAdaptiveUI() {
  return useContext(AdaptiveUIContext);
}
