/*
 * مركز التقارير الشامل
 * يتيح إنشاء تقارير متنوعة: أداء الطلاب، تقارير إدارية، تقارير الأنشطة
 * مع قوالب جاهزة وتصدير PDF
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Plus, Trash2, Download, Eye, Save,
  BarChart3, Users, Calendar, ClipboardCheck, TrendingUp,
  Building2, BookOpen, Star, Filter, Search, X, Edit3,
  ChevronDown, ChevronUp, Sparkles, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Report types
type ReportType = "student-performance" | "teacher-activity" | "admin-weekly" | "department" | "custom";

interface ReportTemplate {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  fields: ReportField[];
}

interface ReportField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "number" | "table";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface SavedReport {
  id: string;
  templateId: ReportType;
  title: string;
  data: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "student-performance",
    title: "تقرير أداء الطلاب",
    description: "تقرير شامل عن مستوى أداء الطلاب في المادة",
    icon: Users,
    color: "#0d9488",
    fields: [
      { id: "subject", label: "المادة", type: "text", placeholder: "اسم المادة", required: true },
      { id: "class", label: "الصف / الفصل", type: "text", placeholder: "مثال: ثالث متوسط - أ", required: true },
      { id: "semester", label: "الفصل الدراسي", type: "select", options: ["الأول", "الثاني", "الثالث"], required: true },
      { id: "year", label: "العام الدراسي", type: "text", placeholder: "1446هـ" },
      { id: "totalStudents", label: "عدد الطلاب", type: "number", placeholder: "30" },
      { id: "excellentCount", label: "عدد المتفوقين", type: "number", placeholder: "5" },
      { id: "failCount", label: "عدد المتعثرين", type: "number", placeholder: "3" },
      { id: "average", label: "متوسط الدرجات", type: "number", placeholder: "78" },
      { id: "strengths", label: "نقاط القوة", type: "textarea", placeholder: "أبرز نقاط القوة لدى الطلاب..." },
      { id: "weaknesses", label: "نقاط الضعف", type: "textarea", placeholder: "أبرز نقاط الضعف والتحديات..." },
      { id: "recommendations", label: "التوصيات", type: "textarea", placeholder: "التوصيات والمقترحات لتحسين الأداء..." },
    ],
  },
  {
    id: "teacher-activity",
    title: "تقرير النشاط المهني",
    description: "توثيق الأنشطة والإنجازات المهنية للمعلم",
    icon: Star,
    color: "#7c3aed",
    fields: [
      { id: "teacherName", label: "اسم المعلم", type: "text", required: true },
      { id: "period", label: "الفترة", type: "text", placeholder: "من - إلى" },
      { id: "trainings", label: "الدورات التدريبية", type: "textarea", placeholder: "الدورات التي حضرها أو قدمها..." },
      { id: "activities", label: "الأنشطة المنفذة", type: "textarea", placeholder: "الأنشطة الصفية واللاصفية..." },
      { id: "innovations", label: "المبادرات والابتكارات", type: "textarea", placeholder: "أي مبادرات أو أفكار إبداعية..." },
      { id: "challenges", label: "التحديات", type: "textarea", placeholder: "التحديات التي واجهها..." },
      { id: "goals", label: "الأهداف المستقبلية", type: "textarea", placeholder: "الأهداف للفترة القادمة..." },
    ],
  },
  {
    id: "admin-weekly",
    title: "التقرير الإداري الأسبوعي",
    description: "تقرير أسبوعي عن سير العمل في المدرسة",
    icon: Building2,
    color: "#ea580c",
    fields: [
      { id: "school", label: "المدرسة", type: "text", required: true },
      { id: "weekDate", label: "الأسبوع", type: "text", placeholder: "من الأحد XX إلى الخميس XX" },
      { id: "attendance", label: "نسبة الحضور", type: "text", placeholder: "95%" },
      { id: "events", label: "الفعاليات والأنشطة", type: "textarea", placeholder: "الفعاليات التي تمت خلال الأسبوع..." },
      { id: "issues", label: "الملاحظات والمشكلات", type: "textarea", placeholder: "أي ملاحظات أو مشكلات..." },
      { id: "decisions", label: "القرارات المتخذة", type: "textarea", placeholder: "القرارات الإدارية..." },
      { id: "nextWeek", label: "خطة الأسبوع القادم", type: "textarea", placeholder: "ما هو مخطط للأسبوع القادم..." },
    ],
  },
  {
    id: "department",
    title: "تقرير القسم / الشعبة",
    description: "تقرير دوري عن أداء القسم التعليمي",
    icon: BookOpen,
    color: "#2563eb",
    fields: [
      { id: "deptName", label: "اسم القسم", type: "text", required: true },
      { id: "head", label: "رئيس القسم", type: "text" },
      { id: "period", label: "الفترة", type: "text", placeholder: "الفصل الدراسي / الشهر" },
      { id: "teacherCount", label: "عدد المعلمين", type: "number" },
      { id: "meetings", label: "الاجتماعات المنعقدة", type: "textarea", placeholder: "ملخص الاجتماعات..." },
      { id: "achievements", label: "الإنجازات", type: "textarea", placeholder: "إنجازات القسم..." },
      { id: "plans", label: "الخطط المستقبلية", type: "textarea", placeholder: "خطط القسم القادمة..." },
    ],
  },
  {
    id: "custom",
    title: "تقرير مخصص",
    description: "إنشاء تقرير بحقول مخصصة حسب الحاجة",
    icon: Edit3,
    color: "#64748b",
    fields: [
      { id: "title", label: "عنوان التقرير", type: "text", required: true },
      { id: "date", label: "التاريخ", type: "text" },
      { id: "content", label: "المحتوى", type: "textarea", placeholder: "اكتب محتوى التقرير هنا..." },
      { id: "notes", label: "ملاحظات", type: "textarea" },
    ],
  },
];

const STORAGE_KEY = "sers-reports";

function loadReports(): SavedReport[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveReports(reports: SavedReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function ReportCenter() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"templates" | "editor" | "saved">("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [currentReport, setCurrentReport] = useState<SavedReport | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [savedReports, setSavedReports] = useState<SavedReport[]>(loadReports);
  const [searchQuery, setSearchQuery] = useState("");

  const startNewReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setCurrentReport(null);
    setView("editor");
  };

  const editReport = (report: SavedReport) => {
    const template = REPORT_TEMPLATES.find((t) => t.id === report.templateId);
    if (!template) return;
    setSelectedTemplate(template);
    setFormData(report.data);
    setCurrentReport(report);
    setView("editor");
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    const title = formData.title || formData.subject || formData.teacherName || formData.school || formData.deptName || selectedTemplate.title;
    const now = Date.now();

    if (currentReport) {
      // Update existing
      const updated = savedReports.map((r) =>
        r.id === currentReport.id ? { ...r, title, data: formData, updatedAt: now } : r
      );
      setSavedReports(updated);
      saveReports(updated);
      setCurrentReport({ ...currentReport, title, data: formData, updatedAt: now });
      toast.success("تم تحديث التقرير بنجاح");
    } else {
      // Create new
      const newReport: SavedReport = {
        id: generateId(),
        templateId: selectedTemplate.id,
        title,
        data: formData,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newReport, ...savedReports];
      setSavedReports(updated);
      saveReports(updated);
      setCurrentReport(newReport);
      toast.success("تم حفظ التقرير بنجاح");
    }
  };

  const handleDelete = (id: string) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    saveReports(updated);
    toast.success("تم حذف التقرير");
  };

  const handleExportPDF = () => {
    toast.info("التصدير قيد التطوير", { description: "سيتوفر تصدير PDF قريباً إن شاء الله" });
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return savedReports;
    const q = searchQuery.toLowerCase();
    return savedReports.filter((r) =>
      r.title.toLowerCase().includes(q) || r.templateId.includes(q)
    );
  }, [savedReports, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="w-full bg-gradient-to-l from-blue-700 via-blue-600 to-blue-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                مركز التقارير
              </h1>
              <p className="text-white/80 text-sm mt-1">إنشاء وإدارة التقارير التعليمية والإدارية</p>
            </div>
          </div>
          {/* View tabs */}
          <div className="flex items-center gap-2 mt-4">
            {[
              { id: "templates" as const, label: "قوالب جديدة", icon: Plus },
              { id: "saved" as const, label: `التقارير المحفوظة (${savedReports.length})`, icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === tab.id || (view === "editor" && tab.id === "templates")
                      ? "bg-white text-blue-700"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {/* Templates View */}
          {view === "templates" && (
            <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                اختر نوع التقرير
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <motion.button
                      key={template.id}
                      whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                      onClick={() => startNewReport(template)}
                      className="bg-white rounded-xl border border-gray-100 p-5 text-right transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: template.color + "12" }}>
                        <Icon className="w-6 h-6" style={{ color: template.color }} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        {template.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
                      <div className="mt-3 text-xs font-medium flex items-center gap-1" style={{ color: template.color }}>
                        <Plus className="w-3 h-3" /> إنشاء تقرير جديد
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Editor View */}
          {view === "editor" && selectedTemplate && (
            <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView("templates")} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {selectedTemplate.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSave} variant="outline" size="sm" className="gap-1">
                    <Save className="w-4 h-4" /> حفظ
                  </Button>
                  <Button onClick={handleExportPDF} size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4" /> تصدير PDF
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.id} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={formData[field.id] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={formData[field.id] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">اختر...</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={formData[field.id] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Saved Reports View */}
          {view === "saved" && (
            <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  التقارير المحفوظة
                </h2>
                <div className="relative w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">لا توجد تقارير محفوظة</p>
                  <Button onClick={() => setView("templates")} variant="outline" size="sm" className="mt-3 gap-1">
                    <Plus className="w-4 h-4" /> إنشاء تقرير جديد
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((report) => {
                    const template = REPORT_TEMPLATES.find((t) => t.id === report.templateId);
                    const Icon = template?.icon || FileText;
                    const color = template?.color || "#64748b";
                    return (
                      <motion.div
                        key={report.id}
                        whileHover={{ y: -1 }}
                        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "12" }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-sm">{report.title}</h3>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                              <span>{template?.title}</span>
                              <span>·</span>
                              <span>{new Date(report.updatedAt).toLocaleDateString("ar-SA")}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={() => editReport(report)} variant="outline" size="sm" className="gap-1">
                            <Edit3 className="w-3 h-3" /> تعديل
                          </Button>
                          <Button onClick={() => handleDelete(report.id)} variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-600">
                            <Trash2 className="w-3 h-3" /> حذف
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
