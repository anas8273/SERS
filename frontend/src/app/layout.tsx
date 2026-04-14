import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { I18nProvider } from '@/i18n/useTranslation';
import { AutoTranslator } from '@/i18n/AutoTranslator';
import { BackToTop } from '@/components/ui/BackToTop';
import { PageProgress } from '@/components/ui/PageProgress';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { GlobalErrorCatcher } from '@/components/GlobalErrorCatcher';
import { AdaptiveUIProvider } from '@/components/providers/AdaptiveUIProvider';
import { ClientOverlays } from '@/components/providers/ClientOverlays';
import SkipLink from '@/components/ui/skip-link';
import './globals.css';

// Arabic font for better RTL support — Display/Headings
// [PERF] Reduced from 6→4 weights (removed 300, 900 — unused in codebase)
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
});

// Body text — characterful, highly legible
// [PERF] Reduced from 6→4 weights (removed 200, 600 — minimal usage)
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://sers.sa'),
  title: {
    default: 'SERS - سوق السجلات التعليمية الذكية',
    template: '%s | SERS',
  },
  description: 'منصة رقمية متكاملة للقوالب التعليمية التفاعلية والقابلة للتحميل مصممة للمعلمين في المملكة العربية السعودية',
  applicationName: 'SERS',
  keywords: ['تعليم', 'سجلات تعليمية', 'قوالب', 'رياض أطفال', 'ابتدائي', 'متوسط', 'ثانوي', 'معلم', 'شهادات', 'محافظ'],
  authors: [{ name: 'SERS Team' }],
  robots: { index: true, follow: true },
  icons: {
    icon: '/icon.svg',
    apple: '/logo.png',
    other: [{ rel: 'manifest', url: '/manifest.json' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SERS',
  },
  openGraph: {
    title: 'SERS - سوق السجلات التعليمية الذكية',
    description: 'منصة رقمية متكاملة للقوالب التعليمية التفاعلية — شهادات، محافظ، اختبارات، خطط، تقارير',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'SERS',
    images: [{
      url: '/logo.png',
      width: 512,
      height: 512,
      alt: 'SERS - منصة السجلات التعليمية الذكية',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SERS - سوق السجلات التعليمية الذكية',
    description: 'منصة رقمية متكاملة للقوالب التعليمية',
    images: ['/logo.png'],
  },
};

export const viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',  // Required for iPhone notch/Dynamic Island safe area CSS vars
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${plexArabic.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* FIX dark mode: use `bg-background` CSS variable instead of hardcoded colors so theme switching works correctly */}
      <body className={`${plexArabic.className} antialiased bg-background text-foreground min-h-screen transition-colors duration-300`}>
        {/* [F-03 WCAG] Skip to main content link for keyboard/screen reader users */}
        <SkipLink />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <I18nProvider>
            <AutoTranslator />
            <AdaptiveUIProvider>
            {/* Toast Notifications — FIX dark mode: use CSS variables for theme-aware colors */}
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={10}
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  fontFamily: 'var(--font-cairo)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.15)',
                  border: '1px solid hsl(var(--border))',
                  maxWidth: 'min(420px, calc(100vw - 2rem))',
                },
                success: {
                  iconTheme: {
                    primary: '#8b5cf6',
                    secondary: 'hsl(var(--card))',
                  },
                  style: {
                    // FIX RTL: borderInlineStart is the logical property for borderLeft
                    borderInlineStart: '4px solid #8b5cf6',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'hsl(var(--card))',
                  },
                  style: {
                    // FIX RTL: borderInlineStart is the logical property for borderLeft
                    borderInlineStart: '4px solid #ef4444',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#8b5cf6',
                    secondary: 'hsl(var(--muted))',
                  },
                },
              }}
            />

            {/* Page Progress Bar */}
            <PageProgress />

            {/* Main Content */}
            <main id="main-content" tabIndex={-1}>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse w-8 h-8 rounded-xl bg-primary/20"></div>
              </div>
            }>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <OfflineBanner />
              <BackToTop />
              <GlobalErrorCatcher />
              {/* Client-only overlays (CartDrawer, CommandPalette, etc.) */}
              <ClientOverlays />
            </Suspense>
            </main>
            </AdaptiveUIProvider>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}