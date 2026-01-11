'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name_ar: '',
        name_en: '',
        icon: '',
        is_active: true,
    });

    const fetchCategories = async () => {
        try {
            const response = await api.getAdminCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast.error('فشل في جلب التصنيفات');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({ name_ar: '', name_en: '', icon: '', is_active: true });
        setEditingCategory(null);
        setShowForm(false);
    };

    const handleEdit = (category: Category) => {
        setFormData({
            name_ar: category.name_ar,
            name_en: category.name_en,
            icon: category.icon || '',
            is_active: category.is_active,
        });
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                // Update
                const response = await api.updateCategory(editingCategory.id, formData);
                if (response.success) {
                    toast.success('تم تحديث التصنيف بنجاح ✅');
                    fetchCategories();
                    resetForm();
                }
            } else {
                // Create
                const response = await api.createCategory(formData);
                if (response.success) {
                    toast.success('تم إضافة التصنيف بنجاح ✅');
                    fetchCategories();
                    resetForm();
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء الحفظ');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await api.deleteCategory(id);
            if (response.success) {
                toast.success('تم حذف التصنيف بنجاح ✅');
                setCategories(categories.filter((c) => c.id !== id));
            } else {
                toast.error(response.message || 'فشل في حذف التصنيف');
            }
        } catch (error: any) {
            toast.error(error.message || 'فشل في حذف التصنيف');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const iconOptions = ['baby', 'book-open', 'graduation-cap', 'school', 'heart', 'calendar', 'star', 'folder'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة التصنيفات 🗂️</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{categories.length} تصنيف</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                    ➕ إضافة تصنيف جديد
                </Button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                            {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الاسم بالعربية
                                </label>
                                <Input
                                    type="text"
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder="مثال: رياض الأطفال"
                                    required
                                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الاسم بالإنجليزية
                                </label>
                                <Input
                                    type="text"
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    placeholder="Example: Kindergarten"
                                    required
                                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الأيقونة
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {iconOptions.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon })}
                                            className={`p-2 rounded-lg border-2 transition-colors ${formData.icon === icon
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                }`}
                                        >
                                            {icon === 'baby' ? '👶' :
                                                icon === 'book-open' ? '📖' :
                                                    icon === 'graduation-cap' ? '🎓' :
                                                        icon === 'school' ? '🏫' :
                                                            icon === 'heart' ? '❤️' :
                                                                icon === 'calendar' ? '📅' :
                                                                    icon === 'star' ? '⭐' : '📁'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                                    التصنيف نشط
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white">
                                    {editingCategory ? 'تحديث' : 'إضافة'}
                                </Button>
                                <Button type="button" onClick={resetForm} variant="outline" className="flex-1 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p className="text-gray-600 dark:text-gray-400">جاري تحميل التصنيفات...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد تصنيفات</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">ابدأ بإضافة أول تصنيف لك</p>
                    </div>
                ) : (
                    <div className="divide-y dark:divide-gray-700">
                        {categories.map((category) => (
                            <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-2xl">
                                        {category.icon === 'baby' ? '👶' :
                                            category.icon === 'book-open' ? '📖' :
                                                category.icon === 'graduation-cap' ? '🎓' :
                                                    category.icon === 'school' ? '🏫' :
                                                        category.icon === 'heart' ? '❤️' :
                                                            category.icon === 'calendar' ? '📅' : '📁'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category.name_ar}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{category.name_en}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${category.is_active
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                        {category.is_active ? 'نشط' : 'معطل'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    >
                                        ✏️
                                    </button>
                                    {deleteConfirm === category.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(category.id)}
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
                                            onClick={() => setDeleteConfirm(category.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
