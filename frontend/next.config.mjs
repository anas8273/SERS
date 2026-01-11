/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات الصور لتمكين الصور من أي مصدر (مفيد أثناء التطوير)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
};

export default nextConfig;