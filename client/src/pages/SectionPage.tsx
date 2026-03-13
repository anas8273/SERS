/*
 * صفحة عرض القسم وخدماته - صفحة عامة ديناميكية
 * تعرض خدمات أي قسم مع إمكانية الدخول لكل خدمة
 * يدعم الأقسام الـ 13 الجديدة مع فلترة حسب النوع
 */
import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Zap, ShoppingBag, Play, Clock,
  Award, FolderOpen, BarChart3, TrendingUp, HeartPulse,
  CalendarDays, ClipboardCheck, Medal, GraduationCap, BookOpen,
  Radio, Table2, Lightbulb, Users, Presentation, Wrench, Mail,
  UserCircle, ShoppingCart, Download, Star, Filter, ExternalLink
} from "lucide-react";
import { sections, type Section, type Service } from "@/lib/data";

// Icon map for sections
const iconMap: Record<string, React.ComponentType<any>> = {
  Award, FolderOpen, FileText, BarChart3, TrendingUp, HeartPulse,
  CalendarDays, ClipboardCheck, Medal, GraduationCap, BookOpen,
  Radio, Table2, Lightbulb, Users, Presentation, Zap, Wrench, Mail,
  ShoppingBag, UserCircle,
};

// خريطة الأقسام التي لها صفحات تفاعلية مبنية
const INTERACTIVE_ROUTES: Record<string, string> = {
  "1": "/performance-evidence",
  "4": "/certificates",
  "6": "/treatment-plans",
  "8": "/grade-analysis",
  "13": "/covers",
};

type FilterMode = "all" | "interactive" | "store";

export default function SectionPage() {
  const params = useParams<{ sectionId: string }>();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterMode>("all");

  const section = sections.find((s) => s.slug === params.sectionId || s.id === params.sectionId);

  const filteredServices = useMemo(() => {
    if (!section) return [];
    if (filter === "all") return section.services;
    if (filter === "interactive") return section.services.filter((s) => s.mode === "interactive" || s.mode === "both");
    if (filter === "store") return section.services.filter((s) => s.mode === "store" || s.mode === "both");
    return section.services;
  }, [section, filter]);

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-2">القسم غير موجود</h1>
          <button type="button" onClick={() => navigate("/")} className="text-teal-600 hover:underline text-sm">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[section.icon] || FileText;
  const sectionRoute = section.route || INTERACTIVE_ROUTES[section.id];
  const interactiveCount = section.services.filter((s) => s.mode === "interactive" || s.mode === "both").length;
  const storeCount = section.services.filter((s) => s.mode === "store" || s.mode === "both").length;

  const handleServiceClick = (service: Service) => {
    if (service.comingSoon) {
      import("sonner").then(({ toast }) => {
        toast.info("قريباً إن شاء الله", { description: "هذه الخدمة قيد التطوير" });
      });
      return;
    }
    if (service.mode === "interactive" || service.mode === "both") {
      if (sectionRoute) {
        navigate(sectionRoute);
      } else {
        import("sonner").then(({ toast }) => {
          toast.info("قيد التطوير", { description: "الخدمة التفاعلية قيد البناء" });
        });
      }
    } else {
      // Store item - show coming soon for payment
      import("sonner").then(({ toast }) => {
        toast.info("المتجر قيد التجهيز", { description: `${service.title} - ${service.price > 0 ? service.price + " ر.س" : "مجاني"} — سيتوفر قريباً` });
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Section Header - Full Width */}
      <div className="w-full" style={{ backgroundColor: section.color }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                {section.title}
              </h1>
              <p className="text-white/80 text-sm mt-1">{section.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-white/90 text-xs bg-white/15 px-2.5 py-0.5 rounded-full">{section.services.length} خدمة</span>
                {interactiveCount > 0 && (
                  <span className="text-white/90 text-xs bg-white/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Play className="w-3 h-3" /> {interactiveCount} تفاعلي
                  </span>
                )}
                {storeCount > 0 && (
                  <span className="text-white/90 text-xs bg-white/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {storeCount} متجر
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter bar */}
        {(interactiveCount > 0 && storeCount > 0) && (
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">عرض:</span>
            {[
              { key: "all" as FilterMode, label: "الكل", count: section.services.length },
              { key: "interactive" as FilterMode, label: "تفاعلي", count: interactiveCount, icon: Play },
              { key: "store" as FilterMode, label: "متجر", count: storeCount, icon: ShoppingBag },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.key
                    ? "text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
                style={filter === f.key ? { backgroundColor: section.color } : {}}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        )}

        {/* Interactive CTA */}
        {sectionRoute && section.hasInteractive && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.12)" }}
            onClick={() => navigate(sectionRoute)}
            className="w-full bg-white rounded-2xl border-2 p-6 mb-6 text-right transition-all group"
            style={{ borderColor: section.color + "40" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: section.color + "12" }}>
                  <Zap className="w-7 h-7" style={{ color: section.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    فتح الخدمة التفاعلية
                  </h3>
                  <p className="text-sm text-gray-500">ابدأ باستخدام الأداة التفاعلية مباشرة</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: section.color }}>
                <Zap className="w-4 h-4" />
                ابدأ الآن
              </div>
            </div>
          </motion.button>
        )}

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              const isInteractive = service.mode === "interactive" || service.mode === "both";
              const isStore = service.mode === "store" || service.mode === "both";
              const isComingSoon = service.comingSoon;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={!isComingSoon ? { y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" } : undefined}
                  className={`bg-white rounded-xl border p-5 transition-all group ${
                    isComingSoon ? "border-dashed border-gray-300 opacity-70" : "border-gray-100 hover:border-gray-200 cursor-pointer"
                  }`}
                  onClick={() => handleServiceClick(service)}
                >
                  {/* Tags row */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {isInteractive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                        <Play className="w-3 h-3" /> تفاعلي
                      </span>
                    )}
                    {isStore && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-700 border border-pink-200">
                        <ShoppingBag className="w-3 h-3" /> متجر
                      </span>
                    )}
                    {isComingSoon && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                        <Clock className="w-3 h-3" /> قريباً
                      </span>
                    )}
                    {service.format && service.format.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {service.format.join(" · ").toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {service.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{service.description}</p>

                  {/* Price + action */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      {service.price > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                          <ShoppingCart className="w-3 h-3" /> {service.price} ر.س
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-green-600">مجاني</span>
                      )}
                    </div>
                    {!isComingSoon && (
                      <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: section.color }}>
                        {isInteractive && sectionRoute ? (
                          <><Zap className="w-3 h-3" /> ابدأ الآن</>
                        ) : isStore ? (
                          <><ShoppingBag className="w-3 h-3" /> تصفح</>
                        ) : (
                          <><FileText className="w-3 h-3" /> قريباً</>
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
