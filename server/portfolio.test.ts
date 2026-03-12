import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  createPortfolio: vi.fn().mockResolvedValue({ id: 1 }),
  updatePortfolio: vi.fn().mockResolvedValue({ id: 1 }),
  getPortfoliosByUser: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, jobId: "teacher", jobTitle: "معلم", status: "draft", completionPercentage: 50 },
  ]),
  getPortfolioById: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) return { id: 1, userId: 1, jobId: "teacher", jobTitle: "معلم", status: "draft", personalInfo: { name: "أحمد" }, criteriaData: {} };
    if (id === 2) return { id: 2, userId: 2, jobId: "teacher", jobTitle: "معلم", status: "submitted", personalInfo: { name: "محمد" }, criteriaData: {} };
    return null;
  }),
  deletePortfolio: vi.fn().mockResolvedValue({ success: true }),
  getAllPortfolios: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, jobTitle: "معلم", status: "submitted" },
    { id: 2, userId: 2, jobTitle: "مرشد", status: "draft" },
  ]),
  reviewPortfolio: vi.fn().mockResolvedValue({ success: true }),
  createUploadedFile: vi.fn().mockResolvedValue({ id: 1 }),
  getFilesByPortfolio: vi.fn().mockResolvedValue([]),
  deleteUploadedFile: vi.fn().mockResolvedValue({ success: true }),
  createShareLink: vi.fn().mockResolvedValue({ id: 1 }),
  getShareLinkByToken: vi.fn().mockImplementation(async (token: string) => {
    if (token === "valid-token") return {
      id: 1, portfolioId: 1, userId: 1, token: "valid-token",
      expiresAt: new Date(Date.now() + 86400000), hasPassword: false,
      passwordHash: null, viewCount: 0, maxViews: 100, isActive: true,
    };
    if (token === "expired-token") return {
      id: 2, portfolioId: 1, userId: 1, token: "expired-token",
      expiresAt: new Date(Date.now() - 86400000), hasPassword: false,
      passwordHash: null, viewCount: 0, maxViews: 100, isActive: true,
    };
    if (token === "password-token") return {
      id: 3, portfolioId: 1, userId: 1, token: "password-token",
      expiresAt: new Date(Date.now() + 86400000), hasPassword: true,
      passwordHash: "secret123", viewCount: 0, maxViews: 100, isActive: true,
    };
    return null;
  }),
  incrementShareLinkViews: vi.fn().mockResolvedValue(undefined),
  getShareLinksByPortfolio: vi.fn().mockResolvedValue([]),
  deactivateShareLink: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://example.com/file.png", key: "test-key" }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      standardId: "std-1", standardNumber: 1, standardName: "أداء الواجبات الوظيفية",
      indicatorIndex: 1, indicatorText: "الالتزام بالحضور", confidence: 0.85,
      reasoning: "الصورة تظهر سجل حضور", contentDescription: "سجل حضور المعلم",
    }) } }],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user", userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Portfolio CRUD Tests ───────────────────────────────
describe("portfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("portfolio.list", () => {
    it("returns portfolios for authenticated user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.list();
      expect(result).toHaveLength(1);
      expect(result[0].jobId).toBe("teacher");
    });

    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.portfolio.list()).rejects.toThrow();
    });
  });

  describe("portfolio.create", () => {
    it("creates a new portfolio", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.create({
        jobId: "teacher",
        jobTitle: "معلم",
        personalInfo: { name: "أحمد", school: "مدرسة النور" },
        criteriaData: { "std-1": { score: 3, notes: "", evidences: [] } },
        themeId: "classic",
        completionPercentage: 25,
      });
      expect(result).toHaveProperty("id");
    });
  });

  describe("portfolio.get", () => {
    it("returns portfolio for owner", async () => {
      const ctx = createUserContext("user", 1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.get({ id: 1 });
      expect(result).not.toBeNull();
      expect(result?.jobId).toBe("teacher");
    });

    it("returns null for non-owner", async () => {
      const ctx = createUserContext("user", 1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.get({ id: 2 });
      expect(result).toBeNull();
    });
  });

  describe("portfolio.update", () => {
    it("updates portfolio data", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.update({
        id: 1,
        completionPercentage: 75,
        themeId: "modern",
      });
      expect(result).toHaveProperty("id");
    });
  });

  describe("portfolio.delete", () => {
    it("deletes portfolio", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  describe("portfolio.submit", () => {
    it("submits portfolio for review", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portfolio.submit({ id: 1 });
      expect(result).toHaveProperty("id");
    });
  });
});

// ─── Share Link Tests ───────────────────────────────────
describe("share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("share.create", () => {
    it("creates a share link with default settings", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.share.create({
        portfolioId: 1,
        expiresInDays: 7,
        maxViews: 100,
      });
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresAt");
      expect(typeof result.token).toBe("string");
    });
  });

  describe("share.view", () => {
    it("returns portfolio for valid token", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.share.view({ token: "valid-token" });
      expect(result.error).toBeNull();
      expect(result.portfolio).not.toBeNull();
    });

    it("rejects expired token", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.share.view({ token: "expired-token" });
      expect(result.error).toBe("انتهت صلاحية الرابط");
      expect(result.portfolio).toBeNull();
    });

    it("rejects invalid token", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.share.view({ token: "nonexistent" });
      expect(result.error).toBe("رابط غير صالح");
    });

    it("requires password for protected links", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.share.view({ token: "password-token" });
      expect(result.error).toBe("كلمة المرور غير صحيحة");
    });

    it("allows access with correct password", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.share.view({ token: "password-token", password: "secret123" });
      expect(result.error).toBeNull();
      expect(result.portfolio).not.toBeNull();
    });
  });
});

// ─── Admin Tests ────────────────────────────────────────
describe("admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("admin.portfolios", () => {
    it("returns all portfolios for admin", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.portfolios({ page: 1, limit: 20 });
      expect(result).toHaveLength(2);
    });

    it("rejects non-admin users", async () => {
      const ctx = createUserContext("user");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.admin.portfolios({ page: 1, limit: 20 })).rejects.toThrow();
    });
  });

  describe("admin.review", () => {
    it("approves a portfolio", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.review({
        portfolioId: 1,
        status: "approved",
        notes: "عمل ممتاز",
      });
      expect(result).toEqual({ success: true });
    });

    it("rejects a portfolio with notes", async () => {
      const ctx = createUserContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.review({
        portfolioId: 1,
        status: "rejected",
        notes: "يحتاج تحسين في المعيار الثالث",
      });
      expect(result).toEqual({ success: true });
    });
  });
});

// ─── AI Classification Tests ────────────────────────────
describe("ai.classifyEvidence", () => {
  it("classifies evidence from file name", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.classifyEvidence({
      fileName: "سجل_الحضور.pdf",
      fileType: "application/pdf",
      description: "سجل حضور المعلم",
    });
    expect(result.success).toBe(true);
    expect(result.classification).toHaveProperty("standardId");
    expect(result.classification).toHaveProperty("confidence");
  });

  it("classifies evidence with image URL", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.classifyEvidence({
      fileName: "شهادة_تدريب.jpg",
      fileType: "image/jpeg",
      fileUrl: "https://example.com/cert.jpg",
      description: "شهادة حضور دورة تدريبية",
    });
    expect(result.success).toBe(true);
    expect(result.classification).toHaveProperty("standardName");
  });

  it("classifies evidence with link URL", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.classifyEvidence({
      linkUrl: "https://madrasati.sa/course/123",
      description: "دورة تدريبية على منصة مدرستي",
    });
    expect(result.success).toBe(true);
  });
});
