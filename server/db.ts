import { eq, and, desc, sql, gt, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, portfolios, uploadedFiles, shareLinks, pdfTemplates, userThemes, type InsertPortfolio, type InsertUploadedFile, type InsertShareLink, type InsertPdfTemplate, type InsertUserTheme } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Portfolios ──────────────────────────────────────────
export async function createPortfolio(data: InsertPortfolio) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(portfolios).values(data);
  const id = Number(result[0].insertId);
  return { id };
}

export async function updatePortfolio(id: number, userId: number, data: Partial<InsertPortfolio>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portfolios).set(data).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
  return { success: true };
}

export async function getPortfoliosByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(desc(portfolios.updatedAt));
}

export async function getPortfolioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deletePortfolio(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(uploadedFiles).where(eq(uploadedFiles.portfolioId, id));
  await db.delete(shareLinks).where(eq(shareLinks.portfolioId, id));
  await db.delete(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
  return { success: true };
}

// ─── Admin: All Portfolios ──────────────────────────────
export async function getAllPortfolios(page = 1, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;

  const conditions = status ? and(eq(portfolios.status, status as any)) : undefined;

  const items = await db
    .select({
      id: portfolios.id,
      userId: portfolios.userId,
      jobId: portfolios.jobId,
      jobTitle: portfolios.jobTitle,
      completionPercentage: portfolios.completionPercentage,
      status: portfolios.status,
      reviewNotes: portfolios.reviewNotes,
      createdAt: portfolios.createdAt,
      updatedAt: portfolios.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(portfolios)
    .leftJoin(users, eq(portfolios.userId, users.id))
    .where(conditions)
    .orderBy(desc(portfolios.updatedAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(portfolios)
    .where(conditions);

  return { items, total: countResult[0]?.count ?? 0 };
}

export async function reviewPortfolio(id: number, reviewerId: number, status: string, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portfolios).set({
    status: status as any,
    reviewNotes: notes,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
  }).where(eq(portfolios.id, id));
  return { success: true };
}

// ─── Uploaded Files ──────────────────────────────────────
export async function createUploadedFile(data: InsertUploadedFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploadedFiles).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getFilesByPortfolio(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploadedFiles).where(eq(uploadedFiles.portfolioId, portfolioId)).orderBy(desc(uploadedFiles.createdAt));
}

export async function deleteUploadedFile(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(uploadedFiles).where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)));
  return { success: true };
}

// ─── Share Links ─────────────────────────────────────────
export async function createShareLink(data: InsertShareLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shareLinks).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getShareLinkByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shareLinks)
    .where(and(eq(shareLinks.token, token), eq(shareLinks.isActive, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementShareLinkViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(shareLinks).set({ viewCount: sql`${shareLinks.viewCount} + 1` }).where(eq(shareLinks.id, id));
}

export async function getShareLinksByPortfolio(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shareLinks).where(eq(shareLinks.portfolioId, portfolioId)).orderBy(desc(shareLinks.createdAt));
}

export async function deactivateShareLink(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shareLinks).set({ isActive: false }).where(and(eq(shareLinks.id, id), eq(shareLinks.userId, userId)));
  return { success: true };
}

// ─── PDF Templates ─────────────────────────────────
export async function createPdfTemplate(data: InsertPdfTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pdfTemplates).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updatePdfTemplate(id: number, data: Partial<InsertPdfTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pdfTemplates).set(data).where(eq(pdfTemplates.id, id));
  return { success: true };
}

export async function deletePdfTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pdfTemplates).where(eq(pdfTemplates.id, id));
  return { success: true };
}

export async function getActivePdfTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pdfTemplates).where(eq(pdfTemplates.isActive, true)).orderBy(pdfTemplates.sortOrder);
}

export async function getAllPdfTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pdfTemplates).orderBy(pdfTemplates.sortOrder);
}

