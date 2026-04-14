'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Eye, Download, RotateCcw, ChevronRight, CalendarDays, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

const DAYS = [
    { key: 'sun', label: ta('الأحد', 'Sunday') },
    { key: 'mon', label: ta('الاثنين', 'Monday') },
    { key: 'tue', label: ta('الثلاثاء', 'Tuesday') },
    { key: 'wed', label: ta('الأربعاء', 'Wednesday') },
    { key: 'thu', label: ta('الخميس', 'Thursday') },
];

const WEEKS = [
    { num: 1,  label: ta('الأسبوع الأول', 'First Week'),         from: '1447/07/29', to: '1447/08/03', from_w: '1447/07/29', to_w: '1447/08/05' },
    { num: 2,  label: ta('الأسبوع الثاني', 'Second Week'),        from: '1447/08/06', to: '1447/08/10', from_w: '1447/08/06', to_w: '1447/08/12' },
    { num: 3,  label: ta('الأسبوع الثالث', 'Third Week'),        from: '1447/08/13', to: '1447/08/17', from_w: '1447/08/13', to_w: '1447/08/19' },
    { num: 4,  label: ta('الأسبوع الرابع', 'Fourth Week'),        from: '1447/08/20', to: '1447/08/24', from_w: '1447/08/20', to_w: '1447/08/26' },
    { num: 5,  label: ta('الأسبوع الخامس', 'Fifth Week'),        from: '1447/08/27', to: '1447/09/02', from_w: '1447/08/27', to_w: '1447/09/02' },
    { num: 6,  label: ta('الأسبوع السادس', 'Sixth Week'),        from: '1447/09/05', to: '1447/09/09', from_w: '1447/09/05', to_w: '1447/09/09' },
    { num: 7,  label: ta('الأسبوع السابع', 'Seventh Week'),        from: '1447/09/12', to: '1447/09/16', from_w: '1447/09/12', to_w: '1447/09/16' },
    { num: 8,  label: ta('الأسبوع الثامن', 'Eighth Week'),        from: '1447/10/10', to: '1447/10/14', from_w: '1447/10/10', to_w: '1447/10/14' },
    { num: 9,  label: ta('الأسبوع التاسع', 'Ninth Week'),        from: '1447/10/17', to: '1447/10/21', from_w: '1447/10/17', to_w: '1447/10/21' },
    { num: 10, label: ta('الأسبوع العاشر', 'Tenth Week'),        from: '1447/10/24', to: '1447/10/28', from_w: '1447/10/24', to_w: '1447/10/28' },
    { num: 11, label: ta('الأسبوع الحادي عشر', 'Eleventh Week'),   from: '1447/11/02', to: '1447/11/06', from_w: '1447/11/02', to_w: '1447/11/06' },
    { num: 12, label: ta('الأسبوع الثاني عشر', 'Twelfth Week'),   from: '1447/11/09', to: '1447/11/13', from_w: '1447/11/09', to_w: '1447/11/13' },
    { num: 13, label: ta('الأسبوع الثالث عشر', 'Thirteenth Week'),   from: '1447/11/16', to: '1447/11/20', from_w: '1447/11/16', to_w: '1447/11/20' },
    { num: 14, label: ta('الأسبوع الرابع عشر', 'Fourteenth Week'),   from: '1447/11/23', to: '1447/11/27', from_w: '1447/11/23', to_w: '1447/11/27' },
    { num: 15, label: ta('الأسبوع الخامس عشر', 'Fifteenth Week'),   from: '1447/11/30', to: '1447/12/04', from_w: '1447/11/30', to_w: '1447/12/04' },
    { num: 16, label: ta('الأسبوع السادس عشر', 'Sixteenth Week'),   from: '1447/12/14', to: '1447/12/18', from_w: '1447/12/14', to_w: '1447/12/18' },
    { num: 17, label: ta('الأسبوع السابع عشر', 'Seventeenth Week'),   from: '1447/12/21', to: '1447/12/25', from_w: '1447/12/21', to_w: '1447/12/25' },
    { num: 18, label: ta('الأسبوع الثامن عشر', 'Eighteenth Week'),   from: '1447/12/28', to: '1448/01/03', from_w: '1447/12/28', to_w: '1448/01/03' },
    { num: 19, label: ta('الأسبوع التاسع عشر', 'Nineteenth Week'),   from: '1448/01/06', to: '1448/01/10', from_w: '1448/01/06', to_w: '1448/01/10' },
];

