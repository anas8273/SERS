import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';

// Arabic font for better RTL support
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

// English font fallback
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SERS - سوق السجلات التعليمية الذكية',
  description: 'منصة رقمية متكاملة للقوالب التعليمية التفاعلية والقابلة للتحميل',
  keywords: ['تعليم', 'سجلات', 'قوالب', 'رياض أطفال', 'ابتدائي', 'متوسط'],
  authors: [{ name: 'SERS Team' }],
  openGraph: {
    title: 'SERS - سوق السجلات التعليمية الذكية',
    description: 'منصة رقمية متكاملة للقوالب التعليمية التفاعلية والقابلة للتحميل',
    type: 'website',
    locale: 'ar_SA',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={`${cairo.className} antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300`}>
        <ThemeProvider defaultTheme="system" storageKey="sers-theme">
          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                fontFamily: 'var(--font-cairo)',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
            }}
          />

          {/* Main Content */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}