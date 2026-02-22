'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import {
  FileText,
  Download,
  Edit3,
  Star,
  Eye,
  Zap,
  ShoppingCart,
  CreditCard,
  Sparkles
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
  const router = useRouter();
  const { addItem, items } = useCartStore();
  const { user } = useAuthStore();
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

  // DUAL-PATH LOGIC: Smart routing based on template type
  const handleTemplateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (variant === 'marketplace') {
      // Marketplace flow - check authentication first
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      if (template.type === 'interactive') {
        // Option A: Interactive Template → SERS Smart Editor
        toast.success('🚀 جاري توجيهك للمحرر الذكي...', {
          icon: '⚡',
          duration: 2000,
        });
        router.push(`/editor/${template.slug}`);
      } else {
        // Option B: Ready Template → Payment Gateway
        if (template.is_free) {
          // Free template - direct download
          router.push(`/templates/${template.slug}/download`);
        } else {
          // Paid template - payment required
          toast.success('🔒 جاري توجيهك لبوابة الدفع...', {
            icon: '💳',
            duration: 2000,
          });
          router.push(`/checkout?template=${template.id}`);
        }
      }
    } else {
      // Dashboard flow - user already owns the template
      if (template.type === 'interactive') {
        router.push(`/editor/${template.slug}`);
      } else {
        router.push(`/templates/${template.slug}`);
      }
    }
  };

  // Different href for SEO purposes (actual navigation handled by onClick)
  const templateHref = variant === 'marketplace'
    ? `/marketplace/${template.slug}`
    : template.type === 'interactive'
      ? `/editor/${template.slug}`
      : `/templates/${template.slug}`;

  return (
    <div className="group cursor-pointer" onClick={handleTemplateClick}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/30 transform hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          {template.thumbnail_url ? (
            <Image
              src={template.thumbnail_url}
              alt={template.name_ar}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
              <FileText className="w-16 h-16 text-primary/40" />
            </div>
          )}

          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Wishlist Button - Marketplace Only */}
          {variant === 'marketplace' && (
            <div className="absolute top-3 left-3 z-20">
              <TemplateWishlistButton templateId={template.id} />
            </div>
          )}

          {/* Discount Badge */}
          {template.discount_price && variant === 'marketplace' && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
              خصم {Math.round(((template.price - template.discount_price) / template.price) * 100)}%
            </div>
          )}

          {/* Type Badge - Enhanced with Icons */}
          <div className={`absolute ${template.discount_price && variant === 'marketplace' ? 'top-14' : 'top-3'} right-3 px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm border border-white/20 ${
            template.type === 'interactive'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
          }`}>
            {template.type === 'interactive' ? (
              <>
                <Zap className="w-3.5 h-3.5" />
                تفاعلي
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                جاهز
              </>
            )}
          </div>

          {/* Featured Badge */}
          {template.is_featured && (
            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3 h-3 fill-current" />
              مميز
            </div>
          )}

          {/* Free Badge */}
          {template.is_free && (
            <div className="absolute bottom-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
              مجاني
            </div>
          )}

          {/* Interactive Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              {template.type === 'interactive' ? (
                <>
                  <Edit3 className="w-4 h-4 text-primary" />
                  فتح المحرر الذكي
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-primary" />
                  {template.is_free ? 'تحميل مجاني' : 'شراء وتحميل'}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          {template.category?.name_ar && (
            <p className="text-xs text-primary font-bold mb-2 uppercase tracking-wide">
              {template.category.name_ar}
            </p>
          )}

          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {template.name_ar}
          </h3>

          {template.description_ar && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
              {template.description_ar}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                <Eye className="w-3.5 h-3.5" />
                {template.downloads_count || 0}
              </span>
              <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                <Download className="w-3.5 h-3.5" />
                {template.sales_count || 0}
              </span>
            </div>

            {/* Rating Stars (placeholder) */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-xs text-gray-400 mr-1">(4.8)</span>
            </div>
          </div>

          {/* Price Section - Only for marketplace variant */}
          {variant === 'marketplace' && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-primary">
                  {template.is_free ? 'مجاني' : formatPrice(effectivePrice)}
                </span>
                {template.discount_price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(template.price)}
                  </span>
                )}
              </div>
              
              {/* Template Type Indicator */}
              <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                template.type === 'interactive' 
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                {template.type === 'interactive' ? 'قابل للتخصيص' : 'جاهز للاستخدام'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {variant === 'marketplace' && (
            <div className="space-y-2">
              {/* Primary Action Button */}
              <button
                onClick={handleTemplateClick}
                className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  template.type === 'interactive'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl'
                    : template.is_free
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {template.type === 'interactive' ? (
                  <>
                    <Zap className="w-4 h-4" />
                    فتح المحرر الذكي
                  </>
                ) : template.is_free ? (
                  <>
                    <Download className="w-4 h-4" />
                    تحميل مجاني
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    شراء الآن
                  </>
                )}
              </button>

              {/* Add to Cart Button - Only for paid templates */}
              {!template.is_free && (
                <button
                  onClick={handleAddToCart}
                  disabled={isInCart}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    isInCart
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {isInCart ? 'في السلة' : 'أضف للسلة'}
                </button>
              )}
            </div>
          )}

          {/* Dashboard Variant - Simple Info */}
          {variant === 'dashboard' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {template.type === 'interactive' ? 'قالب تفاعلي' : 'قالب جاهز'}
              </span>
              {!template.is_free && (
                <span className="text-primary font-bold">
                  {formatPrice(template.price)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
