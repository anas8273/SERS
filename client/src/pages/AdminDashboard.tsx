/**
 * لوحة تحكم المدير - مراجعة ملفات الإنجاز + إدارة القوالب + إدارة الأقسام
 */
import { useState, useMemo, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Eye, FileText,
  Search, Loader2, MessageSquare,
  Users, BarChart3, ShieldCheck, ThumbsUp, ThumbsDown,
  Palette, FolderOpen, Settings, LayoutDashboard, ChevronLeft,
  ChevronRight, Menu, X, Plus, Trash2, Edit3, Save, ToggleLeft,
  ToggleRight, Upload, Star, GripVertical, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  draft: { label: "مسودة", color: "#6B7280", icon: FileText, bg: "bg-gray-100 text-gray-600" },
  submitted: { label: "مقدّم للمراجعة", color: "#2563EB", icon: Clock, bg: "bg-blue-100 text-blue-700" },
  reviewed: { label: "تمت المراجعة", color: "#CA8A04", icon: Eye, bg: "bg-amber-100 text-amber-700" },
  approved: { label: "معتمد", color: "#16A34A", icon: CheckCircle, bg: "bg-teal-100 text-teal-700" },
  rejected: { label: "مرفوض", color: "#DC2626", icon: XCircle, bg: "bg-red-100 text-red-600" },
};

const JOB_TITLES: Record<string, string> = {
  teacher: "معلم / معلمة",
  principal: "مدير / مديرة مدرسة",
  vice_principal: "وكيل / وكيلة مدرسة",
  counselor: "موجه/ة طلابي/ة",
  health_counselor: "موجه/ة صحي/ة",
  supervisor: "مشرف/ة تربوي/ة",
  librarian: "أمين/ة مصادر تعلم",
  kindergarten: "معلمة رياض أطفال",
  special_ed: "معلم/ة تربية خاصة",
  admin_assistant: "مساعد/ة إداري/ة",
};

type AdminTab = "portfolios" | "templates" | "settings";

