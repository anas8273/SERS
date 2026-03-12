import puppeteer from "puppeteer";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true as any,
    timeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
      "--disable-lcd-text",
      "--enable-font-antialiasing",
      "--force-color-profile=srgb",
    ],
  });
  return browserInstance;
}

/**
 * تحويل HTML إلى PDF باستخدام Puppeteer
 * يدعم اللغة العربية بشكل كامل لأن Chromium يعرض النص بشكل صحيح
 * جودة عالية جداً مع خطوط واضحة وإطارات حادة
 */
export async function renderHtmlToPdf(
  htmlContent: string,
  options?: {
    format?: "A4" | "Letter";
    landscape?: boolean;
    printBackground?: boolean;
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
    scale?: number;
  }
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // تعيين viewport بحجم A4 بدقة عالية (3x للجودة القصوى)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 3 });

    // تحميل HTML مع الخطوط العربية
    const fullHtml = wrapWithFonts(htmlContent);
    await page.setContent(fullHtml, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 60000,
    });

    // انتظار تحميل الخطوط
    await page.evaluate(() => document.fonts.ready);
    
    // انتظار إضافي لضمان تحميل الخطوط العربية بالكامل
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // انتظار تحميل الصور
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const images = document.querySelectorAll("img");
        if (images.length === 0) return resolve();
        let loaded = 0;
        const total = images.length;
        images.forEach((img) => {
          if (img.complete) {
            loaded++;
            if (loaded >= total) resolve();
          } else {
            img.onload = () => { loaded++; if (loaded >= total) resolve(); };
            img.onerror = () => { loaded++; if (loaded >= total) resolve(); };
          }
        });
        // Timeout fallback
        setTimeout(resolve, 10000);
      });
    });

    // إنشاء PDF بجودة عالية
    const pdfBuffer = await page.pdf({
      format: options?.format || "A4",
      landscape: options?.landscape || false,
      printBackground: options?.printBackground !== false,
      margin: options?.margin || { top: "0", right: "0", bottom: "0", left: "0" },
      scale: options?.scale || 1,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * تغليف HTML بالخطوط العربية والأنماط الأساسية
 * يستخدم خطوط Tajawal و Cairo مع أنماط طباعة عالية الجودة
 * محسّن ليطابق جودة edu-forms.com
 */
function wrapWithFonts(html: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      font-family: 'Cairo', 'Tajawal', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
      background: white;
      font-size: 14px;
      line-height: 1.7;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      font-feature-settings: 'liga' 1, 'calt' 1;
    }
    body {
      width: 210mm;
      min-height: 297mm;
    }
    .pdf-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      page-break-after: always;
      page-break-inside: avoid;
      position: relative;
      overflow: hidden;
      background: white;
      box-sizing: border-box;
    }
    .pdf-page:last-child {
      page-break-after: auto;
    }
    /* ضمان أن كل صفحة تأخذ حجم A4 بالضبط */
    body > div > div {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      box-sizing: border-box;
    }
    body > div > div:last-child {
      page-break-after: auto;
    }
    /* الفواصل الفنية بين الصفحات - إخفاؤها في PDF */
    [class*="print:hidden"], .print\:hidden {
      display: none !important;
    }
    button, [data-no-print] {
      display: none !important;
    }
    img {
      max-width: 100%;
      display: inline-block;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    td, th {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Cairo', 'Tajawal', sans-serif;
      font-weight: 700;
    }
    hr, .separator {
      border: none;
      height: 2px;
      background: currentColor;
    }
    [style*="border"] {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .field-row, .evidence-item {
      page-break-inside: avoid;
    }
    /* تحسينات جودة الطباعة */
    svg {
      shape-rendering: geometricPrecision;
    }
    /* تحسين عرض الباركود */
    img[alt="QR"], img[alt="qr"] {
      image-rendering: pixelated;
    }
    /* ضمان عدم وجود فراغات بين الصفحات */
    body > div > div {
      margin-bottom: 0 !important;
      box-shadow: none !important;
    }
    /* تحسين الجداول */
    table td, table th {
      word-break: break-word;
    }
    /* تحسين الألوان والتدرجات */
    [style*="linear-gradient"] {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * تحويل HTML إلى Word عبر PDF كوسيط
 * ينشئ PDF أولاً ثم يحول كل صفحة إلى صورة PNG عبر pdftoppm ويضعها في Word
 * هذا يضمن تطابق 100% مع المعاينة
 */
export async function renderHtmlToDocxPuppeteer(htmlContent: string): Promise<Buffer> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-export-'));
  
  try {
    // الخطوة 1: إنشاء PDF من HTML
    const pdfBuffer = await renderHtmlToPdf(htmlContent, {
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      scale: 1,
    });

    // حفظ PDF مؤقتاً
    const pdfPath = path.join(tmpDir, 'export.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);

    // الخطوة 2: تحويل PDF إلى صور PNG عبر pdftoppm (جودة عالية 300 DPI)
    const outputPrefix = path.join(tmpDir, 'page');
    execSync(`pdftoppm -png -r 300 "${pdfPath}" "${outputPrefix}"`, { timeout: 120000 });

    // قراءة جميع الصور المنتجة
    const pngFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort();

    if (pngFiles.length === 0) {
      throw new Error('pdftoppm لم ينتج أي صور');
    }

    const pageImages: Buffer[] = pngFiles.map(f => fs.readFileSync(path.join(tmpDir, f)));

    // الخطوة 3: بناء مستند Word مع صورة لكل صفحة
    const {
      Document: Doc,
      Packer: Pack,
      Paragraph: Para,
      ImageRun: ImgRun,
      AlignmentType: Align,
      PageOrientation: Orient,
    } = await import("docx");

    const sections = pageImages.map((imgBuf) => ({
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: Orient.PORTRAIT },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        new Para({
          alignment: Align.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new ImgRun({
              data: imgBuf,
              transformation: { width: 595, height: 842 },
              type: "png",
            }),
          ],
        }),
      ],
    }));

    const doc = new Doc({ sections });
    const buffer = await Pack.toBuffer(doc);
    return Buffer.from(buffer);
  } catch (err) {
    console.error('[renderHtmlToDocxPuppeteer] Error:', err);
    throw err;
  } finally {
    // تنظيف الملفات المؤقتة
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

/**
 * إغلاق المتصفح عند إيقاف السيرفر
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
