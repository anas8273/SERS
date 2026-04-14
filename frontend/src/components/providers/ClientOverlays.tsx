'use client';

import dynamic from 'next/dynamic';

// Lazy-loaded overlays / widgets – these require `ssr: false` which is
// only allowed inside Client Components.  Extracted from layout.tsx so
// the root layout can remain a Server Component (required for metadata).
const CartDrawer = dynamic(
  () => import('@/components/cart/CartDrawer').then(m => ({ default: m.CartDrawer })),
  { ssr: false }
);
const CommandPalette = dynamic(
  () => import('@/components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })),
  { ssr: false }
);
const SmartWelcomeBanner = dynamic(
  () => import('@/components/ui/SmartWelcomeBanner').then(m => ({ default: m.SmartWelcomeBanner })),
  { ssr: false }
);
const CookieConsent = dynamic(
  () => import('@/components/ui/CookieConsent').then(m => ({ default: m.CookieConsent })),
  { ssr: false }
);
const SessionTimeoutWarning = dynamic(
  () => import('@/components/auth/SessionTimeoutWarning').then(m => ({ default: m.SessionTimeoutWarning })),
  { ssr: false }
);
const WhatsAppButton = dynamic(
  () => import('@/components/ui/WhatsAppButton').then(m => ({ default: m.WhatsAppButton })),
  { ssr: false }
);

/**
 * Client-side overlays and widgets that don't need SSR.
 * Rendered inside <Suspense> in the root layout.
 */
export function ClientOverlays() {
  return (
    <>
      <WhatsAppButton />
      <CookieConsent />
      <SessionTimeoutWarning />
      <CartDrawer />
      <CommandPalette />
      <SmartWelcomeBanner />
    </>
  );
}
