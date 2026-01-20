'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import toast from 'react-hot-toast'; // Added toast
import { formatPrice } from '@/lib/utils';
import {
  FileText,
  Download,
  Edit3,
  Star,
  Eye
} from 'lucide-react';
import type { Template } from '@/types';
import { TemplateWishlistButton } from './TemplateWishlistButton';

interface TemplateCardProps {
  template: Template & {
    effective_price?: number;
  };
  variant?: 'marketplace' | 'dashboard';
}

export default function TemplateCard({ template, variant = 'dashboard' }: TemplateCardProps) {
  const { addItem, items } = useCartStore();
  const effectivePrice = template.effective_price ?? template.discount_price ?? template.price;
  const isInCart = items.some((item) => item.templateId === template.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      templateId: template.id,
      name: template.name_ar,
      price: effectivePrice,
      thumbnail: template.thumbnail_url || '',
      type: template.type === 'ready' ? 'ready' : 'interactive',
    });
    toast.success('تمت الإضافة للسلة بنجاح 🛒');
  };

  // Different href based on variant and type
  const href = variant === 'marketplace'
    ? `/marketplace/${template.slug}`
    : template.type === 'interactive'
      ? `/editor/${template.slug}`
      : `/templates/${template.slug}`;

  return (
    <Link href={href} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          {template.thumbnail_url ? (
            <Image
              src={template.thumbnail_url}
              alt={template.name_ar}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <FileText className="w-16 h-16 text-primary/40" />
            </div>
          )}

          {/* Wishlist Button - Marketplace Only */}
          {variant === 'marketplace' && (
            <div className="absolute top-2 left-2 z-20">
              <TemplateWishlistButton templateId={template.id} />
            </div>
          )}

          {/* Discount Badge */}
          {template.discount_price && variant === 'marketplace' && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              خصم
            </span>
          )}

          {/* Type Badge */}
          <div className={`absolute top-3 ${template.discount_price && variant === 'marketplace' ? 'right-16' : 'right-3'} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${template.type === 'interactive'
            ? 'bg-green-500 text-white'
            : 'bg-blue-500 text-white'
            }`}>
            {template.type === 'interactive' ? (
              <>
                <Edit3 className="w-3 h-3" />
                تفاعلي
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                جاهز
              </>
            )}
          </div>

          {/* Featured Badge */}
          {template.is_featured && (
            <div className={`absolute ${variant === 'marketplace' ? 'top-10' : 'top-3'} left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10`}>
              <Star className="w-3 h-3 fill-current" />
              مميز
            </div>
          )}

          {/* Free Badge */}
          {template.is_free && (
            <div className="absolute bottom-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              مجاني
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {template.category?.name_ar && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {template.category.name_ar}
            </p>
          )}

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {template.name_ar}
          </h3>

          {template.description_ar && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
              {template.description_ar}
            </p>
          )}

          {/* Stats and Price Row */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {template.downloads_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {template.downloads_count || 0}
              </span>
            </div>

            {/* Price Section - Only for marketplace variant */}
            {variant === 'marketplace' && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(effectivePrice)}
                </span>
                {template.discount_price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(template.price)}
                  </span>
                )}
              </div>
            )}

            {/* Free price display for dashboard variant */}
            {variant === 'dashboard' && !template.is_free && (
              <span className="text-primary font-bold">
                {template.price} ر.س
              </span>
            )}
          </div>

          {/* Add to Cart Button - Only for marketplace variant */}
          {variant === 'marketplace' && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleAddToCart}
                disabled={isInCart}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isInCart
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
              >
                {isInCart ? 'في السلة' : 'أضف للسلة'}
              </button>
            </div>
          )}

          {/* Variants Count - Only for dashboard variant */}
          {variant === 'dashboard' && template.type === 'interactive' && template.variants && template.variants.length > 1 && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500">
                {template.variants.length} تصميم متاح
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
