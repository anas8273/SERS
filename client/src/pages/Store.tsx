/*
 * المتجر الرقمي الموحد - عرض جميع المنتجات الرقمية
 * فلترة حسب الفئة + الوظيفة + البحث
 * بدون دفع حالياً - عرض فقط مع "قريباً"
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, X, ShoppingBag, Filter, Star,
  Download, FileText, ShoppingCart, Tag, Eye, Clock,
  LayoutGrid, GraduationCap, Building2, HeartHandshake,
  Trophy, Baby, Accessibility, Sparkles
} from "lucide-react";
import {
  sections, getStoreCategories, USER_ROLES,
  type Section, type Service, type UserRole
} from "@/lib/data";

// Gather all store items from all sections
function getAllStoreItems(): { section: Section; service: Service }[] {
  const results: { section: Section; service: Service }[] = [];
  for (const section of sections) {
    for (const service of section.services) {
      if (service.mode === "store" || service.mode === "both") {
        results.push({ section, service });
      }
    }
  }
  return results;
}

// Get unique categories from all store items
function getAllCategories(): string[] {
  const cats = new Set<string>();
  for (const section of sections) {
    for (const service of section.services) {
      if ((service.mode === "store" || service.mode === "both") && service.category) {
        cats.add(service.category);
      }
    }
    // Also add section title as category for section-level store items
    if (section.hasStore) {
      cats.add(section.title);
    }
  }
  return Array.from(cats);
}

// Role icon map
const roleIconMap: Record<string, React.ComponentType<any>> = {
  LayoutGrid, GraduationCap, Building2, HeartHandshake, Trophy, Baby, Accessibility,
};

export default function Store() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("all");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "free-first">("default");

  const allItems = useMemo(() => getAllStoreItems(), []);

  // Get section-based categories
  const sectionCategories = useMemo(() => {
    const cats: { id: string; label: string; count: number }[] = [];
    for (const section of sections) {
      const storeItems = section.services.filter((s) => s.mode === "store" || s.mode === "both");
      if (storeItems.length > 0) {
        cats.push({ id: section.id, label: section.title, count: storeItems.length });
      }
    }
    return cats;
  }, []);

  // Sub-categories from section 11 (digital store)
  const subCategories = useMemo(() => getStoreCategories(), []);

  const filteredItems = useMemo(() => {
    let items = [...allItems];

    // Filter by category (section-based)
    if (selectedCategory !== "all") {
      items = items.filter(({ section, service }) => {
        if (selectedCategory.startsWith("sub:")) {
          return service.category === selectedCategory.replace("sub:", "");
        }
        return section.id === selectedCategory;
      });
    }

    // Filter by role
    if (selectedRole !== "all") {
      items = items.filter(({ service }) => {
        if (!service.roles || service.roles.includes("all")) return true;
        return service.roles.includes(selectedRole);
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(({ section, service }) =>
        service.title.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        section.title.toLowerCase().includes(q) ||
        (service.category && service.category.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "price-low") items.sort((a, b) => a.service.price - b.service.price);
    else if (sortBy === "price-high") items.sort((a, b) => b.service.price - a.service.price);
    else if (sortBy === "free-first") items.sort((a, b) => (a.service.price === 0 ? -1 : 1) - (b.service.price === 0 ? -1 : 1));

    return items;
  }, [allItems, selectedCategory, selectedRole, searchQuery, sortBy]);

  const totalFree = allItems.filter(({ service }) => service.price === 0).length;
  const totalPaid = allItems.filter(({ service }) => service.price > 0).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="w-full bg-gradient-to-l from-pink-700 via-pink-600 to-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">العودة للرئيسية</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                المتجر الرقمي
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {allItems.length} منتج رقمي تعليمي · {totalFree} مجاني · {totalPaid} مدفوع
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث في المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          >
            <option value="default">الترتيب الافتراضي</option>
            <option value="free-first">المجاني أولاً</option>
            <option value="price-low">الأقل سعراً</option>
            <option value="price-high">الأعلى سعراً</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="lg:w-64 shrink-0">
            {/* Category filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                <Tag className="w-4 h-4 text-pink-600" />
                الأقسام
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === "all" ? "bg-pink-50 text-pink-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  الكل ({allItems.length})
                </button>
                {sectionCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat.id ? "bg-pink-50 text-pink-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-categories for digital store */}
            {subCategories.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  <FileText className="w-4 h-4 text-pink-600" />
                  فئات المتجر الرقمي
                </h3>
                <div className="space-y-1">
                  {subCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(`sub:${cat}`)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedCategory === `sub:${cat}` ? "bg-pink-50 text-pink-700" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Role filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                <Filter className="w-4 h-4 text-pink-600" />
                الوظيفة
              </h3>
              <div className="space-y-1">
                {USER_ROLES.map((role) => {
                  const Icon = roleIconMap[role.icon] || LayoutGrid;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                        selectedRole === role.id ? "bg-pink-50 text-pink-700" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{filteredItems.length} منتج</p>
              {(selectedCategory !== "all" || selectedRole !== "all" || searchQuery) && (
                <button
                  onClick={() => { setSelectedCategory("all"); setSelectedRole("all"); setSearchQuery(""); }}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  إزالة الفلاتر
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">لا توجد منتجات مطابقة</p>
                <p className="text-sm text-gray-400 mt-1">جرّب تغيير الفلاتر أو كلمات البحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map(({ section, service }, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all group cursor-pointer"
                      onClick={() => {
                        import("sonner").then(({ toast }) => {
                          toast.info("المتجر قيد التجهيز", {
                            description: `${service.title} — ${service.price > 0 ? service.price + " ر.س" : "مجاني"} — سيتوفر قريباً`,
                          });
                        });
                      }}
                    >
                      {/* Color bar */}
                      <div className="h-1.5" style={{ backgroundColor: section.color }} />

                      <div className="p-4">
                        {/* Section badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: section.color }}
                          >
                            {section.title}
                          </span>
                          {service.category && (
                            <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              {service.category}
                            </span>
                          )}
                        </div>

                        {/* Title + desc */}
                        <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                          {service.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{service.description}</p>

                        {/* Format tags */}
                        {service.format && service.format.length > 0 && (
                          <div className="flex items-center gap-1 mb-3">
                            {service.format.map((fmt) => (
                              <span key={fmt} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                                {fmt}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          {service.price > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm font-black text-orange-600">
                              {service.price} ر.س
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm font-black text-green-600">
                              <Star className="w-3.5 h-3.5" /> مجاني
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-500">
                            <Clock className="w-3 h-3" /> قريباً
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
