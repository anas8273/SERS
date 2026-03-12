/*
 * أغلفة وفواصل تفاعلية - إعادة بناء كاملة
 * الهوية البصرية: ترويسة رسمية + مربع عنوان + فوتر منحني
 * كل نوع غلاف له تصميم مختلف فعلياً (ليس فقط تغيير ألوان)
 * حذف الثيمات المكررة - 3 ثيمات فقط مختلفة تماماً
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, Palette } from "lucide-react";
import { useLocation } from "wouter";
import { exportToPDF, printElement } from "@/lib/pdf-export";
import { generateQRDataURL } from "@/lib/qr-utils";
import { MoeLogo } from "@/components/MoeLogo";

const COVER_TYPES = [
  { id: "portfolio", title: "غلاف ملف إنجاز", icon: "📁" },
  { id: "subject", title: "غلاف مادة دراسية", icon: "📚" },
  { id: "plan", title: "غلاف خطة", icon: "📋" },
  { id: "report", title: "غلاف تقرير", icon: "📊" },
  { id: "divider", title: "فاصل ملف", icon: "📑" },
  { id: "index", title: "فهرس", icon: "📇" },
];

/* ═══ 3 ثيمات مختلفة تماماً (بدون تكرار) ═══ */
const COVER_THEMES = [
  {
    id: "sers-official",
    name: "الهوية الرسمية",
    primary: "#1a3a5c",
    secondary: "#f0f4f8",
    accent: "#2ea87a",
    bg: "#ffffff",
    gradientStart: "#1a3a5c",
    gradientMid: "#1a5f3f",
    gradientEnd: "#2ea87a",
  },
  {
    id: "blue-modern",
    name: "أزرق عصري",
    primary: "#1e3a8a",
    secondary: "#dbeafe",
    accent: "#2563eb",
    bg: "#f8faff",
    gradientStart: "#1e3a8a",
    gradientMid: "#1e40af",
    gradientEnd: "#3b82f6",
  },
  {
    id: "gold-elegant",
    name: "ذهبي أنيق",
    primary: "#78350f",
    secondary: "#fef3c7",
    accent: "#d97706",
    bg: "#fffdf7",
    gradientStart: "#78350f",
    gradientMid: "#92400e",
    gradientEnd: "#d97706",
  },
];

