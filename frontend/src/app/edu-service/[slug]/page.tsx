'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, BookOpen, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n/useTranslation';
import { getServiceBySlug } from '@/lib/firestore-service';
import { DEFAULT_SERVICES } from '@/lib/default-services';
import type { ServiceDefinition } from '@/types';

export default function EduServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { locale, localizedField } = useTranslation();
    const isRTL = locale === 'ar';

    const slug = typeof params.slug === 'string' ? params.slug : '';

    const [service, setService] = useState<ServiceDefinition | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                // Try Firestore first
                const fsService = await getServiceBySlug(slug);
                if (!cancelled && fsService) {
                    setService(fsService);
                    setLoading(false);
                    return;
                }
            } catch { /* fallback below */ }

            // Fallback to DEFAULT_SERVICES
            const fallback = DEFAULT_SERVICES.find(s => s.slug === slug);
            if (!cancelled) {
                setService(fallback || null);
                setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [slug]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Unknown service → show not found
    if (!service) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
                <div className="text-6xl">🔍</div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                    {isRTL ? 'الخدمة غير موجودة' : 'Service Not Found'}
                </h1>
                <p className="text-gray-500 max-w-md">
                    {isRTL
                        ? 'لم يتم العثور على هذه الخدمة التعليمية. تحقق من الرابط أو تصفح جميع الخدمات.'
                        : 'This educational service was not found. Check the URL or browse all services.'}
                </p>
                <Link href="/services">
                    <Button className="rounded-full px-8 font-bold">
                        {isRTL ? 'عرض جميع الخدمات' : 'View All Services'}
                    </Button>
                </Link>
            </div>
        );
    }

    const title = localizedField(service, 'name');
    const desc = localizedField(service, 'description');
    const toolHref = service.route || `/${service.slug}`;
    const gradientColor = service.gradient || 'from-blue-500 to-blue-600';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowRight className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                    {isRTL ? 'رجوع' : 'Back'}
                </button>

                {/* Hero Card */}
                <Card className="overflow-hidden shadow-xl mb-6">
                    <div className={`h-32 bg-gradient-to-r ${gradientColor} flex items-center justify-center`}>
                        <span className="text-6xl">{service.icon || '📋'}</span>
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-black text-gray-900 dark:text-white">
                            {title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                            {desc}
                        </p>
                        <Link href={toolHref}>
                            <Button className={`w-full rounded-xl font-bold gap-2 bg-gradient-to-r ${gradientColor} text-white border-0 shadow-lg hover:opacity-90`}>
                                <ExternalLink className="w-4 h-4" />
                                {isRTL ? 'فتح الأداة' : 'Open Tool'}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                    {isRTL ? 'كيفية الاستخدام' : 'How to Use'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isRTL
                                        ? 'اضغط على "فتح الأداة" لبدء العمل والاستفادة من الأداة التعليمية مباشرة.'
                                        : 'Press "Open Tool" to start working with this educational tool directly.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                    {isRTL ? 'خدمات أخرى' : 'Other Services'}
                                </h3>
                                <Link href="/services" className="text-sm text-primary hover:underline font-medium">
                                    {isRTL ? 'تصفح جميع الخدمات التعليمية ←' : '← Browse All Services'}
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
