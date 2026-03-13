/*
 * ملف الإنجاز المهني التفاعلي
 * يتيح للمعلم بناء ملف إنجاز رقمي شامل يجمع:
 * - البيانات الشخصية والمؤهلات
 * - الدورات والشهادات
 * - الإنجازات والجوائز
 * - الأنشطة والمبادرات
 * - شواهد الأداء (ربط مع PerformanceEvidence)
 * - تصدير PDF احترافي
 */
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, GraduationCap, Award, Briefcase,
  BookOpen, Target, FileText, Plus, Trash2, Edit3,
  Download, Eye, Save, ChevronDown, ChevronUp,
  Calendar, MapPin, Building2, Star, Upload, Image,
  Link as LinkIcon, Sparkles, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Types
interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  school: string;
  department: string;
  qualification: string;
  experience: string;
  email: string;
  phone: string;
  photo: string;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  hours: string;
  type: "training" | "academic" | "professional";
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "award" | "initiative" | "project" | "community";
}

interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "school" | "department" | "ministry" | "external";
}

interface PortfolioData {
  personalInfo: PersonalInfo;
  certificates: Certificate[];
  achievements: Achievement[];
  activities: Activity[];
  goals: string[];
  notes: string;
}

type TabId = "personal" | "certificates" | "achievements" | "activities" | "goals" | "preview";

const TABS: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
  { id: "personal", label: "البيانات الشخصية", icon: User },
  { id: "certificates", label: "الدورات والشهادات", icon: GraduationCap },
  { id: "achievements", label: "الإنجازات والجوائز", icon: Award },
  { id: "activities", label: "الأنشطة والمبادرات", icon: Target },
  { id: "goals", label: "الأهداف المهنية", icon: Sparkles },
  { id: "preview", label: "المعاينة والتصدير", icon: Eye },
];

const CERT_TYPES = [
  { value: "training", label: "تدريبية", color: "#0d9488" },
  { value: "academic", label: "أكاديمية", color: "#7c3aed" },
  { value: "professional", label: "مهنية", color: "#ea580c" },
];

const ACHIEVEMENT_CATS = [
  { value: "award", label: "جائزة", color: "#eab308" },
  { value: "initiative", label: "مبادرة", color: "#0d9488" },
  { value: "project", label: "مشروع", color: "#3b82f6" },
  { value: "community", label: "مجتمعي", color: "#ec4899" },
];

const ACTIVITY_TYPES = [
  { value: "school", label: "مدرسي" },
  { value: "department", label: "إداري" },
  { value: "ministry", label: "وزاري" },
  { value: "external", label: "خارجي" },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const STORAGE_KEY = "sers-portfolio-data";

function loadPortfolio(): PortfolioData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    personalInfo: {
      fullName: "", jobTitle: "", school: "", department: "",
      qualification: "", experience: "", email: "", phone: "", photo: "",
    },
    certificates: [],
    achievements: [],
    activities: [],
    goals: [""],
    notes: "",
  };
}

