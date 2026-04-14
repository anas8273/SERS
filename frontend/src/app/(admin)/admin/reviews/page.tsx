'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import {
    Star,
    Search,
    CheckCircle,
    XCircle,
    Trash2,
    Clock,
    MessageSquare,
    TrendingUp,
    Filter,
    ChevronDown,
    Loader2,
    AlertTriangle,
    ThumbsUp,
    BarChart3,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface Review {
    id: string;
    product: { name_ar: string; slug: string };
    user: { name: string };
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function StarRating({ rating }: { rating: number }) {
  const { dir } = useTranslation();
    return (
        <div dir={dir} className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${
                        star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
            ))}
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 me-1.5">
                {rating}/5
            </span>
        </div>
    );
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.getAdminReviews();
            if (res.success && res.data?.data) {
                setReviews(res.data.data);
            } else {
                setReviews([]);
            }
        } catch (error: any) {
            logger.error('Fetch error:', error);
            toast.error(error.response?.data?.message || 'فشل تحميل التقييمات');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await api.approveReview(id);
            toast.success(ta('تمت الموافقة على التقييم ✅', 'Review approved ✅'));
            setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: true } : r));
        } catch (error) {
            toast.error(ta('فشل العملية', 'Operation failed'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessingId(id);
        try {
            await api.rejectReview(id);
            toast.success(ta('تم رفض التقييم', 'Review rejected'));
            setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: false } : r));
        } catch (error) {
            toast.error(ta('فشل العملية', 'Operation failed'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setProcessingId(id);
        try {
            await api.deleteReview(id);
            toast.success(ta('تم حذف التقييم نهائياً ✅', 'Review deleted'));
            setReviews(reviews.filter(r => r.id !== id));
        } catch (error) {
            toast.error(ta('فشل الحذف', 'Delete failed'));
        } finally {
            setProcessingId(null);
        }
    };

    // Stats
    const totalReviews = reviews.length;
    const approvedCount = reviews.filter(r => r.is_approved).length;
    const pendingCount = reviews.filter(r => !r.is_approved).length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : '0';

    // Filters
    const filteredReviews = reviews.filter(r => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (
                !r.user.name.toLowerCase().includes(q) &&
                !r.product.name_ar.toLowerCase().includes(q) &&
                !r.comment.toLowerCase().includes(q)
            ) return false;
        }
        if (statusFilter === 'approved' && !r.is_approved) return false;
        if (statusFilter === 'pending' && r.is_approved) return false;
        if (ratingFilter !== null && r.rating !== ratingFilter) return false;
        return true;
    });


    return (
        <>
        <div className="space-y-6">
            {/* ===== Premium Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-amber-500/5 via-yellow-500/5 to-orange-500/5 dark:from-amber-500/10 dark:via-yellow-500/10 dark:to-orange-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
                                <Star className="w-5 h-5" />
                            </span>{ta('إدارة التقييمات', 'Reviews Management')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            {ta('مراجعة واعتماد تقييمات المستخدمين', 'Review and approve user ratings')} ({totalReviews} {ta('تقييم', 'reviews')})
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== Stats Grid ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-amber-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{totalReviews}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('إجمالي التقييمات', 'Total Reviews')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-green-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{approvedCount}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('معتمدة', 'Approved')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-yellow-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{pendingCount}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('قيد المراجعة', 'Under Review')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-purple-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{avgRating}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('متوسط التقييم', 'Average Rating')}</p>
                    </div>
                </div>
            </div>

            {/* ===== Search & Filters ===== */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder={ta('بحث بالاسم أو القالب أو التعليق...', 'Search by name, template, or comment...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl h-11"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'approved', 'pending'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="rounded-xl text-xs font-bold"
                        >
                            {status === 'all' ? ta('الكل', 'All') : status === 'approved' ? ta('✅ معتمدة', '✅ Approved') : ta('⏳ قيد المراجعة', '⏳ Under Review') }
                        </Button>
                    ))}
                </div>
                <div className="flex gap-1">
                    {[5, 4, 3, 2, 1].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRatingFilter(ratingFilter === r ? null : r)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                ratingFilter === r
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {r}⭐
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== Reviews List ===== */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-6 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                    <Star className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{ta('لا توجد تقييمات', 'No Reviews')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery || statusFilter !== 'all' || ratingFilter
                            ? ta('جرب تغيير معايير البحث', 'Try changing search criteria')
                            : ta('لم يتم استلام أي تقييمات بعد', 'No reviews received yet') }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all hover:shadow-md ${
                                !review.is_approved
                                    ? 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-900/5'
                                    : 'border-gray-100 dark:border-gray-700'
                            }`}
                        >
                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                                            {review.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                {review.user.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(review.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {review.is_approved ? (
                                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold gap-1">
                                                <CheckCircle className="w-3 h-3" />{ta('معتمد', 'Approved')}</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold gap-1">
                                                <Clock className="w-3 h-3" />{ta('قيد المراجعة', 'Pending Review')}</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Product & Rating */}
                                <div className="flex items-center justify-between mb-3">
                                    <Badge variant="outline" className="text-xs">
                                        {review.product.name_ar}
                                    </Badge>
                                    <StarRating rating={review.rating} />
                                </div>

                                {/* Comment */}
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                                    "{review.comment}"
                                </p>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    {!review.is_approved && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(review.id)}
                                            disabled={processingId === review.id}
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs gap-1.5 h-8"
                                        >
                                            {processingId === review.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-3 h-3" />
                                            )}
                                            {ta('اعتماد', 'Approve')}
                                        </Button>
                                    )}
                                    {review.is_approved && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReject(review.id)}
                                            disabled={processingId === review.id}
                                            className="rounded-xl text-xs gap-1.5 h-8 text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/20"
                                        >
                                            <XCircle className="w-3 h-3" />{ta('إلغاء الاعتماد', 'Revoke')}</Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteConfirmId(review.id)}
                                        disabled={processingId === review.id}
                                        className="rounded-xl text-xs gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-3 h-3" />{ta('حذف', 'Delete')}</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <ConfirmDialog
            open={!!deleteConfirmId}
            title={ta("حذف التقييم", "Delete Review")}
            message={ta('حذف هذا التقييم نهائياً؟', 'Permanently delete this review?')}
            confirmLabel={ta('حذف نهائياً', 'Delete Permanently')}
            onConfirm={() => {
                if (deleteConfirmId) handleDelete(deleteConfirmId);
                setDeleteConfirmId(null);
            }}
            onCancel={() => setDeleteConfirmId(null)}
        />
        </>
    );
}

