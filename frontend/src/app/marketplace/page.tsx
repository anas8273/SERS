'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { TemplateCardSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import TemplateCard from '@/components/templates/TemplateCard';
import { useCartStore } from '@/stores/cartStore';
import {
    Search,
    Filter,
    X,
    Layout,
    SlidersHorizontal,
    ChevronDown,
    Sparkles,
    Zap,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template, Category } from '@/types';



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

    // Accordion states for collapsible filters
    const [expandedFilters, setExpandedFilters] = useState({
        categories: true,
        type: true,
        price: false
    });

    const toggleFilter = (filter: keyof typeof expandedFilters) => {
        setExpandedFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
    };

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
                        {/* Sidebar Filters - Desktop - Glassmorphism Design */}
                        <aside className="hidden lg:block w-72 flex-shrink-0">
                            <div className="sticky top-24 space-y-4">
                                {/* Filter Header - Glass Panel */}
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-gray-700/50 shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-primary" />
                                            فلترة ذكية
                                        </h2>
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            مسح الكل
                                        </button>
                                    </div>

                                    {/* Search Box - Glassmorphism */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="ابحث عن قالب..."
                                            className="w-full px-4 py-3 pr-11 rounded-xl border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 transition-all text-sm placeholder:text-gray-400"
                                        />
                                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* Categories Accordion */}
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleFilter('categories')}
                                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors"
                                    >
                                        <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Layout className="w-4 h-4 text-primary" />
                                            التصنيف
                                        </span>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-gray-400 transition-transform duration-300",
                                            expandedFilters.categories && "rotate-180"
                                        )} />
                                    </button>
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-300",
                                        expandedFilters.categories ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="px-3 pb-4 space-y-1 max-h-52 overflow-y-auto">
                                            <button
                                                onClick={() => setSelectedCategory(null)}
                                                className={cn(
                                                    "w-full text-right px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                    !selectedCategory
                                                        ? "bg-primary text-white shadow-md"
                                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                                                )}
                                            >
                                                جميع التصنيفات
                                            </button>
                                            {categories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => setSelectedCategory(category.slug)}
                                                    className={cn(
                                                        "w-full text-right px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                        selectedCategory === category.slug
                                                            ? "bg-primary text-white shadow-md"
                                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                                                    )}
                                                >
                                                    {category.name_ar}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Type Accordion */}
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleFilter('type')}
                                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors"
                                    >
                                        <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                                            نوع القالب
                                        </span>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-gray-400 transition-transform duration-300",
                                            expandedFilters.type && "rotate-180"
                                        )} />
                                    </button>
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-300",
                                        expandedFilters.type ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="px-3 pb-4 space-y-1">
                                            <button
                                                onClick={() => setSelectedType(null)}
                                                className={cn(
                                                    "w-full text-right px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                    !selectedType
                                                        ? "bg-primary text-white shadow-md"
                                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                                                )}
                                            >
                                                جميع الأنواع
                                            </button>
                                            <button
                                                onClick={() => setSelectedType('interactive')}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                    selectedType === 'interactive'
                                                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                                                )}
                                            >
                                                <span>تفاعلي</span>
                                                <Zap className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedType('ready')}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                                    selectedType === 'ready'
                                                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                                                )}
                                            >
                                                <span>جاهز للتحميل</span>
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters Badge */}
                                {(selectedCategory || selectedType || searchQuery) && (
                                    <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/20">
                                        <p className="text-xs text-primary font-bold mb-2">الفلاتر النشطة:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {searchQuery && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                    بحث: {searchQuery.slice(0, 10)}...
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                                                </span>
                                            )}
                                            {selectedCategory && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                    {categories.find(c => c.slug === selectedCategory)?.name_ar}
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                                                </span>
                                            )}
                                            {selectedType && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                    {selectedType === 'interactive' ? 'تفاعلي' : 'جاهز'}
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType(null)} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                        <TemplateCard key={template.id} template={template} variant="marketplace" />
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
