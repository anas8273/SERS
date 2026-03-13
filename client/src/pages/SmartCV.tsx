/*
 * السيرة الذاتية الذكية
 * إنشاء سيرة ذاتية احترافية للمعلم/الإداري
 * مع قوالب متعددة وتصدير PDF
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, Plus, Trash2, Download, Save, Edit3,
  Briefcase, GraduationCap, Award, Phone, Mail, MapPin,
  Calendar, Star, BookOpen, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CVData {
  name: string;
  title: string;
  phone: string;
  email: string;
  city: string;
  summary: string;
  experience: CVEntry[];
  education: CVEntry[];
  skills: string[];
  courses: CVEntry[];
  achievements: string[];
}

interface CVEntry {
  id: string;
  title: string;
  organization: string;
  period: string;
  description: string;
}

const STORAGE_KEY = "sers-cv-data";

function loadCV(): CVData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    name: "", title: "", phone: "", email: "", city: "", summary: "",
    experience: [], education: [], skills: [], courses: [], achievements: [],
  };
}

function saveCV(data: CVData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

type CVTemplate = "classic" | "modern" | "minimal";

const TEMPLATES: { id: CVTemplate; label: string; color: string }[] = [
  { id: "classic", label: "كلاسيكي", color: "#1e3a5f" },
  { id: "modern", label: "عصري", color: "#0d9488" },
  { id: "minimal", label: "بسيط", color: "#374151" },
];

export default function SmartCV() {
  const [, navigate] = useLocation();
  const [cvData, setCvData] = useState<CVData>(loadCV);
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate>("classic");
  const [activeSection, setActiveSection] = useState<string>("personal");

  const updateField = (field: keyof CVData, value: any) => {
    setCvData((prev) => ({ ...prev, [field]: value }));
  };

  const addEntry = (field: "experience" | "education" | "courses") => {
    const newEntry: CVEntry = { id: generateId(), title: "", organization: "", period: "", description: "" };
    updateField(field, [...cvData[field], newEntry]);
  };

  const updateEntry = (field: "experience" | "education" | "courses", id: string, key: keyof CVEntry, value: string) => {
    updateField(field, cvData[field].map((e) => e.id === id ? { ...e, [key]: value } : e));
  };

  const removeEntry = (field: "experience" | "education" | "courses", id: string) => {
    updateField(field, cvData[field].filter((e) => e.id !== id));
  };

  const addSkill = () => {
    updateField("skills", [...cvData.skills, ""]);
  };

  const updateSkill = (index: number, value: string) => {
    const updated = [...cvData.skills];
    updated[index] = value;
    updateField("skills", updated);
  };

  const removeSkill = (index: number) => {
    updateField("skills", cvData.skills.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    updateField("achievements", [...cvData.achievements, ""]);
  };

  const updateAchievement = (index: number, value: string) => {
    const updated = [...cvData.achievements];
    updated[index] = value;
    updateField("achievements", updated);
  };

  const removeAchievement = (index: number) => {
    updateField("achievements", cvData.achievements.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    saveCV(cvData);
    toast.success("تم حفظ السيرة الذاتية بنجاح");
  };

  const handleExport = () => {
    toast.info("التصدير قيد التطوير", { description: "سيتوفر تصدير PDF قريباً إن شاء الله" });
  };

  const sections = [
    { id: "personal", label: "البيانات الشخصية", icon: User },
    { id: "experience", label: "الخبرات", icon: Briefcase },
    { id: "education", label: "المؤهلات", icon: GraduationCap },
    { id: "skills", label: "المهارات", icon: Star },
    { id: "courses", label: "الدورات", icon: BookOpen },
    { id: "achievements", label: "الإنجازات", icon: Award },
  ];

  const templateColor = TEMPLATES.find((t) => t.id === selectedTemplate)?.color || "#1e3a5f";

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="w-full bg-gradient-to-l from-slate-800 via-slate-700 to-slate-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  السيرة الذاتية الذكية
                </h1>
                <p className="text-white/80 text-sm mt-1">إنشاء سيرة ذاتية احترافية بسهولة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} variant="outline" size="sm" className="gap-1 text-white border-white/30 hover:bg-white/10">
                <Save className="w-4 h-4" /> حفظ
              </Button>
              <Button onClick={handleExport} size="sm" className="gap-1 bg-white text-slate-800 hover:bg-gray-100">
                <Download className="w-4 h-4" /> تصدير PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Template selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">اختر القالب:</p>
              <div className="flex gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTemplate === t.id
                        ? "text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    style={selectedTemplate === t.id ? { backgroundColor: t.color } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex flex-wrap gap-1.5">
              {sections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeSection === sec.id
                        ? "bg-slate-800 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* Section content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="bg-white rounded-xl border border-gray-200 p-5">
                {activeSection === "personal" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">الاسم الكامل</label>
                      <input type="text" value={cvData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="محمد أحمد العلي" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">المسمى الوظيفي</label>
                      <input type="text" value={cvData.title} onChange={(e) => updateField("title", e.target.value)} placeholder="معلم رياضيات" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">رقم الجوال</label>
                      <input type="text" value={cvData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="05XXXXXXXX" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">البريد الإلكتروني</label>
                      <input type="email" value={cvData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="email@example.com" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">المدينة</label>
                      <input type="text" value={cvData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="الرياض" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">نبذة مختصرة</label>
                      <textarea value={cvData.summary} onChange={(e) => updateField("summary", e.target.value)} placeholder="نبذة مختصرة عن خبراتك وتخصصك..." rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 resize-none" />
                    </div>
                  </div>
                )}

                {(activeSection === "experience" || activeSection === "education" || activeSection === "courses") && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        {sections.find((s) => s.id === activeSection)?.label}
                      </h3>
                      <Button onClick={() => addEntry(activeSection as any)} variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> إضافة
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {cvData[activeSection as "experience" | "education" | "courses"].map((entry) => (
                        <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <input type="text" value={entry.title} onChange={(e) => updateEntry(activeSection as any, entry.id, "title", e.target.value)} placeholder="المسمى / الدرجة" className="flex-1 bg-transparent text-sm font-bold text-gray-800 focus:outline-none" />
                            <button onClick={() => removeEntry(activeSection as any, entry.id)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={entry.organization} onChange={(e) => updateEntry(activeSection as any, entry.id, "organization", e.target.value)} placeholder="الجهة / المؤسسة" className="px-2 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none" />
                            <input type="text" value={entry.period} onChange={(e) => updateEntry(activeSection as any, entry.id, "period", e.target.value)} placeholder="الفترة (من - إلى)" className="px-2 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none" />
                          </div>
                          <textarea value={entry.description} onChange={(e) => updateEntry(activeSection as any, entry.id, "description", e.target.value)} placeholder="وصف مختصر..." rows={2} className="w-full mt-2 px-2 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none resize-none" />
                        </div>
                      ))}
                      {cvData[activeSection as "experience" | "education" | "courses"].length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-6">لا توجد عناصر. اضغط "إضافة" للبدء.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "skills" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Tajawal', sans-serif" }}>المهارات</h3>
                      <Button onClick={addSkill} variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> إضافة
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cvData.skills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 border border-gray-200">
                          <input type="text" value={skill} onChange={(e) => updateSkill(i, e.target.value)} placeholder="مهارة..." className="bg-transparent text-xs w-28 focus:outline-none" />
                          <button onClick={() => removeSkill(i)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "achievements" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Tajawal', sans-serif" }}>الإنجازات</h3>
                      <Button onClick={addAchievement} variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> إضافة
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {cvData.achievements.map((ach, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          <input type="text" value={ach} onChange={(e) => updateAchievement(i, e.target.value)} placeholder="إنجاز أو جائزة..." className="flex-1 px-2 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none" />
                          <button onClick={() => removeAchievement(i)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">معاينة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: templateColor + "12", color: templateColor }}>
                  {TEMPLATES.find((t) => t.id === selectedTemplate)?.label}
                </span>
              </div>
              <div className="p-4 text-[10px] leading-relaxed" style={{ fontFamily: "'Cairo', sans-serif" }}>
                {/* Mini CV preview */}
                <div className="text-center mb-3 pb-3 border-b" style={{ borderColor: templateColor + "30" }}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: templateColor + "12" }}>
                    <User className="w-6 h-6" style={{ color: templateColor }} />
                  </div>
                  <p className="font-bold text-gray-800" style={{ fontSize: "12px" }}>{cvData.name || "الاسم الكامل"}</p>
                  <p className="text-gray-500">{cvData.title || "المسمى الوظيفي"}</p>
                </div>
                {cvData.summary && (
                  <div className="mb-3">
                    <p className="font-bold mb-1" style={{ color: templateColor }}>نبذة</p>
                    <p className="text-gray-600 line-clamp-3">{cvData.summary}</p>
                  </div>
                )}
                {cvData.experience.length > 0 && (
                  <div className="mb-3">
                    <p className="font-bold mb-1" style={{ color: templateColor }}>الخبرات</p>
                    {cvData.experience.slice(0, 3).map((e) => (
                      <p key={e.id} className="text-gray-600">• {e.title || "---"} - {e.organization || "---"}</p>
                    ))}
                  </div>
                )}
                {cvData.skills.length > 0 && (
                  <div className="mb-3">
                    <p className="font-bold mb-1" style={{ color: templateColor }}>المهارات</p>
                    <div className="flex flex-wrap gap-1">
                      {cvData.skills.filter(Boolean).slice(0, 6).map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: templateColor + "12", color: templateColor }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-gray-100 text-center text-gray-400">
                  <p>معاينة مبسطة - التصدير يعطي النسخة الكاملة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
