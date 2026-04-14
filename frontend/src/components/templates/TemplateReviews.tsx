'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';
import type { Review, ReviewSummary } from '@/types';

interface TemplateReviewsProps {
    templateSlug: string;
    templateId: string;
}

/**
 * TemplateReviews
 * 
 * Displays template reviews with rating summary and review form.
 * Only allows reviews from users who have purchased the template.
 */
export function TemplateReviews({ templateSlug, templateId }: TemplateReviewsProps) {
    const { isAuthenticated } = useAuthStore();
    const { t, locale } = useTranslation();
    const isEn = locale === 'en';
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [canReview, setCanReview] = useState(false);
    const [canReviewReason, setCanReviewReason] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await api.getTemplateReviews(templateSlug);
                if (response.success) {
                    setReviews(response.data.reviews);
                    setSummary(response.data.summary);
                }
            } catch (error) {
                logger.error('Failed to fetch reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [templateSlug]);

    // Check if user can review
    useEffect(() => {
        const checkCanReview = async () => {
            if (!isAuthenticated) {
                setCanReview(false);
                setCanReviewReason(isEn ? 'Please login to review this template' : 'يجب تسجيل الدخول لتقييم القالب');
                return;
            }

            try {
                const response = await api.canReviewTemplate(templateSlug);
                if (response.success) {
                    setCanReview(response.data.can_review);
                    setCanReviewReason(response.data.message);
                }
            } catch (error) {
                setCanReview(false);
            }
        };

        checkCanReview();
    }, [isAuthenticated, templateSlug]);

    // Submit review
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canReview) return;

        setIsSubmitting(true);
        try {
            const response = await api.createReview(templateSlug, { rating, comment });

            if (response.success) {
                toast.success(t('toast.review.added'));
                setReviews([response.data.review, ...reviews]);
                setSummary({
                    average_rating: response.data.new_average,
                    reviews_count: response.data.new_count,
                    distribution: summary?.distribution || {},
                });
                setShowForm(false);
                setCanReview(false);
                setComment('');
            }
        } catch (error) {
            toast.error(t('toast.review.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Star rating component
    const StarRating = ({ value, onChange, readonly = false }: {
        value: number;
        onChange?: (val: number) => void;
        readonly?: boolean;
    }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onChange?.(star)}
                    disabled={readonly}
                    className={`text-2xl transition-transform ${!readonly && 'hover:scale-110 cursor-pointer'}`}
                >
                    {star <= value ? '⭐' : '☆'}
                </button>
            ))}
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {isEn ? 'Reviews' : 'التقييمات'} ({summary?.reviews_count || 0})
                </h2>

                {canReview && !showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        {isEn ? 'Add Your Review' : 'أضف تقييمك'} ⭐
                    </Button>
                )}
            </div>

            {/* Summary */}
            {summary && summary.reviews_count > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                            {Number(summary.average_rating || 0).toFixed(1)}
                        </div>
                        <StarRating value={Math.round(Number(summary.average_rating || 0))} readonly />
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {summary.reviews_count} {isEn ? 'reviews' : 'تقييم'}
                        </div>
                    </div>

                    {/* Distribution */}
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = summary.distribution[star] || 0;
                            const percentage = summary.reviews_count > 0
                                ? (count / summary.reviews_count) * 100
                                : 0;

                            return (
                                <div key={star} className="flex items-center gap-2 text-sm">
                                    <span className="w-12">{star} ⭐</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-yellow-400 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-gray-500">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{isEn ? 'Add Your Review' : 'أضف تقييمك'}</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isEn ? 'Rating' : 'التقييم'}
                        </label>
                        <StarRating value={rating} onChange={setRating} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isEn ? 'Your comment (optional)' : 'تعليقك (اختياري)'}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={isEn ? 'Share your experience with this template...' : 'شاركنا تجربتك مع هذا القالب...'}
                            rows={4}
                            className="w-full px-4 py-3 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            {isSubmitting ? (isEn ? 'Submitting...' : 'جاري الإرسال...') : (isEn ? 'Submit Review' : 'إرسال التقييم')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForm(false)}
                        >
                            {isEn ? 'Cancel' : 'إلغاء'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Cannot review message */}
            {!canReview && canReviewReason && !showForm && isAuthenticated && (
                <div className="bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
                    {canReviewReason}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">📝</div>
                        <p>{isEn ? 'No reviews yet' : 'لا توجد تقييمات بعد'}</p>
                        <p className="text-sm">{isEn ? 'Be the first to review this template!' : 'كن أول من يقيم هذا القالب!'}</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                                        {review.user?.name?.charAt(0) || '؟'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {review.user?.name || (isEn ? 'User' : 'مستخدم')}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(review.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}
                                        </div>
                                    </div>
                                </div>
                                <StarRating value={review.rating} readonly />
                            </div>

                            {review.comment && (
                                <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TemplateReviews;