import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock invokeLLM to avoid real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
const mockedInvokeLLM = vi.mocked(invokeLLM);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("ai.suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns AI-generated content for a given prompt", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-1",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "هذا اقتراح شاهد أداء وظيفي مناسب للمعلم",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.suggest({
      prompt: "اقترح شاهد أداء وظيفي",
      context: "الوظيفة: معلم",
    });

    expect(result.content).toBe("هذا اقتراح شاهد أداء وظيفي مناسب للمعلم");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
    expect(mockedInvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
        ]),
      })
    );
  });

  it("handles empty response gracefully", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-2",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "" },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.suggest({
      prompt: "اقترح شاهد",
    });

    expect(result.content).toBe("");
  });
});

describe("ai.improveText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns improved text", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-3",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "نص محسّن واحترافي لشاهد الأداء الوظيفي",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.improveText({
      text: "نص بسيط",
      context: "شاهد أداء وظيفي",
    });

    expect(result.improved).toBe("نص محسّن واحترافي لشاهد الأداء الوظيفي");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("returns original text if LLM returns non-string", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-4",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: null as any },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.improveText({
      text: "نص أصلي",
    });

    expect(result.improved).toBe("نص أصلي");
  });
});

describe("ai.suggestEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed suggestions from bullet-pointed response", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-5",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "• تقديم تقرير مفصل عن الإذاعة المدرسية\n• توثيق حضور الطلاب المشاركين\n• إرفاق صور من التنفيذ\n• تقييم أداء الطلاب",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.suggestEvidence({
      jobTitle: "معلم",
      criterionName: "أداء الواجبات الوظيفية",
      subEvidenceName: "تقرير تنفيذ إذاعة مدرسية",
    });

    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(result.rawContent).toContain("تقرير");
  });

  it("handles response with existing content", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-6",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "• إضافة تفاصيل عن الفقرات\n• ذكر أسماء الطلاب المشاركين",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.suggestEvidence({
      jobTitle: "معلم",
      criterionName: "أداء الواجبات",
      subEvidenceName: "إذاعة مدرسية",
      existingContent: "تم تنفيذ الإذاعة",
    });

    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(mockedInvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("تم تنفيذ الإذاعة"),
          }),
        ]),
      })
    );
  });
});

describe("ai.fillFormFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns filled form data as JSON", async () => {
    const filledData = {
      topic: "اليوم الوطني السعودي",
      date: "1447/02/15",
      students_count: "8",
    };

    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-7",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify(filledData),
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.fillFormFields({
      jobTitle: "معلم",
      criterionName: "أداء الواجبات الوظيفية",
      subEvidenceName: "تقرير تنفيذ إذاعة مدرسية",
      formFields: [
        { id: "topic", label: "موضوع الإذاعة", type: "text" },
        { id: "date", label: "تاريخ التنفيذ", type: "date" },
        { id: "students_count", label: "عدد الطلاب", type: "number" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.filledData).toEqual(filledData);
  });

  it("returns success=false for invalid JSON response", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-8",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "هذا ليس JSON صالح",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.fillFormFields({
      jobTitle: "معلم",
      criterionName: "أداء الواجبات",
      subEvidenceName: "إذاعة مدرسية",
      formFields: [{ id: "topic", label: "الموضوع", type: "text" }],
    });

    expect(result.success).toBe(false);
    expect(result.filledData).toEqual({});
  });

  it("passes response_format with json_schema to LLM", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-9",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({ topic: "test" }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.ai.fillFormFields({
      jobTitle: "معلم",
      criterionName: "بند",
      subEvidenceName: "شاهد",
      formFields: [{ id: "topic", label: "الموضوع", type: "text" }],
    });

    expect(mockedInvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.objectContaining({
          type: "json_schema",
          json_schema: expect.objectContaining({
            name: "form_fill",
            strict: true,
          }),
        }),
      })
    );
  });
});

describe("ai.classifyEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies evidence to the correct standard and indicator", async () => {
    const classification = {
      standardId: "std-1",
      standardNumber: 1,
      standardName: "أداء الواجبات الوظيفية",
      indicatorIndex: 1,
      indicatorText: "يطبق الأنظمة وقواعد السلوك الوظيفية",
      confidence: 0.92,
      reasoning: "الشاهد يتعلق بالالتزام بالدوام والأنظمة",
    };

    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-classify-1",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify(classification),
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.classifyEvidence({
      description: "صورة من سجل الحضور والانصراف",
      fileName: "attendance_record.jpg",
      fileType: "image",
    });

    expect(result.success).toBe(true);
    expect(result.classification).toBeDefined();
    expect(result.classification.standardId).toBe("std-1");
    expect(result.classification.confidence).toBeGreaterThan(0.5);
    expect(mockedInvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.objectContaining({
          type: "json_schema",
          json_schema: expect.objectContaining({
            name: "evidence_classification",
            strict: true,
          }),
        }),
      })
    );
  });

  it("handles invalid JSON response gracefully", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-classify-2",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "لا أستطيع تصنيف هذا الشاهد",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.classifyEvidence({
      description: "ملف غير واضح",
    });

    expect(result.success).toBe(false);
    expect(result.classification).toBeNull();
  });

  it("works with minimal input (only fileName)", async () => {
    const classification = {
      standardId: "std-7",
      standardNumber: 7,
      standardName: "توظيف تقنيات ووسائل التعلم المناسبة",
      indicatorIndex: 2,
      indicatorText: "يوظف التقنية في التعليم",
      confidence: 0.78,
      reasoning: "اسم الملف يشير لاستخدام التقنية",
    };

    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-classify-3",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify(classification),
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.classifyEvidence({
      fileName: "screenshot_madrasati_platform.png",
    });

    expect(result.success).toBe(true);
    expect(result.classification.standardId).toBe("std-7");
  });
});

describe("ai.analyzeGaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recommendations for gap analysis", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-gaps-1",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "1. ركّز على معيار التنويع في استراتيجيات التدريس\n2. أضف شواهد لمعيار تهيئة البيئة التعليمية\n3. وثّق أنشطة التقويم المتنوعة",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyzeGaps({
      coveredIndicators: [
        "أداء الواجبات الوظيفية: يطبق الأنظمة",
        "التفاعل مع المجتمع المهني: يشارك في المجتمعات المهنية",
      ],
      totalIndicators: 45,
    });

    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations).toContain("التدريس");
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(1);
  });

  it("handles empty covered indicators", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-gaps-2",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "ملفك فارغ تماماً. ابدأ بتوثيق الشواهد الأساسية.",
          },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyzeGaps({
      coveredIndicators: [],
      totalIndicators: 45,
    });

    expect(result.recommendations).toContain("ابدأ");
  });

  it("handles non-string LLM response", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test-gaps-3",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: null as any },
          finish_reason: "stop",
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyzeGaps({
      coveredIndicators: ["test"],
      totalIndicators: 45,
    });

    expect(result.recommendations).toBe("");
  });
});
