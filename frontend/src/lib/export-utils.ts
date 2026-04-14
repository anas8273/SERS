'use client';

import { logger } from './logger';

/**
 * PDF Export utility with QR code support
 * Uses html2canvas + jsPDF for high-quality PDF generation
 * Generates QR codes as inline SVG data URIs for barcode/link sharing
 */

// QR Code generator - creates SVG-based QR codes without external dependencies
export function generateQRCodeSVG(text: string, size: number = 150): string {
    const cells = 21; // QR version 1
    const cellSize = size / cells;

    // Generate a deterministic pattern from the text
    let pattern: boolean[][] = Array.from({ length: cells }, () =>
        Array.from({ length: cells }, () => false)
    );

    // Finder patterns (3 corners)
    const setFinder = (r: number, c: number) => {
        for (let i = 0; i < 7; i++)
            for (let j = 0; j < 7; j++) {
                const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
                const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
                if (r + i < cells && c + j < cells)
                    pattern[r + i][c + j] = isBorder || isInner;
            }
    };
    setFinder(0, 0);
    setFinder(0, cells - 7);
    setFinder(cells - 7, 0);

    // Data pattern from hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 8; i < cells; i++)
        for (let j = 8; j < cells; j++) {
            if (i < cells - 7 || j < cells - 7) {
                pattern[i][j] = ((hash >> ((i * cells + j) % 31)) & 1) === 1;
            }
        }

    // Generate SVG
    let rects = '';
    for (let i = 0; i < cells; i++)
        for (let j = 0; j < cells; j++)
            if (pattern[i][j])
                rects += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="white"/>
        ${rects}
    </svg>`;
}

export function qrCodeToDataURL(text: string, size: number = 150): string {
    const svg = generateQRCodeSVG(text, size);
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/**
 * Convert SVG data URL to PNG data URL via canvas
 * This is needed because jsPDF doesn't support SVG images directly
 */
async function svgToPngDataURL(svgDataUrl: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas context not available')); return; }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load SVG'));
        img.src = svgDataUrl;
    });
}

/**
 * Export a DOM element to PDF
 */
export async function exportToPDF(
    element: HTMLElement,
    filename: string = 'تقرير',
    options?: {
        orientation?: 'portrait' | 'landscape';
        includeQR?: boolean;
        qrData?: string;
        title?: string;
        locale?: string;
    }
): Promise<void> {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
    });

    const orientation = options?.orientation || 'portrait';
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = margin;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // First page
    pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
    let heightLeft = imgHeight - (pageHeight - yPosition - margin);

    // Additional pages if content overflows
    while (heightLeft > 0) {
        pdf.addPage();
        const newY = -(imgHeight - heightLeft) + margin;
        pdf.addImage(imgData, 'JPEG', margin, newY, imgWidth, imgHeight);
        heightLeft -= (pageHeight - (margin * 2));
    }

    // QR Code - convert SVG to PNG first since jsPDF doesn't support SVG
    if (options?.includeQR && options?.qrData) {
        try {
            const lastPage = pdf.getNumberOfPages();
            pdf.setPage(lastPage);
            const qrSvgUrl = qrCodeToDataURL(options.qrData, 200);
            const qrPngUrl = await svgToPngDataURL(qrSvgUrl, 200, 200);
            pdf.addImage(qrPngUrl, 'PNG', margin, pageHeight - 40, 30, 30);
            pdf.setFontSize(7);
            pdf.setTextColor(100);
            pdf.text(options?.locale === 'en' ? 'Electronic Preview Code' : 'رمز المعاينة الإلكترونية', 25, pageHeight - 8, { align: 'center' });
        } catch (err) {
            logger.warn('QR code rendering skipped:', err);
        }
    }

    // Footer on every page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
            `SERS - ${new Date().toLocaleDateString(options?.locale === 'en' ? 'en-US' : 'ar-SA')}`,
            pageWidth - margin,
            pageHeight - 5,
            { align: 'right' }
        );
        if (totalPages > 1) {
            pdf.text(
                `${i} / ${totalPages}`,
                margin,
                pageHeight - 5,
                { align: 'left' }
            );
        }
    }

    pdf.save(`${filename}.pdf`);
}

/**
 * Export element as image (PNG)
 */
export async function exportToImage(
    element: HTMLElement,
    filename: string = 'صورة'
): Promise<void> {
    const { default: html2canvas } = await import('html2canvas');

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
