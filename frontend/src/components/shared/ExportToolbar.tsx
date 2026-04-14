'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import { useState, useRef, useCallback, memo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Download, Image as ImageIcon, Loader2, QrCode } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface ExportToolbarProps {
    /** The ref to the element to export */
    contentRef: React.RefObject<HTMLElement | null>;
    /** Filename (without extension) */
    filename?: string;
    /** Include QR code in PDF */
    qrData?: string;
    /** PDF title */
    title?: string;
    /** PDF orientation */
    orientation?: 'portrait' | 'landscape';
    /** Extra className */
    className?: string;
    /** Compact mode */
    compact?: boolean;
}

function ExportToolbarInner({
    contentRef,
    filename = 'تقرير',
    qrData,
    title,
    orientation = 'portrait',
    className = '',
    compact = false,
}: ExportToolbarProps) {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = useCallback(async () => {
        if (!contentRef.current) return;
        setIsExporting(true);
        try {
            // Dynamic import - only loads when user clicks export
            const { exportToPDF } = await import('@/lib/export-utils');
            await exportToPDF(contentRef.current, filename, {
                orientation,
                includeQR: !!qrData,
                qrData,
                title,
            });
            toast.success(t('toast.exportPdf'));
        } catch (err) {
            logger.error('PDF export error:', err);
            toast.error(t('toast.exportError'));
        } finally {
            setIsExporting(false);
        }
    }, [contentRef, filename, qrData, title, orientation]);

    const handleExportImage = useCallback(async () => {
        if (!contentRef.current) return;
        setIsExporting(true);
        try {
            const { exportToImage } = await import('@/lib/export-utils');
            await exportToImage(contentRef.current, filename);
            toast.success(t('toast.exportImage'));
        } catch (err) {
            logger.error('Image export error:', err);
            toast.error(t('toast.exportError'));
        } finally {
            setIsExporting(false);
        }
    }, [contentRef, filename]);

    const size = compact ? 'sm' : 'default';

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <Button
                variant="outline"
                size={size as any}
                className={`gap-1 ${compact ? 'flex-1' : ''}`}
                onClick={handleExportPDF}
                disabled={isExporting}
            >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                PDF
            </Button>
            <Button
                variant="outline"
                size={size as any}
                className={`gap-1 ${compact ? 'flex-1' : ''}`}
                onClick={handleExportImage}
                disabled={isExporting}
            >
                <ImageIcon className="h-3.5 w-3.5" />
                {ta('صورة', 'Image')}
            </Button>
        </div>
    );
}

export const ExportToolbar = memo(ExportToolbarInner);
