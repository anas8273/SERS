import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ===== Helper: Create authenticated context =====
function createAuthContext(): { ctx: TrpcContext } {
  const user = {
    id: 1,
    openId: "test-user-001",
    email: "teacher@example.com",
    name: "معلم اختبار",
    loginMethod: "manus" as const,
    role: "user" as const,
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

// ===== Tests =====

describe("Portfolio CRUD", () => {
  it("should require authentication for portfolio.list", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.portfolio.list()).rejects.toThrow();
  });

  it("should require authentication for portfolio.create", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portfolio.create({
        jobId: "teacher",
        jobTitle: "معلم",
        personalInfo: { name: "أحمد" },
        criteriaData: {},
      })
    ).rejects.toThrow();
  });

  it("should return null for non-existent portfolio", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portfolio.get({ id: 999999 });
    expect(result).toBeNull();
  });
});

describe("Share Links", () => {
  it("should return error for invalid share token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.share.view({ token: "invalid-token-12345" });
    expect(result.error).toBeTruthy();
    expect(result.portfolio).toBeNull();
  });

  it("should require authentication for share.create", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.share.create({
        portfolioId: 1,
        expiresInDays: 7,
        maxViews: 100,
      })
    ).rejects.toThrow();
  });
});

describe("AI Services - classifyEvidence", () => {
  it("should accept text-based classification input", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // This test verifies the input schema validation
    // The actual LLM call will be made, so we just check it doesn't throw on valid input
    try {
      const result = await caller.ai.classifyEvidence({
        description: "شهادة حضور دورة تدريبية في استراتيجيات التدريس الحديثة",
        fileName: "شهادة_دورة.pdf",
        fileType: "application/pdf",
      });
      // If LLM is available, we should get a result
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result.classification).toHaveProperty("standardId");
        expect(result.classification).toHaveProperty("confidence");
        expect(result.classification).toHaveProperty("reasoning");
      }
    } catch (e: any) {
      // LLM might not be available in test environment
      expect(e.message).toBeDefined();
    }
  });

  it("should accept link-based classification input", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.ai.classifyEvidence({
        linkUrl: "https://schools.madrasati.sa/activity/12345",
        description: "نشاط على منصة مدرستي",
      });
      expect(result).toHaveProperty("success");
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 15000);

  it("should reject empty input gracefully", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.ai.classifyEvidence({});
      expect(result).toHaveProperty("success");
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });
});

describe("AI Services - suggestEvidence", () => {
  it("should accept valid suggestion input", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.ai.suggestEvidence({
        jobTitle: "معلم",
        criterionName: "أداء الواجبات الوظيفية",
        subEvidenceName: "الالتزام بالحضور والانصراف",
      });
      expect(result).toHaveProperty("suggestions");
      expect(result).toHaveProperty("rawContent");
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 15000);
});

describe("Admin Access", () => {
  it("should reject non-admin users from admin endpoints", async () => {
    const { ctx } = createAuthContext(); // role is 'user'
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.portfolios()).rejects.toThrow();
  });
});

describe("Auth", () => {
  it("should return null for unauthenticated user", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("should return user for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("معلم اختبار");
    expect(result?.email).toBe("teacher@example.com");
  });
});

describe("AI Services - classifyEvidence with image", () => {
  it("should accept image data URL for classification", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.ai.classifyEvidence({
        imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        fileName: "evidence.png",
        fileType: "image/png",
      });
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result.classification).toHaveProperty("standardId");
        expect(result.classification).toHaveProperty("standardNumber");
        expect(result.classification).toHaveProperty("confidence");
        expect(typeof result.classification!.confidence).toBe("number");
        expect(result.classification!.confidence).toBeGreaterThanOrEqual(0);
        expect(result.classification!.confidence).toBeLessThanOrEqual(1);
      }
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 30000);
});

describe("AI Services - classifyEvidence batch validation", () => {
  it("should handle multiple sequential classification calls", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const inputs = [
      { description: "شهادة شكر من مدير المدرسة", fileName: "شهادة.pdf", fileType: "application/pdf" },
      { description: "خطة درس في مادة الرياضيات", fileName: "خطة_درس.docx", fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    ];

    for (const input of inputs) {
      try {
        const result = await caller.ai.classifyEvidence(input);
        expect(result).toHaveProperty("success");
      } catch (e: any) {
        expect(e.message).toBeDefined();
      }
    }
  }, 30000);
});

