'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, Download, RotateCcw, ChevronRight, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ===== بيانات أسابيع التقويم الأول ف1 1447هـ =====
const CAL_1447_1_WEEKS = [
    { num: 1,  hijri: '١٤٤٧/٠١/٠٨', miladi: '٢٠٢٥/٠٨/٠١', days: ['٠١/٠٨','٠١/٠٩','٠١/١٠','٠١/١١','٠١/١٢'], mDays: ['٠٨/٠٤','٠٨/٠٥','٠٨/٠٦','٠٨/٠٧','٠٨/٠٨'], note: '' },
    { num: 2,  hijri: '١٤٤٧/٠١/١٥', miladi: '٢٠٢٥/٠٨/١١', days: ['٠١/١٥','٠١/١٦','٠١/١٧','٠١/١٨','٠١/١٩'], mDays: ['٠٨/١١','٠٨/١٢','٠٨/١٣','٠٨/١٤','٠٨/١٥'], note: '' },
    { num: 3,  hijri: '١٤٤٧/٠١/٢٢', miladi: '٢٠٢٥/٠٨/١٨', days: ['٠١/٢٢','٠١/٢٣','٠١/٢٤','٠١/٢٥','٠١/٢٦'], mDays: ['٠٨/١٨','٠٨/١٩','٠٨/٢٠','٠٨/٢١','٠٨/٢٢'], note: '' },
    { num: 4,  hijri: '١٤٤٧/٠١/٢٩', miladi: '٢٠٢٥/٠٨/٢٥', days: ['٠١/٢٩','٠٢/٠١','٠٢/٠٢','٠٢/٠٣','٠٢/٠٤'], mDays: ['٠٨/٢٥','٠٨/٢٦','٠٨/٢٧','٠٨/٢٨','٠٨/٢٩'], note: '' },
    { num: 5,  hijri: '١٤٤٧/٠٢/٠٦', miladi: '٢٠٢٥/٠٩/٠١', days: ['٠٢/٠٦','٠٢/٠٧','٠٢/٠٨','٠٢/٠٩','٠٢/١٠'], mDays: ['٠٩/٠١','٠٩/٠٢','٠٩/٠٣','٠٩/٠٤','٠٩/٠٥'], note: ta('إجازة اليوم الوطني', 'National Day Holiday'), noteDay: 2, noteColor: '#16a34a' },
    { num: 6,  hijri: '١٤٤٧/٠٢/١٣', miladi: '٢٠٢٥/٠٩/٠٨', days: ['٠٢/١٣','٠٢/١٤','٠٢/١٥','٠٢/١٦','٠٢/١٧'], mDays: ['٠٩/٠٨','٠٩/٠٩','٠٩/١٠','٠٩/١١','٠٩/١٢'], note: '' },
    { num: 7,  hijri: '١٤٤٧/٠٢/٢٠', miladi: '٢٠٢٥/٠٩/١٥', days: ['٠٢/٢٠','٠٢/٢١','٠٢/٢٢','٠٢/٢٣','٠٢/٢٤'], mDays: ['٠٩/١٥','٠٩/١٦','٠٩/١٧','٠٩/١٨','٠٩/١٩'], note: '' },
    { num: 8,  hijri: '١٤٤٧/٠٢/٢٧', miladi: '٢٠٢٥/٠٩/٢٢', days: ['٠٢/٢٧','٠٢/٢٨','٠٢/٢٩','٠٣/٠١','٠٣/٠٢'], mDays: ['٠٩/٢٢','٠٩/٢٣','٠٩/٢٤','٠٩/٢٥','٠٩/٢٦'], note: ta('إجازة إضافية', 'Additional Holiday'), noteDay: 0, noteColor: '#0ea5e9' },
    { num: 9,  hijri: '١٤٤٧/٠٣/٠٥', miladi: '٢٠٢٥/٠٩/٢٩', days: ['٠٣/٠٥','٠٣/٠٦','٠٣/٠٧','٠٣/٠٨','٠٣/٠٩'], mDays: ['٠٩/٢٩','٠٩/٣٠','١٠/٠١','١٠/٠٢','١٠/٠٣'], note: '' },
    { num: 10, hijri: '١٤٤٧/٠٣/١٢', miladi: '٢٠٢٥/١٠/٠٦', days: ['٠٣/١٢','٠٣/١٣','٠٣/١٤','٠٣/١٥','٠٣/١٦'], mDays: ['١٠/٠٦','١٠/٠٧','١٠/٠٨','١٠/٠٩','١٠/١٠'], note: '' },
    { num: 11, hijri: '١٤٤٧/٠٣/١٩', miladi: '٢٠٢٥/١٠/١٣', days: ['٠٣/١٩','٠٣/٢٠','٠٣/٢١','٠٣/٢٢','٠٣/٢٣'], mDays: ['١٠/١٣','١٠/١٤','١٠/١٥','١٠/١٦','١٠/١٧'], note: '' },
    { num: 12, hijri: '١٤٤٧/٠٣/٢٦', miladi: '٢٠٢٥/١٠/٢٠', days: ['٠٣/٢٦','٠٣/٢٧','٠٣/٢٨','٠٣/٢٩','٠٤/٠١'], mDays: ['١٠/٢٠','١٠/٢١','١٠/٢٢','١٠/٢٣','١٠/٢٤'], note: '' },
    { num: 13, hijri: '١٤٤٧/٠٤/٠٣', miladi: '٢٠٢٥/١٠/٢٧', days: ['٠٤/٠٣','٠٤/٠٤','٠٤/٠٥','٠٤/٠٦','٠٤/٠٧'], mDays: ['١٠/٢٧','١٠/٢٨','١٠/٢٩','١٠/٣٠','١٠/٣١'], note: '' },
    { num: 14, hijri: '١٤٤٧/٠٤/١٠', miladi: '٢٠٢٥/١١/٠٣', days: ['٠٤/١٠','٠٤/١١','٠٤/١٢','٠٤/١٣','٠٤/١٤'], mDays: ['١١/٠٣','١١/٠٤','١١/٠٥','١١/٠٦','١١/٠٧'], note: ta('إجازة الخريف', 'Autumn Break'), isVacation: true, vacColor: '#d97706', vacTitle: 'إجازة الخريف', vacNote: ta('تبدأ الإجازة بنهاية دوام\nيوم الخميس\n(١٤٤٧/٠٥/٢٩هـ) الموافق (٢٠٢٥/١١/٢٠م)\nإلى يوم السبت\n(١٤٤٧/٠٦/٠٨هـ) الموافق (٢٠٢٥/١١/٢٩م)', 'تبدأ الإجازة بنهاية دوام\\nيوم الخميس\\n(١٤٤٧/٠٥/٢٩هـ) الموافق (٢٠٢٥/١١/٢٠م)\\nإلى يوم السبت\\n(١٤٤٧/٠٦/٠٨هـ) الموافق (٢٠٢٥/١١/٢٩م)') },
    { num: 15, hijri: '١٤٤٧/٠٥/٠١', miladi: '٢٠٢٥/١١/٢٤', days: ['٠٥/٠١','٠٥/٠٢','٠٥/٠٣','٠٥/٠٤','٠٥/٠٥'], mDays: ['١١/٢٤','١١/٢٥','١١/٢٦','١١/٢٧','١١/٢٨'], note: ta('إجازة إضافية', 'Additional Holiday'), noteDay: 4, noteColor: '#0ea5e9' },
    { num: 16, hijri: '١٤٤٧/٠٥/٠٨', miladi: '٢٠٢٥/١٢/٠١', days: ['٠٥/٠٨','٠٥/٠٩','٠٥/١٠','٠٥/١١','٠٥/١٢'], mDays: ['١٢/٠١','١٢/٠٢','١٢/٠٣','١٢/٠٤','١٢/٠٥'], note: ta('إجازة إضافية', 'Additional Holiday'), noteDay: 0, noteColor: '#0ea5e9' },
    { num: 17, hijri: '١٤٤٧/٠٥/١٥', miladi: '٢٠٢٥/١٢/٠٨', days: ['٠٥/١٥','٠٥/١٦','٠٥/١٧','٠٥/١٨','٠٥/١٩'], mDays: ['١٢/٠٨','١٢/٠٩','١٢/١٠','١٢/١١','١٢/١٢'], note: '' },
    { num: 18, hijri: '١٤٤٧/٠٥/٢٢', miladi: '٢٠٢٥/١٢/١٥', days: ['٠٥/٢٢','٠٥/٢٣','٠٥/٢٤','٠٥/٢٥','٠٥/٢٦'], mDays: ['١٢/١٥','١٢/١٦','١٢/١٧','١٢/١٨','١٢/١٩'], note: ta('بداية الاختبارات النهائية', 'Final Exams Start'), noteDay: 0, noteColor: '#7c3aed' },
];

