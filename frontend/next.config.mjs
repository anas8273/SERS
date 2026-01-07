/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات الصور لتمكين الصور من أي مصدر (مفيد أثناء التطوير)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;