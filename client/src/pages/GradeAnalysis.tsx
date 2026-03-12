/*
 * تحليل النتائج والدرجات - صفحة تفاعلية كاملة
 * الهوية البصرية الكاملة: ترويسة رسمية + مربع عنوان بإطار أخضر + جداول بترويسة متدرجة + فوتر منحني
 * المستخدم يدخل بيانات المادة والطلاب → رسوم بيانية تلقائية → تقرير → تصدير PDF
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, Plus, Trash2, BarChart3, PieChart, TrendingUp, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { exportToPDF, printElement } from "@/lib/pdf-export";
import { OfficialHeader } from "@/components/OfficialHeader";

interface Student {
  id: string;
  name: string;
  score: number;
}

export default function GradeAnalysis() {
  const [, navigate] = useLocation();
  const [isExporting, setIsExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [subjectInfo, setSubjectInfo] = useState({
    subject: "",
    teacher: "",
    grade: "",
    section: "",
    semester: "الأول",
    year: "1446-1447",
    maxScore: 100,
    school: "",
    department: "",
  });

  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "", score: 0 },
    { id: "2", name: "", score: 0 },
    { id: "3", name: "", score: 0 },
    { id: "4", name: "", score: 0 },
    { id: "5", name: "", score: 0 },
  ]);

  const addStudent = () => {
    setStudents((prev) => [...prev, { id: `${Date.now()}`, name: "", score: 0 }]);
  };

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStudent = (id: string, field: keyof Student, value: string | number) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // الإحصائيات
  const stats = useMemo(() => {
    const validStudents = students.filter((s) => s.name.trim() && s.score > 0);
    if (validStudents.length === 0) return null;

    const scores = validStudents.map((s) => s.score);
    const max = subjectInfo.maxScore || 100;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    const excellent = validStudents.filter((s) => (s.score / max) * 100 >= 90).length;
    const veryGood = validStudents.filter((s) => { const p = (s.score / max) * 100; return p >= 80 && p < 90; }).length;
    const good = validStudents.filter((s) => { const p = (s.score / max) * 100; return p >= 70 && p < 80; }).length;
    const pass = validStudents.filter((s) => { const p = (s.score / max) * 100; return p >= 60 && p < 70; }).length;
    const fail = validStudents.filter((s) => (s.score / max) * 100 < 60).length;

    return {
      total: validStudents.length,
      avg: avg.toFixed(1),
      avgPct: ((avg / max) * 100).toFixed(1),
      highest,
      lowest,
      excellent,
      veryGood,
      good,
      pass,
      fail,
      passRate: (((validStudents.length - fail) / validStudents.length) * 100).toFixed(1),
      students: validStudents,
    };
  }, [students, subjectInfo.maxScore]);

  const getGradeColor = (score: number) => {
    const pct = (score / (subjectInfo.maxScore || 100)) * 100;
    if (pct >= 90) return "#059669";
    if (pct >= 80) return "#1a5f3f";
    if (pct >= 70) return "#d97706";
    if (pct >= 60) return "#ea580c";
    return "#dc2626";
  };

  const getGradeLabel = (score: number) => {
    const pct = (score / (subjectInfo.maxScore || 100)) * 100;
    if (pct >= 90) return "ممتاز";
    if (pct >= 80) return "جيد جداً";
    if (pct >= 70) return "جيد";
    if (pct >= 60) return "مقبول";
    return "راسب";
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportToPDF("analysis-report", `تحليل_نتائج_${subjectInfo.subject || "مادة"}.pdf`);
    setIsExporting(false);
  };

  // ألوان الهوية البصرية
  const C = {
    tealDark: "#1a3a5c",
    teal: "#1a5f3f",
    green: "#2ea87a",
    greenLight: "#7ECDC0",
    separator: "#5bb784",
    bg: "#f0f4f8",
    border: "#1a3a5c20",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">العودة للرئيسية</span>
        </button>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              تحليل النتائج والدرجات
            </h1>
            <p className="text-sm text-gray-500">أدخل بيانات المادة والدرجات → تحليل تلقائي مع رسوم بيانية</p>
          </div>
          {stats && (
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: C.teal }}
            >
              {showReport ? <ArrowLeft className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showReport ? "العودة للإدخال" : "معاينة التقرير"}
            </button>
          )}
        </div>

        {!showReport ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* بيانات المادة */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: C.teal }} />
                بيانات المادة
              </h2>
              <div className="space-y-3">
                {[
                  { key: "subject", label: "المادة", placeholder: "رياضيات / علوم / لغة عربية" },
                  { key: "teacher", label: "المعلم", placeholder: "اسم المعلم" },
                  { key: "grade", label: "الصف", placeholder: "الصف الأول المتوسط" },
                  { key: "section", label: "الشعبة", placeholder: "أ / ب / ج" },
                  { key: "school", label: "المدرسة", placeholder: "اسم المدرسة" },
                  { key: "department", label: "إدارة التعليم", placeholder: "إدارة تعليم الرياض" },
                  { key: "semester", label: "الفصل", placeholder: "الأول" },
                  { key: "year", label: "العام", placeholder: "1446-1447" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(subjectInfo as any)[field.key]}
                      onChange={(e) => setSubjectInfo((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-teal-400"
                      style={{ "--tw-ring-color": C.teal + "30" } as any}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الدرجة العظمى</label>
                  <input
                    type="number"
                    value={subjectInfo.maxScore}
                    onChange={(e) => setSubjectInfo((prev) => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-teal-400"
                  />
                </div>
              </div>

              {/* إحصائيات سريعة */}
              {stats && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: C.green }} />
                    إحصائيات سريعة
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: C.teal + "10" }}>
                      <div className="text-lg font-black" style={{ color: C.teal }}>{stats.avgPct}%</div>
                      <div className="text-[10px]" style={{ color: C.tealDark }}>المتوسط</div>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: C.green + "10" }}>
                      <div className="text-lg font-black" style={{ color: C.green }}>{stats.passRate}%</div>
                      <div className="text-[10px]" style={{ color: C.tealDark }}>نسبة النجاح</div>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#05966910" }}>
                      <div className="text-lg font-black" style={{ color: "#059669" }}>{stats.highest}</div>
                      <div className="text-[10px] text-gray-600">أعلى درجة</div>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#dc262610" }}>
                      <div className="text-lg font-black text-red-600">{stats.lowest}</div>
                      <div className="text-[10px] text-gray-600">أدنى درجة</div>
                    </div>
                  </div>

                  {/* توزيع التقديرات */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-600 mb-2">توزيع التقديرات</h4>
                    {[
                      { label: "ممتاز (90+)", count: stats.excellent, color: "#059669", total: stats.total },
                      { label: "جيد جداً (80-89)", count: stats.veryGood, color: C.teal, total: stats.total },
                      { label: "جيد (70-79)", count: stats.good, color: "#d97706", total: stats.total },
                      { label: "مقبول (60-69)", count: stats.pass, color: "#ea580c", total: stats.total },
                      { label: "راسب (<60)", count: stats.fail, color: "#dc2626", total: stats.total },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 mb-1.5">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] text-gray-600 flex-1">{item.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.count}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(item.count / item.total) * 100}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* جدول الطلاب */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: C.teal }} />
                  درجات الطلاب ({students.length})
                </h2>
                <button type="button" onClick={addStudent} className="flex items-center gap-1 text-sm font-medium" style={{ color: C.teal }}>
                  <Plus className="w-4 h-4" />
                  إضافة طالب
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: `linear-gradient(to left, ${C.tealDark}, ${C.teal})` }}>
                      <th className="p-2.5 text-right text-xs font-bold text-white w-10">م</th>
                      <th className="p-2.5 text-right text-xs font-bold text-white">اسم الطالب</th>
                      <th className="p-2.5 text-center text-xs font-bold text-white w-24">الدرجة</th>
                      <th className="p-2.5 text-center text-xs font-bold text-white w-16">النسبة</th>
                      <th className="p-2.5 text-center text-xs font-bold text-white w-20">التقدير</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const pct = subjectInfo.maxScore > 0 ? ((student.score / subjectInfo.maxScore) * 100) : 0;
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? "bg-gray-50/50" : ""}`}
                        >
                          <td className="p-2 text-center text-gray-500 font-medium">{index + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={student.name}
                              onChange={(e) => updateStudent(student.id, "name", e.target.value)}
                              placeholder="اسم الطالب..."
                              className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:border-teal-400"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={student.score || ""}
                              onChange={(e) => updateStudent(student.id, "score", parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min={0}
                              max={subjectInfo.maxScore}
                              className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-center focus:outline-none focus:ring-1 focus:border-teal-400"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {student.score > 0 && (
                              <span className="text-xs font-bold" style={{ color: getGradeColor(student.score) }}>
                                {pct.toFixed(0)}%
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {student.score > 0 && (
                              <span
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                style={{ backgroundColor: getGradeColor(student.score) }}
                              >
                                {getGradeLabel(student.score)}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {students.length > 1 && (
                              <button type="button" onClick={() => removeStudent(student.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3">
                <button type="button" onClick={addStudent} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <Plus className="w-4 h-4" />
                  إضافة 1 طالب
                </button>
                <button
                  onClick={() => {
                    const newStudents = Array.from({ length: 5 }, (_, i) => ({
                      id: `${Date.now()}-${i}`,
                      name: "",
                      score: 0,
                    }));
                    setStudents((prev) => [...prev, ...newStudents]);
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  إضافة 5 طلاب
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ═══════════ التقرير الكامل بالهوية البصرية ═══════════ */
          <div>
            <div className="flex gap-3 mb-4 flex-wrap">
              <button type="button" onClick={() => setShowReport(false)} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-200 shadow-sm">
                <ArrowLeft className="w-4 h-4" />
                العودة للإدخال
              </button>
              <button type="button" onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50" style={{ backgroundColor: C.teal }}>
                <Download className="w-4 h-4" />
                {isExporting ? "جاري التصدير..." : "تحميل PDF"}
              </button>
              <button type="button" onClick={() => printElement("analysis-report")} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-200 shadow-sm">
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            </div>

            <div id="analysis-report" className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
              {/* ── شريط علوي بتدرج ── */}
              <div style={{ height: '5px', background: `linear-gradient(to left, ${C.tealDark}, ${C.teal}, ${C.green})` }} />

              {/* ── الترويسة الرسمية ── */}
              <OfficialHeader
                deptLines={[
                  "المملكة العربية السعودية",
                  "وزارة التعليم",
                  subjectInfo.department ? `الإدارة العامة للتعليم بـ ${subjectInfo.department}` : "الإدارة العامة للتعليم بـ ................",
                ]}
                schoolName={subjectInfo.school || undefined}
                logoUrl="https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/moe-logo_b9fec681.png"
                variant="full"
                accentColor={C.teal}
                headerBg={`linear-gradient(135deg, ${C.tealDark} 0%, ${C.teal} 50%, ${C.green} 100%)`}
                headerText="#ffffff"
                borderColor={C.tealDark}
              />

              {/* ── مربع العنوان بإطار أخضر ── */}
              <div style={{ padding: '16px 28px 8px', textAlign: 'center' }}>
                <div style={{
                  border: `2px solid ${C.greenLight}`,
                  borderRadius: '16px',
                  padding: '10px 24px',
                  display: 'inline-block',
                  background: `${C.greenLight}08`,
                }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 900, color: C.tealDark, fontFamily: "'Tajawal', sans-serif", margin: 0 }}>
                    تقرير تحليل نتائج الطلاب
                  </h1>
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                  {subjectInfo.subject || "المادة"} - {subjectInfo.grade || "الصف"} ({subjectInfo.section || "الشعبة"})
                </div>
              </div>

              {/* ── بيانات المادة في حقول fieldset ── */}
              <div style={{ padding: '0 28px 8px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}>
                  {[
                    { label: "المعلم/ة", value: subjectInfo.teacher },
                    { label: "المادة", value: subjectInfo.subject },
                    { label: "الصف", value: subjectInfo.grade },
                    { label: "الشعبة", value: subjectInfo.section },
                    { label: "العام الدراسي", value: subjectInfo.year },
                    { label: "الفصل الدراسي", value: subjectInfo.semester },
                    { label: "الدرجة العظمى", value: String(subjectInfo.maxScore) },
                    { label: "عدد الطلاب", value: stats ? String(stats.total) : "0" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      border: `1px solid ${C.teal}25`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        backgroundColor: C.teal,
                        color: '#fff',
                        padding: '3px 8px',
                        fontSize: '9px',
                        fontWeight: 700,
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#333',
                        minHeight: '24px',
                      }}>
                        {item.value || "---"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {stats && (
                <div style={{ padding: '0 28px 20px' }}>
                  {/* ── الإحصائيات ── */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '8px',
                    marginBottom: '16px',
                    marginTop: '8px',
                  }}>
                    {[
                      { label: "عدد الطلاب", value: stats.total, color: C.tealDark },
                      { label: "المتوسط", value: `${stats.avg} (${stats.avgPct}%)`, color: C.teal },
                      { label: "أعلى درجة", value: stats.highest, color: "#059669" },
                      { label: "أدنى درجة", value: stats.lowest, color: "#dc2626" },
                      { label: "نسبة النجاح", value: `${stats.passRate}%`, color: C.green },
                    ].map((item) => (
                      <div key={item.label} style={{
                        border: `1px solid ${item.color}20`,
                        borderRadius: '10px',
                        padding: '10px 8px',
                        textAlign: 'center',
                        backgroundColor: `${item.color}08`,
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── رسم بياني شريطي ── */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: C.tealDark,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <div style={{ width: '4px', height: '14px', borderRadius: '2px', backgroundColor: C.teal }} />
                      توزيع التقديرات
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '16px',
                      justifyContent: 'center',
                      height: '140px',
                      padding: '8px 0',
                      backgroundColor: '#fafafa',
                      borderRadius: '10px',
                      border: '1px solid #f0f0f0',
                    }}>
                      {[
                        { label: "ممتاز", count: stats.excellent, color: "#059669" },
                        { label: "جيد جداً", count: stats.veryGood, color: C.teal },
                        { label: "جيد", count: stats.good, color: "#d97706" },
                        { label: "مقبول", count: stats.pass, color: "#ea580c" },
                        { label: "راسب", count: stats.fail, color: "#dc2626" },
                      ].map((item) => {
                        const maxCount = Math.max(stats.excellent, stats.veryGood, stats.good, stats.pass, stats.fail, 1);
                        const height = (item.count / maxCount) * 100;
                        return (
                          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: item.color }}>{item.count}</span>
                            <div
                              style={{
                                width: '40px',
                                height: `${Math.max(height, 4)}px`,
                                borderRadius: '6px 6px 0 0',
                                backgroundColor: item.color,
                                transition: 'height 0.3s ease',
                              }}
                            />
                            <span style={{ fontSize: '9px', color: '#666' }}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── جدول النتائج التفصيلي ── */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: C.tealDark,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <div style={{ width: '4px', height: '14px', borderRadius: '2px', backgroundColor: C.teal }} />
                    تفاصيل الدرجات
                  </div>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: `linear-gradient(to left, ${C.tealDark}, ${C.teal})`, color: '#fff' }}>
                        <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>م</th>
                        <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>اسم الطالب</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: '10px' }}>الدرجة</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: '10px' }}>من {subjectInfo.maxScore}</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: '10px' }}>النسبة</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, fontSize: '10px' }}>التقدير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.students.sort((a, b) => b.score - a.score).map((student, index) => (
                        <tr key={student.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fffe' }}>
                          <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, textAlign: 'center', fontWeight: 700, color: C.teal }}>{index + 1}</td>
                          <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, fontWeight: 600 }}>{student.name}</td>
                          <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, textAlign: 'center', fontWeight: 800 }}>{student.score}</td>
                          <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, textAlign: 'center', color: '#999' }}>{subjectInfo.maxScore}</td>
                          <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, textAlign: 'center', fontWeight: 700, color: getGradeColor(student.score) }}>
                            {((student.score / subjectInfo.maxScore) * 100).toFixed(0)}%
                          </td>
                          <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '20px',
                              fontSize: '9px',
                              fontWeight: 800,
                              color: '#fff',
                              backgroundColor: getGradeColor(student.score),
                            }}>
                              {getGradeLabel(student.score)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ── التوقيعات ── */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    paddingTop: '20px',
                    marginTop: '16px',
                    borderTop: `1px solid ${C.teal}15`,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>
                        معلم المادة: {subjectInfo.teacher || '...............'}
                      </div>
                      <div style={{ borderTop: `2.5px dotted ${C.teal}60`, width: '160px', margin: '4px auto 0' }} />
                      <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>التوقيع</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>
                        مدير/ة المدرسة: ...............
                      </div>
                      <div style={{ borderTop: `2.5px dotted ${C.teal}60`, width: '160px', margin: '4px auto 0' }} />
                      <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>التوقيع</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── الفوتر المنحني ── */}
              <div style={{ marginTop: '16px' }}>
                <svg viewBox="0 0 800 40" preserveAspectRatio="none" style={{ width: '100%', height: '20px', display: 'block' }}>
                  <defs>
                    <linearGradient id="gradeFooterGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.green} />
                      <stop offset="50%" stopColor={C.teal} />
                      <stop offset="100%" stopColor={C.tealDark} />
                    </linearGradient>
                  </defs>
                  <path d="M0,40 L0,28 C150,6 400,0 800,14 L800,40 Z" fill="url(#gradeFooterGrad)" />
                </svg>
                <div style={{
                  background: `linear-gradient(to left, ${C.tealDark}, ${C.teal}, ${C.green})`,
                  padding: '4px 28px 8px',
                  fontSize: '10px',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '-1px',
                }}>
                  <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                  <span style={{ opacity: 0.85 }}>تم إنشاء هذا التقرير تلقائياً</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
