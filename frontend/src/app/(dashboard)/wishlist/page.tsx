'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Button } from '@/components/ui/button';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { ta } from '@/i18n/auto-translations';
import type { WishlistItem } from '@/types';
import {
    Heart,
    ShoppingCart,
    Trash2,
    Star,
    Package,
} from 'lucide-react';

export default function WishlistPage() {
    const router = useRouter();
    const { t, dir } = useTranslation();
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
                if (response?.success) {
                    setWishlistItems(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                logger.error('Failed to fetch wishlist:', error);
                setWishlistItems([]);
            } finally {
                setIsLoading(false);
            }
        };
        if (isAuthenticated) fetchWishlist();
    }, [isAuthenticated]);

    // Remove from wishlist
    const handleRemove = async (productId: string) => {
        try {
            await toggleWishlist(productId);
            setWishlistItems(items => items.filter(item => item.template_id !== productId));
        } catch (error) {
            toast.error(t('common.error' as any));
        }
    };

    // Add to cart
    const handleAddToCart = (item: WishlistItem) => {
        const template = item.template;
        const status = addItem({
            templateId: template.id,
            name: template.name_ar,
            price: template.discount_price || template.price,
            thumbnail: template.thumbnail_url || '',
            type: template.type as 'ready',
        });
        if (status === 'already_in_cart') {
            toast(t('product.inCart' as any) || 'Already in cart', { icon: '✅' });
            return;
        }
        toast.success(
            (toastObj) => (
                <div className="flex items-center gap-3">
                    <span>✅ {t('cart.added' as any)}</span>
                    <button
                        onClick={() => { toast.dismiss(toastObj.id); router.push('/cart'); }}
                        className="font-bold text-primary underline underline-offset-2"
                    >
                        {t('cart.viewCart' as any)}
                    </button>
                </div>
            ),
            { duration: 4000 }
        );
    };

    // Loading state
    if (authLoading) {
        return (
            <div dir={dir} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm text-gray-400 font-medium animate-pulse">SERS</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                <PageBreadcrumb pageName={ta('المفضلة', 'Wishlist')} />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl text-white shadow-lg shadow-rose-500/20">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{ta('المفضلة', 'Wishlist')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {wishlistItems.length} {ta('عنصر', 'items')}
                            </p>
                        </div>
                    </div>
                    <Link href="/marketplace">
                        <Button variant="outline" className="rounded-xl gap-2 font-bold border-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                            <Package className="w-4 h-4" />
                            {ta('تصفح المتجر', 'Browse Store')}
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
                        icon={<Heart className="w-16 h-16 text-rose-200 dark:text-rose-800" />}
                        title={ta('لا توجد عناصر في المفضلة', 'No items in wishlist')}
                        description={ta('أضف قوالب إلى المفضلة لحفظها للشراء لاحقاً', 'Add templates to wishlist to save them for later')}
                        action={
                            <Link href="/marketplace">
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                                    <Package className="w-4 h-4" />
                                    {ta('تصفح المتجر', 'Browse Store')}
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlistItems.map((item) => {
                            const template = item.template;
                            if (!template) return null;
                            const hasDiscount = template.discount_price && template.discount_price < template.price;
                            const discountPercent = hasDiscount
                                ? Math.round(((template.price - (template.discount_price || 0)) / template.price) * 100)
                                : 0;

                            return (
                                <div
                                    key={item.id}
                                    className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full"
                                >
                                    {/* Product Image */}
                                    <Link href={`/marketplace/${template.slug}`}>
                                        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            <SafeImage
                                                src={template.thumbnail_url}
                                                alt={template.name_ar}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                fallback={
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                                                    </div>
                                                }
                                            />
                                            {hasDiscount && (
                                                <span className="absolute top-3 end-3 px-3 py-1.5 bg-red-500 text-white text-xs font-black rounded-xl shadow-lg">
                                                    {ta('خصم', 'OFF')} {discountPercent}%
                                                </span>
                                            )}
                                            <div className="absolute top-3 start-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-md">
                                                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex-1 space-y-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-primary/5 dark:bg-primary/15 px-2 py-0.5 rounded-full">
                                                {ta('قالب جاهز', 'Ready Template')}
                                            </span>
                                            <Link href={`/marketplace/${template.slug}`}>
                                                <h3 className="font-black text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                                                    {template.name_ar}
                                                </h3>
                                            </Link>
                                            {template.average_rating && (
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span>{Number(template.average_rating).toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-gray-900 dark:text-white">
                                                    {formatPrice(template.discount_price || template.price)}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        {formatPrice(template.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                onClick={() => handleAddToCart(item)}
                                                className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm gap-1.5 font-bold"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                {ta('أضف للسلة', 'Add to Cart')}
                                            </Button>
                                            <button
                                                onClick={() => handleRemove(template.id)}
                                                className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                title={ta('إزالة من المفضلة', 'Remove from wishlist')}
                                            >
                                                <Trash2 className="w-4 h-4" />
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
