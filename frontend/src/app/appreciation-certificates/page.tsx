'use client';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/i18n/useTranslation';

function Skeleton() {
  const { dir } = useTranslation();
    return (
        <div dir={dir} className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 animate-pulse" />
        </div>
    );
}

const AppreciationContent = dynamic(
    () => import('./_AppreciationContent'),
    { loading: () => <Skeleton />, ssr: false }
);

export default function AppreciationCertificatesPage() {
    return <AppreciationContent />;
}
