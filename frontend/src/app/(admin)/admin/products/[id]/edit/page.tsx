'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import Image from 'next/image';
import type { Category } from '@/types';

// We reuse the same logic as Create Product, but with pre-filled data
export default function EditProductPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form State
    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [type, setType] = useState('digital'); // digital or interactive
    const [educationalStage, setEducationalStage] = useState('general');
    const [isActive, setIsActive] = useState(true);

    // File/Image State
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, categoriesRes] = await Promise.all([
                    api.getAdminProduct(id),
                    api.getCategories()
                ]);

                if (productRes.success) {
                    const p = productRes.data;
                    setNameAr(p.name_ar);
                    setNameEn(p.name_en);
                    setDescriptionAr(p.description_ar || '');
                    setDescriptionEn(p.description_en || '');
                    setPrice(p.price.toString());
                    setDiscountPrice(p.discount_price ? p.discount_price.toString() : '');
                    setCategoryId(p.category_id || p.category?.id || '');
                    setType(p.type);
                    setEducationalStage(p.educational_stage);
                    setIsActive(p.is_active);
                    setCurrentThumbnail(p.thumbnail_url);
                    // Note: We can't easily get the original filename of the secure download file
                    setCurrentFileName('Available (Upload new to replace)');
                } else {
                    toast.error('فشل في جلب بيانات المنتج');
                    router.push('/admin/products');
                }

                if (categoriesRes.success) {
                    setCategories(categoriesRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('حدث خطأ أثناء تحميل البيانات');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('name_ar', nameAr);
            formData.append('name_en', nameEn);
            formData.append('description_ar', descriptionAr);
            formData.append('description_en', descriptionEn);
            formData.append('price', price);
            if (discountPrice) formData.append('discount_price', discountPrice);
            if (categoryId) formData.append('category_id', categoryId);
            formData.append('type', type);
            formData.append('educational_stage', educationalStage);
            formData.append('is_active', isActive ? '1' : '0');

            if (thumbnail) formData.append('thumbnail', thumbnail);
            if (file) formData.append('file', file);

            const response = await api.updateProduct(id, formData);

            if (response.success) {
                toast.success('تم تحديث المنتج بنجاح ✅');
                router.push('/admin/products');
            } else {
                toast.error(response.message || 'فشل في تحديث المنتج ❌');
            }
        } catch (error: any) {
            console.error('Submit Error:', error);
            toast.error(error.message || 'حدث خطأ غير متوقع');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    تعديل المنتج: {nameAr}
                </h1>
                <Link href="/admin/products">
                    <Button variant="outline" className="dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">
                        إلغاء وخروج
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">البيانات الأساسية</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم (بالعربية)</label>
                            <Input
                                value={nameAr}
                                onChange={(e) => setNameAr(e.target.value)}
                                required
                                className="bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (English)</label>
                            <Input
                                value={nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
                                required
                                dir="ltr"
                                className="bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (بالعربية)</label>
                            <textarea
                                value={descriptionAr}
                                onChange={(e) => setDescriptionAr(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (English)</label>
                            <textarea
                                value={descriptionEn}
                                onChange={(e) => setDescriptionEn(e.target.value)}
                                rows={4}
                                dir="ltr"
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Category */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">التسعير والتصنيف</h3>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر الأصلي (SAR)</label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                className="bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر بعد الخصم (اختياري)</label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={discountPrice}
                                onChange={(e) => setDiscountPrice(e.target.value)}
                                className="bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 bg-white"
                            >
                                <option value="">اختر التصنيف</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع المنتج</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 bg-white"
                            >
                                <option value="digital">ملف (Downloadable)</option>
                                <option value="interactive">تفاعلي (Interactive)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المرحلة التعليمية</label>
                            <select
                                value={educationalStage}
                                onChange={(e) => setEducationalStage(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 bg-white"
                            >
                                <option value="general">عام</option>
                                <option value="kindergarten">رياض الأطفال</option>
                                <option value="primary">ابتدائي</option>
                                <option value="intermediate">متوسط</option>
                                <option value="secondary">ثانوي</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-8">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">نشط (يظهر في المتجر)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">الملفات والصور</h3>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صورة المنتج</label>
                            <div className="flex items-center gap-4">
                                {(thumbnailPreview || currentThumbnail) && (
                                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border dark:border-gray-600">
                                        <Image
                                            src={thumbnailPreview || currentThumbnail || ''}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">اترك فارغاً للإبقاء على الصورة الحالية</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملف المنتج (الذي سيتم تحميله)</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                            />
                            {currentFileName && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ {currentFileName}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">اترك فارغاً للإبقاء على الملف الحالي</p>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-700">
                    <Link href="/admin/products">
                        <Button type="button" variant="ghost" className="dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                            إلغاء
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary-600 hover:bg-primary-700 text-white min-w-[150px]"
                    >
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات 💾'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
