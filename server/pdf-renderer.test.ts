import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHtmlToPdf, closeBrowser } from "./pdf-renderer";

describe("pdf-renderer", () => {
  afterEach(async () => {
    await closeBrowser();
  });

  it("renders simple Arabic HTML to PDF buffer", async () => {
    const html = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl;">
        <h1>المملكة العربية السعودية</h1>
        <p>وزارة التعليم</p>
      </div>
    `;

    const pdfBuffer = await renderHtmlToPdf(html);

    // يجب أن يكون Buffer
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    // يجب أن يبدأ بـ %PDF
    expect(pdfBuffer.toString("utf-8", 0, 5)).toBe("%PDF-");
    // يجب أن يكون حجمه معقول (أكبر من 1KB)
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  }, 30000);

  it("renders HTML with table to PDF", async () => {
    const html = `
      <div style="padding: 20px; direction: rtl;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">الموضوع</th>
            <th style="border: 1px solid #ccc; padding: 8px;">الوصف</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ccc; padding: 8px;">الالتزام بمواعيد الحضور</td>
            <td style="border: 1px solid #ccc; padding: 8px;">تم الالتزام بنسبة 100%</td>
          </tr>
        </table>
      </div>
    `;

    const pdfBuffer = await renderHtmlToPdf(html);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.toString("utf-8", 0, 5)).toBe("%PDF-");
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  }, 30000);

  it("respects custom options (landscape, Letter format)", async () => {
    const html = `<div style="padding: 20px;"><h1>Test</h1></div>`;

    const pdfBuffer = await renderHtmlToPdf(html, {
      format: "Letter",
      landscape: true,
      printBackground: true,
    });

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.toString("utf-8", 0, 5)).toBe("%PDF-");
  }, 30000);

  it("handles empty HTML gracefully", async () => {
    const pdfBuffer = await renderHtmlToPdf("");

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.toString("utf-8", 0, 5)).toBe("%PDF-");
  }, 30000);

  it("handles HTML with images (broken image fallback)", async () => {
    const html = `
      <div style="padding: 20px; direction: rtl;">
        <img src="https://invalid-url-that-does-not-exist.com/image.png" alt="شعار" />
        <p>نص بعد الصورة</p>
      </div>
    `;

    // يجب ألا يفشل حتى مع صورة غير موجودة
    const pdfBuffer = await renderHtmlToPdf(html);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.toString("utf-8", 0, 5)).toBe("%PDF-");
  }, 30000);
});

describe("closeBrowser", () => {
  it("does not throw when called without an active browser", async () => {
    // يجب ألا يرمي خطأ عند استدعائه بدون متصفح نشط
    await expect(closeBrowser()).resolves.not.toThrow();
  });
});