const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];

// ===== Calendar Definitions =====
const CALENDARS = [
    {
        id: 'cal-1447-1',
        title: ta('التقويم الدراسي ف 1 عام 1447هـ', 'Academic Calendar Sem 1 - 1447H'),
        description: ta('تقويم دراسي وتوزيع المهام للفصل الدراسي الأول عام 1447هـ 2025/2026', 'Academic calendar and task distribution for Semester 1 - 1447H / 2025-2026'),
        gradient: 'from-indigo-600 to-blue-700',
        badge: undefined,
        semester: 'الفصل الأول',
        year: '1447هـ',
        weeks: 18,
        start: '1447/01/08',
        end: '1447/05/15',
    },
    {
        id: 'cal-1447-2',
        title: ta('التقويم الدراسي ف 2 عام 1447هـ 1448هـ', 'Academic Calendar Sem 2 - 1447-1448H'),
        description: ta('تقويم دراسي وتوزيع المهام للفصل الدراسي الثاني عام 1447هـ 1448هـ 2025/2026', 'Academic calendar and task distribution for Semester 2 - 1447-1448H / 2025-2026'),
        gradient: 'from-violet-600 to-purple-700',
        badge: 'الفصل الحالي',
        semester: 'الفصل الثاني',
        year: '1447هـ - 1448هـ',
        weeks: 19,
        start: '1447/07/29',
        end: '1448/01/10',
    },
    {
        id: 'cal-west-1447-1',
        title: ta('التقويم الدراسي للمنطقة الغربية ف 1 عام 1447هـ', 'Academic Calendar Western Region Sem 1 - 1447H'),
        description: ta('تقويم دراسي وتوزيع المهام للمنطقة الغربية (مكة - المدينة - جدة - الطائف) للفصل الأول عام 1447هـ', 'Academic calendar and task distribution for Western Region (Makkah/Madinah/Jeddah/Taif) - Sem 1, 1447H'),
        gradient: 'from-emerald-600 to-teal-700',
        badge: undefined,
        semester: 'الفصل الأول - المنطقة الغربية',
        year: '1447هـ',
        weeks: 18,
        start: '1447/01/08',
        end: '1447/05/15',
    },
    {
        id: 'cal-west-1447-2',
        title: ta('التقويم الدراسي للمنطقة الغربية ف 2 عام 1447هـ 1448هـ', 'Academic Calendar - Western Region Sem 2 (1447-1448H)'),
        description: ta('تقويم دراسي وتوزيع المهام للمنطقة الغربية (مكة - المدينة - جدة - الطائف) للفصل الثاني عام 1447هـ 1448هـ', 'Academic calendar and task distribution for Western Region (Makkah/Madinah/Jeddah/Taif) - Sem 2, 1447-1448H'),
        gradient: 'from-cyan-600 to-teal-700',
        badge: 'الفصل الحالي',
        semester: 'الفصل الثاني - المنطقة الغربية',
        year: '1447هـ - 1448هـ',
        weeks: 19,
        start: '1447/07/29',
        end: '1448/01/17',
    },
];

