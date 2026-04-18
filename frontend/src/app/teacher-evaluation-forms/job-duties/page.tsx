'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * [REDIRECT] Merged into بند ١ inside /performance-evidence-forms.
 */
export default function JobDutiesRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/performance-evidence-forms?section=job-duties'); }, [router]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-400 mx-auto mb-4" />
                <p className="text-gray-400">جارٍ التحويل...</p>
            </div>
        </div>
    );
}
