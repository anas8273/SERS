// ============================================================
// PDF EXPORT UTILITY - Arabic RTL Safe
// Uses html-to-image (better Arabic/RTL support than html2canvas)
// + jspdf for PDF generation
// Handles connected Arabic letters and RTL text correctly
// ============================================================

export interface ExportOptions {
  /** The DOM element to capture */
  element: HTMLElement;
  /** Output format */
  format: 'pdf' | 'png' | 'jpeg';
  /** File name (without extension) */
  fileName?: string;
  /** Canvas width in pixels (for proper scaling) */
  canvasWidth?: number;
  /** Canvas height in pixels (for proper scaling) */
  canvasHeight?: number;
  /** Quality scale factor (1 = normal, 2 = high, 3 = ultra) */
  scale?: number;
  /** JPEG quality (0-1), only for jpeg format */
  quality?: number;
  /** Callback for progress updates */
  onProgress?: (stage: string, percent: number) => void;
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Preload Arabic fonts to ensure they are available during capture.
 * This prevents disconnected Arabic letters in the exported output.
 */
async function preloadArabicFonts(): Promise<void> {
  const fontFamilies = ['Cairo', 'Tajawal', 'Amiri', 'Noto Kufi Arabic'];
  const testString = 'أحمد محمد عبدالله';

  try {
    // Use the Font Loading API to ensure fonts are ready
    if ('fonts' in document) {
      const loadPromises = fontFamilies.map(async (family) => {
        try {
          await document.fonts.load(`16px "${family}"`, testString);
        } catch {
          // Font may not be available, skip
        }
      });
      await Promise.all(loadPromises);
      // Wait for all fonts to be ready
      await document.fonts.ready;
    }
  } catch {
    // Fallback: wait a bit for fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Prepare element for Arabic-safe capture by injecting inline styles
 * that ensure proper RTL rendering in the cloned DOM.
 */
function prepareElementForCapture(element: HTMLElement): () => void {
  const textElements = element.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, label, td, th');
  const originalStyles: Array<{ el: HTMLElement; style: string }> = [];

  textElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    const text = htmlEl.textContent || '';

    // Check if element contains Arabic text
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

    if (hasArabic) {
      originalStyles.push({ el: htmlEl, style: htmlEl.getAttribute('style') || '' });

      // Force inline styles for Arabic text to ensure proper rendering
      htmlEl.style.direction = 'rtl';
      htmlEl.style.unicodeBidi = 'bidi-override';
      htmlEl.style.textRendering = 'optimizeLegibility';
      htmlEl.style.fontFeatureSettings = '"liga" 1, "calt" 1';

      // Ensure font is explicitly set
      if (!htmlEl.style.fontFamily || htmlEl.style.fontFamily === 'inherit') {
        htmlEl.style.fontFamily = computedStyle.fontFamily || '"Cairo", "Tajawal", sans-serif';
      }
    }
  });

  // Return cleanup function
  return () => {
    originalStyles.forEach(({ el, style }) => {
      if (style) {
        el.setAttribute('style', style);
      } else {
        el.removeAttribute('style');
      }
    });
  };
}

/**
 * Export a DOM element as PDF or Image - Arabic RTL Safe
 * Uses html-to-image for better Arabic text rendering
 */
export async function exportElement(options: ExportOptions): Promise<ExportResult> {
  const {
    element,
    format,
    fileName = 'export',
    canvasWidth,
    canvasHeight,
    scale = 2,
    quality = 1.0,
    onProgress,
  } = options;

  try {
    onProgress?.('rendering', 5);

    // Step 1: Preload Arabic fonts
    await preloadArabicFonts();
    onProgress?.('fonts_loaded', 15);

    // Step 2: Import html-to-image (better RTL support than html2canvas)
    const htmlToImage = await import('html-to-image');

    const cw = canvasWidth || element.offsetWidth;
    const ch = canvasHeight || element.offsetHeight;

    // Step 3: Prepare element styles for capture
    const cleanup = prepareElementForCapture(element);
    onProgress?.('capturing', 30);

    // Step 4: Capture using html-to-image with proper settings
    const captureOptions = {
      width: cw,
      height: ch,
      pixelRatio: scale,
      cacheBust: true,
      skipAutoScale: false,
      style: {
        direction: 'rtl' as const,
        overflow: 'visible',
      },
      // Include web fonts
      fontEmbedCSS: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&family=Tajawal:wght@200;300;400;500;700;800;900&family=Amiri:wght@400;700&display=swap');
      `,
      // Filter out problematic elements
      filter: (node: HTMLElement) => {
        // Skip hidden elements and script tags
        if (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT') return false;
        return true;
      },
    };

    let dataUrl: string;
    let blob: Blob;

    if (format === 'jpeg') {
      dataUrl = await htmlToImage.toJpeg(element, { ...captureOptions, quality });
      blob = await (await fetch(dataUrl)).blob();
    } else {
      // PNG for both png and pdf formats
      dataUrl = await htmlToImage.toPng(element, captureOptions);
      blob = await (await fetch(dataUrl)).blob();
    }

    // Step 5: Cleanup inline styles
    cleanup();
    onProgress?.('processing', 60);

    if (format === 'png' || format === 'jpeg') {
      // Direct image download
      onProgress?.('downloading', 90);

      const link = document.createElement('a');
      link.download = `${fileName}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onProgress?.('complete', 100);
      return { success: true, dataUrl, blob };

    } else {
      // PDF generation
      onProgress?.('generating_pdf', 70);

      const jsPDF = (await import('jspdf')).default;
      const isLandscape = cw > ch;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [cw, ch],
        compress: true,
      });

      // Add the captured image to PDF
      pdf.addImage(dataUrl, 'PNG', 0, 0, cw, ch, undefined, 'FAST');

      onProgress?.('downloading', 90);
      pdf.save(`${fileName}.pdf`);

      const pdfBlob = pdf.output('blob');
      onProgress?.('complete', 100);

      return { success: true, blob: pdfBlob };
    }
  } catch (error: any) {
    console.error('Export failed:', error);

    // Fallback: try html2canvas if html-to-image fails
    try {
      return await exportWithHtml2Canvas(options);
    } catch (fallbackError: any) {
      return { success: false, error: error.message || 'Export failed' };
    }
  }
}

