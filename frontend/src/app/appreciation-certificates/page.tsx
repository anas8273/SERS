'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * [REDIRECT] This page has been merged into /certificates.
 * Automatically redirects visitors to the unified certificates page.
 */
export default function AppreciationCertificatesRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/certificates'); }, [router]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400 mx-auto mb-4" />
                <p className="text-gray-400">جارٍ التحويل إلى صفحة الشهادات...</p>
            </div>
        </div>
    );
}
