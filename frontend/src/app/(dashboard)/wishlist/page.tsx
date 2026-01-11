'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Button } from '@/components/ui/button';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import type { WishlistItem } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function WishlistPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const { addItem } = useCartStore();
    const { toggleWishlist } = useWishlistStore();

    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch wishlist
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!isAuthenticated) return;

            try {
                const response = await api.getWishlist();
                if (response.success) {
                    setWishlistItems(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch wishlist:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchWishlist();
        }
    }, [isAuthenticated]);

    // Remove from wishlist
    const handleRemove = async (productId: string) => {
        try {
            await toggleWishlist(productId);
            setWishlistItems(items => items.filter(item => item.product_id !== productId));
        } catch (error) {
            toast.error('حدث خطأ، حاول مرة أخرى');
        }
    };

    // Add to cart
    const handleAddToCart = (item: WishlistItem) => {
        const product = item.product;
        addItem({
            productId: product.id,
            name: product.name_ar,
            price: product.discount_price || product.price,
            thumbnail: product.thumbnail_url || '',
            type: product.type,
        });
        toast.success('تمت الإضافة للسلة 🛒');
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المفضلة ❤️</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {wishlistItems.length} منتج في قائمة المفضلة
                        </p>
                    </div>
                    <Link href="/marketplace">
                        <Button variant="outline" className="dark:bg-gray-800 dark:text-white dark:border-gray-700 hover:dark:bg-gray-700">
                            تصفح المتجر ←
                        </Button>
                    </Link>
                </div>

                {/* Wishlist Items */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <EmptyState
                        icon={<span className="text-6xl">❤️</span>}
                        title="المفضلة فارغة"
                        description="لم تضف أي منتجات للمفضلة بعد. اكتشف منتجاتنا وأضف ما يعجبك!"
                        action={
                            <Link href="/marketplace">
                                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                    تصفح المتجر
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlistItems.map((item) => {
                            const product = item.product;
                            const hasDiscount = product.discount_price && product.discount_price < product.price;

                            return (
                                <div
                                    key={item.id}
                                    className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    {/* Product Image */}
                                    <Link href={`/marketplace/${product.slug}`}>
                                        <div className="relative aspect-[4/3] bg-gray-100">
                                            {product.thumbnail_url ? (
                                                <Image
                                                    src={product.thumbnail_url}
                                                    alt={product.name_ar}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                                                    📄
                                                </div>
                                            )}

                                            {/* Discount Badge */}
                                            {hasDiscount && (
                                                <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                                    خصم {Math.round(((product.price - (product.discount_price || 0)) / product.price) * 100)}%
                                                </span>
                                            )}

                                            {/* Type Badge */}
                                            <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${product.type === 'interactive'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-500 text-white'
                                                }`}>
                                                {product.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <Link href={`/marketplace/${product.slug}`}>
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                                    {product.name_ar}
                                                </h3>
                                            </Link>

                                            {/* Rating */}
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-yellow-400">⭐</span>
                                                <span className="text-sm text-gray-600">
                                                    {product.average_rating.toFixed(1)}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    ({product.reviews_count})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-primary-600">
                                                {formatPrice(product.discount_price || product.price)}
                                            </span>
                                            {hasDiscount && (
                                                <span className="text-sm text-gray-400 line-through">
                                                    {formatPrice(product.price)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleAddToCart(item)}
                                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm"
                                            >
                                                أضف للسلة 🛒
                                            </Button>
                                            <button
                                                onClick={() => handleRemove(product.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="إزالة من المفضلة"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
