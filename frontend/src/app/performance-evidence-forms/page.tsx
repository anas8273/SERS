'use client';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/i18n/useTranslation';

function Skeleton() {
  const { dir } = useTranslation();
    return (
        <div dir={dir} className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 animate-pulse" />
                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
        </div>
    );
}

const PerformanceContent = dynamic(
    () => import('./_PerformanceContent'),
    { loading: () => <Skeleton />, ssr: false }
);

export default function PerformanceEvidenceFormsPage() {
    return <PerformanceContent />;
}
