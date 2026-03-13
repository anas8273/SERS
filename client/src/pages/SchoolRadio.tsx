/*
 * صانع الإذاعة المدرسية
 * يتيح إنشاء برنامج إذاعة مدرسية متكامل مع فقرات متنوعة
 * دعم AI لتوليد المحتوى + قوالب جاهزة + تصدير PDF
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Radio, Plus, Trash2, Download, Save, Edit3,
  GripVertical, ChevronDown, ChevronUp, Sparkles, BookOpen,
  Mic, Music, Quote, Star, Heart, Lightbulb, Clock, Search,
  Copy, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RadioSegment {
  id: string;
  type: SegmentType;
  title: string;
  content: string;
  presenter?: string;
}

type SegmentType = "quran" | "hadith" | "wisdom" | "poem" | "info" | "news" | "dua" | "custom";

interface SavedRadio {
  id: string;
  title: string;
  date: string;
  theme: string;
  segments: RadioSegment[];
  createdAt: number;
}

const SEGMENT_TYPES: { id: SegmentType; label: string; icon: React.ComponentType<any>; color: string; defaultTitle: string }[] = [
  { id: "quran", label: "القرآن الكريم", icon: BookOpen, color: "#0d9488", defaultTitle: "آيات من الذكر الحكيم" },
  { id: "hadith", label: "الحديث الشريف", icon: Star, color: "#7c3aed", defaultTitle: "من السنة النبوية" },
  { id: "wisdom", label: "حكمة اليوم", icon: Lightbulb, color: "#ea580c", defaultTitle: "حكمة اليوم" },
  { id: "poem", label: "فقرة شعرية", icon: Quote, color: "#2563eb", defaultTitle: "أبيات شعرية" },
  { id: "info", label: "هل تعلم", icon: Sparkles, color: "#059669", defaultTitle: "هل تعلم؟" },
  { id: "news", label: "أخبار المدرسة", icon: Radio, color: "#dc2626", defaultTitle: "أخبار المدرسة" },
  { id: "dua", label: "دعاء", icon: Heart, color: "#8b5cf6", defaultTitle: "دعاء الختام" },
  { id: "custom", label: "فقرة مخصصة", icon: Edit3, color: "#64748b", defaultTitle: "فقرة مخصصة" },
];

const RADIO_THEMES = [
  "العلم والمعرفة", "الأخلاق والقيم", "الوطن والانتماء", "البيئة والصحة",
  "التقنية والابتكار", "اليوم الوطني", "يوم المعلم", "بداية العام الدراسي",
  "الاختبارات والاستعداد", "السلامة المرورية", "حقوق الطفل", "مخصص",
];

const STORAGE_KEY = "sers-radio-programs";

function loadPrograms(): SavedRadio[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function savePrograms(programs: SavedRadio[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function SchoolRadio() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"list" | "editor">("list");
  const [programs, setPrograms] = useState<SavedRadio[]>(loadPrograms);
  const [currentProgram, setCurrentProgram] = useState<SavedRadio | null>(null);
  const [title, setTitle] = useState("الإذاعة المدرسية");
  const [date, setDate] = useState("");
  const [theme, setTheme] = useState("العلم والمعرفة");
  const [segments, setSegments] = useState<RadioSegment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const startNew = () => {
    setTitle("الإذاعة المدرسية");
    setDate("");
    setTheme("العلم والمعرفة");
    setSegments([
      { id: generateId(), type: "quran", title: "آيات من الذكر الحكيم", content: "", presenter: "" },
      { id: generateId(), type: "hadith", title: "من السنة النبوية", content: "", presenter: "" },
      { id: generateId(), type: "wisdom", title: "حكمة اليوم", content: "", presenter: "" },
      { id: generateId(), type: "info", title: "هل تعلم؟", content: "", presenter: "" },
      { id: generateId(), type: "dua", title: "دعاء الختام", content: "", presenter: "" },
    ]);
    setCurrentProgram(null);
    setView("editor");
  };

  const editProgram = (prog: SavedRadio) => {
    setTitle(prog.title);
    setDate(prog.date);
    setTheme(prog.theme);
    setSegments(prog.segments);
    setCurrentProgram(prog);
    setView("editor");
  };

  const addSegment = (type: SegmentType) => {
    const segType = SEGMENT_TYPES.find((s) => s.id === type);
    if (!segType) return;
    setSegments([...segments, {
      id: generateId(),
      type,
      title: segType.defaultTitle,
      content: "",
      presenter: "",
    }]);
  };

  const updateSegment = (id: string, field: keyof RadioSegment, value: string) => {
    setSegments(segments.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter((s) => s.id !== id));
  };

  const moveSegment = (index: number, dir: "up" | "down") => {
    const newSegments = [...segments];
    const targetIndex = dir === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSegments.length) return;
    [newSegments[index], newSegments[targetIndex]] = [newSegments[targetIndex], newSegments[index]];
    setSegments(newSegments);
  };

  const handleSave = () => {
    const now = Date.now();
    if (currentProgram) {
      const updated = programs.map((p) =>
        p.id === currentProgram.id ? { ...p, title, date, theme, segments, createdAt: now } : p
      );
      setPrograms(updated);
      savePrograms(updated);
      setCurrentProgram({ ...currentProgram, title, date, theme, segments, createdAt: now });
      toast.success("تم تحديث البرنامج بنجاح");
    } else {
      const newProg: SavedRadio = { id: generateId(), title, date, theme, segments, createdAt: now };
      const updated = [newProg, ...programs];
      setPrograms(updated);
      savePrograms(updated);
      setCurrentProgram(newProg);
      toast.success("تم حفظ البرنامج بنجاح");
    }
  };

  const handleDelete = (id: string) => {
    const updated = programs.filter((p) => p.id !== id);
    setPrograms(updated);
    savePrograms(updated);
    toast.success("تم حذف البرنامج");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const exportAsText = () => {
    let text = `${title}\n`;
    text += `التاريخ: ${date || "---"}\n`;
    text += `الموضوع: ${theme}\n`;
    text += "═".repeat(40) + "\n\n";
    segments.forEach((seg, i) => {
      text += `${i + 1}. ${seg.title}`;
      if (seg.presenter) text += ` (تقديم: ${seg.presenter})`;
      text += "\n";
      if (seg.content) text += `${seg.content}\n`;
      text += "\n";
    });
    copyToClipboard(text);
    toast.success("تم نسخ البرنامج كاملاً");
  };

  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return programs;
    const q = searchQuery.toLowerCase();
    return programs.filter((p) => p.title.includes(q) || p.theme.includes(q));
  }, [programs, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="w-full bg-gradient-to-l from-red-700 via-red-600 to-orange-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                صانع الإذاعة المدرسية
              </h1>
              <p className="text-white/80 text-sm mt-1">إنشاء برنامج إذاعة مدرسية متكامل بسهولة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  برامج الإذاعة
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                  <Button onClick={startNew} className="gap-1 bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4" /> إذاعة جديدة
                  </Button>
                </div>
              </div>

              {filteredPrograms.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">لا توجد برامج إذاعة محفوظة</p>
                  <Button onClick={startNew} variant="outline" size="sm" className="mt-3 gap-1">
                    <Plus className="w-4 h-4" /> إنشاء إذاعة جديدة
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPrograms.map((prog) => (
                    <motion.div
                      key={prog.id}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-xl border border-gray-100 p-5 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{prog.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {prog.theme} · {prog.segments.length} فقرات · {new Date(prog.createdAt).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editProgram(prog)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(prog.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {prog.segments.slice(0, 5).map((seg) => {
                          const segType = SEGMENT_TYPES.find((s) => s.id === seg.type);
                          return (
                            <span key={seg.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: (segType?.color || "#64748b") + "12", color: segType?.color }}>
                              {seg.title}
                            </span>
                          );
                        })}
                        {prog.segments.length > 5 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                            +{prog.segments.length - 5}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "editor" && (
            <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Editor header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">العودة للقائمة</span>
                </button>
                <div className="flex items-center gap-2">
                  <Button onClick={exportAsText} variant="outline" size="sm" className="gap-1">
                    <Copy className="w-4 h-4" /> نسخ الكل
                  </Button>
                  <Button onClick={handleSave} size="sm" className="gap-1 bg-red-600 hover:bg-red-700">
                    <Save className="w-4 h-4" /> حفظ
                  </Button>
                </div>
              </div>

              {/* Program info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">عنوان الإذاعة</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">التاريخ</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="مثال: الأحد 1446/5/15"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">الموضوع</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      {RADIO_THEMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Segments */}
              <div className="space-y-3 mb-4">
                {segments.map((seg, index) => {
                  const segType = SEGMENT_TYPES.find((s) => s.id === seg.type);
                  const Icon = segType?.icon || Edit3;
                  const color = segType?.color || "#64748b";
                  return (
                    <motion.div
                      key={seg.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100" style={{ backgroundColor: color + "06" }}>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveSegment(index, "up")} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveSegment(index, "down")} disabled={index === segments.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{index + 1}</span>
                        <input
                          type="text"
                          value={seg.title}
                          onChange={(e) => updateSegment(seg.id, "title", e.target.value)}
                          className="flex-1 bg-transparent text-sm font-bold text-gray-800 focus:outline-none"
                          style={{ fontFamily: "'Tajawal', sans-serif" }}
                        />
                        <input
                          type="text"
                          value={seg.presenter || ""}
                          onChange={(e) => updateSegment(seg.id, "presenter", e.target.value)}
                          placeholder="اسم المقدم"
                          className="w-32 bg-white/80 px-2 py-1 rounded-md text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <button onClick={() => removeSegment(seg.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <textarea
                          value={seg.content}
                          onChange={(e) => updateSegment(seg.id, "content", e.target.value)}
                          placeholder="اكتب محتوى الفقرة هنا..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                        />
                        {seg.content && (
                          <button onClick={() => copyToClipboard(seg.content)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> نسخ المحتوى
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add segment */}
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">إضافة فقرة جديدة:</p>
                <div className="flex flex-wrap gap-2">
                  {SEGMENT_TYPES.map((segType) => {
                    const Icon = segType.icon;
                    return (
                      <button
                        key={segType.id}
                        onClick={() => addSegment(segType.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-gray-300 transition-colors"
                        style={{ color: segType.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {segType.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
