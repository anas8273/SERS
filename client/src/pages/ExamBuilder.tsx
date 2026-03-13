/*
 * منصة الاختبارات
 * إنشاء اختبارات متنوعة (اختيار من متعدد، صح/خطأ، مقالي)
 * مع تصدير PDF وطباعة
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ClipboardCheck, Plus, Trash2, Download, Save,
  Edit3, Search, Copy, ChevronDown, ChevronUp, Sparkles,
  CheckCircle2, XCircle, HelpCircle, GripVertical, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type QuestionType = "multiple-choice" | "true-false" | "essay" | "fill-blank";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  correctIndex?: number;
}

interface SavedExam {
  id: string;
  title: string;
  subject: string;
  grade: string;
  semester: string;
  duration: string;
  questions: Question[];
  createdAt: number;
}

const QUESTION_TYPES: { id: QuestionType; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: "multiple-choice", label: "اختيار من متعدد", icon: CheckCircle2, color: "#0d9488" },
  { id: "true-false", label: "صح / خطأ", icon: HelpCircle, color: "#7c3aed" },
  { id: "essay", label: "مقالي", icon: Edit3, color: "#ea580c" },
  { id: "fill-blank", label: "أكمل الفراغ", icon: Sparkles, color: "#2563eb" },
];

const STORAGE_KEY = "sers-exams";

function loadExams(): SavedExam[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveExams(exams: SavedExam[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function ExamBuilder() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"list" | "editor">("list");
  const [exams, setExams] = useState<SavedExam[]>(loadExams);
  const [currentExam, setCurrentExam] = useState<SavedExam | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("الأول");
  const [duration, setDuration] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const totalPoints = useMemo(() => questions.reduce((sum, q) => sum + q.points, 0), [questions]);

  const startNew = () => {
    setTitle(""); setSubject(""); setGrade(""); setSemester("الأول"); setDuration("");
    setQuestions([]);
    setCurrentExam(null);
    setView("editor");
  };

  const editExam = (exam: SavedExam) => {
    setTitle(exam.title); setSubject(exam.subject); setGrade(exam.grade);
    setSemester(exam.semester); setDuration(exam.duration);
    setQuestions(exam.questions);
    setCurrentExam(exam);
    setView("editor");
  };

  const addQuestion = (type: QuestionType) => {
    const q: Question = {
      id: generateId(),
      type,
      text: "",
      points: 1,
    };
    if (type === "multiple-choice") {
      q.options = ["", "", "", ""];
      q.correctIndex = 0;
    }
    if (type === "true-false") {
      q.correctAnswer = "صح";
    }
    setQuestions([...questions, q]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: string, index: number, value: string) => {
    setQuestions(questions.map((q) => {
      if (q.id !== qId || !q.options) return q;
      const opts = [...q.options];
      opts[index] = value;
      return { ...q, options: opts };
    }));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index: number, dir: "up" | "down") => {
    const newQ = [...questions];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newQ.length) return;
    [newQ[index], newQ[target]] = [newQ[target], newQ[index]];
    setQuestions(newQ);
  };

  const handleSave = () => {
    const now = Date.now();
    const examTitle = title || `اختبار ${subject}`;
    if (currentExam) {
      const updated = exams.map((e) =>
        e.id === currentExam.id ? { ...e, title: examTitle, subject, grade, semester, duration, questions, createdAt: now } : e
      );
      setExams(updated);
      saveExams(updated);
      setCurrentExam({ ...currentExam, title: examTitle, subject, grade, semester, duration, questions, createdAt: now });
      toast.success("تم تحديث الاختبار بنجاح");
    } else {
      const newExam: SavedExam = { id: generateId(), title: examTitle, subject, grade, semester, duration, questions, createdAt: now };
      const updated = [newExam, ...exams];
      setExams(updated);
      saveExams(updated);
      setCurrentExam(newExam);
      toast.success("تم حفظ الاختبار بنجاح");
    }
  };

  const handleDelete = (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    saveExams(updated);
    toast.success("تم حذف الاختبار");
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = searchQuery.toLowerCase();
    return exams.filter((e) => e.title.includes(q) || e.subject.includes(q));
  }, [exams, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="w-full bg-gradient-to-l from-violet-700 via-violet-600 to-purple-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                منصة الاختبارات
              </h1>
              <p className="text-white/80 text-sm mt-1">إنشاء اختبارات متنوعة بسهولة واحترافية</p>
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
                  الاختبارات
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <Button onClick={startNew} className="gap-1 bg-violet-600 hover:bg-violet-700">
                    <Plus className="w-4 h-4" /> اختبار جديد
                  </Button>
                </div>
              </div>

              {filteredExams.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">لا توجد اختبارات محفوظة</p>
                  <Button onClick={startNew} variant="outline" size="sm" className="mt-3 gap-1">
                    <Plus className="w-4 h-4" /> إنشاء اختبار جديد
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExams.map((exam) => (
                    <motion.div key={exam.id} whileHover={{ y: -2 }} className="bg-white rounded-xl border border-gray-100 p-5 group">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{exam.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {exam.subject} · {exam.grade} · {exam.questions.length} سؤال · {new Date(exam.createdAt).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editExam(exam)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(exam.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUESTION_TYPES.map((qt) => {
                          const count = exam.questions.filter((q) => q.type === qt.id).length;
                          if (count === 0) return null;
                          return (
                            <span key={qt.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: qt.color + "12", color: qt.color }}>
                              {qt.label}: {count}
                            </span>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "editor" && (
            <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <button onClick={() => setView("list")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">العودة للقائمة</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {questions.length} سؤال · {totalPoints} درجة
                  </span>
                  <Button onClick={handleSave} size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700">
                    <Save className="w-4 h-4" /> حفظ
                  </Button>
                </div>
              </div>

              {/* Exam info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">عنوان الاختبار</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اختبار نهائي..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">المادة</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="الرياضيات" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">الصف</label>
                    <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="ثالث متوسط" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">الفصل الدراسي</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                      <option value="الأول">الأول</option>
                      <option value="الثاني">الثاني</option>
                      <option value="الثالث">الثالث</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">مدة الاختبار</label>
                    <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="ساعة ونصف" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3 mb-4">
                {questions.map((q, index) => {
                  const qType = QUESTION_TYPES.find((t) => t.id === q.type);
                  const Icon = qType?.icon || HelpCircle;
                  const color = qType?.color || "#64748b";
                  return (
                    <motion.div key={q.id} layout className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100" style={{ backgroundColor: color + "06" }}>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveQuestion(index, "up")} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveQuestion(index, "down")} disabled={index === questions.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">س{index + 1}</span>
                        <span className="text-xs font-medium" style={{ color }}>{qType?.label}</span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1">
                          <input type="number" value={q.points} onChange={(e) => updateQuestion(q.id, "points", parseInt(e.target.value) || 1)} min={1} className="w-12 px-1 py-0.5 rounded border border-gray-200 text-xs text-center focus:outline-none" />
                          <span className="text-[10px] text-gray-400">درجة</span>
                        </div>
                        <button onClick={() => removeQuestion(q.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <textarea value={q.text} onChange={(e) => updateQuestion(q.id, "text", e.target.value)} placeholder="اكتب نص السؤال هنا..." rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none mb-3" />

                        {q.type === "multiple-choice" && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuestion(q.id, "correctIndex", i)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    q.correctIndex === i ? "border-green-500 bg-green-500 text-white" : "border-gray-300 text-transparent"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </button>
                                <span className="text-xs text-gray-400 w-4">{String.fromCharCode(1571 + i)}</span>
                                <input type="text" value={opt} onChange={(e) => updateOption(q.id, i, e.target.value)} placeholder={`الخيار ${i + 1}`} className="flex-1 px-2 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none" />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === "true-false" && (
                          <div className="flex gap-3">
                            {["صح", "خطأ"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateQuestion(q.id, "correctAnswer", opt)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  q.correctAnswer === opt
                                    ? opt === "صح" ? "bg-green-100 text-green-700 border border-green-300" : "bg-red-100 text-red-700 border border-red-300"
                                    : "bg-gray-50 text-gray-500 border border-gray-200"
                                }`}
                              >
                                {opt === "صح" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === "fill-blank" && (
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1">الإجابة الصحيحة:</label>
                            <input type="text" value={q.correctAnswer || ""} onChange={(e) => updateQuestion(q.id, "correctAnswer", e.target.value)} placeholder="الإجابة..." className="w-full px-2 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add question */}
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">إضافة سؤال جديد:</p>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((qt) => {
                    const Icon = qt.icon;
                    return (
                      <button
                        key={qt.id}
                        onClick={() => addQuestion(qt.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-gray-300 transition-colors"
                        style={{ color: qt.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {qt.label}
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
