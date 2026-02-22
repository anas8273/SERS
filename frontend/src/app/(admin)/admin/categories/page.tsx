'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import type { ServiceCategory } from '@/types';
import {
  getServiceCategories,
  createServiceCategory,
  saveServiceCategory,
  deleteServiceCategory,
} from '@/lib/firestore-service';

// ===== Icon Options =====
const ICON_OPTIONS = [
  { value: 'BarChart3', label: 'تحليل', emoji: '📊' },
  { value: 'Award', label: 'شهادات', emoji: '🏆' },
  { value: 'ClipboardList', label: 'خطط', emoji: '📋' },
  { value: 'Trophy', label: 'إنجازات', emoji: '🏅' },
  { value: 'FileText', label: 'مستندات', emoji: '📄' },
  { value: 'Bot', label: 'ذكاء اصطناعي', emoji: '🤖' },
  { value: 'Target', label: 'أهداف', emoji: '🎯' },
  { value: 'Sparkles', label: 'مميز', emoji: '✨' },
  { value: 'Calendar', label: 'تقويم', emoji: '📅' },
  { value: 'GraduationCap', label: 'تعليم', emoji: '🎓' },
  { value: 'Users', label: 'مستخدمون', emoji: '👥' },
  { value: 'BookOpen', label: 'كتاب', emoji: '📖' },
  { value: 'FolderArchive', label: 'أرشيف', emoji: '🗂️' },
  { value: 'ClipboardCheck', label: 'تقييم', emoji: '✅' },
  { value: 'ScrollText', label: 'سجل', emoji: '📜' },
  { value: 'Lightbulb', label: 'أفكار', emoji: '💡' },
  { value: 'Heart', label: 'مفضلة', emoji: '❤️' },
  { value: 'Star', label: 'نجمة', emoji: '⭐' },
  { value: 'FolderOpen', label: 'مجلد', emoji: '📁' },
  { value: 'Briefcase', label: 'حقيبة', emoji: '💼' },
  { value: 'Palette', label: 'فنون', emoji: '🎨' },
  { value: 'Music', label: 'موسيقى', emoji: '🎵' },
  { value: 'Globe', label: 'عالمي', emoji: '🌍' },
  { value: 'Shield', label: 'أمان', emoji: '🛡️' },
];

const COLOR_OPTIONS = [
  { value: 'bg-blue-500', label: 'أزرق', hex: '#3B82F6' },
  { value: 'bg-green-500', label: 'أخضر', hex: '#10B981' },
  { value: 'bg-amber-500', label: 'ذهبي', hex: '#F59E0B' },
  { value: 'bg-red-500', label: 'أحمر', hex: '#EF4444' },
  { value: 'bg-purple-500', label: 'بنفسجي', hex: '#8B5CF6' },
  { value: 'bg-rose-500', label: 'وردي', hex: '#F43F5E' },
  { value: 'bg-cyan-500', label: 'سماوي', hex: '#06B6D4' },
  { value: 'bg-orange-500', label: 'برتقالي', hex: '#F97316' },
  { value: 'bg-teal-500', label: 'أخضر مزرق', hex: '#14B8A6' },
  { value: 'bg-indigo-500', label: 'نيلي', hex: '#6366F1' },
  { value: 'bg-sky-500', label: 'سماء', hex: '#0EA5E9' },
  { value: 'bg-emerald-500', label: 'زمردي', hex: '#10B981' },
  { value: 'bg-yellow-500', label: 'أصفر', hex: '#EAB308' },
  { value: 'bg-lime-500', label: 'ليموني', hex: '#84CC16' },
];

function getIconEmoji(iconValue: string): string {
  const found = ICON_OPTIONS.find(i => i.value === iconValue);
  return found ? found.emoji : '📁';
}

function getColorHex(colorValue: string): string {
  const found = COLOR_OPTIONS.find(c => c.value === colorValue);
  return found ? found.hex : '#3B82F6';
}

