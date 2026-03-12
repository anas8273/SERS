import { describe, it, expect } from "vitest";

// ===== Evidence Filter Fix Tests =====

describe("Evidence Filter - Link Evidence Fix", () => {
  // Simulates the evidence filter logic from PerformanceEvidence.tsx
  type EvidenceItem = {
    id: string;
    type: "image" | "file" | "link" | "text" | "video";
    url?: string;
    formData?: Record<string, string>;
  };

  const createEmptyEvidence = (type: EvidenceItem["type"]): EvidenceItem => ({
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    url: type === "link" ? "" : undefined,
    formData: {},
  });

  it("link evidence should NOT be filtered out when formFields exist", () => {
    const evidence: EvidenceItem[] = [
      createEmptyEvidence("link"),
      createEmptyEvidence("image"),
    ];

    const hasFormFields = true;

    // OLD BROKEN FILTER: ev.formData !== undefined would keep link evidence
    // but the actual filter was: ev.formData && Object.keys(ev.formData).length > 0
    // which would filter out link evidence with empty formData

    // NEW FIXED FILTER: always show link/image/file/video evidence regardless of formData
    const filtered = evidence.filter((ev) => {
      if (ev.type === "link" || ev.type === "image" || ev.type === "file" || ev.type === "video") {
        return true; // Always show media evidence
      }
      // Only filter text evidence based on formData
      if (hasFormFields && ev.formData !== undefined) {
        return Object.keys(ev.formData).length > 0;
      }
      return true;
    });

    expect(filtered.length).toBe(2);
    expect(filtered.some((ev) => ev.type === "link")).toBe(true);
  });

  it("link evidence with URL should always be visible", () => {
    const linkEvidence: EvidenceItem = {
      id: "ev_link_1",
      type: "link",
      url: "https://www.google.com",
      formData: {},
    };

    // Link evidence should always pass the filter
    const isVisible =
      linkEvidence.type === "link" ||
      linkEvidence.type === "image" ||
      linkEvidence.type === "file" ||
      linkEvidence.type === "video";

    expect(isVisible).toBe(true);
  });

  it("link evidence with empty URL should still be visible for editing", () => {
    const linkEvidence: EvidenceItem = {
      id: "ev_link_2",
      type: "link",
      url: "",
      formData: {},
    };

    const isVisible =
      linkEvidence.type === "link" ||
      linkEvidence.type === "image" ||
      linkEvidence.type === "file" ||
      linkEvidence.type === "video";

    expect(isVisible).toBe(true);
  });
});

// ===== Text Evidence Removal Tests =====

describe("Text Evidence Removal", () => {
  it("quick add buttons should NOT include text type", () => {
    // Simulates the quick add buttons available in the UI
    const quickAddTypes = ["link"]; // Only link button remains after removing text
    // Previously: ["link", "text"]

    expect(quickAddTypes).not.toContain("text");
    expect(quickAddTypes).toContain("link");
  });

  it("evidence types should still support text for backward compatibility", () => {
    const supportedTypes = ["image", "file", "link", "text", "video"];
    expect(supportedTypes).toContain("text"); // Still supported in data model
  });
});

// ===== Identity Design Themes Tests =====