// ─── مكون إدارة القوالب المدمج ────────────────────────────
function TemplatesPanel() {
  const { data: templates, isLoading, refetch } = trpc.templates.listAll.useQuery();
  const createMutation = trpc.templates.create.useMutation({ onSuccess: () => { refetch(); toast.success("تم إنشاء القالب"); } });
  const updateMutation = trpc.templates.update.useMutation({ onSuccess: () => { refetch(); toast.success("تم تحديث القالب"); } });
  const deleteMutation = trpc.templates.delete.useMutation({ onSuccess: () => { refetch(); toast.success("تم حذف القالب"); } });
  const seedMutation = trpc.templates.seed.useMutation({ onSuccess: () => { refetch(); toast.success("تم إضافة القوالب الافتراضية"); } });
  const uploadImageMutation = trpc.templates.uploadImage.useMutation();

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", headerBg: "linear-gradient(135deg, #059669, #047857)",
    headerText: "#ffffff", accent: "#059669", borderColor: "#e5e7eb",
    bodyBg: "#ffffff", fontFamily: "'Cairo', 'Tajawal', sans-serif",
    coverImageUrl: "", logoUrl: "", isDefault: false, sortOrder: 0,
    layoutType: "dark-header-table" as string,
    fieldStyle: "table" as string,
    titleStyle: "rounded" as string,
    signatureStyle: "dotted" as string,
    footerStyle: "gradient" as string,
  });

  const resetForm = () => {
    setFormData({
      name: "", description: "", headerBg: "linear-gradient(135deg, #059669, #047857)",
      headerText: "#ffffff", accent: "#059669", borderColor: "#e5e7eb",
      bodyBg: "#ffffff", fontFamily: "'Cairo', 'Tajawal', sans-serif",
      coverImageUrl: "", logoUrl: "", isDefault: false, sortOrder: 0,
      layoutType: "dark-header-table", fieldStyle: "table", titleStyle: "rounded",
      signatureStyle: "dotted", footerStyle: "gradient",
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) { toast.error("يرجى إدخال اسم القالب"); return; }
    const { layoutType, fieldStyle, titleStyle, signatureStyle, footerStyle, ...rest } = formData;
    createMutation.mutate({
      ...rest,
      templateLayout: {
        version: 1, pageSize: 'A4' as const, direction: 'rtl' as const,
        layoutType, fieldStyle, titleStyle, signatureStyle, footerStyle,
        showMoeLogo: true, showSchoolLogo: true, showEvidenceSection: true,
        evidenceDisplay: 'mixed', sections: [], footerText: 'SERS - نظام السجلات التعليمية الذكي',
        signatureLabels: { right: 'المعلم / اسم المعلم', left: 'مدير المدرسة / اسم المدير' },
      },
    });
    setShowCreateDialog(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;
    const { layoutType, fieldStyle, titleStyle, signatureStyle, footerStyle, ...rest } = formData;
    updateMutation.mutate({
      id: editingTemplate.id, ...rest,
      templateLayout: {
        ...(editingTemplate.templateLayout || {}),
        version: 1, layoutType, fieldStyle, titleStyle, signatureStyle, footerStyle,
      },
    });
    setEditingTemplate(null);
    resetForm();
  };

  const startEdit = (t: any) => {
    const layout = t.templateLayout || {};
    setFormData({
      name: t.name, description: t.description || "", headerBg: t.headerBg,
      headerText: t.headerText, accent: t.accent, borderColor: t.borderColor,
      bodyBg: t.bodyBg, fontFamily: t.fontFamily || "", coverImageUrl: t.coverImageUrl || "",
      logoUrl: t.logoUrl || "", isDefault: t.isDefault || false, sortOrder: t.sortOrder || 0,
      layoutType: layout.layoutType || 'dark-header-table',
      fieldStyle: layout.fieldStyle || 'table',
      titleStyle: layout.titleStyle || 'rounded',
      signatureStyle: layout.signatureStyle || 'dotted',
      footerStyle: layout.footerStyle || 'gradient',
    });
    setEditingTemplate(t);
  };

  const TemplateForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم القالب *</label>
          <input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <input value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">خلفية الرأس</label>
          <input value={formData.headerBg} onChange={(e) => setFormData(p => ({ ...p, headerBg: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نص الرأس</label>
          <div className="flex gap-2">
            <input type="color" value={formData.headerText} onChange={(e) => setFormData(p => ({ ...p, headerText: e.target.value }))}
              className="w-10 h-10 rounded border cursor-pointer" />
            <input value={formData.headerText} onChange={(e) => setFormData(p => ({ ...p, headerText: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اللون الرئيسي</label>
          <div className="flex gap-2">
            <input type="color" value={formData.accent} onChange={(e) => setFormData(p => ({ ...p, accent: e.target.value }))}
              className="w-10 h-10 rounded border cursor-pointer" />
            <input value={formData.accent} onChange={(e) => setFormData(p => ({ ...p, accent: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">لون الحدود</label>
          <div className="flex gap-2">
            <input type="color" value={formData.borderColor} onChange={(e) => setFormData(p => ({ ...p, borderColor: e.target.value }))}
              className="w-10 h-10 rounded border cursor-pointer" />
            <input value={formData.borderColor} onChange={(e) => setFormData(p => ({ ...p, borderColor: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">خلفية المحتوى</label>
          <div className="flex gap-2">
            <input type="color" value={formData.bodyBg} onChange={(e) => setFormData(p => ({ ...p, bodyBg: e.target.value }))}
              className="w-10 h-10 rounded border cursor-pointer" />
            <input value={formData.bodyBg} onChange={(e) => setFormData(p => ({ ...p, bodyBg: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الخط</label>
          <input value={formData.fontFamily} onChange={(e) => setFormData(p => ({ ...p, fontFamily: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* رفع صورة الغلاف */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">صورة الغلاف</label>
          <div className="flex gap-2 items-center">
            <input value={formData.coverImageUrl} onChange={(e) => setFormData(p => ({ ...p, coverImageUrl: e.target.value }))}
              placeholder="رابط الصورة أو ارفع ملف" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <label className="cursor-pointer bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg border border-teal-200 text-sm font-medium flex items-center gap-1 transition-colors">
              <Upload className="w-4 h-4" />رفع
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 5MB"); return; }
                const reader = new FileReader();
                reader.onload = async () => {
                  const base64 = (reader.result as string).split(',')[1];
                  try {
                    const result = await uploadImageMutation.mutateAsync({
                      fileName: file.name, mimeType: file.type, base64Data: base64, imageType: 'cover',
                    });
                    setFormData(p => ({ ...p, coverImageUrl: result.url }));
                    toast.success("تم رفع صورة الغلاف");
                  } catch { toast.error("فشل رفع الصورة"); }
                };
                reader.readAsDataURL(file);
              }} />
            </label>
          </div>
          {formData.coverImageUrl && (
            <div className="mt-2 relative">
              <img src={formData.coverImageUrl} alt="غلاف" className="w-full h-20 object-cover rounded-lg border" />
              <button onClick={() => setFormData(p => ({ ...p, coverImageUrl: '' }))} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
            </div>
          )}
        </div>
        {/* رفع الشعار */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الشعار</label>
          <div className="flex gap-2 items-center">
            <input value={formData.logoUrl} onChange={(e) => setFormData(p => ({ ...p, logoUrl: e.target.value }))}
              placeholder="رابط الشعار أو ارفع ملف" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <label className="cursor-pointer bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg border border-teal-200 text-sm font-medium flex items-center gap-1 transition-colors">
              <Upload className="w-4 h-4" />رفع
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { toast.error("حجم الشعار يجب أن يكون أقل من 2MB"); return; }
                const reader = new FileReader();
                reader.onload = async () => {
                  const base64 = (reader.result as string).split(',')[1];
                  try {
                    const result = await uploadImageMutation.mutateAsync({
                      fileName: file.name, mimeType: file.type, base64Data: base64, imageType: 'logo',
                    });
                    setFormData(p => ({ ...p, logoUrl: result.url }));
                    toast.success("تم رفع الشعار");
                  } catch { toast.error("فشل رفع الشعار"); }
                };
                reader.readAsDataURL(file);
              }} />
            </label>
          </div>
          {formData.logoUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={formData.logoUrl} alt="شعار" className="w-12 h-12 object-contain rounded-lg border p-1" />
              <button onClick={() => setFormData(p => ({ ...p, logoUrl: '' }))} className="text-red-500 hover:text-red-700 text-xs">إزالة</button>
            </div>
          )}
        </div>
      </div>

      {/* === التنسيقات الديناميكية === */}
      <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/30">
        <h4 className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />تنسيق التقرير (الشكل والتخطيط)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نمط التخطيط</label>
            <select value={formData.layoutType} onChange={(e) => setFormData(p => ({ ...p, layoutType: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="dark-header-table">ترويسة داكنة + جدول</option>
              <option value="dark-header-simple">ترويسة داكنة + بسيط</option>
              <option value="white-header-classic">أبيض كلاسيكي</option>
              <option value="white-header-sidebar">أبيض + شريط جانبي</option>
              <option value="white-header-light">أبيض + خلفية فاتحة</option>
              <option value="white-header-multi">أبيض + أعمدة متعددة</option>
              <option value="minimal-clean">بسيط ونظيف</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نمط الحقول</label>
            <select value={formData.fieldStyle} onChange={(e) => setFormData(p => ({ ...p, fieldStyle: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="table">جدول</option>
              <option value="fieldset">حقول مؤطرة</option>
              <option value="underlined">خط سفلي</option>
              <option value="cards">بطاقات</option>
              <option value="minimal">بسيط</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نمط العنوان</label>
            <select value={formData.titleStyle} onChange={(e) => setFormData(p => ({ ...p, titleStyle: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="rounded">مستدير</option>
              <option value="full-width">عرض كامل</option>
              <option value="bordered">مؤطر</option>
              <option value="underlined">خط سفلي</option>
              <option value="badge">شارة</option>
              <option value="simple">بسيط</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نمط التوقيع</label>
            <select value={formData.signatureStyle} onChange={(e) => setFormData(p => ({ ...p, signatureStyle: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="dotted">منقط</option>
              <option value="solid">خط متصل</option>
              <option value="boxed">مربع</option>
              <option value="lined">خط رفيع</option>
              <option value="stamped">ختم مزدوج</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نمط التذييل</label>
            <select value={formData.footerStyle} onChange={(e) => setFormData(p => ({ ...p, footerStyle: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="gradient">تدرج</option>
              <option value="solid">لون موحد</option>
              <option value="line">خط فقط</option>
              <option value="none">بدون تذييل</option>
            </select>
          </div>
        </div>
      </div>

      {/* معاينة مباشرة للقالب */}
      <div className="border rounded-xl overflow-hidden">
        <p className="text-xs font-bold text-gray-500 px-3 py-2 bg-gray-50 border-b flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />معاينة مباشرة — تتغير فوراً عند تعديل الخيارات
        </p>
        {/* ترويسة */}
        <div style={{ background: formData.headerBg, color: formData.headerText, padding: '1.25rem 1.5rem', direction: 'rtl', position: 'relative' }}>
          {formData.layoutType.includes('sidebar') && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '6px', background: formData.accent }} />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '2px' }}>المملكة العربية السعودية</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>وزارة التعليم</div>
              <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>الإدارة العامة للتعليم</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>شعار</div>
          </div>
        </div>
        {/* عنوان */}
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: formData.bodyBg, direction: 'rtl' }}>
          {formData.titleStyle === 'rounded' && (
            <div style={{ background: formData.accent, color: '#fff', padding: '4px 14px', borderRadius: '9999px', display: 'inline-block', fontSize: '0.65rem', fontWeight: 700 }}>بيانات الموظف</div>
          )}
          {formData.titleStyle === 'full-width' && (
            <div style={{ background: formData.accent, color: '#fff', padding: '4px 14px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '4px' }}>بيانات الموظف</div>
          )}
          {formData.titleStyle === 'bordered' && (
            <div style={{ border: `2px solid ${formData.accent}`, color: formData.accent, padding: '4px 14px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '6px', display: 'inline-block' }}>بيانات الموظف</div>
          )}
          {formData.titleStyle === 'underlined' && (
            <div style={{ color: formData.accent, padding: '4px 0', fontSize: '0.65rem', fontWeight: 700, borderBottom: `2px solid ${formData.accent}`, display: 'inline-block' }}>بيانات الموظف</div>
          )}
          {formData.titleStyle === 'badge' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '4px', height: '16px', background: formData.accent, borderRadius: '2px' }} />
              <span style={{ color: formData.accent, fontSize: '0.65rem', fontWeight: 700 }}>بيانات الموظف</span>
            </div>
          )}
          {formData.titleStyle === 'simple' && (
            <div style={{ color: formData.accent, fontSize: '0.65rem', fontWeight: 700 }}>بيانات الموظف</div>
          )}
        </div>
        {/* حقول */}
        <div style={{ padding: '0 1.5rem 0.75rem', backgroundColor: formData.bodyBg, direction: 'rtl' }}>
          {formData.fieldStyle === 'table' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem' }}>
              <tbody>
                <tr><td style={{ border: `1px solid ${formData.accent}40`, background: `${formData.accent}10`, padding: '3px 8px', fontWeight: 600, color: formData.accent, width: '30%' }}>الاسم</td><td style={{ border: `1px solid ${formData.accent}40`, padding: '3px 8px' }}>محمد أحمد</td></tr>
                <tr><td style={{ border: `1px solid ${formData.accent}40`, background: `${formData.accent}10`, padding: '3px 8px', fontWeight: 600, color: formData.accent }}>المدرسة</td><td style={{ border: `1px solid ${formData.accent}40`, padding: '3px 8px' }}>مدرسة النموذجية</td></tr>
              </tbody>
            </table>
          )}
          {formData.fieldStyle === 'fieldset' && (
            <div style={{ border: `1px solid ${formData.accent}40`, borderRadius: '6px', padding: '8px' }}>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.6rem' }}>
                <div><span style={{ fontWeight: 600, color: formData.accent }}>الاسم: </span>محمد أحمد</div>
                <div><span style={{ fontWeight: 600, color: formData.accent }}>المدرسة: </span>مدرسة النموذجية</div>
              </div>
            </div>
          )}
          {formData.fieldStyle === 'underlined' && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.6rem' }}>
              <div><span style={{ fontWeight: 600, color: formData.accent }}>الاسم: </span><span style={{ borderBottom: `1px solid ${formData.accent}`, paddingBottom: '1px' }}>محمد أحمد</span></div>
              <div><span style={{ fontWeight: 600, color: formData.accent }}>المدرسة: </span><span style={{ borderBottom: `1px solid ${formData.accent}`, paddingBottom: '1px' }}>مدرسة النموذجية</span></div>
            </div>
          )}
          {formData.fieldStyle === 'cards' && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.6rem' }}>
              <div style={{ flex: 1, background: `${formData.accent}08`, border: `1px solid ${formData.accent}20`, borderRadius: '6px', padding: '6px 8px' }}>
                <div style={{ fontWeight: 600, color: formData.accent, fontSize: '0.5rem', marginBottom: '2px' }}>الاسم</div>
                <div>محمد أحمد</div>
              </div>
              <div style={{ flex: 1, background: `${formData.accent}08`, border: `1px solid ${formData.accent}20`, borderRadius: '6px', padding: '6px 8px' }}>
                <div style={{ fontWeight: 600, color: formData.accent, fontSize: '0.5rem', marginBottom: '2px' }}>المدرسة</div>
                <div>مدرسة النموذجية</div>
              </div>
            </div>
          )}
          {formData.fieldStyle === 'minimal' && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.6rem', color: '#6B7280' }}>
              <div>الاسم: محمد أحمد</div>
              <div>المدرسة: مدرسة النموذجية</div>
            </div>
          )}
        </div>
        {/* توقيعات */}
        <div style={{ padding: '0.5rem 1.5rem 0.75rem', backgroundColor: formData.bodyBg, direction: 'rtl', display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
          {['dotted', 'solid', 'boxed', 'lined', 'stamped'].includes(formData.signatureStyle) && (
            <>
              <div style={{ textAlign: 'center', flex: 1, fontSize: '0.55rem' }}>
                <div style={{ color: '#6B7280', marginBottom: '12px' }}>توقيع المقيّم</div>
                {formData.signatureStyle === 'dotted' && <div style={{ borderTop: '2px dotted #D1D5DB', paddingTop: '4px' }}>الاسم</div>}
                {formData.signatureStyle === 'solid' && <div style={{ borderTop: '2px solid #D1D5DB', paddingTop: '4px' }}>الاسم</div>}
                {formData.signatureStyle === 'boxed' && <div style={{ border: `1px solid ${formData.accent}40`, borderRadius: '6px', padding: '8px 4px' }}>الاسم</div>}
                {formData.signatureStyle === 'lined' && <div style={{ borderBottom: `1px solid ${formData.accent}`, paddingBottom: '4px' }}>الاسم</div>}
                {formData.signatureStyle === 'stamped' && <div style={{ border: `2px solid ${formData.accent}`, borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: formData.accent }}>ختم</div>}
              </div>
              <div style={{ textAlign: 'center', flex: 1, fontSize: '0.55rem' }}>
                <div style={{ color: '#6B7280', marginBottom: '12px' }}>توقيع الموظف</div>
                {formData.signatureStyle === 'dotted' && <div style={{ borderTop: '2px dotted #D1D5DB', paddingTop: '4px' }}>الاسم</div>}
                {formData.signatureStyle === 'solid' && <div style={{ borderTop: '2px solid #D1D5DB', paddingTop: '4px' }}>الاسم</div>}
                {formData.signatureStyle === 'boxed' && <div style={{ border: `1px solid ${formData.accent}40`, borderRadius: '6px', padding: '8px 4px' }}>الاسم</div>}
                {formData.signatureStyle === 'lined' && <div style={{ borderBottom: `1px solid ${formData.accent}`, paddingBottom: '4px' }}>الاسم</div>}
                {formData.signatureStyle === 'stamped' && <div style={{ border: `2px solid ${formData.accent}`, borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: formData.accent }}>ختم</div>}
              </div>
            </>
          )}
        </div>
        {/* تذييل */}
        <div style={{
          padding: '4px 1.5rem',
          fontSize: '0.5rem',
          color: '#9CA3AF',
          ...(formData.footerStyle === 'gradient' ? { background: `linear-gradient(to left, ${formData.accent}15, transparent)` } : {}),
          ...(formData.footerStyle === 'solid' ? { background: `${formData.accent}10` } : {}),
          ...(formData.footerStyle === 'line' ? { borderTop: `1px solid ${formData.borderColor}` } : {}),
          ...(formData.footerStyle === 'none' ? { display: 'none' } : {}),
        }}>
          SERS - نظام السجلات التعليمية الذكي
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => { setEditingTemplate(null); setShowCreateDialog(false); resetForm(); }}>إلغاء</Button>
        <Button onClick={onSubmit} className="bg-teal-600 hover:bg-teal-700 gap-1.5">
          <Save className="w-4 h-4" />{submitLabel}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">جاري تحميل القوالب...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>إدارة القوالب</h2>
          <p className="text-sm text-gray-500 mt-1">إنشاء وتعديل قوالب تصدير PDF</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            <span className="mr-1">قوالب افتراضية</span>
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowCreateDialog(true); }} className="bg-teal-600 hover:bg-teal-700 gap-1.5">
            <Plus className="w-4 h-4" />إضافة قالب
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <Card className="border-teal-200 shadow-lg">
          <CardHeader className="bg-teal-50/50 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />إنشاء قالب جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TemplateForm onSubmit={handleCreate} submitLabel="إنشاء القالب" />
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50/50 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />تعديل: {editingTemplate.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TemplateForm onSubmit={handleUpdate} submitLabel="حفظ التعديلات" />
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      {!templates || templates.length === 0 ? (
        <div className="text-center py-16">
          <Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">لا توجد قوالب حتى الآن</p>
          <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            إضافة القوالب الافتراضية
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <Card key={t.id} className={`border-0 shadow-sm hover:shadow-md transition-all ${!t.isActive ? "opacity-60" : ""}`}>
              {/* معاينة الألوان */}
              <div className="h-16 rounded-t-xl" style={{ background: t.headerBg }}>
                <div className="h-full flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color: t.headerText }}>{t.name}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {t.isDefault && <Badge className="bg-amber-100 text-amber-700 text-[10px]">افتراضي</Badge>}
                    <Badge className={t.isActive ? "bg-teal-100 text-teal-700 text-[10px]" : "bg-gray-100 text-gray-500 text-[10px]"}>
                      {t.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.accent }} />
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.borderColor }} />
                  </div>
                </div>
                {t.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>}
                {/* عرض التنسيقات */}
                {t.templateLayout && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.templateLayout.layoutType && <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-100">{t.templateLayout.layoutType}</span>}
                    {t.templateLayout.fieldStyle && <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-50 text-purple-600 border border-purple-100">{t.templateLayout.fieldStyle}</span>}
                    {t.templateLayout.titleStyle && <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-600 border border-amber-100">{t.templateLayout.titleStyle}</span>}
                    {t.templateLayout.signatureStyle && <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-50 text-rose-600 border border-rose-100">{t.templateLayout.signatureStyle}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => startEdit(t)}>
                    <Edit3 className="w-3 h-3 ml-1" />تعديل
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8"
                    onClick={() => updateMutation.mutate({ id: t.id, isActive: !t.isActive })}>
                    {t.isActive ? <ToggleRight className="w-4 h-4 text-teal-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8 text-red-500 hover:text-red-700"
                    onClick={() => { if (confirm("هل أنت متأكد من حذف هذا القالب؟")) deleteMutation.mutate({ id: t.id }); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── مكون إدارة ملفات الإنجاز ────────────────────────────
function PortfoliosPanel() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewDialog, setReviewDialog] = useState<{ id: number; action: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  const { data: portfoliosData, isLoading, refetch } = trpc.admin.portfolios.useQuery(
    { page, limit: 20, status: statusFilter },
    { enabled: user?.role === "admin" }
  );

  const reviewMutation = trpc.admin.review.useMutation({
    onSuccess: () => { refetch(); setReviewDialog(null); setReviewNotes(""); toast.success("تم تحديث حالة الملف"); },
    onError: () => toast.error("فشل تحديث الحالة"),
  });

  const { data: portfolioDetail } = trpc.admin.portfolioDetail.useQuery(
    { id: selectedPortfolioId! },
    { enabled: !!selectedPortfolioId }
  );

  const items = portfoliosData?.items || [];
  const total = portfoliosData?.total || 0;

  // حساب الإحصائيات من البيانات المتاحة
  const stats = useMemo(() => {
    const s = { draft: 0, submitted: 0, reviewed: 0, approved: 0, rejected: 0 };
    items.forEach((item: any) => {
      if (item.status in s) (s as any)[item.status]++;
    });
    return s;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item: any) =>
      (item.userName || "").toLowerCase().includes(q) ||
      (item.userEmail || "").toLowerCase().includes(q) ||
      (item.jobTitle || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleReview = (action: string) => {
    if (!reviewDialog) return;
    reviewMutation.mutate({
      portfolioId: reviewDialog.id,
      status: action as any,
      notes: reviewNotes,
    });
  };

  // عرض تفاصيل ملف إنجاز
  if (selectedPortfolioId && portfolioDetail) {
    const p = portfolioDetail;
    const personalInfo = (p.personalInfo || {}) as Record<string, string>;
    return (
      <div>
        <Button variant="outline" size="sm" onClick={() => setSelectedPortfolioId(null)} className="mb-4 gap-1.5">
          <ArrowLeft className="w-4 h-4" />العودة
        </Button>
        <Card className="border-0 shadow-sm mb-4">
          <CardHeader>
            <CardTitle className="text-sm">بيانات المعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(personalInfo).map(([key, val]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">{key}</p>
                  <p className="text-sm font-medium text-gray-900">{val || "—"}</p>
                </div>
              ))}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-0.5">الوظيفة</p>
                <p className="text-sm font-medium text-gray-900">{JOB_TITLES[p.jobId] || p.jobTitle}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-0.5">نسبة الإكمال</p>
                <p className="text-sm font-medium text-gray-900">{p.completionPercentage || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(p as any).files && (p as any).files.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">الملفات المرفوعة ({(p as any).files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(p as any).files.map((file: any) => (
                  <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm truncate">{file.originalName}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{total}</div>
              <p className="text-xs text-gray-500">إجمالي</p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(STATUS_MAP).slice(1, 4).map(([key, val]) => {
          const count = (stats as any)[key] || 0;
          const StatusIcon = val.icon;
          return (
            <Card key={key} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${val.bg.split(" ")[0]}`}>
                  <StatusIcon className={`w-5 h-5 ${val.bg.split(" ")[1]}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{count}</div>
                  <p className="text-xs text-gray-500">{val.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* بحث وفلترة */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الوظيفة..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant={!statusFilter ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(undefined)}>الكل</Button>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <Button key={key} variant={statusFilter === key ? "default" : "outline"} size="sm"
                  onClick={() => setStatusFilter(key)}>{val.label}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الملفات */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">جاري التحميل...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد ملفات إنجاز</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item: any) => {
            const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPortfolioId(item.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{item.userName || "بدون اسم"}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{JOB_TITLES[item.jobId] || item.jobTitle}</span>
                          <span>·</span>
                          <span>{item.userEmail || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{item.completionPercentage || 0}%</p>
                        <p className="text-[10px] text-gray-500">اكتمال</p>
                      </div>
                      <Badge className={statusInfo.bg}>
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {statusInfo.label}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); setSelectedPortfolioId(item.id); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {item.status === "submitted" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600"
                              onClick={(e) => { e.stopPropagation(); setReviewDialog({ id: item.id, action: "approved" }); }}>
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                              onClick={(e) => { e.stopPropagation(); setReviewDialog({ id: item.id, action: "rejected" }); }}>
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.reviewNotes && (
                    <div className="mt-3 mr-15 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600"><MessageSquare className="w-3 h-3 inline ml-1" />{item.reviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="text-sm text-gray-500">صفحة {page} من {Math.ceil(total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.action === "approved" ? "اعتماد ملف الإنجاز" : "رفض ملف الإنجاز"}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.action === "approved"
                ? "هل أنت متأكد من اعتماد هذا الملف؟"
                : "هل أنت متأكد من رفض هذا الملف؟ يرجى إضافة ملاحظات توضيحية."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات المراجعة (اختياري)</label>
            <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="أضف ملاحظاتك هنا..." rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialog(null)}>إلغاء</Button>
            <Button onClick={() => handleReview(reviewDialog?.action || "reviewed")}
              disabled={reviewMutation.isPending}
              className={reviewDialog?.action === "approved" ? "bg-teal-600 hover:bg-teal-700" : "bg-red-600 hover:bg-red-700"}>
              {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {reviewDialog?.action === "approved" ? "اعتماد" : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── مكون الإعدادات ────────────────────────────
function SettingsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>الإعدادات</h2>
        <p className="text-sm text-gray-500 mt-1">إعدادات النظام العامة</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            إعدادات عامة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">معلومات النظام</p>
                <p className="text-xs text-blue-600 mt-1">
                  النظام يدعم تعدد المستخدمين مع فصل كامل للبيانات. كل مستخدم يرى بياناته فقط.
                  المدير يمكنه مراجعة جميع الملفات واعتمادها أو رفضها.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">صلاحيات المستخدمين</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />رفع وإدارة الشواهد</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />تصدير PDF بقوالب متعددة</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />مشاركة الملف برابط</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />التصنيف الذكي بالذكاء الاصطناعي</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">صلاحيات المدير</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />مراجعة جميع الملفات</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />اعتماد أو رفض الملفات</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />إدارة القوالب والثيمات</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-500" />عرض إحصائيات النظام</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── المكون الرئيسي ────────────────────────────
export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("portfolios");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              صلاحية غير كافية
            </h1>
            <p className="text-sm text-gray-500 mb-6">هذه الصفحة متاحة للمديرين فقط</p>
            <Button onClick={() => navigate("/")} className="bg-teal-600 hover:bg-teal-700">العودة للرئيسية</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TABS: { id: AdminTab; label: string; icon: any; description: string }[] = [
    { id: "portfolios", label: "ملفات الإنجاز", icon: FileText, description: "مراجعة واعتماد الملفات" },
    { id: "templates", label: "القوالب", icon: Palette, description: "إدارة قوالب PDF" },
    { id: "settings", label: "الإعدادات", icon: Settings, description: "إعدادات النظام" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-50 transition-all duration-300 flex flex-col
        ${mobileSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>لوحة الإدارة</h1>
                <p className="text-[10px] text-gray-500">SERS Admin</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400">
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${isActive ? "bg-teal-50 text-teal-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}
                  ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? tab.label : undefined}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-teal-600" : "text-gray-400"}`} />
                {!sidebarCollapsed && (
                  <div className="text-right flex-1">
                    <span className="block">{tab.label}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">{tab.description}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <button onClick={() => navigate("/")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all
              ${sidebarCollapsed ? "justify-center" : ""}`}>
            <ArrowLeft className="w-4 h-4" />
            {!sidebarCollapsed && <span>العودة للموقع</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:mr-16" : "lg:mr-64"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-gray-600">
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.name || "مدير"}
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {activeTab === "portfolios" && <PortfoliosPanel />}
          {activeTab === "templates" && <TemplatesPanel />}
          {activeTab === "settings" && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}
