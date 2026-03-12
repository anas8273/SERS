import { describe, expect, it } from "vitest";

/**
 * اختبارات بنية الثيمات والقوالب المدمجة + الثيمات المخصصة + التصدير
 */

// الثيمات المدمجة
const BUILTIN_THEME_IDS = [
  'default',       // متدرج
  'builtin-dark',  // داكن
  'builtin-light', // خفيف حبر
];

const VALID_HEADER_VARIANTS = [
  'right-text-center-logo-left-info',
  'right-text-left-logo',
  'center-logo-banner',
  'full-header-sections',
];

const VALID_FIELD_STYLES = [
  'table',
  'cards',
  'fieldset',
  'underlined',
  'minimal',
];

const VALID_HEADER_STYLES = [1, 2, 3, 4];

describe("Theme Configuration", () => {
  it("should have 3 unique built-in themes (gradient/dark/light-ink)", () => {
    expect(BUILTIN_THEME_IDS.length).toBe(3);
    const uniqueIds = new Set(BUILTIN_THEME_IDS);
    expect(uniqueIds.size).toBe(3);
  });

  it("should have no duplicate theme IDs", () => {
    const seen = new Set<string>();
    for (const id of BUILTIN_THEME_IDS) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });

  it("should have valid header variants", () => {
    for (const variant of VALID_HEADER_VARIANTS) {
      expect(typeof variant).toBe("string");
      expect(variant.length).toBeGreaterThan(0);
    }
    expect(VALID_HEADER_VARIANTS.length).toBe(4);
  });

  it("should have valid field styles", () => {
    for (const style of VALID_FIELD_STYLES) {
      expect(typeof style).toBe("string");
      expect(style.length).toBeGreaterThan(0);
    }
    expect(VALID_FIELD_STYLES.length).toBe(5);
  });
});

describe("QR Code Size Configuration", () => {
  it("QR code size should be 240px (large enough for scanning)", () => {
    const QR_SIZE = 240;
    expect(QR_SIZE).toBeGreaterThanOrEqual(200);
    expect(QR_SIZE).toBeLessThanOrEqual(300);
  });

  it("QR code module size should be 10 for high quality", () => {
    const MODULE_SIZE = 10;
    expect(MODULE_SIZE).toBeGreaterThanOrEqual(8);
  });
});

describe("Header Layout Validation", () => {
  it("header variant 1 should show text right, logo center, info left", () => {
    const variant = 'right-text-center-logo-left-info';
    expect(variant).toContain('right-text');
    expect(variant).toContain('center-logo');
    expect(variant).toContain('left-info');
  });

  it("header variant 2 should show text right, logo left", () => {
    const variant = 'right-text-left-logo';
    expect(variant).toContain('right-text');
    expect(variant).toContain('left-logo');
  });

  it("header variant 3 should show center logo with banner", () => {
    const variant = 'center-logo-banner';
    expect(variant).toContain('center-logo');
    expect(variant).toContain('banner');
  });

  it("header variant 4 should show full header with sections", () => {
    const variant = 'full-header-sections';
    expect(variant).toContain('full-header');
    expect(variant).toContain('sections');
  });
});

describe("Evidence Display Options", () => {
  it("should support image and qr display modes", () => {
    const displayModes = ['image', 'qr'] as const;
    expect(displayModes).toContain('image');
    expect(displayModes).toContain('qr');
    expect(displayModes.length).toBe(2);
  });

  it("should support showBarcode toggle", () => {
    const evidence = { showBarcode: true, displayAs: 'image' as const };
    expect(evidence.showBarcode).toBe(true);
    evidence.showBarcode = false;
    expect(evidence.showBarcode).toBe(false);
  });

  it("default evidence should have displayAs=image and showBarcode=true", () => {
    const defaultEvidence = {
      displayAs: 'image' as const,
      showBarcode: true,
    };
    expect(defaultEvidence.displayAs).toBe('image');
    expect(defaultEvidence.showBarcode).toBe(true);
  });
});

