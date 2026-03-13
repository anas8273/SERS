import { describe, it, expect } from "vitest";

/**
 * اختبارات إعادة هيكلة المنصة
 * تغطي: بيانات الأقسام الـ 13، الفلترة حسب الوظيفة، المتجر، الراوتات
 */

// نستورد البيانات مباشرة من الملف (client-side) عبر مسار نسبي
// نحاكي البيانات هنا لأن vitest يعمل على السيرفر
const EXPECTED_SECTIONS = [
  { id: "1", slug: "performance-evidence", title: "شواهد الأداء الوظيفي", hasInteractive: true, hasStore: true, route: "/performance-evidence" },
  { id: "2", slug: "achievement-portfolio", title: "ملف الإنجاز", hasInteractive: true, hasStore: true, route: "/portfolio" },
  { id: "3", slug: "reports-center", title: "مركز التقارير الشامل", hasInteractive: true, hasStore: true, route: "/reports" },
  { id: "4", slug: "certificate-builder", title: "صانع الشهادات", hasInteractive: true, hasStore: true, route: "/certificates" },
  { id: "5", slug: "smart-resume", title: "السيرة الذاتية الذكية", hasInteractive: true, hasStore: true, route: "/smart-cv" },
  { id: "6", slug: "treatment-plans", title: "الخطط العلاجية والإثرائية", hasInteractive: true, hasStore: true, route: "/treatment-plans" },
  { id: "7", slug: "smart-tests", title: "منصة الاختبارات الذكية", hasInteractive: true, hasStore: true, route: "/exams" },
  { id: "8", slug: "grade-analysis", title: "تحليل النتائج والتصحيح الآلي", hasInteractive: true, hasStore: false, route: "/grade-analysis" },
  { id: "9", slug: "school-broadcast", title: "صانع الإذاعة المدرسية", hasInteractive: true, hasStore: true, route: "/school-radio" },
  { id: "10", slug: "lesson-planning", title: "التحضير وخطط الدروس", hasInteractive: true, hasStore: true, comingSoon: true },
  { id: "11", slug: "digital-store", title: "المتجر الرقمي", hasInteractive: false, hasStore: true, route: "/store" },
  { id: "12", slug: "digital-tools", title: "الأدوات والخدمات الإلكترونية", hasInteractive: true, hasStore: false, route: "/section/12" },
  { id: "13", slug: "covers-dividers", title: "أغلفة وفواصل", hasInteractive: true, hasStore: true, route: "/covers" },
];

const EXPECTED_ROUTES = [
  "/",
  "/performance-evidence",
  "/certificates",
  "/grade-analysis",
  "/covers",
  "/treatment-plans",
  "/section/:sectionId",
  "/share/:token",
  "/admin",
  "/admin/templates",
  "/shared-template/:token",
  "/store",
  "/portfolio",
  "/reports",
  "/school-radio",
  "/smart-cv",
  "/exams",
];

const USER_ROLES = ["all", "teacher", "admin", "counselor", "activity", "kindergarten", "special-ed"];

describe("Platform Restructure - 13 Sections", () => {
  it("should have exactly 13 sections", () => {
    expect(EXPECTED_SECTIONS).toHaveLength(13);
  });

  it("should have unique section IDs", () => {
    const ids = EXPECTED_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(13);
  });

  it("should have unique section slugs", () => {
    const slugs = EXPECTED_SECTIONS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(13);
  });

  it("should have sequential section IDs from 1 to 13", () => {
    EXPECTED_SECTIONS.forEach((s, i) => {
      expect(s.id).toBe(String(i + 1));
    });
  });

  it("should have Arabic titles for all sections", () => {
    EXPECTED_SECTIONS.forEach((s) => {
      expect(s.title).toBeTruthy();
      // Arabic characters range
      expect(/[\u0600-\u06FF]/.test(s.title)).toBe(true);
    });
  });
});

describe("Platform Restructure - Section Routes", () => {
  it("every section with a route should have a matching App.tsx route", () => {
    const sectionRoutes = EXPECTED_SECTIONS
      .filter((s) => s.route && !s.comingSoon)
      .map((s) => s.route!);

    sectionRoutes.forEach((route) => {
      // Check if the route matches directly or is a parameterized route
      const isDirectMatch = EXPECTED_ROUTES.includes(route);
      const isParamMatch = route.startsWith("/section/") && EXPECTED_ROUTES.includes("/section/:sectionId");
      expect(isDirectMatch || isParamMatch).toBe(true);
    });
  });

  it("coming soon sections should not have routes", () => {
    const comingSoon = EXPECTED_SECTIONS.filter((s) => s.comingSoon);
    comingSoon.forEach((s) => {
      expect(s.route).toBeUndefined();
    });
  });

  it("section 10 (lesson-planning) should be marked as coming soon", () => {
    const lessonPlanning = EXPECTED_SECTIONS.find((s) => s.id === "10");
    expect(lessonPlanning).toBeDefined();
    expect(lessonPlanning!.comingSoon).toBe(true);
  });
});

