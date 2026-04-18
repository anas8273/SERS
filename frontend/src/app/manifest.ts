import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SERS - منصة الخدمات التعليمية الذكية',
    short_name: 'SERS',
    description: 'منصة رقمية شاملة للمعلمين — سجلات ونماذج وخطط وتقارير وشهادات وتحليل نتائج',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8b5cf6',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