type DayData = {
    enabled: boolean;
    topic: string; objectives: string; homework: string;
    obj_achieved: string; group_count: string;
    participation: string; comprehension: string;
    tools: string[]; strategy: string[]; difficulties: string;
    interventions: string[]; day_notes: string;
};

const defaultDay = (): DayData => ({
    enabled: true, topic: '', objectives: '', homework: '',
    obj_achieved: 'تم التنفيذ كاملاً', group_count: 'جميع الأهداف تحققت',
    participation: 'عالية (80-100%)', comprehension: 'عالي (80-100%)',
    tools: [], strategy: [], difficulties: 'لا يوجد',
    interventions: [], day_notes: '',
});

// شعار وزارة التعليم
function MOELogo() {
  const { dir } = useTranslation();
    return (
        <svg viewBox="0 0 100 90" className="w-12 h-10">
            {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(
                <circle key={i} cx={cx} cy={cy} r="3" fill="#1a9b7a"/>
            ))}
            <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#1a9b7a"/>
            <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#1a9b7a"/>
            <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="2"/>
            <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1.5" opacity="0.7"/>
            <line x1="24" y1="60" x2="46" y2="58" stroke="white" strokeWidth="1.5" opacity="0.7"/>
            <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1.5" opacity="0.7"/>
            <line x1="54" y1="58" x2="76" y2="60" stroke="white" strokeWidth="1.5" opacity="0.7"/>
            <text x="50" y="82" textAnchor="middle" fontSize="8" fill="#1a9b7a" fontWeight="bold">{ta('وزارة التعـليم', 'Ministry of Education')}</text>
            <text x="50" y="90" textAnchor="middle" fontSize="6" fill="#666">Ministry of Education</text>
        </svg>
    );
}

