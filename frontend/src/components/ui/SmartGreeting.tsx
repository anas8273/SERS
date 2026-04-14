'use client';

/**
 * SmartGreeting.tsx — REMOVED (merged into dashboard/page.tsx)
 *
 * Previously caused a duplicate greeting alongside UserQuickStats.
 * getSubtitle() returned the same value in ALL branches (dead code).
 * The greeting is now a single, clean header in dashboard/page.tsx.
 *
 * Kept as no-op export so other potential importers don't break.
 */

export function SmartGreeting({ className }: { className?: string }) {
  return null;
}