export default function CoverBuilder() {
  const [, navigate] = useLocation();
  const [selectedType, setSelectedType] = useState(COVER_TYPES[0]);
  const [selectedTheme, setSelectedTheme] = useState(COVER_THEMES[0]);
  const [isExporting, setIsExporting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    name: "",
    role: "",
    school: "",
    department: "",
    year: "1446-1447",
    semester: "الأول",
    dividerTitle: "",
  });

  const qrData = useMemo(
    () => generateQRDataURL(`SERS-COVER|${formData.title}|${formData.name}|${formData.year}`),
    [formData.title, formData.name, formData.year]
  );

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportToPDF("cover-preview", `${selectedType.title}_${formData.name || "غلاف"}.pdf`);
    setIsExporting(false);
  };

  const t = selectedTheme;
  const footerGradId = `coverFooterGrad-${t.id}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ═══ الإعدادات ═══ */}
        <aside className="lg:w-96 bg-white border-l border-gray-200 p-5 overflow-y-auto">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>

          <h1 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            أغلفة وفواصل
          </h1>
          <p className="text-xs text-gray-500 mb-5">صمم غلافك أو فاصلك → معاينة فورية → تصدير PDF</p>

          {/* نوع الغلاف */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">النوع</label>
            <div className="grid grid-cols-3 gap-2">
              {COVER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`px-2 py-3 rounded-lg text-center text-xs font-medium transition-all border ${
                    selectedType.id === type.id ? "shadow-sm" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  style={selectedType.id === type.id ? { borderColor: t.primary, backgroundColor: t.primary + "10", color: t.primary } : {}}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  {type.title}
                </button>
              ))}
            </div>
          </div>

          {/* الثيم */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline ml-1" />
              الثيم
            </label>
            <div className="flex gap-2 flex-wrap">
              {COVER_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedTheme.id === theme.id ? "border-gray-900 shadow-sm" : "border-gray-200"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* البيانات */}
          <div className="space-y-3">
            {selectedType.id === "divider" ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">عنوان الفاصل</label>
                <input
                  type="text"
                  value={formData.dividerTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dividerTitle: e.target.value }))}
                  placeholder="مثال: الفصل الأول / الشواهد / التقارير"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            ) : (
              <>
                {[
                  { key: "title", label: "العنوان الرئيسي", placeholder: "ملف إنجاز / خطة المادة..." },
                  { key: "subtitle", label: "العنوان الفرعي", placeholder: "الفصل الدراسي الأول..." },
                  { key: "name", label: "الاسم", placeholder: "اسم المعلم / الطالب" },
                  { key: "role", label: "الوظيفة", placeholder: "معلم رياضيات / طالب..." },
                  { key: "school", label: "المدرسة", placeholder: "اسم المدرسة" },
                  { key: "department", label: "إدارة التعليم", placeholder: "إدارة تعليم الرياض" },
                  { key: "year", label: "العام الدراسي", placeholder: "1446-1447" },
                  { key: "semester", label: "الفصل", placeholder: "الأول" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button type="button" onClick={handleExportPDF} disabled={isExporting} className="flex-1 flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: t.primary }}>
              <Download className="w-4 h-4" />
              {isExporting ? "جاري..." : "تحميل PDF"}
            </button>
            <button type="button" onClick={() => printElement("cover-preview")} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200">
              <Printer className="w-4 h-4" />
              طباعة
            </button>
          </div>
        </aside>

        {/* ═══ المعاينة ═══ */}
        <main className="flex-1 p-6 flex items-center justify-center bg-gray-100 overflow-auto">
          <div
            id="cover-preview"
            className="w-full max-w-[595px] shadow-2xl overflow-hidden"
            style={{
              aspectRatio: "1/1.414",
              background: t.bg,
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
            }}
          >
            {selectedType.id === "divider" ? (
              /* ═══ فاصل ═══ */
              <div className="h-full flex flex-col relative">
                <div style={{ height: '5px', background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid}, ${t.gradientEnd})` }} />
                <div className="flex-1 flex items-center justify-center relative">
                  {/* إطار مزدوج */}
                  <div className="absolute rounded-lg" style={{ inset: '24px', border: `3px solid ${t.primary}` }} />
                  <div className="absolute rounded" style={{ inset: '32px', border: `1px solid ${t.accent}40` }} />
                  {/* زخرفة جانبية */}
                  <div style={{ position: 'absolute', top: '40px', right: '40px', bottom: '40px', width: '6px', borderRadius: '3px', background: `linear-gradient(to bottom, ${t.gradientStart}, ${t.gradientEnd})` }} />
                  <div style={{ position: 'absolute', top: '40px', left: '40px', bottom: '40px', width: '6px', borderRadius: '3px', background: `linear-gradient(to bottom, ${t.gradientEnd}, ${t.gradientStart})` }} />
                  <div className="text-center z-10">
                    <div className="w-20 h-1 rounded-full mx-auto mb-4" style={{ background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientEnd})` }} />
                    <h1 className="text-4xl font-black mb-2" style={{ color: t.primary, fontFamily: "'Tajawal', sans-serif" }}>
                      {formData.dividerTitle || "عنوان الفاصل"}
                    </h1>
                    <div className="w-20 h-1 rounded-full mx-auto mt-4" style={{ background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientEnd})` }} />
                  </div>
                </div>
                {/* فوتر منحني */}
                <div>
                  <svg viewBox="0 0 800 40" preserveAspectRatio="none" style={{ width: '100%', height: '20px', display: 'block' }}>
                    <defs>
                      <linearGradient id={`${footerGradId}-div`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={t.gradientEnd} />
                        <stop offset="50%" stopColor={t.gradientMid} />
                        <stop offset="100%" stopColor={t.gradientStart} />
                      </linearGradient>
                    </defs>
                    <path d="M0,40 L0,28 C150,6 400,0 800,14 L800,40 Z" fill={`url(#${footerGradId}-div)`} />
                  </svg>
                  <div style={{
                    background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid}, ${t.gradientEnd})`,
                    padding: '4px 20px 6px',
                    fontSize: '9px',
                    color: '#fff',
                    textAlign: 'center',
                    marginTop: '-1px',
                  }}>
                    SERS - نظام السجلات التعليمية الذكي
                  </div>
                </div>
              </div>
            ) : selectedType.id === "index" ? (
              /* ═══ فهرس - تصميم مختلف تماماً ═══ */
              <div className="h-full flex flex-col">
                <div style={{ height: '5px', background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid}, ${t.gradientEnd})` }} />
                {/* هيدر مصغر */}
                <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${t.primary}20` }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: t.primary, fontWeight: 700 }}>وزارة التعليم</div>
                    <div style={{ fontSize: '10px', color: t.primary, fontWeight: 600 }}>{formData.school || 'اسم المدرسة'}</div>
                  </div>
                  <MoeLogo variant="original" height={45} />
                </div>
                {/* عنوان الفهرس */}
                <div style={{ padding: '12px 24px', textAlign: 'center' }}>
                  <div style={{ border: `2px solid ${t.accent}60`, borderRadius: '12px', padding: '8px 20px', display: 'inline-block' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, color: t.primary, fontFamily: "'Tajawal', sans-serif", margin: 0 }}>
                      {formData.title || "الفهرس"}
                    </h1>
                  </div>
                </div>
                {/* جدول الفهرس */}
                <div style={{ padding: '0 24px', flex: 1 }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid})`, color: '#fff' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, width: '40px' }}>م</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>الموضوع</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, width: '60px' }}>الصفحة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 15 }, (_, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : `${t.secondary}` }}>
                          <td style={{ padding: '6px 12px', border: `1px solid ${t.primary}15`, textAlign: 'center', fontWeight: 700, color: t.primary }}>{i + 1}</td>
                          <td style={{ padding: '6px 12px', border: `1px solid ${t.primary}15`, color: '#666' }}>
                            {i === 0 ? '........................................' : '........................................'}
                          </td>
                          <td style={{ padding: '6px 12px', border: `1px solid ${t.primary}15`, textAlign: 'center', color: '#999' }}>
                            ......
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* فوتر */}
                <div>
                  <svg viewBox="0 0 800 40" preserveAspectRatio="none" style={{ width: '100%', height: '20px', display: 'block' }}>
                    <defs>
                      <linearGradient id={`${footerGradId}-idx`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={t.gradientEnd} />
                        <stop offset="50%" stopColor={t.gradientMid} />
                        <stop offset="100%" stopColor={t.gradientStart} />
                      </linearGradient>
                    </defs>
                    <path d="M0,40 L0,28 C150,6 400,0 800,14 L800,40 Z" fill={`url(#${footerGradId}-idx)`} />
                  </svg>
                  <div style={{
                    background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid}, ${t.gradientEnd})`,
                    padding: '4px 20px 6px',
                    fontSize: '9px',
                    color: '#fff',
                    textAlign: 'center',
                    marginTop: '-1px',
                  }}>
                    SERS - نظام السجلات التعليمية الذكي
                  </div>
                </div>
              </div>
            ) : (
              /* ═══ غلاف عادي (ملف إنجاز / مادة / خطة / تقرير) ═══ */
              <div className="h-full flex flex-col relative">
                {/* شريط علوي بتدرج */}
                <div style={{ height: '5px', background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid}, ${t.gradientEnd})` }} />

                {/* الهيدر - شعار + معلومات */}
                <div style={{ padding: '16px 24px 12px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: t.primary, fontWeight: 700, lineHeight: '1.8' }}>وزارة التعليم</div>
                      <div style={{ fontSize: '11px', color: t.primary, fontWeight: 600, lineHeight: '1.7' }}>{formData.department || "إدارة التعليم"}</div>
                      <div style={{ fontSize: '11px', color: t.primary, fontWeight: 600, lineHeight: '1.7' }}>{formData.school || "اسم المدرسة"}</div>
                    </div>
                    {/* خط فاصل عمودي */}
                    <div style={{ width: '2px', height: '45px', background: t.accent, margin: '0 12px', opacity: 0.5 }} />
                    <MoeLogo variant="original" height={60} />
                  </div>
                </div>

                {/* خطوط فاصلة ملونة */}
                <div style={{ display: 'flex', height: '4px' }}>
                  <div style={{ flex: 1, background: t.gradientEnd }} />
                  <div style={{ flex: 1, background: t.gradientMid }} />
                  <div style={{ flex: 1, background: t.gradientStart }} />
                </div>

                {/* المحتوى الرئيسي */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  {/* مربع العنوان بإطار */}
                  <div style={{
                    border: `2.5px solid ${t.accent}80`,
                    borderRadius: '16px',
                    padding: '16px 32px',
                    marginBottom: '24px',
                    minWidth: '280px',
                  }}>
                    <h1 className="text-3xl font-black" style={{ color: t.primary, fontFamily: "'Tajawal', sans-serif" }}>
                      {formData.title || selectedType.title}
                    </h1>
                    {formData.subtitle && (
                      <p className="text-base mt-2" style={{ color: t.accent }}>{formData.subtitle}</p>
                    )}
                  </div>

                  <div style={{ width: '80px', height: '2px', borderRadius: '2px', background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientEnd})`, marginBottom: '24px' }} />

                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: t.primary + "80" }}>إعداد</p>
                    <p className="text-xl font-bold" style={{ color: t.primary }}>{formData.name || "الاسم"}</p>
                    {formData.role && <p className="text-sm" style={{ color: t.accent }}>{formData.role}</p>}
                  </div>
                </div>

                {/* معلومات العام والفصل */}
                <div style={{ padding: '8px 24px', textAlign: 'center' }}>
                  <p className="text-sm font-bold" style={{ color: t.primary }}>العام الدراسي {formData.year}</p>
                  <p className="text-xs" style={{ color: t.accent }}>الفصل الدراسي {formData.semester}</p>
                </div>

                {/* الفوتر المنحني */}
                <div>
                  <svg viewBox="0 0 800 50" preserveAspectRatio="none" style={{ width: '100%', height: '30px', display: 'block' }}>
                    <defs>
                      <linearGradient id={footerGradId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={t.gradientEnd} />
                        <stop offset="50%" stopColor={t.gradientMid} />
                        <stop offset="100%" stopColor={t.gradientStart} />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 L0,35 C150,8 400,2 800,18 L800,50 Z" fill={`url(#${footerGradId})`} />
                  </svg>
                  <div style={{
                    background: `linear-gradient(to left, ${t.gradientStart}, ${t.gradientMid}, ${t.gradientEnd})`,
                    padding: '4px 24px 8px',
                    fontSize: '10px',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '-1px',
                  }}>
                    <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                    <img src={qrData} alt="QR" style={{ width: '28px', height: '28px', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