// ─── User Custom Themes ──────────────────────────────────────
export async function createUserTheme(data: InsertUserTheme) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userThemes).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateUserTheme(id: number, userId: number, data: Partial<InsertUserTheme>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userThemes).set(data).where(and(eq(userThemes.id, id), eq(userThemes.userId, userId)));
  return { success: true };
}

export async function deleteUserTheme(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userThemes).where(and(eq(userThemes.id, id), eq(userThemes.userId, userId)));
  return { success: true };
}

export async function getUserThemes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userThemes).where(eq(userThemes.userId, userId)).orderBy(desc(userThemes.updatedAt));
}

export async function getUserThemeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userThemes).where(eq(userThemes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function seedDefaultTemplates() {
  const db = await getDb();
  if (!db) return;
  // إعادة إنشاء القوالب إذا كانت فارغة
  const existing = await db.select().from(pdfTemplates).limit(1);
  if (existing.length > 0) return;
  
  const baseFields = [
    { id: 'subject', label: 'الموضوع', type: 'text', required: true },
    { id: 'executionDate', label: 'تاريخ التنفيذ', type: 'date' },
    { id: 'beneficiaries', label: 'المستفيدون', type: 'text' },
    { id: 'field', label: 'المجال', type: 'text' },
    { id: 'executor', label: 'المنفذ/ون', type: 'text' },
    { id: 'participants', label: 'المشارك/ون', type: 'text' },
    { id: 'location', label: 'مكان التنفيذ', type: 'text' },
    { id: 'duration', label: 'مدة التنفيذ', type: 'text' },
  ];

  const baseSections = [
    { id: 'info', title: 'تقرير عن برنامج', columns: 2, fields: baseFields },
    { id: 'goals', title: 'الأهداف', columns: 1, fields: [{ id: 'goals', label: 'الأهداف', type: 'list' }] },
    { id: 'steps', title: 'خطوات التنفيذ / الوصف', columns: 1, fields: [{ id: 'steps', label: 'خطوات التنفيذ', type: 'list' }] },
    { id: 'impact', title: 'أثر البرنامج', columns: 2, fields: [{ id: 'impact', label: 'أثر البرنامج', type: 'list' }, { id: 'recommendations', label: 'التوصيات', type: 'list' }] },
  ];

  const makeLayout = (overrides: Record<string, any>): any => ({
    version: 1,
    pageSize: 'A4' as const,
    direction: 'rtl' as const,
    showMoeLogo: true,
    showSchoolLogo: true,
    showEvidenceSection: true,
    evidenceDisplay: 'mixed',
    sections: baseSections,
    signatureLabels: { right: 'المعلم / اسم المعلم', left: 'مدير المدرسة / اسم المدير' },
    footerText: 'SERS - نظام السجلات التعليمية الذكي',
    ...overrides,
  });

  // === قالب واحد فقط في DB (بطاقات - شريط جانبي) ===
  // القوالب الأساسية (ترويسة بيضاء، ترويسة داكنة، خفيف حبر) مدمجة في الكود BUILTIN_THEMES
  // الإدارة يمكنها إضافة قوالب إضافية من لوحة التحكم
  const defaults: InsertPdfTemplate[] = [
    // بطاقات - شريط جانبي + بطاقات
    {
      name: "بطاقات - شريط جانبي",
      description: "شريط جانبي ملون مع حقول بطاقات - الهوية البصرية الرسمية",
      headerBg: "#ffffff",
      headerText: "#0d7377",
      accent: "#0d7377",
      borderColor: "#0a5c5f",
      bodyBg: "#f8fafb",
      templateLayout: makeLayout({ layoutType: 'white-header-sidebar', fieldStyle: 'cards', titleStyle: 'badge', signatureStyle: 'stamped', footerStyle: 'gradient', coverStyle: 'diagonal', sectionCoverStyle: 'card-center', coverAccent2: '#2ea87a' }),
      isDefault: false,
      sortOrder: 1,
    },
  ];
  
  for (const t of defaults) {
    await db.insert(pdfTemplates).values(t);
  }
}