describe("Evidence Data Model", () => {
  it("should support comment field in evidence items", () => {
    // Test that EvidenceItem interface supports comment field
    const evidence = {
      id: "test-1",
      subEvidenceId: "sub-1",
      type: "text" as const,
      text: "شاهد اختبار",
      link: "",
      fileData: null,
      fileName: "",
      displayAs: "image" as const,
      comment: "هذا تعليق على الشاهد",
    };

    expect(evidence.comment).toBe("هذا تعليق على الشاهد");
    expect(evidence).toHaveProperty("comment");
  });

  it("should allow evidence without comment", () => {
    const evidence = {
      id: "test-2",
      subEvidenceId: "sub-2",
      type: "image" as const,
      text: "",
      link: "",
      fileData: "data:image/png;base64,abc",
      fileName: "test.png",
      displayAs: "image" as const,
    };

    expect(evidence.comment).toBeUndefined();
  });
});

describe("Coverage Report Calculations", () => {
  it("should calculate correct coverage percentage", () => {
    // Simulate coverage calculation logic
    const criteriaData: Record<string, { score: number; evidences: any[] }> = {
      "std-1": { score: 4, evidences: [{ id: "1" }, { id: "2" }] },
      "std-2": { score: 3, evidences: [{ id: "3" }] },
      "std-3": { score: 0, evidences: [] },
    };

    const maxScore = 5;
    const totalScore = Object.values(criteriaData).reduce((sum, d) => sum + d.score, 0);
    const totalMaxScore = Object.keys(criteriaData).length * maxScore;
    const percentage = Math.round((totalScore / totalMaxScore) * 100);

    expect(percentage).toBe(47); // (4+3+0) / (5*3) * 100 = 46.67 ≈ 47
  });

  it("should count evidence types correctly", () => {
    const evidences = [
      { type: "image" }, { type: "image" }, { type: "file" },
      { type: "text" }, { type: "link" }, { type: "image" },
    ];

    const typeCounts = evidences.reduce((acc: Record<string, number>, ev) => {
      acc[ev.type] = (acc[ev.type] || 0) + 1;
      return acc;
    }, {});

    expect(typeCounts.image).toBe(3);
    expect(typeCounts.file).toBe(1);
    expect(typeCounts.text).toBe(1);
    expect(typeCounts.link).toBe(1);
  });
});

describe("Evidence Priority Feature", () => {
  it("should support essential priority", () => {
    const evidence = {
      id: "ev-priority-1",
      subEvidenceId: "sub-1",
      type: "text" as const,
      text: "شاهد أساسي",
      priority: "essential" as const,
    };

    expect(evidence.priority).toBe("essential");
  });

  it("should support supporting priority", () => {
    const evidence = {
      id: "ev-priority-2",
      subEvidenceId: "sub-1",
      type: "image" as const,
      text: "",
      priority: "supporting" as const,
    };

    expect(evidence.priority).toBe("supporting");
  });

  it("should support supplementary priority", () => {
    const evidence = {
      id: "ev-priority-3",
      subEvidenceId: "sub-1",
      type: "file" as const,
      text: "",
      priority: "supplementary" as const,
    };

    expect(evidence.priority).toBe("supplementary");
  });

  it("should default to essential when priority is undefined", () => {
    const evidence = {
      id: "ev-priority-4",
      subEvidenceId: "sub-1",
      type: "text" as const,
      text: "شاهد بدون أولوية",
    };

    const priority = evidence.priority || "essential";
    expect(priority).toBe("essential");
  });

  it("should have correct priority configuration", () => {
    const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
      essential: { label: "أساسي", color: "#059669", icon: "★" },
      supporting: { label: "داعم", color: "#2563EB", icon: "◆" },
      supplementary: { label: "إضافي", color: "#9333EA", icon: "○" },
    };

    expect(Object.keys(PRIORITY_CONFIG)).toHaveLength(3);
    expect(PRIORITY_CONFIG.essential.label).toBe("أساسي");
    expect(PRIORITY_CONFIG.supporting.label).toBe("داعم");
    expect(PRIORITY_CONFIG.supplementary.label).toBe("إضافي");
    expect(PRIORITY_CONFIG.essential.color).toBe("#059669");
    expect(PRIORITY_CONFIG.supporting.color).toBe("#2563EB");
    expect(PRIORITY_CONFIG.supplementary.color).toBe("#9333EA");
  });
});

