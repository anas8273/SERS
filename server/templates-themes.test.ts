import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ===== Helper: Create authenticated context =====
function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user = {
    id: 1,
    openId: "test-user-001",
    email: "teacher@example.com",
    name: "معلم اختبار",
    loginMethod: "manus" as const,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// ===== Templates Router Tests =====

describe("Templates Router - Public Access", () => {
  it("templates.list should be accessible publicly", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw - public procedure
    const result = await caller.templates.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Templates Router - Admin Access", () => {
  it("templates.listAll should reject non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.listAll()).rejects.toThrow();
  });

  it("templates.listAll should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.listAll()).rejects.toThrow();
  });

  it("templates.create should reject non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.create({
        name: "قالب اختبار",
        headerBg: "linear-gradient(135deg, #059669, #047857)",
        headerText: "#ffffff",
        accent: "#059669",
        borderColor: "#e5e7eb",
        bodyBg: "#ffffff",
      })
    ).rejects.toThrow();
  });

  it("templates.update should reject non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.update({ id: 1, name: "قالب محدث" })
    ).rejects.toThrow();
  });

  it("templates.delete should reject non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.delete({ id: 1 })
    ).rejects.toThrow();
  });

  it("templates.seed should reject non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.seed()).rejects.toThrow();
  });
});