type CalDef = typeof CALENDARS[0];

// ===== Calendar Form =====
function CalendarForm({ cal, onBack }: { cal: CalDef; onBack: () => void }) {
  const { dir } = useTranslation();
    const [showPreview, setShowPreview] = useState(false);
    const defaultSubject = `توزيع مهام\nمادة [اسم المادة]`;
    const [v, setV] = useState<Record<string, string>>({
        subject: defaultSubject,
        semester: cal.semester, year: cal.year,
    });
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));

    const weekCount = cal.weeks;
    const [weeks, setWeeks] = useState<string[]>(Array(weekCount).fill(''));
    const setWeek = (i: number, val: string) => setWeeks(p => { const n = [...p]; n[i] = val; return n; });

    const handleReset = () => {
        setV({ subject: defaultSubject, semester: cal.semester, year: cal.year });
        setWeeks(Array(weekCount).fill(''));
        setShowPreview(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للتقاويم الدراسية', 'Back to Academic Calendars')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${cal.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{cal.title}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{cal.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* حقل موضوع التقويم */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('موضوع التقويم - مثال: مهام مادة ...:', 'Assessment topic - e.g., Subject assignments...:')}</label>
                                <Textarea
                                    placeholder={ta('توزيع مهام\nمادة [اسم المادة]', 'توزيع مهام\\nمادة [اسم المادة]')}
                                    rows={3}
                                    value={v.subject}
                                    onChange={e => set('subject', e.target.value)}
                                    className="resize-y text-sm text-start"
                                />
                            </div>

                            {/* أسابيع */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-start">توزيع مهام الأسابيع ({weekCount} أسبوع):</p>
                                <div className="space-y-2 max-h-80 overflow-y-auto ps-1">
                                    {Array.from({ length: weekCount }, (_, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className={`text-xs font-bold text-white bg-gradient-to-br ${cal.gradient} w-7 h-7 rounded-lg flex items-center justify-center shrink-0`}>{i + 1}</span>
                                            <Input
                                                placeholder={`مهام الأسبوع ${i + 1}...`}
                                                value={weeks[i]}
                                                onChange={e => setWeek(i, e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* أزرار */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <Button onClick={() => setShowPreview(true)} className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white border-0">
                                    <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                </Button>
                                <Button onClick={handleReset} className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0">
                                    <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                </Button>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${cal.gradient} text-white border-0`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {showPreview || weeks.some(w => w) ? (
                            <div id="cal-preview" style={{ fontFamily:'Cairo,sans-serif', direction:'rtl', background:'white', fontSize:'9px', padding:'8px' }}>
                                {/* Header */}
                                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', marginBottom:'6px', borderBottom:'2px solid #1e40af', paddingBottom:'6px', gap:'4px' }}>
                                    {/* يمين: شعار الكتاب */}
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'2px' }}>
                                        <svg viewBox="0 0 100 90" style={{ width:'40px', height:'36px' }}>
                                            {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(
                                                <circle key={i} cx={cx} cy={cy} r="3" fill="#1e40af"/>
                                            ))}
                                            <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#1e40af"/>
                                            <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#1e40af"/>
                                            <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                            <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                            <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                            <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                            <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        </svg>
                                        <div style={{ fontSize:'9px', fontWeight:'bold', color:'#1e40af' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                        <div style={{ fontSize:'7px', color:'#6b7280' }}>Ministry of Education</div>
                                    </div>
                                    {/* وسط: العنوان */}
                                    <div style={{ textAlign:'center' }}>
                                        <div style={{ fontSize:'16px', fontWeight:'900', color:'#1e40af' }}>{ta('التقويم الدراسي وتوزيع المهام', 'Academic Calendar & Task Distribution')}</div>
                                        <div style={{ fontSize:'11px', fontWeight:'bold', color:'#374151' }}>{ta('للفصل الدراسي الأول لعام (١٤٤٧هـ / ٢٠٢٥ - ٢٠٢٦ م)', 'For First Semester (1447H / 2025-2026)')}</div>
                                    </div>
                                    {/* يسار: موضوع التقويم */}
                                    <div style={{ textAlign:'right', lineHeight:'1.6', minWidth:'100px' }}>
                                        <div style={{ fontSize:'10px', fontWeight:'bold', whiteSpace:'pre-line', color:'#374151' }}>{v.subject}</div>
                                    </div>
                                </div>

                                {/* Grid أسابيع — 5 في كل صف */}
                                {[0,1,2,3].map(row => (
                                    <div key={row} style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'3px', marginBottom:'3px' }}>
                                        {CAL_1447_1_WEEKS.slice(row*5, row*5+5).map((wk) => {
                                            const userTask = weeks[wk.num - 1];
                                            const isVac = (wk as any).isVacation;
                                            const wkNames = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر','السادس عشر','السابع عشر','الثامن عشر','التاسع عشر'];
                                            return (
                                                <div key={wk.num} style={{ border:'1px solid #d1d5db', borderRadius:'4px', overflow:'hidden', fontSize:'8px' }}>
                                                    {/* رأس الأسبوع */}
                                                    <div style={{ background: isVac ? '#d97706' : '#1e40af', color:'white', padding:'2px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                        <span style={{ fontSize:'7px', opacity:0.85 }}>{wk.hijri}</span>
                                                        <span style={{ fontWeight:'bold', fontSize:'8px' }}>الأسبوع {wkNames[wk.num-1]}</span>
                                                        <span style={{ fontSize:'8px', background:'white', color:'#1e40af', borderRadius:'50%', width:'14px', height:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }}>{wk.num}</span>
                                                    </div>
                                                    {/* مهمة المستخدم */}
                                                    {userTask && (
                                                        <div style={{ background:'#eff6ff', padding:'2px 4px', fontSize:'7px', color:'#1e40af', fontWeight:'bold', borderBottom:'1px solid #bfdbfe' }}>{userTask}</div>
                                                    )}
                                                    {/* إجازة كاملة */}
                                                    {isVac ? (
                                                        <div style={{ padding:'6px 4px', background:'#fef3c7', textAlign:'center', fontSize:'7px', fontWeight:'bold', color:'#92400e', minHeight:'60px', display:'flex', flexDirection:'column', justifyContent:'center', gap:'2px' }}>
                                                            <div style={{ fontSize:'9px' }}>{(wk as any).vacTitle}</div>
                                                            <div style={{ fontSize:'6px', color:'#78350f', whiteSpace:'pre-line' }}>{(wk as any).vacNote}</div>
                                                        </div>
                                                    ) : (
                                                        DAYS_AR.map((day, di) => {
                                                            const isNote = wk.noteDay === di && wk.note;
                                                            const bg = isNote ? wk.noteColor + '22' : di % 2 === 0 ? 'white' : '#f9fafb';
                                                            return (
                                                                <div key={di} style={{ display:'grid', gridTemplateColumns:'auto 1fr', borderBottom: di < 4 ? '1px solid #f3f4f6' : 'none', background: bg }}>
                                                                    <div style={{ padding:'1px 3px', borderLeft:'1px solid #f3f4f6', color:'#374151', fontSize:'7px', whiteSpace:'nowrap' }}>{day}</div>
                                                                    <div style={{ padding:'1px 3px', textAlign:'center', color:'#6b7280', fontSize:'6px', lineHeight:'1.3' }}>
                                                                        {isNote
                                                                            ? <span style={{ color:wk.noteColor, fontWeight:'bold', fontSize:'6px' }}>{wk.note}</span>
                                                                            : <>{wk.days[di]}<br/>{wk.mDays[di]}</>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {row === 3 && CAL_1447_1_WEEKS.slice(row*5).length < 5 && Array.from({length: 5 - CAL_1447_1_WEEKS.slice(row*5).length}).map((_,i)=><div key={i}/>)}
                                    </div>
                                ))}

                                {/* Legend */}
                                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'4px', fontSize:'7px', borderTop:'1px solid #e5e7eb', paddingTop:'4px' }}>
                                    {[['#ef4444','فصل الشتاء'],['#f97316','فصل الخريف'],['#eab308','فصل الربيع'],['#0ea5e9','إجازة إضافية'],['#16a34a','إجازة اليوم الوطني'],['#7c3aed','الاختبارات النهائية'],['#6b7280','إجازة منتصف العام']].map(([c,l])=>(
                                        <span key={l} style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                                            <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:c, display:'inline-block' }}/>
                                            {l}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ textAlign:'center', fontSize:'7px', color:'#9ca3af', marginTop:'3px' }}>{ta('www.edu-forms.com - موقع نماذج تعليمية', 'www.edu-forms.com - Educational Forms Website')}</div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">{ta('ابدأ بملء الحقول لرؤية المعاينة', 'Start filling in the fields to see preview')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`@media print { nav, footer, button { display: none !important; } }`}</style>
        </div>
    );
}

// ===== Main Page =====
export default function AcademicCalendarsPage() {
  const { dir } = useTranslation();
    const [selected, setSelected] = useState<CalDef | null>(null);
    if (selected) return <CalendarForm cal={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-indigo-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-indigo-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Calendar className="w-4 h-4 text-indigo-400" /> {ta('التقاويم الدراسية', 'Academic Calendars')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('التقاويم الدراسية وتوزيع الأسابيع', 'Academic Calendars & Week Distribution')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('للتقاويم الدراسية وتوزيع أسابيع ومهام العام الدراسي', 'For academic calendars and distribution of weeks and tasks for the school year')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{CALENDARS.length} تقاويم</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {CALENDARS.map(cal => (
                            <Card key={cal.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(cal)}>
                                <div className={`h-2 bg-gradient-to-l ${cal.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cal.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        {cal.badge && <Badge className="bg-amber-500 text-white text-xs">{cal.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">{cal.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1 line-clamp-2">{cal.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{cal.weeks} أسبوع</span>
                                        <span>•</span>
                                        <span>{cal.year}</span>
                                    </div>
                                    <Button className={`w-full bg-gradient-to-l ${cal.gradient} text-white border-0 hover:opacity-90 gap-2`}>
                                        <Eye className="w-4 h-4" /> {ta('ابدأ التصميم', 'Start Design')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
