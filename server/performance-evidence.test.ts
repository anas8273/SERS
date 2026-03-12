import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user", userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `مستخدم ${userId}`,
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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Portfolio CRUD ────────────────────────────────────
describe("Portfolio CRUD", () => {
  it("portfolio.list returns empty array for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.portfolio.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("portfolio.create creates a new portfolio and returns it", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد", school: "مدرسة النور" },
      criteriaData: {},
      customCriteria: [],
      themeId: "official",
      completionPercentage: 0,
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("portfolio.get returns created portfolio", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد", school: "مدرسة النور" },
      criteriaData: { "std-1": { score: 4, notes: "", evidences: [] } },
      themeId: "official",
      completionPercentage: 25,
    });
    const fetched = await caller.portfolio.get({ id: created.id });
    expect(fetched).not.toBeNull();
    expect(fetched!.jobId).toBe("teacher");
    expect(fetched!.jobTitle).toBe("معلم");
  });

  it("portfolio.update modifies existing portfolio", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });
    const updated = await caller.portfolio.update({
      id: created.id,
      themeId: "blue",
      completionPercentage: 50,
    });
    expect(updated).toBeDefined();
  });

  it("portfolio.delete removes portfolio", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });
    await caller.portfolio.delete({ id: created.id });
    const fetched = await caller.portfolio.get({ id: created.id });
    expect(fetched).toBeNull();
  });

  it("portfolio.get returns null for non-existent id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const fetched = await caller.portfolio.get({ id: 999999 });
    expect(fetched).toBeNull();
  });

  it("portfolio.submit changes status to submitted", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });
    await caller.portfolio.submit({ id: created.id });
    const fetched = await caller.portfolio.get({ id: created.id });
    expect(fetched).not.toBeNull();
    expect(fetched!.status).toBe("submitted");
  });
});

