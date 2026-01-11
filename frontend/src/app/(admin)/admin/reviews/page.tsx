'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface Review {
    id: string;
    product: { name_ar: string; slug: string };
    user: { name: string };
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            console.error('Fetch error:', error);
            toast.error(error.response?.data?.message || 'فشل تحميل التقييمات');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.approveReview(id);
            toast.success('تمت الموافقة');
            fetchReviews();
        } catch (error) {
            toast.error('فشل العملية');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.rejectReview(id);
            toast.success('تم الرفض');
            fetchReviews();
        } catch (error) {
            toast.error('فشل العملية');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('حذف هذا التقييم نهائياً؟')) return;
        try {
            await api.deleteReview(id);
            toast.success('تم الحذف');
            fetchReviews();
        } catch (error) {
            toast.error('فشل الحذف');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة التقييمات ⭐</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="p-4">المنتج</th>
                                <th className="p-4">المستخدم</th>
                                <th className="p-4">التقييم</th>
                                <th className="p-4">التعليق</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-8 text-center">جاري التحميل...</td></tr>
                            ) : reviews.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا توجد تقييمات جديدة</td></tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{review.product?.name_ar || 'منتج محذوف'}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">{review.user?.name || 'مستخدم'}</td>
                                        <td className="p-4 text-yellow-500">{'⭐'.repeat(review.rating)}</td>
                                        <td className="p-4 max-w-xs truncate text-gray-600 dark:text-gray-300" title={review.comment}>
                                            {review.comment || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${review.is_approved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                                                {review.is_approved ? 'منشور' : 'معلق'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            {!review.is_approved && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(review.id)}>
                                                    ✓
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => handleDelete(review.id)}>
                                                🗑️
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
