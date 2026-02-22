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

interface TemplateFormProps {
    templateId?: string;
}

export default function TemplateForm({ templateId }: TemplateFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const isEditMode = !!templateId;

    // حالة لمعاينة الصورة
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // حالة النموذج - Updated to match backend Template model
    const [formData, setFormData] = useState({
        name_ar: '',
        name_en: '',
        description_ar: '',
        description_en: '',
        price: '',
        discount_price: '',
        category_id: '',
        type: 'ready', // 'ready' or 'interactive' - matches backend enum
        format: 'pdf', // 'pdf', 'doc', 'image'
        is_active: true,
        is_featured: false,
        is_free: false,
    });

    // ملفات
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [templateFile, setTemplateFile] = useState<File | null>(null);

    // جلب البيانات الأولية
    useEffect(() => {
        const initData = async () => {
            try {
                // 1. جلب التصنيفات
                const categoriesRes = await api.getCategories();
                setCategories(categoriesRes.data);

                // 2. إذا كنا في وضع التعديل، جلب بيانات القالب
                if (isEditMode && templateId) {
                    const templateRes = await api.getAdminTemplate(templateId);
                    const template = templateRes.data;

                    setFormData({
                        name_ar: template.name_ar || '',
                        name_en: template.name_en || '',
                        description_ar: template.description_ar || '',
                        description_en: template.description_en || '',
                        price: template.price?.toString() || '',
                        discount_price: template.discount_price?.toString() || '',
                        category_id: template.category?.id || template.category_id || '',
                        type: template.type || 'ready',
                        format: template.format || 'pdf',
                        is_active: template.is_active ?? true,
                        is_featured: template.is_featured ?? false,
                        is_free: template.is_free ?? false,
                    });

                    if (template.thumbnail_url) {
                        setImagePreview(template.thumbnail_url);
                    } else if (template.thumbnail) {
                        // Fallback: generate URL from path
                        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage';
                        setImagePreview(`${storageUrl}/${template.thumbnail}`);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('فشل تحميل البيانات');
            }
        };

        initData();
    }, [isEditMode, templateId]);

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

            // Core fields - matching Template model fillable
            data.append('name_ar', formData.name_ar);
            data.append('name_en', formData.name_en);
            data.append('description_ar', formData.description_ar);
            data.append('description_en', formData.description_en);
            data.append('price', formData.price);
            data.append('category_id', formData.category_id);
            data.append('type', formData.type); // 'ready' or 'interactive'
            data.append('format', formData.format);
            data.append('is_active', formData.is_active ? '1' : '0');
            data.append('is_featured', formData.is_featured ? '1' : '0');

            // Optional fields
            if (formData.discount_price) {
                data.append('discount_price', formData.discount_price);
            }

            // Determine is_free based on price
            const isFree = formData.price === '' || formData.price === '0';
            data.append('is_free', isFree ? '1' : '0');

            // الملفات - thumbnail
            if (thumbnail) {
                data.append('thumbnail', thumbnail);
            }

            // الملف الرئيسي فقط إذا كان نوع القالب جاهز
            if (templateFile && formData.type === 'ready') {
                data.append('ready_file', templateFile);
            }

            if (isEditMode && templateId) {
                await api.updateTemplate(templateId, data);
                toast.success('تم تحديث القالب بنجاح! ✅');
            } else {
                await api.createTemplate(data);
                toast.success('تم إضافة القالب بنجاح! 🚀');
            }

            router.push('/admin/templates');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'حدث خطأ أثناء الحفظ';
            const errors = error.response?.data?.errors;
            if (errors) {
                // Show first validation error
                const firstError = Object.values(errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : msg);
            } else {
                toast.error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">

            {/* عنوان للنموذج في وضع التعديل */}
            {isEditMode && (
                <div className="mb-6 border-b dark:border-gray-700 pb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل القالب</h2>
                </div>
            )}

            {/* قسم المعلومات الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* الاسم عربي */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم القالب (عربي) *</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="مثال: سجل متابعة الطلاب"
                        value={formData.name_ar}
                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    />
                </div>

                {/* الاسم انجليزي */}
                <div dir="ltr">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Name (English) *</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Ex: Student Progress Report"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    />
                </div>

                {/* السعر */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">السعر (ر.س) *</label>
                    <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="0 للمجاني"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                </div>

                {/* سعر الخصم */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سعر الخصم (اختياري)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="اتركه فارغاً إذا لا يوجد خصم"
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    />
                </div>

                {/* التصنيف */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التصنيف *</label>
                    <select
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                        <option value="">اختر التصنيف...</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                        ))}
                    </select>
                </div>

                {/* صيغة الملف */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صيغة القالب</label>
                    <select
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                        value={formData.format}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    >
                        <option value="pdf">PDF</option>
                        <option value="doc">Word Document</option>
                        <option value="image">صورة</option>
                    </select>
                </div>
            </div>

            {/* قسم الوصف */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الوصف (عربي) *</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="وصف مختصر للقالب ومحتوياته..."
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    />
                </div>
                <div dir="ltr">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (English) *</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Brief description of the template..."
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    />
                </div>
            </div>

            {/* خيارات إضافية */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">خيارات العرض</h3>
                <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">نشط (ظاهر في المتجر)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">مميز ⭐</span>
                    </label>
                </div>
            </div>

            {/* قسم الملفات والنوع */}
            <div className="border-t dark:border-gray-700 pt-8 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ملفات القالب</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* رفع الصورة المصغرة */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            صورة الغلاف (Thumbnail) {!isEditMode && '*'}
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="thumbnail-upload"
                                required={!isEditMode}
                            />
                            <label htmlFor="thumbnail-upload" className="cursor-pointer block">
                                {imagePreview ? (
                                    <div className="relative w-full h-48 mx-auto">
                                        <Image src={imagePreview} alt="Preview" fill className="object-contain rounded" />
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <div className="text-4xl mb-2">🖼️</div>
                                        <span className="text-gray-500 dark:text-gray-400">اضغط لرفع صورة الغلاف</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* نوع القالب وملفه */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع القالب</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-white">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="ready"
                                        checked={formData.type === 'ready'}
                                        onChange={() => setFormData({ ...formData, type: 'ready' })}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>قالب جاهز (PDF/Zip)</span>
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

                        {formData.type === 'ready' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ملف القالب {isEditMode && <span className="text-xs text-gray-400">(اتركه فارغاً للاحتفاظ بالملف الحالي)</span>}
                                </label>
                                <input
                                    type="file"
                                    required={!isEditMode}
                                    accept=".pdf,.zip,.docx,.doc"
                                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                <p className="text-xs text-gray-400 mt-1">الملفات المسموحة: PDF, Zip, Docx</p>
                            </div>
                        )}

                        {formData.type === 'interactive' && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-xl">💡</span>
                                    <div>
                                        <p className="font-medium">قالب تفاعلي</p>
                                        <p className="mt-1">سيتم إنشاء هيكل القالب التفاعلي (الحقول والتصميم) بعد حفظ القالب.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* زر الحفظ */}
            <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => router.push('/admin/templates')}
                    className="px-6 py-3 rounded-xl text-gray-700 dark:text-gray-300 font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    إلغاء
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl transform hover:-translate-y-0.5'
                        }`}
                >
                    {isLoading ? 'جاري الحفظ...' : (isEditMode ? 'تحديث القالب' : 'حفظ ونشر القالب')}
                </button>
            </div>
        </form>
    );
}
