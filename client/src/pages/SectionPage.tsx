/*
 * صفحة عرض القسم وخدماته - صفحة عامة ديناميكية
 * تعرض خدمات أي قسم مع إمكانية الدخول لكل خدمة
 */
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Zap, ShoppingCart, ExternalLink } from "lucide-react";
import { sections } from "@/lib/data";

export default function SectionPage() {
  const params = useParams<{ sectionId: string }>();
  const [, navigate] = useLocation();

  const section = sections.find((s) => s.slug === params.sectionId || s.id === params.sectionId);

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

  // Map service routes
  const getServiceRoute = (serviceId: string, sectionId: string): string | null => {
    // الخدمات التفاعلية المبنية
    if (sectionId === "performance-evidence" || sectionId === "1") return "/performance-evidence";
    if (sectionId === "certificates" || sectionId === "8") return "/certificates";
    if (sectionId === "grade-analysis" || sectionId === "4") return "/grade-analysis";
    if (sectionId === "covers-templates" || sectionId === "3") return "/covers";
    if (sectionId === "treatment-plans" || sectionId === "6") return "/treatment-plans";
    return null;
  };

  const sectionRoute = getServiceRoute("", section.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">العودة للرئيسية</span>
        </button>

        {/* هيدر القسم */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: section.color + "15" }}
            >
              {section.icon}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                {section.title}
              </h1>
              <p className="text-sm text-gray-500">{section.services.length} خدمة متاحة</p>
            </div>
          </div>
        </div>

        {/* الخدمات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {section.services.map((service, index) => {
            const isInteractive = service.type === "interactive";
            const isPaid = service.type === "downloadable" || service.type === "both";

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer transition-all group"
                onClick={() => {
                  if (sectionRoute) {
                    navigate(sectionRoute);
                  } else {
                    // Toast for unbuilt services
                    import("sonner").then(({ toast }) => {
                      toast.info("هذه الخدمة قيد التطوير", {
                        description: "سيتم إضافتها قريباً إن شاء الله",
                      });
                    });
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: section.color + "15" }}
                  >
                    {isInteractive ? "⚡" : isPaid ? "💰" : "📄"}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isInteractive ? "#dcfce7" : isPaid ? "#fef3c7" : "#f1f5f9",
                      color: isInteractive ? "#166534" : isPaid ? "#92400e" : "#475569",
                    }}
                  >
                    {isInteractive ? "تفاعلي" : isPaid ? "مدفوع" : "مجاني"}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-teal-700 transition-colors" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  {service.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{service.description}</p>

                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: section.color }}>
                  {sectionRoute ? (
                    <>
                      <Zap className="w-3 h-3" />
                      ابدأ الآن
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      قريباً
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