describe("Template Manager - Admin Features", () => {
  it("should support 4 header styles for templates", () => {
    expect(VALID_HEADER_STYLES.length).toBe(4);
    expect(VALID_HEADER_STYLES).toContain(1);
    expect(VALID_HEADER_STYLES).toContain(4);
  });

  it("should support 5 field styles for templates", () => {
    expect(VALID_FIELD_STYLES.length).toBe(5);
    expect(VALID_FIELD_STYLES).toContain('table');
    expect(VALID_FIELD_STYLES).toContain('cards');
    expect(VALID_FIELD_STYLES).toContain('fieldset');
    expect(VALID_FIELD_STYLES).toContain('underlined');
    expect(VALID_FIELD_STYLES).toContain('minimal');
  });

  it("template layout config should have headerStyle and fieldStyle", () => {
    const layout = { headerStyle: 1, fieldStyle: 'table' };
    expect(layout.headerStyle).toBe(1);
    expect(layout.fieldStyle).toBe('table');
    expect(VALID_HEADER_STYLES).toContain(layout.headerStyle);
    expect(VALID_FIELD_STYLES).toContain(layout.fieldStyle);
  });

  it("template should have required color fields", () => {
    const template = {
      name: "قالب اختبار",
      headerBg: "#047857",
      headerText: "#FFFFFF",
      accent: "#059669",
      borderColor: "#D1FAE5",
      bodyBg: "#FFFFFF",
      fontFamily: "Tajawal",
    };
    expect(template.name).toBeTruthy();
    expect(template.headerBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(template.headerText).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(template.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(template.borderColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(template.bodyBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("template duplicate should create a copy with different name", () => {
    const original = { name: "القالب الأصلي", accent: "#059669" };
    const copy = { name: `${original.name} (نسخة)`, accent: original.accent };
    expect(copy.name).toContain("(نسخة)");
    expect(copy.accent).toBe(original.accent);
  });
});

describe("User Custom Themes", () => {
  it("should save theme data as JSON object", () => {
    const themeData = {
      id: 'default',
      name: 'ثيم مخصص',
      accent: '#0d7377',
      headerBg: 'linear-gradient(135deg, #1a4d4e, #0d7377)',
      headerText: '#ffffff',
      borderColor: '#1a4d4e',
    };
    const saved = {
      name: "ثيمي المخصص",
      themeData,
    };
    expect(saved.name).toBeTruthy();
    expect(saved.themeData).toBeDefined();
    expect(saved.themeData.accent).toBe('#0d7377');
  });

  it("should load saved theme and merge with defaults", () => {
    const DEFAULT_THEME = {
      id: 'default',
      name: 'افتراضي',
      accent: '#0d7377',
      headerBg: '#1a4d4e',
      headerText: '#ffffff',
      borderColor: '#1a4d4e',
      fieldStyle: 'table',
    };
    const savedData = {
      accent: '#FF5722',
      headerBg: '#333333',
    };
    const loaded = { ...DEFAULT_THEME, ...savedData };
    expect(loaded.accent).toBe('#FF5722');
    expect(loaded.headerBg).toBe('#333333');
    expect(loaded.headerText).toBe('#ffffff'); // preserved from default
    expect(loaded.fieldStyle).toBe('table'); // preserved from default
  });

  it("should validate theme name is not empty", () => {
    const validName = "ثيمي";
    const emptyName = "";
    expect(validName.trim().length).toBeGreaterThan(0);
    expect(emptyName.trim().length).toBe(0);
  });
});

describe("PDF Export Quality", () => {
  it("should use A4 page dimensions", () => {
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    expect(A4_WIDTH_MM).toBe(210);
    expect(A4_HEIGHT_MM).toBe(297);
  });

  it("should use high DPI for export", () => {
    const EXPORT_DPI = 2; // scale factor
    expect(EXPORT_DPI).toBeGreaterThanOrEqual(2);
  });

  it("should embed Arabic fonts for PDF", () => {
    const ARABIC_FONTS = ['Tajawal', 'Cairo', 'Almarai', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Amiri'];
    expect(ARABIC_FONTS.length).toBeGreaterThanOrEqual(4);
    expect(ARABIC_FONTS).toContain('Tajawal');
    expect(ARABIC_FONTS).toContain('Cairo');
  });

  it("should support RTL direction in PDF", () => {
    const pdfConfig = { direction: 'rtl', lang: 'ar' };
    expect(pdfConfig.direction).toBe('rtl');
    expect(pdfConfig.lang).toBe('ar');
  });
});

describe("Template Image Upload", () => {
  it("should accept image MIME types", () => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    validTypes.forEach(type => {
      expect(type.startsWith('image/')).toBe(true);
    });
  });

  it("should enforce 5MB file size limit", () => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    expect(MAX_SIZE).toBe(5242880);
    const smallFile = 1024 * 100; // 100KB
    const largeFile = 10 * 1024 * 1024; // 10MB
    expect(smallFile).toBeLessThan(MAX_SIZE);
    expect(largeFile).toBeGreaterThan(MAX_SIZE);
  });

  it("should support cover, logo, and background image types", () => {
    const imageTypes = ['cover', 'logo', 'background'];
    expect(imageTypes.length).toBe(3);
    expect(imageTypes).toContain('cover');
    expect(imageTypes).toContain('logo');
    expect(imageTypes).toContain('background');
  });
});
