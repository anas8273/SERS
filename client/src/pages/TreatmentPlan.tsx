/*
 * الخطط العلاجية والإثرائية - صفحة تفاعلية كاملة
 * الهوية البصرية: ترويسة رسمية + مربع عنوان + جداول بترويسة متدرجة + فوتر منحني
 * تنسيق مختلف: حقول ملونة حسب نوع الخطة + بطاقات طلاب + جدول تفصيلي
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, Plus, Trash2, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { exportToPDF, printElement } from "@/lib/pdf-export";
import { OfficialHeader } from "@/components/OfficialHeader";

const PLAN_TYPES = [
  { id: "remedial_individual", title: "خطة علاجية فردية", color: "#DC2626", icon: "🔴" },
  { id: "remedial_group", title: "خطة علاجية جماعية", color: "#EA580C", icon: "🟠" },
  { id: "enrichment_individual", title: "خطة إثرائية فردية", color: "#16A34A", icon: "🟢" },
  { id: "enrichment_group", title: "خطة إثرائية جماعية", color: "#0D9488", icon: "🔵" },
  { id: "iep", title: "خطة تربوية فردية (IEP)", color: "#7C3AED", icon: "🟣" },
  { id: "learning_loss", title: "خطة الفاقد التعليمي", color: "#2563EB", icon: "📘" },
];

interface PlanStudent {
  id: string;
  name: string;
  weakness: string;
  activities: string;
  evaluation: string;
  notes: string;
}

// ألوان الهوية البصرية
const C = {
  tealDark: "#1a3a5c",
  teal: "#1a5f3f",
  green: "#2ea87a",
  greenLight: "#7ECDC0",
  separator: "#5bb784",
};

export default function TreatmentPlan() {
  const [, navigate] = useLocation();
  const [selectedType, setSelectedType] = useState(PLAN_TYPES[0]);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [info, setInfo] = useState({
    subject: "",
    teacher: "",
    grade: "",
    school: "",
    department: "",
    year: "1446-1447",
    semester: "الأول",
    skill: "",
    objective: "",
    duration: "",
    tools: "",
  });

  const [students, setStudents] = useState<PlanStudent[]>([
    { id: "1", name: "", weakness: "", activities: "", evaluation: "", notes: "" },
  ]);

  const addStudent = () => {
    setStudents((prev) => [...prev, { id: `${Date.now()}`, name: "", weakness: "", activities: "", evaluation: "", notes: "" }]);
  };

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStudent = (id: string, field: keyof PlanStudent, value: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportToPDF("plan-preview", `${selectedType.title}_${info.subject || "خطة"}.pdf`);
    setIsExporting(false);
  };

  const validStudents = students.filter((s) => s.name.trim());

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 mb-4 flex-wrap">
            <button type="button" onClick={() => setShowPreview(false)} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-200 shadow-sm">
              <ArrowLeft className="w-4 h-4" />
              تعديل
            </button>
            <button type="button" onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50" style={{ backgroundColor: C.teal }}>
              <Download className="w-4 h-4" />
              {isExporting ? "جاري..." : "تحميل PDF"}
            </button>
            <button type="button" onClick={() => printElement("plan-preview")} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-200 shadow-sm">
              <Printer className="w-4 h-4" />
              طباعة
            </button>
          </div>

          <div id="plan-preview" className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
            {/* شريط علوي بتدرج */}
            <div style={{ height: '5px', background: `linear-gradient(to left, ${C.tealDark}, ${C.teal}, ${C.green})` }} />

            {/* الترويسة الرسمية */}
            <OfficialHeader
              deptLines={[
                "المملكة العربية السعودية",
                "وزارة التعليم",
                info.department ? `الإدارة العامة للتعليم بـ ${info.department}` : "الإدارة العامة للتعليم بـ ................",
              ]}
              schoolName={info.school || undefined}
              logoUrl="https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/moe-logo_b9fec681.png"
              variant="full"
              accentColor={C.teal}
              headerBg={`linear-gradient(135deg, ${C.tealDark} 0%, ${C.teal} 50%, ${C.green} 100%)`}
              headerText="#ffffff"
              borderColor={C.tealDark}
            />

            {/* مربع العنوان بإطار أخضر + شريط لون نوع الخطة */}
            <div style={{ padding: '16px 28px 8px', textAlign: 'center' }}>
              <div style={{
                border: `2px solid ${C.greenLight}`,
                borderRadius: '16px',
                padding: '10px 24px',
                display: 'inline-block',
                background: `${C.greenLight}08`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '4px',
                  borderRadius: '0 0 4px 4px',
                  backgroundColor: selectedType.color,
                }} />
                <h1 style={{ fontSize: '18px', fontWeight: 900, color: C.tealDark, fontFamily: "'Tajawal', sans-serif", margin: 0 }}>
                  {selectedType.title}
                </h1>
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                {info.subject || "المادة"} - {info.grade || "الصف"}
              </div>
            </div>

            {/* بيانات الخطة في حقول fieldset */}
            <div style={{ padding: '0 28px 12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}>
                {[
                  { label: "المعلم/ة", value: info.teacher },
                  { label: "المادة", value: info.subject },
                  { label: "الصف", value: info.grade },
                  { label: "المدرسة", value: info.school },
                  { label: "العام الدراسي", value: info.year },
                  { label: "الفصل الدراسي", value: info.semester },
                  { label: "المدة", value: info.duration },
                  { label: "الأدوات", value: info.tools },
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

              {/* المهارة والهدف - عرض كامل */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                {[
                  { label: "المهارة المستهدفة", value: info.skill },
                  { label: "الهدف", value: info.objective },
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

            {/* جدول الطلاب */}
            <div style={{ padding: '0 28px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                color: C.tealDark,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{ width: '4px', height: '14px', borderRadius: '2px', backgroundColor: selectedType.color }} />
                بيانات الطلاب ({validStudents.length})
              </div>

              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: `linear-gradient(to left, ${C.tealDark}, ${C.teal})`, color: '#fff' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px', width: '30px' }}>م</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>الطالب</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>نقاط الضعف / القوة</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>الأنشطة والإجراءات</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>التقييم</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {(validStudents.length > 0 ? validStudents : students).map((student, index) => (
                    <tr key={student.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fffe' }}>
                      <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, textAlign: 'center', fontWeight: 700, color: selectedType.color }}>{index + 1}</td>
                      <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, fontWeight: 600 }}>{student.name || "---"}</td>
                      <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, fontSize: '10px' }}>{student.weakness || "---"}</td>
                      <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, fontSize: '10px' }}>{student.activities || "---"}</td>
                      <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, fontSize: '10px' }}>{student.evaluation || "---"}</td>
                      <td style={{ padding: '6px', border: `1px solid ${C.teal}15`, fontSize: '10px' }}>{student.notes || "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* التوقيعات */}
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
                    التنفيذ: أ/ {info.teacher || '...............'}
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

            {/* الفوتر المنحني */}
            <div style={{ marginTop: '16px' }}>
              <svg viewBox="0 0 800 40" preserveAspectRatio="none" style={{ width: '100%', height: '20px', display: 'block' }}>
                <defs>
                  <linearGradient id="planFooterGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.green} />
                    <stop offset="50%" stopColor={C.teal} />
                    <stop offset="100%" stopColor={C.tealDark} />
                  </linearGradient>
                </defs>
                <path d="M0,40 L0,28 C150,6 400,0 800,14 L800,40 Z" fill="url(#planFooterGrad)" />
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
                <span style={{ opacity: 0.85 }}>{info.school || ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">العودة للرئيسية</span>
        </button>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>الخطط العلاجية والإثرائية</h1>
            <p className="text-sm text-gray-500">اختر النوع → أدخل البيانات → معاينة وتصدير</p>
          </div>
          <button type="button" onClick={() => setShowPreview(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg" style={{ backgroundColor: C.teal }}>
            <Eye className="w-4 h-4" />
            معاينة وتصدير
          </button>
        </div>

        {/* نوع الخطة */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {PLAN_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`p-3 rounded-xl text-center transition-all border-2 ${
                selectedType.id === type.id ? "shadow-md" : "border-gray-200 hover:border-gray-300"
              }`}
              style={selectedType.id === type.id ? { borderColor: type.color, backgroundColor: type.color + "10" } : {}}
            >
              <div className="text-xl mb-1">{type.icon}</div>
              <div className="text-xs font-bold" style={{ color: selectedType.id === type.id ? type.color : "#6B7280" }}>{type.title}</div>
            </button>
          ))}
        </div>

        {/* البيانات */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: C.teal }} />
            بيانات الخطة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "subject", label: "المادة", placeholder: "رياضيات" },
              { key: "teacher", label: "المعلم", placeholder: "اسم المعلم" },
              { key: "grade", label: "الصف", placeholder: "الأول المتوسط" },
              { key: "school", label: "المدرسة", placeholder: "اسم المدرسة" },
              { key: "department", label: "إدارة التعليم", placeholder: "إدارة تعليم الرياض" },
              { key: "year", label: "العام", placeholder: "1446-1447" },
              { key: "semester", label: "الفصل", placeholder: "الأول" },
              { key: "skill", label: "المهارة المستهدفة", placeholder: "جمع الكسور..." },
              { key: "objective", label: "الهدف", placeholder: "أن يتمكن الطالب من..." },
              { key: "duration", label: "المدة", placeholder: "أسبوعين" },
              { key: "tools", label: "الأدوات والوسائل", placeholder: "أوراق عمل، سبورة..." },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={(info as any)[field.key]}
                  onChange={(e) => setInfo((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-teal-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* الطلاب */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: selectedType.color }} />
              بيانات الطلاب ({students.length})
            </h2>
            <button type="button" onClick={addStudent} className="flex items-center gap-1 text-sm font-medium" style={{ color: selectedType.color }}>
              <Plus className="w-4 h-4" />
              إضافة طالب
            </button>
          </div>

          <div className="space-y-3">
            {students.map((student, index) => (
              <motion.div key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold flex items-center gap-2" style={{ color: selectedType.color }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: selectedType.color }}>
                      {index + 1}
                    </div>
                    الطالب {index + 1}
                  </span>
                  {students.length > 1 && (
                    <button type="button" onClick={() => removeStudent(student.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "name", label: "الاسم", placeholder: "اسم الطالب" },
                    { key: "weakness", label: "نقاط الضعف / القوة", placeholder: "لا يستطيع جمع الكسور..." },
                    { key: "activities", label: "الأنشطة والإجراءات", placeholder: "تدريبات إضافية..." },
                    { key: "evaluation", label: "التقييم", placeholder: "اختبار قصير / ملاحظة..." },
                    { key: "notes", label: "ملاحظات", placeholder: "ملاحظات إضافية..." },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={(student as any)[field.key]}
                        onChange={(e) => updateStudent(student.id, field.key as keyof PlanStudent, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:border-teal-400"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