/**
 * Fallback export using html2canvas (for cases where html-to-image fails)
 */
async function exportWithHtml2Canvas(options: ExportOptions): Promise<ExportResult> {
  const {
    element,
    format,
    fileName = 'export',
    canvasWidth,
    canvasHeight,
    scale = 2,
    quality = 1.0,
    onProgress,
  } = options;

  const html2canvas = (await import('html2canvas')).default;

  const cw = canvasWidth || element.offsetWidth;
  const ch = canvasHeight || element.offsetHeight;

  const renderedCanvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: cw,
    height: ch,
    windowWidth: cw,
    windowHeight: ch,
    logging: false,
    onclone: (clonedDoc) => {
      // Force Arabic font loading in cloned document
      const style = clonedDoc.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=Amiri:wght@400;700&display=swap');
        * { direction: rtl; unicode-bidi: bidi-override; text-rendering: optimizeLegibility; }
      `;
      clonedDoc.head.appendChild(style);
    },
  });

  if (format === 'png' || format === 'jpeg') {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = renderedCanvas.toDataURL(mimeType, quality);
    const link = document.createElement('a');
    link.download = `${fileName}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    const blob = await new Promise<Blob>((resolve) => {
      renderedCanvas.toBlob((b) => resolve(b!), mimeType, quality);
    });
    return { success: true, dataUrl, blob };
  } else {
    const jsPDF = (await import('jspdf')).default;
    const isLandscape = cw > ch;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [cw, ch],
      compress: true,
    });
    const imgData = renderedCanvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, cw, ch, undefined, 'FAST');
    pdf.save(`${fileName}.pdf`);
    const pdfBlob = pdf.output('blob');
    return { success: true, blob: pdfBlob };
  }
}

/**
 * Bulk export: Generate multiple pages as a single PDF or ZIP of images
 * Used by the Bulk Generator feature
 */
