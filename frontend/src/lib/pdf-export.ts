// ============================================================
// PDF EXPORT UTILITY
// Client-side PDF generation using html2canvas + jspdf
// Supports high-quality export with Arabic text rendering
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
 * Export a DOM element as PDF or Image
 * Uses html2canvas to render the element and jspdf for PDF generation
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
    onProgress?.('rendering', 10);

    // Dynamic import for client-side only
    const html2canvas = (await import('html2canvas')).default;

    // Prepare element for capture
    const originalOverflow = element.style.overflow;
    element.style.overflow = 'visible';

    onProgress?.('capturing', 30);

    // Render to canvas
    const renderedCanvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: canvasWidth || element.offsetWidth,
      height: canvasHeight || element.offsetHeight,
      windowWidth: canvasWidth || element.offsetWidth,
      windowHeight: canvasHeight || element.offsetHeight,
      logging: false,
      // Ensure Arabic fonts are loaded
      onclone: (clonedDoc) => {
        // Add Arabic font support to cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=Amiri:wght@400;700&display=swap');
          * { direction: rtl; }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    // Restore original overflow
    element.style.overflow = originalOverflow;

    onProgress?.('processing', 60);

    if (format === 'png' || format === 'jpeg') {
      // Export as image
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = renderedCanvas.toDataURL(mimeType, quality);

      onProgress?.('downloading', 90);

      // Trigger download
      const link = document.createElement('a');
      link.download = `${fileName}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        renderedCanvas.toBlob((b) => resolve(b!), mimeType, quality);
      });

      onProgress?.('complete', 100);

      return { success: true, dataUrl, blob };
    } else {
      // Export as PDF
      const jsPDF = (await import('jspdf')).default;

      const cw = canvasWidth || element.offsetWidth;
      const ch = canvasHeight || element.offsetHeight;
      const isLandscape = cw > ch;

      onProgress?.('generating_pdf', 70);

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [cw, ch],
        compress: true,
      });

      const imgData = renderedCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, cw, ch, undefined, 'FAST');

      onProgress?.('downloading', 90);

      pdf.save(`${fileName}.pdf`);

      // Get blob
      const pdfBlob = pdf.output('blob');

      onProgress?.('complete', 100);

      return { success: true, blob: pdfBlob };
    }
  } catch (error: any) {
    console.error('Export failed:', error);
    return { success: false, error: error.message || 'Export failed' };
  }
}

/**
 * Generate a preview thumbnail of the template
 * Returns a smaller, faster-to-generate image
 */
export async function generateThumbnail(
  element: HTMLElement,
  maxWidth: number = 400
): Promise<string | null> {
  try {
    const html2canvas = (await import('html2canvas')).default;

    const scaleFactor = maxWidth / element.offsetWidth;

    const canvas = await html2canvas(element, {
      scale: scaleFactor,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
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
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>طباعة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        @page { margin: 0; size: auto; }
        body { margin: 0; padding: 0; }
        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for images to load
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
}
