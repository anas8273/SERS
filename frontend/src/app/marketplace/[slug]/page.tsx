'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { TemplateWishlistButton } from '@/components/templates/TemplateWishlistButton';
import { TemplateReviews } from '@/components/templates/TemplateReviews';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendations } from '@/hooks/useRecommendations';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Template } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import {
    Download,
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
    ExternalLink,
    Share2,
    Copy,
    X as XIcon,
} from 'lucide-react';




export default function TemplateDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { addItem, items } = useCartStore();
    const { user, isAuthenticated } = useAuth();
    const { trackView } = useRecommendations();
    const { t, dir, localizedField } = useTranslation();

    const [template, setTemplate] = useState<Template | null>(null);
    const [relatedTemplates, setRelatedTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [justAdded, setJustAdded] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const isInCart = template ? items.some((item) => item.templateId === template.id) : false;
    const isFree = template ? (template.is_free || Number(template.price) <= 0) : false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.getTemplate(slug);
                if (response.success) {
                    setTemplate(response.data);

                    // Track this view for recommendations
                    trackView(
                        response.data.id,
                        response.data.section?.id,
                        response.data.category_id
                    );

                    // Fetch related templates (same section)
                    if (response.data.section?.id) {
                        try {
                            const relatedRes = await api.getTemplates({
                                section_id: response.data.section.id,
                            });
                            const templatesData = relatedRes.data?.data || relatedRes.data || [];
                            const filtered = (Array.isArray(templatesData) ? templatesData : [])
                                .filter((t: Template) => t.id !== response.data.id)
                                .slice(0, 4);
                            setRelatedTemplates(filtered);
                        } catch {
                            // Silent — related templates are non-critical
                        }
                    }
                }
            } catch {
                // Template fetch failed — will show empty state
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
        if (isAdding || isInCart) return;
        setIsAdding(true);

        const status = addItem({
            templateId: template.id,
            name: localizedField(template, 'name'),
            price: template.discount_price || template.price,
            thumbnail: template.thumbnail_url || '',
            type: 'ready',
        });

        if (status === 'already_in_cart') {
            toast(dir === 'rtl' ? ta('القالب موجود في السلة بالفعل', 'Template already in cart') : 'Already in cart', { icon: '✅' });
            setTimeout(() => setIsAdding(false), 600);
            return;
        }

        setJustAdded(true);
        toast.success(
            (tst) => (
                <div className="flex items-center gap-3">
                    <span>✅ {t('template.addToCart')}</span>
                    <button
                        onClick={() => { toast.dismiss(tst.id); router.push('/cart'); }}
                        className="font-bold text-primary underline underline-offset-2"
                    >
                        {t('cart.title')}
                    </button>
                </div>
            ),
            { duration: 4000 }
        );

        setTimeout(() => setJustAdded(false), 3000);
        setTimeout(() => setIsAdding(false), 600);
    };

    const handleBuyNow = () => {
        if (!template) return;
        if (!isInCart) {
            addItem({
                templateId: template.id,
                name: localizedField(template, 'name'),
                price: template.discount_price || template.price,
                thumbnail: template.thumbnail_url || '',
                type: 'ready',
            });
        }
        // [FIX-2] Auth check — redirect to login if not authenticated
        if (!isAuthenticated) {
            router.push('/login?returnUrl=/checkout');
            return;
        }
        router.push('/checkout');
    };

    const handleShare = (platform: string) => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const text = `${localizedField(template, 'name')} — SERS`;
        switch (platform) {
            case 'copy':
                navigator.clipboard.writeText(url).then(() => toast.success(dir === 'rtl' ? ta('تم نسخ الرابط!', 'Link copied!') : 'Link copied!'));
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
        }
        setShareOpen(false);
    };

    // ── Free template direct download ──
    const handleFreeDownload = async () => {
        if (!template) return;
        if (!isAuthenticated) {
            toast.error(dir === 'rtl' ? ta('يجب تسجيل الدخول لتحميل هذا القالب', 'You must log in to download this template') : 'Please sign in to download');
            router.push(`/login?returnUrl=/marketplace/${template.slug}`);
            return;
        }
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/templates/${template.slug}/download`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || (dir === 'rtl' ? ta('فشل التحميل', 'Download failed') : 'Download failed'));
            }
            const cd = response.headers.get('Content-Disposition') || '';
            const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            const fileName = match ? match[1].replace(/['"]/g, '') : `${template.slug}.pdf`;
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = fileName;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); a.remove();
            toast.success(dir === 'rtl' ? ta('تم تحميل القالب بنجاح ✅', 'Template downloaded successfully ✅') : 'Template downloaded successfully ✅');
        } catch (err: any) {
            toast.error(err.message || (dir === 'rtl' ? ta('حدث خطأ في التحميل', 'Download error occurred') : 'Download error'));
        } finally {
            setIsDownloading(false);
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
                    <EmptyState
                        icon={<span className="text-6xl drop-shadow-lg">😕</span>}
                        title={dir === 'rtl' ? ta('القالب غير موجود', 'Template not found') : 'Template Not Found'}
                        description={dir === 'rtl' ? ta('ربما تم حذف هذا القالب أو نقله', 'This template may have been deleted or moved') : 'This template may have been removed or moved'}
                        action={
                            <Link href="/marketplace">
                                <Button className="bg-primary hover:bg-primary/90 text-white">
                                    {t('nav.marketplace')}
                                </Button>
                            </Link>
                        }
                    />
                </main>
                <Footer />
            </div>
        );
    }

    const hasDiscount = template.discount_price && template.discount_price < template.price;
    const discountPercent = hasDiscount
        ? Math.round(((template.price - (template.discount_price || 0)) / template.price) * 100)
        : 0;

    // ── Smart format detection from template data ──
    const FORMAT_INFO: Record<string, { label: string; emoji: string; color: string }> = {
        'pdf': { label: 'PDF', emoji: '📕', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        'word': { label: 'Word', emoji: '📘', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        'powerpoint': { label: 'PowerPoint', emoji: '📙', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
        'excel': { label: 'Excel', emoji: '📗', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        'archive': { label: 'ZIP', emoji: '📦', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
        'digital': { label: ta('رقمي', 'Digital'), emoji: '💻', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    };
    const fmt = FORMAT_INFO[template.format || ''] || FORMAT_INFO['pdf'];
    const fileExt = template.file_type?.toUpperCase() || null;

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />

            <main className="flex-1 pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
                        <span>/</span>
                        <Link href="/marketplace" className="hover:text-primary transition-colors">{t('nav.marketplace')}</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-gray-100">{localizedField(template, 'name')}</span>
                    </nav>

                    {/* Template Details */}
                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* Image */}
                        <div className="relative">
                            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl">
                                {template.thumbnail_url && (
                                    <SafeImage
                                        src={template.thumbnail_url}
                                        alt={localizedField(template, 'name')}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover"
                                    />
                                )}
                                {!template.thumbnail_url && (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                                        <FileText className="w-24 h-24 text-primary/40" />
                                    </div>
                                )}

                                {/* Badges */}
                                {hasDiscount && (
                                    <span className="absolute top-4 end-4 px-4 py-2 bg-red-500 text-white font-bold rounded-xl shadow-lg">
                                        {dir === 'rtl' ? ta('خصم', 'Discount') : 'OFF'} {discountPercent}%
                                    </span>
                                )}
                                <span className={`absolute ${hasDiscount ? 'top-16' : 'top-4'} start-4 px-4 py-2 rounded-xl font-bold text-white shadow-lg ${
                                    template.format === 'word' ? 'bg-blue-600' :
                                    template.format === 'powerpoint' ? 'bg-orange-600' :
                                    template.format === 'excel' ? 'bg-green-600' :
                                    'bg-red-600'
                                }`}>
                                    {fmt.emoji} {fmt.label}
                                </span>
                            </div>

                            <div className="absolute bottom-4 start-4 flex items-center gap-2">
                                <TemplateWishlistButton templateId={template.id} size="lg" variant="button" />
                                {/* Share Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShareOpen(!shareOpen)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-200 font-bold text-sm border border-gray-200/50 dark:border-gray-600/50"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        {t('template.share')}
                                    </button>
                                    {shareOpen && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
                                            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-40 w-52 overflow-hidden" style={{ animation: 'fadeInScale 0.2s ease-out forwards' }}>
                                                <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{dir === 'rtl' ? ta('مشاركة عبر', 'Share via') : 'Share via'}</p>
                                                {[
                                                    { key: 'copy', icon: <Copy className="w-4 h-4" />, label: dir === 'rtl' ? ta('نسخ الرابط', 'Copy Link') : 'Copy Link', color: 'text-gray-600 dark:text-gray-300' },
                                                    { key: 'whatsapp', icon: <span className="text-base">💬</span>, label: dir === 'rtl' ? ta('واتساب', 'WhatsApp') : 'WhatsApp', color: 'text-green-600' },
                                                    { key: 'twitter', icon: <span className="text-base">𝕏</span>, label: dir === 'rtl' ? ta('تويتر / X', 'Twitter / X') : 'Twitter / X', color: 'text-gray-900 dark:text-white' },
                                                    { key: 'telegram', icon: <span className="text-base">✈️</span>, label: dir === 'rtl' ? ta('تيليجرام', 'Telegram') : 'Telegram', color: 'text-blue-500' },
                                                ].map(item => (
                                                    <button
                                                        key={item.key}
                                                        onClick={() => handleShare(item.key)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${item.color}`}
                                                    >
                                                        {item.icon}
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                                    {localizedField(template, 'name')}
                                </h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                            {Number(template.average_rating || 0).toFixed(1)}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({template.reviews_count || 0} {t('market.rating')})
                                        </span>
                                    </div>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                        <Users className="w-4 h-4" />
                                        {template.downloads_count || 0} {dir === 'rtl' ? ta('مستخدم', 'User') : 'users'}
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-4">
                                {isFree ? (
                                    <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {dir === 'rtl' ? ta('🎁 مجاني', '🎁 Free') : '🎁 Free'}
                                    </span>
                                ) : (
                                    <>
                                        <span className="text-4xl font-bold text-primary">
                                            {formatPrice(template.discount_price || template.price)}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-2xl text-gray-400 line-through">
                                                {formatPrice(template.price)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div className="prose prose-lg text-gray-600 dark:text-gray-300">
                                <p>{localizedField(template, 'description')}</p>
                            </div>

                            {/* ========== طريقة الاستخدام ========== */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                                <div className="relative p-5 rounded-xl border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10 text-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-3 rounded-xl bg-primary text-white">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                                {ta('جاهز للتحميل والاستخدام', 'Ready to Download & Use')}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {ta(`اشترِ القالب وحمّله فوراً كملف ${fmt.label} جاهز للاستخدام`, `Purchase and instantly download as a ${fmt.label} file ready to use`)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ========== CTA section ========== */}
                            <div className="space-y-4">
                                {isInCart ? (
                                    /* Already in cart: show confirmation */
                                    <div className="space-y-3">
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-bold text-green-800 dark:text-green-300">{dir === 'rtl' ? ta('تمت إضافة هذا القالب للسلة', 'This template has been added to cart') : 'Template added to cart'}</p>
                                                <p className="text-sm text-green-600 dark:text-green-400">{dir === 'rtl' ? ta('يمكنك متابعة التسوق أو إتمام الطلب', 'You can continue shopping or complete the order') : 'Continue shopping or complete order'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => router.push('/cart')}
                                                size="lg"
                                                className="flex-1 py-5 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 gap-2"
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                                {t('cart.title')}
                                            </Button>
                                            <Button
                                                onClick={() => router.push('/marketplace')}
                                                size="lg"
                                                variant="outline"
                                                className="flex-1 py-5 gap-2"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                {dir === 'rtl' ? ta('متابعة التسوق', 'Continue Shopping') : 'Continue Shopping'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {isFree ? (
                                            /* FREE TEMPLATE: Direct download button */
                                            <>
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                                        {dir === 'rtl' ? ta('🎁 هذا القالب مجاني — حمّله مباشرة!', '🎁 This template is free — download it directly!') : '🎁 This template is free — download directly!'}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleFreeDownload}
                                                    disabled={isDownloading}
                                                    size="lg"
                                                    className="w-full py-6 text-base font-black bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-xl shadow-emerald-600/20 gap-2 rounded-xl"
                                                >
                                                    {isDownloading
                                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> {dir === 'rtl' ? ta('جاري التحميل...', 'Loading...') : 'Downloading...'}</>
                                                        : <><Download className="w-5 h-5" /> {dir === 'rtl' ? ta('تحميل مجاني', 'Free Download') : 'Free Download'}</>
                                                    }
                                                </Button>
                                            </>
                                        ) : (
                                            /* PAID TEMPLATE: Buy Now + Add to Cart */
                                            <>
                                                <Button
                                                    onClick={handleBuyNow}
                                                    size="lg"
                                                    className="w-full py-6 text-base font-black bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-xl shadow-emerald-600/20 gap-2 rounded-xl"
                                                >
                                                    <Zap className="w-5 h-5" />
                                                    {t('template.buyNow')}
                                                </Button>
                                                <Button
                                                    onClick={handleAddToCart}
                                                    size="lg"
                                                    variant="outline"
                                                    disabled={isAdding}
                                                    className="w-full py-5 text-base font-bold border-2 border-primary text-primary hover:bg-primary/5 gap-2 rounded-xl"
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                    {isAdding ? t('common.loading') : t('template.addToCart')}
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                )}
                            </div>

                            {/* Meta Info — بيانات فعلية من القالب */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-3 border border-gray-100 dark:border-gray-700">
                                {/* القسم */}
                                {template.section && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">📁 {t('market.section')}</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">{localizedField(template.section, 'name')}</span>
                                    </div>
                                )}
                                {/* صيغة الملف */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">📄 {ta('صيغة الملف', 'File Format')}</span>
                                    <span className={`font-bold px-3 py-1 rounded-lg text-xs ${fmt.color}`}>
                                        {fmt.emoji} {fmt.label}{fileExt ? ` (.${fileExt})` : ''}
                                    </span>
                                </div>
                                {/* عدد التحميلات */}
                                {(template.downloads_count || 0) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">📥 {ta('التحميلات', 'Downloads')}</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">{template.downloads_count}</span>
                                    </div>
                                )}
                                {/* التقييم */}
                                {(template.average_rating || 0) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">⭐ {ta('التقييم', 'Rating')}</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">{Number(template.average_rating).toFixed(1)} / 5</span>
                                    </div>
                                )}
                                {/* تاریخ الإضافة */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">📅 {ta('تاريخ الإضافة', 'Date Added')}</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">
                                        {new Date(template.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* External Link — الرابط الإلكتروني */}
                            {template.external_link && (
                                <a
                                    href={template.external_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl hover:shadow-lg transition-all duration-200 group"
                                >
                                    <div className="p-2.5 rounded-xl bg-blue-500 text-white group-hover:scale-110 transition-transform">
                                        <ExternalLink className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                                            {ta('🔗 فتح الرابط الإلكتروني', '🔗 Open External Link')}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                            {template.external_link}
                                        </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                                </a>
                            )}

                            {/* Trust Badges */}
                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-green-500" />
                                    <span>{dir === 'rtl' ? ta('دفع آمن', 'Secure Payment') : 'Secure Payment'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    <span>{dir === 'rtl' ? ta('وصول فوري', 'Instant Access') : 'Instant Access'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    <span>{dir === 'rtl' ? ta('دعم سريع', 'Fast Support') : 'Quick Support'}</span>
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
                                {t('market.relatedTemplates')}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedTemplates.map((relatedTemplate: Template) => (
                                    <Link
                                        key={relatedTemplate.id}
                                        href={`/marketplace/${relatedTemplate.slug}`}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                                            <SafeImage
                                                src={relatedTemplate.thumbnail_url}
                                                alt={localizedField(relatedTemplate, 'name')}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                fallback={
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FileText className="w-10 h-10 text-gray-300" />
                                                    </div>
                                                }
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                                                {localizedField(relatedTemplate, 'name')}
                                            </h3>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-primary font-bold">
                                                    {formatPrice(relatedTemplate.discount_price || relatedTemplate.price)}
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
