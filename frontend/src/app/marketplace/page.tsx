'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { TemplateCardSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { WishlistButton } from '@/components/products/WishlistButton';
import { useCartStore } from '@/stores/cartStore';
import {
    Search,
    Filter,
    X,
    ShoppingCart,
    Star,
    ArrowLeft,
    Zap,
    Download,
    Layout,
    SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { Template, Category } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function MarketplaceContent() {
    const searchParams = useSearchParams();
    const { addItem } = useCartStore();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        searchParams.get('category')
    );
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [templatesRes, categoriesRes] = await Promise.all([
                    api.getTemplates({
                        category: selectedCategory || undefined,
                        type: selectedType || undefined,
                        search: searchQuery || undefined,
                    }).catch(() => ({ data: { data: [] } })),
                    api.getCategories().catch(() => ({ data: [] })),
                ]);

                // Templates API returns paginated response: { data: { data: [...], ... } }
                // Extract the inner data array from pagination
                const templatesData = templatesRes.data?.data || templatesRes.data || [];
                let filteredTemplates = Array.isArray(templatesData) ? templatesData : [];

                // Client-side price filter
                filteredTemplates = filteredTemplates.filter((t: Template) => {
                    const price = t.discount_price || t.price;
                    return price >= priceRange[0] && price <= priceRange[1];
                });

                setTemplates(filteredTemplates);

                // Categories API returns simple array
                const categoriesData = categoriesRes.data || [];
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            } catch (error) {
                console.error('Failed to fetch templates:', error);
                setTemplates([]);
                setCategories([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, selectedType, searchQuery, priceRange]);

    const handleAddToCart = (template: Template) => {
        addItem({
            templateId: template.id,
            name: template.name_ar,
            price: template.discount_price || template.price,
            thumbnail: template.thumbnail_url || '',
            type: template.type,
        });
        toast.success('تمت الإضافة للسلة بنجاح 🛒');
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedType(null);
        setPriceRange([0, 1000]);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-500" dir="rtl">
            <Navbar />

            <main className="flex-1">
                {/* Header Section */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl">
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">سوق القوالب التعليمية</h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400">
                                تصفح مئات القوالب المصممة باحترافية لتناسب احتياجاتك التعليمية.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Filters - Desktop */}
                        <aside className="hidden lg:block w-72 flex-shrink-0 space-y-8">
                            <div className="sticky top-24 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <SlidersHorizontal className="w-5 h-5" />
                                        الفلاتر
                                    </h2>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm font-bold text-primary hover:underline"
                                    >
                                        مسح الكل
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">البحث</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="ابحث عن قالب..."
                                            className="w-full px-4 py-3 pr-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">التصنيف</label>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className={cn(
                                                "text-right px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                !selectedCategory
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            الكل
                                        </button>
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.slug)}
                                                className={cn(
                                                    "text-right px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                    selectedCategory === category.slug
                                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                )}
                                            >
                                                {category.name_ar}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">نوع القالب</label>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => setSelectedType(null)}
                                            className={cn(
                                                "text-right px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                !selectedType
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            الكل
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('interactive')}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                selectedType === 'interactive'
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <span>تفاعلي</span>
                                            <Zap className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('downloadable')}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                selectedType === 'downloadable'
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <span>قابل للتحميل</span>
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1 space-y-8">
                            {/* Mobile Filter Toggle */}
                            <div className="lg:hidden flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold gap-2"
                                    onClick={() => setIsMobileFilterOpen(true)}
                                >
                                    <Filter className="w-4 h-4" />
                                    الفلاتر والبحث
                                </Button>
                                <div className="text-sm font-bold text-gray-500">
                                    {templates.length} قالب متاح
                                </div>
                            </div>

                            {/* Templates Grid */}
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {[1, 2, 3, 4, 5, 6].map((i) => <TemplateCardSkeleton key={i} />)}
                                </div>
                            ) : templates.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full"
                                        >
                                            <Link href={`/marketplace/${template.slug}`} className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                {template.thumbnail_url ? (
                                                    <Image
                                                        src={template.thumbnail_url}
                                                        alt={template.name_ar}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Layout className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 z-10">
                                                    <WishlistButton templateId={template.id} />
                                                </div>
                                                {template.is_free && (
                                                    <div className="absolute top-4 left-4">
                                                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                                                            مجاني
                                                        </div>
                                                    </div>
                                                )}
                                            </Link>

                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                                                            {template.category?.name_ar || 'عام'}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-amber-500">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <span className="text-xs font-black">{template.average_rating || '5.0'}</span>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                                        {template.name_ar}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                        {template.description_ar}
                                                    </p>
                                                </div>

                                                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        {template.discount_price ? (
                                                            <>
                                                                <span className="text-xs text-gray-400 line-through">{formatPrice(template.price)}</span>
                                                                <span className="text-lg font-black text-primary">{formatPrice(template.discount_price)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-black text-gray-900 dark:text-white">
                                                                {template.is_free ? 'مجاني' : formatPrice(template.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        onClick={() => handleAddToCart(template)}
                                                        size="sm"
                                                        className="rounded-full font-black gap-2 shadow-lg shadow-primary/20"
                                                    >
                                                        <ShoppingCart className="w-4 h-4" />
                                                        إضافة
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="لا توجد قوالب"
                                    description="لم نجد أي قوالب تطابق معايير البحث الخاصة بك."
                                    action={
                                        <Button onClick={clearFilters} variant="outline" className="rounded-full px-8 font-bold">
                                            مسح الفلاتر
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function MarketplacePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <MarketplaceContent />
        </Suspense>
    );
}