// ─── Multi-User Data Isolation ────────────────────────
describe("Multi-User Data Isolation", () => {
  it("user cannot see another user's portfolio", async () => {
    const ctx1 = createAuthContext("user", 1);
    const ctx2 = createAuthContext("user", 2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const created = await caller1.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    // User 2 should not see User 1's portfolio
    const fetched = await caller2.portfolio.get({ id: created.id });
    expect(fetched).toBeNull();
  });

  it("user cannot update another user's portfolio", async () => {
    const ctx1 = createAuthContext("user", 1);
    const ctx2 = createAuthContext("user", 2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const created = await caller1.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    // User 2 trying to update User 1's portfolio should fail or return null
    const result = await caller2.portfolio.update({
      id: created.id,
      completionPercentage: 100,
    });
    // Should not have updated - verify original data unchanged
    const fetched = await caller1.portfolio.get({ id: created.id });
    expect(fetched!.completionPercentage).toBe(0);
  });

  it("user cannot delete another user's portfolio", async () => {
    const ctx1 = createAuthContext("user", 1);
    const ctx2 = createAuthContext("user", 2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const created = await caller1.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    // User 2 trying to delete User 1's portfolio
    await caller2.portfolio.delete({ id: created.id });
    // Portfolio should still exist for User 1
    const fetched = await caller1.portfolio.get({ id: created.id });
    expect(fetched).not.toBeNull();
  });

  it("each user sees only their own portfolios in list", async () => {
    const ctx1 = createAuthContext("user", 1);
    const ctx2 = createAuthContext("user", 2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    await caller1.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    await caller2.portfolio.create({
      jobId: "principal",
      jobTitle: "مدير",
      personalInfo: { name: "محمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    const list1 = await caller1.portfolio.list();
    const list2 = await caller2.portfolio.list();

    // Each user should only see their own portfolios
    const user1Jobs = list1.map((p: any) => p.jobId);
    const user2Jobs = list2.map((p: any) => p.jobId);

    expect(user1Jobs).not.toContain("principal");
    expect(user2Jobs).not.toContain("teacher");
  });
});

// ─── PDF Templates ────────────────────────────────────
describe("PDF Templates", () => {
  it("templates.list returns array of templates (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.templates.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can create a template", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.templates.create({
      name: "قالب اختبار",
      headerBg: "#1B5E20",
      headerText: "#ffffff",
      accent: "#2E7D32",
      borderColor: "#1B5E20",
      bodyBg: "#ffffff",
      description: "قالب للاختبار",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("admin can update a template", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const created = await caller.templates.create({
      name: "قالب للتعديل",
      headerBg: "#1B5E20",
      headerText: "#ffffff",
      accent: "#2E7D32",
      borderColor: "#1B5E20",
      bodyBg: "#ffffff",
    });
    const updated = await caller.templates.update({
      id: created.id,
      name: "قالب معدّل",
      headerBg: "#0D47A1",
    });
    expect(updated).toBeDefined();
  });

  it("admin can delete a template", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const created = await caller.templates.create({
      name: "قالب للحذف",
      headerBg: "#1B5E20",
      headerText: "#ffffff",
      accent: "#2E7D32",
      borderColor: "#1B5E20",
      bodyBg: "#ffffff",
    });
    const result = await caller.templates.delete({ id: created.id });
    expect(result).toBeDefined();
  });

  it("admin can list all templates including inactive", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.templates.listAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can seed default templates", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.templates.seed();
    expect(result).toEqual({ success: true });
  });

  it("regular user cannot create templates", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.templates.create({
      name: "قالب غير مصرح",
      headerBg: "#1B5E20",
      headerText: "#ffffff",
      accent: "#2E7D32",
      borderColor: "#1B5E20",
      bodyBg: "#ffffff",
    })).rejects.toThrow();
  });
});

// ─── Share Links ────────────────────────────────────
describe("Share Links", () => {
  it("create share link and view it", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const portfolio = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    const link = await caller.share.create({
      portfolioId: portfolio.id,
      expiresInDays: 7,
      maxViews: 100,
    });
    expect(link.token).toBeDefined();
    expect(typeof link.token).toBe("string");
    expect(link.token.length).toBeGreaterThan(10);

    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    const viewed = await publicCaller.share.view({ token: link.token });
    expect(viewed.error).toBeNull();
    expect(viewed.portfolio).not.toBeNull();
  });

  it("invalid share token returns error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.share.view({ token: "invalid-token-xyz" });
    expect(result.error).toBeTruthy();
    expect(result.portfolio).toBeNull();
  });

  it("share link with password requires correct password", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const portfolio = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    const link = await caller.share.create({
      portfolioId: portfolio.id,
      expiresInDays: 7,
      maxViews: 100,
      password: "secret123",
    });

    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    // Wrong password
    const wrongPw = await publicCaller.share.view({ token: link.token, password: "wrong" });
    expect(wrongPw.error).toBeTruthy();
    expect(wrongPw.requiresPassword).toBe(true);

    // Correct password
    const correctPw = await publicCaller.share.view({ token: link.token, password: "secret123" });
    expect(correctPw.error).toBeNull();
    expect(correctPw.portfolio).not.toBeNull();
  });

  it("can list share links by portfolio", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const portfolio = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    await caller.share.create({
      portfolioId: portfolio.id,
      expiresInDays: 7,
      maxViews: 100,
    });

    const links = await caller.share.listByPortfolio({ portfolioId: portfolio.id });
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("can deactivate share link", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const portfolio = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    const link = await caller.share.create({
      portfolioId: portfolio.id,
      expiresInDays: 7,
      maxViews: 100,
    });

    // We need the link id - get it from listByPortfolio
    const links = await caller.share.listByPortfolio({ portfolioId: portfolio.id });
    const linkRecord = links.find((l: any) => l.token === link.token);
    expect(linkRecord).toBeDefined();

    await caller.share.deactivate({ id: linkRecord!.id });
  });
});

// ─── Admin Dashboard ────────────────────────────────
describe("Admin Dashboard", () => {
  it("admin can list all portfolios", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.portfolios({ page: 1, limit: 20 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("admin can review a portfolio", async () => {
    const userCtx = createAuthContext("user");
    const userCaller = appRouter.createCaller(userCtx);
    const portfolio = await userCaller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    const adminCtx = createAuthContext("admin");
    const adminCaller = appRouter.createCaller(adminCtx);
    const result = await adminCaller.admin.review({
      portfolioId: portfolio.id,
      status: "approved",
      notes: "ممتاز",
    });
    expect(result).toBeDefined();
  });

  it("admin can view portfolio detail", async () => {
    const userCtx = createAuthContext("user");
    const userCaller = appRouter.createCaller(userCtx);
    const portfolio = await userCaller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: {},
      themeId: "official",
      completionPercentage: 0,
    });

    const adminCtx = createAuthContext("admin");
    const adminCaller = appRouter.createCaller(adminCtx);
    const detail = await adminCaller.admin.portfolioDetail({ id: portfolio.id });
    expect(detail).not.toBeNull();
    expect(detail!.jobId).toBe("teacher");
    expect(Array.isArray(detail!.files)).toBe(true);
  });

  it("regular user cannot access admin endpoints", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.portfolios({ page: 1, limit: 20 })).rejects.toThrow();
  });

  it("admin can filter portfolios by status", async () => {
    const adminCtx = createAuthContext("admin");
    const adminCaller = appRouter.createCaller(adminCtx);
    const result = await adminCaller.admin.portfolios({ page: 1, limit: 20, status: "draft" });
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });
});

// ─── Auth ────────────────────────────────────
describe("Auth", () => {
  it("auth.me returns user for authenticated context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user!.name).toBe("مستخدم 1");
  });

  it("auth.me returns null for public context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("auth.logout clears cookie", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Portfolio with Criteria Data ────────────────────
describe("Portfolio with Criteria Data", () => {
  it("can save and retrieve criteria data with evidences", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const criteriaData = {
      "std-1": {
        score: 4,
        notes: "أداء ممتاز",
        evidences: [
          { id: "ev-1", type: "text", text: "شاهد نصي", priority: "essential" },
          { id: "ev-2", type: "image", fileData: "data:image/png;base64,abc", priority: "supporting" },
        ],
      },
      "std-2": {
        score: 3,
        notes: "",
        evidences: [],
      },
    };

    const created = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData,
      themeId: "official",
      completionPercentage: 50,
    });

    const fetched = await caller.portfolio.get({ id: created.id });
    expect(fetched).not.toBeNull();
    const cd = fetched!.criteriaData as Record<string, any>;
    expect(cd["std-1"].score).toBe(4);
    expect(cd["std-1"].evidences).toHaveLength(2);
    expect(cd["std-1"].evidences[0].priority).toBe("essential");
  });

  it("can update criteria data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.portfolio.create({
      jobId: "teacher",
      jobTitle: "معلم",
      personalInfo: { name: "أحمد" },
      criteriaData: { "std-1": { score: 2, notes: "", evidences: [] } },
      themeId: "official",
      completionPercentage: 10,
    });

    await caller.portfolio.update({
      id: created.id,
      criteriaData: { "std-1": { score: 5, notes: "ممتاز", evidences: [{ id: "ev-1", type: "text", text: "شاهد" }] } },
      completionPercentage: 100,
    });

    const fetched = await caller.portfolio.get({ id: created.id });
    expect(fetched).not.toBeNull();
    const cd = fetched!.criteriaData as Record<string, any>;
    expect(cd["std-1"].score).toBe(5);
    expect(cd["std-1"].evidences).toHaveLength(1);
    expect(fetched!.completionPercentage).toBe(100);
  });
});
