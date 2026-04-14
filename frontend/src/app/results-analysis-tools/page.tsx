'use client';

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Eye, Download, RotateCcw, ChevronRight, Layers, TrendingUp, Users, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ===== Analysis Tool =====
function AnalysisTool({ onBack }: { onBack: () => void }) {
  const { dir } = useTranslation();
    const [values, setValues] = useState({
        education_dept: '',
        school_name: '',
        exam_type: '',
        report_title: '',
        grade_level: '',
        semester: '',
        max_score: '40',
        student_names: '',
        student_scores: '',
        right_title: ta('معلم المادة', 'Subject Teacher'),
        right_name: '',
        left_title: ta('مدير المدرسة', 'School Principal'),
        left_name: '',
        logo: '' as string,
        use_arabic_nums: true,
    });

    const set = (k: string, v: string | boolean) => setValues(p => ({ ...p, [k]: v }));
    const [logoImg, setLogoImg] = useState('');

    const toArabic = (n: number | string) => {
        if (!values.use_arabic_nums) return String(n);
        return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
    };

    // Parse scores and compute stats
    const stats = useMemo(() => {
        const raw = values.student_scores.trim();
        if (!raw) return null;
        const scores = raw.split(/[\s,،\n]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
        if (!scores.length) return null;
        const max = parseFloat(values.max_score) || 40;
        const count = scores.length;
        const sum = scores.reduce((a, b) => a + b, 0);
        const avg = sum / count;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);
        const passed = scores.filter(s => s >= max * 0.5).length;
        const failed = count - passed;
        const passRate = ((passed / count) * 100).toFixed(1);
        const excellent = scores.filter(s => s >= max * 0.9).length;
        const vgood = scores.filter(s => s >= max * 0.8 && s < max * 0.9).length;
        const good = scores.filter(s => s >= max * 0.7 && s < max * 0.8).length;
        const acceptable = scores.filter(s => s >= max * 0.6 && s < max * 0.7).length;
        const weak = scores.filter(s => s >= max * 0.5 && s < max * 0.6).length;
        const vweak = scores.filter(s => s < max * 0.5).length;
        return { count, avg: avg.toFixed(2), highest, lowest, passed, failed, passRate, excellent, vgood, good, acceptable, weak, vweak };
    }, [values.student_scores, values.max_score]);

    const names = values.student_names.trim().split(/[\n,،]+/).map(s => s.trim()).filter(Boolean);
    const scores = values.student_scores.trim().split(/[\s,،\n]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة لأدوات التحليل', 'Back to Analysis Tools')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-l from-cyan-600 to-teal-700 text-white rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-base">{ta('تحليل نتائج مادة لصف واحد', 'Analyze results for one subject per class')}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{ta('إنشاء تحليل نتائج احترافي مع إحصائيات تلقائية', 'Create a professional results analysis with automatic statistics')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Row 1: إدارة التعليم + اسم المدرسة */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                    <Textarea rows={3} placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} value={values.education_dept} onChange={e => set('education_dept', e.target.value)} className="resize-y text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('نوع الاختبار:', 'Test Type:')}</label>
                                    <Input placeholder={ta('الاختبار النهائي', 'Final Exam')} value={values.exam_type} onChange={e => set('exam_type', e.target.value)} className="text-sm" />
                                    <p className="text-[10px] text-gray-400 mt-1">{ta('مثل: (الاختبار التشخيصي - الاختبار البعدي - اختبار الفترة - اختبار نهائي) غير إلزامي', 'e.g.: (Diagnostic test - Post-test - Period test - Final exam) Optional')}</p>
                                </div>
                            </div>

                            {/* Row 2: عنوان التقرير */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('عنوان التقرير:', 'Report Title:')}</label>
                                <Input placeholder={ta('تحليل نتائج اختبار مادة [الرياضيات]', 'Test Results Analysis for [Mathematics]')} value={values.report_title} onChange={e => set('report_title', e.target.value)} className="text-sm" />
                            </div>

                            {/* Row 3: المرحلة + الفصل + الدرجة */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المرحلة الدراسية / الصف:', 'Academic Stage / Grade:')}</label>
                                    <Input placeholder={ta('ثاني متوسط / 2', 'Second Intermediate / 2')} value={values.grade_level} onChange={e => set('grade_level', e.target.value)} className="text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الفصل الدراسي / السنة:', 'Semester / Year:')}</label>
                                    <Input placeholder={ta('الفصل الأول / 1447هـ', 'First Semester / 1447H')} value={values.semester} onChange={e => set('semester', e.target.value)} className="text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('درجة الاختبار:', 'Test Score:')}</label>
                                    <Input placeholder="40" value={values.max_score} onChange={e => set('max_score', e.target.value)} className="text-sm" />
                                </div>
                            </div>

                            {/* Row 4: الأسماء + الدرجات جنباً لجنب */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        {ta('إدخال أسماء الطلاب', 'Enter Student Names')}<span className="text-gray-400">{ta('(غير إلزامي)', '(Optional)')}</span>
                                    </label>
                                    <Textarea rows={10} placeholder={ta('إدخال أسماء الطلاب (غير إلزامي)', 'Enter Student Names (Optional)')} value={values.student_names} onChange={e => set('student_names', e.target.value)} className="resize-y text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        {ta('إدخال درجات الطلاب:', 'Enter Student Grades:')}<span className="text-red-500">*</span>
                                    </label>
                                    <Textarea rows={10} placeholder={'40\n40\n39\n35\n34\n32\n29\n20\n15\n5'} value={values.student_scores} onChange={e => set('student_scores', e.target.value)} className="resize-y text-sm font-mono" />
                                    {stats && <p className="text-[10px] text-emerald-600 mt-1">✓ تم رصد {stats.count} درجة</p>}
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400">{ta('ملاحظة: حقل إدخال الأسماء (غير إلزامي) - لكن إن قمت بإدخال أسماء يجب أن تكون مطابقة للدرجات بالعدد وكل درجة مقابل اسم الطالب', 'Note: Name input field is optional - but if you enter names, they must match the grades in count, each grade corresponding to a student name')}</p>

                            {/* Row 5: التوقيعات */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label>
                                    <Textarea rows={2} placeholder={ta('معلم المادة/ الاسم', 'Subject Teacher / Name')} value={values.right_title + (values.right_name ? '\n' + values.right_name : '')} onChange={e => { const lines = e.target.value.split('\n'); set('right_title', lines[0] || ''); set('right_name', lines[1] || ''); }} className="resize-y text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label>
                                    <Textarea rows={2} placeholder={ta('مدير المدرسة/ الاسم', 'School Principal / Name')} value={values.left_title + (values.left_name ? '\n' + values.left_name : '')} onChange={e => { const lines = e.target.value.split('\n'); set('left_title', lines[0] || ''); set('left_name', lines[1] || ''); }} className="resize-y text-sm" />
                                </div>
                            </div>

                            {/* Row 6: شهار مخصص */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('شهار مخصص', 'Custom Slogan')}<span className="text-gray-400">{ta('(غير إلزامي)', '(Optional)')}</span></label>
                                <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                    <span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                                    <span className="text-xs text-gray-400 px-3 py-2 truncate">{logoImg ? ta('تم اختيار ملف', 'File selected') : ta('لم يتم اختيار ملف', 'No file selected') }</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setLogoImg(ev.target?.result as string); r.readAsDataURL(f); } }} />
                                </label>
                                <p className="text-[10px] text-gray-400 mt-1">{ta('تفاصيل هذا الحقل وسيظهر شعار وزارة التعليم السعودية عند الطباعة', 'This field details will show the Saudi Ministry of Education logo when printing')}</p>
                            </div>

                            {/* Row 7: استخدام الأرقام العربية */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{ta('استخدام الأرقام العربية عند الطباعة', 'Use Arabic numerals when printing')}</label>
                                <button
                                    onClick={() => set('use_arabic_nums', !values.use_arabic_nums)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${values.use_arabic_nums ? 'bg-cyan-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${values.use_arabic_nums ? 'translate-x-0.5' : 'translate-x-5'}`} />
                                </button>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                        <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button onClick={() => setValues({ education_dept: '', school_name: '', exam_type: '', report_title: '', grade_level: '', semester: '', max_score: '40', student_names: '', student_scores: '', right_title: ta('معلم المادة', 'Subject Teacher'), right_name: '', left_title: ta('مدير المدرسة', 'School Principal'), left_name: '', logo: '', use_arabic_nums: true })} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                    </Button>
                                </div>
                                <Button onClick={() => { if (!stats) { toast.error(ta('أدخل درجات الطلاب أولاً', 'Enter student grades first')); return; } toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => { const el = document.getElementById('analysis-preview'); if (!el) return; const win = window.open('', '_blank', 'width=800,height=1100'); if (!win) return; win.document.write(`<!DOCTYPE html><html dir={dir} lang="ar"><head><meta charset="UTF-8"><title>{ta('تحليل النتائج', 'Analyze Results')}</title><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0;}body{font-family:'Cairo','Segoe UI',sans-serif;direction:rtl;background:white;}@page{margin:6mm;size:A4;}img{max-width:100%;}</style></head><body>${el.innerHTML}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script></body></html>`); win.document.close(); }, 400); }} className="w-full gap-2 bg-gradient-to-l from-cyan-600 to-teal-700 text-white border-0 text-sm">
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {(() => {
                            const s = stats || { count: 20, avg: '30.7', highest: 40, lowest: 5, passed: 17, failed: 3, passRate: '76.75', excellent: 7, vgood: 5, good: 3, acceptable: 2, weak: 0, vweak: 3 };
                            return (
                            <div id="analysis-preview" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', background: 'white', fontSize: '11px' }}>
                                <div style={{ background: 'white', padding: '12px 16px', borderBottom: '2px solid #5bc4c0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', gap: '8px' }}>
                                        {/* Left: school info */}
                                        <div style={{ textAlign: 'left', fontSize: '10px', lineHeight: '1.6', color: '#333' }}>
                                            {(values.education_dept || 'الإدارة العامة للتعليم\nبالمنطقة\nمدرسة').split('\n').map((l,i) => <div key={i}>{l}</div>)}
                                        </div>
                                        {/* Center: MOE logo */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,5px)', gap: '3px', margin: '0 auto 4px', width: 'fit-content' }}>
                                                {Array.from({length: 24}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1a9e6e' }} />)}
                                            </div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a9e6e', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                            <div style={{ fontSize: '9px', color: '#1a9e6e', opacity: 0.8 }}>Ministry of Education</div>
                                        </div>
                                        {/* Right: exam type box only */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', textAlign: 'center', color: '#333' }}>
                                                {values.exam_type || 'الاختبار النهائي'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div style={{ border: '1px solid #5bc4c0', margin: '10px 12px', borderRadius: '6px', padding: '7px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#1a3a5c' }}>
                                    {values.report_title || `تحليل نتائج اختبار مادة [${values.school_name || 'المادة'}]`}
                                </div>

                                {/* Info row */}
                                <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    {[
                                        ['المرحلة الدراسية / الصف', values.grade_level || 'ثاني متوسط / ٢'],
                                        ['السنة / الفصل الدراسي', values.semester || 'الفصل الأول / ١٤٤٧هـ'],
                                        ['درجة القياس (الاختبار)', values.max_score || '٤٠'],
                                    ].map(([label, val]) => (
                                        <div key={label} style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '6px 8px', position: 'relative', paddingTop: '14px' }}>
                                            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e', background: 'white', padding: '0 3px', whiteSpace: 'nowrap' }}>{label}:</span>
                                                <span style={{ flex: 1, height: '1px', background: '#5bc4c0' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', textAlign: 'center' }}>{val}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Stats section */}
                                <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    {/* Right: summary stats */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ color: '#1a9e6e', fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>{ta('الإحصائيات التفصيلية', 'Detailed Statistics')}</div>
                                        {[
                                            ['عدد الطـلاب', toArabic(s.count)],
                                            ['أعلى درجـة', toArabic(s.highest)],
                                            ['أقل درجـة', toArabic(s.lowest)],
                                            ['متوسط الدرجات', toArabic(s.avg)],
                                            ['نسبة التحصيل', `${toArabic(s.passRate)}%`],
                                            ['مجموع الدرجات', toArabic(Math.round(parseFloat(s.avg) * s.count))],
                                        ].map(([label, val]) => (
                                            <div key={label} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px', alignItems: 'center' }}>
                                                <div style={{ background: '#1a9e6e', color: 'white', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{label}</div>
                                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', textAlign: 'center' }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Left: grade distribution table */}
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '0', fontSize: '10px', textAlign: 'center' }}>
                                            <div style={{ padding: '4px', fontWeight: 'bold', color: '#555' }}>{ta('عدد الطلاب', 'Number of Students')}</div>
                                            <div style={{ padding: '4px', fontWeight: 'bold', color: '#555' }}>{ta('النطاق', 'Scope / Domain')}</div>
                                            <div style={{ padding: '4px', fontWeight: 'bold', color: '#555' }}>{ta('المستوى', 'Level')}</div>
                                            {[
                                                { label: ta('ممتاز', 'Excellent'), color: '#1a9e6e', count: s.excellent, range: `${toArabic(parseFloat(values.max_score)*0.9)}-${toArabic(values.max_score)}` },
                                                { label: ta('جيد جداً', 'Very Good'), color: '#3ab5b0', count: s.vgood, range: `${toArabic(parseFloat(values.max_score)*0.8)}-${toArabic(parseFloat(values.max_score)*0.9-0.01)}` },
                                                { label: ta('جيد', 'Good'), color: '#1a7abf', count: s.good, range: `${toArabic(parseFloat(values.max_score)*0.7)}-${toArabic(parseFloat(values.max_score)*0.8-0.01)}` },
                                                { label: ta('مقبول', 'Acceptable'), color: '#f59e0b', count: s.acceptable, range: `${toArabic(parseFloat(values.max_score)*0.6)}-${toArabic(parseFloat(values.max_score)*0.7-0.01)}` },
                                                { label: ta('ضعيف', 'Weak'), color: '#ef4444', count: s.vweak + s.weak, range: `٠-${toArabic(parseFloat(values.max_score)*0.6-0.01)}` },
                                            ].map(row => (
                                                <>
                                                    <div key={row.label+'c'} style={{ border: '1px solid #eee', padding: '4px', fontSize: '11px' }}>{toArabic(row.count)}</div>
                                                    <div key={row.label+'r'} style={{ border: '1px solid #eee', padding: '4px', fontSize: '10px' }}>{row.range}</div>
                                                    <div key={row.label+'l'} style={{ border: '1px solid #eee', padding: '3px 6px', background: row.color, color: 'white', fontWeight: 'bold', fontSize: '10px', borderRadius: '3px', margin: '1px' }}>{row.label}</div>
                                                </>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Charts section */}
                                <div style={{ margin: '0 12px 10px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#1a9e6e', fontWeight: 'bold', marginBottom: '10px' }}>{ta('رسم بياني (نسب الطلاب لكل تقدير)', 'Chart (Student percentages for each grade)')}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                        {[
                                            { label: ta('ممتاز', 'Excellent'), count: s.excellent, color: '#1a9e6e' },
                                            { label: ta('جيد جداً', 'Very Good'), count: s.vgood, color: '#3ab5b0' },
                                            { label: ta('جيد', 'Good'), count: s.good, color: '#1a7abf' },
                                            { label: ta('مقبول', 'Acceptable'), count: s.acceptable, color: '#f59e0b' },
                                            { label: ta('ضعيف', 'Weak'), count: s.vweak + s.weak, color: '#ef4444' },
                                        ].map(item => {
                                            const pct = s.count ? Math.round((item.count / s.count) * 100) : 0;
                                            const r = 22; const circ = 2 * Math.PI * r;
                                            const dash = (pct / 100) * circ;
                                            return (
                                                <div key={item.label} style={{ textAlign: 'center' }}>
                                                    <svg width="60" height="60" viewBox="0 0 60 60">
                                                        <circle cx="30" cy="30" r={r} fill="none" stroke="#eee" strokeWidth="6" />
                                                        <circle cx="30" cy="30" r={r} fill="none" stroke={item.color} strokeWidth="6"
                                                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                                                            transform="rotate(-90 30 30)" />
                                                        <text x="30" y="35" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#333">{pct}%</text>
                                                    </svg>
                                                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{item.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#1a9e6e', fontWeight: 'bold', margin: '10px 0 8px' }}>{ta('رسم بياني (عدد الطلاب لكل تقدير)', 'Chart (Number of students for each grade)')}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '80px', padding: '0 10px' }}>
                                        {[
                                            { label: ta('ممتاز', 'Excellent'), count: s.excellent, color: '#1a9e6e' },
                                            { label: ta('جيد جداً', 'Very Good'), count: s.vgood, color: '#3ab5b0' },
                                            { label: ta('جيد', 'Good'), count: s.good, color: '#1a7abf' },
                                            { label: ta('مقبول', 'Acceptable'), count: s.acceptable, color: '#f59e0b' },
                                            { label: ta('ضعيف', 'Weak'), count: s.vweak + s.weak, color: '#ef4444' },
                                        ].map(item => {
                                            const maxCount = Math.max(s.excellent, s.vgood, s.good, s.acceptable, s.vweak + s.weak, 1);
                                            const h = Math.max((item.count / maxCount) * 60, 4);
                                            return (
                                                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#333' }}>{toArabic(item.count)}</div>
                                                    <div style={{ width: '30px', height: `${h}px`, background: item.color, borderRadius: '3px 3px 0 0' }} />
                                                    <div style={{ fontSize: '9px', color: '#555' }}>{item.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Signatures */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px 12px', borderTop: '1px solid #eee' }}>
                                    <div style={{ textAlign: 'center', fontSize: '11px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{values.left_title}</div>
                                        <div style={{ color: '#555' }}>{values.left_name}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '11px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{values.right_title}</div>
                                        <div style={{ color: '#555' }}>{values.right_name}</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '6px', fontSize: '10px', fontWeight: 'bold' }}>
                                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                                </div>
                            </div>
                        );
                        })()}
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`@media print { nav, footer, button { display: none !important; } }`}</style>
        </div>
    );
}

// ===== Main Page =====
export default function ResultsAnalysisPage() {
  const { dir } = useTranslation();
    const [showTool, setShowTool] = useState(false);

    if (showTool) return <AnalysisTool onBack={() => setShowTool(false)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-cyan-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-cyan-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <BarChart3 className="w-4 h-4 text-cyan-400" /> {ta('أدوات تحليل النتائج', 'Results Analysis Tools')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('أدوات تحليل النتائج', 'Results Analysis Tools')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('أدوات تحليل النتائج لجميع المراحل الدراسية وجميع أنواع الاختبارات', 'Results analysis tools for all academic stages and all types of tests')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />{ta('إحصائيات تلقائية', 'Auto Statistics')}</span>
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{ta('توزيع الدرجات', 'Grade Distribution')}</span>
                            <span className="flex items-center gap-1.5"><Award className="w-4 h-4" />{ta('نسبة النجاح', 'Pass Rate')}</span>
                        </div>
                    </div>
                </section>
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setShowTool(true)}>
                            <div className="h-2 bg-gradient-to-l from-cyan-600 to-teal-700" />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-700 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <BarChart3 className="w-6 h-6" />
                                    </div>
                                    <Badge className="bg-amber-500 text-white text-xs">{ta('الأكثر استخداماً', 'Most Used')}</Badge>
                                </div>
                                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                    {ta('تحليل نتائج مادة لصف واحد', 'Analyze results for one subject per class')}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    {ta('إنشاء تحليل نتائج احترافي مع إحصائيات تلقائية وتوزيع الدرجات ونسبة النجاح', 'Create a professional results analysis with automatic statistics, grade distribution, and success rate')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {['المتوسط', 'أعلى درجة', 'نسبة النجاح', 'توزيع التقديرات'].map(tag => (
                                        <span key={tag} className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                                <Button className="w-full bg-gradient-to-l from-cyan-600 to-teal-700 text-white border-0 hover:opacity-90 gap-2">
                                    <Eye className="w-4 h-4" /> {ta('ابدأ التصميم', 'Start Design')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}



