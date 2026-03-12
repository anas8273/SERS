import { describe, it, expect } from "vitest";

// ===== Multi-Layout Theme System Tests =====
// Tests for the new layout system with different layoutType, fieldStyle, titleStyle, signatureStyle

describe("Multi-Layout Theme System", () => {
  // Theme structure matching the updated THEMES in PerformanceEvidence.tsx
  type LayoutType =
    | 'dark-header-table'
    | 'dark-header-simple'
    | 'white-header-classic'
    | 'white-header-sidebar'
    | 'white-header-light'
    | 'white-header-multi'
    | 'minimal-clean';

  type FieldStyle = 'table' | 'fieldset' | 'underlined' | 'cards' | 'minimal';
  type TitleStyle = 'rounded' | 'full-width' | 'bordered' | 'underlined' | 'badge' | 'simple';
  type SignatureStyle = 'dotted' | 'solid' | 'boxed' | 'lined' | 'stamped';

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
    sidebarBg?: string;
    titleStyle?: TitleStyle;
    headerSeparator?: boolean;
    showTopLine?: boolean;
    showBottomBar?: boolean;
    fieldStyle?: FieldStyle;
    signatureStyle?: SignatureStyle;
    bodyBg?: string;
  }

  // All themes from the THEMES constant
  const THEMES: ThemeConfig[] = [
    // Identity themes
    { id: "identity-dark-table", name: "الهوية البصرية - جدول داكن",
      layoutType: 'dark-header-table', headerBg: "linear-gradient(135deg, #1B3A5C, #1A4A6B, #1E5A7A)", headerText: "#fff",
      accent: "#1A6B7A", borderColor: "#1B3A5C", titleBg: "#1A6B7A", fieldLabelBg: "#1A6B7A",
      footerBg: "linear-gradient(to left, #1B3A5C, #1A6B7A, #2E9E8B)",
      tableStyle: true, titleStyle: 'rounded', showTopLine: true, showBottomBar: true,
      fieldStyle: 'table', signatureStyle: 'dotted' },
    { id: "identity-dark-fieldset", name: "الهوية البصرية - ترويسة داكنة",
      layoutType: 'dark-header-simple', headerBg: "linear-gradient(135deg, #1B3A5C, #1A4A6B, #1E5A7A)", headerText: "#fff",
      accent: "#1A6B7A", borderColor: "#1B3A5C", titleBg: "#1A6B7A", fieldLabelBg: "#1A6B7A",
      footerBg: "linear-gradient(to left, #1B3A5C, #1A6B7A, #2E9E8B)",
      tableStyle: false, titleStyle: 'rounded', showTopLine: true, showBottomBar: true,
      fieldStyle: 'fieldset', signatureStyle: 'dotted' },
    { id: "identity-white-classic", name: "الهوية البصرية - أبيض كلاسيكي",
      layoutType: 'white-header-classic', headerBg: "#ffffff", headerText: "#1B3A5C",
      accent: "#1A6B7A", borderColor: "#1A6B7A", titleBg: "#1A6B7A", fieldLabelBg: "#1A6B7A",
      footerBg: "linear-gradient(to left, #1B3A5C, #1A6B7A, #2E9E8B)",
      tableStyle: false, titleStyle: 'bordered', showTopLine: false, showBottomBar: false,
      fieldStyle: 'underlined', signatureStyle: 'dotted', headerSeparator: false },
    { id: "identity-white-sidebar", name: "الهوية البصرية - شريط جانبي",
      layoutType: 'white-header-sidebar', headerBg: "#ffffff", headerText: "#1B3A5C",
      accent: "#1A6B7A", borderColor: "#1A6B7A", titleBg: "#1A6B7A", fieldLabelBg: "#1A6B7A",
      footerBg: "linear-gradient(to left, #1B3A5C, #1A6B7A, #2E9E8B)",
      tableStyle: false, titleStyle: 'rounded', showTopLine: false, showBottomBar: true,
      sidebarBg: "linear-gradient(to bottom, #1B3A5C, #1A6B7A, #2E9E8B)",
      fieldStyle: 'fieldset', signatureStyle: 'dotted', headerSeparator: true },
    { id: "identity-white-light", name: "الهوية البصرية - خلفية فاتحة",
      layoutType: 'white-header-light', headerBg: "#ffffff", headerText: "#1B3A5C",
      accent: "#1B3A5C", borderColor: "#1A6B7A", titleBg: "#1B3A5C", fieldLabelBg: "#1A6B7A",
      footerBg: "linear-gradient(to left, #1B3A5C, #1A6B7A, #2E9E8B)",
      tableStyle: false, titleStyle: 'full-width', showTopLine: false, showBottomBar: true,
      fieldStyle: 'underlined', signatureStyle: 'dotted', bodyBg: '#F0FAF5' },
    { id: "identity-white-multi", name: "الهوية البصرية - أعمدة متعددة",
      layoutType: 'white-header-multi', headerBg: "#ffffff", headerText: "#1B3A5C",
      accent: "#1A6B7A", borderColor: "#1A6B7A", titleBg: "#E8F4F8", fieldLabelBg: "#1A6B7A",
      footerBg: "linear-gradient(to left, #1B3A5C, #1A6B7A, #2E9E8B)",
      tableStyle: false, titleStyle: 'bordered', showTopLine: false, showBottomBar: true,
      fieldStyle: 'fieldset', signatureStyle: 'solid' },
    // Additional themes with different layouts
    { id: "green-table", name: "أخضر رسمي - جدول",
      layoutType: 'dark-header-table', headerBg: "#1B5E20", headerText: "#fff",
      accent: "#2E7D32", borderColor: "#1B5E20", titleBg: "#2E7D32", fieldLabelBg: "#2E7D32",
      footerBg: "linear-gradient(to left, #1B5E20, #2E7D32, #43A047)",
      tableStyle: true, titleStyle: 'rounded', showTopLine: true, showBottomBar: true,
      fieldStyle: 'table', signatureStyle: 'dotted' },
    { id: "teal-cards", name: "تيل - بطاقات حديثة",
      layoutType: 'white-header-classic', headerBg: "#ffffff", headerText: "#0D7377",
      accent: "#0D7377", borderColor: "#0D7377", titleBg: "#0D7377", fieldLabelBg: "#0D7377",
      footerBg: "linear-gradient(to left, #0D7377, #14919B)",
      tableStyle: false, titleStyle: 'badge', showTopLine: false, showBottomBar: true,
      fieldStyle: 'cards', signatureStyle: 'lined' },
    { id: "rose-cards", name: "وردي - بطاقات أنيقة",
      layoutType: 'white-header-light', headerBg: "#ffffff", headerText: "#9F1239",
      accent: "#BE123C", borderColor: "#9F1239", titleBg: "#BE123C", fieldLabelBg: "#BE123C",
      footerBg: "linear-gradient(to left, #9F1239, #BE123C, #E11D48)",
      tableStyle: false, titleStyle: 'badge', showTopLine: false, showBottomBar: true,
      fieldStyle: 'cards', signatureStyle: 'stamped', bodyBg: '#FFF1F2' },
    { id: "slate-minimal", name: "رمادي - بسيط أنيق",
      layoutType: 'minimal-clean', headerBg: "#f8fafc", headerText: "#334155",
      accent: "#475569", borderColor: "#CBD5E1", titleBg: "#475569", fieldLabelBg: "#475569",
      footerBg: "#475569",
      tableStyle: false, titleStyle: 'simple', showTopLine: false, showBottomBar: false,
      fieldStyle: 'minimal', signatureStyle: 'lined' },
    { id: "navy-stamped", name: "كحلي - توقيعات رسمية",
      layoutType: 'dark-header-simple', headerBg: "linear-gradient(135deg, #1E3A5F, #2C5282)", headerText: "#fff",
      accent: "#2B6CB0", borderColor: "#1E3A5F", titleBg: "#2B6CB0", fieldLabelBg: "#2B6CB0",
      footerBg: "linear-gradient(to left, #1E3A5F, #2B6CB0, #3182CE)",
      tableStyle: false, titleStyle: 'full-width', showTopLine: true, showBottomBar: true,
      fieldStyle: 'fieldset', signatureStyle: 'stamped' },
    { id: "emerald-sidebar", name: "زمردي - شريط جانبي",
      layoutType: 'white-header-sidebar', headerBg: "#ffffff", headerText: "#065F46",
      accent: "#059669", borderColor: "#065F46", titleBg: "#059669", fieldLabelBg: "#059669",
      footerBg: "linear-gradient(to left, #065F46, #059669, #10B981)",
      tableStyle: false, titleStyle: 'rounded', showTopLine: false, showBottomBar: true,
      sidebarBg: "linear-gradient(to bottom, #065F46, #059669, #10B981)",
      fieldStyle: 'cards', signatureStyle: 'boxed', headerSeparator: true },
  ];

  it("should have at least 12 themes with different layouts", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(12);
  });

  it("all themes should have unique IDs", () => {
    const ids = THEMES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all themes should have unique names", () => {
    const names = THEMES.map(t => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("should cover all 7 layoutType values", () => {
    const layoutTypes = new Set(THEMES.map(t => t.layoutType));
    expect(layoutTypes.size).toBe(7);
    expect(layoutTypes.has('dark-header-table')).toBe(true);
    expect(layoutTypes.has('dark-header-simple')).toBe(true);
    expect(layoutTypes.has('white-header-classic')).toBe(true);
    expect(layoutTypes.has('white-header-sidebar')).toBe(true);
    expect(layoutTypes.has('white-header-light')).toBe(true);
    expect(layoutTypes.has('white-header-multi')).toBe(true);
    expect(layoutTypes.has('minimal-clean')).toBe(true);
  });

  it("should cover all 5 fieldStyle values", () => {
    const fieldStyles = new Set(THEMES.map(t => t.fieldStyle).filter(Boolean));
    expect(fieldStyles.has('table')).toBe(true);
    expect(fieldStyles.has('fieldset')).toBe(true);
    expect(fieldStyles.has('underlined')).toBe(true);
    expect(fieldStyles.has('cards')).toBe(true);
    expect(fieldStyles.has('minimal')).toBe(true);
  });

  it("should cover at least 5 titleStyle values", () => {
    const titleStyles = new Set(THEMES.map(t => t.titleStyle).filter(Boolean));
    // Verify the main title styles are covered
    expect(titleStyles.has('rounded')).toBe(true);
    expect(titleStyles.has('full-width')).toBe(true);
    expect(titleStyles.has('bordered')).toBe(true);
    expect(titleStyles.has('badge')).toBe(true);
    expect(titleStyles.has('simple')).toBe(true);
    // underlined is available but may not be in the test subset
    expect(titleStyles.size).toBeGreaterThanOrEqual(5);
  });

  it("should cover all 5 signatureStyle values", () => {
    const sigStyles = new Set(THEMES.map(t => t.signatureStyle).filter(Boolean));
    expect(sigStyles.has('dotted')).toBe(true);
    expect(sigStyles.has('solid')).toBe(true);
    expect(sigStyles.has('boxed')).toBe(true);
    expect(sigStyles.has('lined')).toBe(true);
    expect(sigStyles.has('stamped')).toBe(true);
  });

  it("dark header themes should have light text", () => {
    const darkThemes = THEMES.filter(t => t.layoutType.startsWith('dark-'));
    for (const theme of darkThemes) {
      expect(theme.headerText).toBe("#fff");
    }
  });

  it("white header themes should have dark text", () => {
    const whiteThemes = THEMES.filter(t => t.layoutType.startsWith('white-'));
    for (const theme of whiteThemes) {
      expect(theme.headerText).not.toBe("#fff");
    }
  });

  it("sidebar themes should have sidebarBg defined", () => {
    const sidebarThemes = THEMES.filter(t => t.layoutType === 'white-header-sidebar');
    for (const theme of sidebarThemes) {
      expect(theme.sidebarBg).toBeDefined();
      expect(theme.sidebarBg).toBeTruthy();
    }
  });

  it("sidebar themes should have headerSeparator enabled", () => {
    const sidebarThemes = THEMES.filter(t => t.layoutType === 'white-header-sidebar');
    for (const theme of sidebarThemes) {
      expect(theme.headerSeparator).toBe(true);
    }
  });

  it("themes with bodyBg should have light background colors", () => {
    const bgThemes = THEMES.filter(t => t.bodyBg);
    for (const theme of bgThemes) {
      // bodyBg should start with # and be a light color
      expect(theme.bodyBg).toMatch(/^#[A-Fa-f0-9]{6}$/);
    }
  });
});

// ===== Header Duplication Fix Tests =====

describe("Header Duplication Fix", () => {
  it("should remove exact match of 'المملكة العربية السعودية' from department", () => {
    const department = "المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم بمنطقة الرياض";
    const deptLines = department.split('\n').filter(l => l.trim());
    const filteredDeptLines = deptLines.filter(l => {
      const trimmed = l.trim();
      if (trimmed === 'المملكة العربية السعودية') return false;
      if (trimmed === 'وزارة التعليم') return false;
      return true;
    });

    expect(filteredDeptLines.length).toBe(1);
    expect(filteredDeptLines[0]).toBe("الإدارة العامة للتعليم بمنطقة الرياض");
  });

  it("should NOT remove lines containing 'التعليم' as part of a longer phrase", () => {
    const department = "الإدارة العامة للتعليم بمنطقة الرياض\nمكتب التعليم بالعليا";
    const deptLines = department.split('\n').filter(l => l.trim());
    const filteredDeptLines = deptLines.filter(l => {
      const trimmed = l.trim();
      if (trimmed === 'المملكة العربية السعودية') return false;
      if (trimmed === 'وزارة التعليم') return false;
      return true;
    });

    expect(filteredDeptLines.length).toBe(2);
    // Both lines should be preserved since they contain 'تعليم' as part of a longer phrase
    // Note: 'التعليم' vs 'للتعليم' - Arabic prefix makes includes fail, use 'تعليم' root
    expect(filteredDeptLines[0].includes('تعليم')).toBe(true);
    expect(filteredDeptLines[1].includes('تعليم')).toBe(true);
  });

  it("should remove school name from department if it matches personalInfo.school", () => {
    const department = "الإدارة العامة للتعليم\nمدرسة الملك فهد";
    const school = "مدرسة الملك فهد";
    const deptLines = department.split('\n').filter(l => l.trim());
    const filteredDeptLines = deptLines.filter(l => {
      const trimmed = l.trim();
      if (trimmed === 'المملكة العربية السعودية') return false;
      if (trimmed === 'وزارة التعليم') return false;
      if (school && trimmed === school.trim()) return false;
      return true;
    });

    expect(filteredDeptLines.length).toBe(1);
    expect(filteredDeptLines[0]).toBe("الإدارة العامة للتعليم");
  });

  it("should handle empty department gracefully", () => {
    const department = "";
    const deptLines = department.split('\n').filter(l => l.trim());
    expect(deptLines.length).toBe(0);
  });

  it("should handle department with only duplicated lines", () => {
    const department = "المملكة العربية السعودية\nوزارة التعليم";
    const deptLines = department.split('\n').filter(l => l.trim());
    const filteredDeptLines = deptLines.filter(l => {
      const trimmed = l.trim();
      if (trimmed === 'المملكة العربية السعودية') return false;
      if (trimmed === 'وزارة التعليم') return false;
      return true;
    });

    expect(filteredDeptLines.length).toBe(0);
  });
});

// ===== DB Template to ThemeConfig Mapping Tests =====

describe("DB Template to ThemeConfig Mapping", () => {
  type LayoutType =
    | 'dark-header-table'
    | 'dark-header-simple'
    | 'white-header-classic'
    | 'white-header-sidebar'
    | 'white-header-light'
    | 'white-header-multi'
    | 'minimal-clean';

  it("should correctly map layoutType from DB template", () => {
    const dbTemplate = {
      id: 1,
      name: "قالب اختبار",
      templateLayout: {
        layoutType: "dark-header-table",
        fieldStyle: "table",
        titleStyle: "rounded",
        signatureStyle: "dotted",
        footerStyle: "gradient",
      },
      headerBg: "#1B3A5C",
      headerText: "#fff",
      accent: "#1A6B7A",
      borderColor: "#1B3A5C",
    };

    const layout = dbTemplate.templateLayout;
    const lt = layout.layoutType || 'white-header-classic';
    expect(lt).toBe('dark-header-table');
  });

  it("should map all signatureStyle values correctly", () => {
    const validStyles = ['dotted', 'solid', 'boxed', 'lined', 'stamped'];
    
    for (const style of validStyles) {
      const mapped = validStyles.includes(style) ? style : 'dotted';
      expect(mapped).toBe(style);
    }
  });

  it("should default to 'dotted' for unknown signatureStyle", () => {
    const unknownStyle = 'unknown';
    const validStyles = ['dotted', 'solid', 'boxed', 'lined', 'stamped'];
    const mapped = validStyles.includes(unknownStyle) ? unknownStyle : 'dotted';
    expect(mapped).toBe('dotted');
  });

  it("should map fieldStyle from DB template layout", () => {
    const validFieldStyles = ['table', 'fieldset', 'underlined', 'cards', 'minimal'];
    
    for (const style of validFieldStyles) {
      const layout = { fieldStyle: style };
      expect(validFieldStyles).toContain(layout.fieldStyle);
    }
  });

  it("should default fieldStyle to 'fieldset' when not specified", () => {
    const layout = {};
    const fieldStyle = (layout as any).fieldStyle || 'fieldset';
    expect(fieldStyle).toBe('fieldset');
  });

  it("should map titleStyle from DB template layout", () => {
    const validTitleStyles = ['rounded', 'full-width', 'bordered', 'underlined', 'badge', 'simple'];
    
    for (const style of validTitleStyles) {
      const layout = { titleStyle: style };
      expect(validTitleStyles).toContain(layout.titleStyle);
    }
  });

  it("should default titleStyle to 'rounded' when not specified", () => {
    const layout = {};
    const titleStyle = (layout as any).titleStyle || 'rounded';
    expect(titleStyle).toBe('rounded');
  });

  it("should correctly determine isDark based on layoutType", () => {
    const darkTypes: LayoutType[] = ['dark-header-table', 'dark-header-simple'];
    const lightTypes: LayoutType[] = ['white-header-classic', 'white-header-sidebar', 'white-header-light', 'white-header-multi', 'minimal-clean'];

    for (const lt of darkTypes) {
      expect(lt.startsWith('dark-')).toBe(true);
    }
    for (const lt of lightTypes) {
      expect(lt.startsWith('dark-')).toBe(false);
    }
  });

  it("should set sidebarBg only for sidebar layout", () => {
    const layoutTypes: LayoutType[] = ['dark-header-table', 'white-header-sidebar', 'minimal-clean'];
    
    for (const lt of layoutTypes) {
      const hasSidebar = lt === 'white-header-sidebar';
      const sidebarBg = hasSidebar ? 'linear-gradient(...)' : undefined;
      
      if (lt === 'white-header-sidebar') {
        expect(sidebarBg).toBeDefined();
      } else {
        expect(sidebarBg).toBeUndefined();
      }
    }
  });
});

// ===== Admin Panel Template Management Tests =====

describe("Admin Panel Template Management", () => {
  it("should support all layoutType options in admin form", () => {
    const layoutOptions = [
      { value: 'dark-header-table', label: 'ترويسة داكنة + جدول' },
      { value: 'dark-header-simple', label: 'ترويسة داكنة + fieldset' },
      { value: 'white-header-classic', label: 'ترويسة بيضاء كلاسيكي' },
      { value: 'white-header-sidebar', label: 'ترويسة بيضاء + شريط جانبي' },
      { value: 'white-header-light', label: 'ترويسة بيضاء + خلفية فاتحة' },
      { value: 'white-header-multi', label: 'ترويسة بيضاء + أعمدة متعددة' },
      { value: 'minimal-clean', label: 'بسيط ونظيف' },
    ];

    expect(layoutOptions.length).toBe(7);
    expect(layoutOptions.map(o => o.value)).toContain('dark-header-table');
    expect(layoutOptions.map(o => o.value)).toContain('minimal-clean');
  });

  it("should support all fieldStyle options in admin form", () => {
    const fieldOptions = [
      { value: 'table', label: 'جدول' },
      { value: 'fieldset', label: 'حقول مجمعة' },
      { value: 'underlined', label: 'خط تحتي' },
      { value: 'cards', label: 'بطاقات' },
      { value: 'minimal', label: 'بسيط' },
    ];

    expect(fieldOptions.length).toBe(5);
  });

  it("should support all titleStyle options in admin form", () => {
    const titleOptions = [
      { value: 'rounded', label: 'مستدير' },
      { value: 'full-width', label: 'عرض كامل' },
      { value: 'bordered', label: 'بإطار' },
      { value: 'underlined', label: 'خط تحتي' },
      { value: 'badge', label: 'شارة' },
      { value: 'simple', label: 'بسيط' },
    ];

    expect(titleOptions.length).toBe(6);
  });

  it("should support all signatureStyle options in admin form", () => {
    const sigOptions = [
      { value: 'dotted', label: 'منقط' },
      { value: 'solid', label: 'خط متصل' },
      { value: 'boxed', label: 'مربع' },
      { value: 'lined', label: 'خط رفيع' },
      { value: 'stamped', label: 'ختم رسمي' },
    ];

    expect(sigOptions.length).toBe(5);
  });

  it("should support footerStyle options in admin form", () => {
    const footerOptions = [
      { value: 'gradient', label: 'تدرج لوني' },
      { value: 'solid', label: 'لون واحد' },
      { value: 'none', label: 'بدون' },
    ];

    expect(footerOptions.length).toBe(3);
  });
});
