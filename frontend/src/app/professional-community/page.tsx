'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * [REDIRECT] This page has been merged into performance-evidence-forms → بند ٢.
 * Automatically redirects visitors to the unified performance evidence page.
 */
export default function ProfessionalCommunityRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/performance-evidence-forms?section=professional-community'); }, [router]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-400 mx-auto mb-4" />
                <p className="text-gray-400">جارٍ التحويل إلى شواهد الأداء الوظيفي...</p>
            </div>
        </div>
    );
}
