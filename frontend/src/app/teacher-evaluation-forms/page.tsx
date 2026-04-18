'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * [REDIRECT] This page has been merged into /performance-evidence-forms.
 * The unified performance evidence page now covers all 11 بنود including
 * teacher evaluation elements.
 */
export default function TeacherEvaluationRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/performance-evidence-forms'); }, [router]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400 mx-auto mb-4" />
                <p className="text-gray-400">جارٍ التحويل إلى شواهد الأداء الوظيفي...</p>
            </div>
        </div>
    );
}
