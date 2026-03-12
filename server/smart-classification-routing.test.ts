import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
const mockedInvokeLLM = vi.mocked(invokeLLM);

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

describe("Smart Classification Routing - Improved Algorithm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Server-side: classifyEvidence with subIndicatorIndex=0", () => {
    it("should return subIndicatorIndex=0 when sub-indicator is undetermined", async () => {
      const classification = {
        standardId: "std-2",
        standardNumber: 2,
        standardName: "التفاعل مع المجتمع المهني",
        indicatorIndex: 5,
        indicatorText: "الإنتاج المعرفي (أوراق عمل، عروض تقديمية، ملازم)",
        subIndicatorIndex: 0,
        subIndicatorText: "غير محدد",
        confidence: 0.85,
        reasoning: "الملف يتعلق بالإنتاج المعرفي",
        contentDescription: "ملف إنتاج معرفي",
        suggestedPriority: "essential",
        suggestedKeywords: ["إنتاج", "معرفي"],
      };

      mockedInvokeLLM.mockResolvedValueOnce({
        id: "test-sub0-1",
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
        description: "إنتاج معرفي",
        fileName: "انتاج_معرفي.pdf",
        fileType: "application/pdf",
      });

      expect(result.success).toBe(true);
      expect(result.classification).toBeDefined();
      expect(result.classification.standardId).toBe("std-2");
      expect(result.classification.indicatorIndex).toBe(5);
      expect(result.classification.subIndicatorIndex).toBe(0);
    });

    it("should correctly classify a video file by fileName", async () => {
      const classification = {
        standardId: "std-4",
        standardNumber: 4,
        standardName: "التنويع في استراتيجيات التدريس",
        indicatorIndex: 1,
        indicatorText: "استخدام استراتيجيات متنوعة",
        subIndicatorIndex: 0,
        subIndicatorText: "غير محدد",
        confidence: 0.80,
        reasoning: "الفيديو يظهر درس تطبيقي باستراتيجيات متنوعة",
        contentDescription: "مقطع فيديو لدرس تطبيقي",
        suggestedPriority: "essential",
        suggestedKeywords: ["درس", "تطبيقي", "استراتيجية"],
      };

      mockedInvokeLLM.mockResolvedValueOnce({
        id: "test-video-1",
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
        description: "درس تطبيقي",
        fileName: "درس_تطبيقي_رياضيات.mp4",
        fileType: "video/mp4",
      });

      expect(result.success).toBe(true);
      expect(result.classification.standardId).toBe("std-4");
    });

    it("should handle video without extracted frame (no fileUrl)", async () => {
      const classification = {
        standardId: "std-1",
        standardNumber: 1,
        standardName: "أداء الواجبات الوظيفية",
        indicatorIndex: 7,
        indicatorText: "تفعيل الإذاعة الصباحية والطابور الصباحي",
        subIndicatorIndex: 0,
        subIndicatorText: "",
        confidence: 0.75,
        reasoning: "اسم الملف يشير لإذاعة صباحية",
        contentDescription: "مقطع فيديو لإذاعة صباحية",
        suggestedPriority: "supporting",
        suggestedKeywords: ["إذاعة", "صباحية"],
      };

      mockedInvokeLLM.mockResolvedValueOnce({
        id: "test-video-noframe",
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

      // No fileUrl = video without extracted frame
      const result = await caller.ai.classifyEvidence({
        description: "إذاعة صباحية",
        fileName: "اذاعة_صباحية.mp4",
        fileType: "video/mp4",
      });

      expect(result.success).toBe(true);
      expect(result.classification.standardId).toBe("std-1");
      expect(result.classification.indicatorIndex).toBe(7);

      // Verify the video-specific prompt was used
      expect(mockedInvokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("مقطع فيديو"),
            }),
          ]),
        })
      );
    });
  });

  describe("Client-side: Smart Routing Algorithm Logic", () => {
    // Helper to simulate the normalize function from PerformanceEvidence
    const normalize = (t: string) =>
      t
        .replace(/[\u0640\u064B-\u065F]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/[ىئ]/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    // Simulate sub-evidence structure
    const mockSubs = [
      { id: "std-2-item-1", title: "المشاركة الفاعلة في مجتمعات التعلم المهنية", isSubItem: false, description: "" },
      { id: "std-2-1-1", title: "حضور اجتماعات مجتمعات التعلم", isSubItem: true, description: "" },
      { id: "std-2-1-2", title: "المشاركة بأوراق عمل وعروض", isSubItem: true, description: "" },
      { id: "std-2-item-2", title: "تبادل الزيارات الصفية مع الزملاء", isSubItem: false, description: "" },
      { id: "std-2-2-1", title: "زيارات صفية للزملاء", isSubItem: true, description: "" },
      { id: "std-2-2-2", title: "استقبال زيارات الزملاء", isSubItem: true, description: "" },
      { id: "std-2-item-3", title: "تنفيذ الدروس التطبيقية وبحث الدرس", isSubItem: false, description: "" },
      { id: "std-2-item-4", title: "حضور الدورات والورش التدريبية", isSubItem: false, description: "" },
      { id: "std-2-item-5", title: "الإنتاج المعرفي", isSubItem: false, description: "" },
      { id: "std-2-5-1", title: "إعداد أوراق عمل وعروض", isSubItem: true, description: "" },
      { id: "std-2-item-6", title: "الحصول على شهادات مهنية معتمدة", isSubItem: false, description: "" },
      { id: "std-2-item-7", title: "إطلاق مبادرات تعليمية لتحسين جودة التعليم", isSubItem: false, description: "" },
    ];

    function runRoutingAlgorithm(cls: {
      subIndicatorText?: string;
      subIndicatorIndex: number;
      indicatorText: string;
      indicatorIndex: number;
      contentDescription?: string;
    }, fileName: string = "test.pdf") {
      const subs = mockSubs;
      let targetSub = subs[0];
      let matched = false;

      const isSubUndetermined =
        !cls.subIndicatorText ||
        cls.subIndicatorText.length <= 3 ||
        normalize(cls.subIndicatorText).includes("غير محدد") ||
        normalize(cls.subIndicatorText).includes("غير معروف") ||
        normalize(cls.subIndicatorText).includes("عام") ||
        cls.subIndicatorIndex === 0;

      // Level 1: Exact sub-indicator text match
      if (!isSubUndetermined && cls.subIndicatorText && cls.subIndicatorText.length > 3) {
        const normalizedSub = normalize(cls.subIndicatorText);
        let exactMatch = subs.find((s) => normalize(s.title) === normalizedSub);
        if (exactMatch) { targetSub = exactMatch; matched = true; }
        if (!matched) {
          const containMatch = subs.find(
            (s) => normalize(s.title).includes(normalizedSub) || normalizedSub.includes(normalize(s.title))
          );
          if (containMatch) { targetSub = containMatch; matched = true; }
        }
      }

      // Level 2: Indicator text match
      if (!matched && cls.indicatorText && cls.indicatorText.length > 3) {
        const normalizedInd = normalize(cls.indicatorText);
        if (!normalizedInd.includes("غير محدد") && !normalizedInd.includes("غير معروف")) {
          const exactMatch = subs.find((s) => normalize(s.title) === normalizedInd);
          if (exactMatch) { targetSub = exactMatch; matched = true; }
          if (!matched) {
            const containMatch = subs.find(
              (s) => normalize(s.title).includes(normalizedInd) || normalizedInd.includes(normalize(s.title))
            );
            if (containMatch) { targetSub = containMatch; matched = true; }
          }
        }
      }

      // Level 3: Structural index match
      if (!matched && cls.indicatorIndex > 0) {
        const stdPrefix = "std-2";
        if (cls.subIndicatorIndex > 0) {
          const subItemId = `${stdPrefix}-${cls.indicatorIndex}-${cls.subIndicatorIndex}`;
          const subMatch = subs.find((s) => s.id === subItemId);
          if (subMatch) { targetSub = subMatch; matched = true; }
        }
        if (!matched) {
          const targetItemId = `${stdPrefix}-item-${cls.indicatorIndex}`;
          const itemMatch = subs.find((s) => s.id === targetItemId);
          if (itemMatch) { targetSub = itemMatch; matched = true; }
        }
        if (!matched) {
          const mainItems = subs.filter((s) => !s.isSubItem);
          const idx = Math.min(cls.indicatorIndex - 1, mainItems.length - 1);
          if (idx >= 0 && idx < mainItems.length) {
            targetSub = mainItems[idx];
            matched = true;
          }
        }
      }

      // Level 4: Keyword fuzzy scoring
      if (!matched && (cls.indicatorText || cls.subIndicatorText || cls.contentDescription)) {
        const textsToSearch = [cls.subIndicatorText, cls.indicatorText, cls.contentDescription, fileName].filter(Boolean);
        const searchTexts = textsToSearch.map((t) => normalize(t!)).filter((t) => !t.includes("غير محدد") && !t.includes("غير معروف"));
        const allWords = searchTexts.flatMap((t) => t.split(/\s+/).filter((w: string) => w.length > 2));
        const stopWords = new Set(["من", "في", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي", "بين", "عند", "حول", "غير", "محدد"]);
        const keywords = allWords.filter((w) => !stopWords.has(w));

        if (keywords.length > 0) {
          let bestMatch = subs[0];
          let bestScore = 0;
          for (const sub of subs) {
            const subNorm = normalize(sub.title);
            const descNorm = sub.description ? normalize(sub.description) : "";
            let score = 0;
            for (const kw of keywords) {
              if (subNorm.includes(kw)) score += 3;
              if (descNorm.includes(kw)) score += 1;
            }
            if (sub.isSubItem && score > 0) score += 1;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = sub;
            }
          }
          if (bestScore >= 2) {
            targetSub = bestMatch;
            matched = true;
          }
        }
      }

      // Level 5: Fallback to main item by index
      if (!matched && cls.indicatorIndex > 0) {
        const mainItems = subs.filter((s) => !s.isSubItem);
        const idx = Math.min(cls.indicatorIndex - 1, mainItems.length - 1);
        if (idx >= 0) {
          targetSub = mainItems[idx];
          matched = true;
        }
      }

      // Level 6: Final fallback - first main item
      if (!matched) {
        const mainItems = subs.filter((s) => !s.isSubItem);
        if (mainItems.length > 0) {
          targetSub = mainItems[0];
        } else if (subs.length > 0) {
          targetSub = subs[0];
        }
      }

      return { targetSub, matched };
    }

    it("should route to main item when subIndicatorIndex=0 (undetermined sub)", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "غير محدد",
        subIndicatorIndex: 0,
        indicatorText: "الإنتاج المعرفي (أوراق عمل، عروض تقديمية، ملازم)",
        indicatorIndex: 5,
        contentDescription: "ملف إنتاج معرفي",
      }, "انتاج_معرفي.pdf");

      // Should match "الإنتاج المعرفي" main item (std-2-item-5)
      expect(result.targetSub.id).toBe("std-2-item-5");
      expect(result.matched).toBe(true);
    });

    it("should route to specific sub-item when subIndicatorIndex > 0", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "إعداد أوراق عمل وعروض",
        subIndicatorIndex: 1,
        indicatorText: "الإنتاج المعرفي",
        indicatorIndex: 5,
        contentDescription: "ورقة عمل",
      });

      // Should match the sub-item "إعداد أوراق عمل وعروض" (std-2-5-1)
      expect(result.targetSub.id).toBe("std-2-5-1");
      expect(result.matched).toBe(true);
    });

    it("should route to main item via index when text doesn't match", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "",
        subIndicatorIndex: 0,
        indicatorText: "بند غير موجود في القائمة",
        indicatorIndex: 4,
        contentDescription: "دورة تدريبية",
      });

      // Should fall to Level 3 (structural index) → std-2-item-4 (حضور الدورات)
      expect(result.targetSub.id).toBe("std-2-item-4");
      expect(result.matched).toBe(true);
    });

    it("should route via keyword matching when index and text fail", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "",
        subIndicatorIndex: 0,
        indicatorText: "",
        indicatorIndex: 0,
        contentDescription: "شهادة حضور دورة تدريبية في التطوير المهني",
      });

      // Should match via keywords to "حضور الدورات والورش التدريبية" (std-2-item-4)
      expect(result.targetSub.id).toBe("std-2-item-4");
      expect(result.matched).toBe(true);
    });

    it("should route to first main item as final fallback", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "",
        subIndicatorIndex: 0,
        indicatorText: "",
        indicatorIndex: 0,
        contentDescription: "",
      });

      // Should fallback to first main item
      expect(result.targetSub.id).toBe("std-2-item-1");
    });

    it("should NOT route to first sub-item when sub is undetermined", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "غير محدد",
        subIndicatorIndex: 0,
        indicatorText: "الإنتاج المعرفي",
        indicatorIndex: 5,
      });

      // Should NOT be std-2-1-1 (first sub-item of first indicator)
      // Should be std-2-item-5 (the main item for indicator 5)
      expect(result.targetSub.id).not.toBe("std-2-1-1");
      expect(result.targetSub.id).toBe("std-2-item-5");
    });

    it("should route correctly for زيارات صفية", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "زيارات صفية للزملاء",
        subIndicatorIndex: 1,
        indicatorText: "تبادل الزيارات الصفية مع الزملاء",
        indicatorIndex: 2,
      });

      expect(result.targetSub.id).toBe("std-2-2-1");
      expect(result.matched).toBe(true);
    });

    it("should route to main item for مبادرات تعليمية", () => {
      const result = runRoutingAlgorithm({
        subIndicatorText: "غير محدد",
        subIndicatorIndex: 0,
        indicatorText: "إطلاق مبادرات تعليمية لتحسين جودة التعليم",
        indicatorIndex: 7,
        contentDescription: "مبادرة تعليمية",
      });

      expect(result.targetSub.id).toBe("std-2-item-7");
      expect(result.matched).toBe(true);
    });
  });

  describe("Server-side: Video-specific prompt handling", () => {
    it("should use video-specific prompt for video files without fileUrl", async () => {
      const classification = {
        standardId: "std-2",
        standardNumber: 2,
        standardName: "التفاعل مع المجتمع المهني",
        indicatorIndex: 5,
        indicatorText: "الإنتاج المعرفي",
        subIndicatorIndex: 1,
        subIndicatorText: "إعداد أوراق عمل وعروض",
        confidence: 0.82,
        reasoning: "فيديو يوثق إنتاج معرفي",
        contentDescription: "مقطع فيديو لإنتاج معرفي",
        suggestedPriority: "essential",
        suggestedKeywords: ["إنتاج", "معرفي", "فيديو"],
      };

      mockedInvokeLLM.mockResolvedValueOnce({
        id: "test-video-prompt",
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

      await caller.ai.classifyEvidence({
        description: "إنتاج معرفي",
        fileName: "انتاج_معرفي.mp4",
        fileType: "video/mp4",
        // No fileUrl - simulates video without extracted frame
      });

      // Verify the video-specific prompt was used (not the generic file prompt)
      const callArgs = mockedInvokeLLM.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === "user");
      expect(userMessage).toBeDefined();
      expect(typeof userMessage.content).toBe("string");
      expect(userMessage.content).toContain("مقطع فيديو");
      expect(userMessage.content).toContain("انتاج_معرفي.mp4");
    });

    it("should use image analysis path for video with extracted frame", async () => {
      const classification = {
        standardId: "std-3",
        standardNumber: 3,
        standardName: "التفاعل مع أولياء الأمور",
        indicatorIndex: 1,
        indicatorText: "التواصل الفعال مع أولياء الأمور",
        subIndicatorIndex: 0,
        subIndicatorText: "",
        confidence: 0.78,
        reasoning: "الفيديو يوثق اجتماع مع أولياء الأمور",
        contentDescription: "مقطع فيديو لاجتماع أولياء أمور",
        suggestedPriority: "essential",
        suggestedKeywords: ["أولياء", "أمور", "اجتماع"],
      };

      mockedInvokeLLM.mockResolvedValueOnce({
        id: "test-video-frame",
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

      await caller.ai.classifyEvidence({
        description: "اجتماع أولياء أمور",
        fileName: "اجتماع_اولياء.mp4",
        fileType: "video/mp4",
        fileUrl: "data:image/jpeg;base64,/9j/4AAQ...", // extracted frame
      });

      // Verify image analysis path was used (multimodal with image_url)
      const callArgs = mockedInvokeLLM.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === "user");
      expect(userMessage).toBeDefined();
      expect(Array.isArray(userMessage.content)).toBe(true);
      expect(userMessage.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "image_url" }),
          expect.objectContaining({ type: "text" }),
        ])
      );
    });
  });

  describe("Server-side: Enhanced prompt includes all 11 standards with details", () => {
    it("should include detailed standard descriptions in system prompt", async () => {
      const classification = {
        standardId: "std-1",
        standardNumber: 1,
        standardName: "أداء الواجبات الوظيفية",
        indicatorIndex: 1,
        indicatorText: "التقيد بالدوام الرسمي",
        subIndicatorIndex: 0,
        subIndicatorText: "",
        confidence: 0.9,
        reasoning: "test",
        contentDescription: "test",
        suggestedPriority: "essential",
        suggestedKeywords: ["test"],
      };

      mockedInvokeLLM.mockResolvedValueOnce({
        id: "test-prompt-check",
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

      await caller.ai.classifyEvidence({
        description: "test",
        fileName: "test.pdf",
      });

      const callArgs = mockedInvokeLLM.mock.calls[0][0];
      const systemMessage = callArgs.messages.find((m: any) => m.role === "system");
      expect(systemMessage).toBeDefined();

      // Verify the system prompt includes detailed standard info
      expect(systemMessage.content).toContain("std-1");
      expect(systemMessage.content).toContain("std-2");
      expect(systemMessage.content).toContain("std-11");
      expect(systemMessage.content).toContain("indicatorIndex");
      expect(systemMessage.content).toContain("subIndicatorIndex");
      expect(systemMessage.content).toContain("الإنتاج المعرفي");
      expect(systemMessage.content).toContain("subIndicatorIndex = 0");
    });
  });
});