// ===== Default Form State =====
const DEFAULT_FORM: Omit<ServiceCategory, 'id'> = {
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  icon: 'FolderOpen',
  color: 'bg-blue-500',
  slug: '',
  parent_id: null,
  is_active: true,
  sort_order: 0,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<ServiceCategory, 'id'>>(DEFAULT_FORM);

  // ===== Load Categories from Firestore =====
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const firestoreCategories = await getServiceCategories();
      if (firestoreCategories && firestoreCategories.length > 0) {
        setCategories(firestoreCategories);
      } else {
        setCategories([]);
      }
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

  // ===== Auto-generate slug from Arabic name =====
  const generateSlug = (name: string): string => {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // ===== Form Handlers =====
  const resetForm = () => {
    setFormData({ ...DEFAULT_FORM, sort_order: categories.length });
    setEditingCategory(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setFormData(prev => ({ ...prev, sort_order: categories.length }));
    setShowForm(true);
  };

  const handleEdit = (category: ServiceCategory) => {
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      description_ar: category.description_ar || '',
      description_en: category.description_en || '',
      icon: category.icon || 'FolderOpen',
      color: category.color || 'bg-blue-500',
      slug: category.slug || '',
      parent_id: category.parent_id || null,
      is_active: category.is_active !== false,
      sort_order: category.sort_order || 0,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم التصنيف بالعربية');
      return;
    }

    setIsSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.name_en || formData.name_ar);
      const payload = { ...formData, slug };

      if (editingCategory) {
        await saveServiceCategory(editingCategory.id, payload);
        toast.success('تم تحديث التصنيف بنجاح');
      } else {
        await createServiceCategory(payload);
        toast.success('تم إضافة التصنيف بنجاح');
      }
      fetchCategories();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteServiceCategory(id);
      toast.success('تم حذف التصنيف بنجاح');
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'فشل في حذف التصنيف');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleVisibility = async (category: ServiceCategory) => {
    try {
      await saveServiceCategory(category.id, { is_active: !category.is_active });
      toast.success(category.is_active ? 'تم إخفاء التصنيف' : 'تم إظهار التصنيف');
      fetchCategories();
    } catch (error) {
      toast.error('فشل في تحديث حالة التصنيف');
    }
  };

  // ===== Filter =====
  const filteredCategories = categories.filter(c =>
    c.name_ar.includes(searchQuery) ||
    c.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description_ar?.includes(searchQuery)
  );

  const activeCount = categories.filter(c => c.is_active !== false).length;
  const inactiveCount = categories.filter(c => c.is_active === false).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة التصنيفات</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            إنشاء وتعديل وحذف التصنيفات ديناميكياً من Firestore - تظهر تلقائياً في واجهة المستخدم
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-primary hover:bg-primary/90">
          <span className="ml-2">+</span> إضافة تصنيف جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 text-lg">📊</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
              <p className="text-xs text-gray-500">إجمالي التصنيفات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 text-lg">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
              <p className="text-xs text-gray-500">تصنيفات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-lg">🚫</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveCount}</p>
              <p className="text-xs text-gray-500">تصنيفات مخفية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="بحث في التصنيفات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingCategory ? `تعديل: ${editingCategory.name_ar}` : 'إضافة تصنيف جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    الاسم بالعربية <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="مثال: شواهد الأداء الوظيفي"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    الاسم بالإنجليزية
                  </label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="e.g., Performance Evidence"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    الوصف بالعربية
                  </label>
                  <textarea
                    value={formData.description_ar || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                    placeholder="وصف مختصر للتصنيف..."
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    الوصف بالإنجليزية
                  </label>
                  <textarea
                    value={formData.description_en || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Short description..."
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm min-h-[80px]"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  الرابط (Slug) - يُولّد تلقائياً
                </label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder={generateSlug(formData.name_en || formData.name_ar) || 'auto-generated'}
                  dir="ltr"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">سيظهر في الرابط: /categories/{formData.slug || generateSlug(formData.name_en || formData.name_ar) || 'slug'}</p>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  الأيقونة
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                      className={`p-2 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                        formData.icon === icon.value
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      title={icon.label}
                    >
                      <span className="text-xl">{icon.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  اللون
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                        formData.color === color.value
                          ? 'border-gray-900 dark:border-white ring-2 ring-offset-2'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ترتيب العرض
                  </label>
                  <Input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.is_active !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {formData.is_active !== false ? 'نشط (مرئي للمستخدمين)' : 'مخفي'}
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                <p className="text-xs text-gray-400 mb-2">معاينة:</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: getColorHex(formData.color) }}
                  >
                    {getIconEmoji(formData.icon)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{formData.name_ar || 'اسم التصنيف'}</p>
                    <p className="text-xs text-gray-500">{formData.description_ar || 'وصف التصنيف'}</p>
                  </div>
                  {formData.is_active !== false ? (
                    <Badge className="bg-green-100 text-green-700 mr-auto">نشط</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 mr-auto">مخفي</Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
                  {isSaving ? 'جاري الحفظ...' : editingCategory ? 'تحديث التصنيف' : 'إضافة التصنيف'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-24" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد تصنيفات بعد'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? 'جرب البحث بكلمات مختلفة'
                : 'ابدأ بإضافة تصنيف جديد. التصنيفات تظهر تلقائياً في واجهة المستخدم.'}
            </p>
            {!searchQuery && (
              <Button onClick={openCreateForm} className="bg-primary hover:bg-primary/90">
                إضافة أول تصنيف
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((category) => (
              <Card
                key={category.id}
                className={`transition-all hover:shadow-md ${
                  category.is_active === false ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0"
                      style={{ backgroundColor: getColorHex(category.color) }}
                    >
                      {getIconEmoji(category.icon)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {category.name_ar}
                        </h3>
                        {category.is_active !== false ? (
                          <Badge className="bg-green-100 text-green-700 text-[10px]">نشط</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 text-[10px]">مخفي</Badge>
                        )}
                      </div>
                      {category.name_en && (
                        <p className="text-xs text-gray-400 mb-1" dir="ltr">{category.name_en}</p>
                      )}
                      {category.description_ar && (
                        <p className="text-xs text-gray-500 line-clamp-2">{category.description_ar}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <span>الترتيب: {category.sort_order || 0}</span>
                        {category.slug && <span>• /{category.slug}</span>}
                        {category.templates_count !== undefined && (
                          <span>• {category.templates_count} قالب</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Switch
                        checked={category.is_active !== false}
                        onCheckedChange={() => toggleVisibility(category)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                        title="تعديل"
                      >
                        ✏️
                      </Button>
                      {deleteConfirm === category.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:bg-red-50 h-8 px-2 text-xs"
                          >
                            تأكيد
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                            className="h-8 px-2 text-xs"
                          >
                            إلغاء
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(category.id)}
                          className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                          title="حذف"
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">كيف يعمل النظام الديناميكي</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• التصنيفات تُحفظ في <strong>Firestore</strong> وتظهر تلقائياً في واجهة المستخدم</li>
                <li>• يمكنك إضافة تصنيف جديد (مثل &quot;سجلات المتابعة&quot;) وسيظهر فوراً بدون تعديل الكود</li>
                <li>• كل تصنيف يمكن ربطه بقوالب متعددة عبر صفحة &quot;إدارة الخدمات&quot;</li>
                <li>• ترتيب العرض يحدد أولوية ظهور التصنيف في القائمة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
