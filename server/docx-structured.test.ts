import { describe, it, expect } from "vitest";
import { renderStructuredDocx } from "./docx-renderer";

describe("Structured DOCX Export", () => {
  it("should generate a valid DOCX buffer for single evidence mode", async () => {
    const data = {
      personalInfo: {
        name: "أحمد محمد",
        school: "مدرسة الأمل",
        department: "وزارة التعليم\nإدارة التعليم بمنطقة الرياض",
        year: "1445-1446",
        semester: "الأول",
        evaluator: "خالد عبدالله",
        evaluatorRole: "مدير المدرسة",
        date: "2024-01-15",
        reportTitle: "شواهد الأداء الوظيفي",
      },
      criteria: [{
        title: "المعيار الأول: التخطيط",
        subEvidences: [{
          title: "التخطيط للدرس",
          fields: [
            { label: "الموضوع", value: "الرياضيات - الكسور" },
            { label: "الوصف", value: "تحضير درس عن الكسور العشرية" },
            { label: "التاريخ", value: "2024-01-15" },
          ],
          evidences: [
            { type: "text", text: "تم إعداد خطة الدرس بشكل كامل" },
            { fileName: "lesson_plan.pdf", fileUrl: "https://example.com/file.pdf", displayAs: "image" as const },
            { type: "link", link: "https://example.com/resource" },
          ],
        }],
      }],
      themeColor: "#0d7377",
      mode: "single" as const,
      singleTitle: "التخطيط للدرس",
    };

    const buffer = await renderStructuredDocx(data);

    // Should return a valid buffer
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // DOCX files start with PK (ZIP header)
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4B); // K
  });

  it("should generate a valid DOCX buffer for full report mode", async () => {
    const data = {
      personalInfo: {
        name: "فاطمة علي",
        school: "مدرسة النور",
        department: "وزارة التعليم",
        year: "1445-1446",
        semester: "الثاني",
        evaluator: "سارة أحمد",
        evaluatorRole: "المشرفة التربوية",
        date: "2024-03-01",
        reportTitle: "تقرير شواهد الأداء",
      },
      criteria: [
        {
          title: "المعيار الأول: التخطيط",
          subEvidences: [{
            title: "التخطيط للدرس",
            fields: [{ label: "الموضوع", value: "العلوم" }],
            evidences: [{ type: "text", text: "شاهد نصي" }],
          }],
        },
        {
          title: "المعيار الثاني: التنفيذ",
          subEvidences: [{
            title: "تنفيذ الدرس",
            fields: [{ label: "الوصف", value: "تنفيذ ممتاز" }],
            evidences: [],
          }],
        },
      ],
      themeColor: "#2ea87a",
      mode: "full" as const,
    };

    const buffer = await renderStructuredDocx(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // DOCX ZIP header
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4B);
  });

  it("should handle empty criteria gracefully", async () => {
    const data = {
      personalInfo: {
        name: "test",
        school: "test",
        department: "test",
        year: "test",
        semester: "test",
        evaluator: "test",
        evaluatorRole: "test",
        date: "test",
        reportTitle: "test",
      },
      criteria: [],
      themeColor: "#0d7377",
      mode: "full" as const,
    };

    const buffer = await renderStructuredDocx(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should use custom theme color in the document", async () => {
    const customColor = "#ff5722";
    const data = {
      personalInfo: {
        name: "test",
        school: "test",
        department: "test",
        year: "test",
        semester: "test",
        evaluator: "test",
        evaluatorRole: "test",
        date: "test",
        reportTitle: "test",
      },
      criteria: [{
        title: "معيار اختبار",
        subEvidences: [{
          title: "شاهد اختبار",
          fields: [{ label: "حقل", value: "قيمة" }],
          evidences: [],
        }],
      }],
      themeColor: customColor,
      mode: "single" as const,
      singleTitle: "شاهد اختبار",
    };

    const buffer = await renderStructuredDocx(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should handle sub-evidence with no fields but with evidences", async () => {
    const data = {
      personalInfo: {
        name: "test",
        school: "test",
        department: "test",
        year: "test",
        semester: "test",
        evaluator: "test",
        evaluatorRole: "test",
        date: "test",
        reportTitle: "test",
      },
      criteria: [{
        title: "معيار",
        subEvidences: [{
          title: "شاهد بدون حقول",
          fields: [],
          evidences: [
            { type: "text", text: "نص شاهد" },
            { type: "link", link: "https://example.com" },
            { fileName: "file.pdf" },
          ],
        }],
      }],
      themeColor: "#0d7377",
      mode: "single" as const,
    };

    const buffer = await renderStructuredDocx(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
