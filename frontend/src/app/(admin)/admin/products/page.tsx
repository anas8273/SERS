'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import type { Product, Category } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchProducts = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.getAdminProducts(),
                api.getCategories(),
            ]);
            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error('فشل في جلب المنتجات');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const response = await api.deleteProduct(id);
            if (response.success) {
                toast.success('تم حذف المنتج بنجاح ✅');
                setProducts(products.filter((p) => p.id !== id));
            } else {
                toast.error(response.message || 'فشل في حذف المنتج');
            }
        } catch (error: any) {
            toast.error(error.message || 'فشل في حذف المنتج');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name_en.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة المنتجات 📦</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{products.length} منتج</p>
                </div>
                <Link href="/admin/products/create">
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                        ➕ إضافة منتج جديد
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 transition-colors">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 بحث عن منتج..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
                />
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p className="text-gray-600 dark:text-gray-400">جاري تحميل المنتجات...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد منتجات</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">ابدأ بإضافة أول منتج لك</p>
                        <Link href="/admin/products/create">
                            <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                إضافة منتج
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-right py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">المنتج</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">التصنيف</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden md:table-cell">النوع</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">السعر</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">الحالة</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-4 px-6 max-w-[200px]">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                    {product.thumbnail_url ? (
                                                        <Image
                                                            src={product.thumbnail_url}
                                                            alt={product.name_ar}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-600 dark:to-gray-500">
                                                            <span className="text-xl">📚</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={product.name_ar}>{product.name_ar}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">{product.name_en}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 hidden sm:table-cell">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {product.category?.name_ar || '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 hidden md:table-cell">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${product.type === 'interactive'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {product.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {formatPrice(product.discount_price || product.price)}
                                                </span>
                                                {product.discount_price && product.discount_price < product.price && (
                                                    <span className="block text-xs text-gray-400 line-through">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${product.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                                }`}>
                                                {product.is_active ? 'نشط' : 'معطل'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/admin/products/${product.id}/edit`}>
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="تعديل">
                                                        ✏️
                                                    </button>
                                                </Link>
                                                {deleteConfirm === product.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                        >
                                                            تأكيد
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(product.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="حذف"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
