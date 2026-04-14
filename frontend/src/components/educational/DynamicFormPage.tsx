'use client';

/**
 * DynamicFormPage — Unified dynamic form component for educational services.
 * 
 * Reads forms & fields from Firestore `static_tools` collection.
 * When admin edits forms in the editor → changes appear here immediately.
 * 
 * Features:
 * - Reads forms dynamically from Firestore (static_tools collection)
 * - Falls back to static-tools-seed.ts if Firestore is empty
 * - Supports all field types: text, textarea, number, date, select, checkbox, image, url
 * - Live preview with printable output
 * - QR code generation for URL fields
 * - Responsive design for all devices
 * - Bilingual support (Arabic/English)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import {
    FileText, ChevronLeft, ChevronRight, Download, Eye, RotateCcw,
    Image as ImageIcon, Link as LinkIcon, QrCode, Loader2,
    Type, AlignLeft, Hash, Calendar, List, CheckSquare,
    ClipboardList, BookOpen, Layers, Layout, GraduationCap,
    BarChart3, CalendarDays, Award, Users, Sparkles, TrendingUp,
    PieChart, Brain, Settings, Target, FolderArchive, Trophy,
    Bot, FileQuestion, Shield, Star, FolderOpen, FileSpreadsheet,
    Lightbulb, ScrollText, Zap, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getStaticTool, saveStaticTool } from '@/lib/firestore-static-tools';
import type { StaticTool, StaticForm, StaticFormField } from '@/types';

// ── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
    ClipboardList, BookOpen, Layers, Layout, GraduationCap, FileText,
    BarChart3, CalendarDays, Award, Users, Sparkles, TrendingUp,
    PieChart, Brain, Settings, Target, FolderArchive, Trophy,
    Bot, FileQuestion, Shield, Star, FolderOpen, FileSpreadsheet,
    Lightbulb, ScrollText, Zap, Database,
};

const FIELD_ICON: Record<string, any> = {
    text: Type, textarea: AlignLeft, number: Hash, date: Calendar,
    select: List, checkbox: CheckSquare, image: ImageIcon, url: LinkIcon,
};

// ── Props ────────────────────────────────────────────────────────────────────
interface DynamicFormPageProps {
    toolSlug: string;
    /** Optional custom preview renderer — if provided, overrides the default preview */
    customPreview?: (props: {
        form: StaticForm;
        values: Record<string, string>;
        images: Record<string, string>;
    }) => React.ReactNode;
    /** Optional: hardcoded forms to use as fallback (from existing pages) */
    fallbackForms?: StaticForm[];
}

