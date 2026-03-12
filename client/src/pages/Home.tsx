/*
 * SERS Preview - Smart Edu Dashboard Design
 * Design: Material Design 3 Arabic - Emerald green + warm orange + sky blue
 * Fonts: Tajawal (headings) + Cairo (body)
 * Layout: Sidebar nav + card grid with colored icons per section
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Award, FolderOpen, FileText, BarChart3, TrendingUp, HeartPulse,
  CalendarDays, ClipboardCheck, Medal, GraduationCap, BookOpen,
  Radio, Table2, Lightbulb, Users, Presentation, Zap, Wrench, Mail,
  Search, ChevronLeft, ChevronDown, ChevronUp, X, Sparkles,
  Download, Globe, ShoppingCart, Eye, Menu, ArrowLeft
} from "lucide-react";
import { sections, getTotalServicesCount, getInteractiveCount, getPaidCount, getFreeCount, searchServices, type Section, type Service } from "@/lib/data";

const iconMap: Record<string, React.ComponentType<any>> = {
  Award, FolderOpen, FileText, BarChart3, TrendingUp, HeartPulse,
  CalendarDays, ClipboardCheck, Medal, GraduationCap, BookOpen,
  Radio, Table2, Lightbulb, Users, Presentation, Zap, Wrench, Mail,
};

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/hero-bg-hnJ2rckMtM6Tpaxzs2epLL.webp";
const CERTS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/certificates-showcase-SVbvZz5NXwQKtTvTnrEhrL.webp";
const FORMS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/interactive-forms-GheGH45wZDR9EC9ti29f7Z.webp";

// خريطة الأقسام التي لها صفحات تفاعلية مبنية
const INTERACTIVE_ROUTES: Record<string, string> = {
  "1": "/performance-evidence",
  "3": "/covers",
  "4": "/grade-analysis",
  "6": "/treatment-plans",
  "8": "/certificates",
};

function StatCard({ value, label, icon: Icon, color }: { value: number | string; label: string; icon: React.ComponentType<any>; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </motion.div>
  );
}

function ServiceCard({ service, sectionColor, sectionId, onNavigate }: { service: Service; sectionColor: string; sectionId: string; onNavigate: (path: string) => void }) {
  const route = INTERACTIVE_ROUTES[sectionId];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-all group cursor-pointer"
      onClick={() => {
        if (route) {
          onNavigate(route);
        } else {
          import("sonner").then(({ toast }) => {
            toast.info("هذه الخدمة قيد التطوير", { description: "سيتم إضافتها قريباً إن شاء الله" });
          });
        }
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-semibold text-gray-800 text-sm leading-relaxed group-hover:text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          {service.title}
        </h4>
        <div className="flex gap-1 shrink-0">
          {(service.type === "interactive" || service.type === "both") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
              <Globe className="w-3 h-3" />
              تفاعلي
            </span>
          )}
          {(service.type === "downloadable" || service.type === "both") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Download className="w-3 h-3" />
              قابل للتحميل
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{service.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {service.price > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
              <ShoppingCart className="w-3 h-3" />
              {service.price} ر.س
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
              مجاني
            </span>
          )}
        </div>
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: route ? sectionColor : "#9CA3AF" }}
        >
          {route ? (
            <>
              <Zap className="w-3 h-3" />
              ابدأ الآن
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              قريباً
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function SectionView({ section, onBack, onNavigate }: { section: Section; onBack: () => void; onNavigate: (path: string) => void }) {
  const Icon = iconMap[section.icon] || FileText;
  const [filter, setFilter] = useState<"all" | "interactive" | "downloadable" | "both">("all");
  const route = INTERACTIVE_ROUTES[section.id];

  const filtered = useMemo(() => {
    if (filter === "all") return section.services;
    return section.services.filter((s) => s.type === filter || s.type === "both");
  }, [section.services, filter]);

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">العودة للأقسام</span>
      </button>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: section.color + "15" }}>
            <Icon className="w-7 h-7" style={{ color: section.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>{section.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{section.description}</p>
          </div>
        </div>
        {route && (
          <button
            onClick={() => onNavigate(route)}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: section.color }}
          >
            <Zap className="w-4 h-4" />
            فتح الخدمة التفاعلية
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-sm text-gray-500">تصفية:</span>
        {[
          { key: "all", label: "الكل", count: section.services.length },
          { key: "interactive", label: "تفاعلي", count: section.services.filter((s) => s.type === "interactive" || s.type === "both").length },
          { key: "downloadable", label: "قابل للتحميل", count: section.services.filter((s) => s.type === "downloadable" || s.type === "both").length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.key
                ? "text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filter === f.key ? { backgroundColor: section.color } : {}}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} sectionColor={section.color} sectionId={section.id} onNavigate={onNavigate} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSidebar, setExpandedSidebar] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchServices(searchQuery);
  }, [searchQuery]);

  const totalServices = getTotalServicesCount();
  const interactiveCount = getInteractiveCount();
  const freeCount = getFreeCount();
  const paidCount = getPaidCount();

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-72 bg-white border-l border-gray-200 z-50 transition-transform duration-300 overflow-y-auto ${
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>SERS</h1>
              <p className="text-[10px] text-gray-500">نظام السجلات التعليمية الذكي</p>
            </div>
          </div>
        </div>

        <nav className="p-3">
          <button
            onClick={() => { setSelectedSection(null); setSearchQuery(""); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
              !selectedSection ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            الرئيسية
          </button>

          <div className="mt-3 mb-2 px-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الأقسام ({sections.length})</span>
          </div>

          {sections.map((section) => {
            const Icon = iconMap[section.icon] || FileText;
            const isActive = selectedSection?.id === section.id;
            const hasRoute = !!INTERACTIVE_ROUTES[section.id];
            return (
              <div key={section.id} className="mb-0.5">
                <button
                  onClick={() => {
                    setSelectedSection(section);
                    setSearchQuery("");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: section.color }} />
                  <span className="truncate flex-1 text-right">{section.title}</span>
                  <div className="flex items-center gap-1">
                    {hasRoute && <Zap className="w-3 h-3 text-teal-500" />}
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{section.services.length}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="lg:mr-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center gap-4 px-6 py-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600">
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1 max-w-xl">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الخدمات..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setSelectedSection(null); }}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-medium">{totalServices} خدمة</span>
              <span className="bg-gray-100 px-2 py-1 rounded-full">{sections.length} قسم</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Search results */}
          {searchQuery && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                نتائج البحث عن "{searchQuery}" ({searchResults.length} نتيجة)
              </h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد نتائج مطابقة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchResults.map(({ section, service }) => (
                    <div key={service.id} className="relative">
                      <div className="absolute -top-1 -right-1 z-10">
                        <span className="text-[9px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: section.color }}>
                          {section.title}
                        </span>
                      </div>
                      <ServiceCard service={service} sectionColor={section.color} sectionId={section.id} onNavigate={navigate} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section detail view */}
          {!searchQuery && selectedSection && (
            <SectionView section={selectedSection} onBack={() => setSelectedSection(null)} onNavigate={navigate} />
          )}

          {/* Home view */}
          {!searchQuery && !selectedSection && (
            <div>
              {/* Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden mb-8"
                style={{ minHeight: 280 }}
              >
                <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-teal-900/80 via-teal-800/60 to-transparent" />
                <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center h-full" style={{ minHeight: 280 }}>
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-white text-xs font-medium">نظام السجلات التعليمية الذكي</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      جميع الخدمات التعليمية
                      <br />
                      <span className="text-teal-200">في مكان واحد</span>
                    </h1>
                    <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-md">
                      نماذج تفاعلية حية وقوالب قابلة للتحميل والشراء مع دعم الباركودات التفاعلية والذكاء الاصطناعي وثيمات متعددة للتصدير
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Quick access to interactive services */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  <Zap className="w-5 h-5 inline ml-1 text-teal-600" />
                  الخدمات التفاعلية الجاهزة
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { route: "/performance-evidence", title: "شواهد الأداء الوظيفي", icon: "📋", color: "#059669", desc: "فورم كامل → معاينة → PDF" },
                    { route: "/certificates", title: "شهادات الشكر والتقدير", icon: "🏆", color: "#D97706", desc: "6 أنواع × 5 ثيمات → PDF" },
                    { route: "/grade-analysis", title: "تحليل النتائج", icon: "📊", color: "#2563EB", desc: "إدخال درجات → رسوم بيانية" },
                    { route: "/covers", title: "أغلفة وفواصل", icon: "📁", color: "#7C3AED", desc: "6 أنواع × 5 ألوان → PDF" },
                    { route: "/treatment-plans", title: "الخطط العلاجية", icon: "📝", color: "#DC2626", desc: "6 أنواع خطط → PDF" },
                  ].map((item, i) => (
                    <motion.button
                      key={item.route}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                      onClick={() => navigate(item.route)}
                      className="bg-white rounded-xl p-4 border border-gray-100 text-right transition-all group hover:border-gray-200"
                    >
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>{item.title}</h3>
                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold" style={{ color: item.color }}>
                        <Zap className="w-3 h-3" />
                        جاهز للاستخدام
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard value={totalServices} label="إجمالي الخدمات" icon={Sparkles} color="#059669" />
                <StatCard value={sections.length} label="قسم رئيسي" icon={FolderOpen} color="#7C3AED" />
                <StatCard value={interactiveCount} label="خدمة تفاعلية" icon={Globe} color="#0284C7" />
                <StatCard value={paidCount} label="قالب مدفوع" icon={ShoppingCart} color="#EA580C" />
              </div>

              {/* Features showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                  onClick={() => navigate("/performance-evidence")}
                >
                  <img src={FORMS_IMG} alt="نماذج تفاعلية" className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>نماذج تفاعلية حية</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">أدخل بياناتك مباشرة → معاينة فورية → تصدير PDF بثيمات متعددة مع باركودات QR تلقائية</p>
                    <div className="mt-3 flex items-center gap-1 text-sm font-bold text-teal-600">
                      <Zap className="w-4 h-4" />
                      جرّب الآن
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                  onClick={() => navigate("/certificates")}
                >
                  <img src={CERTS_IMG} alt="شهادات وقوالب" className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>شهادات شكر وتقدير</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">6 أنواع شهادات × 5 ثيمات ألوان → معاينة فورية → تصدير PDF مع QR</p>
                    <div className="mt-3 flex items-center gap-1 text-sm font-bold text-amber-600">
                      <Zap className="w-4 h-4" />
                      صمّم شهادتك
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* All sections grid */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>جميع الأقسام</h2>
                <p className="text-sm text-gray-500 mb-6">{sections.length} قسم رئيسي يغطي جميع احتياجات المعلمين والإداريين</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sections.map((section, i) => {
                  const Icon = iconMap[section.icon] || FileText;
                  const hasRoute = !!INTERACTIVE_ROUTES[section.id];
                  return (
                    <motion.button
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.1)" }}
                      onClick={() => {
                        if (hasRoute) {
                          navigate(INTERACTIVE_ROUTES[section.id]);
                        } else {
                          setSelectedSection(section);
                        }
                      }}
                      className="bg-white rounded-xl p-5 border border-gray-100 text-right transition-all group hover:border-gray-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: section.color + "12" }}
                        >
                          <Icon className="w-5 h-5" style={{ color: section.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1 group-hover:text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                            {section.title}
                          </h3>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: section.color + "12", color: section.color }}>
                            {section.services.length} خدمة
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{section.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                        {hasRoute && (
                          <span className="bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            تفاعلي
                          </span>
                        )}
                        <span className="bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
                          {section.services.filter((s) => s.type === "interactive" || s.type === "both").length} خدمة تفاعلية
                        </span>
                        {section.services.some((s) => s.price > 0) && (
                          <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
                            {section.services.filter((s) => s.price > 0).length} مدفوع
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer summary */}
              <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  {totalServices} خدمة في {sections.length} قسم
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {freeCount} خدمة مجانية · {paidCount} قالب مدفوع · {interactiveCount} خدمة تفاعلية
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["نماذج تفاعلية حية", "باركودات QR تلقائية", "ثيمات متعددة للتصدير", "ذكاء اصطناعي", "قابل للتعديل من الإدارة", "دعم الهوية الرسمية"].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
