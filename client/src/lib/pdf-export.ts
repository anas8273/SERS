/**
 * نظام تصدير PDF - يستخدم Server-Side Rendering عبر Puppeteer
 * يحل مشكلة الحروف العربية المفككة في html2canvas بشكل نهائي
 * محسّن ليطابق جودة edu-forms.com
 * 
 * الآلية:
 * 1. يأخذ HTML من العنصر المحدد
 * 2. يرسله إلى السيرفر عبر /api/export-pdf
 * 3. السيرفر يستخدم Puppeteer (Chromium) لتحويل HTML إلى PDF
 * 4. النتيجة: PDF بجودة عالية مع نصوص عربية مثالية
 */

export interface PdfTemplate {
  headerBg: string;
  headerText: string;
  accent: string;
  borderColor: string;
  bodyBg: string;
  fontFamily: string;
  coverImageUrl?: string;
  logoUrl?: string;
}

export const DEFAULT_TEMPLATE: PdfTemplate = {
  headerBg: "#0097A7",
  headerText: "#FFFFFF",
  accent: "#0097A7",
  borderColor: "#B2EBF2",
  bodyBg: "#FFFFFF",
  fontFamily: "Cairo",
};

/**
 * تصدير PDF عبر Server-Side Rendering
 * يرسل HTML إلى السيرفر الذي يستخدم Puppeteer لتحويله إلى PDF
 */
export async function exportToPDF(
  elementId: string,
  filename: string = "document.pdf",
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found: " + elementId);

  try {
    onProgress?.(1, 4);

    // Step 1: استخراج HTML من العنصر مع تحويل الأنماط المحسوبة إلى inline styles
    const htmlContent = await extractHtmlWithStyles(element);
    
    onProgress?.(2, 4);

    // Step 2: تحويل الصور إلى data URLs (خطوة منفصلة لتحسين الأداء)
    onProgress?.(3, 4);

    // Step 3: إرسال HTML إلى السيرفر لتحويله إلى PDF
    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: htmlContent, filename }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'PDF export failed');
    }

    // Step 4: تحميل الملف
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onProgress?.(4, 4);
    return true;
  } catch (err) {
    console.error("PDF export error:", err);
    throw err;
  }
}

/**
 * استخراج HTML للتصدير (يستخدم من PDF و Word)
 */
export async function extractHtmlForExport(element: HTMLElement): Promise<string> {
  return extractHtmlWithStyles(element);
}

/**
 * استخراج HTML مع تحويل الأنماط المحسوبة إلى inline styles
 * هذا ضروري لأن Puppeteer لن يكون لديه وصول إلى CSS الأصلي
 */
async function extractHtmlWithStyles(element: HTMLElement): Promise<string> {
  // إخفاء الأزرار مؤقتاً
  const buttons = element.querySelectorAll("button, [data-no-print]");
  const buttonDisplays: string[] = [];
  buttons.forEach((btn, i) => {
    buttonDisplays[i] = (btn as HTMLElement).style.display;
    (btn as HTMLElement).style.display = "none";
  });

  // نسخ العنصر
  const clone = element.cloneNode(true) as HTMLElement;

  // استعادة الأزرار في العنصر الأصلي
  buttons.forEach((btn, i) => {
    (btn as HTMLElement).style.display = buttonDisplays[i];
  });

  // حذف الأزرار من النسخة
  clone.querySelectorAll("button, [data-no-print]").forEach(el => el.remove());

  // تحويل الأنماط المحسوبة إلى inline styles للعناصر الرئيسية
  await inlineComputedStyles(element, clone);

  // تحويل الصور الخارجية إلى data URLs
  await convertImagesToDataUrls(clone);

  // تحويل oklch colors
  convertOklchInClone(clone);

  // إعداد الصفحات
  const pages = clone.querySelectorAll(":scope > div");
  if (pages.length > 0) {
    pages.forEach(page => {
      const el = page as HTMLElement;
      // إخفاء الفواصل الفنية (print:hidden)
      if (el.classList.contains('print:hidden') || el.className.includes('print:hidden')) {
        el.style.display = 'none';
        return;
      }
      el.classList.add('pdf-page');
      // إزالة box-shadow و margin-bottom
      el.style.boxShadow = 'none';
      el.style.marginBottom = '0';
      // ضمان حجم A4 ثابت
      el.style.width = '210mm';
      el.style.height = '297mm';
      el.style.maxHeight = '297mm';
      el.style.overflow = 'hidden';
      el.style.pageBreakAfter = 'always';
      el.style.pageBreakInside = 'avoid';
      el.style.boxSizing = 'border-box';
    });
  }

  return clone.innerHTML;
}

