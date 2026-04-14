'use client';

import React, { useState } from 'react';

import { SafeImage } from '@/components/ui/safe-image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { highlightMatches } from '@/lib/fuzzy-search';
import {
  FileText,
  Download,
  Star,
  Eye,
  ShoppingCart,
  Sparkles,
  Check,
  Tag,
  Zap,
  Share2,
} from 'lucide-react';
import type { Template } from '@/types';
import { TemplateWishlistButton } from './TemplateWishlistButton';
import { useTranslation } from '@/i18n/useTranslation';

interface TemplateCardProps {
  template: Template & {
    effective_price?: number;
  };
  variant?: 'marketplace' | 'dashboard';
  /** Optional search query for text highlighting */
  searchQuery?: string;
}

/** Render text with search highlights */
function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const segments = highlightMatches(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 text-inherit rounded-sm px-0.5">{seg.text}</mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

function TemplateCardInner({ template, variant = 'dashboard', searchQuery }: TemplateCardProps) {
  const router = useRouter();
  const { t, dir } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.items.some((item) => item.templateId === template.id));
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isAdding, setIsAdding] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const effectivePrice = template.effective_price ?? template.discount_price ?? template.price;
  const hasDiscount = template.discount_price && template.discount_price < template.price;
  const discountPercent = hasDiscount
    ? Math.round(((template.price - template.discount_price!) / template.price) * 100)
    : 0;

  const templateName = dir === 'rtl' ? template.name_ar : ((template as any).name_en || template.name_ar);
  const templateDesc = dir === 'rtl' ? template.description_ar : ((template as any).description_en || template.description_ar);
  const categoryName = template.category ? (dir === 'rtl' ? template.category.name_ar : ((template.category as any).name_en || template.category.name_ar)) : '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If already in cart → navigate to cart directly (more useful than a toast)
    if (isInCart) {
      router.push('/cart');
      return;
    }

    if (isAdding) return;
    setIsAdding(true);

    addItem({
      templateId: template.id,
      name: templateName,
      price: effectivePrice,
      thumbnail: template.thumbnail_url || '',
      type: 'ready',
    });

    // Show success toast with "Go to Cart" link
    toast.success(
      (tst) => (
        <div className="flex items-center gap-3">
          <span>{dir === 'rtl' ? 'تمت الإضافة للسلة ✅' : 'Added to cart ✅'}</span>
          <button
            onClick={() => { toast.dismiss(tst.id); router.push('/cart'); }}
            className="font-bold text-primary underline underline-offset-2 whitespace-nowrap"
          >
            {dir === 'rtl' ? 'الذهاب للسلة' : 'Go to Cart'}
          </button>
        </div>
      ),
      { duration: 3000 }
    );

    setTimeout(() => setIsAdding(false), 600);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInCart) {
      addItem({
        templateId: template.id,
        name: templateName,
        price: effectivePrice,
        thumbnail: template.thumbnail_url || '',
        type: 'ready',
      });
    }
    // Auth check — redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login?returnUrl=/checkout');
      return;
    }
    router.push('/checkout');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/marketplace/${template.slug}`;
    if (navigator.share) {
      navigator.share({ title: templateName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setIsShared(true);
        toast.success(dir === 'rtl' ? 'تم نسخ الرابط' : 'Link copied');
        setTimeout(() => setIsShared(false), 2000);
      });
    }
  };

  return (
    // [PERF] Replaced framer-motion with CSS transition — 10x faster with many cards
    <div
      className="group cursor-pointer transition-transform duration-200 hover:-translate-y-1"
      onClick={() => router.push(`/marketplace/${template.slug}`)}
    >
      <div className={`bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-primary/30 dark:hover:border-primary/40 hover:shadow-lg transition-all duration-300 ${template.is_featured ? 'ring-2 ring-amber-400/30' : ''}`}>
        {/* Thumbnail */}
        <div className="relative h-52 overflow-hidden">
          <SafeImage
            src={template.thumbnail_url}
            alt={template.name_ar}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 290px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/15 to-violet-500/10 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-14 h-14 text-primary/50 mx-auto mb-2" />
                  <span className="text-xs text-primary/40 font-medium">{t('product.templatePreview')}</span>
                </div>
              </div>
            }
          />

          {/* Top-start: Wishlist + Share (marketplace only) */}
          {variant === 'marketplace' && (
            <div
              className="absolute top-3 start-3 z-20 flex items-center gap-1.5"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <TemplateWishlistButton templateId={template.id} />
              <button
                onClick={handleShare}
                title={isShared ? t('product.linkCopied') : t('product.share')}
                className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary shadow-sm transition-all hover:scale-110 active:scale-95"
              >
                {isShared ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Top-end: Discount badge */}
          {hasDiscount && variant === 'marketplace' && (
            <div className="absolute top-3 end-3 z-10">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[11px] px-3 py-1.5 rounded-full font-black shadow-lg flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {t('product.discount')} {discountPercent}%
              </div>
            </div>
          )}

          {/* Bottom badges */}
          <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between z-10">
            {/* Featured badge */}
            {template.is_featured && (
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-lg backdrop-blur-sm">
                <Sparkles className="w-3 h-3 fill-current" />
                {t('product.featured')}
              </div>
            )}
          </div>

          {/* Hover overlay — pointer-events-none so it NEVER steals clicks */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end justify-center pb-6">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-full px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
              <Eye className="w-4 h-4 text-primary" />
              {t('market.viewDetails')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          {categoryName && (
            <p className="text-[11px] text-primary font-bold mb-2 tracking-wide uppercase">
              {categoryName}
            </p>
          )}

          <h3 className="text-base font-black text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1 leading-relaxed">
            <HighlightedText text={templateName} query={searchQuery} />
          </h3>

          {templateDesc && (
            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
              <HighlightedText text={templateDesc} query={searchQuery} />
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                <Download className="w-3 h-3" />
                {template.downloads_count || 0}
              </span>
              <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                <Eye className="w-3 h-3" />
                {template.sales_count || 0}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {template.average_rating ? Number(template.average_rating).toFixed(1) : (dir === 'rtl' ? 'جديد' : 'New')}
              </span>
            </div>
          </div>

          {/* Price + Action — marketplace only */}
          {variant === 'marketplace' && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-primary">
                  {formatPrice(effectivePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(template.price)}
                  </span>
                )}
              </div>

              {/* Action Buttons — pointer-events-auto ensures clicks always register */}
              <div
                className="flex items-center gap-2 relative z-30"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* Add to Cart / Go to Cart (primary CTA) */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`pointer-events-auto flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isInCart
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : isAdding
                        ? 'bg-primary/50 text-white cursor-wait'
                        : 'bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97]'
                  }`}
                >
                  {isInCart ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {dir === 'rtl' ? 'في السلة ←' : 'In Cart →'}
                    </>
                  ) : isAdding ? (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5 animate-bounce" />
                      {dir === 'rtl' ? 'جاري...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {t('product.addToCart')}
                    </>
                  )}
                </button>

                {/* Buy Now: compact icon button — clear secondary CTA */}
                <button
                  onClick={handleBuyNow}
                  title={dir === 'rtl' ? 'شراء فوري' : 'Buy Now'}
                  className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25 active:scale-95 transition-all duration-150 shrink-0"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Dashboard variant */}
          {variant === 'dashboard' && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
              <span className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-lg">
                <Download className="w-3 h-3" /> {t('product.readyToDownload')}
              </span>
              <span className="text-primary font-black text-sm">
                  {formatPrice(template.price)}
                </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Memoized for performance — prevents re-renders when parent state changes */
const TemplateCard = React.memo(TemplateCardInner);
export default TemplateCard;
