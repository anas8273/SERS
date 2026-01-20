'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { TemplateWishlistButton } from '@/components/templates/TemplateWishlistButton';
import { TemplateReviews } from '@/components/templates/TemplateReviews';
import { useCartStore } from '@/stores/cartStore';
import toast from 'react-hot-toast';
import type { Template } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function TemplateDetailsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addItem, items } = useCartStore();

    const [template, setTemplate] = useState<Template | null>(null);
    const [relatedTemplates, setRelatedTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isInCart = template ? items.some((item) => item.templateId === template.id) : false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.getProduct(slug);
                if (response.success) {
                    setTemplate(response.data);

                    // Fetch related templates (same category, different template)
                    if (response.data.category?.id) {
                        try {
                            const relatedRes = await api.getProducts({
                                category: response.data.category.slug || response.data.category.id,
                            });
                            const filtered = (relatedRes.data || [])
                                .filter((t: Template) => t.id !== response.data.id)
                                .slice(0, 4);
                            setRelatedTemplates(filtered);
                        } catch (e) {
                            console.error('Failed to fetch related templates:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch template:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchData();
        }
    }, [slug]);

    const handleAddToCart = () => {
        if (!template) return;

        if (isInCart) {
            toast.error('القالب موجود في السلة بالفعل');
            return;
        }

        addItem({
            templateId: template.id,
            name: template.name_ar,
            price: template.discount_price || template.price,
            thumbnail: template.thumbnail_url || '',
            type: template.type,
        });
        toast.success('تمت الإضافة للسلة 🛒');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                            <div className="space-y-4">
                                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-32 bg-gray-200 rounded"></div>
                                <div className="h-12 bg-gray-200 rounded w-32"></div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😕</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">القالب غير موجود</h1>
                        <p className="text-gray-600 mb-6">ربما تم حذف هذا القالب أو نقله</p>
                        <Link href="/marketplace">
                            <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                العودة للمتجر
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const hasDiscount = template.discount_price && template.discount_price < template.price;
    const discountPercent = hasDiscount
        ? Math.round(((template.price - (template.discount_price || 0)) / template.price) * 100)
        : 0;

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">الرئيسية</Link>
                        <span>/</span>
                        <Link href="/marketplace" className="hover:text-primary-600 dark:hover:text-primary-400">المتجر</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-gray-100">{template.name_ar}</span>
                    </nav>

                    {/* Template Details */}
                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* Image */}
                        <div className="relative">
                            <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-3xl overflow-hidden">
                                {template.thumbnail_url ? (
                                    <Image
                                        src={template.thumbnail_url}
                                        alt={template.name_ar}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600">
                                        <span className="text-9xl">📚</span>
                                    </div>
                                )}

                                {/* Badges */}
                                {hasDiscount && (
                                    <span className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-bold rounded-xl">
                                        خصم {discountPercent}%
                                    </span>
                                )}
                                <span className={`absolute top-4 left-4 px-4 py-2 rounded-xl font-medium ${template.type === 'interactive'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-700 dark:bg-gray-900 text-white'
                                    }`}>
                                    {template.type === 'interactive' ? '🔄 تفاعلي' : '📥 قابل للتحميل'}
                                </span>
                            </div>

                            <div className="absolute bottom-4 left-4">
                                <TemplateWishlistButton templateId={template.id} size="lg" variant="button" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {template.name_ar}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400 text-xl">⭐</span>
                                        <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                            {Number(template.average_rating || 0).toFixed(1)}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({template.reviews_count || 0} تقييم)
                                        </span>
                                    </div>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {template.downloads_count || 0} عملية شراء
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-4">
                                <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                                    {formatPrice(template.discount_price || template.price)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-2xl text-gray-400 line-through">
                                        {formatPrice(template.price)}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <div className="prose prose-lg text-gray-600 dark:text-gray-300">
                                <p>{template.description_ar}</p>
                            </div>

                            {/* Tags */}
                            {template.tags && template.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {template.tags.map((tag: string, i: number) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Meta Info */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-3 dark:border dark:border-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">التصنيف</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{template.category?.name_ar || 'عام'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">المرحلة التعليمية</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">
                                        {template.educational_stage === 'kindergarten' ? 'رياض الأطفال' :
                                            template.educational_stage === 'primary' ? 'ابتدائي' :
                                                template.educational_stage === 'intermediate' ? 'متوسط' : 'عام'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">نوع القالب</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">
                                        {template.type === 'interactive' ? 'تفاعلي (يعمل أونلاين)' : 'ملف قابل للتحميل'}
                                    </span>
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isInCart}
                                    size="lg"
                                    className={`flex-1 py-4 text-lg font-semibold ${isInCart
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary-600 hover:bg-primary-700'
                                        } text-white`}
                                >
                                    {isInCart ? '✓ موجود في السلة' : '🛒 أضف للسلة'}
                                </Button>
                                <Link href="/cart" className={isInCart ? '' : 'hidden'}>
                                    <Button size="lg" variant="outline" className="py-4 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">
                                        عرض السلة
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-4">
                                <div className="flex items-center gap-2">
                                    <span>🔒</span>
                                    <span>دفع آمن</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>⚡</span>
                                    <span>وصول فوري</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>💬</span>
                                    <span>دعم سريع</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="border-t dark:border-gray-700 pt-12">
                        <TemplateReviews templateSlug={slug} templateId={template.id} />
                    </div>

                    {/* Related Templates Section */}
                    {relatedTemplates.length > 0 && (
                        <div className="border-t dark:border-gray-700 pt-12 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                قوالب مشابهة 🎯
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedTemplates.map((relatedTemplate: Template) => (
                                    <Link
                                        key={relatedTemplate.id}
                                        href={`/marketplace/${relatedTemplate.slug}`}
                                        className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                                            {relatedTemplate.thumbnail_url ? (
                                                <Image
                                                    src={relatedTemplate.thumbnail_url}
                                                    alt={relatedTemplate.name_ar}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {relatedTemplate.name_ar}
                                            </h3>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-primary-600 dark:text-primary-400 font-bold">
                                                    {formatPrice(relatedTemplate.discount_price || relatedTemplate.price)}
                                                </span>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="text-yellow-400">⭐</span>
                                                    <span>{Number(relatedTemplate.average_rating || 0).toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