/**
 * تحويل الأنماط المحسوبة إلى inline styles
 * محسّن لنقل جميع الخصائص المهمة بدقة عالية
 */
async function inlineComputedStyles(original: HTMLElement, clone: HTMLElement): Promise<void> {
  const origElements = [original, ...Array.from(original.querySelectorAll("*"))] as HTMLElement[];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[];

  // الخصائص المهمة التي نحتاج نسخها
  const importantProps = [
    'color', 'backgroundColor', 'background', 'backgroundImage',
    'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
    'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
    'textAlign', 'direction', 'display', 'flexDirection', 'justifyContent', 'alignItems',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'width', 'maxWidth', 'minWidth', 'height', 'minHeight', 'maxHeight',
    'position', 'top', 'right', 'bottom', 'left', 'zIndex',
    'overflow', 'whiteSpace', 'wordBreak', 'textDecoration',
    'borderRadius', 'boxShadow', 'opacity', 'filter',
    'gridTemplateColumns', 'gridTemplateRows', 'gap',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'flexWrap',
    'tableLayout', 'borderCollapse', 'borderSpacing',
    'verticalAlign', 'textIndent',
    'clipPath', 'objectFit', 'objectPosition',
    'textOverflow', 'overflowWrap',
  ];

  for (let i = 0; i < Math.min(origElements.length, cloneElements.length); i++) {
    const origEl = origElements[i];
    const cloneEl = cloneElements[i];
    
    // تخطي العناصر المخفية
    if (origEl.offsetParent === null && origEl !== original) continue;

    const computed = window.getComputedStyle(origEl);
    
    for (const prop of importantProps) {
      const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      const value = computed.getPropertyValue(cssProp);
      if (value && value !== '' && value !== 'none' && value !== 'normal' && value !== 'auto') {
        // تحويل oklch إلى RGB
        if (value.includes('oklch')) {
          const rgb = oklchToRgb(value);
          if (rgb) {
            cloneEl.style.setProperty(cssProp, rgb);
            continue;
          }
        }
        cloneEl.style.setProperty(cssProp, value);
      }
    }

    // تأكد من أن الخط العربي مطبق
    cloneEl.style.fontFamily = "'Cairo', 'Tajawal', 'Arial', sans-serif";
  }
}

/**
 * تحويل الصور الخارجية إلى data URLs
 */
