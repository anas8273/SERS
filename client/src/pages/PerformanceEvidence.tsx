import React from 'react';
/**
 * شواهد الأداء الوظيفي - SERS
 * المعلم/المعلمة → نظام المعايير الـ 11 (نمط معياري) مع 45 مؤشر
 * باقي الوظائف → النظام العادي (البنود) مع ميزات معياري
 */
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { usePreviewScale } from "@/hooks/usePreviewScale";

const A4_WIDTH_PX = 793.7; // 210mm in px
import { saveFileToIDB, getFileFromIDB, deleteFileFromIDB, cleanOldFiles } from "@/hooks/useIndexedDB";
import { getLoginUrl } from "@/const";
import { generateQRDataURL } from "@/lib/qr-utils";
import { exportToPDF, exportMultipleReportsToPDF, printElement } from "@/lib/pdf-export";
// تم حذف تصدير Word لأن التنسيق مدمر - الاكتفاء بـ PDF
import { getMoeLogoDataUrl, getMoeLogoUrl, getMoeDotsUrl, getMoeLogoFilter } from "@/components/MoeLogo";
import { STANDARDS, type Standard, type Indicator } from "@/lib/standards-data";
import {
  PRINCIPAL_STANDARDS, VICE_PRINCIPAL_STANDARDS, COUNSELOR_STANDARDS,
  HEALTH_COUNSELOR_STANDARDS, ACTIVITY_LEADER_STANDARDS, LAB_TECHNICIAN_STANDARDS,
  KINDERGARTEN_STANDARDS, SUPERVISOR_STANDARDS, SPECIAL_ED_STANDARDS, getStandardsForJob,
} from "@/lib/all-jobs-standards";
import {
  ArrowLeft, ArrowRight, Sparkles, Upload, Plus, Trash2, Save,
  Eye, Download, Printer, FileText, Image, Video, QrCode, Type,
  LinkIcon, Loader2, ChevronDown, ChevronUp, Layers, BarChart3,
  CheckCircle, AlertTriangle, XCircle, TrendingUp, Wand2, X,
  GraduationCap, Building2, Users, Heart, Search as SearchIcon,
  BookOpen, Baby, Accessibility, Briefcase, ClipboardList,
  ClipboardCheck, Handshake, UserCheck, Target,
  NotebookPen, Monitor, School, Award, PieChart, ListChecks,
  GripVertical, Move, FlaskConical, Activity, Megaphone, Share2, Globe, Copy, Link2, Settings,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, RefreshCw, Palette
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// خريطة أيقونات Lucide لاستبدال emoji
const STANDARD_ICONS: Record<string, LucideIcon> = {
  "std-1": ClipboardCheck,   // أداء الواجبات الوظيفية
  "std-2": Handshake,        // التفاعل مع المجتمع المهني
  "std-3": UserCheck,        // التفاعل مع أولياء الأمور
  "std-4": Target,           // التنويع في استراتيجيات التدريس
  "std-5": TrendingUp,       // تحسين نتائج المتعلمين
  "std-6": NotebookPen,      // إعداد وتنفيذ خطة التعلم
  "std-7": Monitor,          // توظيف تقنيات ووسائل التعلم
  "std-8": School,           // تهيئة البيئة التعليمية
  "std-9": Award,            // الإدارة الصفية
  "std-10": PieChart,        // تحليل نتائج المتعلمين
  "std-11": ListChecks,      // تنوع أساليب التقويم
};
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ===== أنواع البيانات =====
type EvidenceType = "text" | "image" | "link" | "file" | "video";
type EvidencePriority = "essential" | "supporting" | "additional";
interface FormField { id: string; label: string; type: "text" | "textarea" | "date" | "number" | "select"; placeholder?: string; required?: boolean; options?: string[]; }
interface SubEvidence { id: string; title: string; description: string; type: "report" | "upload" | "both"; isCustom?: boolean; isSubItem?: boolean; parentTitle?: string; formFields?: FormField[]; }
interface Criterion { id: string; title: string; maxScore: number; description: string; subEvidences: SubEvidence[]; }
interface EvidenceItem {
  id: string; subEvidenceId: string; type: EvidenceType; text: string; link: string;
  fileData: string | null; fileName: string; displayAs: "image" | "qr"; formData?: Record<string, string>;
  comment?: string; priority?: EvidencePriority; keywords?: string[]; showBarcode?: boolean;
  uploadedUrl?: string; // رابط S3 العام للملف المرفوع - يُستخدم في QR Code
}
interface CriterionData { score: number; notes: string; evidences: EvidenceItem[]; customSubEvidences: SubEvidence[]; }

// ===== بناء البنود للوظائف غير المعلم =====
function makeSimpleCriteria(prefix: string, items: { id: string; title: string; desc: string; subTitle: string; formFields?: FormField[] }[]): Criterion[] {
  return items.map(item => ({
    id: `${prefix}_${item.id}`, title: item.title, maxScore: 5, description: item.desc,
    subEvidences: [{
      id: `${prefix}_${item.id}_sub`, title: item.subTitle, description: item.desc, type: "both" as const,
      formFields: item.formFields || [
        { id: "report_title", label: "الموضوع", type: "text" as const, placeholder: "أدخل موضوع الشاهد..." },
        { id: "title", label: "العنوان", type: "text" as const, placeholder: "أدخل العنوان..." },
        { id: "date", label: "التاريخ", type: "date" as const },
        { id: "details", label: "التفاصيل", type: "textarea" as const, placeholder: "أدخل التفاصيل..." },
        { id: "notes", label: "ملاحظات", type: "textarea" as const, placeholder: "ملاحظات إضافية..." },
      ],
    }],
  }));
}

// ===== دالة عامة لبناء بنود أي وظيفة من النظام المعياري (3 مستويات) =====
function buildStandardsCriteria(standards: Standard[]): Criterion[] {
  return standards.map(std => ({
    id: std.id,
    title: std.title,
    maxScore: 5,
    description: `${std.items.length} بند \u00B7 الوزن ${std.weight}%`,
    subEvidences: std.items.flatMap(item => [
      {
        id: item.id,
        title: item.text,
        description: item.suggestedEvidence.join(" \u00B7 "),
        type: "both" as const,
        formFields: [
          { id: "report_title", label: "الموضوع", type: "text" as const, placeholder: "أدخل موضوع الشاهد..." },
          { id: "evidence_desc", label: "\u0648\u0635\u0641 \u0627\u0644\u0634\u0627\u0647\u062F", type: "textarea" as const, placeholder: "\u0627\u0643\u062A\u0628 \u0648\u0635\u0641\u0627\u064B \u0644\u0644\u0634\u0627\u0647\u062F \u0627\u0644\u0645\u0642\u062F\u0645..." },
          { id: "date", label: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E", type: "date" as const },
          { id: "notes", label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", type: "textarea" as const, placeholder: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629..." },
        ],
      },
      ...(item.subItems || []).map(sub => ({
        id: sub.id,
        title: sub.title,
        description: sub.suggestedEvidence.join(" \u00B7 "),
        type: "both" as const,
        isSubItem: true,
        parentTitle: item.text,
        formFields: [
          { id: "report_title", label: "الموضوع", type: "text" as const, placeholder: "أدخل موضوع الشاهد..." },
          { id: "evidence_desc", label: "\u0648\u0635\u0641 \u0627\u0644\u0634\u0627\u0647\u062F", type: "textarea" as const, placeholder: "\u0627\u0643\u062A\u0628 \u0648\u0635\u0641\u0627\u064B \u0644\u0644\u0634\u0627\u0647\u062F \u0627\u0644\u0645\u0642\u062F\u0645..." },
          { id: "date", label: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E", type: "date" as const },
          { id: "notes", label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", type: "textarea" as const, placeholder: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629..." },
        ],
      })),
    ]),
  }));
}

// ===== بنود جميع الوظائف (نظام معياري رسمي - 3 مستويات) =====
const TEACHER_CRITERIA = buildStandardsCriteria(STANDARDS);
const PRINCIPAL_CRITERIA = buildStandardsCriteria(PRINCIPAL_STANDARDS);
const VICE_PRINCIPAL_CRITERIA = buildStandardsCriteria(VICE_PRINCIPAL_STANDARDS);
const COUNSELOR_CRITERIA = buildStandardsCriteria(COUNSELOR_STANDARDS);
const HEALTH_COUNSELOR_CRITERIA = buildStandardsCriteria(HEALTH_COUNSELOR_STANDARDS);
const ACTIVITY_LEADER_CRITERIA = buildStandardsCriteria(ACTIVITY_LEADER_STANDARDS);
const LAB_TECHNICIAN_CRITERIA = buildStandardsCriteria(LAB_TECHNICIAN_STANDARDS);
const KINDERGARTEN_CRITERIA = buildStandardsCriteria(KINDERGARTEN_STANDARDS);
const SUPERVISOR_CRITERIA = buildStandardsCriteria(SUPERVISOR_STANDARDS);

// ===== بنود الوظائف التي ليس لها معايير رسمية (تبقى بسيطة) =====
const LIBRARIAN_CRITERIA = makeSimpleCriteria("l", [
  { id: "1", title: "تنظيم مصادر التعلم", desc: "تنظيم وفهرسة المصادر", subTitle: "سجل المصادر" },
  { id: "2", title: "خدمة المستفيدين", desc: "تقديم خدمات متميزة", subTitle: "سجل الإعارة" },
  { id: "3", title: "التقنيات التعليمية", desc: "توظيف التقنيات", subTitle: "تقرير التقنيات" },
  { id: "4", title: "البرامج والأنشطة", desc: "تنفيذ البرامج", subTitle: "خطة البرامج" },
]);

const SPECIAL_ED_CRITERIA = buildStandardsCriteria(SPECIAL_ED_STANDARDS);

const ADMIN_ASSISTANT_CRITERIA = makeSimpleCriteria("a", [
  { id: "1", title: "الأعمال الإدارية", desc: "تنفيذ الأعمال الإدارية", subTitle: "سجل المهام" },
  { id: "2", title: "المراسلات والتقارير", desc: "إعداد المراسلات", subTitle: "سجل الصادر والوارد" },
  { id: "3", title: "متابعة الحضور والغياب", desc: "متابعة الحضور", subTitle: "سجل الحضور" },
  { id: "4", title: "خدمة المراجعين", desc: "تقديم خدمة متميزة", subTitle: "سجل المراجعين" },
  { id: "5", title: "الأرشفة والتوثيق", desc: "أرشفة الملفات", subTitle: "نظام الأرشفة" },
]);

// ===== أنواع الوظائف =====
const JOB_TYPES = [
  { id: "teacher", title: "معلم / معلمة", icon: GraduationCap, emoji: "👨‍🏫", criteria: TEACHER_CRITERIA, hasStandards: true, color: "#0097A7", desc: "نظام شامل يغطي 11 معيار و 45 مؤشر أداء وفق المعايير الرسمية" },
  { id: "principal", title: "مدير / مديرة مدرسة", icon: Building2, emoji: "👔", criteria: PRINCIPAL_CRITERIA, hasStandards: true, color: "#2563EB", desc: "معايير القيادة المدرسية والإدارة التعليمية والتطوير المهني" },
  { id: "vice_principal", title: "وكيل / وكيلة مدرسة", icon: ClipboardList, emoji: "📋", criteria: VICE_PRINCIPAL_CRITERIA, hasStandards: true, color: "#7C3AED", desc: "معايير الإشراف على الشؤون التعليمية والإدارية بالمدرسة" },
  { id: "counselor", title: "موجه/ة طلابي/ة", icon: Users, emoji: "🤝", criteria: COUNSELOR_CRITERIA, hasStandards: true, color: "#0891B2", desc: "معايير التوجيه والإرشاد الطلابي والدعم النفسي والاجتماعي" },
  { id: "health_counselor", title: "معلم/ة مسند له توجيه صحي", icon: Heart, emoji: "🏥", criteria: HEALTH_COUNSELOR_CRITERIA, hasStandards: true, color: "#DC2626", desc: "معايير التوعية الصحية والإسعافات الأولية والبيئة المدرسية" },
  { id: "activity_leader", title: "معلم/ة مسند له نشاط (رائد/ة نشاط)", icon: Megaphone, emoji: "🏆", criteria: ACTIVITY_LEADER_CRITERIA, hasStandards: true, color: "#F59E0B", desc: "معايير تخطيط وتنفيذ الأنشطة الطلابية والبرامج اللاصفية" },
  { id: "lab_technician", title: "محضر/ة مختبر", icon: FlaskConical, emoji: "🧪", criteria: LAB_TECHNICIAN_CRITERIA, hasStandards: true, color: "#8B5CF6", desc: "معايير إعداد وتجهيز المختبرات وتطبيق معايير السلامة" },
  { id: "supervisor", title: "مشرف/ة تربوي/ة (التشكيلات الإشرافية)", icon: SearchIcon, emoji: "🔍", criteria: SUPERVISOR_CRITERIA, hasStandards: true, color: "#CA8A04", desc: "معايير الإشراف التربوي والمتابعة الميدانية وتطوير الأداء" },
  { id: "kindergarten", title: "معلمة رياض أطفال", icon: Baby, emoji: "🧒", criteria: KINDERGARTEN_CRITERIA, hasStandards: true, color: "#EC4899", desc: "معايير رعاية الطفولة المبكرة والتعلم باللعب والتنمية الشاملة" },
  { id: "librarian", title: "أمين/ة مصادر تعلم", icon: BookOpen, emoji: "📚", criteria: LIBRARIAN_CRITERIA, hasStandards: false, color: "#9333EA", desc: "معايير إدارة مصادر التعلم وتنظيم المكتبة وخدمة المستفيدين" },
  { id: "special_ed", title: "معلم/ة تربية خاصة", icon: Accessibility, emoji: "♿", criteria: SPECIAL_ED_CRITERIA, hasStandards: true, color: "#F97316", desc: "معايير التربية الخاصة والخطط الفردية والتقييم والتشخيص والدمج" },
  { id: "admin_assistant", title: "مساعد/ة إداري/ة", icon: Briefcase, emoji: "🗂️", criteria: ADMIN_ASSISTANT_CRITERIA, hasStandards: false, color: "#6B7280", desc: "معايير الدعم الإداري والتنظيم المكتبي والمتابعة اليومية" },
];

// ===== أنماط التنسيق المختلفة =====
// layoutType يحدد شكل التقرير بالكامل (ليس فقط الألوان)
type LayoutType = 
  | 'dark-header-table'    // ترويسة داكنة + حقول جدول (PDF صفحة 6)
  | 'dark-header-simple'   // ترويسة داكنة + حقول fieldset (PDF صفحة 4-5)
  | 'white-header-classic' // ترويسة بيضاء + حقول fieldset كلاسيكي (PDF صفحة 7)
  | 'white-header-sidebar' // ترويسة بيضاء + شريط جانبي (PDF صفحة 3)
  | 'white-header-cards'   // ترويسة بيضاء + بطاقات ملونة (بدون شريط جانبي)
  | 'white-header-light'   // ترويسة بيضاء + خلفية فاتحة + شريط عنوان كامل (PDF صفحة 9)
  | 'white-header-multi'   // ترويسة بيضاء + أعمدة متعددة (PDF صفحة 10)
  | 'minimal-clean';       // تصميم بسيط ونظيف

interface ThemeConfig {
  id: string;
  name: string;
  layoutType: LayoutType;
  headerBg: string;
  headerText: string;
  accent: string;
  borderColor: string;
  titleBg: string;
  fieldLabelBg: string;
  footerBg: string;
  tableStyle: boolean;
  // خصائص إضافية للتنسيقات المختلفة
  sidebarBg?: string;       // للتصميم مع شريط جانبي
  titleStyle?: 'rounded' | 'full-width' | 'bordered' | 'underlined' | 'badge' | 'simple'; // شكل عنوان التقرير
  headerSeparator?: boolean; // خطوط فاصلة في الترويسة
  showTopLine?: boolean;     // خط علوي رفيع
  showBottomBar?: boolean;   // شريط سفلي
  fieldStyle?: 'table' | 'fieldset' | 'underlined' | 'cards' | 'minimal'; // نمط الحقول
  signatureStyle?: 'dotted' | 'solid' | 'boxed' | 'lined' | 'stamped';    // نمط التوقيعات
  bodyBg?: string;           // خلفية الجسم
  // === خصائص الغلاف والفواصل ===
  coverStyle?: 'gradient-center' | 'split-left' | 'diagonal' | 'framed-elegant' | 'top-bar' | 'minimal-line'; // نمط الغلاف الرئيسي
  sectionCoverStyle?: 'full-gradient' | 'left-stripe' | 'top-accent' | 'card-center' | 'numbered-bar' | 'clean-divider'; // نمط غلاف القسم
  coverAccent2?: string;     // لون ثانوي للغلاف
  // === نمط الترويسة ===
  headerVariant?: 'right-text-center-logo-left-info' | 'right-text-left-logo' | 'center-logo-banner' | 'full-header-sections';
}

// ===== قوالب مطابقة لملف الهوية البصرية =====
// اللون الافتراضي: تدرج أخضر #2ea87a → أزرق #1a5f7a (الهوية البصرية الرسمية)
// كل قالب يختلف في التنسيق (إطارات/بطاقات/خطوط) وليس فقط الألوان

// القالب 1: إطارات مستديرة (PDF صفحة 1) - ترويسة بيضاء + حقول بإطارات مستديرة
// التدرج الافتراضي: أزرق مخضر داكن #1a6b6a → أخضر زمردي #2ea87a → أخضر فاتح #5bb784
const DEFAULT_THEME: ThemeConfig = {
  id: 'default', name: 'الهوية البصرية تدرج',
  layoutType: 'white-header-classic',
  headerBg: '#ffffff', headerText: '#1a6b6a',
  accent: '#1a6b6a', borderColor: '#2ea87a',
  titleBg: '#1a6b6a', fieldLabelBg: '#1a6b6a',
  footerBg: '#1a6b6a',
  tableStyle: false, titleStyle: 'rounded', showTopLine: false, showBottomBar: true,
  fieldStyle: 'fieldset', signatureStyle: 'dotted',
  coverStyle: 'gradient-center', sectionCoverStyle: 'full-gradient', coverAccent2: '#5bb784',
  headerVariant: 'right-text-center-logo-left-info',
  headerSeparator: false,
};

// قوالب مدمجة - كل قالب بتنسيق مختلف فعلاً (8 قوالب متنوعة)
const BUILTIN_THEMES: ThemeConfig[] = [
  DEFAULT_THEME,
  {
    // القالب 2: ترويسة داكنة + جدول رسمي - عناوين بخلفية داكنة + حقول جدول منظمة
    id: 'builtin-dark-table', name: 'جدول رسمي',
    layoutType: 'dark-header-table',
    headerBg: '#1a6b6a', headerText: '#ffffff',
    accent: '#1a6b6a', borderColor: '#2ea87a',
    titleBg: '#1a6b6a', fieldLabelBg: '#1a6b6a',
    footerBg: '#1a6b6a',
    tableStyle: true, titleStyle: 'full-width', showTopLine: false, showBottomBar: true,
    fieldStyle: 'table', signatureStyle: 'boxed',
    coverStyle: 'top-bar', sectionCoverStyle: 'numbered-bar', coverAccent2: '#5bb784',
    headerVariant: 'right-text-center-logo-left-info',
    bodyBg: '#ffffff',
  },
  {
    // القالب 3: خطوط أفقية - ترويسة بيضاء + حقول بخط سفلي أنيق
    id: 'builtin-lined', name: 'خطوط أنيقة',
    layoutType: 'white-header-classic',
    headerBg: '#ffffff', headerText: '#1a6b6a',
    accent: '#1a6b6a', borderColor: '#2ea87a',
    titleBg: '#1a6b6a', fieldLabelBg: '#e8f5f0',
    footerBg: '#1a6b6a',
    tableStyle: false, titleStyle: 'underlined', showTopLine: true, showBottomBar: true,
    fieldStyle: 'underlined', signatureStyle: 'lined',
    coverStyle: 'split-left', sectionCoverStyle: 'left-stripe', coverAccent2: '#5bb784',
    headerVariant: 'right-text-center-logo-left-info',
    headerSeparator: true,
    bodyBg: '#ffffff',
  },
  {
    // القالب 4: بطاقات حديثة - ترويسة بيضاء + حقول ببطاقات ملونة + غلاف أنيق
    id: 'builtin-cards', name: 'بطاقات حديثة',
    layoutType: 'white-header-cards',
    headerBg: '#ffffff', headerText: '#1a6b6a',
    accent: '#1a6b6a', borderColor: '#2ea87a',
    titleBg: '#1a6b6a', fieldLabelBg: '#f0f7f4',
    footerBg: '#1a6b6a',
    tableStyle: false, titleStyle: 'badge', showTopLine: false, showBottomBar: true,
    fieldStyle: 'cards', signatureStyle: 'stamped',
    coverStyle: 'framed-elegant', sectionCoverStyle: 'card-center', coverAccent2: '#5bb784',
    headerVariant: 'right-text-left-logo',
    headerSeparator: false,
    bodyBg: '#ffffff',
  },
  {
    // القالب 5: تصميم نظيف - ترويسة بيضاء مع شريط جانبي + حقول بسيطة
    id: 'builtin-minimal', name: 'تصميم نظيف',
    layoutType: 'minimal-clean',
    headerBg: '#ffffff', headerText: '#1a6b6a',
    accent: '#1a6b6a', borderColor: '#2ea87a',
    titleBg: '#1a6b6a', fieldLabelBg: '#f0f4f8',
    footerBg: '#1a6b6a',
    tableStyle: false, titleStyle: 'simple', showTopLine: false, showBottomBar: false,
    fieldStyle: 'minimal', signatureStyle: 'dotted',
    coverStyle: 'minimal-line', sectionCoverStyle: 'clean-divider', coverAccent2: '#5bb784',
    headerVariant: 'center-logo-banner',
    headerSeparator: false,
    bodyBg: '#ffffff',
  },
  {
    // القالب 6: النموذج الرسمي المتقدم - ترويسة داكنة + جدول مع خلفية فاتحة + غلاف قطري
    id: 'builtin-official-pro', name: 'النموذج الرسمي',
    layoutType: 'dark-header-table',
    headerBg: '#0d4f4f', headerText: '#ffffff',
    accent: '#0d4f4f', borderColor: '#1a8a7a',
    titleBg: '#0d4f4f', fieldLabelBg: '#0d4f4f',
    footerBg: '#0d4f4f',
    tableStyle: true, titleStyle: 'full-width', showTopLine: true, showBottomBar: true,
    fieldStyle: 'table', signatureStyle: 'boxed',
    coverStyle: 'diagonal', sectionCoverStyle: 'numbered-bar', coverAccent2: '#1a8a7a',
    headerVariant: 'full-header-sections',
    headerSeparator: true,
    bodyBg: '#f9fafb',
  },
  {
    // القالب 7: توفير حبر - تصميم بسيط بألوان فاتحة للطباعة الاقتصادية
    id: 'builtin-ink-saver', name: 'توفير حبر',
    layoutType: 'white-header-classic',
    headerBg: '#ffffff', headerText: '#374151',
    accent: '#6B7280', borderColor: '#D1D5DB',
    titleBg: '#F3F4F6', fieldLabelBg: '#F9FAFB',
    footerBg: '#F3F4F6',
    tableStyle: false, titleStyle: 'underlined', showTopLine: false, showBottomBar: false,
    fieldStyle: 'underlined', signatureStyle: 'dotted',
    coverStyle: 'minimal-line', sectionCoverStyle: 'clean-divider', coverAccent2: '#9CA3AF',
    headerVariant: 'right-text-center-logo-left-info',
    headerSeparator: false,
    bodyBg: '#ffffff',
  },
  {
    // القالب 8: الهوية الذهبية - ترويسة داكنة مع لمسات ذهبية فاخرة
    id: 'builtin-gold-accent', name: 'الهوية الذهبية',
    layoutType: 'dark-header-table',
    headerBg: '#1a3a4a', headerText: '#ffffff',
    accent: '#1a3a4a', borderColor: '#C8A951',
    titleBg: '#1a3a4a', fieldLabelBg: '#1a3a4a',
    footerBg: '#1a3a4a',
    tableStyle: true, titleStyle: 'full-width', showTopLine: true, showBottomBar: true,
    fieldStyle: 'cards', signatureStyle: 'stamped',
    coverStyle: 'gradient-center', sectionCoverStyle: 'card-center', coverAccent2: '#C8A951',
    headerVariant: 'right-text-left-logo',
    headerSeparator: true,
    bodyBg: '#FFFDF5',
  },
];

// ===== إعدادات الأولوية =====
const PRIORITY_CONFIG: Record<EvidencePriority, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  essential: { label: "أساسي", color: "#0097A7", bgColor: "bg-teal-50 dark:bg-teal-950/30", borderColor: "border-teal-300", icon: "★" },
  supporting: { label: "داعم", color: "#2563EB", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-300", icon: "◆" },
  additional: { label: "إضافي", color: "#9333EA", bgColor: "bg-violet-50 dark:bg-violet-950/30", borderColor: "border-violet-300", icon: "○" },
};

function createEmptyEvidence(subEvidenceId: string = ""): EvidenceItem {
  return {
    id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    subEvidenceId, type: "text", text: "", link: "",
    fileData: null, fileName: "", displayAs: "image", formData: {},
    priority: "essential", keywords: [], showBarcode: true,
  };
}

// ===== المكون الرئيسي =====
// ===== مفاتيح التخزين المحلي (localStorage يبقى حتى بعد إغلاق المتصفح) =====
const STORAGE_KEY = "sers_perf_state";
const STORAGE_PENDING_UPLOAD = "sers_pending_upload";
const STORAGE_AUTOSAVE_KEY = "sers_perf_autosave";

// ===== حفظ واستعادة الـ state من localStorage (يبقى حتى بعد إغلاق المتصفح) =====
function saveStateToStorage(data: {
  step: string; jobId: string; themeId: string;
  criteriaData: Record<string, CriterionData>; personalInfo: any;
  customCriteria: Criterion[]; currentCriterionIndex: number;
  activeTab: string; expandedSubEvidence: string | null;
}) {
  try {
    // حفظ الصور الصغيرة فقط لتجنب تجاوز حد localStorage
    // مراجع idb:// تُحفظ كما هي (حجمها صغير جداً)
    const cleanCriteria: Record<string, any> = {};
    for (const [key, val] of Object.entries(data.criteriaData)) {
      cleanCriteria[key] = {
        ...val,
        evidences: val.evidences.map(ev => {
          // إذا كان الملف محفوظ في IndexedDB، نحفظ المرجع فقط
          const isIdbRef = ev.fileData?.startsWith('idb://');
          return {
            ...ev,
            fileData: isIdbRef ? ev.fileData : (ev.fileData && ev.fileData.length < 100000 ? ev.fileData : null),
            _hadFile: !!ev.fileData,
          };
        }),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, criteriaData: cleanCriteria, timestamp: Date.now() }));
  } catch {
    // localStorage ممتلئ - حاول حذف البيانات القديمة
    try {
      localStorage.removeItem(STORAGE_AUTOSAVE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch { /* ignore */ }
  }
}

function loadStateFromStorage(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // تجاهل البيانات القديمة (أكثر من 24 ساعة)
    if (Date.now() - (data.timestamp || 0) > 86400000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearStorageState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_PENDING_UPLOAD);
  } catch { /* ignore */ }
}

export default function PerformanceEvidence() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const portfolio = usePortfolio(isAuthenticated);
  const { isOnline, isSyncing, pendingCount, saveOfflineData, getOfflineData } = useOfflineSync();
  const [step, setStep] = useState<"select" | "dashboard" | "criterion-detail" | "final-review" | "preview">("select");
  const [selectedJob, setSelectedJob] = useState<typeof JOB_TYPES[0] | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  // جلب القوالب من قاعدة البيانات
  const { data: dbTemplates } = trpc.templates.list.useQuery(undefined, { staleTime: 60000 });
  // تحويل قوالب DB إلى ThemeConfig مع إزالة التكرار
  const allThemes = useMemo(() => {
    const themes: ThemeConfig[] = [...BUILTIN_THEMES];
    if (dbTemplates && dbTemplates.length > 0) {
      const builtinNames = new Set(BUILTIN_THEMES.map(t => t.name));
      const dbMapped: ThemeConfig[] = dbTemplates
        .filter((t: any) => !builtinNames.has(t.name)) // إزالة التكرار بالاسم
        .map((t: any) => {
        const layout = t.templateLayout || {};
        const lt = layout.layoutType || (layout.headerStyle === 'full-width' ? 'dark-header-table' : 'white-header-classic');
        const isDark = lt.startsWith('dark-');
        return {
          id: `db-${t.id}`,
          name: t.name,
          layoutType: lt as LayoutType,
          headerBg: t.headerBg || (isDark ? (t.accent || '#1a3a5c') : '#ffffff'),
          headerText: t.headerText || (isDark ? '#fff' : '#1a3a5c'),
          accent: t.accent || '#1a3a5c',
          borderColor: t.accent || t.borderColor || '#1a3a5c',
          titleBg: t.accent || '#1a3a5c',
          fieldLabelBg: t.accent || '#1a3a5c',
          footerBg: t.accent || '#1a3a5c',
          tableStyle: (layout.fieldStyle === 'table'),
          titleStyle: (layout.titleStyle || 'rounded') as ThemeConfig['titleStyle'],
          showTopLine: isDark,
          showBottomBar: layout.footerStyle !== 'none',
          fieldStyle: (layout.fieldStyle || 'fieldset') as ThemeConfig['fieldStyle'],
          signatureStyle: (['dotted', 'solid', 'boxed', 'lined', 'stamped'].includes(layout.signatureStyle) ? layout.signatureStyle : 'dotted') as ThemeConfig['signatureStyle'],
          bodyBg: t.bodyBg || (lt === 'white-header-light' ? '#E0F7FA' : lt === 'white-header-sidebar' ? '#f8fafb' : undefined),
          sidebarBg: lt === 'white-header-sidebar' ? (t.accent || '#1a3a5c') : undefined,
          headerSeparator: lt === 'white-header-sidebar',
          coverStyle: (layout.coverStyle || 'gradient-center') as ThemeConfig['coverStyle'],
          sectionCoverStyle: (layout.sectionCoverStyle || 'full-gradient') as ThemeConfig['sectionCoverStyle'],
          coverAccent2: t.accent || layout.coverAccent2 || '#1a3a5c',
        };
      });
      themes.push(...dbMapped);
    }
    // إزالة أي تكرار إضافي بالاسم (الأولوية للأول)
    const seen = new Set<string>();
    return themes.filter(t => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });
  }, [dbTemplates]);
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);
  const [expandedSubEvidence, setExpandedSubEvidence] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("criteria");
  const [stateRestored, setStateRestored] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareExpiryDays, setShareExpiryDays] = useState(30);
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Preview scaling - responsive (للمعاينة المفردة)
  const { containerRef: previewContainerRef, pageRef: previewPageRef, previewScale, wrapperWidth, wrapperHeight, recalculate: recalcPreview, zoomLevel, zoomIn, zoomOut, resetZoom } = usePreviewScale();
  // Preview scaling - responsive (للمعاينة الكاملة)
  const { containerRef: fullPreviewContainerRef, previewScale: fullPreviewScale, wrapperWidth: fullWrapperWidth, recalculate: recalcFullPreview, zoomLevel: fullZoomLevel, zoomIn: fullZoomIn, zoomOut: fullZoomOut, resetZoom: fullResetZoom } = usePreviewScale();

  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // AI State
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiChat, setAiChat] = useState<Record<string, string[]>>({});
  const [aiPrompt, setAiPrompt] = useState("");

  // tRPC share mutation
  const shareMutation = trpc.share.create.useMutation();

  // tRPC file upload mutation - لرفع الملفات إلى S3 للحصول على رابط عام للباركود
  const uploadFileMutation = trpc.file.upload.useMutation();

  // tRPC AI mutations
  const suggestMutation = trpc.ai.suggest.useMutation();
  const fillFormMutation = trpc.ai.fillFormFields.useMutation();
  const improveMutation = trpc.ai.improveText.useMutation();
  const classifyMutation = trpc.ai.classifyEvidence.useMutation();

  // User themes (moved to top level to follow Rules of Hooks)
  const userThemesQuery = trpc.userThemes.list.useQuery(undefined, { staleTime: 60000, enabled: isAuthenticated });
  const createUserThemeMut = trpc.userThemes.create.useMutation();
  const deleteUserThemeMut = trpc.userThemes.delete.useMutation();
  const trpcUtils = trpc.useUtils();
  const [showSaveThemeDialog, setShowSaveThemeDialog] = useState(false);
  const [newThemeNameInput, setNewThemeNameInput] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<EvidencePriority | "all">("all");

  // Custom sections
  const [showAddSub, setShowAddSub] = useState<string | null>(null);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [showAddMainSection, setShowAddMainSection] = useState(false);
  const [newMainSectionTitle, setNewMainSectionTitle] = useState("");
  const [newMainSectionDesc, setNewMainSectionDesc] = useState("");
  const [customCriteria, setCustomCriteria] = useState<Criterion[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadRef = useRef<{ criterionId: string; subEvidenceId: string } | null>(null);
  const smartUploadRef = useRef<HTMLInputElement>(null);

  const [personalInfo, setPersonalInfo] = useState({
    name: "", school: "",
    department: "المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم بمنطقة",
    year: "", semester: "",
    evaluator: "", evaluatorRole: "مدير المدرسة", date: "",
    extraLogo: "",
    reportTitle: "شواهد الأداء الوظيفي",
  });

  const [criteriaData, setCriteriaData] = useState<Record<string, CriterionData>>({});

  const allCriteria = useMemo(() => [...(selectedJob?.criteria || []), ...customCriteria], [selectedJob, customCriteria]);

  const initCriteriaData = (criteria: Criterion[]) => {
    const data: Record<string, CriterionData> = {};
    criteria.forEach((c) => {
      data[c.id] = { score: 0, notes: "", evidences: [], customSubEvidences: [] };
    });
    setCriteriaData(data);
  };

  const handleSelectJob = (job: typeof JOB_TYPES[0]) => {
    setSelectedJob(job);
    setCustomCriteria([]);
    initCriteriaData(job.criteria);
    setStep("dashboard");
  };

  // ===== تنظيف ملفات IndexedDB القديمة =====
  useEffect(() => {
    cleanOldFiles().catch(() => {});
  }, []);

  // ===== استعادة الـ state من localStorage عند تحميل الصفحة (حل مشكلة الجوال + إغلاق المتصفح) =====
  useEffect(() => {
    if (stateRestored) return;
    const saved = loadStateFromStorage();
    if (saved && saved.jobId) {
      const job = JOB_TYPES.find(j => j.id === saved.jobId);
      if (job) {
        setSelectedJob(job);
        setStep((saved.step as any) || "dashboard");
        setCurrentCriterionIndex(saved.currentCriterionIndex || 0);
        setActiveTab(saved.activeTab || "criteria");
        setExpandedSubEvidence(saved.expandedSubEvidence || null);
        if (saved.personalInfo) setPersonalInfo(saved.personalInfo);
        if (saved.customCriteria) setCustomCriteria(saved.customCriteria);
        if (saved.themeId) {
          // محاولة استعادة القالب من allThemes (قوالب DB) أو الافتراضي
          const theme = allThemes.find(t => t.id === saved.themeId);
          if (theme) setSelectedTheme(theme);
          else if (saved.themeId === DEFAULT_THEME.id) setSelectedTheme(DEFAULT_THEME);
        }
        // استعادة criteriaData - دمج مع البيانات الافتراضية
        if (saved.criteriaData) {
          const allCrit = [...job.criteria, ...(saved.customCriteria || [])];
          const merged: Record<string, CriterionData> = {};
          allCrit.forEach(c => {
            merged[c.id] = saved.criteriaData[c.id] || { score: 0, notes: "", evidences: [], customSubEvidences: [] };
          });
          setCriteriaData(merged);
        } else {
          initCriteriaData(job.criteria);
        }
        // إظهار رسالة استعادة
        const wasPendingUpload = localStorage.getItem(STORAGE_PENDING_UPLOAD);
        if (wasPendingUpload) {
          toast.info("تم استعادة بياناتك بعد العودة", {
            description: "يرجى رفع الشاهد مرة أخرى - المتصفح أعاد تحميل الصفحة",
            duration: 6000,
          });
          localStorage.removeItem(STORAGE_PENDING_UPLOAD);
        } else {
          toast.success("تم استعادة بياناتك السابقة تلقائياً", { duration: 3000 });
        }
      }
    }
    setStateRestored(true);
  }, [stateRestored]);

  // ===== حفظ الـ state تلقائياً عند كل تغيير (مع تأجيل أثناء الرفع) =====
  useEffect(() => {
    if (!selectedJob || step === "select") return;
    // لا نحفظ أثناء عملية الرفع لتجنب crash من حجم base64 الكبير
    if (isUploadingRef.current) return;
    // تأخير الحفظ لتجنب الحفظ المتكرر السريع
    const timer = setTimeout(() => {
      if (!isUploadingRef.current) {
        saveStateToStorage({
          step, jobId: selectedJob.id, themeId: selectedTheme.id,
          criteriaData, personalInfo, customCriteria,
          currentCriterionIndex, activeTab, expandedSubEvidence,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [step, selectedJob, selectedTheme, criteriaData, personalInfo, customCriteria, currentCriterionIndex, activeTab, expandedSubEvidence]);

  // ===== حفظ تلقائي عند إغلاق المتصفح أو الانتقال =====
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!selectedJob || step === "select") return;
      try {
        saveStateToStorage({
          step, jobId: selectedJob.id, themeId: selectedTheme.id,
          criteriaData, personalInfo, customCriteria,
          currentCriterionIndex, activeTab, expandedSubEvidence,
        });
      } catch { /* ignore - localStorage might be full */ }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // حفظ عند visibilitychange (عندما ينتقل المستخدم لتطبيق آخر على الجوال)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && selectedJob && step !== "select") {
        try {
          saveStateToStorage({
            step, jobId: selectedJob.id, themeId: selectedTheme.id,
            criteriaData, personalInfo, customCriteria,
            currentCriterionIndex, activeTab, expandedSubEvidence,
          });
        } catch { /* ignore */ }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedJob, step, selectedTheme, criteriaData, personalInfo, customCriteria, currentCriterionIndex, activeTab, expandedSubEvidence]);

  // ===== حسابات تحليل الفجوات =====
  const gapAnalysis = useMemo(() => {
    let totalEvidences = 0;
    let coveredCriteria = 0;
    let partialCriteria = 0;
    let missedCriteria = 0;

    allCriteria.forEach((c) => {
      const data = criteriaData[c.id];
      if (!data) { missedCriteria++; return; }
      const evCount = data.evidences.length;
      totalEvidences += evCount;
      if (data.score >= 4 && evCount > 0) coveredCriteria++;
      else if (evCount > 0 || data.score > 0) partialCriteria++;
      else missedCriteria++;
    });

    const percentage = allCriteria.length > 0
      ? Math.round(((coveredCriteria + partialCriteria * 0.5) / allCriteria.length) * 100)
      : 0;

    return { totalEvidences, coveredCriteria, partialCriteria, missedCriteria, percentage };
  }, [allCriteria, criteriaData]);

  // ===== عدد المؤشرات المغطاة (للمعلم) =====
  const indicatorsCoverage = useMemo(() => {
    if (!selectedJob?.hasStandards) return null;
    const jobStds = selectedJob.id === "teacher" ? STANDARDS : getStandardsForJob(selectedJob.id);
    let totalIndicators = 0;
    let coveredIndicators = 0;
    jobStds.forEach(std => {
      std.items.forEach(item => {
        totalIndicators++;
        const data = criteriaData[std.id];
        if (data && data.evidences.some(e => e.subEvidenceId === item.id)) {
          coveredIndicators++;
        }
        // حساب البنود الفرعية أيضاً
        (item.subItems || []).forEach(sub => {
          totalIndicators++;
          if (data && data.evidences.some(e => e.subEvidenceId === sub.id)) {
            coveredIndicators++;
          }
        });
      });
    });
    return { total: totalIndicators, covered: coveredIndicators, percentage: totalIndicators > 0 ? Math.round((coveredIndicators / totalIndicators) * 100) : 0 };
  }, [selectedJob, criteriaData]);

  const updateScore = (criterionId: string, score: number) => {
    setCriteriaData((prev) => ({ ...prev, [criterionId]: { ...prev[criterionId], score } }));
  };

  const addEvidence = (criterionId: string, subEvidenceId: string, type: EvidenceType = "text") => {
    const ev = createEmptyEvidence(subEvidenceId);
    ev.type = type;
    setCriteriaData((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], evidences: [...prev[criterionId].evidences, ev] },
    }));
  };

  const removeEvidence = (criterionId: string, evidenceId: string) => {
    setCriteriaData((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], evidences: prev[criterionId].evidences.filter((e) => e.id !== evidenceId) },
    }));
  };

  const updateEvidence = (criterionId: string, evidenceId: string, updates: Partial<EvidenceItem>) => {
    setCriteriaData((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], evidences: prev[criterionId].evidences.map((e) => (e.id === evidenceId ? { ...e, ...updates } : e)) },
    }));
  };

  const updateFormField = (criterionId: string, evidenceId: string, fieldId: string, value: string) => {
    setCriteriaData((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        evidences: prev[criterionId].evidences.map((e) =>
          e.id === evidenceId ? { ...e, formData: { ...e.formData, [fieldId]: value } } : e
        ),
      },
    }));
  };

  const addCustomSubEvidence = (criterionId: string) => {
    if (!newSubTitle.trim()) return;
    const newSub: SubEvidence = {
      id: `custom_${Date.now()}`, title: newSubTitle.trim(),
      description: "قسم فرعي مخصص", type: "both", isCustom: true,
      formFields: [
        { id: "report_title", label: "الموضوع", type: "text", placeholder: "أدخل موضوع الشاهد..." },
        { id: "content", label: "المحتوى", type: "textarea", placeholder: "أدخل المحتوى..." },
      ],
    };
    setCriteriaData((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], customSubEvidences: [...prev[criterionId].customSubEvidences, newSub] },
    }));
    setNewSubTitle("");
    setShowAddSub(null);
  };

  const addCustomMainSection = () => {
    if (!newMainSectionTitle.trim()) return;
    const newCriterion: Criterion = {
      id: `custom_main_${Date.now()}`, title: newMainSectionTitle.trim(), maxScore: 5,
      description: newMainSectionDesc.trim() || "قسم رئيسي مخصص",
      subEvidences: [{ id: `custom_main_${Date.now()}_sub1`, title: "شاهد عام", description: "شاهد عام", type: "both", formFields: [
        { id: "report_title", label: "الموضوع", type: "text", placeholder: "أدخل موضوع الشاهد..." },
        { id: "content", label: "المحتوى", type: "textarea", placeholder: "أدخل التفاصيل..." },
      ] }],
    };
    setCustomCriteria(prev => [...prev, newCriterion]);
    setCriteriaData(prev => ({ ...prev, [newCriterion.id]: { score: 0, notes: "", evidences: [], customSubEvidences: [] } }));
    setNewMainSectionTitle("");
    setNewMainSectionDesc("");
    setShowAddMainSection(false);
  };

  // ===== سحب وإفلات الشواهد بين البنود =====
  const [draggedEvidence, setDraggedEvidence] = useState<{ evidence: EvidenceItem; fromCriterionId: string; fromSubId: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ criterionId: string; subId: string } | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState<{ evidence: EvidenceItem; fromCriterionId: string } | null>(null);
  const [showCoverageReport, setShowCoverageReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // ===== معاينة شاهد فردي =====
  const [previewSubId, setPreviewSubId] = useState<string | null>(null);
  const [previewCriterionId, setPreviewCriterionId] = useState<string | null>(null);

  // ===== dialog إضافة صف ديناميكي =====
  const [addRowDialog, setAddRowDialog] = useState<{ criterionId: string; subId: string; formEvId: string } | null>(null);
  const [newRowLabel, setNewRowLabel] = useState('');

  const confirmAddDynamicRow = () => {
    if (!addRowDialog || !newRowLabel.trim()) return;
    const { criterionId, formEvId } = addRowDialog;
    const fieldId = `dynamic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    updateFormField(criterionId, formEvId, fieldId, '');
    updateFormField(criterionId, formEvId, `__label_${fieldId}`, newRowLabel.trim());
    toast.success(`تم إضافة حقل: ${newRowLabel.trim()}`);
    setNewRowLabel('');
    setAddRowDialog(null);
  };

  const addDynamicRow = (criterionId: string, subId: string, formEvId: string) => {
    setAddRowDialog({ criterionId, subId, formEvId });
    setNewRowLabel('');
  };

  const removeDynamicRow = (criterionId: string, formEvId: string, fieldId: string) => {
    setCriteriaData(prev => {
      const existing = prev[criterionId];
      if (!existing) return prev;
      return {
        ...prev,
        [criterionId]: {
          ...existing,
          evidences: existing.evidences.map(e => {
            if (e.id !== formEvId || !e.formData) return e;
            const newFormData = { ...e.formData };
            delete newFormData[fieldId];
            delete newFormData[`__label_${fieldId}`];
            return { ...e, formData: newFormData };
          }),
        },
      };
    });
    toast.success('تم حذف الحقل');
  };

  // ===== تصدير شاهد فردي =====
  const exportSingleEvidence = async (criterionId: string, subId: string) => {
    // فتح المعاينة أولاً
    setPreviewCriterionId(criterionId);
    setPreviewSubId(subId);
    toast.loading('جاري تجهيز التقرير...', { id: 'pdf-export' });
    // انتظار render ثم تصدير - وقت أطول لضمان تحميل الخطوط والصور
    setTimeout(async () => {
      const el = document.getElementById(`single-preview-${subId}`);
      if (el) {
        try {
          await exportToPDF(`single-preview-${subId}`, `تقرير_${subId}.pdf`);
          toast.success('تم تصدير التقرير بنجاح', { id: 'pdf-export' });
        } catch (err) {
          console.error('PDF export error:', err);
          toast.error('فشل التصدير - حاول مرة أخرى', { id: 'pdf-export' });
        }
      } else {
        toast.error('لم يتم العثور على المعاينة', { id: 'pdf-export' });
      }
    }, 1000);
  };

  const openSinglePreview = (criterionId: string, subId: string) => {
    setPreviewCriterionId(criterionId);
    setPreviewSubId(subId);
  };

  // التقاط صورة المعاينة عند فتحها أو تغيير الثيم
  useEffect(() => {
    if (previewSubId && previewCriterionId) {
      // تأخير لضمان render المحتوى المخفي
      const timer = setTimeout(() => recalcPreview(), 800);
      return () => clearTimeout(timer);
    }
  }, [previewSubId, previewCriterionId, selectedTheme.id]);

  const handleDragStart = useCallback((ev: EvidenceItem, criterionId: string, subId: string) => {
    setDraggedEvidence({ evidence: ev, fromCriterionId: criterionId, fromSubId: subId });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, criterionId: string, subId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ criterionId, subId });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toCriterionId: string, toSubId: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedEvidence) return;
    const { evidence, fromCriterionId } = draggedEvidence;
    if (fromCriterionId === toCriterionId && evidence.subEvidenceId === toSubId) {
      setDraggedEvidence(null);
      return;
    }
    // نقل الشاهد: حذف من المصدر وإضافة للهدف
    const movedEvidence = { ...evidence, subEvidenceId: toSubId };
    setCriteriaData(prev => {
      const updated = { ...prev };
      // حذف من المصدر
      updated[fromCriterionId] = {
        ...updated[fromCriterionId],
        evidences: updated[fromCriterionId].evidences.filter(e => e.id !== evidence.id),
      };
      // إضافة للهدف
      updated[toCriterionId] = {
        ...updated[toCriterionId],
        evidences: [...updated[toCriterionId].evidences, movedEvidence],
      };
      return updated;
    });
    const toCrit = allCriteria.find(c => c.id === toCriterionId);
    toast.success("تم نقل الشاهد بنجاح", {
      description: `تم النقل إلى: ${toCrit?.title || 'بند آخر'}`,
      duration: 3000,
    });
    setDraggedEvidence(null);
  }, [draggedEvidence, allCriteria]);

  const handleDragEnd = useCallback(() => {
    setDraggedEvidence(null);
    setDragOverTarget(null);
  }, []);

  const moveEvidenceToCriterion = useCallback((evidence: EvidenceItem, fromCriterionId: string, toCriterionId: string, toSubId: string) => {
    if (fromCriterionId === toCriterionId && evidence.subEvidenceId === toSubId) return;
    const movedEvidence = { ...evidence, subEvidenceId: toSubId };
    setCriteriaData(prev => {
      const updated = { ...prev };
      updated[fromCriterionId] = {
        ...updated[fromCriterionId],
        evidences: updated[fromCriterionId].evidences.filter(e => e.id !== evidence.id),
      };
      updated[toCriterionId] = {
        ...updated[toCriterionId],
        evidences: [...updated[toCriterionId].evidences, movedEvidence],
      };
      return updated;
    });
    const toCrit = allCriteria.find(c => c.id === toCriterionId);
    const toSubName = toCrit ? [...toCrit.subEvidences, ...(criteriaData[toCrit.id]?.customSubEvidences || [])].find(s => s.id === toSubId)?.title : '';
    toast.success("تم نقل الشاهد بنجاح", {
      description: `\ud83d\udccd المسار الجديد: ${toCrit?.title || 'بند آخر'}${toSubName ? ` \u2190 ${toSubName}` : ''}`,
      duration: 4000,
    });
    
    // تحديث سجل التعلم بالنقل اليدوي (يعزز دقة التصنيفات المستقبلية)
    try {
      const logKey = `sers_learning_log_${selectedJob?.id || 'default'}`;
      const existingLog = JSON.parse(localStorage.getItem(logKey) || '[]');
      const newEntry = {
        fileName: evidence.fileName || evidence.text || 'manual-move',
        criterionId: toCriterionId,
        criterionTitle: toCrit?.title || '',
        subEvidenceId: toSubId,
        subEvidenceTitle: toSubName || '',
        timestamp: Date.now(),
        isManualCorrection: true,
      };
      const updatedLog = [...existingLog, newEntry].slice(-50);
      localStorage.setItem(logKey, JSON.stringify(updatedLog));
    } catch {}
    
    setShowMoveDialog(null);
  }, [allCriteria, criteriaData, selectedJob]);

  // ===== رفع ذكي مع تصنيف AI تلقائي =====
  const [isSmartUploading, setIsSmartUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ stage: string; percent: number; framePreview?: string } | null>(null);
  const isUploadingRef = useRef(false); // flag لمنع حفظ localStorage أثناء الرفع

  // ===== ضغط الصورة قبل إرسالها للـ AI =====
  const compressImage = useCallback((base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64); // fallback to original
      img.src = base64;
    });
  }, []);

  // ===== ضغط الصورة للحفظ في state (جودة متوسطة لتقليل استهلاك الذاكرة) =====
  const compressImageForStorage = useCallback((base64: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(base64); // fallback to original
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }, []);

  // ===== دالة مساعدة لإضافة شاهد لبند معين =====
  const addEvidenceToCriterion = useCallback((criterionId: string, newEv: EvidenceItem) => {
    setCriteriaData((prev) => {
      const existing = prev[criterionId];
      if (!existing) return prev;
      return {
        ...prev,
        [criterionId]: { ...existing, evidences: [...existing.evidences, newEv] },
      };
    });
  }, []);

  // ===== استخراج إطار من الفيديو للتصنيف الذكي =====
  const extractVideoFrame = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(file);
        video.src = url;
        
        const cleanup = () => { URL.revokeObjectURL(url); video.remove(); };
        
        video.onloadeddata = () => {
          // الانتقال للثانية 1 أو ربع المدة (أيهما أقل)
          video.currentTime = Math.min(1, video.duration * 0.25);
        };
        
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            // حجم مناسب للتصنيف (800px عرض كحد أقصى)
            const maxW = 800;
            const scale = Math.min(maxW / video.videoWidth, 1);
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
              cleanup();
              resolve(dataUrl);
            } else {
              cleanup();
              resolve(null);
            }
          } catch {
            cleanup();
            resolve(null);
          }
        };
        
        video.onerror = () => { cleanup(); resolve(null); };
        // timeout بعد 10 ثواني
        setTimeout(() => { cleanup(); resolve(null); }, 10000);
      } catch {
        resolve(null);
      }
    });
  }, []);

  // ===== معالجة ملف واحد للتصنيف الذكي =====
  // ===== ضغط الفيديو قبل الرفع =====
  const compressVideoForStorage = useCallback(async (file: File): Promise<{ blob: Blob; base64: string }> => {
    // إذا كان الفيديو أقل من 5MB لا حاجة للضغط
    if (file.size <= 5 * 1024 * 1024) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ blob: file, base64: reader.result as string });
        reader.readAsDataURL(file);
      });
    }
    
    // للفيديوهات الكبيرة: نستخدم canvas + MediaRecorder للضغط
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(file);
        video.src = url;
        
        video.onloadedmetadata = async () => {
          // تقليل الدقة إذا كانت عالية
          const maxDim = 720;
          const scale = Math.min(maxDim / Math.max(video.videoWidth, video.videoHeight), 1);
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          const ctx = canvas.getContext('2d');
          
          if (!ctx || !('MediaRecorder' in window)) {
            // fallback: إرجاع الفيديو الأصلي
            URL.revokeObjectURL(url);
            const reader = new FileReader();
            reader.onload = () => resolve({ blob: file, base64: reader.result as string });
            reader.readAsDataURL(file);
            return;
          }
          
          const stream = canvas.captureStream(15); // 15fps
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 500000 });
          const chunks: Blob[] = [];
          
          recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
          recorder.onstop = () => {
            URL.revokeObjectURL(url);
            const blob = new Blob(chunks, { type: 'video/webm' });
            const reader = new FileReader();
            reader.onload = () => resolve({ blob, base64: reader.result as string });
            reader.readAsDataURL(blob);
          };
          
          recorder.start();
          video.currentTime = 0;
          video.play();
          
          const drawFrame = () => {
            if (video.ended || video.paused) {
              recorder.stop();
              return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          };
          
          video.onplay = drawFrame;
          
          // حد أقصى 30 ثانية للضغط
          setTimeout(() => {
            if (recorder.state === 'recording') {
              video.pause();
              recorder.stop();
            }
          }, Math.min(video.duration * 1000, 30000));
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
          const reader = new FileReader();
          reader.onload = () => resolve({ blob: file, base64: reader.result as string });
          reader.readAsDataURL(file);
        };
      } catch {
        const reader = new FileReader();
        reader.onload = () => resolve({ blob: file, base64: reader.result as string });
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const processSmartFile = useCallback(async (file: File, fileIndex: number, totalFiles: number): Promise<{ success: boolean; criterion?: string; indicator?: string }> => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const batchPrefix = totalFiles > 1 ? `[ملف ${fileIndex + 1}/${totalFiles}] ` : "";

    // === مرحلة 1: قراءة الملف ===
    setUploadProgress({ stage: `${batchPrefix}جاري قراءة الملف...`, percent: Math.round(5 + (80 * fileIndex / totalFiles)) });

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawBase64 = reader.result as string;
          let storageBase64 = rawBase64;
          let aiImageUrl: string | undefined;
          
          if (isImage) {
            // === مرحلة 2: ضغط الصورة ===
            setUploadProgress({ stage: `${batchPrefix}جاري ضغط الصورة...`, percent: Math.round(15 + (80 * fileIndex / totalFiles)) });
            storageBase64 = await compressImageForStorage(rawBase64, 1200, 0.7);
            aiImageUrl = await compressImage(rawBase64, 800, 0.5);
          } else if (isVideo) {
            // === مرحلة 2: استخراج إطار + ضغط الفيديو ===
            setUploadProgress({ stage: `${batchPrefix}جاري استخراج إطار من الفيديو...`, percent: Math.round(15 + (80 * fileIndex / totalFiles)) });
            const videoFrame = await extractVideoFrame(file);
            if (videoFrame) {
              aiImageUrl = videoFrame;
              // عرض معاينة الإطار المستخرج
              setUploadProgress({ stage: `${batchPrefix}تم استخراج الإطار - جاري الضغط...`, percent: Math.round(25 + (80 * fileIndex / totalFiles)), framePreview: videoFrame });
            }
            
            // ضغط الفيديو إذا كان كبيراً
            if (file.size > 5 * 1024 * 1024) {
              setUploadProgress({ stage: `${batchPrefix}جاري ضغط الفيديو (${(file.size / 1024 / 1024).toFixed(1)}MB)...`, percent: Math.round(30 + (80 * fileIndex / totalFiles)), framePreview: videoFrame || undefined });
              try {
                const compressed = await compressVideoForStorage(file);
                storageBase64 = compressed.base64;
                setUploadProgress({ stage: `${batchPrefix}تم ضغط الفيديو بنجاح`, percent: Math.round(40 + (80 * fileIndex / totalFiles)), framePreview: videoFrame || undefined });
              } catch {
                // فشل الضغط - نستخدم الأصلي
                console.warn('Video compression failed, using original');
              }
            }
          }

          let targetCriterionId: string | null = null;
          let targetSubId: string = "";
          let contentDesc: string = file.name;
          let classificationSuccess = false;
          let criterionTitle = "";
          let indicatorText = "";
          
          // === مرحلة 3: التصنيف الذكي ===
          setUploadProgress(prev => ({ stage: `${batchPrefix}جاري التصنيف الذكي...`, percent: Math.round(45 + (80 * fileIndex / totalFiles)), framePreview: prev?.framePreview }));
          
          try {
            // بناء قائمة البنود الفعلية + المخصصة للوظيفة الحالية
            const criteriaListForAI = allCriteria.map(c => ({
              id: c.id,
              title: c.title,
              subEvidences: [
                ...c.subEvidences.map(s => ({ id: s.id, title: s.title, isCustom: !!s.isCustom })),
                ...(criteriaData[c.id]?.customSubEvidences || []).map(s => ({ id: s.id, title: s.title, isCustom: true })),
              ],
            }));
            
            // جلب سجل التعلم من localStorage (آخر 10 تصنيفات ناجحة)
            let learningContext: { fileName: string; criterionId: string; criterionTitle: string; subEvidenceId: string; subEvidenceTitle: string }[] = [];
            try {
              const stored = localStorage.getItem(`sers_learning_log_${selectedJob?.id || 'default'}`);
              if (stored) {
                const parsed = JSON.parse(stored);
                learningContext = Array.isArray(parsed) ? parsed.slice(-10) : [];
              }
            } catch {}
            
            const result = await classifyMutation.mutateAsync({
              fileName: file.name,
              fileType: file.type,
              description: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
              fileUrl: aiImageUrl,
              jobId: selectedJob?.id,
              jobTitle: selectedJob?.title,
              criteriaList: criteriaListForAI,
              learningContext,
            });

            if (result.success && result.classification) {
              const cls = result.classification;
              
              // دالة مساعدة لتنظيف النص العربي للمقارنة
              const normalize = (t: string) => t.replace(/[\u0640\u064B-\u065F]/g, '').replace(/[إأآا]/g, 'ا').replace(/[ىئ]/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
              
              // === تحسين البحث عن المعيار: بحث متعدد المستويات ===
              let targetCriterion = allCriteria.find(c => c.id === cls.standardId);
              if (!targetCriterion) {
                // بحث بالاسم مع normalize
                const normalizedStdName = normalize(cls.standardName);
                targetCriterion = allCriteria.find(c => {
                  const normTitle = normalize(c.title);
                  return normTitle === normalizedStdName || normTitle.includes(normalizedStdName) || normalizedStdName.includes(normTitle);
                });
              }
              if (!targetCriterion && cls.standardNumber > 0 && cls.standardNumber <= allCriteria.length) {
                // بحث بالرقم كـ fallback
                targetCriterion = allCriteria[cls.standardNumber - 1];
              }
              
              if (targetCriterion && criteriaData[targetCriterion.id]) {
                const subs = [...targetCriterion.subEvidences, ...(criteriaData[targetCriterion.id]?.customSubEvidences || [])];
                
                // === خوارزمية توجيه ذكية متعددة المستويات ===
                let targetSub = subs[0]; // fallback أولي
                let matched = false;
                
                // تحقق: هل البند الفرعي "غير محدد" أو فارغ أو عام؟
                const isSubUndetermined = !cls.subIndicatorText || 
                  cls.subIndicatorText.length <= 3 || 
                  normalize(cls.subIndicatorText).includes('غير محدد') ||
                  normalize(cls.subIndicatorText).includes('غير معروف') ||
                  normalize(cls.subIndicatorText).includes('عام') ||
                  cls.subIndicatorIndex === 0;
                
                // === المستوى 1: مطابقة دقيقة بنص البند الفرعي (فقط إذا كان محدداً) ===
                if (!isSubUndetermined && cls.subIndicatorText && cls.subIndicatorText.length > 3) {
                  const normalizedSub = normalize(cls.subIndicatorText);
                  // أولاً: تطابق تام
                  let exactMatch = subs.find(s => normalize(s.title) === normalizedSub);
                  if (exactMatch) { targetSub = exactMatch; matched = true; }
                  // ثانياً: احتواء
                  if (!matched) {
                    const containMatch = subs.find(s => normalize(s.title).includes(normalizedSub) || normalizedSub.includes(normalize(s.title)));
                    if (containMatch) { targetSub = containMatch; matched = true; }
                  }
                }
                
                // === المستوى 2: مطابقة بنص البند الرئيسي ===
                if (!matched && cls.indicatorText && cls.indicatorText.length > 3) {
                  const normalizedInd = normalize(cls.indicatorText);
                  // تجاهل نصوص "غير محدد" في البند الرئيسي أيضاً
                  if (!normalizedInd.includes('غير محدد') && !normalizedInd.includes('غير معروف')) {
                    const exactMatch = subs.find(s => normalize(s.title) === normalizedInd);
                    if (exactMatch) { targetSub = exactMatch; matched = true; }
                    if (!matched) {
                      const containMatch = subs.find(s => normalize(s.title).includes(normalizedInd) || normalizedInd.includes(normalize(s.title)));
                      if (containMatch) { targetSub = containMatch; matched = true; }
                    }
                  }
                }
                
                // === المستوى 3: مطابقة بالفهرس الهيكلي ===
                if (!matched && cls.indicatorIndex > 0) {
                  const stdPrefix = targetCriterion.id;
                  const targetItemId = `${stdPrefix}-item-${cls.indicatorIndex}`;
                  
                  if (cls.subIndicatorIndex > 0) {
                    // البحث عن البند الفرعي المحدد
                    const subItemId = `${stdPrefix}-${cls.indicatorIndex}-${cls.subIndicatorIndex}`;
                    const subMatch = subs.find(s => s.id === subItemId);
                    if (subMatch) { targetSub = subMatch; matched = true; }
                  }
                  
                  if (!matched) {
                    // البحث عن البند الرئيسي بالـ ID
                    const itemMatch = subs.find(s => s.id === targetItemId);
                    if (itemMatch) { targetSub = itemMatch; matched = true; }
                  }
                  
                  if (!matched) {
                    // fallback: البحث بالفهرس في القائمة المسطحة
                    const mainItems = targetCriterion.subEvidences.filter(s => !s.isSubItem);
                    const idx = Math.min(cls.indicatorIndex - 1, mainItems.length - 1);
                    if (idx >= 0 && idx < mainItems.length) {
                      targetSub = mainItems[idx];
                      matched = true;
                    }
                  }
                }
                
                // === المستوى 4: مطابقة ذكية بالكلمات المفتاحية (Fuzzy Scoring) ===
                if (!matched && (cls.indicatorText || cls.subIndicatorText || cls.contentDescription)) {
                  const textsToSearch = [cls.subIndicatorText, cls.indicatorText, cls.contentDescription, file.name].filter(Boolean);
                  const searchTexts = textsToSearch.map(t => normalize(t!)).filter(t => !t.includes('غير محدد') && !t.includes('غير معروف'));
                  const allWords = searchTexts.flatMap(t => t.split(/\s+/).filter((w: string) => w.length > 2));
                  const stopWords = new Set(['من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'بين', 'عند', 'حول', 'غير', 'محدد']);
                  const keywords = allWords.filter(w => !stopWords.has(w));
                  
                  if (keywords.length > 0) {
                    let bestMatch = subs[0];
                    let bestScore = 0;
                    for (const sub of subs) {
                      const subNorm = normalize(sub.title);
                      const descNorm = sub.description ? normalize(sub.description) : '';
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
                
                // === المستوى 5: إذا لم يتم التطابق، إدراج تحت البند الرئيسي الأقرب ===
                if (!matched && cls.indicatorIndex > 0) {
                  const mainItems = subs.filter(s => !s.isSubItem);
                  const idx = Math.min(cls.indicatorIndex - 1, mainItems.length - 1);
                  if (idx >= 0) {
                    targetSub = mainItems[idx];
                    matched = true; // اعتبره matched لأننا وجدنا البند الرئيسي
                  }
                }
                
                // === المستوى 6 (جديد): Fallback نهائي - أول بند رئيسي في المعيار ===
                if (!matched) {
                  const mainItems = subs.filter(s => !s.isSubItem);
                  if (mainItems.length > 0) {
                    targetSub = mainItems[0];
                  } else if (subs.length > 0) {
                    targetSub = subs[0];
                  }
                }
                
                targetCriterionId = targetCriterion.id;
                targetSubId = targetSub?.id || subs[0]?.id || "";
                contentDesc = cls.contentDescription || file.name;
                classificationSuccess = true;
                criterionTitle = targetCriterion.title;
                
                // بناء نص المؤشر للعرض
                const matchedSubTitle = targetSub?.title || '';
                indicatorText = cls.indicatorText || '';
                if (matchedSubTitle && matchedSubTitle !== indicatorText) {
                  indicatorText += ` → ${matchedSubTitle}`;
                }
                
                // === حفظ في سجل التعلم (Learning Log) ===
                try {
                  const logKey = `sers_learning_log_${selectedJob?.id || 'default'}`;
                  const existingLog = JSON.parse(localStorage.getItem(logKey) || '[]');
                  const newEntry = {
                    fileName: file.name,
                    criterionId: targetCriterion.id,
                    criterionTitle: targetCriterion.title,
                    subEvidenceId: targetSub?.id || '',
                    subEvidenceTitle: matchedSubTitle,
                    timestamp: Date.now(),
                  };
                  // احتفظ بآخر 50 تصنيف فقط
                  const updatedLog = [...existingLog, newEntry].slice(-50);
                  localStorage.setItem(logKey, JSON.stringify(updatedLog));
                } catch {
                  // تجاهل أخطاء localStorage
                }
              }
            }
          } catch (aiErr) {
            console.error("AI classification error:", aiErr);
          }
          
          if (!classificationSuccess) {
            const firstCriterion = allCriteria[0];
            if (firstCriterion) {
              targetCriterionId = firstCriterion.id;
              targetSubId = firstCriterion.subEvidences[0]?.id || "";
              criterionTitle = firstCriterion.title;
            }
          }
          
          // === مرحلة 4: إضافة الشاهد ===
          setUploadProgress(prev => ({ stage: `${batchPrefix}جاري حفظ الشاهد...`, percent: Math.round(75 + (80 * fileIndex / totalFiles)), framePreview: prev?.framePreview }));
          
          if (targetCriterionId) {
            const evId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const newEv = createEmptyEvidence(targetSubId);
            newEv.id = evId;
            newEv.type = isImage ? "image" : isVideo ? "video" : "file";
            newEv.fileName = file.name;
            newEv.text = contentDesc;
            newEv.displayAs = isImage ? "image" : "qr";
            
            try {
              await saveFileToIDB({
                id: evId,
                data: storageBase64,
                fileName: file.name,
                fileType: file.type,
                timestamp: Date.now(),
              });
              if (isImage && storageBase64.length < 200000) {
                newEv.fileData = storageBase64;
              } else {
                newEv.fileData = `idb://${evId}`;
              }
            } catch {
              newEv.fileData = storageBase64;
            }
            
            // رفع الملف إلى S3 للحصول على رابط عام للباركود
            try {
              const base64Only = storageBase64.split(',')[1] || storageBase64;
              const uploadResult = await uploadFileMutation.mutateAsync({
                fileName: file.name,
                mimeType: file.type,
                base64Data: base64Only,
              });
              if (uploadResult.url) {
                newEv.uploadedUrl = uploadResult.url;
              }
            } catch (uploadErr) {
              console.warn("S3 upload failed, QR will use filename:", uploadErr);
            }
            
            addEvidenceToCriterion(targetCriterionId, newEv);
            resolve({ success: classificationSuccess, criterion: criterionTitle, indicator: indicatorText });
          } else {
            resolve({ success: false });
          }
        } catch (err) {
          console.error("Smart upload error:", err);
          resolve({ success: false });
        }
      };
      reader.onerror = () => resolve({ success: false });
      reader.readAsDataURL(file);
    });
  }, [allCriteria, criteriaData, classifyMutation, compressImage, compressImageForStorage, addEvidenceToCriterion, uploadFileMutation, extractVideoFrame, compressVideoForStorage, selectedJob]);

  const handleSmartUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    // مسح قيمة input فوراً
    const fileList = Array.from(files);
    e.target.value = "";
    
    // التحقق من حجم الملفات
    const oversized = fileList.filter(f => f.size > 16 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} ملف تجاوز الحد الأقصى (16MB)`, { description: oversized.map(f => f.name).join(', ') });
    }
    const validFiles = fileList.filter(f => f.size <= 16 * 1024 * 1024);
    if (validFiles.length === 0) return;
    
    // تفعيل flag منع الحفظ أثناء الرفع
    isUploadingRef.current = true;
    setIsSmartUploading(true);
    
    // إزالة pending upload flag
    try { localStorage.removeItem(STORAGE_PENDING_UPLOAD); } catch {}
    
    const totalFiles = validFiles.length;
    const results: { success: boolean; criterion?: string; indicator?: string; fileName: string }[] = [];
    
    for (let i = 0; i < totalFiles; i++) {
      const currentFile = validFiles[i];
      setUploadProgress({
        stage: totalFiles > 1 
          ? `جاري معالجة الملف ${i + 1} من ${totalFiles}: ${currentFile.name}`
          : `جاري معالجة: ${currentFile.name}`,
        percent: Math.round(10 + (80 * i / totalFiles)),
      });
      
      const result = await processSmartFile(currentFile, i, totalFiles);
      results.push({ ...result, fileName: currentFile.name });
    }
    
    // عرض ملخص النتائج
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (totalFiles === 1) {
      const r = results[0];
      if (r.success) {
        // إشعار مرئي محسّن يعرض مسار التصنيف الكامل
        const pathParts = [r.criterion, r.indicator].filter(Boolean);
        const classificationPath = pathParts.join(' \u2190 ');
        toast.success(`\u2728 تم التصنيف الذكي بنجاح`, {
          description: `\ud83d\udcc1 ${r.fileName}\n\ud83d\udccd المسار: ${classificationPath}\n\u270f\ufe0f يمكنك تعديل التصنيف من زر النقل بجانب الشاهد`,
          duration: 8000,
        });
      } else {
        toast.warning("لم يتمكن النظام من تصنيف الشاهد تلقائياً", {
          description: `\ud83d\udcc1 ${r.fileName}\nتم إضافته للبند الأول. يمكنك نقله يدوياً باستخدام زر النقل.`,
          duration: 6000,
        });
      }
    } else {
      // ملخص الدفعة مع مسارات التصنيف
      const summaryLines = results.map(r => {
        if (r.success) {
          const pathParts = [r.criterion, r.indicator].filter(Boolean);
          return `\u2705 ${r.fileName}\n   \u2192 ${pathParts.join(' \u2190 ')}`;
        }
        return `\u26a0\ufe0f ${r.fileName} \u2192 البند الأول (لم يُصنّف)`;
      }).join('\n');
      
      if (successCount === totalFiles) {
        toast.success(`\u2728 تم تصنيف ${totalFiles} شواهد بنجاح!`, {
          description: `${summaryLines}\n\n\u270f\ufe0f يمكنك تعديل التصنيف من زر النقل`,
          duration: 10000,
        });
      } else if (successCount > 0) {
        toast.info(`تم تصنيف ${successCount} من ${totalFiles} شواهد`, {
          description: `${summaryLines}\n\n\u270f\ufe0f يمكنك تعديل التصنيف من زر النقل`,
          duration: 10000,
        });
      } else {
        toast.warning(`تم إضافة ${totalFiles} شواهد للبند الأول`, {
          description: "لم يتمكن النظام من تصنيفها تلقائياً. يمكنك نقلها يدوياً باستخدام زر النقل.",
          duration: 6000,
        });
      }
    }
    
    setUploadProgress({ stage: "اكتمل!", percent: 100 });
    setTimeout(() => {
      setUploadProgress(null);
      setIsSmartUploading(false);
      isUploadingRef.current = false;
    }, 1000);
  }, [processSmartFile]);

  // ===== رفع ملف عادي (بدون تصنيف ذكي) - يدعم رفع متعدد =====
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadRef.current) return;
    
    // مسح قيمة input فوراً
    const fileList = Array.from(files);
    e.target.value = "";
    
    // التحقق من حجم الملفات
    const oversized = fileList.filter(f => f.size > 16 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} ملف تجاوز الحد الأقصى (16MB)`, { description: oversized.map(f => f.name).join(', ') });
    }
    const validFiles = fileList.filter(f => f.size <= 16 * 1024 * 1024);
    if (validFiles.length === 0) return;
    
    // تفعيل flag منع الحفظ أثناء الرفع
    isUploadingRef.current = true;
    
    const { criterionId, subEvidenceId } = activeUploadRef.current;
    let addedCount = 0;
    
    for (const file of validFiles) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      try {
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        
        let processedData = fileData;
        if (isImage) {
          processedData = await compressImageForStorage(fileData, 1200, 0.7);
        }
        
        const evId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newEv = createEmptyEvidence(subEvidenceId);
        newEv.id = evId;
        newEv.type = isImage ? "image" : isVideo ? "video" : "file";
        newEv.fileName = file.name;
        newEv.text = file.name;
        newEv.displayAs = isImage ? "image" : "qr";
        
        // حفظ في IndexedDB للملفات الكبيرة
        try {
          await saveFileToIDB({
            id: evId,
            data: processedData,
            fileName: file.name,
            fileType: file.type,
            timestamp: Date.now(),
          });
          if (isImage && processedData.length < 200000) {
            newEv.fileData = processedData;
          } else {
            newEv.fileData = `idb://${evId}`;
          }
        } catch {
          newEv.fileData = processedData;
        }
        
        // رفع الملف إلى S3 للحصول على رابط عام للباركود
        try {
          const base64Only = processedData.split(',')[1] || processedData;
          const uploadResult = await uploadFileMutation.mutateAsync({
            fileName: file.name,
            mimeType: file.type,
            base64Data: base64Only,
          });
          if (uploadResult.url) {
            newEv.uploadedUrl = uploadResult.url;
          }
        } catch (uploadErr) {
          console.warn("S3 upload failed, QR will use filename:", uploadErr);
        }
        
        addEvidenceToCriterion(criterionId, newEv);
        addedCount++;
      } catch {
        toast.error(`فشل معالجة: ${file.name}`);
      }
    }
    
    isUploadingRef.current = false;
    if (addedCount > 0) {
      toast.success(
        addedCount === 1 ? "تم إضافة الشاهد بنجاح" : `تم إضافة ${addedCount} شواهد بنجاح`,
        { description: validFiles.map(f => f.name).join(', '), duration: 3000 }
      );
    }
    try { localStorage.removeItem(STORAGE_PENDING_UPLOAD); } catch {}
  }, [compressImageForStorage, addEvidenceToCriterion, uploadFileMutation]);

  const triggerFileUpload = (criterionId: string, subEvidenceId: string) => {
    activeUploadRef.current = { criterionId, subEvidenceId };
    try { localStorage.setItem(STORAGE_PENDING_UPLOAD, "file"); } catch {}
    fileInputRef.current?.click();
  };

  // ===== AI Functions =====
  const callAI = async (criterionId: string, subId: string, userPrompt: string) => {
    const key = `${criterionId}_${subId}`;
    setAiLoading(key);
    try {
      const currentCrit = allCriteria.find(c => c.id === criterionId);
      const allSubs = [...(currentCrit?.subEvidences || []), ...(criteriaData[criterionId]?.customSubEvidences || [])];
      const currentSub = allSubs.find(s => s.id === subId);
      const result = await suggestMutation.mutateAsync({
        prompt: userPrompt || `اقترح شاهد أداء وظيفي لبند "${currentCrit?.title}" - ${currentSub?.title}`,
        context: `الوظيفة: ${selectedJob?.title}, البند: ${currentCrit?.title}, الشاهد الفرعي: ${currentSub?.title}`,
      });
      if (result.content) {
        setAiChat((prev) => ({ ...prev, [key]: [...(prev[key] || []), result.content] }));
      }
    } catch {
      setAiChat((prev) => ({ ...prev, [key]: [...(prev[key] || []), "حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى."] }));
    }
    setAiLoading(null);
    setAiPrompt("");
  };

  const fillFormWithAI = async (criterionId: string, subId: string, evId: string, fields: FormField[]) => {
    const key = `fill_${evId}`;
    setAiLoading(key);
    try {
      const currentCrit = allCriteria.find(c => c.id === criterionId);
      const allSubs = [...(currentCrit?.subEvidences || []), ...(criteriaData[criterionId]?.customSubEvidences || [])];
      const currentSub = allSubs.find(s => s.id === subId);
      const result = await fillFormMutation.mutateAsync({
        jobTitle: selectedJob?.title || "", criterionName: currentCrit?.title || "",
        subEvidenceName: currentSub?.title || "",
        formFields: fields.map(f => ({ id: f.id, label: f.label, type: f.type })),
      });
      if (result.success && result.filledData) {
        Object.entries(result.filledData).forEach(([fieldId, value]) => {
          updateFormField(criterionId, evId, fieldId, String(value));
        });
        toast.success("تم تعبئة النموذج بالذكاء الاصطناعي");
      }
    } catch { toast.error("فشل تعبئة النموذج"); }
    setAiLoading(null);
  };

  const improveFieldText = async (criterionId: string, evId: string, fieldId: string, currentText: string) => {
    if (!currentText.trim()) return;
    const key = `improve_${evId}_${fieldId}`;
    setAiLoading(key);
    try {
      const result = await improveMutation.mutateAsync({ text: currentText, context: `شاهد أداء وظيفي - ${selectedJob?.title}` });
      if (result.improved) {
        updateFormField(criterionId, evId, fieldId, result.improved);
        toast.success("تم تحسين النص");
      }
    } catch { /* ignore */ }
    setAiLoading(null);
  };

  // ===== Save & Calculations =====
  const [isSaving, setIsSaving] = useState(false);

  const saveReport = async () => {
    if (!selectedJob) return;
    if (!isAuthenticated) {
      // حفظ محلي كاحتياطي للمستخدمين غير المسجلين
      const data = { personalInfo, criteriaData, jobId: selectedJob?.id, themeId: selectedTheme.id, customCriteria };
      localStorage.setItem(`sers_perf_${personalInfo.name || "draft"}`, JSON.stringify(data));
      toast.success("تم حفظ البيانات محلياً! سجل دخولك لحفظها في السحابة.");
      return;
    }
    setIsSaving(true);
    try {
      const savedId = await portfolio.savePortfolio({
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        personalInfo,
        criteriaData,
        customCriteria,
        themeId: selectedTheme.id,
        completionPercentage: percentage,
      });
      if (savedId) {
        toast.success("تم حفظ البيانات في السحابة بنجاح!");
      }
    } catch {
      toast.error("فشل الحفظ، يرجى المحاولة مرة أخرى");
    }
    setIsSaving(false);
  };

  const totalScore = Object.values(criteriaData).reduce((sum, c) => sum + c.score, 0);
  const maxScore = allCriteria.length * 5;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: "ممتاز", color: "#16A34A" };
    if (pct >= 80) return { label: "جيد جداً", color: "#2563EB" };
    if (pct >= 70) return { label: "جيد", color: "#CA8A04" };
    if (pct >= 60) return { label: "مقبول", color: "#EA580C" };
    return { label: "ضعيف", color: "#DC2626" };
  };

  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const handleExportPDF = async () => {
    setIsExporting(true);
    setPdfProgress({ current: 0, total: 0 });
    try {
      await exportToPDF(
        "preview-content",
        `${personalInfo.reportTitle || 'شواهد_الأداء'}_${personalInfo.name || 'مستند'}.pdf`,
        (current, total) => setPdfProgress({ current, total })
      );
      toast.success('تم تصدير PDF بنجاح');
    } catch (err) {
      toast.error('فشل تصدير PDF - حاول مرة أخرى');
    } finally {
      setIsExporting(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  // === تصدير PDF متعدد التقارير ===
  const [showMultiExport, setShowMultiExport] = useState(false);
  const [multiExportSelected, setMultiExportSelected] = useState<Set<string>>(new Set());
  const [isMultiExporting, setIsMultiExporting] = useState(false);
  const [multiExportProgress, setMultiExportProgress] = useState({ current: 0, total: 0 });

  const handleMultiExportPDF = async () => {
    if (multiExportSelected.size === 0) {
      toast.error('يرجى اختيار تقرير واحد على الأقل');
      return;
    }
    setIsMultiExporting(true);
    setMultiExportProgress({ current: 0, total: 0 });
    try {
      // بناء قائمة element IDs من البنود المختارة
      const elementIds: string[] = [];
      for (const criterionId of Array.from(multiExportSelected)) {
        const criterion = allCriteria.find(c => c.id === criterionId);
        if (!criterion) continue;
        for (const sub of criterion.subEvidences) {
          const elId = `single-preview-${sub.id}`;
          if (document.getElementById(elId)) {
            elementIds.push(elId);
          }
        }
      }
      if (elementIds.length === 0) {
        toast.error('لا توجد تقارير متاحة للتصدير');
        return;
      }
      await exportMultipleReportsToPDF(
        elementIds,
        `تقارير_متعددة_${personalInfo.name || 'مستند'}.pdf`,
        (current, total) => setMultiExportProgress({ current, total })
      );
      toast.success(`تم تصدير ${elementIds.length} تقرير بنجاح`);
      setShowMultiExport(false);
    } catch (err) {
      toast.error('فشل التصدير المتعدد - حاول مرة أخرى');
    } finally {
      setIsMultiExporting(false);
      setMultiExportProgress({ current: 0, total: 0 });
    }
  };

  // تم حذف تصدير Word بالكامل - التنسيق غير مدعوم بشكل كافي
  const buildDocxData = (mode: 'full' | 'single', criterionId?: string, subId?: string): any => {
    const criteriaForExport: any[] = [];

    if (mode === 'single' && criterionId && subId) {
      const criterion = allCriteria.find(c => c.id === criterionId);
      const sub = criterion?.subEvidences.find(s => s.id === subId);
      const data = criteriaData[criterionId];
      if (criterion && sub && data) {
        const evidences = data.evidences.filter(e => e.subEvidenceId === subId);
        const fields: { label: string; value: string }[] = [];
        evidences.forEach(ev => {
          if (ev.formData) {
            const formFields = sub.formFields || [];
            formFields.forEach(ff => {
              if (ev.formData![ff.id]) {
                fields.push({ label: ff.label, value: ev.formData![ff.id] });
              }
            });
          }
        });
        criteriaForExport.push({
          title: criterion.title,
          subEvidences: [{
            title: sub.title,
            fields,
            evidences: evidences.map(ev => ({
              fileName: ev.fileName || undefined,
              fileUrl: ev.uploadedUrl || undefined,
              displayAs: ev.displayAs,
              type: ev.type,
              text: ev.text || undefined,
              link: ev.link || undefined,
            })),
          }],
        });
      }
    } else {
      // Full report
      for (const criterion of allCriteria) {
        const data = criteriaData[criterion.id];
        if (!data) continue;
        const subs: any[] = [];
        for (const sub of criterion.subEvidences) {
          const evidences = data.evidences.filter(e => e.subEvidenceId === sub.id);
          if (evidences.length === 0) continue;
          const fields: { label: string; value: string }[] = [];
          evidences.forEach(ev => {
            if (ev.formData) {
              const formFields = sub.formFields || [];
              formFields.forEach(ff => {
                if (ev.formData![ff.id]) {
                  fields.push({ label: ff.label, value: ev.formData![ff.id] });
                }
              });
            }
          });
          subs.push({
            title: sub.title,
            fields,
            evidences: evidences.map(ev => ({
              fileName: ev.fileName || undefined,
              fileUrl: ev.uploadedUrl || undefined,
              displayAs: ev.displayAs,
              type: ev.type,
              text: ev.text || undefined,
              link: ev.link || undefined,
            })),
          });
        }
        if (subs.length > 0) {
          criteriaForExport.push({ title: criterion.title, subEvidences: subs });
        }
      }
    }

    return {
      personalInfo: {
        name: personalInfo.name,
        school: personalInfo.school,
        department: personalInfo.department,
        year: personalInfo.year,
        semester: personalInfo.semester,
        evaluator: personalInfo.evaluator,
        evaluatorRole: personalInfo.evaluatorRole,
        date: personalInfo.date,
        reportTitle: personalInfo.reportTitle,
      },
      criteria: criteriaForExport,
      themeColor: selectedTheme.accent,
      mode,
      singleTitle: mode === 'single' ? criteriaForExport[0]?.subEvidences[0]?.title : undefined,
    };
  };

  // handleExportDocx تم حذفه - الاكتفاء بـ PDF

  const handleShareLink = async () => {
    if (!isAuthenticated) {
      toast.error("يجب تسجيل الدخول أولاً لمشاركة الملف كرابط");
      return;
    }
    // حفظ أولاً إذا لم يكن محفوظاً
    let currentPortfolioId = portfolio.id;
    if (!currentPortfolioId) {
      toast.info("جاري حفظ الملف أولاً...");
      const savedId = await portfolio.savePortfolio({
        jobId: selectedJob!.id,
        jobTitle: selectedJob!.title,
        personalInfo,
        criteriaData,
        customCriteria,
        themeId: selectedTheme.id,
        completionPercentage: percentage,
      });
      if (!savedId) {
        toast.error("فشل حفظ الملف");
        return;
      }
      currentPortfolioId = savedId;
    }
    setIsSharing(true);
    try {
      const result = await shareMutation.mutateAsync({
        portfolioId: currentPortfolioId,
        expiresInDays: shareExpiryDays,
        maxViews: 0,
      });
      const url = `${window.location.origin}/shared/${result.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط المشاركة!");
    } catch {
      toast.error("فشل إنشاء رابط المشاركة");
    }
    setIsSharing(false);
  };

  const currentCriterion = allCriteria[currentCriterionIndex];

  // ===== Render Evidence Item =====
  // ===== مكون عرض ملف الشاهد (يدعم IndexedDB references) مع lightbox =====
  const EvidenceFilePreview = ({ ev, criterionId }: { ev: EvidenceItem; criterionId: string }) => {
    const [resolvedData, setResolvedData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
      if (ev.fileData?.startsWith('idb://')) {
        setLoading(true);
        const idbId = ev.fileData.replace('idb://', '');
        getFileFromIDB(idbId).then(file => {
          if (file) {
            setResolvedData(file.data);
          }
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setResolvedData(ev.fileData);
      }
    }, [ev.fileData]);
    
    if (loading) {
      return (
        <div className="mt-2 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">جاري تحميل الملف...</span>
        </div>
      );
    }
    
    const displayData = resolvedData || ev.fileData;
    if (!displayData) return null;
    
    return (
      <div className="mt-2">
        {ev.type === 'image' && ev.displayAs === 'image' && (
          <div className="relative group/img cursor-pointer" onClick={() => setLightboxImage(displayData.startsWith('idb://') ? '' : displayData)}>
            <img src={displayData.startsWith('idb://') ? '' : displayData} alt="" className="max-h-56 rounded-xl border border-border shadow-sm transition-all group-hover/img:shadow-md group-hover/img:scale-[1.01]" />
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-xl transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 dark:bg-black/70 rounded-full p-2 shadow-lg">
                <Eye className="w-5 h-5 text-foreground" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
              <span className="text-[9px] bg-black/60 text-white px-2 py-0.5 rounded-full">{ev.fileName}</span>
            </div>
          </div>
        )}
        {ev.type === 'image' && ev.displayAs === 'qr' && (
          <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-950/30 p-3 rounded-lg">
            <img src={generateQRDataURL((displayData.startsWith('idb://') ? ev.fileName : displayData).substring(0, 200))} alt="QR" className="w-16 h-16" />
            <span className="text-xs text-violet-600">سيظهر كباركود QR عند الطباعة</span>
          </div>
        )}
        {ev.type === 'video' && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200/30">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{ev.fileName}</p>
              <p className="text-[10px] text-red-500 mt-0.5">سيتحول لباركود QR عند الطباعة</p>
            </div>
          </div>
        )}
        {ev.type === 'file' && (
          <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 p-4 rounded-xl border border-orange-200/30">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{ev.fileName}</p>
              <p className="text-[10px] text-orange-500 mt-0.5">
                {ev.fileName?.endsWith('.pdf') ? 'ملف PDF' : ev.fileName?.endsWith('.docx') || ev.fileName?.endsWith('.doc') ? 'مستند Word' : ev.fileName?.endsWith('.xlsx') || ev.fileName?.endsWith('.xls') ? 'جدول Excel' : ev.fileName?.endsWith('.pptx') || ev.fileName?.endsWith('.ppt') ? 'عرض تقديمي' : 'ملف مرفق'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEvidenceItem = (ev: EvidenceItem, criterionId: string) => {
    const priority = ev.priority || 'essential';
    const priorityConfig = PRIORITY_CONFIG[priority];
    // البحث عن formFields من sub-evidence المرتبط
    const criterion = allCriteria.find(c => c.id === criterionId);
    const critData = criteriaData[criterionId];
    const allSubs = [...(criterion?.subEvidences || []), ...(critData?.customSubEvidences || [])];
    const linkedSub = allSubs.find(s => s.id === ev.subEvidenceId);
    const hasFormFields = linkedSub?.formFields && linkedSub.formFields.length > 0;
    const isFormDataEmpty = !ev.formData || Object.keys(ev.formData).length === 0 || !Object.values(ev.formData).some(v => v && v.trim());
    return (
    <motion.div key={ev.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={() => handleDragStart(ev, criterionId, ev.subEvidenceId)}
      onDragEnd={handleDragEnd}
      className={`bg-muted/50 rounded-xl p-4 border group cursor-grab active:cursor-grabbing transition-all ${draggedEvidence?.evidence.id === ev.id ? 'opacity-40 scale-95 border-dashed border-primary' : priorityConfig.borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="اسحب لنقل الشاهد">
            <GripVertical className="w-4 h-4" />
          </div>
          {ev.type === 'text' && <Type className="w-4 h-4 text-muted-foreground" />}
          {ev.type === 'image' && <Image className="w-4 h-4 text-blue-500" />}
          {ev.type === 'link' && <LinkIcon className="w-4 h-4 text-purple-500" />}
          {ev.type === 'file' && <FileText className="w-4 h-4 text-orange-500" />}
          {ev.type === 'video' && <Video className="w-4 h-4 text-red-500" />}
          <span className="text-xs font-medium text-muted-foreground">
            {ev.type === 'text' ? (hasFormFields ? 'نموذج' : 'نص') : ev.type === 'image' ? 'صورة' : ev.type === 'link' ? 'رابط' : ev.type === 'file' ? 'ملف' : 'فيديو'}
          </span>
          {ev.fileName && <span className="text-xs text-muted-foreground/70">({ev.fileName})</span>}
          {/* شارة الأولوية */}
          <select
            value={priority}
            onChange={(e) => updateEvidence(criterionId, ev.id, { priority: e.target.value as EvidencePriority })}
            className="text-[10px] px-1.5 py-0.5 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
            style={{ backgroundColor: priorityConfig.color + '15', color: priorityConfig.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {(Object.entries(PRIORITY_CONFIG) as [EvidencePriority, typeof PRIORITY_CONFIG[EvidencePriority]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          {/* زر التحكم بالباركود */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={(e) => { e.stopPropagation(); updateEvidence(criterionId, ev.id, { showBarcode: !(ev.showBarcode !== false) }); }}
                className={`p-1 rounded-full text-[10px] transition-colors ${ev.showBarcode !== false ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <QrCode className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{ev.showBarcode !== false ? 'الباركود مفعّل - اضغط لتعطيل' : 'الباركود معطّل - اضغط لتفعيل'}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {ev.type === 'image' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={async () => {
                  if (ev.displayAs === 'image') {
                    // تحويل إلى QR - رفع إلى S3 إذا لم يكن هناك uploadedUrl
                    if (!ev.uploadedUrl && ev.fileData) {
                      try {
                        toast.loading('جاري رفع الصورة لإنشاء الباركود...', { id: 'qr-upload-' + ev.id });
                        let base64Data = ev.fileData;
                        // إذا كان الملف في IndexedDB، نحتاج لاسترجاعه
                        if (base64Data.startsWith('idb://')) {
                          const { getFileFromIDB } = await import('@/hooks/useIndexedDB');
                          const stored = await getFileFromIDB(base64Data.replace('idb://', ''));
                          if (stored?.data) base64Data = stored.data;
                          else { toast.error('لم يتم العثور على الملف', { id: 'qr-upload-' + ev.id }); return; }
                        }
                        const base64Only = base64Data.split(',')[1] || base64Data;
                        const mimeType = base64Data.match(/data:([^;]+)/)?.[1] || 'image/png';
                        const uploadResult = await uploadFileMutation.mutateAsync({
                          fileName: ev.fileName || 'image.png',
                          mimeType,
                          base64Data: base64Only,
                        });
                        if (uploadResult.url) {
                          updateEvidence(criterionId, ev.id, { displayAs: 'qr', uploadedUrl: uploadResult.url });
                          toast.success('تم رفع الصورة وإنشاء الباركود', { id: 'qr-upload-' + ev.id });
                        } else {
                          toast.error('فشل رفع الصورة', { id: 'qr-upload-' + ev.id });
                        }
                      } catch (err) {
                        console.error('QR upload error:', err);
                        toast.error('فشل رفع الصورة للباركود', { id: 'qr-upload-' + ev.id });
                      }
                    } else {
                      updateEvidence(criterionId, ev.id, { displayAs: 'qr' });
                    }
                  } else {
                    updateEvidence(criterionId, ev.id, { displayAs: 'image' });
                  }
                }}
                  className={`p-1.5 rounded-lg text-xs ${ev.displayAs === 'qr' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                  {ev.displayAs === 'image' ? <QrCode className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{ev.displayAs === 'image' ? 'تحويل لباركود QR' : 'عرض كصورة'}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => setShowMoveDialog({ evidence: ev, fromCriterionId: criterionId })}
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50">
                <Move className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>نقل إلى بند آخر</TooltipContent>
          </Tooltip>
          <button type="button" onClick={() => removeEvidence(criterionId, ev.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ملاحظة: حقول النموذج تظهر في criterion-detail فقط (نسخة واحدة) */}
      {ev.type === 'text' && hasFormFields && ev.formData !== undefined && !isFormDataEmpty && (
        <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-teal-500" />
            <span>تم تعبئة بيانات النموذج ({Object.values(ev.formData || {}).filter(v => v && v.trim()).length} حقل)</span>
          </div>
        </div>
      )}

      {/* عرض textarea عادي إذا لم تكن هناك formFields */}
      {ev.type === 'text' && !hasFormFields && (
        <textarea value={ev.text} onChange={(e) => updateEvidence(criterionId, ev.id, { text: e.target.value })}
          placeholder="اكتب نص الشاهد هنا..." rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
      )}

      {ev.type === 'link' && (
        <input type="url" value={ev.link} onChange={(e) => updateEvidence(criterionId, ev.id, { link: e.target.value })}
          placeholder="https://example.com" dir="ltr"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
      )}

      {(ev.type === 'image' || ev.type === 'video' || ev.type === 'file') && ev.fileData && (
        <EvidenceFilePreview ev={ev} criterionId={criterionId} />
      )}

      {/* تعليق نصي */}
      <div className="mt-2">
        {ev.comment !== undefined && ev.comment !== '' ? (
          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-2.5 border border-amber-200/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">تعليق</span>
              <button type="button" onClick={() => updateEvidence(criterionId, ev.id, { comment: '' })}
                className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">حذف</button>
            </div>
            <textarea value={ev.comment} onChange={(e) => updateEvidence(criterionId, ev.id, { comment: e.target.value })}
              placeholder="أضف تعليقك هنا..." rows={2}
              className="w-full px-2 py-1.5 rounded-md border border-amber-200/50 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400/30 bg-white/50 dark:bg-background/50" />
          </div>
        ) : (
          <button type="button" onClick={() => updateEvidence(criterionId, ev.id, { comment: ' ' })}
            className="text-[10px] text-muted-foreground hover:text-amber-600 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Plus className="w-3 h-3" />إضافة تعليق
          </button>
        )}
      </div>

      {/* كلمات مفتاحية */}
      <div className="mt-2">
        {ev.keywords && ev.keywords.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {ev.keywords.map((kw, ki) => (
              <span key={ki} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200/50">
                {kw}
                <button type="button" onClick={() => updateEvidence(criterionId, ev.id, { keywords: ev.keywords?.filter((_, idx) => idx !== ki) })}
                  className="text-sky-400 hover:text-red-500 mr-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button type="button" onClick={() => {
              const kw = prompt('أضف كلمة مفتاحية:');
              if (kw?.trim()) updateEvidence(criterionId, ev.id, { keywords: [...(ev.keywords || []), kw.trim()] });
            }} className="text-[9px] text-sky-500 hover:text-sky-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="w-2.5 h-2.5" />إضافة
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => {
            const kw = prompt('أضف كلمة مفتاحية:');
            if (kw?.trim()) updateEvidence(criterionId, ev.id, { keywords: [kw.trim()] });
          }} className="text-[10px] text-muted-foreground hover:text-sky-600 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Plus className="w-3 h-3" />إضافة كلمات مفتاحية
          </button>
        )}
      </div>
    </motion.div>
  );
  };

  // ======================================================================
  // ===== الخطوة 1: اختيار الوظيفة =====
  // ======================================================================
  if (step === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-3 sm:p-4 md:p-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground mb-5 sm:mb-8 transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1" /><span className="text-xs sm:text-sm">العودة للرئيسية</span>
          </button>

          {/* Hero Section - Mobile Optimized */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mx-auto mb-3 sm:mb-5 shadow-lg shadow-teal-500/20">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-foreground mb-2 sm:mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              شواهد الأداء الوظيفي
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed text-xs sm:text-sm px-2">
              اختر وظيفتك لبدء إعداد ملف الإنجاز. يتضمن النظام ذكاء اصطناعي تفاعلي لتصنيف الشواهد وتعبئة النماذج تلقائياً.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
              <Badge variant="secondary" className="gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-3 sm:px-4 text-[10px] sm:text-xs">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-500" />
                ذكاء اصطناعي مفعّل تلقائياً
              </Badge>
            </div>
          </div>

          {/* جميع الوظائف - تصميم موحد */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {JOB_TYPES.map((job, i) => {
              const Icon = job.icon;
              const standards = job.id === "teacher" ? STANDARDS :
                job.id === "special_ed" ? SPECIAL_ED_STANDARDS :
                getStandardsForJob(job.id);
              const standardsCount = standards.length;
              const indicatorsCount = standards.reduce((sum, s) => sum + s.items.reduce((si, item) => si + (item.subItems?.length || 0) + 1, 0), 0);
              const isTeacher = job.id === "teacher";
              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={isTeacher ? "sm:col-span-2" : ""}>
                  <Card className={`cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden relative group h-full ${
                    isTeacher ? 'border-teal-200 bg-gradient-to-l from-teal-50/80 to-background hover:border-teal-300' : 'border-border/60 hover:border-opacity-100'
                  }`}
                    style={!isTeacher ? { ['--hover-border' as string]: job.color } : {}}
                    onClick={() => handleSelectJob(job)}>
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform ${
                          isTeacher ? 'bg-gradient-to-br from-teal-500 to-teal-700 shadow-teal-500/20' : ''
                        }`}
                          style={!isTeacher ? { background: `linear-gradient(135deg, ${job.color}dd, ${job.color})`, boxShadow: `0 4px 12px ${job.color}30` } : {}}>
                          <Icon className={`w-5 h-5 sm:w-7 sm:h-7 text-white`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                            <h3 className={`font-black text-foreground ${isTeacher ? 'text-base sm:text-xl' : 'text-sm sm:text-base'}`} style={{ fontFamily: "var(--font-heading)" }}>{job.title}</h3>
                            {isTeacher && <Badge className="bg-teal-600 text-white text-[9px] sm:text-[10px] hover:bg-teal-700">الأكثر استخداماً</Badge>}
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2">{job.desc}</p>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {job.hasStandards && standardsCount > 0 ? (
                              <>
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] gap-0.5 sm:gap-1 py-0.5 px-2"
                                  style={{ borderColor: job.color + '40', color: job.color }}>
                                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{standardsCount} معيار
                                </Badge>
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] gap-0.5 py-0.5 px-2"
                                  style={{ borderColor: job.color + '40', color: job.color }}>
                                  {indicatorsCount} مؤشر
                                </Badge>
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] gap-0.5 py-0.5 px-2"
                                  style={{ borderColor: job.color + '40', color: job.color }}>
                                  {job.criteria.length} بند
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] gap-0.5 py-0.5 px-2" style={{ borderColor: job.color + '40', color: job.color }}>
                                {job.criteria.length} بند تقييم
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // ===== الخطوة 2: لوحة التحكم الرئيسية =====
  // ======================================================================
  if (step === "dashboard") {
    const grade = getGrade(percentage);
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6" dir="rtl">
        <input type="file" ref={smartUploadRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple onChange={handleSmartUpload} />
        <div className="max-w-6xl mx-auto">

          {/* ===== Header Bar - Mobile Optimized ===== */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6 bg-card/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-border/40 shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button variant="ghost" size="sm" onClick={() => { clearStorageState(); setStep("select"); }} className="gap-1 sm:gap-1.5 text-muted-foreground hover:text-foreground text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />تغيير الوظيفة
              </Button>
              <div className="w-px h-4 sm:h-5 bg-border/60" />
              <Button variant="ghost" size="sm" onClick={saveReport} disabled={isSaving} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden xs:inline">{isSaving ? "جاري الحفظ..." : "حفظ"}</span>
              </Button>
              {/* مؤشر حالة الاتصال */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                    !isOnline ? 'bg-red-100 text-red-700 border border-red-200' :
                    isSyncing ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                    pendingCount > 0 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    'bg-teal-100 text-teal-700 border border-teal-200'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      !isOnline ? 'bg-red-500' :
                      isSyncing ? 'bg-yellow-500 animate-pulse' :
                      pendingCount > 0 ? 'bg-orange-500' :
                      'bg-teal-500'
                    }`} />
                    <span className="hidden sm:inline">
                      {!isOnline ? 'غير متصل' : isSyncing ? 'جاري المزامنة' : pendingCount > 0 ? `${pendingCount} معلق` : 'متصل'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {!isOnline ? 'لا يوجد اتصال - البيانات محفوظة محلياً' :
                   isSyncing ? 'جاري مزامنة البيانات...' :
                   pendingCount > 0 ? `${pendingCount} إجراء بانتظار المزامنة` :
                   'متصل بالإنترنت'}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg" style={{ backgroundColor: grade.color + '12' }}>
                <span className="text-base sm:text-xl font-black" style={{ color: grade.color }}>{percentage}%</span>
                <span className="text-[10px] sm:text-xs font-medium" style={{ color: grade.color }}>{grade.label}</span>
              </div>
              <Button onClick={() => setStep("final-review")} size="sm" className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">التقييم النهائي</span><span className="sm:hidden">التقييم</span>
              </Button>
            </div>
          </div>

          {/* ===== Title - Mobile Optimized ===== */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {selectedJob && (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: selectedJob.color + '15' }}>
                  <selectedJob.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" style={{ color: selectedJob.color }} />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-foreground truncate" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedJob?.title}
                </h1>
                {selectedJob?.hasStandards && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">نظام المعايير الرسمي · {indicatorsCoverage?.covered || 0}/{indicatorsCoverage?.total || 0} بند مغطى</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== لوحة تحليل الفجوات - Mobile Optimized ===== */}
          <Card className="mb-4 sm:mb-6 border-border/40 shadow-sm">
            <CardContent className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground text-xs sm:text-sm" style={{ fontFamily: "var(--font-heading)" }}>تحليل الجاهزية</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); try { localStorage.setItem(STORAGE_PENDING_UPLOAD, "smart"); } catch {} smartUploadRef.current?.click(); }} disabled={isSmartUploading}
                    variant="default" size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 shadow-sm text-xs h-8 sm:h-9 w-full sm:w-auto">
                    {isSmartUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isSmartUploading ? "جاري التصنيف..." : "رفع شواهد مع تصنيف ذكي"}
                  </Button>
                  <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCoverageReport(true); }}
                    variant="outline" size="sm" className="gap-1.5 text-xs h-8 sm:h-9 w-full sm:w-auto border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30">
                    <BarChart3 className="w-3.5 h-3.5" />
                    تقرير التغطية
                  </Button>
                </div>
              </div>

              {/* شريط تقدم التصنيف الذكي */}
              {uploadProgress && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 sm:mb-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-violet-200/50 shadow-sm">
                  
                  <div className="flex gap-3">
                    {/* معاينة الإطار المستخرج من الفيديو */}
                    {uploadProgress.framePreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-violet-300 shadow-md">
                        <img src={uploadProgress.framePreview} alt="إطار الفيديو" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-violet-600 rotate-180 mr-0.5" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* مراحل التقدم */}
                      <div className="flex items-center justify-between mb-3">
                        {[
                          { label: "قراءة", threshold: 10, icon: Upload },
                          { label: "ضغط", threshold: 30, icon: Image },
                          { label: "تصنيف", threshold: 50, icon: Sparkles },
                          { label: "حفظ", threshold: 75, icon: CheckCircle },
                        ].map((phase, i) => {
                          const isActive = uploadProgress.percent >= phase.threshold;
                          const isCurrent = uploadProgress.percent >= phase.threshold && (i === 3 || uploadProgress.percent < [10, 30, 50, 75, 100][i + 1]);
                          const PhaseIcon = phase.icon;
                          return (
                            <div key={phase.label} className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isCurrent ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-110' :
                                isActive ? 'bg-violet-500 text-white' :
                                'bg-violet-100 text-violet-400 dark:bg-violet-900/50'
                              }`}>
                                {isCurrent ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <PhaseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              </div>
                              <span className={`text-[8px] sm:text-[9px] font-medium transition-colors ${
                                isActive ? 'text-violet-700 dark:text-violet-300' : 'text-violet-400 dark:text-violet-600'
                              }`}>{phase.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* شريط التقدم الرئيسي */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-violet-700 dark:text-violet-400 truncate ml-2">{uploadProgress.stage}</span>
                        <span className="font-bold text-violet-600 shrink-0">{uploadProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-violet-200/30 dark:bg-violet-800/30 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress.percent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            uploadProgress.percent === 100
                              ? 'bg-gradient-to-r from-teal-500 to-teal-400'
                              : 'bg-gradient-to-r from-violet-600 to-indigo-500'
                          }`}
                        />
                      </div>
                      {uploadProgress.percent === 100 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mt-2 text-teal-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">تم بنجاح!</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* شريط التقدم العام */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                  <span className="font-bold" style={{ color: grade.color }}>{gapAnalysis.percentage}% جاهزية</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{gapAnalysis.totalEvidences} شاهد مرفوع</span>
                </div>
                <Progress value={gapAnalysis.percentage} className="h-2 sm:h-2.5" />
              </div>

              {/* إحصائيات سريعة - Mobile Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-teal-200/50 text-center sm:text-right">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-black text-teal-700 dark:text-teal-400 leading-none">{gapAnalysis.coveredCriteria}</p>
                    <p className="text-[9px] sm:text-[10px] text-teal-600 dark:text-teal-500 mt-0.5">مكتمل</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-amber-200/50 text-center sm:text-right">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 leading-none">{gapAnalysis.partialCriteria}</p>
                    <p className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">جزئي</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 bg-red-50 dark:bg-red-950/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-red-200/50 text-center sm:text-right">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-black text-red-600 dark:text-red-400 leading-none">{gapAnalysis.missedCriteria}</p>
                    <p className="text-[9px] sm:text-[10px] text-red-500 dark:text-red-400 mt-0.5">مفقود</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== Tabs ===== */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="criteria">البنود ({allCriteria.length})</TabsTrigger>
              <TabsTrigger value="info">البيانات الشخصية</TabsTrigger>
            </TabsList>

            {/* ===== تبويب البنود ===== */}
            <TabsContent value="criteria">
              {/* ===== شريط البحث والفلتر ===== */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في الشواهد بالعنوان أو الوصف أو الكلمات المفتاحية..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">فلتر الأولوية:</span>
                  <button type="button" onClick={() => setFilterPriority('all')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${filterPriority === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    الكل
                  </button>
                  {(Object.entries(PRIORITY_CONFIG) as [EvidencePriority, typeof PRIORITY_CONFIG[EvidencePriority]][]).map(([key, config]) => (
                    <button key={key} type="button" onClick={() => setFilterPriority(key)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${filterPriority === key ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      style={filterPriority === key ? { backgroundColor: config.color } : {}}>
                      <span>{config.icon}</span>{config.label}
                    </button>
                  ))}
                </div>
                {/* نتائج البحث */}
                {searchQuery && (() => {
                  const results: { criterionId: string; criterionTitle: string; evidence: EvidenceItem; criterionIndex: number }[] = [];
                  const q = searchQuery.toLowerCase();
                  allCriteria.forEach((c, idx) => {
                    const data = criteriaData[c.id];
                    if (!data) return;
                    data.evidences.forEach(ev => {
                      const matchText = ev.text?.toLowerCase().includes(q);
                      const matchFile = ev.fileName?.toLowerCase().includes(q);
                      const matchComment = ev.comment?.toLowerCase().includes(q);
                      const matchKeywords = ev.keywords?.some(k => k.toLowerCase().includes(q));
                      const matchFormData = ev.formData && Object.values(ev.formData).some(v => v?.toLowerCase().includes(q));
                      if (matchText || matchFile || matchComment || matchKeywords || matchFormData) {
                        results.push({ criterionId: c.id, criterionTitle: c.title, evidence: ev, criterionIndex: idx });
                      }
                    });
                  });
                  if (results.length === 0) return (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                      <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
                    </div>
                  );
                  return (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-3">
                        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                          <SearchIcon className="w-3.5 h-3.5 text-primary" />
                          {results.length} نتيجة لـ "{searchQuery}"
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {results.map(r => (
                            <div key={r.evidence.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                              onClick={() => { setCurrentCriterionIndex(r.criterionIndex); setStep('criterion-detail'); setSearchQuery(''); }}>
                              <div className="flex items-center gap-2 min-w-0">
                                {r.evidence.priority && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: PRIORITY_CONFIG[r.evidence.priority].color + '15', color: PRIORITY_CONFIG[r.evidence.priority].color }}>
                                    {PRIORITY_CONFIG[r.evidence.priority].icon}
                                  </span>
                                )}
                                <span className="text-xs text-foreground truncate">{r.evidence.text || r.evidence.fileName || 'شاهد'}</span>
                              </div>
                              <Badge variant="outline" className="text-[9px] shrink-0">{r.criterionTitle}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* قائمة البنود */}
              <div className="space-y-3">
                {allCriteria.map((criterion, index) => {
                  const data = criteriaData[criterion.id];
                  if (!data) return null;
                  const evidenceCount = data.evidences.length;
                  const isCustom = criterion.id.startsWith("custom_main_");
                  const status = data.score >= 4 && evidenceCount > 0 ? "complete" : evidenceCount > 0 || data.score > 0 ? "partial" : "missing";
                  const jobStandards = selectedJob?.id === "teacher" ? STANDARDS : (selectedJob ? getStandardsForJob(selectedJob.id) : []);
                  const hasStd = selectedJob?.hasStandards;
                  const standard = hasStd ? jobStandards.find(s => s.id === criterion.id) : null;
                  const indicatorProgress = hasStd && standard ? (() => {
                    let total = 0;
                    let covered = 0;
                    standard.items.forEach(item => {
                      total++;
                      if (data.evidences.some(e => e.subEvidenceId === item.id)) covered++;
                      (item.subItems || []).forEach(sub => {
                        total++;
                        if (data.evidences.some(e => e.subEvidenceId === sub.id)) covered++;
                      });
                    });
                    return { covered, total, pct: total > 0 ? Math.round((covered / total) * 100) : 0 };
                  })() : null;

                  return (
                    <Card key={criterion.id}
                      className={`cursor-pointer hover:shadow-md transition-all duration-200 group ${
                        status === "complete" ? "border-teal-300 bg-teal-50/20 hover:border-teal-400"
                        : status === "partial" ? "border-amber-300 bg-amber-50/20 hover:border-amber-400"
                        : "border-border/50 hover:border-primary/30"
                      }`}
                      onClick={() => { setCurrentCriterionIndex(index); setStep("criterion-detail"); }}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start sm:items-center gap-2.5 sm:gap-4">
                          {/* رقم البند / أيقونة */}
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 transition-transform group-hover:scale-105 ${
                            isCustom ? "bg-violet-100 text-violet-700" : ""
                          }`}
                            style={standard ? { backgroundColor: standard.color + "15" } : !isCustom ? (
                              status === "complete" ? { backgroundColor: "#dcfce7" } : status === "partial" ? { backgroundColor: "#fef3c7" } : { backgroundColor: "#f1f5f9" }
                            ) : undefined}>
                            {standard ? (() => { const StdIcon = STANDARD_ICONS[standard.id]; return StdIcon ? <StdIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: standard.color }} /> : <span className="text-base sm:text-lg font-bold" style={{ color: standard.color }}>{standard.number}</span>; })() : isCustom ? <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> : <span className="text-base sm:text-lg font-bold" style={{ color: status === "complete" ? "#16a34a" : status === "partial" ? "#ca8a04" : "#64748b" }}>{index + 1}</span>}
                          </div>

                          {/* المحتوى */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                              <h3 className="font-bold text-foreground text-xs sm:text-sm truncate" style={{ fontFamily: "var(--font-heading)" }}>
                                {criterion.title}
                              </h3>
                              {isCustom && <Badge variant="outline" className="text-[9px] sm:text-[10px] shrink-0">مخصص</Badge>}
                            </div>
                            {hasStd && standard && indicatorProgress ? (
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground shrink-0">{indicatorProgress.covered}/{indicatorProgress.total} مؤشر</span>
                                <div className="flex-1 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px] sm:max-w-[120px]">
                                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${indicatorProgress.pct}%`, backgroundColor: standard.color }} />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-medium hidden sm:inline" style={{ color: standard.color }}>الوزن {standard.weight}%</span>
                              </div>
                            ) : (
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{criterion.description}</p>
                            )}
                            {/* Mobile: إحصائيات مصغرة */}
                            <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                              <span className="text-[10px] font-bold" style={{ color: status === "complete" ? "#16A34A" : status === "partial" ? "#CA8A04" : "#9CA3AF" }}>
                                {data.score}/{criterion.maxScore}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{evidenceCount} شاهد</span>
                              {status === "complete" && <CheckCircle className="w-3 h-3 text-teal-500" />}
                              {status === "partial" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                              {status === "missing" && <XCircle className="w-3 h-3 text-red-400" />}
                            </div>
                            {/* Thumbnails مصغرة للشواهد */}
                            {evidenceCount > 0 && (() => {
                              const imageEvs = data.evidences.filter(e => e.type === 'image' && e.fileData && !e.fileData.startsWith('idb://'));
                              const fileEvs = data.evidences.filter(e => e.type === 'file');
                              const textEvs = data.evidences.filter(e => e.type === 'text');
                              const linkEvs = data.evidences.filter(e => e.type === 'link');
                              const videoEvs = data.evidences.filter(e => e.type === 'video');
                              return (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  {/* مصغرات الصور */}
                                  {imageEvs.slice(0, 3).map((img, idx) => (
                                    <div key={idx} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-border/50 shrink-0">
                                      <img src={img.fileData!} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                  {imageEvs.length > 3 && (
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted/80 border border-border/50 flex items-center justify-center shrink-0">
                                      <span className="text-[9px] font-bold text-muted-foreground">+{imageEvs.length - 3}</span>
                                    </div>
                                  )}
                                  {/* أيقونات الأنواع الأخرى */}
                                  {fileEvs.length > 0 && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200/30">
                                      <FileText className="w-3 h-3 text-orange-500" />
                                      <span className="text-[9px] font-medium text-orange-600">{fileEvs.length}</span>
                                    </div>
                                  )}
                                  {textEvs.length > 0 && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200/30">
                                      <Type className="w-3 h-3 text-blue-500" />
                                      <span className="text-[9px] font-medium text-blue-600">{textEvs.length}</span>
                                    </div>
                                  )}
                                  {linkEvs.length > 0 && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200/30">
                                      <LinkIcon className="w-3 h-3 text-purple-500" />
                                      <span className="text-[9px] font-medium text-purple-600">{linkEvs.length}</span>
                                    </div>
                                  )}
                                  {videoEvs.length > 0 && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200/30">
                                      <Video className="w-3 h-3 text-red-500" />
                                      <span className="text-[9px] font-medium text-red-600">{videoEvs.length}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* الإحصائيات - Desktop Only */}
                          <div className="hidden sm:flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-1.5">
                              {status === "complete" && <CheckCircle className="w-4 h-4 text-teal-500" />}
                              {status === "partial" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              {status === "missing" && <XCircle className="w-4 h-4 text-red-400" />}
                              <div className="text-center">
                                <p className="text-sm font-bold" style={{ color: status === "complete" ? "#16A34A" : status === "partial" ? "#CA8A04" : "#9CA3AF" }}>
                                  {data.score}/{criterion.maxScore}
                                </p>
                              </div>
                            </div>
                            <div className="text-center border-r border-border/50 pr-3">
                              <p className="text-xs font-bold text-foreground">{evidenceCount}</p>
                              <p className="text-[10px] text-muted-foreground">شاهد</p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          {/* Mobile arrow */}
                          <ArrowLeft className="w-4 h-4 text-muted-foreground sm:hidden shrink-0 mt-3" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* إضافة قسم رئيسي مخصص */}
              {!showAddMainSection ? (
                <Button variant="outline" className="w-full mt-4 border-dashed gap-2" onClick={() => setShowAddMainSection(true)}>
                  <Plus className="w-4 h-4" />إضافة قسم رئيسي مخصص
                </Button>
              ) : (
                <Card className="mt-4 border-violet-200 bg-violet-50/30">
                  <CardContent className="p-4 space-y-3">
                    <input type="text" value={newMainSectionTitle} onChange={(e) => setNewMainSectionTitle(e.target.value)}
                      placeholder="اسم القسم الرئيسي" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <input type="text" value={newMainSectionDesc} onChange={(e) => setNewMainSectionDesc(e.target.value)}
                      placeholder="وصف مختصر (اختياري)" className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addCustomMainSection} disabled={!newMainSectionTitle.trim()}>إضافة</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddMainSection(false)}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ===== تبويب البيانات الشخصية ===== */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />البيانات الأساسية
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">هذه البيانات ستظهر في جميع التقارير والملفات المصدّرة والعرض الإلكتروني</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "name", label: "الاسم الكامل", placeholder: "أدخل الاسم الرباعي", required: true },
                      { key: "school", label: "المدرسة", placeholder: "اسم المدرسة", required: true },
                      { key: "year", label: "العام الدراسي", placeholder: "مثال: ١٤٤٧هـ" },
                      { key: "semester", label: "الفصل الدراسي", placeholder: "مثال: الفصل الدراسي الثاني" },
                      { key: "evaluator", label: "اسم مدير المدرسة", placeholder: "اسم مدير/ة المدرسة" },
                      { key: "evaluatorRole", label: "الصفة الوظيفية", placeholder: "مثال: مدير المدرسة" },
                      { key: "date", label: "تاريخ التقييم", placeholder: "مثال: ١٤٤٧/٠٦/١٥" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {field.label}
                          {(field as any).required && <span className="text-red-500 mr-1">*</span>}
                        </label>
                        <input type="text" value={(personalInfo as any)[field.key]}
                          onChange={(e) => setPersonalInfo((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                      </div>
                    ))}
                  </div>

                  {/* حقل الموضوع */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-1.5">الموضوع</label>
                    <input type="text" value={personalInfo.reportTitle}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, reportTitle: e.target.value }))}
                      placeholder="شواهد الأداء الوظيفي"
                      className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                    <p className="text-[10px] text-muted-foreground mt-1">يظهر في الغلاف ورأس الصفحات (افتراضي: شواهد الأداء الوظيفي)</p>
                  </div>

                  {/* حقل الجهة / الإدارة */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-1.5">الجهة / الإدارة</label>
                    <textarea value={personalInfo.department}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, department: e.target.value }))}
                      placeholder="المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم بمنطقة..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none" />
                    <p className="text-[10px] text-muted-foreground mt-1">يظهر في رأس التقرير والغلاف (سطر لكل مستوى)</p>
                  </div>

                  {/* حقل شعار إضافي */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-1.5">شعار إضافي (اختياري)</label>
                    <p className="text-[10px] text-muted-foreground mb-2">شعار إضافي يظهر بجانب شعار وزارة التعليم في التقارير (مثل شعار المدرسة أو الإدارة)</p>
                    <div className="flex items-center gap-3">
                      <input type="text" value={personalInfo.extraLogo}
                        onChange={(e) => setPersonalInfo((prev) => ({ ...prev, extraLogo: e.target.value }))}
                        placeholder="رابط الشعار (URL)"
                        className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
                      <label className="cursor-pointer px-3 py-2 rounded-lg border border-dashed border-primary/40 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />رفع صورة
                        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // حد حجم الملف 5MB
                          if (file.size > 5 * 1024 * 1024) {
                            import('sonner').then(({ toast }) => {
                              toast.error('حجم الملف كبير جداً', { description: 'يجب أن يكون حجم الشعار أقل من 5 ميغابايت' });
                            });
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            if (dataUrl) {
                              setPersonalInfo((prev) => ({ ...prev, extraLogo: dataUrl }));
                            }
                          };
                          reader.onerror = () => {
                            import('sonner').then(({ toast }) => {
                              toast.error('فشل في قراءة الملف', { description: 'حاول رفع صورة أخرى' });
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }} />
                      </label>
                      {personalInfo.extraLogo && (
                        <div className="relative">
                          <img src={personalInfo.extraLogo} alt="شعار إضافي" className="w-12 h-12 object-contain rounded-lg border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <button type="button" onClick={() => setPersonalInfo((prev) => ({ ...prev, extraLogo: '' }))}
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center text-[10px] hover:bg-destructive/80">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* تنبيه */}
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>جميع البيانات التي تدخلها هنا ستظهر تلقائياً في التقييم النهائي وتقرير التغطية وملف PDF المصدّر والعرض الإلكتروني التفاعلي. شعار وزارة التعليم مرفق تلقائياً في جميع التقارير.</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // ======================================================================
  // ===== الخطوة 3: تفاصيل البند =====
  // ======================================================================
  if (step === "criterion-detail" && currentCriterion) {
    const data = criteriaData[currentCriterion.id] || { score: 0, notes: "", evidences: [], customSubEvidences: [] };
    const allSubEvidences = [...(currentCriterion.subEvidences || []), ...(data.customSubEvidences || [])];
    const jobStandardsDetail = selectedJob?.id === "teacher" ? STANDARDS : (selectedJob ? getStandardsForJob(selectedJob.id) : []);
    const isStandardBased = selectedJob?.hasStandards;
    const standard = isStandardBased ? jobStandardsDetail.find(s => s.id === currentCriterion.id) : null;

    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6" dir="rtl">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple onChange={handleFileUpload} />
        {/* Lightbox Overlay */}
        <AnimatePresence>
          {lightboxImage && <LightboxOverlay src={lightboxImage} onClose={() => setLightboxImage(null)} />}
        </AnimatePresence>
        <div className="max-w-4xl mx-auto">

          {/* Header - Mobile Optimized */}
          <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("dashboard")} className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" /><span className="hidden sm:inline">العودة للبنود</span><span className="sm:hidden">البنود</span>
              </Button>
              <div className="flex gap-0.5 sm:gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={currentCriterionIndex === 0}
                  onClick={() => setCurrentCriterionIndex(i => i - 1)}><ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={currentCriterionIndex === allCriteria.length - 1}
                  onClick={() => setCurrentCriterionIndex(i => i + 1)}><ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></Button>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">{currentCriterionIndex + 1} / {allCriteria.length}</Badge>
          </div>

          {/* Criterion Header Card - Mobile Optimized */}
          <Card className="mb-4 sm:mb-5">
            <CardContent className="p-3 sm:p-5">
              {/* Breadcrumb مسار التصنيف */}
              {isStandardBased && standard && (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground mb-2.5 sm:mb-3 flex-wrap">
                  <span className="font-medium" style={{ color: selectedJob?.color }}>{selectedJob?.title}</span>
                  <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  <span className="font-medium" style={{ color: standard.color }}>معيار {standard.number}: {standard.title}</span>
                  <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  <span className="text-foreground font-bold">{standard.items.length} بند</span>
                </div>
              )}
              {!isStandardBased && (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground mb-2.5 sm:mb-3 flex-wrap">
                  <span className="font-medium" style={{ color: selectedJob?.color }}>{selectedJob?.title}</span>
                  <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  <span className="text-foreground font-bold">بند {currentCriterionIndex + 1}</span>
                </div>
              )}
              {/* Mobile: Stack layout */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0"
                    style={{ backgroundColor: (standard?.color || selectedJob?.color || "#0097A7") + "15" }}>
                    {standard ? (() => { const StdIcon = STANDARD_ICONS[standard.id]; return StdIcon ? <StdIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: standard.color }} /> : <span className="text-base sm:text-lg font-bold">{standard.number}</span>; })() : <span className="text-base sm:text-lg font-bold">{currentCriterionIndex + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base sm:text-xl font-black text-foreground mb-0.5 sm:mb-1 leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
                      {currentCriterion.title}
                    </h1>
                    <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed">{currentCriterion.description}</p>
                    {isStandardBased && standard && (
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px]">الوزن: {standard.weight}%</Badge>
                        <Badge variant="outline" className="text-[9px] sm:text-[10px]">{standard.items.length} بند</Badge>
                      </div>
                    )}
                  </div>
                </div>
                {/* الدرجة - منفصلة على الجوال */}
                <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5 sm:p-3 border border-border/30">
                  <label className="text-xs text-muted-foreground font-medium">الدرجة</label>
                  <div className="flex gap-1 sm:gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button type="button" key={s} onClick={(e) => { e.stopPropagation(); updateScore(currentCriterion.id, s); }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-bold transition-all ${data.score >= s ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background text-muted-foreground hover:bg-muted/80 border border-border/50'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-Evidences */}
          <div className="space-y-3">
            {allSubEvidences.map((sub) => {
              const subEvidences = data.evidences.filter(e => e.subEvidenceId === sub.id);
              const isExpanded = expandedSubEvidence === sub.id;
              const aiKey = `${currentCriterion.id}_${sub.id}`;
              const aiMessages = aiChat[aiKey] || [];
              const hasFormEvidence = subEvidences.some(e => e.formData && Object.keys(e.formData).length > 0);

              const isDropTarget = dragOverTarget?.criterionId === currentCriterion.id && dragOverTarget?.subId === sub.id;
              return (
                <Card key={sub.id}
                  onDragOver={(e) => handleDragOver(e, currentCriterion.id, sub.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, currentCriterion.id, sub.id)}
                  className={`overflow-hidden transition-all ${sub.isSubItem ? 'mr-6 sm:mr-8 border-r-2 border-r-primary/20' : ''} ${isExpanded ? 'border-primary/30 shadow-sm' : 'border-border/50'} ${isDropTarget ? 'border-2 border-dashed border-primary bg-primary/5 shadow-lg scale-[1.01]' : ''} ${draggedEvidence ? 'hover:border-primary/50' : ''}`}>
                  <div role="button" tabIndex={0} onClick={() => {
                    setExpandedSubEvidence(isExpanded ? null : sub.id);
                    if (!isExpanded && (sub.type === 'report' || sub.type === 'both') && sub.formFields && !hasFormEvidence) {
                      addEvidence(currentCriterion.id, sub.id, "text");
                    }
                  }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedSubEvidence(isExpanded ? null : sub.id); }}
                    className={`w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors text-right cursor-pointer ${sub.isSubItem ? 'bg-muted/20' : ''}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                        subEvidences.length > 0 ? 'bg-teal-100 text-teal-600' : sub.isSubItem ? 'bg-primary/10 text-primary/60' : 'bg-muted text-muted-foreground'
                      }`}>
                        {subEvidences.length > 0 ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : sub.isSubItem ? <span className="text-[10px]">◇</span> : <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-foreground text-xs sm:text-sm truncate ${sub.isSubItem ? 'font-medium' : 'font-bold'}`}>
                          {sub.title}
                          {sub.isCustom && <Badge variant="outline" className="mr-1 text-[8px] sm:text-[9px]">مخصص</Badge>}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {sub.isSubItem && sub.parentTitle ? <span className="text-primary/60">← {sub.parentTitle} · </span> : ''}
                          {subEvidences.length} شاهد مرفق
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden">
                        <div className="p-4 space-y-4">
                          {/* Form Fields */}
                          {(sub.type === 'report' || sub.type === 'both') && sub.formFields && (() => {
                            const formEv = subEvidences.find(e => e.formData !== undefined);
                            if (!formEv) return null;
                            return (
                              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />نموذج التقرير
                                  </h4>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-teal-300 text-teal-700 hover:bg-teal-50"
                                      onClick={() => { setPreviewCriterionId(currentCriterion.id); setPreviewSubId(sub.id); }}>
                                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />معاينة
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-blue-300 text-blue-700 hover:bg-blue-50"
                                      onClick={() => exportSingleEvidence(currentCriterion.id, sub.id)}>
                                      <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />تصدير PDF
                                    </Button>
                                    <Button variant="secondary" size="sm" className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8"
                                      onClick={() => fillFormWithAI(currentCriterion.id, sub.id, formEv.id, sub.formFields!)}
                                      disabled={aiLoading === `fill_${formEv.id}`}>
                                      {aiLoading === `fill_${formEv.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-500" />}
                                      تعبئة AI
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {sub.formFields.map((field: FormField) => (
                                    <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-foreground">
                                          {field.label} {field.required && <span className="text-destructive">*</span>}
                                        </label>
                                        <div className="flex items-center gap-2">
                                          {formEv.formData?.[field.id] && (
                                            <button type="button" onClick={() => { navigator.clipboard.writeText(formEv.formData?.[field.id] || ''); toast.success('تم النسخ'); }}
                                              className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5" title="نسخ">
                                              <Copy className="w-3 h-3" />نسخ
                                            </button>
                                          )}
                                          {field.type === 'textarea' && formEv.formData?.[field.id] && (
                                            <button type="button" onClick={() => improveFieldText(currentCriterion.id, formEv.id, field.id, formEv.formData?.[field.id] || '')}
                                              disabled={aiLoading === `improve_${formEv.id}_${field.id}`}
                                              className="text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-1">
                                              {aiLoading === `improve_${formEv.id}_${field.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                              تحسين
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      {field.type === 'textarea' ? (
                                        <textarea value={formEv.formData?.[field.id] || ''} onChange={(e) => updateFormField(currentCriterion.id, formEv.id, field.id, e.target.value)}
                                          placeholder={field.placeholder} rows={3}
                                          className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
                                      ) : field.type === 'select' ? (
                                        <select value={formEv.formData?.[field.id] || ''} onChange={(e) => updateFormField(currentCriterion.id, formEv.id, field.id, e.target.value)}
                                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background">
                                          <option value="">اختر...</option>
                                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      ) : (
                                        <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                          value={formEv.formData?.[field.id] || ''} onChange={(e) => updateFormField(currentCriterion.id, formEv.id, field.id, e.target.value)}
                                          placeholder={field.placeholder}
                                          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
                                      )}
                                    </div>
                                  ))}
                                  {/* الصفوف الديناميكية المضافة */}
                                  {/* الصفوف الديناميكية المضافة من الإدارة - عرض فقط بدون حذف */}
                                  {formEv.formData && Object.keys(formEv.formData).filter(k => k.startsWith('dynamic_') && !k.startsWith('__label_')).map(fieldId => {
                                    const label = formEv.formData?.[`__label_${fieldId}`] || 'حقل إضافي';
                                    return (
                                      <div key={fieldId} className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="block text-xs font-medium text-foreground flex items-center gap-1">
                                            <span className="text-primary">◇</span> {label}
                                          </label>
                                          {formEv.formData?.[fieldId] && (
                                            <button type="button" onClick={() => { navigator.clipboard.writeText(formEv.formData?.[fieldId] || ''); toast.success('تم النسخ'); }}
                                              className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5" title="نسخ">
                                              <Copy className="w-3 h-3" />نسخ
                                            </button>
                                          )}
                                        </div>
                                        <textarea value={formEv.formData?.[fieldId] || ''} onChange={(e) => updateFormField(currentCriterion.id, formEv.id, fieldId, e.target.value)}
                                          placeholder={`أدخل ${label}...`} rows={2}
                                          className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
                                      </div>
                                    );
                                  })}
                                </div>

                              </div>
                            );
                          })()}

                          {/* Drop Indicator */}
                          {isDropTarget && draggedEvidence && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              className="bg-primary/10 border-2 border-dashed border-primary rounded-xl p-4 text-center">
                              <Move className="w-5 h-5 text-primary mx-auto mb-1" />
                              <p className="text-xs font-medium text-primary">أفلت هنا لنقل الشاهد</p>
                            </motion.div>
                          )}

                          {/* Evidences List - تخطي الشواهد من نوع text التي تحتوي على formData لأنها تُعرض في نموذج التقرير */}
                          {subEvidences.filter(ev => !(ev.type === 'text' && ev.formData !== undefined && sub.formFields)).map((ev) => renderEvidenceItem(ev, currentCriterion.id))}

                          {/* Add Evidence Buttons + Drag & Drop Zone */}
                          <div className="space-y-2">
                            {/* Drag & Drop Zone - محسّن */}
                            <div
                              className="relative border-2 border-dashed rounded-2xl p-5 sm:p-7 text-center transition-all duration-300 cursor-pointer hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 group/drop"
                              style={{ borderColor: 'var(--border)' }}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-primary', 'bg-primary/5', 'scale-[1.02]', 'shadow-lg', 'shadow-primary/10'); e.currentTarget.classList.remove('border-border'); }}
                              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5', 'scale-[1.02]', 'shadow-lg', 'shadow-primary/10'); }}
                              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5', 'scale-[1.02]', 'shadow-lg', 'shadow-primary/10'); const files = e.dataTransfer.files; if (files.length > 0) { activeUploadRef.current = { criterionId: currentCriterion.id, subEvidenceId: sub.id }; const dt = new DataTransfer(); Array.from(files).forEach(f => dt.items.add(f)); const input = fileInputRef.current; if (input) { input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); } } }}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerFileUpload(currentCriterion.id, sub.id); }}
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover/drop:bg-primary/20 group-hover/drop:scale-110 transition-all duration-300">
                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-primary/50 group-hover/drop:text-primary/80 transition-colors" />
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-muted-foreground group-hover/drop:text-primary transition-colors">اسحب الملفات هنا أو اضغط للرفع</p>
                              <p className="text-[10px] text-muted-foreground/50 mt-1">يدعم رفع ملفات متعددة دفعة واحدة</p>
                              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3">
                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                                  <Image className="w-3 h-3" />صور
                                </span>
                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                                  <FileText className="w-3 h-3" />PDF
                                </span>
                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                                  <Video className="w-3 h-3" />فيديو
                                </span>
                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                                  <FileText className="w-3 h-3" />Word
                                </span>
                              </div>
                            </div>
                            {/* Quick Action Buttons - خارج منطقة الرفع */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 border-dashed border-purple-400 text-purple-600 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addEvidence(currentCriterion.id, sub.id, "link"); }}>
                                <LinkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />رابط
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>

          {/* إضافة قسم فرعي مخصص */}
          {showAddSub === currentCriterion.id ? (
            <Card className="mt-3 border-violet-200">
              <CardContent className="p-4 flex gap-2">
                <input type="text" value={newSubTitle} onChange={(e) => setNewSubTitle(e.target.value)}
                  placeholder="اسم القسم الفرعي الجديد"
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <Button size="sm" onClick={() => addCustomSubEvidence(currentCriterion.id)} disabled={!newSubTitle.trim()}>إضافة</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddSub(null)}>إلغاء</Button>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" size="sm" className="mt-3 gap-1.5 border-dashed" onClick={() => setShowAddSub(currentCriterion.id)}>
              <Plus className="w-3.5 h-3.5" />إضافة قسم فرعي مخصص
            </Button>
          )}

          {/* Move Evidence Dialog */}
          {showMoveDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMoveDialog(null)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Move className="w-4 h-4 text-primary" />نقل الشاهد إلى بند آخر
                  </h3>
                  <button type="button" onClick={() => setShowMoveDialog(null)} className="p-1 rounded-lg hover:bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-2 overflow-y-auto max-h-[60vh]">
                  <div className="px-3 py-2 mb-2 text-[10px] text-muted-foreground bg-muted/30 rounded-lg">
                    اختر البند الفرعي المناسب لنقل الشاهد إليه. النقل اليدوي يحسّن دقة التصنيف الذكي مستقبلاً.
                  </div>
                  {allCriteria.map((crit) => {
                    const critData = criteriaData[crit.id];
                    const defaultSubs = crit.subEvidences;
                    const customSubs = critData?.customSubEvidences || [];
                    const isCurrent = crit.id === showMoveDialog.fromCriterionId;
                    return (
                      <div key={crit.id} className={`mb-1 ${isCurrent ? 'opacity-50' : ''}`}>
                        <div className="px-3 py-2 text-xs font-bold text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                          {crit.title}
                        </div>
                        {defaultSubs.map((sub) => (
                          <button type="button" key={sub.id}
                            disabled={isCurrent && showMoveDialog.evidence.subEvidenceId === sub.id}
                            onClick={() => moveEvidenceToCriterion(showMoveDialog.evidence, showMoveDialog.fromCriterionId, crit.id, sub.id)}
                            className="w-full text-right px-4 py-2.5 hover:bg-muted/80 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{sub.title}</span>
                            {isCurrent && showMoveDialog.evidence.subEvidenceId === sub.id && (
                              <Badge variant="secondary" className="text-[9px] mr-auto">الموقع الحالي</Badge>
                            )}
                          </button>
                        ))}
                        {customSubs.map((sub) => (
                          <button type="button" key={sub.id}
                            disabled={isCurrent && showMoveDialog.evidence.subEvidenceId === sub.id}
                            onClick={() => moveEvidenceToCriterion(showMoveDialog.evidence, showMoveDialog.fromCriterionId, crit.id, sub.id)}
                            className="w-full text-right px-4 py-2.5 hover:bg-muted/80 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-sm truncate">{sub.title}</span>
                            <Badge variant="outline" className="text-[8px] mr-auto border-amber-300 text-amber-600">مخصص</Badge>
                            {isCurrent && showMoveDialog.evidence.subEvidenceId === sub.id && (
                              <Badge variant="secondary" className="text-[9px]">الموقع الحالي</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ===== تقرير التغطية Dialog ===== */}
          {showCoverageReport && (() => {
            const reportGrade = getGrade(percentage);
            return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCoverageReport(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-card rounded-2xl shadow-2xl border border-border max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>تقرير تغطية البنود بالشواهد</h2>
                      <p className="text-xs text-muted-foreground">{personalInfo.name || 'ملف الإنجاز'} - {selectedJob?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={async (e) => {
                      e.preventDefault();
                      setIsGeneratingReport(true);
                      try {
                        await exportToPDF('coverage-report-content', `تقرير_التغطية_${personalInfo.name || 'مستند'}.pdf`);
                        toast.success('تم تصدير التقرير بنجاح');
                      } catch { toast.error('فشل تصدير التقرير'); }
                      setIsGeneratingReport(false);
                    }}>
                      {isGeneratingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      تحميل PDF
                    </Button>
                    <button onClick={() => setShowCoverageReport(false)} className="p-1.5 rounded-lg hover:bg-muted">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div id="coverage-report-content" className="space-y-6" dir="rtl">
                  {/* ملخص عام */}
                  <div className="bg-gradient-to-r from-teal-50 to-teal-50 dark:from-teal-950/30 dark:to-teal-950/30 rounded-xl p-5 border border-teal-200/50">
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "var(--font-heading)" }}>ملخص عام</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-teal-600">{gapAnalysis.coveredCriteria}</div>
                        <div className="text-[10px] text-muted-foreground">بند مكتمل</div>
                      </div>
                      <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-amber-600">{gapAnalysis.partialCriteria}</div>
                        <div className="text-[10px] text-muted-foreground">بند جزئي</div>
                      </div>
                      <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{gapAnalysis.missedCriteria}</div>
                        <div className="text-[10px] text-muted-foreground">بند مفقود</div>
                      </div>
                      <div className="bg-white/80 dark:bg-card/80 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{gapAnalysis.totalEvidences}</div>
                        <div className="text-[10px] text-muted-foreground">إجمالي الشواهد</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">نسبة التغطية الإجمالية</span>
                        <span className="text-xs font-bold" style={{ color: reportGrade.color }}>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: reportGrade.color }} />
                      </div>
                      <div className="text-center mt-2">
                        <Badge variant="outline" className="text-sm font-bold" style={{ borderColor: reportGrade.color, color: reportGrade.color }}>
                          التقدير: {reportGrade.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* رسم بياني شريطي لكل بند */}
                  <div>
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "var(--font-heading)" }}>تفصيل التغطية لكل بند</h3>
                    <div className="space-y-2">
                      {allCriteria.map((criterion, idx) => {
                        const data = criteriaData[criterion.id];
                        const evidenceCount = data?.evidences?.length || 0;
                        const subCount = criterion.subEvidences.length + (data?.customSubEvidences?.length || 0);
                        const coveredSubs = new Set(data?.evidences?.map(e => e.subEvidenceId) || []).size;
                        const subCoverage = subCount > 0 ? Math.round((coveredSubs / subCount) * 100) : 0;
                        const barColor = subCoverage >= 80 ? '#16A34A' : subCoverage >= 50 ? '#CA8A04' : subCoverage > 0 ? '#EA580C' : '#DC2626';
                        const StatusIcon = subCoverage >= 80 ? CheckCircle : subCoverage >= 50 ? AlertTriangle : XCircle;
                        
                        return (
                          <div key={criterion.id} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <StatusIcon className="w-4 h-4 shrink-0" style={{ color: barColor }} />
                                <span className="text-xs font-medium truncate">{idx + 1}. {criterion.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground">{evidenceCount} شاهد</span>
                                <span className="text-xs font-bold" style={{ color: barColor }}>{subCoverage}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${subCoverage}%`, backgroundColor: barColor }} />
                            </div>
                            {evidenceCount === 0 && (
                              <p className="text-[10px] text-red-500 mt-1">⚠ لا توجد شواهد مرفقة - يرجى إضافة شواهد</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* توزيع أنواع الشواهد */}
                  <div>
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "var(--font-heading)" }}>توزيع أنواع الشواهد</h3>
                    {(() => {
                      const allEvs = Object.values(criteriaData).flatMap(c => c.evidences);
                      const typeCounts = { image: 0, file: 0, text: 0, link: 0, video: 0 };
                      allEvs.forEach(ev => { if (ev.type in typeCounts) typeCounts[ev.type as keyof typeof typeCounts]++; });
                      const typeLabels = { image: 'صورة', file: 'ملف', text: 'نص', link: 'رابط', video: 'فيديو' };
                      const typeColors = { image: '#3B82F6', file: '#F97316', text: '#8B5CF6', link: '#A855F7', video: '#EF4444' };
                      const total = allEvs.length || 1;
                      return (
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(typeCounts).map(([type, count]) => (
                            <div key={type} className="text-center">
                              <div className="relative w-full aspect-square rounded-xl flex items-center justify-center mb-1" style={{ backgroundColor: typeColors[type as keyof typeof typeColors] + '15' }}>
                                <span className="text-lg font-bold" style={{ color: typeColors[type as keyof typeof typeColors] }}>{count}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{typeLabels[type as keyof typeof typeLabels]}</span>
                              <div className="text-[9px] font-medium" style={{ color: typeColors[type as keyof typeof typeColors] }}>{Math.round((count / total) * 100)}%</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* توصيات */}
                  {gapAnalysis.missedCriteria > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200/50">
                      <h3 className="font-bold text-sm mb-2 text-amber-800 dark:text-amber-300" style={{ fontFamily: "var(--font-heading)" }}>توصيات لتحسين التغطية</h3>
                      <ul className="space-y-1">
                        {allCriteria.filter(c => !criteriaData[c.id]?.evidences?.length).map(c => (
                          <li key={c.id} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>أضف شواهد لـبند "{c.title}" لرفع نسبة التغطية</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
          })()}

          {/* ===== معاينة شاهد فردي بهوية وزارة التعليم ===== */}
          {previewSubId && previewCriterionId && (() => {
            const prevCrit = allCriteria.find(c => c.id === previewCriterionId);
            if (!prevCrit) return null;
            const prevCritData = criteriaData[previewCriterionId];
            const allPrevSubs = [...prevCrit.subEvidences, ...(prevCritData?.customSubEvidences || [])];
            const prevSub = allPrevSubs.find(s => s.id === previewSubId);
            if (!prevSub) return null;
            const prevEvidences = (prevCritData?.evidences || []).filter(e => e.subEvidenceId === previewSubId);
            const formEv = prevEvidences.find(e => e.formData !== undefined);
            const imageEvidences = prevEvidences.filter(e => e.type === 'image' && e.fileData);
            const linkEvidences = prevEvidences.filter(e => e.type === 'link' && e.link);
            const fileEvidences = prevEvidences.filter(e => (e.type === 'file' || e.type === 'video') && e.fileData);
            const allMediaEvidences = [...imageEvidences, ...linkEvidences, ...fileEvidences];
            const theme = selectedTheme;
            const staticFields = (prevSub.formFields || []).map(f => ({ id: f.id, label: f.label, value: formEv?.formData?.[f.id] || '' }));
            const dynamicFields = formEv?.formData ? Object.keys(formEv.formData).filter(k => k.startsWith('dynamic_') && !k.startsWith('__label_')).map(k => ({ id: k, label: formEv.formData?.[`__label_${k}`] || 'حقل إضافي', value: formEv.formData?.[k] || '' })) : [];
            const allFields = [...staticFields, ...dynamicFields];
            const shortFields = allFields.filter(f => (f.value?.length || 0) < 80);
            const longFields = allFields.filter(f => (f.value?.length || 0) >= 80);
            // === استخراج بيانات الإدارة بدون تكرار ===
            const deptLines = (personalInfo.department || '').split('\n').filter((l: string) => l.trim());
            const filteredDeptLines = deptLines.filter((l: string) => {
              const trimmed = l.trim();
              if (trimmed === 'المملكة العربية السعودية') return false;
              if (trimmed === 'وزارة التعليم') return false;
              if (personalInfo.school && trimmed === personalInfo.school.trim()) return false;
              return true;
            });
            const isDarkHeader = theme.headerBg !== '#ffffff' && theme.headerBg !== '#f8f9fa' && !theme.headerBg.includes('#fff');
            const fStyle = theme.fieldStyle || 'table';
            const bodyBg = theme.bodyBg || '#ffffff';

            // === دالة رسم الحقول حسب نمط القالب ===
            const renderFields = () => {
              if (fStyle === 'cards') {
                // نمط البطاقات - تصميم احترافي بظلال خفيفة وحواف متناسقة
                return (
                  <div style={{ padding: '16px 24px', flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '12px' }}>
                      {allFields.map((field, fi) => (
                        <div key={field.id} style={{
                          flex: (field.value?.length || 0) >= 80 ? '1 1 100%' : '1 1 calc(50% - 6px)',
                          background: '#fff',
                          borderRadius: '10px',
                          border: `1.5px solid ${theme.borderColor || '#e2e8f0'}`,
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                        }}>
                          <div style={{
                            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`,
                            color: '#fff',
                            padding: '9px 16px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            textAlign: 'center',
                            letterSpacing: '0.4px',
                            borderBottom: `1px solid ${theme.accent}`,
                          }}>
                            {field.label}
                          </div>
                          <div style={{
                            padding: '12px 16px',
                            fontSize: '13.5px',
                            color: '#1e293b',
                            lineHeight: '1.9',
                            whiteSpace: 'pre-wrap' as const,
                            minHeight: '45px',
                            background: fi % 2 === 0 ? '#ffffff' : '#fafbfc',
                          }}>
                            {field.value || '....................'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (fStyle === 'fieldset') {
                // نمط الحقول بإطار - تصميم احترافي بظلال وتدرجات
                return (
                  <div style={{ padding: '16px 24px', flex: 1 }}>
                    {allFields.map((field, fi) => (
                      <div key={field.id} style={{
                        border: `1.5px solid ${theme.borderColor || '#e2e8f0'}`,
                        borderRadius: '10px',
                        marginBottom: '10px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{
                          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}ee)`,
                          padding: '9px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#ffffff',
                          letterSpacing: '0.4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                          {field.label}
                        </div>
                        <div style={{
                          padding: '12px 18px',
                          fontSize: '13.5px',
                          color: '#1e293b',
                          lineHeight: '1.9',
                          whiteSpace: 'pre-wrap' as const,
                          minHeight: '45px',
                          background: fi % 2 === 0 ? '#ffffff' : '#fafbfc',
                        }}>
                          {field.value || '....................'}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else if (fStyle === 'underlined') {
                // نمط الخط السفلي - تصميم أنيق بخطوط متناسقة
                return (
                  <div style={{ padding: '16px 24px', flex: 1 }}>
                    {allFields.map((field, fi) => (
                      <div key={field.id} style={{
                        borderBottom: `1.5px solid ${theme.borderColor || '#e2e8f0'}`,
                        padding: '12px 8px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: (field.value?.length || 0) >= 80 ? 'flex-start' : 'center',
                        flexDirection: (field.value?.length || 0) >= 80 ? 'column' as const : 'row' as const,
                        background: fi % 2 === 0 ? 'transparent' : `${theme.accent}04`,
                        borderRadius: '4px',
                      }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: theme.accent,
                          minWidth: '110px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: theme.accent, opacity: 0.7 }} />
                          {field.label}:
                        </div>
                        <div style={{
                          fontSize: '13.5px',
                          color: '#1e293b',
                          lineHeight: '1.9',
                          whiteSpace: 'pre-wrap' as const,
                          flex: 1,
                        }}>
                          {field.value || '....................'}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else if (fStyle === 'minimal') {
                // نمط بسيط - تصميم نظيف وأنيق
                return (
                  <div style={{ padding: '16px 24px', flex: 1 }}>
                    {allFields.map((field, fi) => (
                      <div key={field.id} style={{ marginBottom: '12px', padding: '4px 0' }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: theme.accent,
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                          textTransform: 'uppercase' as const,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          <span style={{ width: '6px', height: '2px', borderRadius: '1px', background: theme.accent, opacity: 0.5 }} />
                          {field.label}
                        </div>
                        <div style={{
                          fontSize: '13.5px',
                          color: '#1e293b',
                          lineHeight: '1.9',
                          whiteSpace: 'pre-wrap' as const,
                          padding: '8px 10px',
                          borderBottom: `1.5px dotted ${theme.borderColor || '#e2e8f0'}`,
                          borderRight: `2px solid ${theme.accent}20`,
                          background: fi % 2 === 0 ? 'transparent' : '#fafbfc',
                          borderRadius: '2px',
                        }}>
                          {field.value || '....................'}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                // نمط الجدول الرسمي (table) - تصميم احترافي متكامل
                // الحقول القصيرة في صفين لتوزيع متوازن
                const colsPerRow = 2;
                return (
                  <div style={{ padding: '12px 20px', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse' as const, 
                      border: `2px solid ${theme.borderColor || '#b8c9d9'}`, 
                      flex: 1, 
                      tableLayout: 'fixed' as const,
                    }}>
                      <tbody>
                        {shortFields.length > 0 && (() => {
                          const rows: typeof shortFields[] = [];
                          for (let i = 0; i < shortFields.length; i += colsPerRow) rows.push(shortFields.slice(i, i + colsPerRow));
                          return rows.map((row, ri) => (
                            <tr key={`short-${ri}`}>
                              {row.map((field) => (
                                <React.Fragment key={field.id}>
                                  <td style={{
                                    border: `1.5px solid ${theme.borderColor || '#b8c9d9'}`,
                                    padding: '8px 12px',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    color: '#fff',
                                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.headerBg || theme.accent})`,
                                    width: '20%',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    letterSpacing: '0.3px',
                                  }}>
                                    {field.label}
                                  </td>
                                  <td style={{
                                    border: `1.5px solid ${theme.borderColor || '#b8c9d9'}`,
                                    padding: '8px 14px',
                                    fontSize: '13px',
                                    color: '#1a1a1a',
                                    background: ri % 2 === 0 ? '#fff' : '#f8fafb',
                                    width: '30%',
                                    verticalAlign: 'middle',
                                  }}>
                                    {field.value || '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                                  </td>
                                </React.Fragment>
                              ))}
                              {row.length < colsPerRow && Array.from({ length: colsPerRow - row.length }).map((_, i) => (
                                <React.Fragment key={`empty-${i}`}>
                                  <td style={{ border: `1.5px solid ${theme.borderColor || '#b8c9d9'}`, padding: '8px 12px', background: `linear-gradient(135deg, ${theme.accent}, ${theme.headerBg || theme.accent})`, width: '20%' }}></td>
                                  <td style={{ border: `1.5px solid ${theme.borderColor || '#b8c9d9'}`, padding: '8px 14px', background: ri % 2 === 0 ? '#fff' : '#f8fafb', width: '30%' }}></td>
                                </React.Fragment>
                              ))}
                            </tr>
                          ));
                        })()}
                        {longFields.map((field, fi) => (
                          <tr key={field.id}>
                            <td style={{
                              border: `1.5px solid ${theme.borderColor || '#b8c9d9'}`,
                              padding: '8px 12px',
                              fontWeight: 700,
                              fontSize: '12px',
                              color: '#fff',
                              background: `linear-gradient(135deg, ${theme.accent}, ${theme.headerBg || theme.accent})`,
                              width: '20%',
                              textAlign: 'center',
                              verticalAlign: 'top',
                              letterSpacing: '0.3px',
                            }}>
                              {field.label}
                            </td>
                            <td colSpan={colsPerRow * 2 - 1} style={{
                              border: `1.5px solid ${theme.borderColor || '#b8c9d9'}`,
                              padding: '10px 14px',
                              fontSize: '13px',
                              lineHeight: '1.9',
                              color: '#1a1a1a',
                              background: (shortFields.length + fi) % 2 === 0 ? '#fff' : '#f8fafb',
                              whiteSpace: 'pre-wrap' as const,
                              verticalAlign: 'top',
                            }}>
                              {field.value || '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
            };

            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-50" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '8px 4px 60px 4px', minHeight: '100%' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full" style={{ maxWidth: '860px' }}>
                  {/* شريط الأدوات العلوي */}
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 border-b flex-wrap gap-1 sm:gap-2 sticky top-0 z-10" data-no-print>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => exportSingleEvidence(previewCriterionId, previewSubId)}>
                        <Download className="w-3 h-3" />PDF
                      </Button>

                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => { const el = document.getElementById(`single-preview-${previewSubId}`); if (el) printElement(`single-preview-${previewSubId}`); }}>
                        <Printer className="w-3 h-3" />طباعة
                      </Button>
                      <div className="relative group">
                        <button className="flex items-center gap-1.5 text-xs h-7 px-2 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                          onClick={(e) => { const el = e.currentTarget.nextElementSibling; if (el) el.classList.toggle('hidden'); }}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedTheme.accent }} />
                          <span>{selectedTheme.name}</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>
                        <div className="hidden absolute top-8 right-0 z-50 bg-white rounded-xl shadow-2xl border p-2 w-64 max-h-72 overflow-y-auto">
                          <p className="text-[9px] text-gray-400 px-1 mb-1">اختر القالب:</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {allThemes.map(t => {
                              const isSel = selectedTheme.id === t.id;
                              return (
                                <button key={t.id} onClick={(e) => { setSelectedTheme(t); const parent = (e.currentTarget as HTMLElement).closest('.grid')?.parentElement; if (parent) parent.classList.add('hidden'); }}
                                  className={`rounded-md border overflow-hidden text-right transition-all ${isSel ? 'border-primary ring-1 ring-primary/30 shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}>
                                  <div className="h-10 w-full relative" style={{ background: t.headerBg === '#ffffff' ? '#f8fafb' : t.headerBg }}>
                                    <div className="h-3 w-full flex items-center justify-center gap-0.5" style={{ background: t.headerBg === '#ffffff' ? '#f0f4f8' : t.headerBg }}>
                                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                      <div className="w-5 h-0.5 rounded-full" style={{ background: t.headerText === '#ffffff' ? 'rgba(255,255,255,0.5)' : `${t.accent}40` }} />
                                    </div>
                                    <div className="px-1 pt-0.5">
                                      <div className="h-1 rounded-full mb-0.5" style={{ background: t.titleBg, width: '50%' }} />
                                      <div className="flex gap-0.5">
                                        <div className="flex-1 h-0.5 rounded-full" style={{ background: `${t.accent}20` }} />
                                        <div className="flex-1 h-0.5 rounded-full" style={{ background: `${t.accent}15` }} />
                                      </div>
                                    </div>
                                    {t.showBottomBar && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: t.footerBg }} />}
                                  </div>
                                  <div className={`px-1.5 py-1 text-[9px] font-medium flex items-center gap-1 ${isSel ? 'bg-primary/5 text-primary' : 'text-gray-700'}`}>
                                    <span className="truncate">{t.name}</span>
                                    {isSel && <span className="mr-auto text-primary text-[8px]">✓</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      {/* زر تخصيص الألوان */}
                      <div className="relative">
                        <Button size="sm" variant="outline" className={`gap-1 text-xs h-7 ${showColorPicker ? 'bg-[#1a3a5c] text-white' : ''}`} onClick={() => setShowColorPicker(!showColorPicker)}>
                          <Palette className="w-3 h-3" />الألوان
                        </Button>
                        {showColorPicker && (
                          <div className="absolute top-9 right-0 z-50 bg-white rounded-xl shadow-2xl border p-3 sm:p-4 w-[calc(100vw-2rem)] sm:w-72 max-w-72" dir="rtl" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-gray-800">تخصيص الألوان</h4>
                              <button onClick={() => setShowColorPicker(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">اختر لون موحد للقالب</label>
                                <p className="text-[10px] text-gray-400 mb-2">اللون المختار يُطبق على جميع عناصر القالب (ترويسة، إطارات، عناوين، فوتر)</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <input type="color" value={selectedTheme.accent} onChange={(e) => { const c = e.target.value; setSelectedTheme(prev => ({ ...prev, accent: c, borderColor: c, titleBg: c, fieldLabelBg: prev.fieldLabelBg === '#f0f4f8' || prev.fieldLabelBg === '#f0f7f4' ? prev.fieldLabelBg : c, footerBg: c, headerBg: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? prev.headerBg : c, headerText: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? c : '#ffffff', coverAccent2: c })); }} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                  <div>
                                    <span className="text-xs font-mono text-gray-600 block">{selectedTheme.accent}</span>
                                    <span className="text-[10px] text-gray-400">اضغط لاختيار لون مخصص</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">ألوان سريعة</label>
                                {/* لون تدرج الهوية البصرية */}
                                <button
                                  title="تدرج الهوية البصرية"
                                  onClick={() => { setSelectedTheme(prev => ({ ...prev, accent: '#1a6b6a', borderColor: '#2ea87a', titleBg: '#1a6b6a', fieldLabelBg: prev.fieldLabelBg === '#f0f4f8' || prev.fieldLabelBg === '#f0f7f4' ? prev.fieldLabelBg : '#1a6b6a', footerBg: '#1a6b6a', headerBg: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? prev.headerBg : '#1a6b6a', headerText: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? '#1a6b6a' : '#ffffff', coverAccent2: '#5bb784' })); }}
                                  className={`w-full mb-2 h-8 rounded-lg border-2 shadow-sm hover:scale-[1.02] transition-transform ${selectedTheme.accent === '#1a6b6a' && selectedTheme.coverAccent2 === '#5bb784' ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-white'}`}
                                  style={{ background: 'linear-gradient(to left, #1a6b6a, #2ea87a, #5bb784)' }}
                                />
                                <p className="text-[9px] text-gray-400 mb-2 text-center">تدرج الهوية البصرية (3 ألوان)</p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {[
                                    { name: 'أزرق داكن', accent: '#1a3a5c' },
                                    { name: 'تيل', accent: '#0d7377' },
                                    { name: 'كحلي', accent: '#1e3a5f' },
                                    { name: 'بنفسجي', accent: '#5b21b6' },
                                    { name: 'عنابي', accent: '#7f1d1d' },
                                    { name: 'ذهبي', accent: '#8B6914' },
                                    { name: 'برتقالي', accent: '#c2410c' },
                                  ].map(preset => (
                                    <button key={preset.name} title={preset.name} onClick={() => { const c = preset.accent; setSelectedTheme(prev => ({ ...prev, accent: c, borderColor: c, titleBg: c, fieldLabelBg: prev.fieldLabelBg === '#f0f4f8' || prev.fieldLabelBg === '#f0f7f4' ? prev.fieldLabelBg : c, footerBg: c, headerBg: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? prev.headerBg : c, headerText: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? c : '#ffffff', coverAccent2: c })); }}
                                      className={`w-7 h-7 rounded-full border-2 shadow-sm hover:scale-110 transition-transform ${selectedTheme.accent === preset.accent ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-white'}`} style={{ background: preset.accent }} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* أزرار التكبير/التصغير - تصميم احترافي */}
                      <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm px-1 py-0.5">
                        <button onClick={zoomOut} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors active:scale-95" title="تصغير">
                          <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <div className="px-1.5 min-w-[2.5rem] text-center">
                          <span className="text-[10px] font-mono text-gray-700 font-medium">{zoomLevel}%</span>
                        </div>
                        <button onClick={zoomIn} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors active:scale-95" title="تكبير">
                          <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-0.5" />
                        <button onClick={resetZoom} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors active:scale-95" title="إعادة الحجم الأصلي">
                          <RotateCcw className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => { setPreviewSubId(null); setPreviewCriterionId(null); }} className="p-1.5 rounded-lg hover:bg-gray-200">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* ========== محتوى المعاينة - متوافق مع جميع الأجهزة ========== */}
                  <div ref={previewContainerRef} style={{ background: '#e5e7eb', padding: '8px 4px', minHeight: '200px' }}>
                    {/* wrapper بارتفاع محسوب لاحتواء الصفحة المصغرة */}
                    <div style={{
                      width: `${wrapperWidth}px`,
                      height: `${wrapperHeight}px`,
                      margin: '0 auto',
                      position: 'relative' as const,
                      overflow: 'hidden',
                    }}>
                    {/* الصفحة الفعلية - تُعرض مباشرة مع transform: scale() */}
                    <div style={{
                      width: `${A4_WIDTH_PX}px`,
                      transformOrigin: 'top right',
                      transform: `scale(${previewScale})`,
                      transition: 'transform 0.15s ease-out',
                    }}>
                  <div id={`single-preview-${previewSubId}`} ref={previewPageRef} style={{
                    fontFamily: "'Cairo', sans-serif",
                    direction: 'rtl',
                    width: '210mm',
                  }}>
                    <div className="pdf-page" style={{
                      background: '#ffffff',
                      margin: '0 auto',
                      border: `2px solid ${theme.accent || '#1a3a5c'}`,
                      position: 'relative' as const,
                      boxSizing: 'border-box' as const,
                      display: 'flex',
                      flexDirection: 'column' as const,
                      width: '210mm',
                      minHeight: '297mm',
                    }}>

                      {/* ========== المحتوى الرئيسي ========== */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0, minHeight: 0 }}>

                      {/* ========== الترويسة الرسمية - 4 أنماط ========== */}
                      {(() => {
                        const hv = theme.headerVariant || 'right-text-center-logo-left-info';
                        const hBg = isDarkHeader ? (theme.headerBg || theme.accent) : '#ffffff';
                        const hTextColor = isDarkHeader ? '#ffffff' : (theme.headerText || theme.borderColor || '#1a3a5c');
                        const allDeptLines = (personalInfo.department || '').split('\n').filter((l: string) => l.trim());

                        // نمط 1: كتابة يمين + شعار وسط + معلومات/شعار يسار
                        if (hv === 'right-text-center-logo-left-info') {
                          return (
                            <>
                              {/* شريط علوي رفيع بلون واحد */}
                              {!isDarkHeader && (
                                <div style={{ height: '5px', background: theme.accent }} />
                              )}
                              <div style={{ background: hBg, padding: isDarkHeader ? '16px 24px 12px' : '18px 24px 14px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                                        {allDeptLines.map((line: string, i: number) => (
                                          <div key={i} style={{ fontSize: '13px', color: hTextColor, fontWeight: 700, lineHeight: '2.0', letterSpacing: '0.3px' }}>{line}</div>
                                        ))}
                                        {personalInfo.school && (
                                          <div style={{ fontSize: '13px', color: hTextColor, fontWeight: 700, lineHeight: '2.0' }}>{personalInfo.school}</div>
                                        )}
                                      </td>
                                      {/* خط فاصل عمودي أخضر - مطابق للهوية البصرية */}
                                      <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                                        <div style={{ width: '2px', height: '55px', background: isDarkHeader ? 'rgba(255,255,255,0.35)' : theme.accent, margin: '0 auto' }} />
                                      </td>
                                      <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                                        <img src={getMoeLogoUrl()} alt="شعار وزارة التعليم" style={{ height: '80px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: getMoeLogoFilter(isDarkHeader) }} />
                                      </td>
                                      <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                                        {personalInfo.extraLogo && (
                                          <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '55px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        )}
                                        <div style={{ textAlign: 'left' }}>
                                          {personalInfo.semester && <div style={{ fontSize: '12px', color: hTextColor, fontWeight: 600, lineHeight: '1.8' }}>الفصل الدراسي: {personalInfo.semester}</div>}
                                          {personalInfo.year && <div style={{ fontSize: '12px', color: hTextColor, fontWeight: 600, lineHeight: '1.8' }}>العام الدراسي: {personalInfo.year}</div>}
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </>
                          );
                        }

                        // نمط 2: كتابة يمين + شعار يسار (مثل الصورة 1)
                        if (hv === 'right-text-left-logo') {
                          return (
                            <>
                              {/* شريط علوي رفيع بلون واحد */}
                              <div style={{ height: '5px', background: theme.accent }} />
                              <div style={{ background: '#ffffff', padding: '20px 28px 16px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ width: '50%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                                        {allDeptLines.map((line: string, i: number) => (
                                          <div key={i} style={{ fontSize: '14px', color: theme.headerText || '#1a3a5c', fontWeight: 700, lineHeight: '2.2', letterSpacing: '0.3px' }}>{line}</div>
                                        ))}
                                        {personalInfo.school && (
                                          <div style={{ fontSize: '14px', color: theme.headerText || '#1a3a5c', fontWeight: 700, lineHeight: '2.2' }}>{personalInfo.school}</div>
                                        )}
                                      </td>
                                      {/* خط فاصل عمودي أخضر */}
                                      <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 6px' }}>
                                        <div style={{ width: '2px', height: '60px', background: theme.accent, margin: '0 auto' }} />
                                      </td>
                                      <td style={{ width: '48%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
                                          <img src={getMoeLogoUrl()} alt="شعار وزارة التعليم" style={{ height: '85px', objectFit: 'contain' as const }} />
                                          {personalInfo.extraLogo && (
                                            <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '60px', objectFit: 'contain' as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                          )}
                                        </div>
                                        <div style={{ textAlign: 'left', marginTop: '4px' }}>
                                          {personalInfo.semester && <div style={{ fontSize: '11px', color: theme.headerText || '#1a3a5c', fontWeight: 600, lineHeight: '1.7' }}>الفصل الدراسي: {personalInfo.semester}</div>}
                                          {personalInfo.year && <div style={{ fontSize: '11px', color: theme.headerText || '#1a3a5c', fontWeight: 600, lineHeight: '1.7' }}>العام الدراسي: {personalInfo.year}</div>}
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </>
                          );
                        }

                        // نمط 3: شعار وسط + شريط عنوان أخضر (مثل الصورة 2)
                        if (hv === 'center-logo-banner') {
                          return (
                            <>
                              {/* شريط علوي رفيع بلون واحد */}
                              <div style={{ height: '5px', background: theme.accent }} />
                              <div style={{ background: '#ffffff', padding: '14px 24px 10px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ width: '48%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                                        <div style={{ fontSize: '13px', color: theme.headerText || '#1a3a5c', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                                        {filteredDeptLines.map((line: string, i: number) => (
                                          <div key={i} style={{ fontSize: '12px', color: theme.headerText || '#1a3a5c', fontWeight: 600, lineHeight: '1.9' }}>{line}</div>
                                        ))}
                                        {personalInfo.school && (
                                          <div style={{ fontSize: '12px', color: theme.headerText || '#1a3a5c', fontWeight: 600, lineHeight: '1.9' }}>مدرسة: {personalInfo.school}</div>
                                        )}
                                      </td>
                                      {/* خط فاصل عمودي أخضر */}
                                      <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                                        <div style={{ width: '2px', height: '55px', background: theme.accent, margin: '0 auto' }} />
                                      </td>
                                      <td style={{ width: '50%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
                                          <img src={getMoeLogoUrl()} alt="شعار وزارة التعليم" style={{ height: '70px', objectFit: 'contain' as const }} />
                                          {personalInfo.extraLogo && (
                                            <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '55px', objectFit: 'contain' as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                          )}
                                        </div>
                                        <div style={{ textAlign: 'left', marginTop: '4px' }}>
                                          {personalInfo.semester && <div style={{ fontSize: '11px', color: theme.headerText || '#1a3a5c', fontWeight: 600, lineHeight: '1.7' }}>الفصل الدراسي: {personalInfo.semester}</div>}
                                          {personalInfo.year && <div style={{ fontSize: '11px', color: theme.headerText || '#1a3a5c', fontWeight: 600, lineHeight: '1.7' }}>العام الدراسي: {personalInfo.year}</div>}
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              {/* خط فاصل بلون واحد موحد */}
                              <div style={{ height: '4px', background: theme.accent }} />
                            </>
                          );
                        }

                        // نمط 4: ترويسة كاملة مع أقسام (مثل edu-forms - الصورة 3)
                        return (
                          <>
                            {/* شريط علوي رفيع بلون واحد */}
                            <div style={{ height: '5px', background: theme.accent }} />
                            <div style={{ background: '#ffffff', padding: '14px 24px 10px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                                <tbody>
                                  <tr>
                                    <td style={{ width: '34%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                                      {allDeptLines.map((line: string, i: number) => (
                                        <div key={i} style={{ fontSize: '13px', color: theme.headerText || '#1a3a5c', fontWeight: 700, lineHeight: '2.0' }}>{line}</div>
                                      ))}
                                      {personalInfo.school && (
                                        <div style={{ fontSize: '13px', color: theme.headerText || '#1a3a5c', fontWeight: 700, lineHeight: '2.0' }}>{personalInfo.school}</div>
                                      )}
                                    </td>
                                    {/* خط فاصل عمودي بلون الهوية */}
                                    <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                                      <div style={{ width: '2px', height: '55px', background: theme.accent, margin: '0 auto' }} />
                                    </td>
                                    <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                                      <img src={getMoeLogoUrl()} alt="شعار وزارة التعليم" style={{ height: '75px', objectFit: 'contain' as const, margin: '0 auto', display: 'block' }} />
                                      {personalInfo.extraLogo && (
                                        <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '40px', objectFit: 'contain' as const, margin: '6px auto 0', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                      )}
                                    </td>
                                    <td style={{ width: '36%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                                      {personalInfo.semester && <div style={{ fontSize: '12px', color: theme.borderColor || theme.accent, fontWeight: 600, lineHeight: '2.0' }}>الفصل الدراسي: {personalInfo.semester}</div>}
                                      {personalInfo.year && <div style={{ fontSize: '12px', color: theme.borderColor || theme.accent, fontWeight: 600, lineHeight: '2.0' }}>العام الدراسي: {personalInfo.year}</div>}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}

                      {/* ========== شريط العنوان - مطابق للهوية البصرية ========== */}
                      {(() => {
                        const tStyle = theme.titleStyle || 'rounded';
                          if (tStyle === 'rounded' && !isDarkHeader) {
                          // نمط الإطار المدور التيل الفاتح (مطابق لصفحات 2,3,7,9,10,11 من PDF)
                          return (
                            <div style={{ padding: '10px 28px', margin: '4px 0' }}>
                              <div style={{
                                border: '2px solid #8dd4d4',
                                borderRadius: '22px',
                                padding: '11px 24px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '15px',
                                color: '#1a1a1a',
                                letterSpacing: '0.5px',
                              }}>
                                {prevSub.title}
                              </div>
                            </div>
                          );
                          } else if (tStyle === 'full-width' || isDarkHeader) {
                          // نمط الشريط الكامل مع إطار أخضر (مطابق لصفحات 4,5,6,8 من PDF)
                          return (
                            <div style={{ padding: '6px 20px', margin: '4px 0' }}>
                              <div style={{
                                background: '#1a5c5e',
                                border: '2px solid #3cc68a',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '12px 24px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '15px',
                                letterSpacing: '0.5px',
                              }}>
                                {prevSub.title}
                              </div>
                            </div>
                          );
                        } else {
                          // نمط بسيط
                          return (
                            <div style={{
                              background: `linear-gradient(135deg, ${theme.titleBg || theme.accent}, ${theme.accent})`,
                              color: 'white',
                              padding: '12px 24px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '15px',
                              letterSpacing: '0.5px',
                              margin: '0',
                            }}>
                              {prevSub.title}
                            </div>
                          );
                        }
                      })()}

                      {/* ========== الحقول حسب نمط القالب ========== */}
                      {renderFields()}

                      {/* ========== قسم الشواهد والأدلة ========== */}
                      {allMediaEvidences.length > 0 && (
                        <div style={{ padding: '0 24px 16px', flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#fff',
                            background: theme.accent,
                            padding: '10px 20px',
                            display: 'inline-block',
                            borderRadius: '6px 6px 0 0',
                          }}>
                            الشواهد والأدلة ({allMediaEvidences.length})
                          </div>
                          <div style={{
                            border: `2px solid ${theme.borderColor || '#b8c9d9'}`,
                            borderTop: `2.5px solid ${theme.accent}`,
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '16px',
                            flexWrap: 'wrap' as const,
                            background: '#fafbfc',
                          }}>
                            {allMediaEvidences.map(ev => {
                              const qrData = ev.type === 'link' ? ev.link :
                                (ev.uploadedUrl || ev.fileName || '');
                              // عرض الصورة مباشرة إذا كانت متاحة (سواء base64 أو uploadedUrl)
                              const hasDirectImage = ev.type === 'image' && (
                                (ev.fileData && !ev.fileData.startsWith('idb://')) || ev.uploadedUrl
                              );
                              const imageSrc = ev.uploadedUrl || (ev.fileData && !ev.fileData.startsWith('idb://') ? ev.fileData : '');
                              // عرض كصورة إذا: displayAs === 'image' أو إذا لم يكن هناك uploadedUrl للباركود
                              const showAsImage = hasDirectImage && (ev.displayAs === 'image' || !ev.uploadedUrl);
                              // عرض باركود فقط إذا كان هناك رابط فعلي (uploadedUrl أو link)
                              const hasValidQR = ev.type === 'link' ? !!ev.link : !!ev.uploadedUrl;
                              const showAsQR = !showAsImage && hasValidQR;

                              return (
                                <div key={ev.id} style={{ textAlign: 'center', flex: showAsImage ? '1 1 auto' : '0 0 auto' }}>
                                  {showAsImage && imageSrc ? (
                                    <img
                                      src={imageSrc}
                                      alt={ev.fileName || 'شاهد'}
                                      style={{
                                        width: '100%',
                                        maxWidth: '320px',
                                        maxHeight: '260px',
                                        objectFit: 'contain' as const,
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: '#fff',
                                      }}
                                    />
                                  ) : showAsQR ? (
                                    <img
                                      src={generateQRDataURL(qrData || 'no-data', 10)}
                                      alt="QR"
                                      style={{
                                        width: '240px',
                                        height: '240px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: '#fff',
                                        padding: '8px',
                                      }}
                                    />
                                  ) : (
                                    /* إذا لم يكن هناك صورة أو رابط صالح - عرض رسالة */
                                    <div style={{
                                      width: '240px',
                                      height: '120px',
                                      border: '2px dashed #d1d5db',
                                      borderRadius: '6px',
                                      background: '#f9fafb',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexDirection: 'column' as const,
                                      gap: '8px',
                                      padding: '16px',
                                    }}>
                                      <span style={{ fontSize: '24px' }}>📎</span>
                                      <span style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                                        {ev.fileName || 'ملف مرفق'}
                                      </span>
                                      <span style={{ fontSize: '9px', color: '#9ca3af' }}>
                                        سجل الدخول لرفع الملف وتفعيل الباركود
                                      </span>
                                    </div>
                                  )}
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#444',
                                    maxWidth: showAsImage ? '320px' : '240px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap' as const,
                                    marginTop: '6px',
                                    fontWeight: 600,
                                  }}>
                                    {ev.type === 'link' ? (ev.link || '').substring(0, 40) : ev.fileName}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ========== التوقيعات - مطابق للهوية البصرية ========== */}
                      <div style={{ padding: '28px 32px 20px', marginTop: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '50%', padding: '0 20px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: theme.accent || '#1a3a5c', marginBottom: '12px' }}>التنفيذ: <span style={{ fontWeight: 700, color: '#1a1a1a' }}>أ/ {personalInfo.name || '..............................'}</span></div>
                                <div style={{ fontSize: '13px', color: '#555' }}>التوقيع: <span style={{ display: 'inline-block', width: '180px', borderBottom: `2px dotted ${theme.accent || '#1a3a5c'}`, verticalAlign: 'middle' }}>&nbsp;</span></div>
                              </td>
                              <td style={{ width: '50%', padding: '0 20px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: theme.accent || '#1a3a5c', marginBottom: '12px' }}>{personalInfo.evaluatorRole || 'مدير المدرسة'}: <span style={{ fontWeight: 700, color: '#1a1a1a' }}>أ/ {personalInfo.evaluator || '..............................'}</span></div>
                                <div style={{ fontSize: '13px', color: '#555' }}>التوقيع: <span style={{ display: 'inline-block', width: '180px', borderBottom: `2px dotted ${theme.accent || '#1a3a5c'}`, verticalAlign: 'middle' }}>&nbsp;</span></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      </div>{/* إغلاق المحتوى الرئيسي */}

                      {/* ========== الفوتر - لون واحد موحد ========== */}
                      <div style={{ marginTop: 'auto' }}>
                        {/* الشكل المنحني بلون واحد */}
                        <svg viewBox="0 0 800 50" preserveAspectRatio="none" style={{ width: '100%', height: '35px', display: 'block' }}>
                          <path d="M0,50 L0,35 C150,8 400,2 800,18 L800,50 Z" fill={theme.accent} />
                        </svg>
                        <div style={{
                          background: theme.accent,
                          padding: '6px 28px 10px',
                          fontSize: '11px',
                          color: '#fff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '-1px',
                        }}>
                          <span style={{ fontWeight: 700, letterSpacing: '0.3px' }}>SERS - نظام السجلات التعليمية الذكي</span>
                          <span style={{ opacity: 0.85, fontSize: '10px' }}>صفحة 1</span>
                        </div>
                      </div>

                    </div>{/* إغلاق pdf-page */}
                  </div>{/* إغلاق div التصدير */}
                  </div>{/* إغلاق حاوية scale */}
                  </div>{/* إغلاق wrapper بارتفاع محسوب */}
                  </div>{/* إغلاق حاوية العرض */}

                </motion.div>
                </div>{/* إغلاق div المركزي */}
              </motion.div>
            );
          })()}


          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 sm:mt-6 gap-2">
            {currentCriterionIndex > 0 ? (
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => setCurrentCriterionIndex(i => i - 1)}>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" /><span className="hidden sm:inline">البند السابق</span><span className="sm:hidden">السابق</span>
              </Button>
            ) : <div />}
            {currentCriterionIndex < allCriteria.length - 1 ? (
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => setCurrentCriterionIndex(i => i + 1)}>
                <span className="hidden sm:inline">البند التالي</span><span className="sm:hidden">التالي</span><ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              </Button>
            ) : (
              <Button size="sm" className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => setStep('final-review')}>
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />التقييم النهائي
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // ===== الخطوة 4: التقييم النهائي =====
  // ======================================================================
  if (step === 'final-review') {
    const grade = getGrade(percentage);
    return (
      <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep('dashboard')} className="text-xs sm:text-sm h-8 sm:h-9">
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" /><span className="hidden sm:inline">العودة للبنود</span><span className="sm:hidden">رجوع</span>
            </Button>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={saveReport} disabled={isSaving} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                {isSaving ? "جاري..." : "حفظ"}
              </Button>
              {isAuthenticated && portfolio.id && (
                <Button variant="outline" size="sm" onClick={portfolio.submitForReview} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 text-teal-600 border-teal-200 hover:bg-teal-50">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">تقديم للمراجعة</span><span className="sm:hidden">تقديم</span>
                </Button>
              )}
              <Button size="sm" onClick={() => setStep('preview')} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">معاينة وتصدير</span><span className="sm:hidden">معاينة</span>
              </Button>
              <div className="relative">
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={handleShareLink} disabled={isSharing} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 text-blue-600 border-blue-200 hover:bg-blue-50">
                    {isSharing ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    <span className="hidden sm:inline">{isSharing ? 'جاري...' : 'مشاركة'}</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowShareSettings(!showShareSettings)} className="h-8 w-8 p-0">
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {showShareSettings && (
                  <div className="absolute top-full mt-1 left-0 bg-background border border-border rounded-lg shadow-lg p-3 z-20 min-w-[200px]">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">مدة الصلاحية (بالأيام)</label>
                    <select value={shareExpiryDays} onChange={(e) => setShareExpiryDays(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-md border border-input text-sm bg-background">
                      <option value={1}>1 يوم</option>
                      <option value={3}>3 أيام</option>
                      <option value={7}>7 أيام</option>
                      <option value={14}>14 يوم</option>
                      <option value={30}>30 يوم</option>
                      <option value={90}>90 يوم</option>
                      <option value={365}>سنة</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">ينتهي الرابط بعد {shareExpiryDays} يوم من إنشائه</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ملخص التقييم */}
          <Card className="mb-5">
            <CardContent className="p-4 sm:p-6 text-center">
              <h1 className="text-lg sm:text-2xl font-black text-foreground mb-3 sm:mb-4" style={{ fontFamily: "var(--font-heading)" }}>ملخص التقييم النهائي</h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <div>
                  <div className="text-3xl sm:text-5xl font-black" style={{ color: grade.color }}>{percentage}%</div>
                  <div className="text-base sm:text-lg font-bold mt-1" style={{ color: grade.color }}>{grade.label}</div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">المجموع: <strong className="text-foreground">{totalScore}</strong> من <strong className="text-foreground">{maxScore}</strong></p>
                  <p className="text-xs sm:text-sm text-muted-foreground">الوظيفة: <strong className="text-foreground">{selectedJob?.title}</strong></p>
                  <p className="text-xs sm:text-sm text-muted-foreground">الاسم: <strong className="text-foreground">{personalInfo.name || '—'}</strong></p>
                  {indicatorsCoverage && (
                    <p className="text-xs sm:text-sm text-muted-foreground">المؤشرات: <strong className="text-foreground">{indicatorsCoverage.covered}/{indicatorsCoverage.total}</strong></p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول البنود */}
          <Card className="mb-5 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '500px' }}>
              <thead className="bg-muted">
                <tr>
                  <th className="text-right text-xs font-bold text-muted-foreground p-2 sm:p-3 whitespace-nowrap" style={{ width: '40px' }}>م</th>
                  <th className="text-right text-xs font-bold text-muted-foreground p-2 sm:p-3">البند</th>
                  <th className="text-center text-xs font-bold text-muted-foreground p-2 sm:p-3 whitespace-nowrap" style={{ width: '70px' }}>الدرجة</th>
                  <th className="text-center text-xs font-bold text-muted-foreground p-2 sm:p-3 whitespace-nowrap" style={{ width: '65px' }}>الشواهد</th>
                  <th className="text-center text-xs font-bold text-muted-foreground p-2 sm:p-3 whitespace-nowrap" style={{ width: '60px' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {allCriteria.map((c, i) => {
                  const d = criteriaData[c.id];
                  const evCount = d?.evidences.length || 0;
                  const status = (d?.score || 0) >= 4 && evCount > 0 ? "complete" : evCount > 0 || (d?.score || 0) > 0 ? "partial" : "missing";
                  return (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => { setCurrentCriterionIndex(i); setStep('criterion-detail'); }}>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">{i + 1}</td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-foreground leading-relaxed">{c.title}</td>
                      <td className="p-2 sm:p-3 text-center">
                        <Badge variant={((d?.score || 0) >= 4) ? "default" : ((d?.score || 0) >= 3) ? "secondary" : "outline"} className="text-[10px] sm:text-xs">
                          {d?.score || 0}/{c.maxScore}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm text-muted-foreground">{evCount}</td>
                      <td className="p-2 sm:p-3 text-center">
                        {status === "complete" && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 mx-auto" />}
                        {status === "partial" && <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 mx-auto" />}
                        {status === "missing" && <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 mx-auto" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </Card>

          {/* اختيار الثيم */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">اختر ثيم التصدير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* القوالب الأساسية */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-2 font-medium">القوالب المتاحة:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {allThemes.map((t) => {
                    const isSelected = selectedTheme.id === t.id;
                    const isInkSaver = t.id === 'builtin-ink-saver';
                    return (
                      <button key={t.id}
                        onClick={() => setSelectedTheme(t)}
                        className={`relative group rounded-lg border-2 p-0 overflow-hidden transition-all duration-200 text-right ${
                          isSelected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-primary/40 hover:shadow-sm'
                        }`}
                      >
                        {/* معاينة مصغرة للقالب */}
                        <div className="h-16 w-full relative" style={{ background: t.headerBg === '#ffffff' ? '#f8fafb' : t.headerBg }}>
                          {/* شريط علوي يمثل الترويسة */}
                          <div className="h-5 w-full flex items-center justify-center gap-1" style={{ background: t.headerBg === '#ffffff' ? '#f0f4f8' : t.headerBg }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
                            <div className="w-8 h-1 rounded-full" style={{ background: t.headerText === '#ffffff' ? 'rgba(255,255,255,0.5)' : `${t.accent}40` }} />
                          </div>
                          {/* عنوان التقرير */}
                          <div className="px-1.5 pt-1">
                            <div className="h-1.5 rounded-full mb-1" style={{ background: t.titleBg, width: '60%' }} />
                            {/* حقول مصغرة */}
                            <div className="flex gap-0.5">
                              <div className="flex-1 h-1 rounded-full" style={{ background: `${t.accent}20` }} />
                              <div className="flex-1 h-1 rounded-full" style={{ background: `${t.accent}15` }} />
                            </div>
                            <div className="flex gap-0.5 mt-0.5">
                              <div className="flex-1 h-1 rounded-full" style={{ background: `${t.accent}20` }} />
                              <div className="flex-1 h-1 rounded-full" style={{ background: `${t.accent}15` }} />
                            </div>
                          </div>
                          {/* شريط سفلي */}
                          {t.showBottomBar && <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: t.footerBg }} />}
                        </div>
                        {/* اسم القالب */}
                        <div className={`px-2 py-1.5 text-[10px] font-semibold flex items-center gap-1 ${
                          isSelected ? 'bg-primary/5 text-primary' : 'bg-background text-foreground'
                        }`}>
                          {t.id.startsWith('db-') && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.accent }} />}
                          {isInkSaver && <span className="text-[8px]">🖨️</span>}
                          <span className="truncate">{t.name}</span>
                          {isSelected && <span className="mr-auto text-primary">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* حفظ الثيم المخصص */}
              {isAuthenticated && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Save className="w-4 h-4 text-primary" />ثيماتي المحفوظة
                      </h4>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                        onClick={() => setShowSaveThemeDialog(!showSaveThemeDialog)}>
                        <Plus className="w-3 h-3" />حفظ الثيم الحالي
                      </Button>
                    </div>

                    {showSaveThemeDialog && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
                        <input
                          type="text"
                          value={newThemeNameInput}
                          onChange={(e) => setNewThemeNameInput(e.target.value)}
                          placeholder="اسم الثيم المخصص..."
                          className="flex-1 px-3 py-1.5 rounded-md border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (!newThemeNameInput.trim()) { toast.error('يرجى إدخال اسم للثيم'); return; }
                              createUserThemeMut.mutateAsync({
                                name: newThemeNameInput.trim(),
                                themeData: { ...selectedTheme },
                              }).then(() => {
                                toast.success('تم حفظ الثيم بنجاح');
                                setNewThemeNameInput('');
                                setShowSaveThemeDialog(false);
                                trpcUtils.userThemes.list.invalidate();
                              }).catch(() => toast.error('فشل حفظ الثيم'));
                            }
                          }}
                        />
                        <Button size="sm" className="h-8" onClick={() => {
                          if (!newThemeNameInput.trim()) { toast.error('يرجى إدخال اسم للثيم'); return; }
                          createUserThemeMut.mutateAsync({
                            name: newThemeNameInput.trim(),
                            themeData: { ...selectedTheme },
                          }).then(() => {
                            toast.success('تم حفظ الثيم بنجاح');
                            setNewThemeNameInput('');
                            setShowSaveThemeDialog(false);
                            trpcUtils.userThemes.list.invalidate();
                          }).catch(() => toast.error('فشل حفظ الثيم'));
                        }}
                          disabled={createUserThemeMut.isPending}>
                          {createUserThemeMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowSaveThemeDialog(false)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {userThemesQuery.data && userThemesQuery.data.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userThemesQuery.data.map((ut: any) => {
                          const td = ut.themeData || {};
                          return (
                            <div key={ut.id} className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1">
                              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: td.accent || '#1a3a5c' }} />
                              <Button variant="ghost" size="sm" className="text-xs h-6 px-1.5"
                                onClick={() => {
                                  setSelectedTheme({ ...DEFAULT_THEME, ...td });
                                  toast.success('تم تحميل الثيم المحفوظ');
                                }}>
                                {ut.name}
                              </Button>
                              <button type="button" className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
                                onClick={() => {
                                  deleteUserThemeMut.mutateAsync({ id: ut.id }).then(() => {
                                    toast.success('تم حذف الثيم');
                                    trpcUtils.userThemes.list.invalidate();
                                  }).catch(() => toast.error('فشل حذف الثيم'));
                                }}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">لم تحفظ أي ثيمات مخصصة بعد. اختر ثيم وعدّله ثم احفظه لاستخدامه لاحقاً.</p>
                    )}
                  </div>
              )}
              {/* خيارات الباركود */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-primary" />خيارات الباركود
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                      onClick={() => {
                        setCriteriaData(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(k => {
                            updated[k] = { ...updated[k], evidences: updated[k].evidences.map(e => ({ ...e, showBarcode: true })) };
                          });
                          return updated;
                        });
                        toast.success('تم تفعيل الباركود لجميع الشواهد');
                      }}>
                      <CheckCircle className="w-3 h-3" />تفعيل الكل
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                      onClick={() => {
                        setCriteriaData(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(k => {
                            updated[k] = { ...updated[k], evidences: updated[k].evidences.map(e => ({ ...e, showBarcode: false })) };
                          });
                          return updated;
                        });
                        toast.success('تم تعطيل الباركود لجميع الشواهد');
                      }}>
                      <XCircle className="w-3 h-3" />تعطيل الكل
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">يمكنك التحكم في ظهور الباركود لكل شاهد على حدة من صفحة البند، أو تفعيل/تعطيل الكل من هنا</p>
              </div>

              {/* خيارات عرض الصور */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Image className="w-4 h-4 text-primary" />عرض شواهد الصور
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                      onClick={() => {
                        setCriteriaData(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(k => {
                            updated[k] = { ...updated[k], evidences: updated[k].evidences.map(e => e.type === 'image' ? { ...e, displayAs: 'image' as const } : e) };
                          });
                          return updated;
                        });
                        toast.success('تم تحويل جميع الصور لعرض كصور واضحة');
                      }}>
                      <Image className="w-3 h-3" />عرض كصور
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                      onClick={async () => {
                        // جمع كل الصور التي ليس لها uploadedUrl ورفعها أولاً
                        const allImageEvs: { criterionId: string; ev: EvidenceItem }[] = [];
                        Object.entries(criteriaData).forEach(([cId, cData]) => {
                          cData.evidences.filter(e => e.type === 'image' && !e.uploadedUrl && e.fileData).forEach(ev => {
                            allImageEvs.push({ criterionId: cId, ev });
                          });
                        });
                        if (allImageEvs.length > 0) {
                          toast.loading(`جاري رفع ${allImageEvs.length} صورة لإنشاء الباركود...`, { id: 'bulk-qr-upload' });
                          for (const { criterionId: cId, ev } of allImageEvs) {
                            try {
                              let base64Data = ev.fileData!;
                              if (base64Data.startsWith('idb://')) {
                                const { getFileFromIDB } = await import('@/hooks/useIndexedDB');
                                const stored = await getFileFromIDB(base64Data.replace('idb://', ''));
                                if (stored?.data) base64Data = stored.data;
                                else continue;
                              }
                              const base64Only = base64Data.split(',')[1] || base64Data;
                              const mimeType = base64Data.match(/data:([^;]+)/)?.[1] || 'image/png';
                              const result = await uploadFileMutation.mutateAsync({
                                fileName: ev.fileName || 'image.png',
                                mimeType,
                                base64Data: base64Only,
                              });
                              if (result.url) {
                                updateEvidence(cId, ev.id, { uploadedUrl: result.url });
                              }
                            } catch { /* skip */ }
                          }
                          toast.success(`تم رفع ${allImageEvs.length} صورة بنجاح`, { id: 'bulk-qr-upload' });
                        }
                        setCriteriaData(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(k => {
                            updated[k] = { ...updated[k], evidences: updated[k].evidences.map(e => e.type === 'image' ? { ...e, displayAs: 'qr' as const } : e) };
                          });
                          return updated;
                        });
                        toast.success('تم تحويل جميع الصور لعرض كباركود QR');
                      }}>
                      <QrCode className="w-3 h-3" />عرض كباركود
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">اختر طريقة عرض شواهد الصور: كصور واضحة أو كباركود QR. يمكنك أيضاً تغيير كل شاهد على حدة من صفحة البند</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ======================================================================
  // ===== الخطوة 5: المعاينة والتصدير =====
  // ======================================================================
  if (step === 'preview') {
    const grade = getGrade(percentage);
    const theme = selectedTheme;
    const MOE_LOGO = getMoeLogoUrl();
    const deptLines = (personalInfo.department || '').split('\n').filter((l: string) => l.trim());
    const filteredDeptLines = deptLines.filter((l: string) => {
      const trimmed = l.trim();
      if (trimmed === 'المملكة العربية السعودية') return false;
      if (trimmed === 'وزارة التعليم') return false;
      if (personalInfo.school && trimmed === personalInfo.school.trim()) return false;
      return true;
    });
    return (
      <div className="min-h-screen bg-muted p-2 sm:p-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4 bg-background rounded-xl p-2 sm:p-4 shadow-sm border border-border sticky top-2 z-10 gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 shrink-0" onClick={() => setStep('final-review')}>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" /><span className="hidden sm:inline">العودة</span><span className="sm:hidden">رجوع</span>
            </Button>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-end items-center">
              {/* قائمة القوالب */}
              <div className="relative">
                <button className="flex items-center gap-1.5 text-xs h-8 sm:h-9 px-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  onClick={(e) => { const el = e.currentTarget.nextElementSibling; if (el) el.classList.toggle('hidden'); }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedTheme.accent }} />
                  <span className="hidden sm:inline">{selectedTheme.name}</span>
                  <span className="sm:hidden">القالب</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                <div className="hidden absolute top-10 left-0 sm:left-auto sm:right-0 z-50 bg-white rounded-xl shadow-2xl border p-2 w-72 max-h-80 overflow-y-auto">
                  <p className="text-[9px] text-gray-400 px-1 mb-1.5">اختر القالب:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {allThemes.map(t => {
                      const isSel = selectedTheme.id === t.id;
                      return (
                        <button key={t.id} onClick={(e) => { setSelectedTheme(t); const parent = (e.currentTarget as HTMLElement).closest('.grid')?.parentElement; if (parent) parent.classList.add('hidden'); }}
                          className={`rounded-md border overflow-hidden text-right transition-all ${isSel ? 'border-primary ring-1 ring-primary/30 shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}>
                          <div className="h-12 w-full relative" style={{ background: t.headerBg === '#ffffff' ? '#f8fafb' : t.headerBg }}>
                            <div className="h-3.5 w-full flex items-center justify-center gap-0.5" style={{ background: t.headerBg === '#ffffff' ? '#f0f4f8' : t.headerBg }}>
                              <div className="w-2 h-2 rounded-full bg-white/60" />
                              <div className="w-6 h-0.5 rounded-full" style={{ background: t.headerText === '#ffffff' ? 'rgba(255,255,255,0.5)' : `${t.accent}40` }} />
                            </div>
                            <div className="px-1 pt-0.5">
                              <div className="h-1 rounded-full mb-0.5" style={{ background: t.titleBg, width: '55%' }} />
                              <div className="flex gap-0.5">
                                <div className="flex-1 h-0.5 rounded-full" style={{ background: `${t.accent}20` }} />
                                <div className="flex-1 h-0.5 rounded-full" style={{ background: `${t.accent}15` }} />
                              </div>
                            </div>
                            {t.showBottomBar && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: t.footerBg }} />}
                          </div>
                          <div className={`px-1.5 py-1 text-[9px] font-medium flex items-center gap-1 ${isSel ? 'bg-primary/5 text-primary' : 'text-gray-700'}`}>
                            <span className="truncate">{t.name}</span>
                            {isSel && <span className="mr-auto text-primary text-[8px]">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* زر لوحة الألوان */}
              <div className="relative">
                <Button size="sm" variant="outline" className={`gap-1 text-xs h-8 sm:h-9 ${showColorPicker ? 'bg-[#1a5f3f] text-white' : ''}`} onClick={() => setShowColorPicker(!showColorPicker)}>
                  <Palette className="w-3.5 h-3.5" /><span className="hidden sm:inline">الألوان</span>
                </Button>
                {showColorPicker && (
                  <div className="absolute top-10 left-0 sm:left-auto sm:right-0 z-50 bg-white rounded-xl shadow-2xl border p-3 sm:p-4 w-[calc(100vw-2rem)] sm:w-72 max-w-72" dir="rtl" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800">تخصيص الألوان</h4>
                      <button onClick={() => setShowColorPicker(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">اختر لون موحد للقالب</label>
                        <p className="text-[10px] text-gray-400 mb-2">اللون المختار يُطبق على جميع عناصر القالب</p>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="color" value={selectedTheme.accent} onChange={(e) => { const c = e.target.value; setSelectedTheme(prev => ({ ...prev, accent: c, borderColor: c, titleBg: c, fieldLabelBg: prev.fieldLabelBg === '#f0f4f8' || prev.fieldLabelBg === '#f0f7f4' ? prev.fieldLabelBg : c, footerBg: c, headerBg: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? prev.headerBg : c, headerText: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? c : '#ffffff', coverAccent2: c })); }} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                          <div>
                            <span className="text-xs font-mono text-gray-600 block">{selectedTheme.accent}</span>
                            <span className="text-[10px] text-gray-400">اضغط لاختيار لون مخصص</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">ألوان سريعة</label>
                        {/* لون تدرج الهوية البصرية */}
                        <button
                          title="تدرج الهوية البصرية"
                          onClick={() => { setSelectedTheme(prev => ({ ...prev, accent: '#1a6b6a', borderColor: '#2ea87a', titleBg: '#1a6b6a', fieldLabelBg: prev.fieldLabelBg === '#f0f4f8' || prev.fieldLabelBg === '#f0f7f4' ? prev.fieldLabelBg : '#1a6b6a', footerBg: '#1a6b6a', headerBg: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? prev.headerBg : '#1a6b6a', headerText: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? '#1a6b6a' : '#ffffff', coverAccent2: '#5bb784' })); }}
                          className={`w-full mb-2 h-8 rounded-lg border-2 shadow-sm hover:scale-[1.02] transition-transform ${selectedTheme.accent === '#1a6b6a' && selectedTheme.coverAccent2 === '#5bb784' ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-white'}`}
                          style={{ background: 'linear-gradient(to left, #1a6b6a, #2ea87a, #5bb784)' }}
                        />
                        <p className="text-[9px] text-gray-400 mb-2 text-center">تدرج الهوية البصرية (3 ألوان)</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { name: 'أزرق داكن', accent: '#1a3a5c' },
                            { name: 'تيل', accent: '#0d7377' },
                            { name: 'كحلي', accent: '#1e3a5f' },
                            { name: 'بنفسجي', accent: '#5b21b6' },
                            { name: 'عنابي', accent: '#7f1d1d' },
                            { name: 'ذهبي', accent: '#8B6914' },
                            { name: 'برتقالي', accent: '#c2410c' },
                          ].map(preset => (
                            <button key={preset.name} title={preset.name} onClick={() => { const c = preset.accent; setSelectedTheme(prev => ({ ...prev, accent: c, borderColor: c, titleBg: c, fieldLabelBg: prev.fieldLabelBg === '#f0f4f8' || prev.fieldLabelBg === '#f0f7f4' ? prev.fieldLabelBg : c, footerBg: c, headerBg: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? prev.headerBg : c, headerText: prev.headerBg === '#ffffff' || prev.headerBg === '#f8f9fa' ? c : '#ffffff', coverAccent2: c })); }}
                              className={`w-7 h-7 rounded-full border-2 shadow-sm hover:scale-110 transition-transform ${selectedTheme.accent === preset.accent ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-white'}`} style={{ background: preset.accent }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{isExporting ? (pdfProgress.total > 0 ? `تصدير ${pdfProgress.current}/${pdfProgress.total}` : 'جاري التصدير...') : 'تحميل PDF'}</span>
                <span className="sm:hidden">PDF</span>
              </Button>

              {/* زر تصدير متعدد */}
              <div className="relative">
                <Button size="sm" variant="outline" onClick={() => setShowMultiExport(!showMultiExport)} disabled={isMultiExporting} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
                  {isMultiExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  <span className="hidden sm:inline">{isMultiExporting ? `تصدير ${multiExportProgress.current}/${multiExportProgress.total}` : 'تصدير متعدد'}</span>
                  <span className="sm:hidden">متعدد</span>
                </Button>
                {showMultiExport && (
                  <div className="absolute top-10 left-0 z-50 bg-white rounded-xl shadow-2xl border p-4 w-80 max-h-96 overflow-y-auto" dir="rtl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800">تصدير متعدد التقارير</h4>
                      <button onClick={() => setShowMultiExport(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3">اختر البنود المراد تصديرها في ملف PDF واحد</p>
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setMultiExportSelected(new Set(allCriteria.map(c => c.id)))}>تحديد الكل</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setMultiExportSelected(new Set())}>إلغاء الكل</Button>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {allCriteria.map((c, i) => {
                        const evCount = criteriaData[c.id]?.evidences.length || 0;
                        return (
                          <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={multiExportSelected.has(c.id)}
                              onChange={(e) => {
                                const next = new Set(multiExportSelected);
                                if (e.target.checked) next.add(c.id); else next.delete(c.id);
                                setMultiExportSelected(next);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                            <span className="text-xs text-gray-700 flex-1 leading-relaxed">{i + 1}. {c.title}</span>
                            <span className="text-[10px] text-gray-400">{evCount} شاهد</span>
                          </label>
                        );
                      })}
                    </div>
                    <Button size="sm" className="w-full gap-1.5" onClick={handleMultiExportPDF} disabled={isMultiExporting || multiExportSelected.size === 0}>
                      {isMultiExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      تصدير {multiExportSelected.size} بند في PDF واحد
                    </Button>
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => printElement('preview-content')} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">طباعة</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleShareLink} disabled={isSharing} className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 text-blue-600 border-blue-200 hover:bg-blue-50">
                {isSharing ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{isSharing ? 'جاري...' : 'مشاركة'}</span>
              </Button>
            </div>
          </div>

          {/* رابط المشاركة */}
          {shareUrl && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-800 mb-0.5">رابط العرض الإلكتروني</p>
                  <p className="text-xs text-blue-600 truncate" dir="ltr">{shareUrl}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('تم نسخ الرابط!'); }}>
                  <Copy className="w-3 h-3" />نسخ
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.open(shareUrl, '_blank')}>
                  <Globe className="w-3 h-3" />فتح
                </Button>
              </div>
            </div>
          )}

          {/* أزرار التكبير/التصغير */}
          <div className="flex items-center justify-center gap-1.5 mb-3" data-no-print>
            <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5">
              <button onClick={fullZoomOut} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="تصغير">
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-2 min-w-[3.5rem] text-center">
                <span className="text-xs font-mono text-gray-700 font-medium">{fullZoomLevel}%</span>
              </div>
              <button onClick={fullZoomIn} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="تكبير">
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <div className="w-px h-5 bg-gray-200 mx-0.5" />
              <button onClick={fullResetZoom} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="إعادة الحجم الأصلي">
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
          <div ref={fullPreviewContainerRef} className="preview-wrapper" style={{ overflow: 'hidden' }}>
          <div style={{ width: fullWrapperWidth, margin: '0 auto', transformOrigin: 'top center' }}>
          <div id="preview-content" style={{ fontFamily: "'Cairo', sans-serif", width: `${A4_WIDTH_PX}px`, transformOrigin: 'top right', transform: `scale(${fullPreviewScale})` }}>
            {/* === صفحة الغلاف - تتغير حسب coverStyle === */}
            {(() => {
              const cs = theme.coverStyle || 'gradient-center';
              const a2 = theme.coverAccent2 || theme.accent;
              // ترويسة رسمية للغلاف - مطابقة للصفحات الداخلية (المملكة + وزارة التعليم + الإدارة + شعار)
              const coverOfficialHeader = (
                <div style={{ background: `linear-gradient(to left, ${theme.accent}, ${a2})`, padding: '14px 24px 10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                          <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>المملكة العربية السعودية</div>
                          <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                          {filteredDeptLines.map((line: string, i: number) => (
                            <div key={i} style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0', letterSpacing: '0.3px' }}>{line}</div>
                          ))}
                          {personalInfo.school && (
                            <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{personalInfo.school}</div>
                          )}
                        </td>
                        <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                          <div style={{ width: '2px', height: '55px', background: 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
                        </td>
                        <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                          <img src={MOE_LOGO} alt="شعار وزارة التعليم" style={{ height: '60px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </td>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                          {personalInfo.extraLogo && (
                            <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '50px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div style={{ textAlign: 'left' }}>
                            {personalInfo.semester && <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`الفصل الدراسي: ${personalInfo.semester}`}</div>}
                            {personalInfo.year && <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`العام الدراسي: ${personalInfo.year}`}</div>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );

              const coverContent = (
                <>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', fontFamily: "'Cairo', sans-serif", letterSpacing: '-0.01em' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'}</h1>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, opacity: 0.95, marginBottom: '0.5rem' }}>{selectedJob?.title}</p>
                  <div style={{ width: '50px', height: '2px', background: 'rgba(255,255,255,0.25)', margin: '1rem auto' }} />
                  <p style={{ fontSize: '1rem', opacity: 0.85 }}>{personalInfo.year} - {personalInfo.semester}</p>
                  <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '3rem', fontSize: '0.9rem', opacity: 0.9 }}>
                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.3rem' }}>الاسم</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{personalInfo.name || '—'}</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.3rem' }}>المدرسة</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{personalInfo.school || '—'}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '4rem', fontSize: '0.7rem', opacity: 0.5 }}>نظام SERS - السجلات التعليمية الذكية</div>
                </>
              );

              // === غلاف 1: متدرج مركزي (الافتراضي) ===
              if (cs === 'gradient-center') return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                  {coverOfficialHeader}
                  <div style={{ background: theme.headerBg, color: theme.headerText, padding: '3rem 2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: 'calc(297mm - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '12px', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>{coverContent}</div>
                  </div>
                </div>
              );

              // === غلاف 2: مقسوم يسار (شريط جانبي ملون + محتوى أبيض) ===
              if (cs === 'split-left') return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                  {coverOfficialHeader}
                  <div style={{ display: 'flex', minHeight: 'calc(297mm - 80px)' }}>
                  <div style={{ width: '35%', background: theme.headerBg, minHeight: '297mm', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: theme.headerText }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', background: `linear-gradient(to bottom, ${a2}, ${theme.accent})`, height: '100%' }} />
                    <div style={{ fontSize: '4rem', fontWeight: 900, opacity: 0.15, position: 'absolute', top: '3rem', fontFamily: "'Cairo'" }}>SERS</div>
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.3)', margin: '1.5rem auto' }} />
                      <div style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 600 }}>{personalInfo.year}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>{personalInfo.semester}</div>
                    </div>
                  </div>
                  <div style={{ width: '65%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem', color: theme.borderColor }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', fontFamily: "'Cairo', sans-serif", color: theme.accent }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'}</h1>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: theme.borderColor, marginBottom: '2rem' }}>{selectedJob?.title}</p>
                    <div style={{ width: '60px', height: '3px', background: theme.accent, marginBottom: '2rem' }} />
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <div><div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.2rem' }}>الاسم</div><div style={{ fontWeight: 700, fontSize: '1rem' }}>{personalInfo.name || '—'}</div></div>
                      <div><div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.2rem' }}>المدرسة</div><div style={{ fontWeight: 700, fontSize: '1rem' }}>{personalInfo.school || '—'}</div></div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginTop: '2rem' }}>{personalInfo.semester}</p>
                    <div style={{ marginTop: '4rem', fontSize: '0.65rem', color: '#D1D5DB' }}>نظام SERS - السجلات التعليمية الذكية</div>
                  </div>
                  </div>
                </div>
              );

              // === غلاف 3: قطري (شريط علوي مائل + محتوى أبيض) ===
              if (cs === 'diagonal') return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                  {coverOfficialHeader}
                  <div style={{ background: theme.headerBg, height: '40%', position: 'absolute', top: '80px', left: 0, right: 0, clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)' }} />
                  <div style={{ position: 'relative', zIndex: 1, minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '4rem' }}>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: `2px solid ${theme.accent}20`, maxWidth: '500px', margin: '0 auto' }}>
                      <div style={{ width: '60px', height: '4px', background: `linear-gradient(to left, ${theme.accent}, ${a2})`, margin: '0 auto 1.5rem', borderRadius: '2px' }} />
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '0.75rem' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'}</h1>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.borderColor, marginBottom: '1.5rem' }}>{selectedJob?.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.85rem', color: '#6B7280' }}>
                        <div><strong style={{ color: theme.accent }}>{personalInfo.name || '—'}</strong></div>
                        <div style={{ color: '#D1D5DB' }}>|</div>
                        <div><strong style={{ color: theme.accent }}>{personalInfo.school || '—'}</strong></div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '1rem' }}>{personalInfo.year} - {personalInfo.semester}</p>
                    </div>
                    <div style={{ marginTop: '3rem', fontSize: '0.65rem', color: '#9CA3AF' }}>نظام SERS - السجلات التعليمية الذكية</div>
                  </div>
                </div>
              );

              // === غلاف 4: إطار أنيق (خلفية فاتحة + إطار مزدوج) ===
              if (cs === 'framed-elegant') return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', background: `${theme.accent}08`, border: `2px solid ${theme.accent}` }}>
                  {coverOfficialHeader}
                  <div style={{ position: 'absolute', top: '100px', left: '20px', right: '20px', bottom: '20px', border: `2px solid ${theme.accent}`, borderRadius: '4px', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '28px', left: '28px', right: '28px', bottom: '28px', border: `1px solid ${theme.accent}40`, borderRadius: '4px', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', zIndex: 1, minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5rem 4rem', textAlign: 'center', color: theme.accent }}>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF', letterSpacing: '0.2em', marginBottom: '0.3rem' }}>المملكة العربية السعودية</div>
                    <div style={{ fontSize: '0.95rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.5rem' }}>وزارة التعليم</div>
                    {personalInfo.department && <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '1.5rem', lineHeight: 1.7, whiteSpace: 'pre-line' as const }}>{personalInfo.department}</p>}
                    <div style={{ width: '100px', height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${a2})`, margin: '0 auto 2rem', borderRadius: '2px' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', fontFamily: "'Cairo', sans-serif" }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'}</h1>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, color: theme.borderColor, marginBottom: '0.5rem' }}>{selectedJob?.title}</p>
                    <div style={{ width: '100px', height: '3px', background: `linear-gradient(to left, ${a2}, ${theme.accent})`, margin: '2rem auto', borderRadius: '2px' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '1rem' }}>
                      <div style={{ padding: '1rem 2rem', border: `1px solid ${theme.accent}30`, borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: '0.2rem' }}>الاسم</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{personalInfo.name || '—'}</div>
                      </div>
                      <div style={{ padding: '1rem 2rem', border: `1px solid ${theme.accent}30`, borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginBottom: '0.2rem' }}>المدرسة</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{personalInfo.school || '—'}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginTop: '2rem' }}>{personalInfo.year} - {personalInfo.semester}</p>
                    <div style={{ position: 'absolute', bottom: '3rem', left: 0, right: 0, fontSize: '0.65rem', color: '#D1D5DB' }}>نظام SERS - السجلات التعليمية الذكية</div>
                  </div>
                </div>
              );

              // === غلاف 5: شريط علوي (شريط عريض أعلى + محتوى أبيض) ===
              if (cs === 'top-bar') return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                  {coverOfficialHeader}
                  <div style={{ height: '4px', background: `linear-gradient(to left, ${theme.accent}, ${a2})` }} />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '5rem 3rem', minHeight: 'calc(297mm - 120px)', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '3px', background: theme.accent, marginBottom: '2rem', borderRadius: '2px' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '1rem' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'}</h1>
                    <p style={{ fontSize: '1.3rem', fontWeight: 700, color: theme.borderColor, marginBottom: '2rem' }}>{selectedJob?.title}</p>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                      <div style={{ borderBottom: `2px solid ${theme.accent}`, paddingBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>الاسم</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1F2937' }}>{personalInfo.name || '—'}</div>
                      </div>
                      <div style={{ borderBottom: `2px solid ${theme.accent}`, paddingBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>المدرسة</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1F2937' }}>{personalInfo.school || '—'}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginTop: '2rem' }}>{personalInfo.year} - {personalInfo.semester}</p>
                    <div style={{ marginTop: '4rem', fontSize: '0.65rem', color: '#D1D5DB' }}>نظام SERS - السجلات التعليمية الذكية</div>
                  </div>
                </div>
              );

              // === غلاف 6: خط بسيط (minimal) ===
              return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                  {coverOfficialHeader}
                  <div style={{ minHeight: 'calc(297mm - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 4rem', textAlign: 'center' }}>
                    <div style={{ width: '1px', height: '60px', background: theme.accent, margin: '1.5rem auto' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '0.75rem' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'}</h1>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#6B7280', marginBottom: '1rem' }}>{selectedJob?.title}</p>
                    <div style={{ width: '1px', height: '60px', background: theme.accent, margin: '1.5rem auto' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', color: '#4B5563' }}>
                      <div><span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>الاسم: </span><strong>{personalInfo.name || '—'}</strong></div>
                      <div><span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>المدرسة: </span><strong>{personalInfo.school || '—'}</strong></div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '1.5rem' }}>{personalInfo.year} - {personalInfo.semester}</p>
                    <div style={{ position: 'absolute', bottom: '3rem', left: 0, right: 0, fontSize: '0.65rem', color: '#D1D5DB' }}>نظام SERS - السجلات التعليمية الذكية</div>
                  </div>
                </div>
              );
            })()}

            {/* === صفحة فهرس المحتويات + البيانات الشخصية === */}
            <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const, border: `2px solid ${theme.accent}` }}>
              <div style={{ flex: 1, padding: '2rem 2.5rem' }}>
{/* ترويسة الصفحة - Full Width من الحافة للحافة */}
                <div style={{ marginBottom: '16px', margin: '0 -2.5rem 16px -2.5rem', marginTop: '-2rem' }}>
                <div style={{ background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, padding: '12px 24px 10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>المملكة العربية السعودية</div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                          {filteredDeptLines.map((line: string, li: number) => (
                            <div key={li} style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{line}</div>
                          ))}
                          {personalInfo.school && (
                            <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{personalInfo.school}</div>
                          )}
                        </td>
                        <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                          <div style={{ width: '2px', height: '50px', background: 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
                        </td>
                        <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                          <img src={MOE_LOGO} alt="شعار وزارة التعليم" style={{ height: '55px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </td>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                          {personalInfo.extraLogo && (
                            <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '45px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div style={{ textAlign: 'left' }}>
                            {personalInfo.semester && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`الفصل الدراسي: ${personalInfo.semester}`}</div>}
                            {personalInfo.year && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`العام الدراسي: ${personalInfo.year}`}</div>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* فهرس المحتويات */}
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: theme.accent, display: 'inline-block' }} />
                فهرس المحتويات
              </h2>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#4B5563', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}>
                  <span style={{ fontWeight: 700, color: theme.accent, minWidth: '20px' }}>1</span>
                  <span>البيانات الشخصية</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#4B5563', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}>
                  <span style={{ fontWeight: 700, color: theme.accent, minWidth: '20px' }}>2</span>
                  <span>جدول التقييم</span>
                </div>
                {allCriteria.map((c, i) => {
                  const d = criteriaData[c.id];
                  const evCount = d?.evidences.length || 0;
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: evCount > 0 ? '#4B5563' : '#9CA3AF', padding: '0.5rem 0', borderBottom: '1px dashed #E5E7EB' }}>
                      <span style={{ fontWeight: 700, color: evCount > 0 ? theme.accent : '#D1D5DB', minWidth: '20px' }}>{i + 3}</span>
                      <span style={{ flex: 1 }}>{c.title}</span>
                      {evCount > 0 ? (
                        <span style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '9999px', backgroundColor: `${theme.accent}15`, color: theme.accent, fontWeight: 600 }}>{evCount} شاهد</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#D1D5DB' }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              </div>{/* إغلاق flex:1 للفهرس */}
              {/* الشريط السفلي المتدرج */}
              {theme.showBottomBar !== false && (
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, margin: '0 2.5rem' }} />
                  <div style={{ padding: '8px 2.5rem', fontSize: '10px', color: theme.accent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                    <span style={{ opacity: 0.7 }}>صفحة 2</span>
                  </div>
                </div>
              )}
              {theme.showBottomBar === false && (
                <div style={{ padding: '0.5rem 2.5rem', borderTop: `1px solid ${theme.borderColor}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9CA3AF' }}>
                  <span>نظام SERS - السجلات التعليمية الذكية</span>
                  <span>صفحة 2</span>
                </div>
              )}
            </div>

            {/* === صفحة البيانات الشخصية (منفصلة) === */}
            <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const, border: `2px solid ${theme.accent}` }}>
              <div style={{ flex: 1, padding: '2rem 2.5rem' }}>
{/* ترويسة الصفحة - Full Width */}
                <div style={{ marginBottom: '16px', margin: '0 -2.5rem 16px -2.5rem', marginTop: '-2rem' }}>
                <div style={{ background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, padding: '12px 24px 10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>المملكة العربية السعودية</div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                          {filteredDeptLines.map((line: string, li: number) => (
                            <div key={li} style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{line}</div>
                          ))}
                          {personalInfo.school && (
                            <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{personalInfo.school}</div>
                          )}
                        </td>
                        <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                          <div style={{ width: '2px', height: '50px', background: 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
                        </td>
                        <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                          <img src={MOE_LOGO} alt="شعار وزارة التعليم" style={{ height: '55px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </td>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                          {personalInfo.extraLogo && (
                            <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '45px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div style={{ textAlign: 'left' }}>
                            {personalInfo.semester && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`الفصل الدراسي: ${personalInfo.semester}`}</div>}
                            {personalInfo.year && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`العام الدراسي: ${personalInfo.year}`}</div>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* البيانات الشخصية */}
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: theme.accent, display: 'inline-block' }} />
                البيانات الشخصية
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'الاسم الكامل', value: personalInfo.name },
                  { label: 'المدرسة', value: personalInfo.school },
                  { label: 'الوظيفة', value: selectedJob?.title },
                  { label: 'العام الدراسي', value: personalInfo.year },
                  { label: 'الفصل الدراسي', value: personalInfo.semester },
                  { label: 'اسم مدير المدرسة', value: personalInfo.evaluator },
                  { label: 'الصفة الوظيفية', value: personalInfo.evaluatorRole },
                  { label: 'تاريخ التقييم', value: personalInfo.date },
                ].map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '0.75rem', border: '1px solid #F3F4F6' }}>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'block', marginBottom: '0.2rem' }}>{item.label}</span>
                    <strong style={{ fontSize: '0.85rem', color: '#1F2937' }}>{item.value || '—'}</strong>
                  </div>
                ))}
              </div>
              {personalInfo.department && (
                <div style={{ marginTop: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '0.75rem', border: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'block', marginBottom: '0.2rem' }}>الجهة / الإدارة</span>
                  <strong style={{ fontSize: '0.85rem', color: '#1F2937', whiteSpace: 'pre-line' as const }}>{personalInfo.department}</strong>
                </div>
              )}

              </div>{/* إغلاق flex:1 للبيانات الشخصية */}
              {/* الشريط السفلي المتدرج */}
              {theme.showBottomBar !== false && (
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, margin: '0 2.5rem' }} />
                  <div style={{ padding: '8px 2.5rem', fontSize: '10px', color: theme.accent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                    <span style={{ opacity: 0.7 }}>صفحة 3</span>
                  </div>
                </div>
              )}
              {theme.showBottomBar === false && (
                <div style={{ padding: '0.5rem 2.5rem', borderTop: `1px solid ${theme.borderColor}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9CA3AF' }}>
                  <span>نظام SERS - السجلات التعليمية الذكية</span>
                  <span>صفحة 3</span>
                </div>
              )}
            </div>

            {/* === فاصل فني بين البيانات الشخصية وجدول التقييم === */}
            <div className="mx-auto mb-6 print:hidden" style={{ width: '210mm', maxWidth: '100%', padding: '1.5rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(to left, ${theme.accent}, transparent)` }} />
                <div style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: `2px solid ${theme.accent}20`, background: `${theme.accent}08` }}>
                  <div style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>التعليم هو السلاح الأقوى لتغيير العالم</div>
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: '2px' }}>نيلسون مانديلا</div>
                </div>
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(to right, ${theme.accent}, transparent)` }} />
              </div>
            </div>

            {/* === صفحة جدول التقييم === */}
            <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const, border: `2px solid ${theme.accent}` }}>
              <div style={{ flex: 1, padding: '2rem 2.5rem' }}>
{/* ترويسة - Full Width من الحافة للحافة */}
                <div style={{ marginBottom: '16px', margin: '0 -2.5rem 16px -2.5rem', marginTop: '-2rem' }}>
                <div style={{ background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, padding: '12px 24px 10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>المملكة العربية السعودية</div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                          {filteredDeptLines.map((line: string, li: number) => (
                            <div key={li} style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{line}</div>
                          ))}
                          {personalInfo.school && (
                            <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{personalInfo.school}</div>
                          )}
                        </td>
                        <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                          <div style={{ width: '2px', height: '50px', background: 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
                        </td>
                        <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                          <img src={MOE_LOGO} alt="شعار وزارة التعليم" style={{ height: '55px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </td>
                        <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                          {personalInfo.extraLogo && (
                            <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '45px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div style={{ textAlign: 'left' }}>
                            {personalInfo.semester && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`الفصل الدراسي: ${personalInfo.semester}`}</div>}
                            {personalInfo.year && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`العام الدراسي: ${personalInfo.year}`}</div>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: theme.accent, display: 'inline-block' }} />
                جدول التقييم
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: theme.accent, color: '#fff' }}>
                    <th style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', width: '40px' }}>م</th>
                    <th style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'right' }}>البند</th>
                    <th style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', width: '70px' }}>الدرجة</th>
                    <th style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', width: '70px' }}>الشواهد</th>
                    <th style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', width: '60px' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {allCriteria.map((c, i) => {
                    const d = criteriaData[c.id];
                    const score = d?.score || 0;
                    const evCount = d?.evidences.length || 0;
                    const scoreColor = score >= 4 ? '#16A34A' : score >= 2 ? '#CA8A04' : score > 0 ? '#EA580C' : '#9CA3AF';
                    return (
                      <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '8px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td style={{ padding: '8px', border: `1px solid ${theme.borderColor}` }}>{c.title}</td>
                        <td style={{ padding: '8px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', fontWeight: 700, color: scoreColor }}>{score}/{c.maxScore}</td>
                        <td style={{ padding: '8px', border: `1px solid ${theme.borderColor}`, textAlign: 'center' }}>{evCount}</td>
                        <td style={{ padding: '8px', border: `1px solid ${theme.borderColor}`, textAlign: 'center' }}>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '9999px', fontWeight: 600, backgroundColor: score >= 4 ? '#dcfce7' : score >= 2 ? '#fef9c3' : score > 0 ? '#ffedd5' : '#f3f4f6', color: scoreColor }}>
                            {score >= 4 ? 'مكتمل' : score >= 2 ? 'جزئي' : score > 0 ? 'ضعيف' : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: theme.accent, color: '#fff' }}>
                    <td colSpan={2} style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', fontWeight: 700 }}>المجموع</td>
                    <td style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', fontWeight: 700 }}>{totalScore}/{maxScore}</td>
                    <td style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', fontWeight: 700 }}>{Object.values(criteriaData).reduce((s, d) => s + d.evidences.length, 0)}</td>
                    <td style={{ padding: '10px', border: `1px solid ${theme.borderColor}`, textAlign: 'center', fontWeight: 700 }}>{percentage}%</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: `${grade.color}12` }}>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>التقدير النهائي</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: grade.color }}>{percentage}%</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: grade.color, marginTop: '0.25rem' }}>{grade.label}</p>
                {indicatorsCoverage && (
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>المؤشرات المغطاة: {indicatorsCoverage.covered} من {indicatorsCoverage.total}</p>
                )}
              </div>

              </div>{/* إغلاق flex:1 */}
              {/* الشريط السفلي المتدرج */}
              {theme.showBottomBar !== false && (
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, margin: '0 2.5rem' }} />
                  <div style={{ padding: '8px 2.5rem', fontSize: '10px', color: theme.accent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                    <span style={{ opacity: 0.7 }}>صفحة 4</span>
                  </div>
                </div>
              )}
              {theme.showBottomBar === false && (
                <div style={{ padding: '0.5rem 2.5rem', borderTop: `1px solid ${theme.borderColor}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9CA3AF' }}>
                  <span>نظام SERS - السجلات التعليمية الذكية</span>
                  <span>صفحة 4</span>
                </div>
              )}
            </div>

            {/* === فاصل فني بين جدول التقييم والشواهد === */}
            <div className="mx-auto mb-6 print:hidden" style={{ width: '210mm', maxWidth: '100%', padding: '1.5rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(to left, ${theme.accent}, transparent)` }} />
                <div style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: `2px solid ${theme.accent}20`, background: `${theme.accent}08` }}>
                  <div style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>إن العقل الذي ينفتح لفكرة جديدة لا يعود أبداً إلى حجمه الأصلي</div>
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: '2px' }}>ألبرت أينشتاين</div>
                </div>
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(to right, ${theme.accent}, transparent)` }} />
              </div>
            </div>

            {/* === صفحات الشواهد - كل بند في صفحة منفصلة === */}
            {(() => {
              let pageCounter = 5;
              // فقط البنود التي أضيف لها شواهد
              const criteriaWithEvidence = allCriteria.filter(c => {
                const d = criteriaData[c.id];
                return d && d.evidences.length > 0;
              });
              return criteriaWithEvidence.map((c, filteredIdx) => {
                const i = allCriteria.indexOf(c);
                const d = criteriaData[c.id];
                if (!d) return null;
                const coverPage = pageCounter++;
                const contentPage = pageCounter++;
                const allSubs = [...(c.subEvidences || []), ...(d.customSubEvidences || [])];
                return (
                  <React.Fragment key={c.id}>
                    {/* === غلاف القسم - يتغير حسب sectionCoverStyle === */}
                    {(() => {
                      const scs = theme.sectionCoverStyle || 'full-gradient';
                      const a2 = theme.coverAccent2 || theme.accent;
                      const sectionStats = (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', fontSize: '0.9rem' }}>
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 900 }}>{d.evidences.length}</div><div style={{ fontSize: '0.75rem', opacity: 0.7 }}>شاهد</div></div>
                          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 900 }}>{d.score}/{c.maxScore}</div><div style={{ fontSize: '0.75rem', opacity: 0.7 }}>الدرجة</div></div>
                        </div>
                      );
                      const sectionFooter = <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', opacity: 0.4 }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'} • {personalInfo.name} • صفحة {coverPage}</div>;

                      // غلاف قسم 1: متدرج كامل
                      if (scs === 'full-gradient') return (
                        <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                          <div style={{ background: theme.headerBg, color: theme.headerText, minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 3rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', pointerEvents: 'none' }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '2rem', fontWeight: 900 }}>{i + 1}</div>
                              <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.15em' }}>البند {i + 1} من {allCriteria.length}</div>
                              <h2 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Cairo', sans-serif", marginBottom: '1rem', lineHeight: 1.4 }}>{c.title}</h2>
                              <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.3)', margin: '1.5rem auto' }} />
                              {sectionStats}
                            </div>
                            {sectionFooter}
                          </div>
                        </div>
                      );

                      // غلاف قسم 2: شريط يسار
                      if (scs === 'left-stripe') return (
                        <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', display: 'flex', border: `2px solid ${theme.accent}` }}>
                          <div style={{ width: '30%', background: theme.headerBg, minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: theme.headerText, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: `linear-gradient(to bottom, ${a2}, ${theme.accent})` }} />
                            <div style={{ fontSize: '5rem', fontWeight: 900, opacity: 0.2 }}>{i + 1}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>بند {i + 1}</div>
                          </div>
                          <div style={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>البند {i + 1} من {allCriteria.length}</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '1rem', lineHeight: 1.4 }}>{c.title}</h2>
                            <div style={{ width: '60px', height: '3px', background: theme.accent, marginBottom: '2rem' }} />
                            <div style={{ display: 'flex', gap: '2rem' }}>
                              <div style={{ padding: '1rem 1.5rem', border: `1px solid ${theme.accent}30`, borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent }}>{d.evidences.length}</div>
                                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>شاهد</div>
                              </div>
                              <div style={{ padding: '1rem 1.5rem', border: `1px solid ${theme.accent}30`, borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent }}>{d.score}/{c.maxScore}</div>
                                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>الدرجة</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', textAlign: 'center', fontSize: '0.65rem', color: '#D1D5DB' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'} • {personalInfo.name} • صفحة {coverPage}</div>
                        </div>
                      );

                      // غلاف قسم 3: شريط علوي
                      if (scs === 'top-accent') return (
                        <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                          <div style={{ background: theme.headerBg, padding: '2rem 3rem', color: theme.headerText, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>البند {i + 1} من {allCriteria.length}</div>
                          </div>
                          <div style={{ height: '4px', background: `linear-gradient(to left, ${theme.accent}, ${a2})` }} />
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '5rem 3rem', minHeight: 'calc(297mm - 100px)' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: `3px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.8rem', fontWeight: 900, color: theme.accent }}>{i + 1}</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '1rem', lineHeight: 1.4 }}>{c.title}</h2>
                            <div style={{ width: '60px', height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${a2})`, margin: '1.5rem auto', borderRadius: '2px' }} />
                            <div style={{ display: 'flex', gap: '3rem', marginTop: '1rem' }}>
                              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 900, color: theme.accent }}>{d.evidences.length}</div><div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>شاهد</div></div>
                              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 900, color: theme.accent }}>{d.score}/{c.maxScore}</div><div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>الدرجة</div></div>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.65rem', color: '#D1D5DB' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'} • {personalInfo.name} • صفحة {coverPage}</div>
                        </div>
                      );

                      // غلاف قسم 4: بطاقة مركزية
                      if (scs === 'card-center') return (
                        <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', background: `${theme.accent}08`, border: `2px solid ${theme.accent}` }}>
                          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: `1px solid ${theme.accent}25`, borderRadius: '4px', pointerEvents: 'none' }} />
                          <div style={{ minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 3rem', position: 'relative' }}>
                            <div style={{ background: 'white', borderRadius: '16px', padding: '3rem 4rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: `1px solid ${theme.accent}20`, maxWidth: '480px', width: '100%' }}>
                              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem', fontWeight: 900, color: theme.accent }}>{i + 1}</div>
                              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>البند {i + 1} من {allCriteria.length}</div>
                              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '1rem', lineHeight: 1.4 }}>{c.title}</h2>
                              <div style={{ width: '50px', height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${a2})`, margin: '1rem auto', borderRadius: '2px' }} />
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                                <div style={{ padding: '0.75rem 1.5rem', background: `${theme.accent}08`, borderRadius: '8px' }}>
                                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.accent }}>{d.evidences.length}</div>
                                  <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>شاهد</div>
                                </div>
                                <div style={{ padding: '0.75rem 1.5rem', background: `${theme.accent}08`, borderRadius: '8px' }}>
                                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.accent }}>{d.score}/{c.maxScore}</div>
                                  <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>الدرجة</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.65rem', color: '#D1D5DB' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'} • {personalInfo.name} • صفحة {coverPage}</div>
                        </div>
                      );

                      // غلاف قسم 5: شريط مرقم
                      if (scs === 'numbered-bar') return (
                        <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                          <div style={{ minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 3rem', position: 'relative' }}>
                            <div style={{ width: '100%', maxWidth: '500px', borderTop: `4px solid ${theme.accent}`, borderBottom: `4px solid ${theme.accent}`, padding: '3rem 2rem' }}>
                              <div style={{ fontSize: '4rem', fontWeight: 900, color: theme.accent, opacity: 0.15, marginBottom: '0.5rem' }}>{String(i + 1).padStart(2, '0')}</div>
                              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>البند {i + 1} من {allCriteria.length}</div>
                              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '1.5rem', lineHeight: 1.4 }}>{c.title}</h2>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                                <div><span style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.accent }}>{d.evidences.length}</span> <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>شاهد</span></div>
                                <div style={{ color: '#D1D5DB' }}>|</div>
                                <div><span style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.accent }}>{d.score}/{c.maxScore}</span> <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>درجة</span></div>
                              </div>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.65rem', color: '#D1D5DB' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'} • {personalInfo.name} • صفحة {coverPage}</div>
                        </div>
                      );

                      // غلاف قسم 6: فاصل نظيف (minimal)
                      return (
                        <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', overflow: 'hidden', pageBreakAfter: 'always', border: `2px solid ${theme.accent}` }}>
                          <div style={{ minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 3rem', position: 'relative' }}>
                            <div style={{ width: '1px', height: '60px', background: theme.accent, marginBottom: '2rem' }} />
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>البند {i + 1} من {allCriteria.length}</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '1rem', lineHeight: 1.4 }}>{c.title}</h2>
                            <div style={{ width: '1px', height: '60px', background: theme.accent, margin: '1.5rem 0' }} />
                            <div style={{ display: 'flex', gap: '3rem', color: '#4B5563' }}>
                              <div><span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>الشواهد: </span><strong style={{ color: theme.accent }}>{d.evidences.length}</strong></div>
                              <div><span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>الدرجة: </span><strong style={{ color: theme.accent }}>{d.score}/{c.maxScore}</strong></div>
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.65rem', color: '#D1D5DB' }}>{personalInfo.reportTitle || 'شواهد الأداء الوظيفي'} • {personalInfo.name} • صفحة {coverPage}</div>
                        </div>
                      );
                    })()}

                    {/* === صفحة الشواهد === */}
                  <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const, border: `2px solid ${theme.accent}` }}>
                    <div style={{ flex: 1, padding: '2rem 2.5rem' }}>
                    {/* ترويسة - Full Width من الحافة للحافة */}
                    <div style={{ marginBottom: '1rem', margin: '0 -2.5rem 1rem -2.5rem', marginTop: '-2rem' }}>
                      <div style={{ background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, padding: '12px 24px 10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                                <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>المملكة العربية السعودية</div>
                                <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                                {filteredDeptLines.map((line: string, li: number) => (
                                  <div key={li} style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{line}</div>
                                ))}
                                {personalInfo.school && (
                                  <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{personalInfo.school}</div>
                                )}
                              </td>
                              <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                                <div style={{ width: '2px', height: '50px', background: 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
                              </td>
                              <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                                <img src={MOE_LOGO} alt="شعار وزارة التعليم" style={{ height: '55px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </td>
                              <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                                {personalInfo.extraLogo && (
                                  <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '45px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <div style={{ textAlign: 'left' }}>
                                  {personalInfo.semester && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`الفصل الدراسي: ${personalInfo.semester}`}</div>}
                                  {personalInfo.year && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`العام الدراسي: ${personalInfo.year}`}</div>}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* رأس البند */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: `3px solid ${theme.accent}` }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 700, backgroundColor: theme.accent, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: theme.accent, fontFamily: "'Cairo', sans-serif" }}>{c.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>الدرجة: <strong style={{ color: d.score >= 4 ? '#16A34A' : d.score >= 2 ? '#CA8A04' : '#9CA3AF' }}>{d.score}/{c.maxScore}</strong></span>
                          <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>•</span>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{d.evidences.length} شاهد</span>
                        </div>
                      </div>
                    </div>

                    {/* الشواهد */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {d.evidences.map((ev, evIdx) => {
                        const evPriority = ev.priority || 'essential';
                        const evPriorityConfig = PRIORITY_CONFIG[evPriority];
                        const linkedSub = allSubs.find(s => s.id === ev.subEvidenceId);
                        const formFields = linkedSub?.formFields;
                        return (
                          <div key={ev.id} style={{ padding: '0.75rem', borderRadius: '8px', borderTop: `1.5px solid ${theme.borderColor}`, borderBottom: `1.5px solid ${theme.borderColor}`, borderLeft: `1.5px solid ${theme.borderColor}`, borderRight: `4px solid ${evPriorityConfig.color}`, pageBreakInside: 'avoid', backgroundColor: '#FAFBFC' }}>
                            {/* رأس الشاهد */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF' }}>شاهد {evIdx + 1}</span>
                              {linkedSub && <span style={{ fontSize: '0.6rem', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '1px 6px', borderRadius: '4px' }}>{linkedSub.title.length > 50 ? linkedSub.title.substring(0, 50) + '...' : linkedSub.title}</span>}
                              <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600, backgroundColor: evPriorityConfig.color + '15', color: evPriorityConfig.color }}>
                                {evPriorityConfig.icon} {evPriorityConfig.label}
                              </span>
                            </div>
                            {/* محتوى الشاهد */}
                            {ev.type === 'text' && ev.text && <p style={{ fontSize: '0.8rem', lineHeight: 1.7, color: '#374151' }}>{ev.text}</p>}
                            {ev.type === 'link' && ev.link && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {ev.showBarcode !== false && <img src={generateQRDataURL(ev.link)} alt="QR" style={{ width: '80px', height: '80px', borderRadius: '4px' }} />}
                                <div>
                                  <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>رابط إلكتروني</span>
                                  <span style={{ fontSize: '0.7rem', color: '#2563EB', wordBreak: 'break-all' as const }}>{ev.link}</span>
                                </div>
                              </div>
                            )}
                            {ev.type === 'image' && ev.fileData && (
                              ev.displayAs === 'image'
                                ? <img src={ev.fileData.startsWith('idb://') ? '' : ev.fileData} alt="" style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                                : <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {ev.showBarcode !== false && <img src={generateQRDataURL(ev.uploadedUrl || ev.fileName || 'file')} alt="QR" style={{ width: '80px', height: '80px', borderRadius: '4px' }} />}
                                    <div>
                                      <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>صورة {ev.showBarcode !== false ? '(باركود)' : ''}</span>
                                      <span style={{ fontSize: '0.7rem', color: '#4B5563' }}>{ev.fileName}</span>
                                    </div>
                                  </div>
                            )}
                            {(ev.type === 'video' || ev.type === 'file') && ev.fileData && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {ev.showBarcode !== false && <img src={generateQRDataURL(ev.uploadedUrl || ev.fileName || 'file')} alt="QR" style={{ width: '80px', height: '80px', borderRadius: '4px' }} />}
                                <div>
                                  <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>{ev.type === 'video' ? 'فيديو' : 'ملف مرفق'}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#4B5563' }}>{ev.fileName}</span>
                                </div>
                              </div>
                            )}
                            {/* عرض بيانات النموذج باستخدام أسماء الحقول الفعلية */}
                            {ev.formData && Object.entries(ev.formData).some(([, v]) => v) && (
                              <div style={{ marginTop: '0.5rem', borderTop: `1px solid ${theme.accent}20`, borderBottom: `1px solid ${theme.accent}20`, borderLeft: `1px solid ${theme.accent}20`, borderRight: `1px solid ${theme.accent}20`, borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ background: `${theme.accent}10`, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: `${theme.accent}15`, padding: '6px 12px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.accent }}>بيانات النموذج</span>
                                </div>
                                <div style={{ padding: '8px 12px' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                      {Object.entries(ev.formData).filter(([, v]) => v).map(([key, val], fi, arr) => {
                                        // البحث عن اسم الحقل الفعلي من formFields
                                        const matchedField = formFields?.find(f => f.id === key);
                                        const fieldLabel = matchedField?.label || (key === 'report_title' ? 'الموضوع' : key === 'evidence_desc' ? 'وصف الشاهد' : key === 'date' ? 'التاريخ' : key === 'notes' ? 'ملاحظات' : key === 'title' ? 'العنوان' : key === 'details' ? 'التفاصيل' : key === 'content' ? 'المحتوى' : key);
                                        return (
                                          <tr key={key} style={{ borderBottom: fi < arr.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                            <td style={{ padding: '6px 8px', fontSize: '0.7rem', fontWeight: 600, color: theme.accent, width: '110px', verticalAlign: 'top' }}>{fieldLabel}</td>
                                            <td style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>{val}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {/* التعليق */}
                            {ev.comment && ev.comment.trim() && (
                              <div style={{ marginTop: '0.5rem', backgroundColor: '#FFFBEB', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: '#92400E', border: '1px solid #FDE68A' }}>
                                <strong>تعليق:</strong> {ev.comment}
                              </div>
                            )}
                            {/* الكلمات المفتاحية */}
                            {ev.keywords && ev.keywords.length > 0 && (
                              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' as const }}>
                                {ev.keywords.map((kw, ki) => (
                                  <span key={ki} style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '9999px', backgroundColor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>{kw}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    </div>{/* إغلاق flex:1 */}
                    {/* الشريط السفلي المتدرج */}
                    {theme.showBottomBar !== false && (
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, margin: '0 2.5rem' }} />
                        <div style={{ padding: '8px 2.5rem', fontSize: '10px', color: theme.accent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                          <span style={{ opacity: 0.7 }}>صفحة {contentPage}</span>
                        </div>
                      </div>
                    )}
                    {theme.showBottomBar === false && (
                      <div style={{ padding: '0.5rem 2.5rem', borderTop: `1px solid ${theme.borderColor}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9CA3AF' }}>
                        <span>نظام SERS - السجلات التعليمية الذكية</span>
                        <span>صفحة {contentPage}</span>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                );
              });
            })()}

            {/* === فاصل فني قبل صفحة التوقيعات === */}
            <div className="mx-auto mb-6 print:hidden" style={{ width: '210mm', maxWidth: '100%', padding: '1.5rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(to left, ${theme.accent}, transparent)` }} />
                <div style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: `2px solid ${theme.accent}20`, background: `${theme.accent}08` }}>
                  <div style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>المعلم المتميز يُلهم ويفتح العقول ويمس القلوب</div>
                  <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: '2px' }}>ويليام آرثر وورد</div>
                </div>
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(to right, ${theme.accent}, transparent)` }} />
              </div>
            </div>

            {/* === صفحة التوقيعات - تتبع signatureStyle === */}
            {(() => {
              const ss = theme.signatureStyle || 'dotted';
              const sigLineStyle: React.CSSProperties = ss === 'dotted' ? { borderTop: `2px dotted ${theme.accent}` } : ss === 'solid' ? { borderTop: `2px solid ${theme.accent}` } : ss === 'boxed' ? { borderTop: `1.5px solid ${theme.accent}`, borderBottom: `1.5px solid ${theme.accent}`, borderLeft: `1.5px solid ${theme.accent}`, borderRight: `1.5px solid ${theme.accent}`, borderRadius: '8px', padding: '0.5rem' } : ss === 'lined' ? { borderTop: `1px solid ${theme.borderColor}`, borderBottom: `1px solid ${theme.borderColor}`, padding: '0.25rem 0' } : { borderTop: `2px dashed ${theme.accent}` };
              return (
                <div className="bg-white shadow-lg mx-auto mb-6" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', position: 'relative', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const, border: `2px solid ${theme.accent}` }}>
                  <div style={{ flex: 1, padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                  {/* ترويسة - Full Width من الحافة للحافة */}
                  <div style={{ margin: '0 -2.5rem 0.5rem -2.5rem', marginTop: '-2rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, padding: '12px 24px 10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                                <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>المملكة العربية السعودية</div>
                                <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 700, lineHeight: '2.0' }}>وزارة التعليم</div>
                                {filteredDeptLines.map((line: string, li: number) => (
                                  <div key={li} style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{line}</div>
                                ))}
                                {personalInfo.school && (
                                  <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '2.0' }}>{personalInfo.school}</div>
                                )}
                              </td>
                              <td style={{ width: '2%', verticalAlign: 'middle', textAlign: 'center', padding: '0 4px' }}>
                                <div style={{ width: '2px', height: '50px', background: 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
                              </td>
                              <td style={{ width: '28%', verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                                <img src={MOE_LOGO} alt="شعار وزارة التعليم" style={{ height: '55px', objectFit: 'contain' as const, margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </td>
                              <td style={{ width: '35%', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                                {personalInfo.extraLogo && (
                                  <img src={personalInfo.extraLogo} alt="شعار إضافي" style={{ height: '45px', objectFit: 'contain' as const, display: 'block', marginBottom: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <div style={{ textAlign: 'left' }}>
                                  {personalInfo.semester && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`الفصل الدراسي: ${personalInfo.semester}`}</div>}
                                  {personalInfo.year && <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 600, lineHeight: '1.8' }}>{`العام الدراسي: ${personalInfo.year}`}</div>}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* عنوان */}
                  <h2 style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, color: theme.accent, fontFamily: "'Cairo', sans-serif", marginBottom: '3rem' }}>اعتماد التقرير</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '0 2rem' }}>
                    <div style={{ padding: '2rem' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: theme.accent, marginBottom: '12px' }}>التنفيذ: <span style={{ fontWeight: 700, color: '#1a1a1a' }}>أ/ {personalInfo.name || '..............................'}</span></div>
                      <div style={{ fontSize: '13px', color: '#555' }}>التوقيع: <span style={{ display: 'inline-block', width: '180px', borderBottom: `2px dotted ${theme.accent}`, verticalAlign: 'middle' }}>&nbsp;</span></div>
                    </div>
                    <div style={{ padding: '2rem' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: theme.accent, marginBottom: '12px' }}>{personalInfo.evaluatorRole || 'مدير المدرسة'}: <span style={{ fontWeight: 700, color: '#1a1a1a' }}>أ/ {personalInfo.evaluator || '..............................'}</span></div>
                      <div style={{ fontSize: '13px', color: '#555' }}>التوقيع: <span style={{ display: 'inline-block', width: '180px', borderBottom: `2px dotted ${theme.accent}`, verticalAlign: 'middle' }}>&nbsp;</span></div>
                    </div>
                  </div>

                  {/* ملاحظات */}
                  <div style={{ marginTop: '3rem', padding: '1.5rem', border: `1px solid ${theme.accent}15`, borderRadius: '8px', background: `${theme.accent}05` }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.accent, marginBottom: '0.5rem' }}>ملاحظات:</p>
                    <div style={{ borderBottom: `1px solid ${theme.accent}15`, height: '2rem' }} />
                    <div style={{ borderBottom: `1px solid ${theme.accent}15`, height: '2rem' }} />
                    <div style={{ borderBottom: `1px solid ${theme.accent}15`, height: '2rem' }} />
                  </div>

                  </div>{/* إغلاق flex:1 */}
                  {/* الشريط السفلي المتدرج */}
                  {theme.showBottomBar !== false && (
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ height: '3px', background: `linear-gradient(to left, ${theme.accent}, ${theme.coverAccent2 || theme.accent})`, margin: '0 2.5rem' }} />
                      <div style={{ padding: '8px 2.5rem', fontSize: '10px', color: theme.accent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>SERS - نظام السجلات التعليمية الذكي</span>
                        <span style={{ opacity: 0.7 }}>{personalInfo.name} • {selectedJob?.title}</span>
                      </div>
                    </div>
                  )}
                  {theme.showBottomBar === false && (
                    <div style={{ padding: '0.5rem 2.5rem', borderTop: `1px solid ${theme.borderColor}`, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9CA3AF' }}>
                      <span>نظام SERS - السجلات التعليمية الذكية</span>
                      <span>{personalInfo.name} • {selectedJob?.title} • {personalInfo.year}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>{/* إغلاق preview-content */}
          </div>{/* إغلاق wrapper width */}
          </div>{/* إغلاق fullPreviewContainerRef */}
        </div>
      </div>
    );
  }

  return null;
}

// ===== Lightbox Overlay Component =====
function LightboxOverlay({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        <button
          onClick={onClose}
          className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </motion.div>
    </div>
  );
}