function savePortfolio(data: PortfolioData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function PortfolioBuilder() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [data, setData] = useState<PortfolioData>(loadPortfolio);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const updateData = useCallback((updater: (prev: PortfolioData) => PortfolioData) => {
    setData((prev) => {
      const next = updater(prev);
      savePortfolio(next);
      return next;
    });
  }, []);

  const updatePersonal = (field: keyof PersonalInfo, value: string) => {
    updateData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  // Certificate CRUD
  const addCertificate = () => {
    updateData((prev) => ({
      ...prev,
      certificates: [...prev.certificates, {
        id: generateId(), title: "", issuer: "", date: "", hours: "", type: "training",
      }],
    }));
  };

  const updateCertificate = (id: string, field: keyof Certificate, value: string) => {
    updateData((prev) => ({
      ...prev,
      certificates: prev.certificates.map((c) => c.id === id ? { ...c, [field]: value } : c),
    }));
  };

  const removeCertificate = (id: string) => {
    updateData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((c) => c.id !== id),
    }));
  };

  // Achievement CRUD
  const addAchievement = () => {
    updateData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, {
        id: generateId(), title: "", description: "", date: "", category: "award",
      }],
    }));
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    updateData((prev) => ({
      ...prev,
      achievements: prev.achievements.map((a) => a.id === id ? { ...a, [field]: value } : a),
    }));
  };

  const removeAchievement = (id: string) => {
    updateData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((a) => a.id !== id),
    }));
  };

  // Activity CRUD
  const addActivity = () => {
    updateData((prev) => ({
      ...prev,
      activities: [...prev.activities, {
        id: generateId(), title: "", description: "", date: "", type: "school",
      }],
    }));
  };

  const updateActivity = (id: string, field: keyof Activity, value: string) => {
    updateData((prev) => ({
      ...prev,
      activities: prev.activities.map((a) => a.id === id ? { ...a, [field]: value } : a),
    }));
  };

  const removeActivity = (id: string) => {
    updateData((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== id),
    }));
  };

  // Goals
  const addGoal = () => {
    updateData((prev) => ({ ...prev, goals: [...prev.goals, ""] }));
  };

  const updateGoal = (index: number, value: string) => {
    updateData((prev) => ({
      ...prev,
      goals: prev.goals.map((g, i) => i === index ? value : g),
    }));
  };

  const removeGoal = (index: number) => {
    updateData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    savePortfolio(data);
    toast.success("تم حفظ ملف الإنجاز بنجاح");
  };

  const handleExportPDF = () => {
    toast.info("التصدير قيد التطوير", { description: "سيتوفر تصدير PDF قريباً إن شاء الله" });
  };

  const completionPercentage = (() => {
    let total = 0;
    let filled = 0;
    // Personal info fields
    const fields = Object.values(data.personalInfo);
    total += fields.length;
    filled += fields.filter((v) => v.trim()).length;
    // Certificates
    total += 2;
    filled += data.certificates.length > 0 ? 2 : 0;
    // Achievements
    total += 2;
    filled += data.achievements.length > 0 ? 2 : 0;
    // Activities
    total += 2;
    filled += data.activities.length > 0 ? 2 : 0;
    // Goals
    total += 1;
    filled += data.goals.filter((g) => g.trim()).length > 0 ? 1 : 0;
    return Math.round((filled / total) * 100);
  })();

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="w-full bg-gradient-to-l from-violet-700 via-violet-600 to-violet-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  ملف الإنجاز المهني
                </h1>
                <p className="text-white/80 text-sm mt-1">بناء ملف إنجاز رقمي احترافي شامل</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-black text-white">{completionPercentage}%</div>
                <div className="text-[10px] text-white/70">مكتمل</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-2 sticky top-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                      isActive ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
              <hr className="my-2 border-gray-100" />
              <Button onClick={handleSave} variant="outline" className="w-full text-sm gap-2">
                <Save className="w-4 h-4" /> حفظ
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Personal Info Tab */}
              {activeTab === "personal" && (
                <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      <User className="w-5 h-5 text-violet-600" /> البيانات الشخصية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "fullName" as const, label: "الاسم الكامل", placeholder: "أدخل الاسم الرباعي" },
                        { key: "jobTitle" as const, label: "المسمى الوظيفي", placeholder: "معلم / مشرف / قائد مدرسة" },
                        { key: "school" as const, label: "المدرسة / الجهة", placeholder: "اسم المدرسة أو الجهة" },
                        { key: "department" as const, label: "القسم / التخصص", placeholder: "القسم أو التخصص" },
                        { key: "qualification" as const, label: "المؤهل العلمي", placeholder: "بكالوريوس / ماجستير / دكتوراه" },
                        { key: "experience" as const, label: "سنوات الخبرة", placeholder: "عدد سنوات الخبرة" },
                        { key: "email" as const, label: "البريد الإلكتروني", placeholder: "example@email.com" },
                        { key: "phone" as const, label: "رقم الهاتف", placeholder: "05xxxxxxxx" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={data.personalInfo[field.key]}
                            onChange={(e) => updatePersonal(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Certificates Tab */}
              {activeTab === "certificates" && (
                <motion.div key="certificates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <GraduationCap className="w-5 h-5 text-violet-600" /> الدورات والشهادات ({data.certificates.length})
                      </h2>
                      <Button onClick={addCertificate} size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4" /> إضافة
                      </Button>
                    </div>
                    {data.certificates.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد دورات مضافة بعد</p>
                        <p className="text-xs mt-1">اضغط "إضافة" لإضافة دورة أو شهادة</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.certificates.map((cert, index) => (
                          <div key={cert.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gray-400">شهادة #{index + 1}</span>
                              <div className="flex items-center gap-1">
                                {CERT_TYPES.map((t) => (
                                  <button
                                    key={t.value}
                                    onClick={() => updateCertificate(cert.id, "type", t.value)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                                      cert.type === t.value ? "text-white" : "bg-gray-100 text-gray-500"
                                    }`}
                                    style={cert.type === t.value ? { backgroundColor: t.color } : {}}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                                <button onClick={() => removeCertificate(cert.id)} className="p-1 text-red-400 hover:text-red-600 mr-2">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={cert.title}
                                onChange={(e) => updateCertificate(cert.id, "title", e.target.value)}
                                placeholder="اسم الدورة / الشهادة"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <input
                                type="text"
                                value={cert.issuer}
                                onChange={(e) => updateCertificate(cert.id, "issuer", e.target.value)}
                                placeholder="الجهة المانحة"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <input
                                type="text"
                                value={cert.date}
                                onChange={(e) => updateCertificate(cert.id, "date", e.target.value)}
                                placeholder="التاريخ (مثال: 1445/06)"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <input
                                type="text"
                                value={cert.hours}
                                onChange={(e) => updateCertificate(cert.id, "hours", e.target.value)}
                                placeholder="عدد الساعات"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Achievements Tab */}
              {activeTab === "achievements" && (
                <motion.div key="achievements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <Award className="w-5 h-5 text-violet-600" /> الإنجازات والجوائز ({data.achievements.length})
                      </h2>
                      <Button onClick={addAchievement} size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4" /> إضافة
                      </Button>
                    </div>
                    {data.achievements.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد إنجازات مضافة بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.achievements.map((ach, index) => (
                          <div key={ach.id} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gray-400">إنجاز #{index + 1}</span>
                              <div className="flex items-center gap-1">
                                {ACHIEVEMENT_CATS.map((c) => (
                                  <button
                                    key={c.value}
                                    onClick={() => updateAchievement(ach.id, "category", c.value)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                                      ach.category === c.value ? "text-white" : "bg-gray-100 text-gray-500"
                                    }`}
                                    style={ach.category === c.value ? { backgroundColor: c.color } : {}}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                                <button onClick={() => removeAchievement(ach.id)} className="p-1 text-red-400 hover:text-red-600 mr-2">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={ach.title}
                                onChange={(e) => updateAchievement(ach.id, "title", e.target.value)}
                                placeholder="عنوان الإنجاز"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <input
                                type="text"
                                value={ach.date}
                                onChange={(e) => updateAchievement(ach.id, "date", e.target.value)}
                                placeholder="التاريخ"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <textarea
                                value={ach.description}
                                onChange={(e) => updateAchievement(ach.id, "description", e.target.value)}
                                placeholder="وصف الإنجاز"
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 md:col-span-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Activities Tab */}
              {activeTab === "activities" && (
                <motion.div key="activities" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <Target className="w-5 h-5 text-violet-600" /> الأنشطة والمبادرات ({data.activities.length})
                      </h2>
                      <Button onClick={addActivity} size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4" /> إضافة
                      </Button>
                    </div>
                    {data.activities.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد أنشطة مضافة بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.activities.map((act, index) => (
                          <div key={act.id} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gray-400">نشاط #{index + 1}</span>
                              <div className="flex items-center gap-1">
                                {ACTIVITY_TYPES.map((t) => (
                                  <button
                                    key={t.value}
                                    onClick={() => updateActivity(act.id, "type", t.value)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                                      act.type === t.value ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                                <button onClick={() => removeActivity(act.id)} className="p-1 text-red-400 hover:text-red-600 mr-2">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={act.title}
                                onChange={(e) => updateActivity(act.id, "title", e.target.value)}
                                placeholder="عنوان النشاط"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <input
                                type="text"
                                value={act.date}
                                onChange={(e) => updateActivity(act.id, "date", e.target.value)}
                                placeholder="التاريخ"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                              <textarea
                                value={act.description}
                                onChange={(e) => updateActivity(act.id, "description", e.target.value)}
                                placeholder="وصف النشاط"
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 md:col-span-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Goals Tab */}
              {activeTab === "goals" && (
                <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <Sparkles className="w-5 h-5 text-violet-600" /> الأهداف المهنية ({data.goals.filter(g => g.trim()).length})
                      </h2>
                      <Button onClick={addGoal} size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4" /> إضافة هدف
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {data.goals.map((goal, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-violet-400 shrink-0 w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={goal}
                            onChange={(e) => updateGoal(index, e.target.value)}
                            placeholder="اكتب هدفاً مهنياً..."
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                          />
                          {data.goals.length > 1 && (
                            <button onClick={() => removeGoal(index)} className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات إضافية</label>
                      <textarea
                        value={data.notes}
                        onChange={(e) => updateData((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="أي ملاحظات أو معلومات إضافية..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Preview Tab */}
              {activeTab === "preview" && (
                <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        <Eye className="w-5 h-5 text-violet-600" /> معاينة ملف الإنجاز
                      </h2>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleSave} variant="outline" size="sm" className="gap-1">
                          <Save className="w-4 h-4" /> حفظ
                        </Button>
                        <Button onClick={handleExportPDF} size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700">
                          <Download className="w-4 h-4" /> تصدير PDF
                        </Button>
                      </div>
                    </div>

                    {/* Preview content */}
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                      {/* Personal header */}
                      <div className="bg-violet-600 text-white rounded-xl p-6 mb-6">
                        <h3 className="text-xl font-black" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                          {data.personalInfo.fullName || "الاسم الكامل"}
                        </h3>
                        <p className="text-violet-200 text-sm mt-1">{data.personalInfo.jobTitle || "المسمى الوظيفي"}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-violet-100">
                          {data.personalInfo.school && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {data.personalInfo.school}</span>}
                          {data.personalInfo.qualification && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {data.personalInfo.qualification}</span>}
                          {data.personalInfo.experience && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {data.personalInfo.experience} سنوات خبرة</span>}
                        </div>
                      </div>

                      {/* Certificates preview */}
                      {data.certificates.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-violet-600" /> الدورات والشهادات
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {data.certificates.map((cert) => (
                              <div key={cert.id} className="bg-white rounded-lg p-3 border border-gray-100 text-sm">
                                <p className="font-bold text-gray-800">{cert.title || "—"}</p>
                                <p className="text-xs text-gray-500">{cert.issuer} · {cert.date} · {cert.hours} ساعة</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Achievements preview */}
                      {data.achievements.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-violet-600" /> الإنجازات والجوائز
                          </h4>
                          <div className="space-y-2">
                            {data.achievements.map((ach) => (
                              <div key={ach.id} className="bg-white rounded-lg p-3 border border-gray-100 text-sm">
                                <p className="font-bold text-gray-800">{ach.title || "—"}</p>
                                <p className="text-xs text-gray-500">{ach.description} · {ach.date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activities preview */}
                      {data.activities.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-600" /> الأنشطة والمبادرات
                          </h4>
                          <div className="space-y-2">
                            {data.activities.map((act) => (
                              <div key={act.id} className="bg-white rounded-lg p-3 border border-gray-100 text-sm">
                                <p className="font-bold text-gray-800">{act.title || "—"}</p>
                                <p className="text-xs text-gray-500">{act.description} · {act.date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Goals preview */}
                      {data.goals.filter(g => g.trim()).length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-600" /> الأهداف المهنية
                          </h4>
                          <ul className="space-y-1">
                            {data.goals.filter(g => g.trim()).map((goal, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <Star className="w-3 h-3 text-violet-400 mt-1 shrink-0" />
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