export async function bulkExportPDF(
  renderFn: (rowData: Record<string, any>, index: number) => HTMLElement,
  rows: Record<string, any>[],
  options: {
    fileName?: string;
    canvasWidth: number;
    canvasHeight: number;
    scale?: number;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<ExportResult> {
  const { fileName = 'bulk_export', canvasWidth, canvasHeight, scale = 2, onProgress } = options;

  try {
    const jsPDF = (await import('jspdf')).default;
    const htmlToImage = await import('html-to-image');

    await preloadArabicFonts();

    const isLandscape = canvasWidth > canvasHeight;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvasWidth, canvasHeight],
      compress: true,
    });

    for (let i = 0; i < rows.length; i++) {
      onProgress?.(i + 1, rows.length);

      const element = renderFn(rows[i], i);
      document.body.appendChild(element);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const cleanup = prepareElementForCapture(element);

      const dataUrl = await htmlToImage.toPng(element, {
        width: canvasWidth,
        height: canvasHeight,
        pixelRatio: scale,
        cacheBust: true,
        fontEmbedCSS: `
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap');
        `,
      });

      cleanup();
      document.body.removeChild(element);

      if (i > 0) {
        pdf.addPage([canvasWidth, canvasHeight], isLandscape ? 'landscape' : 'portrait');
      }

      pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight, undefined, 'FAST');
    }

    pdf.save(`${fileName}.pdf`);
    const pdfBlob = pdf.output('blob');

    return { success: true, blob: pdfBlob };
  } catch (error: any) {
    console.error('Bulk export failed:', error);
    return { success: false, error: error.message || 'Bulk export failed' };
  }
}

/**
 * Bulk export as ZIP of individual images
 */
export async function bulkExportZIP(
  renderFn: (rowData: Record<string, any>, index: number) => HTMLElement,
  rows: Record<string, any>[],
  options: {
    fileName?: string;
    canvasWidth: number;
    canvasHeight: number;
    scale?: number;
    format?: 'png' | 'jpeg';
    onProgress?: (current: number, total: number) => void;
  }
): Promise<ExportResult> {
  const { fileName = 'bulk_export', canvasWidth, canvasHeight, scale = 2, format = 'png', onProgress } = options;

  try {
    const JSZip = (await import('jszip')).default;
    const htmlToImage = await import('html-to-image');

    await preloadArabicFonts();

    const zip = new JSZip();

    for (let i = 0; i < rows.length; i++) {
      onProgress?.(i + 1, rows.length);

      const element = renderFn(rows[i], i);
      document.body.appendChild(element);
      await new Promise(resolve => setTimeout(resolve, 100));

      const cleanup = prepareElementForCapture(element);

      let dataUrl: string;
      if (format === 'jpeg') {
        dataUrl = await htmlToImage.toJpeg(element, {
          width: canvasWidth,
          height: canvasHeight,
          pixelRatio: scale,
          quality: 0.95,
          cacheBust: true,
        });
      } else {
        dataUrl = await htmlToImage.toPng(element, {
          width: canvasWidth,
          height: canvasHeight,
          pixelRatio: scale,
          cacheBust: true,
        });
      }

      cleanup();
      document.body.removeChild(element);

      // Convert data URL to binary
      const base64 = dataUrl.split(',')[1];
      const imgFileName = `${String(i + 1).padStart(3, '0')}_${rows[i]?.name || rows[i]?.['الاسم'] || `item_${i + 1}`}.${format}`;
      zip.file(imgFileName, base64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Download ZIP
    const link = document.createElement('a');
    link.download = `${fileName}.zip`;
    link.href = URL.createObjectURL(zipBlob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    return { success: true, blob: zipBlob };
  } catch (error: any) {
    console.error('Bulk ZIP export failed:', error);
    return { success: false, error: error.message || 'Bulk ZIP export failed' };
  }
}

/**
 * Generate a preview thumbnail of the template
 */
export async function generateThumbnail(
  element: HTMLElement,
  maxWidth: number = 400
): Promise<string | null> {
  try {
    const htmlToImage = await import('html-to-image');
    const scaleFactor = maxWidth / element.offsetWidth;

    return await htmlToImage.toPng(element, {
      pixelRatio: scaleFactor,
      cacheBust: true,
    });
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    // Fallback to html2canvas
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        scale: maxWidth / element.offsetWidth,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch {
      return null;
    }
  }
}

/**
 * Print the template directly
 */
export function printElement(element: HTMLElement) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&family=Tajawal:wght@200;300;400;500;700;800;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @page { margin: 0; size: auto; }
        body { margin: 0; padding: 0; direction: rtl; }
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
          text-rendering: optimizeLegibility;
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for fonts and images to load
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1500);
}