async function convertImagesToDataUrls(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  
  const promises = Array.from(images).map(async (img) => {
    const src = img.getAttribute("src") || img.src;
    if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
      try {
        // محاولة مباشرة أولاً
        let dataUrl: string | null = null;
        try {
          const resp = await fetch(src, { mode: "cors" });
          if (resp.ok) {
            const blob = await resp.blob();
            dataUrl = await blobToDataUrl(blob);
          }
        } catch {
          // استخدام proxy
        }
        
        if (!dataUrl) {
          try {
            const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
            const resp = await fetch(proxyUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              dataUrl = await blobToDataUrl(blob);
            }
          } catch {
            // تخطي الصورة
          }
        }
        
        if (dataUrl) {
          img.src = dataUrl;
          img.setAttribute("src", dataUrl);
        }
      } catch {
        // تخطي الصورة
      }
    }
  });

  await Promise.all(promises);

  // تحويل background images أيضاً
  const allElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[];
  for (const el of allElements) {
    const bgImage = el.style.backgroundImage;
    if (bgImage && bgImage.includes("url(")) {
      const urlMatch = bgImage.match(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/);
      if (urlMatch) {
        try {
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(urlMatch[1])}`;
          const resp = await fetch(proxyUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            const dataUrl = await blobToDataUrl(blob);
            el.style.backgroundImage = `url(${dataUrl})`;
          }
        } catch {
          // تخطي
        }
      }
    }
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * تحويل ألوان oklch إلى RGB في النسخة المستنسخة
 */
function convertOklchInClone(element: HTMLElement): void {
  const allElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[];
  const colorProps = [
    "color", "background-color", "border-color", "border-top-color",
    "border-right-color", "border-bottom-color", "border-left-color",
    "background",
  ];

  for (const el of allElements) {
    for (const prop of colorProps) {
      const value = el.style.getPropertyValue(prop);
      if (value && value.includes("oklch")) {
        const rgb = oklchToRgb(value);
        if (rgb) el.style.setProperty(prop, rgb);
      }
    }
  }
}

function oklchToRgb(oklchValue: string): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = oklchValue;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return d[3] < 255
      ? `rgba(${d[0]},${d[1]},${d[2]},${(d[3] / 255).toFixed(3)})`
      : `rgb(${d[0]},${d[1]},${d[2]})`;
  } catch {
    return null;
  }
}

/**
 * تطبيق ثيم القالب على عنصر HTML
 */
export function applyTemplateToElement(element: HTMLElement, template: PdfTemplate) {
  const headers = element.querySelectorAll("[data-pdf-header]");
  headers.forEach((h) => {
    (h as HTMLElement).style.backgroundColor = template.headerBg;
    (h as HTMLElement).style.color = template.headerText;
  });

  const accents = element.querySelectorAll("[data-pdf-accent]");
  accents.forEach((a) => {
    (a as HTMLElement).style.color = template.accent;
  });

  const borders = element.querySelectorAll("[data-pdf-border]");
  borders.forEach((b) => {
    (b as HTMLElement).style.borderColor = template.borderColor;
  });

  element.style.fontFamily = `'${template.fontFamily}', sans-serif`;
}

/**
 * تصدير PDF متعدد التقارير - يجمع عدة عناصر HTML في ملف PDF واحد
 * يتيح للمستخدم تصدير عدة تقارير (شواهد مختلفة) دفعة واحدة
 */
export async function exportMultipleReportsToPDF(
  elementIds: string[],
  filename: string = "تقارير_متعددة.pdf",
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  if (elementIds.length === 0) throw new Error("No elements to export");

  try {
    const total = elementIds.length + 2;
    let combinedHtml = '';

    for (let i = 0; i < elementIds.length; i++) {
      onProgress?.(i + 1, total);
      const element = document.getElementById(elementIds[i]);
      if (!element) continue;
      const htmlContent = await extractHtmlForExport(element);
      combinedHtml += htmlContent;
    }

    if (!combinedHtml) throw new Error("No content to export");

    onProgress?.(elementIds.length + 1, total);

    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: combinedHtml, filename }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'PDF export failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onProgress?.(total, total);
    return true;
  } catch (err) {
    console.error("Multi-PDF export error:", err);
    throw err;
  }
}

/**
 * طباعة عنصر HTML في نافذة جديدة
 * محسّن لجودة طباعة عالية
 */
export function printElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', 'Tajawal', sans-serif; direction: rtl; background: white; }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          [data-no-print] { display: none !important; }
          button { display: none !important; }
          body > div > div {
            page-break-after: always;
            margin: 0 !important;
            box-shadow: none !important;
          }
          body > div > div:last-child { page-break-after: avoid; }
        }
        @page { size: A4; margin: 0; }
      </style>
    </head>
    <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1500);
}
