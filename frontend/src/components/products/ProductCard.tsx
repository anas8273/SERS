// src/components/products/ProductCard.tsx
// Note: This file is kept for backward compatibility
// Consider using TemplateCard.tsx for new implementations

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import type { Template } from '@/types';

interface ProductCardProps {
    product: Template & {
        effective_price?: number;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem, items } = useCartStore();
    const effectivePrice = product.effective_price ?? product.discount_price ?? product.price;
    const isInCart = items.some((item) => item.templateId === product.id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem({
            templateId: product.id,
            name: product.name_ar,
            price: effectivePrice,
            thumbnail: product.thumbnail_url || '',
            type: product.type === 'ready' ? 'ready' : 'interactive',
        });
    };

    return (
        <Link href={`/marketplace/${product.slug}`}>
            <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden dark:border dark:border-gray-700">
                {/* صورة القالب */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                        src={product.thumbnail_url || '/placeholder.png'}
                        alt={product.name_ar}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discount_price && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            خصم
                        </span>
                    )}
                    <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded ${product.type === 'interactive'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-500 text-white'
                        }`}>
                        {product.type === 'interactive' ? 'تفاعلي' : 'قابل للتحميل'}
                    </span>
                </div>

                {/* معلومات القالب */}
                <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {product.category?.name_ar || 'بدون تصنيف'}
                    </p>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {product.name_ar}
                    </h3>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-primary-600 dark:text-primary-400">
                                {formatPrice(effectivePrice)}
                            </span>
                            {product.discount_price && (
                                <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(product.price)}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isInCart}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInCart
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-700'
                                }`}
                        >
                            {isInCart ? 'في السلة' : 'أضف للسلة'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
