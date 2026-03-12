/**
 * صفحة عرض ملف الإنجاز المشارك - موقع مصغر احترافي
 * لا تتطلب تسجيل دخول - عرض إلكتروني تفاعلي
 * بدون باركود - عرض الشواهد كما أضافها المستخدم
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { STANDARDS } from "@/lib/standards-data";
import { getStandardsForJob } from "@/lib/all-jobs-standards";
import {
  Lock, Eye, FileText, Image, Video, LinkIcon, Download,
  CheckCircle, AlertTriangle, XCircle, Loader2, ShieldCheck,
  BarChart3, Calendar, Building2, User, Sparkles, ChevronDown,
  ChevronUp, Award, BookOpen, Printer, Share2, Star, ArrowUp,
  GraduationCap, Briefcase, Hash, MessageSquare, Tag, Layers,
  TrendingUp, Target, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  essential: { label: "أساسي", color: "#059669", icon: "★", bg: "#ECFDF5" },
  supporting: { label: "داعم", color: "#2563EB", icon: "◆", bg: "#EFF6FF" },
  supplementary: { label: "إضافي", color: "#9333EA", icon: "○", bg: "#FAF5FF" },
  additional: { label: "إضافي", color: "#9333EA", icon: "○", bg: "#FAF5FF" },
};

function getGrade(pct: number) {
  if (pct >= 90) return { label: "ممتاز", color: "#16A34A", bg: "#DCFCE7", emoji: "🏆" };
  if (pct >= 80) return { label: "جيد جداً", color: "#2563EB", bg: "#DBEAFE", emoji: "⭐" };
  if (pct >= 70) return { label: "جيد", color: "#CA8A04", bg: "#FEF9C3", emoji: "👍" };
  if (pct >= 60) return { label: "مقبول", color: "#EA580C", bg: "#FED7AA", emoji: "📋" };
  return { label: "ضعيف", color: "#DC2626", bg: "#FEE2E2", emoji: "📌" };
}

function getStandardTitle(criterionId: string, jobId: string): string {
  if (jobId === "teacher") {
    const s = STANDARDS.find(s => s.id === criterionId);
    if (s) return s.title;
  }
  const jobStandards = getStandardsForJob(jobId);
  const s = jobStandards.find(s => s.id === criterionId);
  if (s) return s.title;
  return criterionId;
}

function EvidenceCard({ ev }: { ev: any }) {
  const priority = ev.priority || "essential";
  const pc = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.essential;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all" style={{ borderRightWidth: "4px", borderRightColor: pc.color }}>
      {/* رأس الشاهد */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: pc.bg, color: pc.color }}>
          {pc.icon} {pc.label}
        </span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
          {ev.type === "text" ? "نص" : ev.type === "image" ? "صورة" : ev.type === "link" ? "رابط" : ev.type === "file" ? "ملف" : "فيديو"}
        </span>
      </div>

      {/* المحتوى */}
      {ev.type === "text" && ev.text && (
        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{ev.text}</p>
      )}
      {ev.type === "link" && ev.link && (
        <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
          <LinkIcon className="w-4 h-4 text-purple-500 shrink-0" />
          <a href={ev.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
            {ev.link}
          </a>
        </div>
      )}
      {ev.type === "image" && ev.fileData && (
        <img src={ev.fileData} alt="" className="max-h-64 rounded-lg border border-gray-100 mx-auto" />
      )}
      {(ev.type === "video" || ev.type === "file") && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          {ev.type === "video" ? <Video className="w-5 h-5 text-red-500" /> : <FileText className="w-5 h-5 text-orange-500" />}
          <span className="text-sm text-gray-700 font-medium">{ev.fileName}</span>
        </div>
      )}

      {/* بيانات النموذج - عرض احترافي */}
      {ev.formData && Object.entries(ev.formData).some(([, v]) => v) && (
        <div className="mt-3 bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(ev.formData).filter(([, v]) => v).map(([key, val]) => {
              const fieldLabel = key === 'report_title' ? 'الموضوع' : key === 'evidence_desc' ? 'وصف الشاهد' : key === 'date' ? 'التاريخ' : key === 'notes' ? 'ملاحظات' : key === 'title' ? 'العنوان' : key === 'details' ? 'التفاصيل' : key === 'content' ? 'المحتوى' : key;
              return (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-gray-500 text-[10px] font-medium shrink-0 mt-0.5 min-w-[60px]">{fieldLabel}:</span>
                  <span className="text-gray-800 text-xs leading-relaxed">{val as string}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* التعليق */}
      {ev.comment && ev.comment.trim() && (
        <div className="mt-3 flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-100">
          <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">{ev.comment}</p>
        </div>
      )}

      {/* الكلمات المفتاحية */}
      {ev.keywords && ev.keywords.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-sky-500" />
          {ev.keywords.map((kw: string, ki: number) => (
            <span key={ki} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function CriterionSection({ criterionId, data, index, jobId }: { criterionId: string; data: any; index: number; jobId: string }) {
  const [expanded, setExpanded] = useState(false);
  const evCount = data?.evidences?.length || 0;
  const score = data?.score || 0;
  const status = score >= 4 && evCount > 0 ? "complete" : evCount > 0 || score > 0 ? "partial" : "missing";
  const title = getStandardTitle(criterionId, jobId);

  const statusConfig = {
    complete: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: <CheckCircle className="w-4 h-4 text-teal-500" />, label: "مكتمل" },
    partial: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: "جزئي" },
    missing: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: <XCircle className="w-4 h-4 text-red-400" />, label: "ناقص" },
  };
  const sc = statusConfig[status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
      {/* رأس البند */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${sc.bg} ${sc.text}`}>
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Tajawal', sans-serif" }}>{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
              <span className="text-[10px] text-gray-500">{evCount} شاهد</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= score ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
            ))}
          </div>
          <Badge variant={score >= 4 ? "default" : score >= 3 ? "secondary" : "outline"} className="text-xs">
            {score}/5
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* محتوى الشواهد */}
      {expanded && data?.evidences && data.evidences.length > 0 && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          {data.evidences.map((ev: any) => (
            <EvidenceCard key={ev.id} ev={ev} />
          ))}
        </div>
      )}

      {expanded && (!data?.evidences || data.evidences.length === 0) && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="text-center py-6 text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد شواهد مرفقة لهذا البند</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SharedPortfolio() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data, isLoading, error } = trpc.share.view.useQuery(
    { token, password: submitted ? password : undefined },
    { enabled: !!token, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30" dir="rtl">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
            <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-teal-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: "'Tajawal', sans-serif" }}>جاري تحميل ملف الإنجاز...</p>
          <p className="text-xs text-gray-400 mt-1">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  if (data?.requiresPassword && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-l from-teal-700 to-teal-800 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>ملف إنجاز محمي</h1>
            <p className="text-teal-100 text-sm mt-1">أدخل كلمة المرور للمتابعة</p>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSubmitted(true); }}
                placeholder="كلمة المرور"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-center"
              />
              <Button onClick={() => setSubmitted(true)} className="w-full gap-2 bg-teal-600 hover:bg-teal-700 h-11">
                <ShieldCheck className="w-4 h-4" />
                عرض الملف
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50/30 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>{data.error}</h1>
            <p className="text-sm text-gray-500">
              {data.error.includes("صلاحية") ? "يرجى طلب رابط جديد من صاحب الملف." : "تأكد من صحة الرابط وحاول مرة أخرى."}
            </p>
            {data.requiresPassword && (
              <Button onClick={() => { setSubmitted(false); setPassword(""); }} variant="outline" className="mt-4">إعادة المحاولة</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.portfolio) return null;

  const portfolio = data.portfolio;
  const files = data.files || [];
  const personalInfo = (portfolio.personalInfo || {}) as Record<string, string>;
  const criteriaData = (portfolio.criteriaData || {}) as Record<string, any>;
  const jobId = portfolio.jobId || "teacher";
  const jobTitle = JOB_TITLES[jobId] || portfolio.jobTitle;

  // حساب الإحصائيات
  const criteriaEntries = Object.entries(criteriaData);
  const totalScore = criteriaEntries.reduce((sum, [, d]) => sum + ((d as any)?.score || 0), 0);
  const maxScore = criteriaEntries.length * 5;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const grade = getGrade(percentage);
  const totalEvidences = criteriaEntries.reduce((sum, [, d]) => sum + ((d as any)?.evidences?.length || 0), 0);
  const completedCriteria = criteriaEntries.filter(([, d]) => ((d as any)?.score || 0) >= 4 && ((d as any)?.evidences?.length || 0) > 0).length;

  // تصنيف البنود حسب الحالة
  const completedItems = criteriaEntries.filter(([, d]) => ((d as any)?.score || 0) >= 4 && ((d as any)?.evidences?.length || 0) > 0);
  const partialItems = criteriaEntries.filter(([, d]) => {
    const s = (d as any)?.score || 0;
    const e = (d as any)?.evidences?.length || 0;
    return (e > 0 || s > 0) && !(s >= 4 && e > 0);
  });
  const missingItems = criteriaEntries.filter(([, d]) => ((d as any)?.score || 0) === 0 && ((d as any)?.evidences?.length || 0) === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20" dir="rtl" ref={contentRef}>
      {/* Header - شريط علوي ثابت */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>SERS</h1>
              <p className="text-[10px] text-gray-500">ملف إنجاز إلكتروني</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => window.print()} data-no-print>
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("تم نسخ الرابط");
            }} data-no-print>
              <Share2 className="w-3.5 h-3.5" />
              مشاركة
            </Button>
            <Badge variant="secondary" className="gap-1.5 h-8">
              <Eye className="w-3 h-3" />
              عرض فقط
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section - بطاقة المعلومات الرئيسية */}
      <div className="bg-gradient-to-l from-teal-700 via-teal-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        {/* إطار زخرفي */}
        <div className="absolute inset-3 border border-white/10 rounded-xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-10 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              {personalInfo.department && (
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-teal-300" />
                  <p className="text-teal-200 text-sm font-medium whitespace-pre-line leading-relaxed">{personalInfo.department}</p>
                </div>
              )}
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                شواهد الأداء الوظيفي
              </h2>
              <div className="flex items-center gap-3 flex-wrap mt-3">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <User className="w-4 h-4 text-teal-200" />
                  <span className="text-sm text-white font-medium">{personalInfo.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <Briefcase className="w-4 h-4 text-teal-200" />
                  <span className="text-sm text-teal-100">{jobTitle}</span>
                </div>
                {personalInfo.school && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <Building2 className="w-4 h-4 text-teal-200" />
                    <span className="text-sm text-teal-100">{personalInfo.school}</span>
                  </div>
                )}
              </div>
              {(personalInfo.year || personalInfo.semester) && (
                <p className="text-teal-200/80 text-xs mt-3">{personalInfo.year} {personalInfo.semester && `- ${personalInfo.semester}`}</p>
              )}
            </div>

            {/* بطاقة التقييم */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 min-w-[180px]">
              <div className="text-4xl font-black text-white mb-1">{percentage}%</div>
              <div className="text-sm font-bold text-teal-100 mb-2">{grade.label}</div>
              <div className="flex justify-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(percentage / 20) ? "text-amber-400 fill-amber-400" : "text-white/30"}`} />
                ))}
              </div>
              <div className="text-[10px] text-teal-200/70">{totalScore} من {maxScore}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* بطاقات المعلومات الشخصية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-6 mb-8 relative z-10">
          {[
            { icon: Building2, label: "المدرسة", value: personalInfo.school },
            { icon: Calendar, label: "العام الدراسي", value: personalInfo.year },
            { icon: Hash, label: "المجموع", value: `${totalScore}/${maxScore}` },
            { icon: Award, label: "التقدير", value: grade.label },
          ].map((item, i) => (
            <Card key={i} className="border-0 shadow-lg bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{item.value || "—"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* تبويبات التنقل */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="mb-8">
          <TabsList className="w-full justify-start bg-white border shadow-sm rounded-xl p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              <BarChart3 className="w-3.5 h-3.5" />نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="criteria" className="gap-1.5 text-xs data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              <Layers className="w-3.5 h-3.5" />البنود والشواهد
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5 text-xs data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              <User className="w-3.5 h-3.5" />البيانات الشخصية
            </TabsTrigger>
            {files.length > 0 && (
              <TabsTrigger value="files" className="gap-1.5 text-xs data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                <Download className="w-3.5 h-3.5" />الملفات ({files.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* ===== نظرة عامة ===== */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: criteriaEntries.length, label: "بند تقييم", color: "#059669", icon: BookOpen },
                { value: totalEvidences, label: "شاهد مرفق", color: "#2563EB", icon: FileText },
                { value: completedCriteria, label: "بند مكتمل", color: "#7C3AED", icon: CheckCircle },
                { value: files.length, label: "ملف مرفوع", color: "#EA580C", icon: Download },
              ].map((stat, i) => (
                <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <stat.icon className="w-5 h-5 mx-auto mb-2 opacity-60" style={{ color: stat.color }} />
                    <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* شريط التقدم الإجمالي */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    نسبة الإنجاز الكلية
                  </h3>
                  <span className="text-sm font-bold" style={{ color: grade.color }}>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%`, backgroundColor: grade.color }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                  <span>{completedCriteria} بند مكتمل من {criteriaEntries.length}</span>
                  <span>{totalEvidences} شاهد إجمالي</span>
                </div>
              </CardContent>
            </Card>

            {/* ملخص حالة البنود */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  ملخص حالة البنود
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-teal-800">مكتمل</span>
                    <span className="text-xs text-teal-600 mr-2">({completedItems.length} بند)</span>
                  </div>
                  <span className="text-lg font-black text-teal-700">{criteriaEntries.length > 0 ? Math.round((completedItems.length / criteriaEntries.length) * 100) : 0}%</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-amber-800">جزئي</span>
                    <span className="text-xs text-amber-600 mr-2">({partialItems.length} بند)</span>
                  </div>
                  <span className="text-lg font-black text-amber-700">{criteriaEntries.length > 0 ? Math.round((partialItems.length / criteriaEntries.length) * 100) : 0}%</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-red-800">ناقص</span>
                    <span className="text-xs text-red-600 mr-2">({missingItems.length} بند)</span>
                  </div>
                  <span className="text-lg font-black text-red-700">{criteriaEntries.length > 0 ? Math.round((missingItems.length / criteriaEntries.length) * 100) : 0}%</span>
                </div>
              </CardContent>
            </Card>

            {/* معلومات المقيّم */}
            {(personalInfo.evaluator || personalInfo.evaluatorRole || personalInfo.date) && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-teal-600" />
                    معلومات التقييم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {personalInfo.evaluator && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-500 text-[10px] block mb-0.5">اسم المقيّم</span>
                        <strong className="text-gray-800 text-sm">{personalInfo.evaluator}</strong>
                      </div>
                    )}
                    {personalInfo.evaluatorRole && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-500 text-[10px] block mb-0.5">صفة المقيّم</span>
                        <strong className="text-gray-800 text-sm">{personalInfo.evaluatorRole}</strong>
                      </div>
                    )}
                    {personalInfo.date && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <span className="text-gray-500 text-[10px] block mb-0.5">تاريخ التقييم</span>
                        <strong className="text-gray-800 text-sm">{personalInfo.date}</strong>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== البنود والشواهد ===== */}
          <TabsContent value="criteria" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                <Layers className="w-5 h-5 text-teal-600" />
                تفاصيل البنود والشواهد
              </h2>
              <Badge variant="outline" className="text-xs">{criteriaEntries.length} بند</Badge>
            </div>
            <div className="space-y-3">
              {criteriaEntries.map(([criterionId, d], i) => (
                <CriterionSection key={criterionId} criterionId={criterionId} data={d} index={i} jobId={jobId} />
              ))}
            </div>
          </TabsContent>

          {/* ===== البيانات الشخصية ===== */}
          <TabsContent value="info" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  البيانات الشخصية الكاملة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "الاسم الكامل", value: personalInfo.name, icon: User },
                    { label: "المدرسة", value: personalInfo.school, icon: Building2 },
                    { label: "الوظيفة", value: jobTitle, icon: Briefcase },
                    { label: "العام الدراسي", value: personalInfo.year, icon: Calendar },
                    { label: "الفصل الدراسي", value: personalInfo.semester, icon: Calendar },
                    { label: "اسم المقيّم", value: personalInfo.evaluator, icon: ClipboardCheck },
                    { label: "صفة المقيّم", value: personalInfo.evaluatorRole, icon: ClipboardCheck },
                    { label: "تاريخ التقييم", value: personalInfo.date, icon: Calendar },
                  ].map((field, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                        <field.icon className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">{field.label}</span>
                        <strong className="text-gray-800 text-sm">{field.value || "—"}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                {personalInfo.department && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-teal-600" />
                      <span className="text-gray-500 text-[10px]">الجهة / الإدارة</span>
                    </div>
                    <strong className="text-gray-800 text-sm whitespace-pre-line">{personalInfo.department}</strong>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== الملفات المرفوعة ===== */}
          {files.length > 0 && (
            <TabsContent value="files" className="mt-6">
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-l from-blue-50 to-white border-b border-blue-100/50">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    الملفات المرفوعة ({files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {files.map((file: any) => (
                      <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          {file.mimeType?.startsWith("image/") ? <Image className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-orange-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                          <p className="text-xs text-gray-500">{file.mimeType}</p>
                        </div>
                        <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="text-center py-10 border-t border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">نظام SERS - السجلات التعليمية الذكية</p>
          <p className="text-[10px] text-gray-400 mt-1">تم إنشاء هذا الملف إلكترونياً • {personalInfo.name} • {jobTitle}</p>
        </div>
      </div>

      {/* زر العودة للأعلى */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 w-10 h-10 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center z-30"
          data-no-print
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