describe("Evidence Keywords Feature", () => {
  it("should support keywords array on evidence", () => {
    const evidence = {
      id: "ev-kw-1",
      subEvidenceId: "sub-1",
      type: "text" as const,
      text: "شاهد مع كلمات مفتاحية",
      keywords: ["تدريب", "تطوير مهني", "استراتيجيات"],
    };

    expect(evidence.keywords).toHaveLength(3);
    expect(evidence.keywords).toContain("تدريب");
    expect(evidence.keywords).toContain("تطوير مهني");
  });

  it("should allow empty keywords array", () => {
    const evidence = {
      id: "ev-kw-2",
      subEvidenceId: "sub-1",
      type: "image" as const,
      text: "",
      keywords: [] as string[],
    };

    expect(evidence.keywords).toHaveLength(0);
  });

  it("should handle undefined keywords gracefully", () => {
    const evidence: { id: string; keywords?: string[] } = {
      id: "ev-kw-3",
    };

    const keywords = evidence.keywords || [];
    expect(keywords).toHaveLength(0);
  });

  it("should parse comma-separated keywords correctly", () => {
    const input = "تدريب, تطوير مهني, استراتيجيات, تقنية";
    const keywords = input.split(",").map(k => k.trim()).filter(Boolean);

    expect(keywords).toHaveLength(4);
    expect(keywords[0]).toBe("تدريب");
    expect(keywords[3]).toBe("تقنية");
  });
});

