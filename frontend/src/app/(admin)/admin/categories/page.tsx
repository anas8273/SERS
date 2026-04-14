'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import type { ServiceCategory } from '@/types';
import {
  getServiceCategories,
  createServiceCategory,
  saveServiceCategory,
  deleteServiceCategory,
} from '@/lib/firestore-service';
import {
  FolderTree, Plus, Edit, Trash2, Eye, EyeOff, Search, X,
  Loader2, Save, Hash, FileText, Palette, CheckSquare, Square,
  ToggleLeft, ToggleRight, Sparkles, ChevronUp, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

// ===== Icon Options =====
const ICON_OPTIONS = [
  { value: 'Globe', label: ta('عالمي', 'Global'), emoji: '🌐' },
  { value: 'GraduationCap', label: ta('تعليم', 'Education'), emoji: '🎓' },
  { value: 'Building2', label: ta('إدارة', 'Management'), emoji: '🏢' },
  { value: 'Heart', label: ta('إرشاد', 'Counseling'), emoji: '❤️' },
  { value: 'Trophy', label: ta('نشاط', 'Activity'), emoji: '🏆' },
  { value: 'Baby', label: ta('رياض', 'Kindergarten'), emoji: '👶' },
  { value: 'Accessibility', label: ta('تربية خاصة', 'Special Education'), emoji: '♿' },
  { value: 'BarChart3', label: ta('تحليل', 'Analysis'), emoji: '📊' },
  { value: 'Award', label: ta('شهادات', 'Certificates'), emoji: '🏅' },
  { value: 'ClipboardList', label: ta('خطط', 'Plans'), emoji: '📋' },
  { value: 'FileText', label: ta('مستندات', 'Documents'), emoji: '📄' },
  { value: 'Bot', label: ta('ذكاء اصطناعي', 'Artificial Intelligence'), emoji: '🤖' },
  { value: 'Target', label: ta('أهداف', 'Objectives'), emoji: '🎯' },
  { value: 'Sparkles', label: ta('مميز', 'Featured'), emoji: '✨' },
  { value: 'Calendar', label: ta('تقويم', 'Assessment'), emoji: '📅' },
  { value: 'Users', label: ta('مستخدمون', 'Users'), emoji: '👥' },
  { value: 'BookOpen', label: ta('كتاب', 'Book'), emoji: '📖' },
  { value: 'FolderArchive', label: ta('أرشيف', 'Archive'), emoji: '🗂️' },
  { value: 'Star', label: ta('نجمة', 'Star'), emoji: '⭐' },
  { value: 'Briefcase', label: ta('حقيبة', 'Bag/Portfolio'), emoji: '💼' },
  { value: 'Shield', label: ta('أمان', 'Safety/Trust'), emoji: '🛡️' },
  { value: 'Lightbulb', label: ta('أفكار', 'Ideas'), emoji: '💡' },
  { value: 'FolderOpen', label: ta('مجلد', 'Folder'), emoji: '📁' },
  { value: 'ScrollText', label: ta('سجل', 'Record'), emoji: '📜' },
];

const COLOR_OPTIONS = [
  { value: 'bg-blue-500', label: ta('أزرق', 'Blue'), hex: '#3B82F6' },
  { value: 'bg-green-500', label: ta('أخضر', 'Green'), hex: '#10B981' },
  { value: 'bg-amber-500', label: ta('ذهبي', 'Gold'), hex: '#F59E0B' },
  { value: 'bg-red-500', label: ta('أحمر', 'Red'), hex: '#EF4444' },
  { value: 'bg-purple-500', label: ta('بنفسجي', 'Purple'), hex: '#8B5CF6' },
  { value: 'bg-rose-500', label: ta('وردي', 'Pink'), hex: '#F43F5E' },
  { value: 'bg-cyan-500', label: ta('سماوي', 'Light Blue'), hex: '#06B6D4' },
  { value: 'bg-orange-500', label: ta('برتقالي', 'Orange'), hex: '#F97316' },
  { value: 'bg-teal-500', label: ta('أخضر مزرق', 'Teal'), hex: '#14B8A6' },
  { value: 'bg-indigo-500', label: ta('نيلي', 'Indigo'), hex: '#6366F1' },
  { value: 'bg-sky-500', label: ta('سماء', 'Sky'), hex: '#0EA5E9' },
  { value: 'bg-emerald-500', label: ta('زمردي', 'Emerald'), hex: '#10B981' },
];

function getIconEmoji(iconValue: string): string {
  return ICON_OPTIONS.find(i => i.value === iconValue)?.emoji || '📁';
}
function getColorHex(colorValue: string): string {
  return COLOR_OPTIONS.find(c => c.value === colorValue)?.hex || '#3B82F6';
}

// ===== Default Job-Function Categories =====
const JOB_FUNCTION_DEFAULTS: Omit<ServiceCategory, 'id'>[] = [
  { name_ar: 'جميع الخدمات', description_ar: 'عرض جميع الخدمات والقوالب المتاحة', icon: 'Globe', color: 'bg-blue-500', slug: 'all', parent_id: null, is_active: true, sort_order: 0 },
  { name_ar: 'المعلمين والمعلمات', description_ar: 'خدمات وقوالب خاصة بالمعلمين والمعلمات', icon: 'GraduationCap', color: 'bg-emerald-500', slug: 'teachers', parent_id: null, is_active: true, sort_order: 1 },
  { name_ar: 'الإدارة المدرسية', description_ar: 'خدمات وقوالب خاصة بالإدارة المدرسية ومديري المدارس', icon: 'Building2', color: 'bg-purple-500', slug: 'school-admin', parent_id: null, is_active: true, sort_order: 2 },
  { name_ar: 'التوجيه والإرشاد', description_ar: 'خدمات وقوالب خاصة بالمرشدين الطلابيين', icon: 'Heart', color: 'bg-rose-500', slug: 'guidance', parent_id: null, is_active: true, sort_order: 3 },
  { name_ar: 'النشاط الطلابي', description_ar: 'خدمات وقوالب خاصة برواد النشاط الطلابي', icon: 'Trophy', color: 'bg-amber-500', slug: 'student-activities', parent_id: null, is_active: true, sort_order: 4 },
  { name_ar: 'رياض الأطفال', description_ar: 'خدمات وقوالب خاصة بمعلمات رياض الأطفال', icon: 'Baby', color: 'bg-cyan-500', slug: 'kindergarten', parent_id: null, is_active: true, sort_order: 5 },
  { name_ar: 'التربية الخاصة', description_ar: 'خدمات وقوالب خاصة بالتربية الخاصة وذوي الاحتياجات', icon: 'Accessibility', color: 'bg-indigo-500', slug: 'special-education', parent_id: null, is_active: true, sort_order: 6 },
];

const DEFAULT_FORM: Omit<ServiceCategory, 'id'> = {
  name_ar: '', description_ar: '', icon: 'FolderOpen', color: 'bg-blue-500',
  slug: '', parent_id: null, is_active: true, sort_order: 0,
};

export default function AdminCategoriesPage() {
  const { dir } = useTranslation();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk ops
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [formData, setFormData] = useState<Omit<ServiceCategory, 'id'>>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialogs
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // ===== Fetch =====
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getServiceCategories();
      setCategories(data && data.length > 0 ? data : []);
    } catch {
      toast.error(ta('فشل في جلب التصنيفات', 'Failed to fetch categories'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ===== Seed Defaults =====
  const seedDefaults = async () => {
    setIsSeeding(true);
    try {
      let created = 0;
      for (const cat of JOB_FUNCTION_DEFAULTS) {
        const exists = categories.find(c => c.slug === cat.slug);
        if (!exists) {
          await createServiceCategory(cat);
          created++;
        }
      }
      if (created > 0) {
        toast.success(`تم إضافة ${created} تصنيف افتراضي 🎉`);
        fetchCategories();
      } else {
        toast.success(ta('جميع التصنيفات الافتراضية موجودة بالفعل ✅', 'All default categories already exist ✅'));
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل في إضافة التصنيفات الافتراضية');
    } finally {
      setIsSeeding(false);
    }
  };

  // ===== Slug generator =====
  const generateSlug = (name: string): string => {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\u0600-\u06FFa-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  // ===== Filter =====
  const filteredCategories = useMemo(() =>
    categories.filter(c =>
      c.name_ar.includes(searchQuery) || c.description_ar?.includes(searchQuery) || c.slug?.includes(searchQuery.toLowerCase())
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories, searchQuery]
  );

  // ===== Selection =====
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const selectAll = () => setSelectedIds(new Set(filteredCategories.map(c => c.id)));
  const deselectAll = () => setSelectedIds(new Set());
  const isAllSelected = filteredCategories.length > 0 && filteredCategories.every(c => selectedIds.has(c.id));

  // ===== Form Handlers =====
  const resetForm = () => {
    setFormData({ ...DEFAULT_FORM, sort_order: categories.length });
    setEditingCategory(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setFormData(prev => ({ ...prev, sort_order: categories.length }));
    setShowForm(true);
  };

  const openEdit = (category: ServiceCategory) => {
    setFormData({
      name_ar: category.name_ar, description_ar: category.description_ar || '',
      icon: category.icon || 'FolderOpen', color: category.color || 'bg-blue-500',
      slug: category.slug || '', parent_id: category.parent_id || null,
      is_active: category.is_active !== false, sort_order: category.sort_order || 0,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar.trim()) { toast.error(ta('يرجى إدخال اسم التصنيف', 'Please enter a category name')); return; }
    setIsSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.name_ar);
      const payload = { ...formData, slug };
      if (editingCategory) {
        await saveServiceCategory(editingCategory.id, payload);
        toast.success(ta('تم تحديث التصنيف بنجاح ✅', 'Category updated successfully ✅'));
      } else {
        await createServiceCategory(payload);
        toast.success(ta('تم إضافة التصنيف بنجاح 🎉', 'Category added successfully 🎉'));
      }
      fetchCategories(); resetForm();
    } catch (error: any) {
      toast.error(error.message || ta('حدث خطأ أثناء الحفظ', 'Error saving'));
    } finally { setIsSaving(false); }
  };

  // ===== Delete =====
  const handleDelete = async (id: string) => {
    try {
      await deleteServiceCategory(id);
      toast.success(ta('تم حذف التصنيف بنجاح', 'Category deleted successfully'));
      setCategories(prev => prev.filter(c => c.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (error: any) {
      toast.error(error.message || 'فشل في حذف التصنيف');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let success = 0, fail = 0;
    for (const id of ids) {
      try { await deleteServiceCategory(id); success++; } catch { fail++; }
    }
    setCategories(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    setShowDeleteAllConfirm(false);
    setIsBulkDeleting(false);
    if (success > 0) toast.success(`تم حذف ${success} تصنيف بنجاح`);
    if (fail > 0) toast.error(`فشل في حذف ${fail} تصنيف`);
  };

  const handleDeleteAll = () => {
    setSelectedIds(new Set(filteredCategories.map(c => c.id)));
    setShowDeleteAllConfirm(true);
  };

  const toggleVisibility = async (category: ServiceCategory) => {
    try {
      await saveServiceCategory(category.id, { is_active: !category.is_active });
      toast.success(category.is_active ? ta('تم إخفاء التصنيف', 'Category hidden') : 'تم إظهار التصنيف');
      fetchCategories();
    } catch { toast.error(ta('فشل في تحديث حالة التصنيف', 'Failed to update category status')); }
  };

  const updateSortOrder = async (category: ServiceCategory, newOrder: number) => {
    try {
      await saveServiceCategory(category.id, { sort_order: newOrder });
      toast.success(ta('تم تحديث ترتيب العرض بنجاح', 'Display order updated successfully'));
      // Update local state immediately for better UX
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, sort_order: newOrder } : c));
    } catch { 
      toast.error(ta('فشل في تحديث الترتيب', 'Failed to update order')); 
    }
  };

  // ===== Stats =====
  const activeCount = categories.filter(c => c.is_active !== false).length;
  const inactiveCount = categories.filter(c => c.is_active === false).length;

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden bg-gradient-to-l from-primary/5 via-purple-500/5 to-blue-500/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-blue-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-br from-primary to-purple-600 rounded-xl text-white shadow-lg shadow-primary/20">
                <FolderTree className="w-5 h-5" />
              </span>
              {ta('إدارة التصنيفات', 'Category Management')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 flex items-center gap-2">
              {ta('تصنيفات حسب الفئة الوظيفية — مرتبطة بـ Firestore', 'Categories by Job Category — Linked to Firestore')}
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold">
                🔥 Firestore
              </Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {categories.length === 0 && !isLoading && (
              <Button
                onClick={seedDefaults}
                disabled={isSeeding}
                variant="outline"
                className="rounded-xl gap-2 font-bold border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                إضافة تصنيفات افتراضية
              </Button>
            )}
            <Button
              onClick={openCreate}
              className="bg-gradient-to-l from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 rounded-xl gap-2 font-bold"
            >
              <Plus className="w-4 h-4" />
              {ta('تصنيف جديد', 'New Category')}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Stats =====  */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: ta('إجمالي التصنيفات', 'Total Categories'), value: categories.length, icon: <FolderTree className="w-5 h-5" />, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
          { label: ta('تصنيفات نشطة', 'Active Categories'), value: activeCount, icon: <Eye className="w-5 h-5" />, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
          { label: ta('تصنيفات مخفية', 'Hidden Categories'), value: inactiveCount, icon: <EyeOff className="w-5 h-5" />, color: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-400/20' },
        ].map((stat) => (
          <div key={stat.label} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Search ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ta("بحث في التصنيفات...", "Search categories...")}
            className="w-full ps-4 pe-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {categories.length > 0 && !isLoading && (
          <Button
            onClick={seedDefaults}
            disabled={isSeeding}
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50"
          >
            {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            استعادة الافتراضيات
          </Button>
        )}
      </div>

      {/* ===== Bulk Action Bar ===== */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredCategories.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onDeleteSelected={() => setShowBulkDeleteConfirm(true)}
        onDeleteAll={handleDeleteAll}
        isAllSelected={isAllSelected}
        entityName={ta('تصنيف', 'category')}
      />

      {/* ===== Table ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-10 h-10 rounded-full animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-400 font-medium">SERS</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center">
            <FolderTree className="w-14 h-14 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <p className="font-bold text-gray-500 dark:text-gray-400 mb-1">
              {searchQuery ? ta('لا توجد نتائج', 'No results') : ta('لا توجد تصنيفات بعد', 'No categories yet')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              {searchQuery ? ta('جرب البحث بكلمات مختلفة', 'Try different search keywords') : ta('أضف التصنيفات الافتراضية أو أنشئ تصنيفاً جديداً', 'Add default categories or create a new one')}
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center gap-2">
                <Button onClick={seedDefaults} disabled={isSeeding} variant="outline" className="rounded-xl gap-2 font-bold">
                  <Sparkles className="w-4 h-4" /> {ta('إضافة الافتراضيات', 'Add Defaults')}
                </Button>
                <Button onClick={openCreate} className="rounded-xl gap-2 font-bold">
                  <Plus className="w-4 h-4" /> {ta('تصنيف جديد', 'New Category')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr className="text-start text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10">
                    <button onClick={isAllSelected ? deselectAll : selectAll} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      {isAllSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-400" />}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 w-8">#</th>
                  <th className="px-4 py-3.5">{ta('التصنيف', 'Category')}</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">{ta('المعرف', 'Identifier')}</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">{ta('الوصف', 'Description')}</th>
                  <th className="px-4 py-3.5 text-center hidden md:table-cell">{ta('الترتيب', 'Order')}</th>
                  <th className="px-4 py-3.5 text-center">{ta('الحالة', 'Status')}</th>
                  <th className="px-4 py-3.5 text-center">{ta('إجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredCategories.map((cat, i) => {
                  const isSelected = selectedIds.has(cat.id);
                  return (
                    <tr key={cat.id} className={cn(
                      "transition-colors group",
                      isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/30",
                      cat.is_active === false && "opacity-60"
                    )}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(cat.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0"
                            style={{ backgroundColor: getColorHex(cat.color) }}
                          >
                            {getIconEmoji(cat.icon)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{cat.name_ar}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-[11px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono text-gray-500 dark:text-gray-400">
                          {cat.slug || '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                          {cat.description_ar || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => updateSortOrder(cat, Math.max(0, (cat.sort_order || 0) - 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-primary transition-colors" title={ta('رفع للأعلى', 'Move Up')}>
                             <ChevronUp className="w-4 h-4" />
                           </button>
                           <Badge variant="secondary" className="text-[11px] font-bold w-8 text-center justify-center">{cat.sort_order || 0}</Badge>
                           <button onClick={() => updateSortOrder(cat, (cat.sort_order || 0) + 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-primary transition-colors" title={ta('تنزيل للأسفل', 'Move Down')}>
                             <ChevronDown className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleVisibility(cat)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                            cat.is_active !== false
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100"
                              : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100"
                          )}
                        >
                          {cat.is_active !== false ? <><Eye className="w-3 h-3" /> {ta('نشط', 'Active')}</> : <><EyeOff className="w-3 h-3" /> {ta('مخفي', 'Hidden')}</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(cat)} className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title={ta("تعديل", "Edit")}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirmId(cat.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={ta("حذف", "Delete")}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Create/Edit Modal ===== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  {editingCategory ? <><Edit className="w-5 h-5 text-primary" />{ta('تعديل التصنيف', 'Edit Category')}</> : <><Plus className="w-5 h-5 text-primary" />{ta('تصنيف جديد', 'New Category')}</>}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />{ta('اسم التصنيف', 'Category Name')}<span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder={ta('مثال: المعلمين والمعلمات', 'Example: Teachers (M/F)')}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400">{ta('الوصف', 'Description')}</label>
                <textarea
                  value={formData.description_ar || ''}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder={ta('وصف مختصر للتصنيف...', 'Short category description...')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> {ta('المعرف (Slug)', 'Slug (Identifier)')}
                </label>
                <input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder={generateSlug(formData.name_ar) || 'يُولّد تلقائياً'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                  dir="ltr"
                />
              </div>

              {/* Icon Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> {ta('الأيقونة', 'Icon')}
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon.value} type="button"
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                      className={cn(
                        "p-2.5 rounded-xl border-2 text-center transition-all hover:scale-110",
                        formData.icon === icon.value
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                      title={icon.label}
                    >
                      <span className="text-xl">{icon.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> {ta('اللون', 'Color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value} type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={cn(
                        "w-10 h-10 rounded-xl border-2 transition-all hover:scale-110",
                        formData.color === color.value
                          ? "border-gray-900 dark:border-white ring-2 ring-offset-2 dark:ring-offset-gray-800 shadow-lg"
                          : "border-transparent hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Sort Order + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">{ta('ترتيب العرض', 'Sort Order')}</label>
                  <input
                    type="number" min={0}
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <button type="button" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={cn("w-11 h-6 rounded-full transition-colors relative", formData.is_active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")}
                  >
                    <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", formData.is_active ? "right-0.5" : "right-[22px]")} />
                  </button>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {formData.is_active ? ta('✅ نشط', '✅ Active') : ta('🚫 مخفي', '🚫 Hidden')}
                  </span>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mb-3">{ta('معاينة حية', 'Preview')}</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                    style={{ backgroundColor: getColorHex(formData.color) }}>
                    {getIconEmoji(formData.icon)}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 dark:text-white text-lg">{formData.name_ar || ta('اسم التصنيف', 'Category Name')}</p>
                    <p className="text-sm text-gray-500">{formData.description_ar || ta('وصف التصنيف', 'Category description')}</p>
                  </div>
                  <Badge className={formData.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}>
                    {formData.is_active ? ta('نشط', 'Active') : ta('مخفي', 'Hidden')}
                  </Badge>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-5 rounded-b-2xl flex items-center justify-end gap-3">
              <Button onClick={resetForm} variant="ghost" className="rounded-xl font-bold">{ta('إلغاء', 'Cancel')}</Button>
              <Button
                onClick={handleSave as any}
                disabled={isSaving || !formData.name_ar.trim()}
                className="bg-gradient-to-l from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl gap-2 font-bold shadow-lg shadow-primary/20 min-w-[120px]"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> {ta('حفظ...', 'Saving...')}</> : <><Save className="w-4 h-4" /> {editingCategory ? ta('تحديث', 'Update') : ta('إضافة', 'Add')}</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Info Banner ===== */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-black text-blue-900 dark:text-blue-300 mb-1.5">{ta('نظام التصنيفات حسب الفئة الوظيفية', 'Job Function Category System')}</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{ta('التصنيفات تُنظم القوالب والخدمات حسب الوظيفة (معلمين، إدارة مدرسية، إرشاد...)', 'Categories organize templates and services by job type (teachers, school admin, counseling...)')}</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{ta('تُحفظ في', 'Saved in')}<strong>Firestore</strong>{ta('وتظهر تلقائياً في واجهة التصفية', 'They appear automatically in the filter interface')}</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{ta('كل قالب أو خدمة تُربط بتصنيف لتسهيل البحث والتنقل', 'Each template or service is linked to a category for easy search and navigation')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===== Confirm Dialogs ===== */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        title={ta("حذف التصنيف", "Delete Category")}
        message={ta('هل أنت متأكد من حذف هذا التصنيف؟ سيتم الحذف نهائياً من Firestore.', 'Are you sure? This will be permanently deleted from Firestore.')}
        confirmLabel={ta("نعم، احذف", "Yes, Delete")}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title={ta('حذف التصنيفات المحددة', 'Delete Selected Categories')}
        message={`سيتم حذف ${selectedIds.size} تصنيف نهائياً من Firestore. هل أنت متأكد؟`}
        confirmLabel={ta('نعم، احذف الكل', 'Yes, Delete All')}
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
      <ConfirmDialog
        open={showDeleteAllConfirm}
        title={ta('⚠️ حذف جميع التصنيفات', '⚠️ Delete All Categories')}
        message={`تحذير: سيتم حذف جميع التصنيفات (${filteredCategories.length}) نهائياً من Firestore!`}
        confirmLabel={ta('نعم، احذف الكل', 'Yes, Delete All')}
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => { setShowDeleteAllConfirm(false); deselectAll(); }}
      />
    </div>
  );
}
