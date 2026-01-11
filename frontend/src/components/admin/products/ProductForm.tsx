'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Category {
    id: string;
    name_ar: string;
}

interface ProductFormProps {
    productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const isEditMode = !!productId;

    // حالة لمعاينة الصورة
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // حالة النموذج
    const [formData, setFormData] = useState({
        name_ar: '', name_en: '',
        description_ar: '', description_en: '',
        price: '',
        category_id: '',
        type: 'downloadable', // or 'interactive'
        is_active: true,
    });

    // ملفات
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [productFile, setProductFile] = useState<File | null>(null);

    // جلب البيانات الأولية
    useEffect(() => {
        const initData = async () => {
            try {
                // 1. جلب التصنيفات
                const categoriesRes = await api.getCategories();
                setCategories(categoriesRes.data);

                // 2. إذا كنا في وضع التعديل، جلب بيانات المنتج
                if (isEditMode && productId) {
                    const productRes = await api.getProduct(productId); // سيحتاج api.getProduct(id) أن يكون متاحاً للعامة أو للأدمن
                    const product = productRes.data;

                    setFormData({
                        name_ar: product.name_ar,
                        name_en: product.name_en,
                        description_ar: product.description_ar,
                        description_en: product.description_en,
                        price: product.price.toString(),
                        category_id: product.category?.id || '',
                        type: product.type,
                        is_active: product.is_active ?? true,
                    });

                    if (product.thumbnail_url) {
                        setImagePreview(product.thumbnail_url);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('فشل تحميل البيانات');
            }
        };

        initData();
    }, [isEditMode, productId]);

    // معالجة تغيير الصورة
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnail(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, String(value));
            });

            // الملفات اختيارية في التعديل
            if (thumbnail) data.append('thumbnail', thumbnail);

            // الملف فقط إذا تم تغييره أو كان جديداً
            if (productFile && formData.type === 'downloadable') {
                data.append('file', productFile);
            }

            if (isEditMode && productId) {
                await api.updateProduct(productId, data);
                toast.success('تم تحديث المنتج بنجاح! ✅');
            } else {
                await api.createProduct(data);
                toast.success('تم إضافة المنتج بنجاح! 🚀');
            }

            router.push('/admin/products');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'حدث خطأ أثناء الحفظ';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">

            {/* عنوان للنموذج في وضع التعديل */}
            {isEditMode && (
                <div className="mb-6 border-b dark:border-gray-700 pb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل المنتج</h2>
                </div>
            )}

            {/* قسم المعلومات الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* الاسم عربي */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم المنتج (عربي)</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="مثال: حقيبة المعلم الشاملة"
                        value={formData.name_ar}
                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    />
                </div>

                {/* الاسم انجليزي */}
                <div dir="ltr">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name (English)</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Ex: Teacher's Full Kit"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    />
                </div>

                {/* السعر */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">السعر (ر.س)</label>
                    <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                </div>

                {/* التصنيف */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التصنيف</label>
                    <select
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                        <option value="">اختر التصنيف...</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* قسم الوصف */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الوصف (عربي)</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    />
                </div>
                <div dir="ltr">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (English)</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    />
                </div>
            </div>

            {/* قسم الملفات والنوع */}
            <div className="border-t dark:border-gray-700 pt-8 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ملفات المنتج</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* رفع الصورة المصغرة */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صورة الغلاف (Thumbnail)</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="thumbnail-upload"
                                required={!isEditMode} // مطلوب فقط في الإنشاء
                            />
                            <label htmlFor="thumbnail-upload" className="cursor-pointer block">
                                {imagePreview ? (
                                    <div className="relative w-full h-48 mx-auto">
                                        <Image src={imagePreview} alt="Preview" fill className="object-contain rounded" />
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <span className="text-gray-500 dark:text-gray-400">اضغط لرفع صورة</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* نوع المنتج وملفه */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع المنتج</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-white">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="downloadable"
                                        checked={formData.type === 'downloadable'}
                                        onChange={() => setFormData({ ...formData, type: 'downloadable' })}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>ملف للتحميل (PDF/Zip)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-white">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="interactive"
                                        checked={formData.type === 'interactive'}
                                        onChange={() => setFormData({ ...formData, type: 'interactive' })}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>قالب تفاعلي (Interactive)</span>
                                </label>
                            </div>
                        </div>

                        {formData.type === 'downloadable' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ملف المنتج (للمشتري) {isEditMode && <span className="text-xs text-gray-400">(اتركه فارغاً للاحتفاظ بالملف الحالي)</span>}
                                </label>
                                <input
                                    type="file"
                                    required={!isEditMode}
                                    onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                <p className="text-xs text-gray-400 mt-1">الملفات المسموحة: PDF, Zip, Docx</p>
                            </div>
                        )}

                        {formData.type === 'interactive' && (
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                سيتم إنشاء هيكل القالب التفاعلي تلقائياً في الخطوة التالية.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* زر الحفظ */}
            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl transform hover:-translate-y-0.5'
                        }`}
                >
                    {isLoading ? 'جاري الحفظ...' : (isEditMode ? 'تحديث المنتج' : 'حفظ ونشر المنتج')}
                </button>
            </div>
        </form>
    );
}