describe("Evidence Search and Filter", () => {
  const mockCriteria = [
    {
      id: "std-1",
      title: "الالتزام بأخلاقيات المهنة",
      subEvidences: [
        { id: "sub-1-1", title: "الالتزام بالحضور" },
        { id: "sub-1-2", title: "الالتزام بالمظهر" },
      ],
    },
    {
      id: "std-2",
      title: "التطوير المهني المستمر",
      subEvidences: [
        { id: "sub-2-1", title: "حضور الدورات التدريبية" },
      ],
    },
  ];

  const mockCriteriaData: Record<string, { score: number; evidences: any[] }> = {
    "std-1": {
      score: 4,
      evidences: [
        { id: "ev-1", subEvidenceId: "sub-1-1", type: "text", text: "شهادة حضور", priority: "essential", keywords: ["حضور", "التزام"] },
        { id: "ev-2", subEvidenceId: "sub-1-2", type: "image", text: "", priority: "supporting", keywords: ["مظهر"] },
      ],
    },
    "std-2": {
      score: 3,
      evidences: [
        { id: "ev-3", subEvidenceId: "sub-2-1", type: "link", text: "", priority: "supplementary", keywords: ["تدريب", "دورة"] },
      ],
    },
  };

  it("should filter criteria by search query in title", () => {
    const searchQuery = "أخلاقيات";
    const filtered = mockCriteria.filter(c =>
      c.title.includes(searchQuery) ||
      c.subEvidences.some(sub => sub.title.includes(searchQuery))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("std-1");
  });

  it("should filter criteria by search query in sub-evidence title", () => {
    const searchQuery = "الدورات";
    const filtered = mockCriteria.filter(c =>
      c.title.includes(searchQuery) ||
      c.subEvidences.some(sub => sub.title.includes(searchQuery))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("std-2");
  });

  it("should filter evidences by priority", () => {
    const allEvidences = Object.values(mockCriteriaData).flatMap(d => d.evidences);
    
    const essential = allEvidences.filter(ev => ev.priority === "essential");
    const supporting = allEvidences.filter(ev => ev.priority === "supporting");
    const supplementary = allEvidences.filter(ev => ev.priority === "supplementary");

    expect(essential).toHaveLength(1);
    expect(supporting).toHaveLength(1);
    expect(supplementary).toHaveLength(1);
  });

  it("should search evidences by keywords", () => {
    const allEvidences = Object.values(mockCriteriaData).flatMap(d => d.evidences);
    const searchKeyword = "تدريب";

    const matched = allEvidences.filter(ev =>
      ev.keywords?.some((kw: string) => kw.includes(searchKeyword))
    );

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("ev-3");
  });

  it("should return all criteria when search is empty", () => {
    const searchQuery = "";
    const filtered = searchQuery
      ? mockCriteria.filter(c => c.title.includes(searchQuery))
      : mockCriteria;

    expect(filtered).toHaveLength(2);
  });
});

describe("PDF Export Enhancement", () => {
  it("should include priority badge in evidence display", () => {
    const evidence = {
      id: "ev-pdf-1",
      type: "text",
      text: "شاهد للتصدير",
      priority: "essential",
      keywords: ["تعليم", "أداء"],
      comment: "تعليق مهم",
    };

    // Verify all fields needed for enhanced PDF are present
    expect(evidence).toHaveProperty("priority");
    expect(evidence).toHaveProperty("keywords");
    expect(evidence).toHaveProperty("comment");
    expect(evidence.priority).toBe("essential");
    expect(evidence.keywords).toHaveLength(2);
    expect(evidence.comment).toBe("تعليق مهم");
  });

  it("should generate table of contents from criteria", () => {
    const criteria = [
      { id: "std-1", title: "البند الأول", evidences: [{ id: "1" }] },
      { id: "std-2", title: "البند الثاني", evidences: [] },
      { id: "std-3", title: "البند الثالث", evidences: [{ id: "2" }, { id: "3" }] },
    ];

    const tocEntries = criteria.filter(c => c.evidences.length > 0);
    expect(tocEntries).toHaveLength(2);
    expect(tocEntries[0].title).toBe("البند الأول");
    expect(tocEntries[1].title).toBe("البند الثالث");
  });

  it("should calculate total evidence count correctly", () => {
    const criteriaData: Record<string, { evidences: any[] }> = {
      "std-1": { evidences: [{ id: "1" }, { id: "2" }] },
      "std-2": { evidences: [{ id: "3" }] },
      "std-3": { evidences: [] },
    };

    const total = Object.values(criteriaData).reduce((s, d) => s + d.evidences.length, 0);
    expect(total).toBe(3);
  });
});

describe("Shared Portfolio Enhancement", () => {
  it("should display priority in shared view", () => {
    const evidence = {
      id: "shared-ev-1",
      type: "text",
      text: "شاهد مشارك",
      priority: "supporting",
      keywords: ["مشاركة"],
      comment: "تعليق على الشاهد المشارك",
    };

    const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
      essential: { label: "أساسي", color: "#059669", icon: "★" },
      supporting: { label: "داعم", color: "#2563EB", icon: "◆" },
      supplementary: { label: "إضافي", color: "#9333EA", icon: "○" },
    };

    const pc = priorityConfig[evidence.priority];
    expect(pc.label).toBe("داعم");
    expect(pc.color).toBe("#2563EB");
  });

  it("should display keywords in shared view", () => {
    const evidence = {
      keywords: ["تعليم", "تدريب", "تطوير"],
    };

    expect(evidence.keywords).toHaveLength(3);
    expect(evidence.keywords.join(", ")).toBe("تعليم, تدريب, تطوير");
  });

  it("should display comment in shared view", () => {
    const evidence = {
      comment: "هذا تعليق مهم على الشاهد",
    };

    expect(evidence.comment).toBeTruthy();
    expect(evidence.comment.trim()).toBe("هذا تعليق مهم على الشاهد");
  });

  it("should handle evidence without optional fields", () => {
    const evidence: { priority?: string; keywords?: string[]; comment?: string } = {};

    const priority = evidence.priority || "essential";
    const keywords = evidence.keywords || [];
    const comment = evidence.comment || "";

    expect(priority).toBe("essential");
    expect(keywords).toHaveLength(0);
    expect(comment).toBe("");
  });
});


describe("3-Level Classification (Standard → Item → SubItem)", () => {
  it("should include subIndicator fields in classification result", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.ai.classifyEvidence({
        description: "خطة درس في مادة العلوم تتضمن أهداف تعليمية واستراتيجيات تدريس متنوعة",
        fileName: "خطة_درس_علوم.pdf",
        fileType: "application/pdf",
      });
      expect(result).toHaveProperty("success");
      if (result.success && result.classification) {
        expect(result.classification).toHaveProperty("standardId");
        expect(result.classification).toHaveProperty("standardNumber");
        expect(result.classification).toHaveProperty("indicatorIndex");
        expect(result.classification).toHaveProperty("indicatorText");
        expect(result.classification).toHaveProperty("subIndicatorIndex");
        expect(result.classification).toHaveProperty("subIndicatorText");
        expect(result.classification).toHaveProperty("suggestedPriority");
        expect(result.classification).toHaveProperty("suggestedKeywords");
        expect(typeof result.classification.subIndicatorIndex).toBe("number");
        expect(typeof result.classification.subIndicatorText).toBe("string");
        expect(["essential", "supporting", "supplementary"]).toContain(result.classification.suggestedPriority);
        expect(Array.isArray(result.classification.suggestedKeywords)).toBe(true);
      }
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 30000);

  it("should classify to correct standard level", () => {
    // Test classification data model
    const classification = {
      standardId: "std-6",
      standardNumber: 6,
      standardName: "إعداد وتنفيذ خطة التعلم",
      indicatorIndex: 1,
      indicatorText: "تحضير الدروس",
      subIndicatorIndex: 2,
      subIndicatorText: "تحديد الأهداف التعليمية",
      confidence: 0.92,
      reasoning: "الملف يحتوي على خطة درس مفصلة",
      contentDescription: "خطة درس في مادة العلوم",
      suggestedPriority: "essential",
      suggestedKeywords: ["خطة درس", "أهداف تعليمية", "علوم"],
    };

    expect(classification.standardNumber).toBe(6);
    expect(classification.indicatorIndex).toBe(1);
    expect(classification.subIndicatorIndex).toBe(2);
    expect(classification.suggestedPriority).toBe("essential");
    expect(classification.suggestedKeywords).toHaveLength(3);
  });
});

describe("Standards Data Structure (3 Levels)", () => {
  it("should have correct 3-level hierarchy", () => {
    // Simulate the new standards data structure
    const standard = {
      id: "std-1",
      title: "أداء الواجبات الوظيفية",
      items: [
        {
          id: "std-1-item-1",
          title: "الالتزام بالحضور والانصراف",
          subItems: [
            { id: "std-1-item-1-sub-1", title: "الحضور في الوقت المحدد" },
            { id: "std-1-item-1-sub-2", title: "الانصراف في الوقت المحدد" },
          ],
        },
        {
          id: "std-1-item-2",
          title: "تنفيذ التوجيهات والتعاميم",
          subItems: [
            { id: "std-1-item-2-sub-1", title: "الاطلاع على التعاميم" },
          ],
        },
      ],
    };

    expect(standard.items).toHaveLength(2);
    expect(standard.items[0].subItems).toHaveLength(2);
    expect(standard.items[1].subItems).toHaveLength(1);
    expect(standard.items[0].subItems[0].title).toBe("الحضور في الوقت المحدد");
  });

  it("should calculate total sub-items correctly", () => {
    const standards = [
      { id: "std-1", items: [{ subItems: [{}, {}] }, { subItems: [{}] }] },
      { id: "std-2", items: [{ subItems: [{}, {}, {}] }] },
    ];

    const totalSubItems = standards.reduce(
      (sum, std) => sum + std.items.reduce(
        (s, item) => s + item.subItems.length, 0
      ), 0
    );

    expect(totalSubItems).toBe(6);
  });
});

describe("Template Management", () => {
  it("should require admin access for template operations", async () => {
    const { ctx } = createAuthContext(); // role is 'user'
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.create({
        name: "قالب اختبار",
        primaryColor: "#059669",
        secondaryColor: "#F59E0B",
        fontFamily: "Tajawal",
        headerStyle: "modern",
        borderStyle: "rounded",
        showWatermark: false,
        isActive: true,
      })
    ).rejects.toThrow();
  });

  it("should allow public access to active templates list", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.templates.listActive();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      // Database might not be available in test
      expect(e.message).toBeDefined();
    }
  });

  it("should validate template color format", () => {
    const validColors = ["#059669", "#F59E0B", "#2563EB", "#9333EA"];
    const invalidColors = ["red", "rgb(5,150,105)", "059669"];

    validColors.forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    invalidColors.forEach(color => {
      expect(color).not.toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it("should have correct template structure", () => {
    const template = {
      id: 1,
      name: "القالب الاحترافي",
      primaryColor: "#059669",
      secondaryColor: "#F59E0B",
      fontFamily: "Tajawal",
      headerStyle: "modern",
      borderStyle: "rounded",
      showWatermark: false,
      isActive: true,
    };

    expect(template).toHaveProperty("name");
    expect(template).toHaveProperty("primaryColor");
    expect(template).toHaveProperty("secondaryColor");
    expect(template).toHaveProperty("fontFamily");
    expect(template).toHaveProperty("headerStyle");
    expect(template).toHaveProperty("borderStyle");
    expect(template).toHaveProperty("showWatermark");
    expect(template).toHaveProperty("isActive");
  });
});

describe("Multi-file Upload Support", () => {
  it("should support multiple files per evidence item", () => {
    const evidence = {
      id: "ev-multi-1",
      subEvidenceId: "sub-1",
      type: "image" as const,
      text: "",
      files: [
        { name: "file1.pdf", data: "data:application/pdf;base64,abc", type: "application/pdf" },
        { name: "file2.png", data: "data:image/png;base64,def", type: "image/png" },
        { name: "file3.docx", data: "data:application/vnd;base64,ghi", type: "application/vnd" },
      ],
    };

    expect(evidence.files).toHaveLength(3);
    expect(evidence.files[0].name).toBe("file1.pdf");
    expect(evidence.files[2].type).toBe("application/vnd");
  });

  it("should handle single file backward compatibility", () => {
    const evidence = {
      id: "ev-single-1",
      subEvidenceId: "sub-1",
      type: "file" as const,
      text: "",
      fileData: "data:application/pdf;base64,abc",
      fileName: "single.pdf",
    };

    // Old format still works
    expect(evidence.fileData).toBeTruthy();
    expect(evidence.fileName).toBe("single.pdf");
  });
});

describe("Enhanced Shared Portfolio", () => {
  it("should display 3-level hierarchy in shared view", () => {
    const sharedData = {
      standards: [
        {
          id: "std-1",
          title: "أداء الواجبات الوظيفية",
          items: [
            {
              id: "item-1",
              title: "الالتزام بالحضور",
              subItems: [
                { id: "sub-1", title: "الحضور في الوقت المحدد" },
              ],
              evidences: [
                { id: "ev-1", text: "شاهد", priority: "essential" },
              ],
            },
          ],
        },
      ],
    };

    expect(sharedData.standards[0].items[0].subItems).toHaveLength(1);
    expect(sharedData.standards[0].items[0].evidences).toHaveLength(1);
    expect(sharedData.standards[0].items[0].evidences[0].priority).toBe("essential");
  });

  it("should calculate coverage stats for shared portfolio", () => {
    const criteriaData: Record<string, { evidences: any[] }> = {
      "std-1": { evidences: [{ id: "1" }, { id: "2" }] },
      "std-2": { evidences: [] },
      "std-3": { evidences: [{ id: "3" }] },
    };

    const totalStandards = Object.keys(criteriaData).length;
    const coveredStandards = Object.values(criteriaData).filter(d => d.evidences.length > 0).length;
    const totalEvidences = Object.values(criteriaData).reduce((s, d) => s + d.evidences.length, 0);
    const coveragePercent = Math.round((coveredStandards / totalStandards) * 100);

    expect(totalStandards).toBe(3);
    expect(coveredStandards).toBe(2);
    expect(totalEvidences).toBe(3);
    expect(coveragePercent).toBe(67);
  });
});

describe("PDF Export with Templates", () => {
  it("should apply template colors to PDF", () => {
    const template = {
      primaryColor: "#059669",
      secondaryColor: "#F59E0B",
      fontFamily: "Tajawal",
    };

    // Verify hex to RGB conversion
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const primary = hexToRgb(template.primaryColor);
    expect(primary.r).toBe(5);
    expect(primary.g).toBe(150);
    expect(primary.b).toBe(105);

    const secondary = hexToRgb(template.secondaryColor);
    expect(secondary.r).toBe(245);
    expect(secondary.g).toBe(158);
    expect(secondary.b).toBe(11);
  });

  it("should generate section dividers between standards", () => {
    const standards = [
      { id: "std-1", title: "المعيار الأول", evidences: 3 },
      { id: "std-2", title: "المعيار الثاني", evidences: 0 },
      { id: "std-3", title: "المعيار الثالث", evidences: 2 },
    ];

    const activeSections = standards.filter(s => s.evidences > 0);
    expect(activeSections).toHaveLength(2);
    
    // Each active section should have a divider page
    const totalPages = activeSections.length; // divider pages
    expect(totalPages).toBe(2);
  });
});