export default function DynamicFormPage({ toolSlug, customPreview, fallbackForms }: DynamicFormPageProps) {
    const { locale, dir } = useTranslation();
    const isAr = locale === 'ar';
    const printRef = useRef<HTMLDivElement>(null);

    // State
    const [tool, setTool] = useState<StaticTool | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFormIndex, setActiveFormIndex] = useState(0);
    const [values, setValues] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);

    // ── Load tool from Firestore ─────────────────────────────────────────────
    const loadTool = useCallback(async () => {
        setLoading(true);
        try {
            let data = await getStaticTool(toolSlug);
            
            if (!data || !data.forms?.length) {
                // Try slug variations
                const altSlug = toolSlug.replace(/-/g, '_');
                if (!data) data = await getStaticTool(altSlug);
                
                // If still no data and we have fallback forms, create the tool
                if ((!data || !data.forms?.length) && fallbackForms?.length) {
                    const toolData = {
                        title_ar: toolSlug,
                        title_en: toolSlug,
                        description_ar: '',
                        description_en: '',
                        icon: 'FileText',
                        color: '#3b82f6',
                        gradient: 'from-blue-500 to-blue-600',
                        href: `/${toolSlug}`,
                        is_active: true,
                        sort_order: 1,
                        forms: fallbackForms,
                    };
                    await saveStaticTool(toolSlug, toolData as any);
                    data = { id: toolSlug, ...toolData } as StaticTool;
                }
            }
            
            if (data) {
                setTool(data);
            }
        } catch (err) {
            console.error('Error loading tool:', err);
        } finally {
            setLoading(false);
        }
    }, [toolSlug, fallbackForms]);

    useEffect(() => { loadTool(); }, [loadTool]);

    // ── Active form ──────────────────────────────────────────────────────────
    const forms = tool?.forms || fallbackForms || [];
    const activeForm = forms[activeFormIndex] || forms[0];

    // ── Field handlers ───────────────────────────────────────────────────────
    const handleFieldChange = (key: string, value: string) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleImageChange = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImages(prev => ({ ...prev, [key]: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleReset = () => {
        setValues({});
        setImages({});
        toast.success(ta('تم إعادة تعيين النموذج', 'Form reset'));
    };

    // ── Print / Download ─────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) { toast.error(ta('يرجى السماح بالنوافذ المنبثقة', 'Please allow popups')); return; }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${activeForm?.title_ar || 'نموذج'}</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Cairo', sans-serif; direction: rtl; }
                    @media print {
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { margin: 0; size: A4; }
                    }
                </style>
            </head>
            <body>${printRef.current.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div dir={dir} className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-gray-500">{ta('جاري التحميل...', 'Loading...')}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── No forms found ───────────────────────────────────────────────────────
    if (!forms.length) {
        return (
            <div dir={dir} className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto" />
                        <h2 className="text-xl font-bold text-gray-500">{ta('لا توجد نماذج بعد', 'No forms yet')}</h2>
                        <p className="text-gray-400">{ta('سيقوم مدير النظام بإضافة النماذج قريباً', 'Admin will add forms soon')}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── Render field ─────────────────────────────────────────────────────────
    const renderField = (field: StaticFormField) => {
        const FieldIcon = FIELD_ICON[field.type] || Type;
        const label = isAr ? field.label_ar : (field.label_en || field.label_ar);
        const placeholder = field.placeholder_ar || '';

        switch (field.type) {
            case 'image':
                return (
                    <div key={field.id} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                            {label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageChange(field.key, e.target.files[0])}
                                className="hidden"
                                id={`img-${field.id}`}
                            />
                            <label
                                htmlFor={`img-${field.id}`}
                                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                            >
                                {images[field.key] ? (
                                    <img src={images[field.key]} alt="" className="w-full h-32 object-cover rounded-lg" />
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <span className="text-xs text-gray-400">{ta('اضغط لرفع صورة', 'Click to upload')}</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.id} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <AlignLeft className="w-4 h-4 text-violet-500" />
                            {label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Textarea
                            value={values[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={placeholder}
                            rows={field.rows || 3}
                            className="rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                );

            case 'select':
                return (
                    <div key={field.id} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <List className="w-4 h-4 text-orange-500" />
                            {label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            value={values[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-800 p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">{ta('اختر...', 'Select...')}</option>
                            {(field.options || []).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.id} className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            checked={values[field.key] === '1'}
                            onChange={(e) => handleFieldChange(field.key, e.target.checked ? '1' : '0')}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            id={`chk-${field.id}`}
                        />
                        <label htmlFor={`chk-${field.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </label>
                    </div>
                );

            case 'url':
                return (
                    <div key={field.id} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <LinkIcon className="w-4 h-4 text-green-500" />
                            {label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <Input
                                type="url"
                                value={values[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                placeholder={placeholder}
                                className="rounded-xl border-gray-200 dark:border-gray-600 ps-10 focus:ring-2 focus:ring-green-500/20"
                                dir="ltr"
                            />
                            <QrCode className="absolute top-1/2 start-3 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        {values[field.key] && (
                            <p className="text-[10px] text-green-600">{ta('سيتم إنشاء باركود تلقائياً', 'QR code will be auto-generated')}</p>
                        )}
                    </div>
                );

            default: // text, number, date
                return (
                    <div key={field.id} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <FieldIcon className="w-4 h-4 text-blue-500" />
                            {label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={values[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={placeholder}
                            className="rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                );
        }
    };

    // ── Default Preview ──────────────────────────────────────────────────────
    const renderDefaultPreview = () => {
        if (!activeForm) return null;
        const visibleFields = (activeForm.fields || []).filter(f => f.is_visible !== false);
        const textFields = visibleFields.filter(f => f.type !== 'image');
        const imageFields = visibleFields.filter(f => f.type === 'image');

        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                            {Array.from({length: 20}).map((_, i) => (
                                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                            ))}
                        </div>
                        <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                        <div style={{ lineHeight: '1.5' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                            <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold' }}>
                    {isAr ? activeForm.title_ar : (activeForm.title_en || activeForm.title_ar)}
                </div>

                {/* Fields */}
                <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {textFields.map(field => (
                        <div key={field.id} style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '6px 10px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', color: '#2a7a7a', fontWeight: 'bold' }}>
                                {isAr ? field.label_ar : (field.label_en || field.label_ar)}:
                            </div>
                            <div style={{ minHeight: field.type === 'textarea' ? '60px' : '24px', fontSize: '11px', paddingTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                                {values[field.key] || ''}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Images */}
                {imageFields.some(f => images[f.key]) && (
                    <div style={{ padding: '8px 12px' }}>
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', color: '#2a7a7a', fontWeight: 'bold' }}>
                                {ta('الشـواهد', 'Evidence')}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: imageFields.filter(f => images[f.key]).length > 1 ? '1fr 1fr' : '1fr', gap: '8px', marginTop: '4px' }}>
                                {imageFields.map(f => images[f.key] ? (
                                    <div key={f.id} style={{ borderRadius: '4px', overflow: 'hidden' }}>
                                        <img src={images[f.key]} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    </div>
                )}

                {/* URL/QR Code */}
                {visibleFields.filter(f => f.type === 'url' && values[f.key]).map(f => (
                    <div key={f.id} style={{ textAlign: 'center', padding: '8px' }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(values[f.key])}`} alt="QR" style={{ width: '80px', height: '80px', margin: '0 auto' }} />
                    </div>
                ))}

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold', marginTop: '8px' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    };

    // ── Main Render ──────────────────────────────────────────────────────────
    const ToolIcon = ICON_MAP[tool?.icon || 'FileText'] || FileText;
    const gradient = tool?.gradient || 'from-blue-500 to-blue-600';

    return (
        <div dir={dir} className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-xl mb-4`}>
                        <ToolIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                        {isAr ? (tool?.title_ar || toolSlug) : (tool?.title_en || tool?.title_ar || toolSlug)}
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm max-w-xl mx-auto">
                        {isAr ? tool?.description_ar : (tool?.description_en || tool?.description_ar)}
                    </p>
                </div>

                {/* Form selector tabs */}
                {forms.length > 1 && (
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {forms.filter(f => f.is_active !== false).map((form, idx) => (
                            <button
                                key={form.id}
                                onClick={() => { setActiveFormIndex(idx); setValues({}); setImages({}); setShowPreview(false); }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    activeFormIndex === idx
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                }`}
                            >
                                {isAr ? form.title_ar : (form.title_en || form.title_ar)}
                                {form.badge && <Badge className="ms-2 text-[9px]">{form.badge}</Badge>}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content: Form + Preview */}
                {activeForm && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Form Input */}
                        <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-lg">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-black text-gray-900 dark:text-white">
                                    {isAr ? activeForm.title_ar : (activeForm.title_en || activeForm.title_ar)}
                                </CardTitle>
                                {activeForm.description_ar && (
                                    <CardDescription className="text-sm">
                                        {isAr ? activeForm.description_ar : (activeForm.description_en || activeForm.description_ar)}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(activeForm.fields || [])
                                    .filter(f => f.is_visible !== false)
                                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                    .map(renderField)}

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        {showPreview ? ta('إخفاء المعاينة', 'Hide Preview') : ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button
                                        onClick={handlePrint}
                                        variant="outline"
                                        className="flex-1 sm:flex-none rounded-xl gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        {ta('تحميل PDF', 'Download PDF')}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="ghost"
                                        className="flex-1 sm:flex-none rounded-xl gap-2 text-gray-500"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        {ta('إعادة تعيين', 'Reset')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        <div className={`${showPreview ? 'block' : 'hidden lg:block'}`}>
                            <div className="sticky top-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        {ta('المعاينة الحية', 'Live Preview')}
                                    </h3>
                                    <Badge variant="outline" className="text-[10px]">A4</Badge>
                                </div>
                                <div 
                                    ref={printRef}
                                    className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-600"
                                    style={{ maxHeight: '80vh', overflowY: 'auto' }}
                                >
                                    {customPreview
                                        ? customPreview({ form: activeForm, values, images })
                                        : renderDefaultPreview()
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