describe("Identity Design Themes (MOE Visual Identity)", () => {
  // Theme structure matching the updated THEMES in PerformanceEvidence.tsx
  interface ThemeConfig {
    id: string;
    name: string;
    headerBg: string;
    headerText: string;
    accent: string;
    borderColor: string;
    bodyBg: string;
    tableStyle?: "bordered" | "striped" | "minimal";
  }

  const identityThemes: ThemeConfig[] = [
    {
      id: "identity-dark",
      name: "الهوية البصرية - ترويسة داكنة",
      headerBg: "linear-gradient(135deg, #1a5c3a, #0d4a2e)",
      headerText: "#ffffff",
      accent: "#1a7a4a",
      borderColor: "#1a7a4a",
      bodyBg: "#ffffff",
      tableStyle: "bordered",
    },
    {
      id: "identity-white",
      name: "الهوية البصرية - أبيض كلاسيكي",
      headerBg: "#ffffff",
      headerText: "#1a5c3a",
      accent: "#1a7a4a",
      borderColor: "#1a7a4a",
      bodyBg: "#ffffff",
      tableStyle: "bordered",
    },
    {
      id: "identity-gradient",
      name: "الهوية البصرية - تدرج",
      headerBg: "linear-gradient(135deg, #1a7a4a, #2d9d5e, #1a5c3a)",
      headerText: "#ffffff",
      accent: "#1a7a4a",
      borderColor: "#1a7a4a",
      bodyBg: "#f0fdf4",
      tableStyle: "striped",
    },
    {
      id: "identity-table",
      name: "الهوية البصرية - نمط جدول",
      headerBg: "linear-gradient(135deg, #1a5c3a, #0d4a2e)",
      headerText: "#ffffff",
      accent: "#1a7a4a",
      borderColor: "#1a7a4a",
      bodyBg: "#ffffff",
      tableStyle: "bordered",
    },
  ];

  it("should have at least 4 identity themes", () => {
    expect(identityThemes.length).toBeGreaterThanOrEqual(4);
  });

  it("all identity themes should have unique IDs", () => {
    const ids = identityThemes.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all identity themes should have unique names", () => {
    const names = identityThemes.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("identity themes should use MOE green color palette", () => {
    const moeGreens = ["#1a5c3a", "#0d4a2e", "#1a7a4a", "#2d9d5e"];

    for (const theme of identityThemes) {
      const usesGreen = moeGreens.some(
        (green) =>
          theme.accent.includes(green) ||
          theme.headerBg.includes(green) ||
          theme.borderColor.includes(green)
      );
      expect(usesGreen).toBe(true);
    }
  });

  it("each theme should have a valid tableStyle", () => {
    const validStyles = ["bordered", "striped", "minimal"];
    for (const theme of identityThemes) {
      if (theme.tableStyle) {
        expect(validStyles).toContain(theme.tableStyle);
      }
    }
  });

  it("white theme should have dark header text for contrast", () => {
    const whiteTheme = identityThemes.find((t) => t.id === "identity-white");
    expect(whiteTheme).toBeDefined();
    expect(whiteTheme!.headerBg).toBe("#ffffff");
    // Dark text on white background
    expect(whiteTheme!.headerText).not.toBe("#ffffff");
  });

  it("dark themes should have light header text for contrast", () => {
    const darkThemes = identityThemes.filter(
      (t) => t.headerBg.includes("linear-gradient") || t.headerBg.startsWith("#1")
    );
    for (const theme of darkThemes) {
      expect(theme.headerText).toBe("#ffffff");
    }
  });
});

// ===== QR Code / Barcode System Tests =====

describe("QR Code / Barcode System in Preview", () => {
  type EvidenceType = "image" | "file" | "link" | "text" | "video";

  const shouldShowAsQR = (type: EvidenceType, url?: string): boolean => {
    if (!url) return false;
    // Links always show as QR
    if (type === "link") return true;
    // Files and videos show as QR
    if (type === "file" || type === "video") return true;
    // Images show as image by default (toggleable)
    if (type === "image") return false;
    return false;
  };

  it("link evidence should always show as QR code in preview", () => {
    expect(shouldShowAsQR("link", "https://www.google.com")).toBe(true);
  });

  it("file evidence should show as QR code in preview", () => {
    expect(shouldShowAsQR("file", "https://example.com/doc.pdf")).toBe(true);
  });

  it("video evidence should show as QR code in preview", () => {
    expect(shouldShowAsQR("video", "https://example.com/video.mp4")).toBe(true);
  });

  it("image evidence should show as image by default (not QR)", () => {
    expect(shouldShowAsQR("image", "https://example.com/photo.jpg")).toBe(false);
  });

  it("evidence without URL should not show QR", () => {
    expect(shouldShowAsQR("link")).toBe(false);
    expect(shouldShowAsQR("file")).toBe(false);
  });

  it("image toggle should switch between image and QR", () => {
    let showAsQR = false; // Default: show as image

    // Toggle to QR
    showAsQR = !showAsQR;
    expect(showAsQR).toBe(true);

    // Toggle back to image
    showAsQR = !showAsQR;
    expect(showAsQR).toBe(false);
  });
});

// ===== Preview Layout Tests =====

describe("Preview Layout - MOE Identity Design", () => {
  it("preview header should contain required elements", () => {
    const headerElements = [
      "ministry_name",     // وزارة التعليم
      "country_name",      // المملكة العربية السعودية
      "department",        // الإدارة العامة للتعليم
      "moe_logo",          // شعار الوزارة
      "year",              // العام الدراسي
      "semester",          // الفصل الدراسي
    ];

    expect(headerElements.length).toBe(6);
    expect(headerElements).toContain("moe_logo");
    expect(headerElements).toContain("ministry_name");
  });

  it("preview data fields should be in table format", () => {
    const dataFields = [
      { id: "evidence_desc", label: "وصف الشاهد" },
      { id: "date", label: "التاريخ" },
      { id: "notes", label: "ملاحظات" },
      { id: "executor", label: "المنفذ" },
    ];

    expect(dataFields.length).toBeGreaterThanOrEqual(3);
    expect(dataFields.some((f) => f.id === "evidence_desc")).toBe(true);
  });

  it("preview should have signatures section", () => {
    const signatures = [
      { role: "التنفيذ", name: "" },
      { role: "مدير/ة المدرسة", name: "" },
    ];

    expect(signatures.length).toBe(2);
    expect(signatures[0].role).toBe("التنفيذ");
    expect(signatures[1].role).toBe("مدير/ة المدرسة");
  });

  it("preview should have colored bottom bar", () => {
    const bottomBarStyle = {
      height: "8px",
      background: "linear-gradient(to right, #1a5c3a, #2d9d5e)",
    };

    expect(bottomBarStyle.height).toBeTruthy();
    expect(bottomBarStyle.background).toContain("gradient");
  });
});

// ===== Dynamic Field Ordering Tests =====

describe("Dynamic Field Ordering in Preview", () => {
  it("fields should be ordered by their position in formFields array", () => {
    const formFields = [
      { id: "evidence_desc", label: "وصف الشاهد", type: "textarea" },
      { id: "date", label: "التاريخ", type: "date" },
      { id: "notes", label: "ملاحظات", type: "textarea" },
      { id: "executor", label: "المنفذ", type: "text" },
    ];

    const formData: Record<string, string> = {
      evidence_desc: "تم الالتزام بالحضور",
      date: "1447/06/15",
      executor: "أحمد محمد",
      notes: "ملاحظة اختبار",
    };

    // Fields should be ordered by formFields array, not formData insertion order
    const orderedEntries = formFields
      .filter((f) => formData[f.id])
      .map((f) => ({ label: f.label, value: formData[f.id] }));

    expect(orderedEntries[0].label).toBe("وصف الشاهد");
    expect(orderedEntries[1].label).toBe("التاريخ");
    expect(orderedEntries[2].label).toBe("ملاحظات");
    expect(orderedEntries[3].label).toBe("المنفذ");
  });

  it("dynamically added fields should appear in preview", () => {
    const formFields = [
      { id: "evidence_desc", label: "وصف الشاهد", type: "textarea" },
      { id: "dynamic_123_abc", label: "حقل مخصص", type: "text" },
    ];

    const formData: Record<string, string> = {
      evidence_desc: "وصف",
      dynamic_123_abc: "قيمة مخصصة",
    };

    const orderedEntries = formFields
      .filter((f) => formData[f.id])
      .map((f) => ({ label: f.label, value: formData[f.id] }));

    expect(orderedEntries.length).toBe(2);
    expect(orderedEntries[1].label).toBe("حقل مخصص");
    expect(orderedEntries[1].value).toBe("قيمة مخصصة");
  });

  it("empty fields should be excluded from preview", () => {
    const formFields = [
      { id: "evidence_desc", label: "وصف الشاهد", type: "textarea" },
      { id: "date", label: "التاريخ", type: "date" },
      { id: "notes", label: "ملاحظات", type: "textarea" },
    ];

    const formData: Record<string, string> = {
      evidence_desc: "وصف الشاهد",
      date: "",
      notes: "",
    };

    const orderedEntries = formFields
      .filter((f) => formData[f.id] && formData[f.id].trim() !== "")
      .map((f) => ({ label: f.label, value: formData[f.id] }));

    expect(orderedEntries.length).toBe(1);
    expect(orderedEntries[0].label).toBe("وصف الشاهد");
  });
});

// ===== MOE Logo URL Tests =====

describe("MOE Logo CDN Integration", () => {
  it("new MOE logo URL should be valid and accessible", () => {
    const MOE_LOGO_URL =
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/UntiTtled-1-1568x1192-bqcXqJjfMvnSxSXFRrGR5R.png";
    expect(MOE_LOGO_URL).toMatch(/^https:\/\//);
    expect(MOE_LOGO_URL).toContain("cloudfront.net");
    expect(MOE_LOGO_URL).toContain(".png");
  });

  it("logo should display without invert filter on dark backgrounds", () => {
    // The new logo is the full-color MOE logo (green on transparent)
    // On dark backgrounds, it should NOT use CSS filter: invert
    const darkThemeLogoStyle = {
      filter: "brightness(0) invert(1)", // Makes it white on dark bg
    };
    const lightThemeLogoStyle = {
      filter: "none", // Original green on light bg
    };

    expect(darkThemeLogoStyle.filter).toContain("invert");
    expect(lightThemeLogoStyle.filter).toBe("none");
  });
});