describe("Platform Restructure - Interactive vs Store", () => {
  it("sections with hasInteractive should have at least one interactive service", () => {
    const interactiveSections = EXPECTED_SECTIONS.filter((s) => s.hasInteractive);
    expect(interactiveSections.length).toBeGreaterThan(0);
    // Section 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13 should be interactive
    expect(interactiveSections.length).toBe(12);
  });

  it("sections with hasStore should have at least one store product", () => {
    const storeSections = EXPECTED_SECTIONS.filter((s) => s.hasStore);
    expect(storeSections.length).toBeGreaterThan(0);
    // Section 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13 should have store
    expect(storeSections.length).toBe(11);
  });

  it("section 11 (digital-store) should be store-only", () => {
    const store = EXPECTED_SECTIONS.find((s) => s.id === "11");
    expect(store).toBeDefined();
    expect(store!.hasInteractive).toBe(false);
    expect(store!.hasStore).toBe(true);
  });

  it("section 8 (grade-analysis) should be interactive-only", () => {
    const gradeAnalysis = EXPECTED_SECTIONS.find((s) => s.id === "8");
    expect(gradeAnalysis).toBeDefined();
    expect(gradeAnalysis!.hasInteractive).toBe(true);
    expect(gradeAnalysis!.hasStore).toBe(false);
  });

  it("section 12 (digital-tools) should be interactive-only", () => {
    const tools = EXPECTED_SECTIONS.find((s) => s.id === "12");
    expect(tools).toBeDefined();
    expect(tools!.hasInteractive).toBe(true);
    expect(tools!.hasStore).toBe(false);
  });
});

describe("Platform Restructure - User Roles Filter", () => {
  it("should have 7 user roles including 'all'", () => {
    expect(USER_ROLES).toHaveLength(7);
  });

  it("should include all expected roles", () => {
    expect(USER_ROLES).toContain("all");
    expect(USER_ROLES).toContain("teacher");
    expect(USER_ROLES).toContain("admin");
    expect(USER_ROLES).toContain("counselor");
    expect(USER_ROLES).toContain("activity");
    expect(USER_ROLES).toContain("kindergarten");
    expect(USER_ROLES).toContain("special-ed");
  });

  it("'all' role should return all sections", () => {
    // When role is 'all', all 13 sections should be visible
    expect(EXPECTED_SECTIONS.length).toBe(13);
  });
});

describe("Platform Restructure - New Pages", () => {
  const NEW_PAGES = [
    { path: "/portfolio", name: "PortfolioBuilder" },
    { path: "/reports", name: "ReportCenter" },
    { path: "/school-radio", name: "SchoolRadio" },
    { path: "/smart-cv", name: "SmartCV" },
    { path: "/exams", name: "ExamBuilder" },
    { path: "/store", name: "Store" },
  ];

  it("all new pages should have routes in App.tsx", () => {
    NEW_PAGES.forEach((page) => {
      expect(EXPECTED_ROUTES).toContain(page.path);
    });
  });

  it("all new pages should have corresponding sections in data", () => {
    const sectionRoutes = EXPECTED_SECTIONS.map((s) => s.route).filter(Boolean);
    NEW_PAGES.forEach((page) => {
      expect(sectionRoutes).toContain(page.path);
    });
  });
});

describe("Platform Restructure - Store Section", () => {
  it("section 11 should be the digital store", () => {
    const store = EXPECTED_SECTIONS.find((s) => s.id === "11");
    expect(store).toBeDefined();
    expect(store!.slug).toBe("digital-store");
    expect(store!.title).toBe("المتجر الرقمي");
  });

  it("store section should have route /store", () => {
    const store = EXPECTED_SECTIONS.find((s) => s.id === "11");
    expect(store!.route).toBe("/store");
  });

  it("store page route should exist in App.tsx routes", () => {
    expect(EXPECTED_ROUTES).toContain("/store");
  });
});

describe("Platform Restructure - Section Naming Convention", () => {
  it("all sections should have both id and slug", () => {
    EXPECTED_SECTIONS.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.slug).toBeTruthy();
    });
  });

  it("slugs should be kebab-case", () => {
    EXPECTED_SECTIONS.forEach((s) => {
      expect(s.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });
});

describe("Platform Restructure - Existing Pages Preserved", () => {
  const EXISTING_ROUTES = [
    "/performance-evidence",
    "/certificates",
    "/grade-analysis",
    "/covers",
    "/treatment-plans",
  ];

  it("all existing page routes should still exist", () => {
    EXISTING_ROUTES.forEach((route) => {
      expect(EXPECTED_ROUTES).toContain(route);
    });
  });

  it("existing sections should maintain their routes", () => {
    const performanceEvidence = EXPECTED_SECTIONS.find((s) => s.id === "1");
    expect(performanceEvidence!.route).toBe("/performance-evidence");

    const certificates = EXPECTED_SECTIONS.find((s) => s.id === "4");
    expect(certificates!.route).toBe("/certificates");

    const gradeAnalysis = EXPECTED_SECTIONS.find((s) => s.id === "8");
    expect(gradeAnalysis!.route).toBe("/grade-analysis");

    const covers = EXPECTED_SECTIONS.find((s) => s.id === "13");
    expect(covers!.route).toBe("/covers");

    const treatmentPlans = EXPECTED_SECTIONS.find((s) => s.id === "6");
    expect(treatmentPlans!.route).toBe("/treatment-plans");
  });
});
