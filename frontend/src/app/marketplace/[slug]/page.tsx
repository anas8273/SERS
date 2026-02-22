'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { TemplateWishlistButton } from '@/components/templates/TemplateWishlistButton';
import { TemplateReviews } from '@/components/templates/TemplateReviews';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type { Template } from '@/types';
import {
    Download,
    Edit3,
    Sparkles,
    FileText,
    Zap,
    CheckCircle,
    ShoppingCart,
    ArrowLeft,
    Star,
    Users,
    Clock,
    Shield,
    MessageSquare,
    Loader2,
    FileDown,
} from 'lucide-react';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

type TemplateMode = 'ready' | 'interactive';

export default function TemplateDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { addItem, items } = useCartStore();
    const { user, isAuthenticated } = useAuth();

    const [template, setTemplate] = useState<Template | null>(null);
    const [relatedTemplates, setRelatedTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMode, setSelectedMode] = useState<TemplateMode>('interactive');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const isInCart = template ? items.some((item) => item.templateId === template.id) : false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.getTemplate(slug);
                if (response.success) {
                    setTemplate(response.data);

                    // Fetch related templates (same category, different template)
                    if (response.data.category?.id) {
                        try {
                            const relatedRes = await api.getTemplates({
                                category: response.data.category.slug || response.data.category.id,
                            });
                            const templatesData = relatedRes.data?.data || relatedRes.data || [];
                            const filtered = (Array.isArray(templatesData) ? templatesData : [])
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
            type: selectedMode === 'interactive' ? 'interactive' : 'ready',
        });
        toast.success('تمت الإضافة للسلة 🛒');
    };

    const handleProceed = async () => {
        if (!template) return;

        if (!isAuthenticated) {
            toast.error('يجب تسجيل الدخول أولاً');
            router.push('/login');
            return;
        }

        setIsProcessing(true);

        try {
            if (selectedMode === 'ready') {
                // الوضع الجاهز: إضافة للسلة ثم الانتقال للدفع
                if (!isInCart) {
                    addItem({
                        templateId: template.id,
                        name: template.name_ar,
                        price: template.discount_price || template.price,
                        thumbnail: template.thumbnail_url || '',
                        type: 'ready',
                    });
                }
                toast.success('تم إضافة القالب الجاهز للسلة');
                router.push('/checkout');
            } else {
                // الوضع التفاعلي: الانتقال لصفحة المحرر
                if (template.is_free) {
                    // إذا كان مجاني، انتقل مباشرة للمحرر
                    router.push(`/editor/${template.slug}`);
                } else {
                    // إذا كان مدفوع، تحقق من الشراء أو أضف للسلة
                    if (!isInCart) {
                        addItem({
                            templateId: template.id,
                            name: template.name_ar,
                            price: template.discount_price || template.price,
                            thumbnail: template.thumbnail_url || '',
                            type: 'interactive',
                        });
                    }
                    toast.success('تم إضافة القالب التفاعلي للسلة');
                    router.push('/checkout');
                }
            }
        } catch (error) {
            toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportPDF = async () => {
        if (!template) return;

        setIsExporting(true);
        try {
            const response = await api.post(`/export/pdf`, {
                template_id: template.id,
                format: 'pdf'
            });

            if (response.success && response.download_url) {
                window.open(response.download_url, '_blank');
                toast.success('تم تصدير القالب بنجاح! 📄');
            } else {
                toast.error('فشل في تصدير القالب');
            }
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('حدث خطأ أثناء التصدير');
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
                <Navbar />
                <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                            <div className="space-y-4">
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
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
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😕</div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">القالب غير موجود</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">ربما تم حذف هذا القالب أو نقله</p>
                        <Link href="/marketplace">
                            <Button className="bg-primary hover:bg-primary/90 text-white">
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
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir="rtl">
            <Navbar />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                        <span>/</span>
                        <Link href="/marketplace" className="hover:text-primary transition-colors">سوق القوالب</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-gray-100">{template.name_ar}</span>
                    </nav>

                    {/* Template Details */}
                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* Image */}
                        <div className="relative">
                            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl">
                                {template.thumbnail_url ? (
                                    <Image
                                        src={template.thumbnail_url}
                                        alt={template.name_ar}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                                        <FileText className="w-24 h-24 text-primary/40" />
                                    </div>
                                )}

                                {/* Badges */}
                                {hasDiscount && (
                                    <span className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-bold rounded-xl shadow-lg">
                                        خصم {discountPercent}%
                                    </span>
                                )}
                                {template.is_free && (
                                    <span className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white font-bold rounded-xl shadow-lg">
                                        مجاني
                                    </span>
                                )}
                                <span className={`absolute ${hasDiscount ? 'top-16' : 'top-4'} ${template.is_free ? 'left-20' : 'left-4'} px-4 py-2 rounded-xl font-medium ${template.type === 'interactive'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-700 dark:bg-gray-600 text-white'
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
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                                    {template.name_ar}
                                </h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                            {Number(template.average_rating || 0).toFixed(1)}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({template.reviews_count || 0} تقييم)
                                        </span>
                                    </div>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                        <Users className="w-4 h-4" />
                                        {template.downloads_count || 0} مستخدم
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-4">
                                <span className="text-4xl font-bold text-primary">
                                    {template.is_free ? 'مجاني' : formatPrice(template.discount_price || template.price)}
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

                            {/* ========== اختيار نوع القالب ========== */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    اختر طريقة الاستخدام
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* خيار التفاعلي */}
                                    <button
                                        onClick={() => setSelectedMode('interactive')}
                                        className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-right ${selectedMode === 'interactive'
                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                            }`}
                                    >
                                        {selectedMode === 'interactive' && (
                                            <div className="absolute top-3 left-3">
                                                <CheckCircle className="w-6 h-6 text-primary fill-primary/20" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className={`p-3 rounded-xl ${selectedMode === 'interactive'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}>
                                                <Edit3 className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                                    تفاعلي
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                    عبّئ البيانات بنفسك مع مساعدة الذكاء الاصطناعي
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                                                        <Zap className="w-3 h-3" />
                                                        اقتراحات ذكية
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                                                        <Edit3 className="w-3 h-3" />
                                                        تخصيص كامل
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* خيار الجاهز */}
                                    <button
                                        onClick={() => setSelectedMode('ready')}
                                        className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-right ${selectedMode === 'ready'
                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                            }`}
                                    >
                                        {selectedMode === 'ready' && (
                                            <div className="absolute top-3 left-3">
                                                <CheckCircle className="w-6 h-6 text-primary fill-primary/20" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className={`p-3 rounded-xl ${selectedMode === 'ready'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}>
                                                <Download className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                                    جاهز للتحميل
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                    حمّل القالب كملف PDF جاهز للطباعة
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                                                        <FileText className="w-3 h-3" />
                                                        PDF جاهز
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
                                                        <Clock className="w-3 h-3" />
                                                        فوري
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* زر المتابعة */}
                            <div className="space-y-4">
                                <Button
                                    onClick={handleProceed}
                                    disabled={isProcessing}
                                    size="lg"
                                    className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                            جاري المعالجة...
                                        </>
                                    ) : selectedMode === 'interactive' ? (
                                        <>
                                            <Edit3 className="w-5 h-5 ml-2" />
                                            {template.is_free ? 'ابدأ التعديل الآن' : 'اشترِ وابدأ التعديل'}
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5 ml-2" />
                                            {template.is_free ? 'حمّل الآن مجاناً' : 'اشترِ وحمّل'}
                                        </>
                                    )}
                                </Button>

                                {/* أزرار إضافية */}
                                <div className="flex gap-3">
                                    {/* أضف للسلة */}
                                    {!template.is_free && (
                                        <Button
                                            onClick={handleAddToCart}
                                            disabled={isInCart}
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 py-4"
                                        >
                                            {isInCart ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 ml-2" />
                                                    موجود في السلة
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-5 h-5 ml-2" />
                                                    أضف للسلة
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {/* زر تصدير PDF */}
                                    <Button
                                        onClick={handleExportPDF}
                                        disabled={isExporting}
                                        variant="outline"
                                        size="lg"
                                        className="py-4"
                                    >
                                        {isExporting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <FileDown className="w-5 h-5 ml-2" />
                                                تصدير PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-3 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">التصنيف</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{template.category?.name_ar || 'عام'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">المرحلة التعليمية</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">
                                        {template.educational_stage === 'kindergarten' ? 'رياض الأطفال' :
                                            template.educational_stage === 'primary' ? 'ابتدائي' :
                                                template.educational_stage === 'intermediate' ? 'متوسط' : 'عام'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">نوع القالب</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">
                                        {template.type === 'interactive' ? 'تفاعلي (يعمل أونلاين)' : 'ملف قابل للتحميل'}
                                    </span>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-green-500" />
                                    <span>دفع آمن</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    <span>وصول فوري</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
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
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-primary" />
                                قوالب مشابهة
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedTemplates.map((relatedTemplate: Template) => (
                                    <Link
                                        key={relatedTemplate.id}
                                        href={`/marketplace/${relatedTemplate.slug}`}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300"
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
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-12 h-12 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                                                {relatedTemplate.name_ar}
                                            </h3>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-primary font-bold">
                                                    {relatedTemplate.is_free ? 'مجاني' : formatPrice(relatedTemplate.discount_price || relatedTemplate.price)}
                                                </span>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
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
