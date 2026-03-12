/**
 * نظام تصدير Word (.docx) - SERS
 * 
 * النهج: html2canvas يلتقط الصورة في الفرونت → يرسلها كـ base64 للسيرفر
 * السيرفر يضعها في مستند Word بحجم A4
 * هذا يضمن مطابقة 100% للمعاينة
 * 
 * أيضاً يدعم النهج المنظم (JSON) لإنشاء Word قابل للتعديل
 */

import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

// ===== Types =====
interface DocxField {
  label: string;
  value: string;
}

interface DocxEvidence {
  fileName?: string;
  fileUrl?: string;
  displayAs?: "image" | "qr";
  type?: string;
  text?: string;
  link?: string;
}

interface DocxSubEvidence {
  title: string;
  fields: DocxField[];
  evidences: DocxEvidence[];
}

interface DocxCriterion {
  title: string;
  subEvidences: DocxSubEvidence[];
}

interface DocxPersonalInfo {
  name: string;
  school: string;
  department: string;
  year: string;
  semester: string;
  evaluator: string;
  evaluatorRole: string;
  date: string;
  reportTitle: string;
}

export interface DocxExportData {
  personalInfo: DocxPersonalInfo;
  criteria: DocxCriterion[];
  themeColor?: string;
  mode: "single" | "full";
  singleTitle?: string;
}

/**
 * تصدير Word نصي قابل للتعديل - النهج المنظم
 */
export async function exportToDocxStructured(
  data: DocxExportData,
  filename: string = "document.docx",
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  try {
    onProgress?.(1, 3);
    onProgress?.(2, 3);

    const response = await fetch('/api/export-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'DOCX export failed');
    }

    const blob = await response.blob();
    saveAs(blob, filename);
    onProgress?.(3, 3);
    return true;
  } catch (err) {
    console.error("DOCX structured export error:", err);
    throw err;
  }
}

/**
 * تصدير Word عبر html2canvas (صورة مطابقة للمعاينة)
 * يلتقط الصورة في الفرونت ويرسلها كـ base64 للسيرفر
 */
export async function exportToDocx(
  elementId: string,
  filename: string = "document.docx",
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found: " + elementId);

  try {
    onProgress?.(1, 5);

    // Step 1: تجهيز العنصر للالتقاط
    const parent = element.parentElement;
    const wasHidden = parent && parent.style.left === '-9999px';
    
    if (wasHidden && parent) {
      parent.style.position = 'fixed';
      parent.style.left = '0';
      parent.style.top = '0';
      parent.style.zIndex = '-1';
      parent.style.opacity = '0.01';
      parent.style.pointerEvents = 'none';
    }

    // إخفاء الأزرار
    const noprint = element.querySelectorAll('[data-no-print]');
    noprint.forEach(el => (el as HTMLElement).style.display = 'none');

    await new Promise(r => setTimeout(r, 300));

    onProgress?.(2, 5);

    // Step 2: التقاط الصورة بـ html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    // إعادة إظهار العناصر
    noprint.forEach(el => (el as HTMLElement).style.display = '');
    
    if (wasHidden && parent) {
      parent.style.position = 'absolute';
      parent.style.left = '-9999px';
      parent.style.top = '0';
      parent.style.zIndex = '';
      parent.style.opacity = '';
      parent.style.pointerEvents = '';
    }

    onProgress?.(3, 5);

    // Step 3: تحويل canvas إلى base64
    const imageBase64 = canvas.toDataURL('image/png', 0.95);

    onProgress?.(4, 5);

    // Step 4: إرسال الصورة للسيرفر لإنشاء Word
    const response = await fetch('/api/export-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64, 
        filename,
        width: canvas.width,
        height: canvas.height,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'DOCX export failed');
    }

    // Step 5: تحميل الملف
    const blob = await response.blob();
    saveAs(blob, filename);

    onProgress?.(5, 5);
    return true;
  } catch (err) {
    console.error("DOCX export error:", err);
    // إعادة العنصر لمكانه في حالة الخطأ
    const parent = element.parentElement;
    if (parent) {
      parent.style.position = 'absolute';
      parent.style.left = '-9999px';
      parent.style.top = '0';
      parent.style.zIndex = '';
      parent.style.opacity = '';
      parent.style.pointerEvents = '';
    }
    const noprint = element.querySelectorAll('[data-no-print]');
    noprint.forEach(el => (el as HTMLElement).style.display = '');
    throw err;
  }
}
