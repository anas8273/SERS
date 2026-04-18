'use client';
export const dynamic = 'force-dynamic';
import { ta } from '@/i18n/auto-translations';

import TemplateForm from '@/components/admin/templates/TemplateForm';
import Link from 'next/link';
import {
    Plus,
    ChevronLeft,
    ArrowRight,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';

export default function CreateTemplatePage() {
  const { dir } = useTranslation();
    return (
        <div dir={dir} className="space-y-6">
            {/* ═══════════ Header with Gradient ═══════════ */}
            <div className="relative overflow-hidden bg-gradient-to-l from-emerald-500/5 via-teal-500/5 to-primary/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-primary/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />

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
                            {ta('إضافة جديد', 'Add New')}
                        </span>
                    </nav>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <span className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                                <Plus className="w-6 h-6" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                                    {ta('إضافة قالب جديد', 'Add New Template')}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {ta('أدخل تفاصيل القالب الجديد لنشره في المتجر', 'Enter new template details to publish in the store')}
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/templates">
                            <Button variant="ghost" className="rounded-xl gap-2 font-bold">
                                <ArrowRight className="w-4 h-4" />
                                {ta('العودة للقوالب', 'Back to Templates')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ═══════════ Form ═══════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <TemplateForm />
            </div>
        </div>
    );
}