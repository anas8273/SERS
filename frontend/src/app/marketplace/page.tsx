'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { WishlistButton } from '@/components/products/WishlistButton';
import { useCartStore } from '@/stores/cartStore';
import toast from 'react-hot-toast';
import type { Product, Category } from '@/types';

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

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        searchParams.get('category')
    );
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.getProducts({
                        category: selectedCategory || undefined,
                        type: selectedType || undefined,
                        search: searchQuery || undefined,
                    }).catch(() => ({ data: [] })),
                    api.getCategories().catch(() => ({ data: [] })),
                ]);

                let filteredProducts = productsRes.data || [];

                // Client-side price filter
                filteredProducts = filteredProducts.filter((p: Product) => {
                    const price = p.discount_price || p.price;
                    return price >= priceRange[0] && price <= priceRange[1];
                });

                setProducts(filteredProducts);
                setCategories(categoriesRes.data || []);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, selectedType, searchQuery, priceRange]);

    const handleAddToCart = (product: Product) => {
        addItem({
            productId: product.id,
            name: product.name_ar,
            price: product.discount_price || product.price,
            thumbnail: product.thumbnail_url || '',
            type: product.type,
        });
        toast.success('تمت الإضافة للسلة 🛒');
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedType(null);
        setPriceRange([0, 500]);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">المتجر 🛍️</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            اكتشف مجموعتنا الواسعة من القوالب التعليمية
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                        {/* Sidebar Filters */}
                        <aside className="hidden lg:block">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-4 transition-colors duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">الفلاتر</h2>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        مسح الكل
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        البحث
                                    </label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="ابحث عن منتج..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>

                                {/* Categories */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        التصنيف
                                    </label>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${!selectedCategory
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            الكل
                                        </button>
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.slug)}
                                                className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${selectedCategory === category.slug
                                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {category.name_ar}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        نوع المنتج
                                    </label>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedType(null)}
                                            className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${!selectedType
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            الكل
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('interactive')}
                                            className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${selectedType === 'interactive'
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            🔄 تفاعلي
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('downloadable')}
                                            className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${selectedType === 'downloadable'
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            📥 قابل للتحميل
                                        </button>
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        نطاق السعر
                                    </label>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <span>{formatPrice(priceRange[0])}</span>
                                        <span>-</span>
                                        <span>{formatPrice(priceRange[1])}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="500"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                        className="w-full accent-primary-600 dark:accent-primary-500"
                                    />
                                </div>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div className="lg:col-span-3">
                            {/* Mobile Filters Toggle */}
                            <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm ${!selectedCategory
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700'
                                        }`}
                                >
                                    الكل
                                </button>
                                {categories.slice(0, 4).map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.slug)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm ${selectedCategory === category.slug
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700'
                                            }`}
                                    >
                                        {category.name_ar}
                                    </button>
                                ))}
                            </div>

                            {/* Results Count */}
                            <div className="mb-6 flex items-center justify-between">
                                <p className="text-gray-600 dark:text-gray-400">
                                    {isLoading ? 'جاري البحث...' : `${products.length} منتج`}
                                </p>
                            </div>

                            {/* Products */}
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <ProductCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <EmptyState
                                    icon={<span className="text-6xl">🔍</span>}
                                    title="لا توجد منتجات"
                                    description="جرب تغيير الفلاتر أو البحث بكلمات أخرى"
                                    action={
                                        <Button onClick={clearFilters} className="bg-primary-600 hover:bg-primary-700 text-white">
                                            مسح الفلاتر
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {products.map((product) => {
                                        const hasDiscount = product.discount_price && product.discount_price < product.price;

                                        return (
                                            <div
                                                key={product.id}
                                                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                                            >
                                                {/* Product Image */}
                                                <Link href={`/marketplace/${product.slug}`}>
                                                    <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                                                        {product.thumbnail_url ? (
                                                            <Image
                                                                src={product.thumbnail_url}
                                                                alt={product.name_ar}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600">
                                                                <span className="text-5xl">📚</span>
                                                            </div>
                                                        )}

                                                        {/* Badges */}
                                                        {hasDiscount && (
                                                            <span className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                                                خصم {Math.round(((product.price - (product.discount_price || 0)) / product.price) * 100)}%
                                                            </span>
                                                        )}
                                                        <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${product.type === 'interactive'
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-700 dark:bg-gray-900 text-white'
                                                            }`}>
                                                            {product.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                                        </span>

                                                        {/* Wishlist Button */}
                                                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <WishlistButton productId={product.id} size="sm" />
                                                        </div>
                                                    </div>
                                                </Link>

                                                {/* Product Info */}
                                                <div className="p-5">
                                                    <Link href={`/marketplace/${product.slug}`}>
                                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                            {product.name_ar}
                                                        </h3>
                                                    </Link>

                                                    <div className="flex items-center gap-1 mb-3">
                                                        <span className="text-yellow-400">⭐</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {Number(product.average_rating || 0).toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            ({product.reviews_count || 0})
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                                                {formatPrice(product.discount_price || product.price)}
                                                            </span>
                                                            {hasDiscount && (
                                                                <span className="text-sm text-gray-400 line-through">
                                                                    {formatPrice(product.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAddToCart(product)}
                                                            className="bg-primary-600 hover:bg-primary-700 text-white"
                                                        >
                                                            🛒
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        }>
            <MarketplaceContent />
        </Suspense>
    );
}
