import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobId: varchar("jobId", { length: 64 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  personalInfo: json("personalInfo").$type<Record<string, string>>().notNull(),
  criteriaData: json("criteriaData").$type<Record<string, any>>().notNull(),
  customCriteria: json("customCriteria").$type<any[]>(),
  themeId: varchar("themeId", { length: 64 }).default("classic"),
  completionPercentage: int("completionPercentage").default(0),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "approved", "rejected"]).default("draft").notNull(),
  reviewNotes: text("reviewNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

export const uploadedFiles = mysqlTable("uploaded_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  portfolioId: int("portfolioId"),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  url: text("url").notNull(),
  originalName: varchar("originalName", { length: 512 }),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: int("fileSize"),
  criterionId: varchar("criterionId", { length: 128 }),
  subEvidenceId: varchar("subEvidenceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

export const shareLinks = mysqlTable("share_links", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  hasPassword: boolean("hasPassword").default(false),
  passwordHash: varchar("passwordHash", { length: 256 }),
  viewCount: int("viewCount").default(0),
  maxViews: int("maxViews").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = typeof shareLinks.$inferInsert;

// ─── Template Engine Types ────────────────────────────
export type TemplateFieldType = 'text' | 'textarea' | 'date' | 'select' | 'number' | 'image' | 'list' | 'signatures';

export interface TemplateField {
  id: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select type
  defaultValue?: string;
  gridColumn?: string; // e.g. '1 / 3' for spanning
}

export interface TemplateSection {
  id: string;
  title: string;
  titleBg?: string; // gradient or color for section title
  columns?: number; // 1 or 2 column layout
  fields: TemplateField[];
}

export type LayoutType = 
  | 'dark-header-table'
  | 'dark-header-simple'
  | 'white-header-classic'
  | 'white-header-sidebar'
  | 'white-header-light'
  | 'white-header-multi'
  | 'minimal-clean';

export type FieldStyle = 'table' | 'fieldset' | 'underlined' | 'cards' | 'minimal';
export type TitleStyle = 'full-width' | 'bordered' | 'underlined' | 'rounded' | 'badge' | 'simple';
export type SignatureStyle = 'boxed' | 'lined' | 'simple' | 'stamped';
export type FooterStyle = 'gradient' | 'solid' | 'line' | 'none';

export interface TemplateLayout {
  version: number;
  pageSize?: 'A4' | 'letter';
  direction?: 'rtl' | 'ltr';
  // New layout system
  layoutType?: LayoutType;
  fieldStyle?: FieldStyle;
  titleStyle?: TitleStyle;
  signatureStyle?: SignatureStyle;
  footerStyle?: FooterStyle;
  // Legacy fields
  headerStyle?: 'full-width' | 'centered' | 'minimal';
  showMoeLogo?: boolean;
  showSchoolLogo?: boolean;
  showEvidenceSection?: boolean;
  evidenceDisplay?: 'images' | 'qr' | 'mixed';
  sections: TemplateSection[];
  footerText?: string;
  signatureLabels?: { right: string; left: string };
}

// ─── PDF Templates (Themes) ────────────────────────────────
export const pdfTemplates = mysqlTable("pdf_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  headerBg: varchar("headerBg", { length: 128 }).notNull().default("linear-gradient(135deg, #059669, #047857)"),
  headerText: varchar("headerText", { length: 32 }).notNull().default("#ffffff"),
  accent: varchar("accent", { length: 32 }).notNull().default("#059669"),
  borderColor: varchar("borderColor", { length: 32 }).notNull().default("#e5e7eb"),
  bodyBg: varchar("bodyBg", { length: 32 }).notNull().default("#ffffff"),
  fontFamily: varchar("fontFamily", { length: 128 }).default("'Cairo', 'Tajawal', sans-serif"),
  coverImageUrl: text("coverImageUrl"),
  logoUrl: text("logoUrl"),
  // Template Engine: JSON structure defining the layout and dynamic fields
  templateLayout: json("templateLayout").$type<TemplateLayout>(),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  shareToken: varchar("shareToken", { length: 128 }).unique(),
  isShared: boolean("isShared").default(false),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdfTemplate = typeof pdfTemplates.$inferSelect;
export type InsertPdfTemplate = typeof pdfTemplates.$inferInsert;

// ─── User Custom Themes (حفظ الثيمات المخصصة للمستخدم) ────────────────────
export const userThemes = mysqlTable("user_themes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  themeData: json("themeData").$type<Record<string, any>>().notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = typeof userThemes.$inferInsert;
