'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import type { Category } from '@/types';

const CATEGORY_ICONS = [
  { value: 'baby', emoji: '👶' },
  { value: 'book-open', emoji: '📖' },
  { value: 'graduation-cap', emoji: '🎓' },
  { value: 'school', emoji: '🏫' },
  { value: 'heart', emoji: '❤️' },
  { value: 'calendar', emoji: '📅' },
  { value: 'star', emoji: '⭐' },
  { value: 'folder', emoji: '📁' },
  { value: 'chart', emoji: '📊' },
  { value: 'pen', emoji: '✏️' },
  { value: 'trophy', emoji: '🏆' },
  { value: 'target', emoji: '🎯' },
  { value: 'clipboard', emoji: '📋' },
  { value: 'document', emoji: '📄' },
  { value: 'paint', emoji: '🎨' },
  { value: 'briefcase', emoji: '💼' },
];

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

function getIconEmoji(iconValue: string | undefined): string {
  const found = CATEGORY_ICONS.find(i => i.value === iconValue);
  return found ? found.emoji : '📁';
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    icon: 'folder',
    color: '#3B82F6',
    parent_id: '' as string | null,
    is_active: true,
    sort_order: 0,
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
    setFormData({
      name_ar: '', name_en: '', description_ar: '', description_en: '',
      icon: 'folder', color: '#3B82F6', parent_id: null, is_active: true, sort_order: categories.length,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const openCreateForm = (parentId?: string) => {
    resetForm();
    if (parentId) {
      setFormData(prev => ({ ...prev, parent_id: parentId }));
    }
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      description_ar: (category as any).description_ar || '',
      description_en: (category as any).description_en || '',
      icon: category.icon || 'folder',
      color: (category as any).color || '#3B82F6',
      parent_id: (category as any).parent_id || null,
      is_active: category.is_active,
      sort_order: (category as any).sort_order || 0,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, parent_id: formData.parent_id || null };
      if (editingCategory) {
        const response = await api.updateCategory(editingCategory.id, payload);
        if (response.success) {
          toast.success('تم تحديث التصنيف بنجاح');
          fetchCategories();
          resetForm();
        }
      } else {
        const response = await api.createCategory(payload);
        if (response.success) {
          toast.success('تم إضافة التصنيف بنجاح');
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
        toast.success('تم حذف التصنيف بنجاح');
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

  const toggleVisibility = async (category: Category) => {
    try {
      const response = await api.updateCategory(category.id, {
        ...category,
        is_active: !category.is_active,
      });
      if (response.success) {
        toast.success(category.is_active ? 'تم إخفاء التصنيف' : 'تم إظهار التصنيف');
        fetchCategories();
      }
    } catch (error) {
      toast.error('فشل في تحديث حالة التصنيف');
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    !searchQuery ||
    cat.name_ar.includes(searchQuery) ||
    cat.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build tree structure
  const rootCategories = filteredCategories.filter(cat => !(cat as any).parent_id);
  const getChildren = (parentId: string) => filteredCategories.filter(cat => (cat as any).parent_id === parentId);

  const renderCategory = (category: Category, depth: number = 0) => {
    const children = getChildren(category.id);
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = children.length > 0;
    const catColor = (category as any).color || '#3B82F6';

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-3 p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 group ${
            depth > 0 ? 'mr-8 border-r-2 border-gray-200 dark:border-gray-700 pr-4' : ''
          }`}
        >
          {/* Expand/Collapse */}
          <button
            onClick={() => hasChildren && toggleExpand(category.id)}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors text-gray-400 ${
              hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer' : 'opacity-0'
            }`}
          >
            {hasChildren && (isExpanded ? '▼' : '◀')}
          </button>

          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${catColor}20` }}
          >
            {getIconEmoji(category.icon)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 dark:text-white truncate">{category.name_ar}</h4>
              {!category.is_active && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded dark:bg-red-900/30 dark:text-red-400">مخفي</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>{category.name_en}</span>
              {(category as any).templates_count !== undefined && (
                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{(category as any).templates_count} قالب</span>
              )}
            </div>
          </div>

          {/* Color indicator */}
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: catColor }} />

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openCreateForm(category.id)}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="إضافة تصنيف فرعي"
            >
              ➕
            </button>
            <button
              onClick={() => toggleVisibility(category)}
              className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={category.is_active ? 'إخفاء' : 'إظهار'}
            >
              {category.is_active ? '👁️' : '🙈'}
            </button>
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="تعديل"
            >
              ✏️
            </button>
            {deleteConfirm === category.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => handleDelete(category.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">تأكيد</button>
                <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded dark:bg-gray-600 dark:text-gray-200">إلغاء</button>
              </div>
            ) : (
              <button onClick={() => setDeleteConfirm(category.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="حذف">🗑️</button>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-fade-in">
            {children.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🗂️ إدارة التصنيفات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إضافة وتعديل وتنظيم تصنيفات القوالب والخدمات ({categories.length} تصنيف)
          </p>
        </div>
        <Button onClick={() => openCreateForm()} className="bg-primary-600 hover:bg-primary-700 text-white">
          ➕ تصنيف جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xl">🗂️</div>
          <div>
            <p className="text-sm text-gray-500">إجمالي التصنيفات</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-xl">👁️</div>
          <div>
            <p className="text-sm text-gray-500">تصنيفات نشطة</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{categories.filter(c => c.is_active).length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-xl">🏷️</div>
          <div>
            <p className="text-sm text-gray-500">تصنيفات فرعية</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{categories.filter(c => (c as any).parent_id).length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <Input
          placeholder="بحث في التصنيفات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-white dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {editingCategory ? '✏️ تعديل التصنيف' : '➕ إنشاء تصنيف جديد'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {editingCategory ? 'تعديل بيانات التصنيف' : 'أضف تصنيف جديد للقوالب والخدمات'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم بالعربية *</label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="مثال: سجلات المتابعة"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name in English *</label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Follow-up Records"
                    required
                    dir="ltr"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف بالعربية</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder="وصف مختصر..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف الأب (اختياري)</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                >
                  <option value="">بدون تصنيف أب (رئيسي)</option>
                  {categories
                    .filter(c => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {getIconEmoji(cat.icon)} {cat.name_ar}
                      </option>
                    ))}
                </select>
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأيقونة</label>
                  <div className="grid grid-cols-8 gap-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-24 overflow-y-auto">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icon.value })}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${
                          formData.icon === icon.value
                            ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 scale-110'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اللون</label>
                  <div className="grid grid-cols-5 gap-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-8 text-xs flex-1 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  نشط (ظاهر في الموقع)
                </label>
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">معاينة</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    {getIconEmoji(formData.icon)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{formData.name_ar || 'اسم التصنيف'}</h4>
                    <p className="text-xs text-gray-500">{formData.name_en || 'Category Name'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white">
                  {editingCategory ? 'تحديث التصنيف' : 'إنشاء التصنيف'}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline" className="flex-1 dark:text-gray-200 dark:border-gray-600">
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">جاري تحميل التصنيفات...</p>
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد تصنيفات</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">ابدأ بإضافة أول تصنيف لك</p>
            <Button onClick={() => openCreateForm()} className="bg-primary-600 hover:bg-primary-700 text-white">
              ➕ إنشاء تصنيف
            </Button>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {rootCategories.map(cat => renderCategory(cat))}
          </div>
        )}
      </div>
    </div>
  );
}