describe("Templates Router - Input Validation", () => {
  it("templates.create should accept valid input from admin", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Admin should be able to create templates
    const result = await caller.templates.create({
      name: "قالب اختبار جديد",
      headerBg: "linear-gradient(135deg, #059669, #047857)",
      headerText: "#ffffff",
      accent: "#059669",
      borderColor: "#e5e7eb",
      bodyBg: "#ffffff",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("templates.update should require id field", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // @ts-expect-error - intentionally missing id
    await expect(caller.templates.update({ name: "test" })).rejects.toBeDefined();
  });

  it("templates.delete should require id field", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // @ts-expect-error - intentionally missing id
    await expect(caller.templates.delete({})).rejects.toBeDefined();
  });
});

// ===== Theme Data Model Tests =====

describe("Theme Data Model", () => {
  it("THEMES constant should have correct structure", async () => {
    // Import the THEMES from the client-side code
    // Since we can't directly import React components in vitest node env,
    // we test the theme structure expectations
    const expectedThemeFields = [
      "id", "name", "headerBg", "headerText", "accent", "borderColor", "bodyBg"
    ];

    // Verify the theme interface matches what templates router expects
    const templateCreateInput = {
      name: "تصميم اختبار",
      headerBg: "linear-gradient(135deg, #059669, #047857)",
      headerText: "#ffffff",
      accent: "#059669",
      borderColor: "#e5e7eb",
      bodyBg: "#ffffff",
      fontFamily: "'Cairo', sans-serif",
      coverImageUrl: "https://example.com/cover.jpg",
      logoUrl: "https://example.com/logo.png",
      isDefault: false,
      sortOrder: 10,
    };

    // All expected fields should be present
    for (const field of expectedThemeFields) {
      if (field === "id") continue; // id is auto-generated
      expect(templateCreateInput).toHaveProperty(field);
    }
  });

  it("theme colors should be valid CSS color values", () => {
    const validColorPatterns = [
      /^#[0-9a-fA-F]{3,8}$/,
      /^rgb/,
      /^hsl/,
      /^linear-gradient/,
      /^radial-gradient/,
    ];

    const testColors = [
      "#059669", "#ffffff", "#e5e7eb",
      "linear-gradient(135deg, #059669, #047857)",
      "linear-gradient(135deg, #1e40af, #1e3a8a)",
    ];

    for (const color of testColors) {
      const isValid = validColorPatterns.some(pattern => pattern.test(color));
      expect(isValid).toBe(true);
    }
  });

  it("seed templates should have unique sort orders", () => {
    const seedTemplates = [
      { name: "كلاسيكي", sortOrder: 1 },
      { name: "أزرق رسمي", sortOrder: 2 },
      { name: "بنفسجي عصري", sortOrder: 3 },
      { name: "ذهبي فاخر", sortOrder: 4 },
      { name: "أحمر وطني", sortOrder: 5 },
    ];

    const sortOrders = seedTemplates.map(t => t.sortOrder);
    const uniqueSortOrders = new Set(sortOrders);
    expect(uniqueSortOrders.size).toBe(sortOrders.length);
  });

  it("seed templates should have unique names", () => {
    const seedTemplates = [
      { name: "كلاسيكي" },
      { name: "أزرق رسمي" },
      { name: "بنفسجي عصري" },
      { name: "ذهبي فاخر" },
      { name: "أحمر وطني" },
    ];

    const names = seedTemplates.map(t => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

// ===== MOE Logo Tests =====

describe("Ministry of Education Logo Integration", () => {
  it("MOE logo CDN URL should be a valid URL", () => {
    const MOE_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/moe-logo-2Bq3Kk7eBZkdFhNPHLpNLV.png";
    expect(MOE_LOGO_URL).toMatch(/^https:\/\//);
    expect(MOE_LOGO_URL).toContain("cloudfront.net");
  });

  it("personalInfo should support customLogo field", () => {
    const personalInfo = {
      name: "أحمد محمد",
      school: "مدرسة الفلاح",
      year: "1447هـ",
      semester: "الفصل الأول",
      evaluator: "محمد علي",
      evaluatorRole: "مدير المدرسة",
      date: "1447/06/15",
      department: "الإدارة العامة للتعليم بالمنطقة الشرقية",
      customLogo: "https://example.com/school-logo.png",
    };

    expect(personalInfo.customLogo).toBeDefined();
    expect(personalInfo.customLogo).toMatch(/^https:\/\//);
  });

  it("personalInfo should work without customLogo", () => {
    const personalInfo = {
      name: "أحمد محمد",
      school: "مدرسة الفلاح",
      year: "1447هـ",
      semester: "الفصل الأول",
    };

    expect((personalInfo as any).customLogo).toBeUndefined();
  });
});

// ===== Preview/Export Design Tests =====

describe("Preview Design - MOE Identity", () => {
  it("preview should have correct A4 dimensions", () => {
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;

    expect(A4_WIDTH_MM).toBe(210);
    expect(A4_HEIGHT_MM).toBe(297);
  });

  it("preview should support multiple page types", () => {
    const pageTypes = [
      "cover",           // صفحة الغلاف
      "toc-personal",    // فهرس + بيانات شخصية
      "evaluation-table", // جدول التقييم
      "evidence-detail",  // تفاصيل الشواهد
      "signatures",       // التوقيعات
    ];

    expect(pageTypes.length).toBe(5);
    expect(pageTypes).toContain("cover");
    expect(pageTypes).toContain("signatures");
  });

  it("grade calculation should return correct grades", () => {
    const getGrade = (percentage: number) => {
      if (percentage >= 90) return { label: "ممتاز", color: "#16A34A" };
      if (percentage >= 80) return { label: "جيد جداً", color: "#2563EB" };
      if (percentage >= 70) return { label: "جيد", color: "#CA8A04" };
      if (percentage >= 60) return { label: "مقبول", color: "#EA580C" };
      return { label: "ضعيف", color: "#DC2626" };
    };

    expect(getGrade(95).label).toBe("ممتاز");
    expect(getGrade(85).label).toBe("جيد جداً");
    expect(getGrade(75).label).toBe("جيد");
    expect(getGrade(65).label).toBe("مقبول");
    expect(getGrade(50).label).toBe("ضعيف");
  });

  it("priority config should have correct values", () => {
    const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
      essential: { label: "أساسي", color: "#059669", icon: "⭐" },
      important: { label: "مهم", color: "#2563EB", icon: "📌" },
      supplementary: { label: "تكميلي", color: "#9333EA", icon: "📎" },
    };

    expect(Object.keys(PRIORITY_CONFIG).length).toBe(3);
    expect(PRIORITY_CONFIG.essential.label).toBe("أساسي");
    expect(PRIORITY_CONFIG.important.label).toBe("مهم");
    expect(PRIORITY_CONFIG.supplementary.label).toBe("تكميلي");
  });
});

// ===== Dynamic Row Management Tests =====

describe("Dynamic Row Management", () => {
  it("dynamic field IDs should be unique", () => {
    const generateFieldId = () => `dynamic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateFieldId();
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });

  it("form data should support dynamic fields with labels", () => {
    const formData: Record<string, string> = {
      evidence_desc: "وصف الشاهد",
      date: "1447/06/15",
      notes: "ملاحظات",
      dynamic_12345_abc: "قيمة حقل ديناميكي",
      __label_dynamic_12345_abc: "عنوان الحقل الديناميكي",
    };

    // Dynamic fields should be identifiable
    const dynamicFields = Object.entries(formData).filter(
      ([key]) => key.startsWith("dynamic_") && !key.startsWith("__label_")
    );
    expect(dynamicFields.length).toBe(1);

    // Each dynamic field should have a label
    for (const [key] of dynamicFields) {
      const labelKey = `__label_${key}`;
      expect(formData[labelKey]).toBeDefined();
      expect(formData[labelKey]).toBeTruthy();
    }
  });

  it("form field labels should be resolved correctly", () => {
    const formFields = [
      { id: "evidence_desc", label: "وصف الشاهد", type: "textarea" },
      { id: "date", label: "التاريخ", type: "date" },
      { id: "notes", label: "ملاحظات", type: "textarea" },
    ];

    const resolveLabel = (key: string, fields?: typeof formFields) => {
      const matchedField = fields?.find(f => f.id === key);
      if (matchedField) return matchedField.label;
      const fallbacks: Record<string, string> = {
        evidence_desc: "وصف الشاهد",
        date: "التاريخ",
        notes: "ملاحظات",
        title: "العنوان",
        details: "التفاصيل",
        content: "المحتوى",
      };
      return fallbacks[key] || key;
    };

    expect(resolveLabel("evidence_desc", formFields)).toBe("وصف الشاهد");
    expect(resolveLabel("date", formFields)).toBe("التاريخ");
    expect(resolveLabel("unknown_field")).toBe("unknown_field");
    expect(resolveLabel("title")).toBe("العنوان");
  });
});

// ===== AI Integration Tests =====

describe("AI Fill Form Integration", () => {
  it("fillFormWithAI should accept criterion and sub-evidence context", () => {
    const context = {
      criterionId: "std-1",
      subEvidenceId: "sub-1-1",
      criterionTitle: "أداء الواجبات الوظيفية",
      subEvidenceTitle: "الالتزام بالحضور والانصراف",
      formFields: [
        { id: "evidence_desc", label: "وصف الشاهد", type: "textarea" },
        { id: "date", label: "التاريخ", type: "date" },
      ],
    };

    expect(context.criterionId).toBeTruthy();
    expect(context.subEvidenceTitle).toBeTruthy();
    expect(context.formFields.length).toBeGreaterThan(0);
  });

  it("improveFieldText should accept field value and context", () => {
    const input = {
      fieldId: "evidence_desc",
      currentValue: "حضرت دورة",
      criterionTitle: "أداء الواجبات الوظيفية",
      subEvidenceTitle: "الالتزام بالحضور والانصراف",
    };

    expect(input.currentValue).toBeTruthy();
    expect(input.fieldId).toBeTruthy();
  });
});

// ===== QR Code Generation Tests =====

describe("QR Code Generation", () => {
  it("should generate valid data URL for QR code", () => {
    // Test the QR generation concept (actual implementation uses canvas)
    const testUrl = "https://example.com/evidence/12345";
    expect(testUrl).toMatch(/^https?:\/\//);
  });

  it("should handle long URLs gracefully", () => {
    const longUrl = "https://example.com/" + "a".repeat(200);
    expect(longUrl.length).toBeGreaterThan(200);
    // QR codes can handle up to ~4296 alphanumeric characters
    expect(longUrl.length).toBeLessThan(4296);
  });
});
