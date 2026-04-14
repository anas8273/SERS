'use client';

/**
 * UserQuickStats.tsx — REMOVED (merged into dashboard/page.tsx)
 *
 * Previously caused:
 * 1. Duplicate greeting — shown again after SmartGreeting
 * 2. Duplicate API calls — re-fetched orders already fetched by getDashboardSummary
 * 3. Illogical "اذهب للمتجر" as a stat card
 * 4. Hard-coded Arabic strings (not using i18n)
 *
 * The quick-stats bar is now rendered inline in dashboard/page.tsx
 * using the data already available from getDashboardSummary().
 * This file is kept as a no-op export to avoid import errors.
 */

export function UserQuickStats() {
  return null;
}