// صفحة تقرير يوم واحد
function DayReportPage({ dayKey, dayLabel, dayDate, data, info, week }: {
    dayKey: string; dayLabel: string; dayDate: string;
    data: DayData; info: Record<string,string>; week: typeof WEEKS[0];
}) {
    const hdr = { background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' };

    // حقل بـ label داخل البوردر في الزاوية العلوية اليمنى
    const Field = ({ label, value, minH = '32px' }: { label: string; value: string; minH?: string }) => (
        <div className="relative border border-teal-400 rounded-lg bg-white" style={{ minHeight: minH }}>
            <span className="absolute -top-2.5 right-3 bg-white px-1 text-teal-600 font-bold text-[9px]">{label}</span>
            <div className="px-3 pt-3 pb-2 text-[10px] text-gray-700">{value}</div>
        </div>
    );

    return (
        <div className="bg-white overflow-hidden" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '10px', border: '1.5px solid #ccc', borderRadius: '12px' }}>

            {/* Header: إدارة التعليم | شعار | الفصل/الأسبوع */}
            <div className="grid overflow-hidden" style={{ gridTemplateColumns: '1fr 1fr 1fr', borderRadius: '10px 10px 0 0' }}>
                {/* الفصل/الأسبوع - يسار (أول في DOM لأن RTL) */}
                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2" style={{ ...hdr, borderRadius: '0 10px 0 0' }}>
                    <p className="font-bold text-[9px]">{info.semester || 'الفصل الدراسي الثاني'}</p>
                    <p className="font-bold text-[9px]">{week.label}</p>
                    <p className="text-[8px] mt-1">{info.subject || 'شنشنى'}</p>
                    <p className="text-[8px]">{info.grade || 'بتت'}</p>
                </div>
                {/* شعار وزارة التعليم - وسط */}
                <div className="flex flex-col items-center justify-center p-2 bg-white border-l border-r border-gray-200">
                    <MOELogo />
                </div>
                {/* إدارة التعليم - يمين */}
                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2" style={{ ...hdr, borderRadius: '10px 0 0 0' }}>
                    <p className="text-[9px] leading-relaxed whitespace-pre-line">{info.school || 'الإدارة العامة للتعليم\nبالمنطقة\nمدرسة'}</p>
                </div>
            </div>

            {/* شريط عنوان اليوم */}
            <div className="text-white text-start py-2 px-4 font-bold text-[11px] mx-2 mt-2 rounded-lg" style={{ background: '#1e293b' }}>
                تقرير الإنجاز اليومي: {dayLabel} {dayDate}
            </div>

            {/* المحتوى */}
            <div className="p-3 space-y-3">

                {/* الوحدة / عنوان الدرس */}
                <Field label="الوحدة / عنوان الدرس:" value={data.topic || 'عنوان الدرس'} />

                {/* حالة التنفيذ + تحقيق الأهداف */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="حالة تنفيذ الدرس:" value={data.obj_achieved} />
                    <Field label="حالة تحقيق أهداف الدرس:" value={data.group_count} />
                </div>

                {/* الواجب المنزلي */}
                <Field label="الواجب المنزلي:" value={data.homework || 'على منصة مدرستي'} />

                {/* المشاركة + الفهم */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="مستوى المشاركة والتفاعل:" value={data.participation} />
                    <Field label="مستوى الفهم:" value={data.comprehension} />
                </div>

                {/* الأدوات + الاستراتيجية */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="الأدوات والوسائل التعليمية:" value={data.tools.length ? data.tools.join('، ') : ta('الكتاب، السبورة التقليدية، أوراق عمل', 'Textbook, Traditional Whiteboard, Worksheets') } minH="44px" />
                    <Field label="طريقة التدريس أوالاستراتيجية المطبقة:" value={data.strategy.length ? data.strategy.join('، ') : ta('التدريس المباشر، التعلم التعاوني، التعلم بالاكتشاف', 'Direct teaching, cooperative learning, discovery learning') } minH="44px" />
                </div>

                {/* الصعوبات + الإجراءات */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="الصعوبات والتحديات:" value={data.difficulties || 'لا يوجد'} minH="44px" />
                    <Field label="الإجراءات الفورية (التدخلات الداعمة):" value={data.interventions.length ? data.interventions.join('، ') : ta('استخدام أمثلة إضافية، التعزيز الإيجابي، تشجيع المشاركة', 'Using additional examples, positive reinforcement, encouraging participation') } minH="44px" />
                </div>

                {/* الملاحظات */}
                <div className="relative border border-teal-400 rounded-lg bg-white" style={{ minHeight: '60px' }}>
                    <span className="absolute top-0 left-0 right-0 flex items-center justify-center -translate-y-2.5">
                        <span className="bg-white px-2 text-teal-600 font-bold text-[9px] flex items-center gap-1">
                            <span className="inline-block w-8 border-t border-teal-400"/>
                            {ta('الملاحظات', 'Notes')}
                            <span className="inline-block w-8 border-t border-teal-400"/>
                        </span>
                    </span>
                    <div className="px-3 pt-4 pb-3 text-[10px] text-gray-700 text-center">
                        {data.day_notes || 'قم بحل الواجبات والأنشطة لرفع درجات تحصيلك'}
                    </div>
                </div>

                {/* المعلم + المدير */}
                <div className="grid grid-cols-2 pt-1 pb-1">
                    <div className="text-start text-[10px] text-gray-700 px-2">{info.teacher || 'تنتنت'}</div>
                    <div className="text-start text-[10px] text-gray-700 px-2">{ta('اسم المدير', 'Principal Name')}</div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="text-white text-center py-1.5 text-[9px]" style={{ background: '#1e293b' }}>
                {ta('منصة SERS - sers.edu', 'SERS Platform - sers.edu')}
            </div>
        </div>
    );
}

// صفحة التقرير الأسبوعي
function WeeklyReportPage({ info, week, days, weekly }: {
    info: Record<string,string>; week: typeof WEEKS[0];
    days: Record<string, DayData>;
    weekly: { achievement_rate: string; homework_follow: string; comprehension_rate: string; tools: string; strategies: string; difficulties: string; interventions: string; recommendations: string; extra_notes: string; };
}) {
    const hdr = { background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' };
    const Field = ({ label, value, minH = '40px' }: { label: string; value: string; minH?: string }) => (
        <div className="relative border border-teal-400 rounded-lg bg-white" style={{ minHeight: minH }}>
            <span className="absolute -top-2.5 right-3 bg-white px-1 text-teal-600 font-bold text-[9px]">{label}</span>
            <div className="px-3 pt-3 pb-2 text-[10px] text-gray-700">{value}</div>
        </div>
    );

    // عناوين الدروس من كل يوم
    const lessonTitles = DAYS.map(d => `- ${d.label}: ${days[d.key].topic || 'عنوان الدرس'}`).join('\n');

    return (
        <div className="bg-white overflow-hidden" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '10px', border: '1.5px solid #ccc', borderRadius: '12px' }}>
            {/* Header */}
            <div className="grid overflow-hidden" style={{ gridTemplateColumns: '1fr 1fr 1fr', borderRadius: '10px 10px 0 0' }}>
                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2" style={{ ...hdr, borderRadius: '0 10px 0 0' }}>
                    <p className="font-bold text-[9px]">{info.semester || 'الفصل الدراسي الثاني'}</p>
                    <p className="font-bold text-[9px]">{week.label}</p>
                    <p className="text-[8px] mt-1">{info.subject || 'شنشنى'}</p>
                    <p className="text-[8px]">{info.grade || 'بتت'}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-white border-l border-r border-gray-200">
                    <MOELogo />
                </div>
                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2" style={{ ...hdr, borderRadius: '10px 0 0 0' }}>
                    <p className="text-[9px] leading-relaxed whitespace-pre-line">{info.school || 'الإدارة العامة للتعليم\nبالمنطقة\nمدرسة'}</p>
                </div>
            </div>

            {/* شريط العنوان */}
            <div className="text-white text-start py-2 px-4 font-bold text-[11px] mx-2 mt-2 rounded-lg" style={{ background: '#1e293b' }}>
                تقرير الإنجاز الأسبوعي: من {week.from}هـ إلى {week.to}هـ
            </div>

            <div className="p-3 space-y-3">
                {/* عناوين الدروس + إنجاز الدروس */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative border border-teal-400 rounded-lg bg-white" style={{ minHeight: '80px' }}>
                        <span className="absolute -top-2.5 right-3 bg-white px-1 text-teal-600 font-bold text-[9px]">{ta('عناوين الدروس:', 'Lesson Titles:')}</span>
                        <div className="px-3 pt-3 pb-2 text-[9px] text-gray-700 whitespace-pre-line">{lessonTitles}</div>
                    </div>
                    <div className="space-y-2">
                        <Field label="إنجاز الدروس حسب الخطة الدراسية:" value={weekly.achievement_rate || 'معدل الإنجاز: 100%'} />
                        <Field label="متابعة الواجبات المنزلية:" value={weekly.homework_follow || 'تمت المتابعة'} />
                        <Field label="مستوى الفهم:" value={weekly.comprehension_rate || 'معدل مستوى الفهم: 90%'} />
                    </div>
                </div>

                {/* الأدوات + الاستراتيجيات */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="الأدوات والوسائل التعليمية المستخدمة:" value={weekly.tools || 'الكتاب - السبورة التقليدية - أوراق عمل'} minH="50px" />
                    <Field label="طرق التدريس أوالاستراتيجيات المطبقة:" value={weekly.strategies || 'التدريس المباشر - التعلم التعاوني - التعلم بالاكتشاف'} minH="50px" />
                </div>

                {/* الصعوبات + طرق معالجة الضعف */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="الصعوبات والتحديات:" value={weekly.difficulties || 'لا توجد صعوبات'} minH="50px" />
                    <Field label="طرق معالجة جوانب الضعف المنفذة:" value={weekly.interventions || 'استخدام أمثلة إضافية - التعزيز الإيجابي - تشجيع المشاركة'} minH="50px" />
                </div>

                {/* التوصيات + ملاحظات إضافية */}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="ملاحظات إضافية:" value={weekly.extra_notes || 'لا يوجد'} minH="50px" />
                    <Field label="التوصيات:" value={weekly.recommendations || 'زيادة الأنشطة الصفية، مراجعة الدروس السابقة بداية كل درس'} minH="50px" />
                </div>

                {/* المعلم + المدير */}
                <div className="grid grid-cols-2 pt-1 pb-1">
                    <div className="text-start text-[10px] text-gray-700 px-2">{info.teacher || 'تنتنت'}</div>
                    <div className="text-start text-[10px] text-gray-700 px-2">{ta('اسم المدير', 'Principal Name')}</div>
                </div>
            </div>

            <div className="text-white text-center py-1.5 text-[9px]" style={{ background: '#1e293b' }}>
                {ta('منصة SERS - sers.edu', 'SERS Platform - sers.edu')}
            </div>
        </div>
    );
}

function AchievementReportForm({ week, onBack }: { week: typeof WEEKS[0]; onBack: () => void }) {
  const { dir } = useTranslation();
    const [info, setInfo] = useState<Record<string,string>>({
        school: '', teacher: '', subject: '', grade: '',
        week_num: week.label, semester: 'الفصل الدراسي الثاني',
    });
    const setI = (k: string, v: string) => setInfo(p => ({ ...p, [k]: v }));

    const [days, setDays] = useState<Record<string, DayData>>({
        sun: defaultDay(), mon: defaultDay(), tue: defaultDay(), wed: defaultDay(), thu: defaultDay(),
    });
    const setDay = (key: string, field: string, val: any) =>
        setDays(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    const toggleArr = (key: string, field: 'tools' | 'strategy' | 'interventions', val: string) => {
        const arr = days[key][field] as string[];
        setDay(key, field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    };

    const dayDates: Record<string, string> = {
        sun: week.from + 'هـ', mon: '', tue: '', wed: '', thu: week.to + 'هـ',
    };

    const [weekly, setWeekly] = useState({
        achievement_rate: 'معدل الإنجاز: 100%',
        homework_follow: 'تمت المتابعة',
        comprehension_rate: 'معدل مستوى الفهم: 90%',
        tools: 'الكتاب - السبورة التقليدية - أوراق عمل',
        strategies: 'التدريس المباشر - التعلم التعاوني - التعلم بالاكتشاف',
        difficulties: 'لا توجد صعوبات',
        interventions: 'استخدام أمثلة إضافية - التعزيز الإيجابي - تشجيع المشاركة',
        recommendations: 'زيادة الأنشطة الصفية، مراجعة الدروس السابقة بداية كل درس',
        extra_notes: 'لا يوجد',
    });
    const setW = (k: string, v: string) => setWeekly(p => ({ ...p, [k]: v }));

    const enabledDays = DAYS.filter(d => days[d.key].enabled);

    const downloadImage = async (dayKey: string, dayLabel: string) => {
        const el = document.getElementById(`report-page-${dayKey}`);
        if (!el) return;
        const tid = toast.loading(ta('جاري التحضير...', 'Preparing...'));
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(el, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `تقرير-${dayLabel}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.dismiss(tid);
        toast.success(ta('تم التحميل', 'Loaded'));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة لتقرير إنجاز المعلم', 'Back to Teacher Achievement Report')}
                </button>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Form */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-l from-rose-600 to-pink-600 text-white rounded-t-xl py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
                                <CardTitle className="text-sm">{ta('تقارير إنجاز المعلم اليومية', 'Daily Teacher Achievement Reports')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="text-center py-2 space-y-0.5">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{week.label} — من {week.from}هـ إلى {week.to}هـ</p>
                                <p className="text-[10px] text-gray-400">{ta('عبّئ البيانات وستظهر في المعاينة مباشرة', 'Fill in data and it will appear in the preview immediately')}</p>
                            </div>

                            {/* معلومات عامة */}
                            <div>
                                <label className="block text-xs text-gray-600 mb-1 text-start">{ta('إدارة التعليم / المدرسة:', 'Education Authority / School:')}</label>
                                <Textarea rows={2} placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} value={info.school} onChange={e => setI('school', e.target.value)} className="resize-y text-sm text-start" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[['teacher','اسم المعلم'],['subject','المادة'],['grade','الصف/الفصل']].map(([k,l]) => (
                                    <div key={k}>
                                        <label className="block text-xs text-gray-600 mb-1 text-start">{l}:</label>
                                        <Input value={info[k]} onChange={e => setI(k, e.target.value)} className="text-xs text-start h-8" />
                                    </div>
                                ))}
                            </div>

                            {/* تفاصيل الأيام */}
                            <div className="border-t pt-3">
                                <p className="text-xs font-bold text-gray-700 mb-3">{ta('تفاصيل الأيام', 'Day Details')}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {DAYS.map((d) => (
                                        <div key={d.key} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                                                <button onClick={() => setDay(d.key, 'enabled', !days[d.key].enabled)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors ${days[d.key].enabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${days[d.key].enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                </button>
                                                <span className="text-xs text-gray-500">{d.label} {dayDates[d.key]}</span>
                                            </div>
                                            {days[d.key].enabled && (
                                                <div className="p-3 space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('موضوع الدرس:', 'Lesson Topic:')}</label>
                                                        <Input value={days[d.key].topic} onChange={e => setDay(d.key,'topic',e.target.value)} className="text-xs text-start h-8" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('الواجب المنزلي:', 'Homework:')}</label>
                                                        <Input value={days[d.key].homework} onChange={e => setDay(d.key,'homework',e.target.value)} className="text-xs text-start h-8" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] text-gray-500 mb-1 text-start">{ta('حالة التنفيذ:', 'Implementation Status:')}</label>
                                                            <select value={days[d.key].obj_achieved} onChange={e => setDay(d.key,'obj_achieved',e.target.value)} className="w-full border border-gray-200 rounded text-[10px] p-1.5 bg-white text-start">
                                                                <option>{ta('تم التنفيذ كاملاً', 'Fully Implemented')}</option><option>{ta('تم جزئياً', 'Partially done')}</option><option>{ta('لم يتم', 'Not done')}</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-gray-500 mb-1 text-start">{ta('تحقيق الأهداف:', 'Objectives Achievement:')}</label>
                                                            <select value={days[d.key].group_count} onChange={e => setDay(d.key,'group_count',e.target.value)} className="w-full border border-gray-200 rounded text-[10px] p-1.5 bg-white text-start">
                                                                <option>{ta('جميع الأهداف تحققت', 'All Objectives Achieved')}</option><option>{ta('تحققت جزئياً', 'Partially Achieved')}</option><option>{ta('لم تتحقق', 'Not Achieved')}</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] text-gray-500 mb-1 text-start">{ta('المشاركة:', 'Participation:')}</label>
                                                            <select value={days[d.key].participation} onChange={e => setDay(d.key,'participation',e.target.value)} className="w-full border border-gray-200 rounded text-[10px] p-1.5 bg-white text-start">
                                                                <option>{ta('عالية (80-100%)', 'High (80-100%)')}</option><option>{ta('متوسطة (60-79%)', 'Average (60-79%)')}</option><option>{ta('منخفضة', 'Low')}</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-gray-500 mb-1 text-start">{ta('مستوى الفهم:', 'Comprehension Level:')}</label>
                                                            <select value={days[d.key].comprehension} onChange={e => setDay(d.key,'comprehension',e.target.value)} className="w-full border border-gray-200 rounded text-[10px] p-1.5 bg-white text-start">
                                                                <option>{ta('عالي (80-100%)', 'High (80-100%)')}</option><option>{ta('متوسط (60-79%)', 'Average (60-79%)')}</option><option>{ta('منخفض', 'Low')}</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('الأدوات:', 'Tools:')}</label>
                                                        <div className="flex flex-wrap gap-1 border border-gray-200 rounded p-1.5">
                                                            {days[d.key].tools.map(t => (
                                                                <span key={t} className="flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    <button onClick={() => toggleArr(d.key,'tools',t)} className="text-gray-400 font-bold">×</button>{t}
                                                                </span>
                                                            ))}
                                                            {['الكتاب','السبورة','أوراق عمل'].filter(t => !days[d.key].tools.includes(t)).map(t => (
                                                                <button key={t} onClick={() => toggleArr(d.key,'tools',t)} className="text-[10px] text-gray-400 border border-dashed border-gray-300 px-1.5 py-0.5 rounded-full">+{t}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('الاستراتيجية:', 'Strategy:')}</label>
                                                        <div className="flex flex-wrap gap-1 border border-gray-200 rounded p-1.5">
                                                            {days[d.key].strategy.map(s => (
                                                                <span key={s} className="flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    <button onClick={() => toggleArr(d.key,'strategy',s)} className="text-gray-400 font-bold">×</button>{s}
                                                                </span>
                                                            ))}
                                                            {['التدريس المباشر','التعلم التعاوني','الاكتشاف'].filter(s => !days[d.key].strategy.includes(s)).map(s => (
                                                                <button key={s} onClick={() => toggleArr(d.key,'strategy',s)} className="text-[10px] text-gray-400 border border-dashed border-gray-300 px-1.5 py-0.5 rounded-full">+{s}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('الصعوبات:', 'Difficulties:')}</label>
                                                        <Input value={days[d.key].difficulties} onChange={e => setDay(d.key,'difficulties',e.target.value)} className="text-xs text-start h-8" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('الإجراءات الفورية:', 'Immediate Actions:')}</label>
                                                        <div className="flex flex-wrap gap-1 border border-gray-200 rounded p-1.5">
                                                            {days[d.key].interventions.map(i => (
                                                                <span key={i} className="flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    <button onClick={() => toggleArr(d.key,'interventions',i)} className="text-gray-400 font-bold">×</button>{i}
                                                                </span>
                                                            ))}
                                                            {['أمثلة إضافية','التعزيز الإيجابي','تشجيع المشاركة'].filter(i => !days[d.key].interventions.includes(i)).map(i => (
                                                                <button key={i} onClick={() => toggleArr(d.key,'interventions',i)} className="text-[10px] text-gray-400 border border-dashed border-gray-300 px-1.5 py-0.5 rounded-full">+{i}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1 text-start">{ta('ملاحظات:', 'Notes:')}</label>
                                                        <Textarea rows={2} value={days[d.key].day_notes} onChange={e => setDay(d.key,'day_notes',e.target.value)} className="resize-y text-xs text-start" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex gap-2">
                                    <Button onClick={() => {
                                        const el = document.getElementById(`report-page-${enabledDays[0]?.key}`);
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                        <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button onClick={() => setDays({ sun: defaultDay(), mon: defaultDay(), tue: defaultDay(), wed: defaultDay(), thu: defaultDay() })}
                                        className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                    </Button>
                                </div>
                                <Button onClick={async () => {
                                    const tid = toast.loading(ta('جاري تحضير الصفحات...', 'Preparing pages...'));
                                    const { default: html2canvas } = await import('html2canvas');
                                    const { default: jsPDF } = await import('jspdf');
                                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                                    const pdfW = pdf.internal.pageSize.getWidth();
                                    const pdfH = pdf.internal.pageSize.getHeight();
                                    const ids = [...enabledDays.map(d => `report-page-${d.key}`), 'report-page-weekly'];
                                    for (let i = 0; i < ids.length; i++) {
                                        const el = document.getElementById(ids[i]);
                                        if (!el) continue;
                                        if (i > 0) pdf.addPage();
                                        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                        const imgH = (canvas.height * pdfW) / canvas.width;
                                        const fH = imgH > pdfH ? pdfH : imgH;
                                        const fW = imgH > pdfH ? (canvas.width * pdfH) / canvas.height : pdfW;
                                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgH > pdfH ? (pdfW - fW) / 2 : 0, 0, fW, fH);
                                    }
                                    pdf.save('تقرير-إنجاز-المعلم.pdf');
                                    toast.dismiss(tid);
                                    toast.success(ta('تم التحميل', 'Loaded'));
                                }} className="w-full gap-2 bg-gradient-to-l from-rose-600 to-pink-600 text-white border-0 text-sm">
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview - grid 3 أعمدة مثل الصورة */}
                    <div className="sticky top-24">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Eye className="w-4 h-4" /> عدد الصفحات: {enabledDays.length + 1}
                            </p>
                            <Button onClick={async () => {
                                const tid = toast.loading(ta('جاري تحضير الصفحات...', 'Preparing pages...'));
                                const { default: html2canvas } = await import('html2canvas');
                                const { default: jsPDF } = await import('jspdf');
                                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                                const pdfW = pdf.internal.pageSize.getWidth();
                                const pdfH = pdf.internal.pageSize.getHeight();
                                const ids = [...enabledDays.map(d => `report-page-${d.key}`), 'report-page-weekly'];
                                for (let i = 0; i < ids.length; i++) {
                                    const el = document.getElementById(ids[i]);
                                    if (!el) continue;
                                    if (i > 0) pdf.addPage();
                                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                    const imgH = (canvas.height * pdfW) / canvas.width;
                                    const fH = imgH > pdfH ? pdfH : imgH;
                                    const fW = imgH > pdfH ? (canvas.width * pdfH) / canvas.height : pdfW;
                                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgH > pdfH ? (pdfW - fW) / 2 : 0, 0, fW, fH);
                                }
                                pdf.save('تقرير-إنجاز-المعلم.pdf');
                                toast.dismiss(tid);
                                toast.success(ta('تم التحميل', 'Loaded'));
                            }} className="gap-2 text-white text-xs h-8 px-3" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                <Download className="w-3 h-3" /> {ta('تحميل الكل PDF', 'Download All PDF')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* صفحات الأيام */}
                            {enabledDays.map((d, di) => (
                                <div key={d.key} className="flex flex-col gap-2">
                                    <div id={`report-page-${d.key}`}>
                                        <DayReportPage
                                            dayKey={d.key}
                                            dayLabel={d.label}
                                            dayDate={dayDates[d.key]}
                                            data={days[d.key]}
                                            info={info}
                                            week={week}
                                        />
                                    </div>
                                    <p className="text-center text-xs font-bold text-gray-600">صفحة {di + 1}</p>
                                    <Button onClick={() => downloadImage(d.key, d.label)}
                                        className="w-full gap-2 text-white text-xs h-8" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                        <Download className="w-3 h-3" /> {ta('تحميل الصورة', 'Upload Image')}
                                    </Button>
                                </div>
                            ))}
                            {/* صفحة الملخص الأسبوعي - الصفحة 6 */}
                            <div className="flex flex-col gap-2">
                                <div id="report-page-weekly">
                                    <WeeklyReportPage info={info} week={week} days={days} weekly={weekly} />
                                </div>
                                <p className="text-center text-xs font-bold text-gray-600">صفحة {enabledDays.length + 1}</p>
                                <Button onClick={async () => {
                                    const el = document.getElementById('report-page-weekly');
                                    if (!el) return;
                                    const tid = toast.loading(ta('جاري التحضير...', 'Preparing...'));
                                    const { default: html2canvas } = await import('html2canvas');
                                    const canvas = await html2canvas(el, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
                                    const link = document.createElement('a');
                                    link.download = 'تقرير-أسبوعي.png';
                                    link.href = canvas.toDataURL('image/png');
                                    link.click();
                                    toast.dismiss(tid);
                                    toast.success(ta('تم التحميل', 'Loaded'));
                                }} className="w-full gap-2 text-white text-xs h-8" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                    <Download className="w-3 h-3" /> {ta('تحميل الصورة', 'Upload Image')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function AchievementReportPage() {
  const { dir } = useTranslation();
    const [selectedWeek, setSelectedWeek] = useState<typeof WEEKS[0] | null>(null);
    if (selectedWeek) return <AchievementReportForm week={selectedWeek} onBack={() => setSelectedWeek(null)} />;
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-rose-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-rose-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <TrendingUp className="w-4 h-4 text-rose-400" /> {ta('تقرير إنجاز المعلم', 'Teacher Achievement Report')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('تقرير إنجاز المعلم', 'Teacher Achievement Report')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('إنشاء تقارير الإنجاز اليومية والأسبوعية بطريقة سهلة ومميزة', 'Create daily and weekly achievement reports in an easy and unique way')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{ta('تقارير يومية', 'Daily Reports')}</span>
                            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{ta('ملخص أسبوعي', 'Weekly Summary')}</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{WEEKS.length} أسبوع</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="text-center mb-8">
                        <div className="inline-block bg-gradient-to-l from-rose-600 to-pink-600 text-white px-6 py-3 rounded-xl text-lg font-bold mb-2">
                            {ta('الفصل الدراسي الثاني (19 أسبوع)', 'Second Semester (19 weeks)')}
                        </div>
                        <p className="text-sm text-gray-500">{ta('اختر أسبوع لإنشاء تقارير يومية وأسبوعي', 'Select a week to create daily and weekly reports')}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {WEEKS.map(week => (
                            <div key={week.num} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center mb-3">{week.label}</p>
                                <Button onClick={() => setSelectedWeek(week)}
                                    className="w-full bg-gradient-to-l from-rose-600 to-pink-600 hover:opacity-90 text-white text-xs mb-1 h-8">
                                    {ta('إنشاء التقارير', 'Create Reports')}
                                </Button>
                                <p className="text-[10px] text-gray-400 text-center mb-2">من {week.from}هـ إلى {week.to}هـ</p>
                                <Button onClick={() => setSelectedWeek({ ...week, from: week.from_w, to: week.to_w })}
                                    variant="outline"
                                    className="w-full text-teal-600 border-teal-300 hover:bg-teal-50 text-xs h-8">
                                    {ta('إنشاء التقارير (الغربية)', 'Create Reports (Western Region)')}
                                </Button>
                                <p className="text-[10px] text-gray-400 text-center mt-1">من {week.from_w}هـ إلى {week.to_w}هـ</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
