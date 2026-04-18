'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import TemplateForm from '@/components/admin/templates/TemplateForm';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    Edit,
    ChevronLeft,
    ArrowRight,
    FileText,
    Loader2,
    Eye,
    ExternalLink,
} from 'lucide-react';
import { ta } from '@/i18n/auto-translations';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <EditTemplatePageClient templateId={id} />;
}

function EditTemplatePageClient({ templateId }: { templateId: string }) {
    const { dir } = useTranslation();
    const router = useRouter();
    const [templateData, setTemplateData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTemplate = async () => {
            try {
                const res = await api.getAdminTemplate(templateId);
                if (res.success) setTemplateData(res.data);
            } catch (error) {
                logger.error('Failed to load template:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTemplate();
    }, [templateId]);

    if (isLoading) {
        return (
            <div dir={dir} className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-500 font-medium">{ta('جاري تحميل بيانات القالب...', 'Loading template data...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ═══════════ Header with Gradient ═══════════ */}
            <div className="relative overflow-hidden bg-gradient-to-l from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />

                <div className="relative">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Link href="/admin" className="hover:text-primary transition-colors">
                            {ta('لوحة التحكم', 'Admin Panel')}
                        </Link>
                        <ChevronLeft className="w-4 h-4" />
                        <Link href="/admin/templates" className="hover:text-primary transition-colors">
                            {ta('القوالب', 'Templates')}
                        </Link>
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-gray-900 dark:text-white font-bold">
                            {ta('تعديل', 'Edit')}
                        </span>
                    </nav>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <span className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                <Edit className="w-6 h-6" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                                    {ta('تعديل القالب', 'Edit Template')}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {templateData?.name_ar || ta('بدون اسم', 'Untitled')}
                                    {templateData?.is_active !== false && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                                            <Eye className="w-3 h-3" /> {ta('نشط', 'Active')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {templateData?.slug && (
                                <Link
                                    href={`/marketplace/${templateData.slug}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {ta('عرض في المتجر', 'View in Store')}
                                </Link>
                            )}
                            <Link href="/admin/templates">
                                <Button variant="ghost" className="rounded-xl gap-2 font-bold">
                                    <ArrowRight className="w-4 h-4" />
                                    {ta('العودة للقوالب', 'Back to Templates')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ Form ═══════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <TemplateForm templateId={templateId} />
            </div>
        </div>
    );
}
