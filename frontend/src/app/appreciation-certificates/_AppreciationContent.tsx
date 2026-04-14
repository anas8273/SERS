'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Eye, Download, RotateCcw, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface CertDef {
    id: string;
    title: string;
    description?: string;
    gradient: string;
    badge?: string;
    recipientLabel: string;
    extraFields?: { key: string; label: string; placeholder: string }[];
}

const CERTS: CertDef[] = [
    { id: 'male-1', title: ta('شهادة شكر وتقدير للطلاب والمعلمين (تصميم 1)', 'Appreciation Certificate (Design 1)'), gradient: 'from-yellow-500 to-amber-600', badge: 'الأكثر استخداماً', recipientLabel: ta('اسم الطالب / المعلم', 'Student / Teacher Name') },
    { id: 'male-2', title: ta('شهادة شكر وتقدير للطلاب والمعلمين (تصميم 2)', 'Appreciation Certificate (Design 2)'), gradient: 'from-amber-500 to-orange-600', recipientLabel: ta('اسم الطالب / المعلم', 'Student / Teacher Name') },
    { id: 'male-3', title: ta('شهادة شكر وتقدير للطلاب والمعلمين (تصميم 3)', 'Appreciation Certificate for Students and Teachers (Design 3)'), gradient: 'from-orange-500 to-red-600', recipientLabel: ta('اسم الطالب / المعلم', 'Student / Teacher Name') },
    { id: 'male-4', title: ta('شهادة شكر وتقدير للطلاب والمعلمين (تصميم 4)', 'Appreciation Certificate for Students and Teachers (Design 4)'), gradient: 'from-rose-500 to-pink-600', recipientLabel: ta('اسم الطالب / المعلم', 'Student / Teacher Name') },
    { id: 'female-1', title: ta('شهادة شكر وتقدير للطالبات والمعلمات (تصميم 1)', 'Appreciation Certificate for Female Students and Teachers (Design 1)'), gradient: 'from-pink-500 to-rose-600', recipientLabel: ta('اسم الطالبة / المعلمة', 'Student/Teacher Name (F)') },
    { id: 'female-2', title: ta('شهادة شكر وتقدير للطالبات والمعلمات (تصميم 2)', 'Appreciation Certificate for Female Students and Teachers (Design 2)'), gradient: 'from-fuchsia-500 to-pink-600', recipientLabel: ta('اسم الطالبة / المعلمة', 'Student/Teacher Name (F)') },
    { id: 'female-3', title: ta('شهادة شكر وتقدير للطالبات والمعلمات (تصميم 3)', 'Appreciation Certificate for Female Students and Teachers (Design 3)'), gradient: 'from-purple-500 to-fuchsia-600', recipientLabel: ta('اسم الطالبة / المعلمة', 'Student/Teacher Name (F)') },
    { id: 'female-4', title: ta('شهادة شكر وتقدير للطالبات والمعلمات (تصميم 4)', 'Appreciation Certificate for Female Students and Teachers (Design 4)'), gradient: 'from-violet-500 to-purple-600', recipientLabel: ta('اسم الطالبة / المعلمة', 'Student/Teacher Name (F)') },
    { id: 'foundation-day', title: ta('شهادات شكر وتقدير يوم التأسيس', 'Founding Day Appreciation Certificates'), description: ta('شهادات لتكريم المشاركين بفعالية يوم تأسيس المملكة العربية السعودية ١٤٤٧هـ', 'Certificates honoring participants in Saudi Arabia Founding Day 1447H'), gradient: 'from-green-600 to-emerald-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'gulf-talent', title: ta('اليوم الخليجي للموهبة والإبداع', 'Gulf Talent and Creativity Day'), description: ta('شهادات لتكريم المشاركين بفعالية اليوم الخليجي للموهبة والإبداع ١٤٤٧هـ', 'Certificates honoring participants in the Gulf Talent and Creativity Day 1447H'), gradient: 'from-teal-600 to-cyan-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'nafis-students', title: ta('شهادات شكر وتقدير نافس للطلاب والطالبات', 'NAFS Appreciation Certificates for Students'), gradient: 'from-blue-600 to-indigo-700', recipientLabel: ta('اسم الطالب / الطالبة', 'Student Name (M/F)') },
    { id: 'nafis-families', title: ta('شهادات شكر وتقدير نافس لأسر الطلاب والطالبات', 'NAFS Appreciation Certificates for Families'), gradient: 'from-indigo-600 to-blue-700', recipientLabel: ta('اسم ولي الأمر', 'Parent Name') },
    { id: 'nafis-general', title: ta('شهادات شكر وتقدير نافس', 'NAFS Appreciation Certificates'), gradient: 'from-sky-600 to-blue-700', recipientLabel: ta('اسم المستلم', 'Recipient Name') },
    { id: 'arabic-language-day', title: ta('شهادات شكر وتقدير اليوم العالمي للغة العربية', 'International Arabic Language Day Certificates'), gradient: 'from-emerald-600 to-green-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'national-day-1', title: ta('شهادات شكر وتقدير اليوم الوطني 95 (تصميم 1)', 'National Day 95 Certificates (Design 1)'), gradient: 'from-green-700 to-emerald-800', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'national-day-2', title: ta('شهادات شكر وتقدير اليوم الوطني 95 (تصميم 2)', 'National Day 95 Certificates (Design 2)'), gradient: 'from-green-600 to-teal-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'national-day-3', title: ta('شهادات شكر وتقدير اليوم الوطني 95 (تصميم 3)', 'National Day 95 Certificates (Design 3)'), gradient: 'from-teal-700 to-green-800', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'teacher-day', title: ta('شهادات شكر وتقدير يوم المعلم 2025', 'Teacher Day 2025 Certificates'), gradient: 'from-amber-600 to-yellow-600', recipientLabel: ta('اسم المعلم / المعلمة', 'Teacher Name (M/F)') },
    { id: 'space-week', title: ta('شهادات شكر وتقدير أسبوع الفضاء 2025', 'Space Week 2025 Certificates'), gradient: 'from-slate-700 to-gray-800', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'medical-physics', title: ta('شهادات شكر وتقدير اليوم العالمي للفيزياء الطبية', 'World Medical Physics Day Certificates'), gradient: 'from-blue-700 to-indigo-800', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'tolerance-day', title: ta('شهادات شكر وتقدير اليوم العالمي للتسامح', 'World Tolerance Day Certificates'), gradient: 'from-violet-600 to-purple-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'diabetes-day', title: ta('شهادات شكر وتقدير اليوم العالمي للسكري', 'World Diabetes Day Certificates'), gradient: 'from-blue-600 to-cyan-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
    { id: 'children-day', title: ta('شهادات شكر وتقدير اليوم العالمي للطفل', "World Children's Day Certificates"), gradient: 'from-pink-600 to-rose-700', recipientLabel: ta('اسم الطفل', 'Child Name') },
    { id: 'disability-day', title: ta('شهادات شكر وتقدير اليوم العالمي للأشخاص ذوي الإعاقة', 'International Disability Day Certificates'), gradient: 'from-cyan-600 to-teal-700', recipientLabel: ta('اسم المشارك', 'Participant Name') },
];

function CertForm({ cert, onBack }: { cert: CertDef; onBack: () => void }) {
  const { dir } = useTranslation();
    const [showPreview, setShowPreview] = useState(false);
    const defSchool = ta('يسر إدارة متوسطة أسامة بن زيد', 'Osama Bin Zaid Intermediate School Administration is pleased to present');
    const defPraise = ta('أن تتقدم بالشكر والتقدير', 'to express gratitude and appreciation');
    const defRecipient = ta(`للطالب ${cert.recipientLabel}`, `Student/Teacher Name: ${cert.recipientLabel}`);
    const defBody = ta('وذلك لتميزه وتفوقه الدراسي وحسن أخلاقه وسلوكه، في الصف الأول متوسط الفصل الثاني لعام ١٤٤٦هـ', 'For academic excellence, outstanding performance, and exemplary conduct. First Intermediate, Second Semester 1446H');
    const defSig1 = ta('المرشد الطلابي\nمحمد بن خالد', 'Student Counselor\nMohammed bin Khaled');
    const defSig2 = ta('مدير المدرسة\nفيصل بن سلطان', 'School Principal\nFaisal bin Sultan');
    const [v, setV] = useState({
        school: defSchool,
        praise: defPraise,
        recipient: defRecipient,
        body: defBody,
        sig1: defSig1,
        sig2: defSig2,
    });
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const hasData = Object.values(v).some(x => x);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة لشهادات الشكر والتقدير', 'Back to Appreciation Certificates')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${cert.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Award className="w-5 h-5" /></div>
                                <CardTitle className="text-sm">{cert.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {[
                                { k: 'school', l: ta('اسم المدرسة:', 'School Name:'), ph: ta('يسر إدارة متوسطة أسامة بن زيد', 'Osama Bin Zaid School is pleased to present'), type: 'input' },
                                { k: 'praise', l: ta('جملة التقدير أو الثناء:', 'Praise or Appreciation:'), ph: ta('أن تتقدم بالشكر والتقدير', 'to express gratitude and appreciation'), type: 'input' },
                                { k: 'recipient', l: ta('اسم الطالب/ة:', 'Student Name (M/F):'), ph: ta('للطالب محمد بن فيصل السلطان', 'Student Mohammed bin Faisal Al-Sultan'), type: 'input' },
                                { k: 'body', l: ta('نص الشهادة:', 'Certificate Text:'), ph: ta('وذلك لتميزه وتفوقه الدراسي...', 'for academic excellence and outstanding performance...'), type: 'textarea' },
                                { k: 'sig1', l: ta('وظيفة واسم التوقيع الأول:', 'Signature First (Title & Name):'), ph: ta('المرشد الطلابي\nمحمد بن خالد', 'Student Counselor\nMohammed bin Khaled'), type: 'textarea' },
                                { k: 'sig2', l: ta('وظيفة واسم التوقيع الثاني:', 'Signature Second (Title & Name):'), ph: ta('مدير المدرسة\nفيصل بن سلطان', 'School Principal\nFaisal bin Sultan'), type: 'textarea' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-start">{f.l}</label>
                                    {f.type === 'textarea' ? (
                                        <textarea
                                            rows={3}
                                            placeholder={f.ph}
                                            value={(v as any)[f.k]}
                                            onChange={e => set(f.k, e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-start resize-y bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                        />
                                    ) : (
                                        <Input placeholder={f.ph} value={(v as any)[f.k]} onChange={e => set(f.k, e.target.value)} className="text-start" />
                                    )}
                                </div>
                            ))}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                                <div className="flex gap-2">
                                    <Button onClick={() => setShowPreview(true)} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                        <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button onClick={() => setV({
                                        school: defSchool,
                                        praise: defPraise,
                                        recipient: defRecipient,
                                        body: defBody,
                                        sig1: defSig1,
                                        sig2: defSig2,
                                    })} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                    </Button>
                                </div>
                                <Button onClick={async () => {
                                        const el = document.getElementById('cert-preview');
                                        if (!el) return;
                                        const tid = toast.loading(ta('جاري التحضير...', 'Preparing...'));
                                        try {
                                            const { default: html2canvas } = await import('html2canvas');
                                            const { default: jsPDF } = await import('jspdf');
                                            const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
                                            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                                            const pdfW = pdf.internal.pageSize.getWidth();
                                            const pdfH = pdf.internal.pageSize.getHeight();
                                            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH);
                                            pdf.save('شهادة-شكر-وتقدير.pdf');
                                            toast.dismiss(tid);
                                            toast.success(ta('تم التحميل', 'Loaded'));
                                        } catch {
                                            toast.dismiss(tid);
                                            toast.error(ta('حدث خطأ', 'An error occurred'));
                                        }
                                    }} className={`w-full gap-2 bg-gradient-to-l ${cert.gradient} text-white border-0`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        <div id="cert-preview" className="bg-white shadow-xl relative overflow-hidden" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', border: '2px solid #94a3b8', borderRadius: '6px', padding: '20px', width: '500px', height: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                            {cert.id === 'male-2' ? (<>
                                {/* إطار ذهبي خارجي */}
                                <div className="absolute pointer-events-none" style={{ inset:'0', border:'3px solid #ca8a04', zIndex:0 }} />
                                {/* إطار داخلي رمادي */}
                                <div className="absolute pointer-events-none" style={{ inset:'8px', border:'1px solid #d1d5db', zIndex:0 }} />

                                {/* زخرفة منحنية يسار أعلى */}
                                <svg className="absolute top-0 left-0 pointer-events-none" style={{ width:'200px', height:'200px', zIndex:0, overflow:'hidden' }} viewBox="0 0 200 200">
                                    <path d="M0,0 L200,0 L200,20 Q100,80 0,120 Z" fill="#16a34a"/>
                                    <path d="M0,0 L200,0 L200,30 Q100,95 0,138 Z" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                                    <path d="M0,0 L200,0 L200,38 Q100,105 0,150 Z" fill="none" stroke="#ca8a04" strokeWidth="5"/>
                                    <path d="M0,0 L200,0 L200,44 Q100,112 0,158 Z" fill="#16a34a" opacity="0.4"/>
                                </svg>

                                {/* زخرفة منحنية يمين أسفل */}
                                <svg className="absolute bottom-0 right-0 pointer-events-none" style={{ width:'200px', height:'200px', zIndex:0, overflow:'hidden' }} viewBox="0 0 200 200">
                                    <path d="M200,200 L0,200 L0,180 Q100,120 200,80 Z" fill="#16a34a"/>
                                    <path d="M200,200 L0,200 L0,170 Q100,105 200,62 Z" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                                    <path d="M200,200 L0,200 L0,162 Q100,95 200,50 Z" fill="none" stroke="#ca8a04" strokeWidth="5"/>
                                    <path d="M200,200 L0,200 L0,156 Q100,88 200,42 Z" fill="#16a34a" opacity="0.4"/>
                                </svg>

                                {/* شعار الكتاب - يمين أعلى */}
                                <div className="absolute top-5 right-5 pointer-events-none text-center" style={{ zIndex:2 }}>
                                    <svg viewBox="0 0 100 90" className="w-14 h-12 mx-auto">
                                        {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(
                                            <circle key={i} cx={cx} cy={cy} r="3" fill="#16a34a"/>
                                        ))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#16a34a"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#16a34a"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                    </svg>
                                    <div style={{ fontSize:'8px', fontWeight:'bold', color:'#16a34a', lineHeight:'1.3' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                    <div style={{ fontSize:'6px', color:'#888', lineHeight:'1.3' }}>Ministry of Education</div>
                                </div>

                                {/* المحتوى */}
                                <div className="relative flex flex-col items-center justify-center h-full" style={{ padding:'20px 60px 20px 30px', zIndex:1 }}>
                                    <svg viewBox="0 0 700 155" className="w-full mb-3" style={{ filter:'drop-shadow(0 3px 8px rgba(22,163,74,0.4))' }}>
                                        <defs>
                                            <linearGradient id="calliGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#22c55e"/>
                                                <stop offset="50%" stopColor="#16a34a"/>
                                                <stop offset="100%" stopColor="#166534"/>
                                            </linearGradient>
                                            <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                        </defs>
                                        <text x="353" y="112" textAnchor="middle" fill="#16a34a" fillOpacity="0.12" fontSize="98" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        <g transform="skewX(-8) translate(28,0)">
                                            <text x="350" y="110" textAnchor="middle" fill="none" stroke="url(#calliGrad2)" strokeWidth="5" strokeLinejoin="round" fontSize="93" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" opacity="0.2">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                            <text x="350" y="110" textAnchor="middle" fill="url(#calliGrad2)" fontSize="93" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" filter="url(#glow2)">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        </g>
                                    </svg>
                                    <div className="text-center space-y-1.5 w-full">
                                        <p className="text-gray-700 text-sm">{v.school || 'يسر إدارة متوسطة أسامة بن زيد'}</p>
                                        <p className="text-gray-700 text-sm">{v.praise || 'أن تتقدم بالشكر والتقدير'}</p>
                                        <p className="text-gray-800 font-bold text-base">{v.recipient || 'للطالب محمد بن فيصل السلطان'}</p>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{v.body || 'وذلك لتميزه وتفوقه الدراسي وحسن أخلاقه وسلوكه، في الصف الأول متوسط الفصل الثاني لعام ١٤٤٦هـ'}</p>
                                    </div>
                                    <div className="flex justify-between w-full px-4 mt-4">
                                        <div className="text-center">{v.sig1.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-600':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                        <div className="text-center">{v.sig2.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-600':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                    </div>
                                </div>
                            </>) : cert.id === 'male-3' ? (<>
                                {/* خلفية رمادية فاتحة */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background:'#f8f9fa', zIndex:0 }} />
                                {/* نقش هندسي خفيف */}
                                <svg className="absolute inset-0 pointer-events-none" style={{ width:'100%', height:'100%', zIndex:0, opacity:0.04 }} viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">
                                    <defs>
                                        <pattern id="geoPat" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <rect x="0" y="0" width="40" height="40" fill="none" stroke="#0d9488" strokeWidth="0.5"/>
                                            <circle cx="20" cy="20" r="8" fill="none" stroke="#0d9488" strokeWidth="0.5"/>
                                            <line x1="0" y1="0" x2="40" y2="40" stroke="#0d9488" strokeWidth="0.3"/>
                                            <line x1="40" y1="0" x2="0" y2="40" stroke="#0d9488" strokeWidth="0.3"/>
                                        </pattern>
                                    </defs>
                                    <rect width="500" height="500" fill="url(#geoPat)"/>
                                </svg>

                                {/* إطار متدرج أزرق-أخضر */}
                                <svg className="absolute inset-0 pointer-events-none" style={{ width:'100%', height:'100%', zIndex:3 }} viewBox="0 0 500 500" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#1565c0"/>
                                            <stop offset="50%" stopColor="#0d9488"/>
                                            <stop offset="100%" stopColor="#1565c0"/>
                                        </linearGradient>
                                    </defs>
                                    <rect x="3" y="3" width="494" height="494" fill="none" stroke="url(#frameGrad)" strokeWidth="4"/>
                                    <rect x="10" y="10" width="480" height="480" fill="none" stroke="url(#frameGrad)" strokeWidth="1" opacity="0.5"/>
                                </svg>

                                {/* زخرفة زاوية يسار أعلى */}
                                <svg className="absolute top-0 left-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M3,3 L87,3 L87,12 L12,12 L12,87 L3,87 Z" fill="url(#cg1)" opacity="0.9"/>
                                    <path d="M12,12 Q25,8 35,18 Q25,28 12,24 Z" fill="url(#cg1)" opacity="0.7"/>
                                    <path d="M12,12 Q8,25 18,35 Q28,25 24,12 Z" fill="url(#cg1)" opacity="0.7"/>
                                    <path d="M20,20 Q30,16 38,24 Q30,32 22,28 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M20,20 Q16,30 24,38 Q32,30 28,22 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="12" cy="12" r="3" fill="url(#cg1)"/>
                                    <circle cx="25" cy="12" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="12" cy="25" r="1.5" fill="#2dd4bf"/>
                                    <path d="M38,12 Q44,18 40,26 Q33,22 38,12 Z" fill="#0d9488" opacity="0.35"/>
                                    <path d="M12,38 Q18,44 26,40 Q22,33 12,38 Z" fill="#0d9488" opacity="0.35"/>
                                </svg>
                                {/* زخرفة زاوية يمين أعلى */}
                                <svg className="absolute top-0 right-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="cg2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M87,3 L3,3 L3,12 L78,12 L78,87 L87,87 Z" fill="url(#cg2)" opacity="0.9"/>
                                    <path d="M78,12 Q65,8 55,18 Q65,28 78,24 Z" fill="url(#cg2)" opacity="0.7"/>
                                    <path d="M78,12 Q82,25 72,35 Q62,25 66,12 Z" fill="url(#cg2)" opacity="0.7"/>
                                    <path d="M70,20 Q60,16 52,24 Q60,32 68,28 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M70,20 Q74,30 66,38 Q58,30 62,22 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="78" cy="12" r="3" fill="url(#cg2)"/>
                                    <circle cx="65" cy="12" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="78" cy="25" r="1.5" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يسار أسفل */}
                                <svg className="absolute bottom-0 left-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="cg3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M3,87 L87,87 L87,78 L12,78 L12,3 L3,3 Z" fill="url(#cg3)" opacity="0.9"/>
                                    <path d="M12,78 Q25,82 35,72 Q25,62 12,66 Z" fill="url(#cg3)" opacity="0.7"/>
                                    <path d="M12,78 Q8,65 18,55 Q28,65 24,78 Z" fill="url(#cg3)" opacity="0.7"/>
                                    <path d="M20,70 Q30,74 38,66 Q30,58 22,62 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M20,70 Q16,60 24,52 Q32,60 28,68 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="12" cy="78" r="3" fill="url(#cg3)"/>
                                    <circle cx="25" cy="78" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="12" cy="65" r="1.5" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يمين أسفل */}
                                <svg className="absolute bottom-0 right-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="cg4" x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M87,87 L3,87 L3,78 L78,78 L78,3 L87,3 Z" fill="url(#cg4)" opacity="0.9"/>
                                    <path d="M78,78 Q65,82 55,72 Q65,62 78,66 Z" fill="url(#cg4)" opacity="0.7"/>
                                    <path d="M78,78 Q82,65 72,55 Q62,65 66,78 Z" fill="url(#cg4)" opacity="0.7"/>
                                    <path d="M70,70 Q60,74 52,66 Q60,58 68,62 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M70,70 Q74,60 66,52 Q58,60 62,68 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="78" cy="78" r="3" fill="url(#cg4)"/>
                                    <circle cx="65" cy="78" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="78" cy="65" r="1.5" fill="#2dd4bf"/>
                                </svg>

                                {/* زخرفة أعلى وسط */}
                                <svg className="absolute top-0 pointer-events-none" style={{ left:'50%', transform:'translateX(-50%)', width:'140px', height:'32px', zIndex:4 }} viewBox="0 0 140 32">
                                    <defs><linearGradient id="og1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1565c0"/><stop offset="50%" stopColor="#0d9488"/><stop offset="100%" stopColor="#1565c0"/></linearGradient></defs>
                                    <path d="M5,16 Q35,2 70,8 Q105,2 135,16 Q105,30 70,24 Q35,30 5,16 Z" fill="none" stroke="url(#og1)" strokeWidth="1.5"/>
                                    <path d="M20,16 Q45,6 70,10 Q95,6 120,16 Q95,26 70,22 Q45,26 20,16 Z" fill="none" stroke="url(#og1)" strokeWidth="1" opacity="0.5"/>
                                    <circle cx="70" cy="16" r="4" fill="#0d9488"/>
                                    <circle cx="38" cy="12" r="2" fill="#1565c0"/>
                                    <circle cx="102" cy="12" r="2" fill="#1565c0"/>
                                    <circle cx="20" cy="16" r="1.5" fill="#0d9488" opacity="0.5"/>
                                    <circle cx="120" cy="16" r="1.5" fill="#0d9488" opacity="0.5"/>
                                </svg>
                                {/* زخرفة أسفل وسط */}
                                <svg className="absolute bottom-0 pointer-events-none" style={{ left:'50%', transform:'translateX(-50%)', width:'140px', height:'32px', zIndex:4 }} viewBox="0 0 140 32">
                                    <defs><linearGradient id="og2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1565c0"/><stop offset="50%" stopColor="#0d9488"/><stop offset="100%" stopColor="#1565c0"/></linearGradient></defs>
                                    <path d="M5,16 Q35,2 70,8 Q105,2 135,16 Q105,30 70,24 Q35,30 5,16 Z" fill="none" stroke="url(#og2)" strokeWidth="1.5"/>
                                    <path d="M20,16 Q45,6 70,10 Q95,6 120,16 Q95,26 70,22 Q45,26 20,16 Z" fill="none" stroke="url(#og2)" strokeWidth="1" opacity="0.5"/>
                                    <circle cx="70" cy="16" r="4" fill="#0d9488"/>
                                    <circle cx="38" cy="20" r="2" fill="#1565c0"/>
                                    <circle cx="102" cy="20" r="2" fill="#1565c0"/>
                                </svg>
                                {/* زخرفة جانب يسار */}
                                <svg className="absolute left-0 pointer-events-none" style={{ top:'50%', transform:'translateY(-50%)', width:'32px', height:'120px', zIndex:4 }} viewBox="0 0 32 120">
                                    <defs><linearGradient id="sg1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1565c0"/><stop offset="50%" stopColor="#0d9488"/><stop offset="100%" stopColor="#1565c0"/></linearGradient></defs>
                                    <path d="M16,5 Q2,25 8,60 Q2,95 16,115 Q30,95 24,60 Q30,25 16,5 Z" fill="none" stroke="url(#sg1)" strokeWidth="1.5"/>
                                    <path d="M16,20 Q6,38 10,60 Q6,82 16,100 Q26,82 22,60 Q26,38 16,20 Z" fill="none" stroke="url(#sg1)" strokeWidth="1" opacity="0.5"/>
                                    <circle cx="16" cy="60" r="4" fill="#0d9488"/>
                                    <circle cx="16" cy="30" r="2" fill="#1565c0"/>
                                    <circle cx="16" cy="90" r="2" fill="#1565c0"/>
                                </svg>
                                {/* زخرفة جانب يمين */}
                                <svg className="absolute right-0 pointer-events-none" style={{ top:'50%', transform:'translateY(-50%)', width:'32px', height:'120px', zIndex:4 }} viewBox="0 0 32 120">
                                    <defs><linearGradient id="sg2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1565c0"/><stop offset="50%" stopColor="#0d9488"/><stop offset="100%" stopColor="#1565c0"/></linearGradient></defs>
                                    <path d="M16,5 Q2,25 8,60 Q2,95 16,115 Q30,95 24,60 Q30,25 16,5 Z" fill="none" stroke="url(#sg2)" strokeWidth="1.5"/>
                                    <path d="M16,20 Q6,38 10,60 Q6,82 16,100 Q26,82 22,60 Q26,38 16,20 Z" fill="none" stroke="url(#sg2)" strokeWidth="1" opacity="0.5"/>
                                    <circle cx="16" cy="60" r="4" fill="#0d9488"/>
                                    <circle cx="16" cy="30" r="2" fill="#1565c0"/>
                                    <circle cx="16" cy="90" r="2" fill="#1565c0"/>
                                </svg>

                                {/* شعار الكتاب - يمين أعلى */}
                                <div className="absolute top-8 right-8 pointer-events-none text-center" style={{ zIndex:5 }}>
                                    <svg viewBox="0 0 100 90" className="w-12 h-10 mx-auto">
                                        {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(
                                            <circle key={i} cx={cx} cy={cy} r="3" fill="#0d9488"/>
                                        ))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#0d9488"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#0d9488"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                    </svg>
                                    <div style={{ fontSize:'7px', fontWeight:'bold', color:'#0d9488' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                    <div style={{ fontSize:'5px', color:'#888' }}>Ministry of Education</div>
                                </div>

                                {/* المحتوى */}
                                <div className="relative flex flex-col items-center justify-center h-full" style={{ padding:'16px 55px', zIndex:2 }}>
                                    <svg viewBox="0 0 700 150" className="w-full mb-2" style={{ filter:'drop-shadow(0 2px 6px rgba(13,148,136,0.5))' }}>
                                        <defs>
                                            <linearGradient id="calliGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#0d9488"/>
                                                <stop offset="40%" stopColor="#1565c0"/>
                                                <stop offset="70%" stopColor="#0d9488"/>
                                                <stop offset="100%" stopColor="#1565c0"/>
                                            </linearGradient>
                                            <filter id="glow3"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                        </defs>
                                        <text x="353" y="108" textAnchor="middle" fill="#0d9488" fillOpacity="0.1" fontSize="95" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        <g transform="skewX(-8) translate(28,0)">
                                            <text x="350" y="106" textAnchor="middle" fill="none" stroke="url(#calliGrad3)" strokeWidth="4" fontSize="90" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" opacity="0.2">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                            <text x="350" y="106" textAnchor="middle" fill="url(#calliGrad3)" fontSize="90" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" filter="url(#glow3)">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        </g>
                                    </svg>
                                    <div className="text-center space-y-1.5 w-full">
                                        <p className="text-gray-700 text-sm">{v.school || 'يسر إدارة متوسطة أسامة بن زيد'}</p>
                                        <p className="text-gray-700 text-sm">{v.praise || 'أن تتقدم بالشكر والتقدير'}</p>
                                        <p className="text-gray-800 font-bold text-base">{v.recipient || 'للطالب محمد بن فيصل السلطان'}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{v.body || 'وذلك لتميزه وتفوقه الدراسي وحسن أخلاقه وسلوكه، في الصف الأول متوسط الفصل الثاني لعام ١٤٤٦هـ'}</p>
                                    </div>
                                    <div className="flex justify-between w-full px-6 mt-4">
                                        <div className="text-center">{v.sig1.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-500':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                        <div className="text-center">{v.sig2.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-500':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                    </div>
                                </div>
                            </>) : cert.id === 'male-4' ? (<>
                                {/* خلفية بيضاء */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background:'#ffffff', zIndex:0 }} />

                                {/* خطوط منحنية دائرية على الجانبين */}
                                <svg className="absolute inset-0 pointer-events-none" style={{ width:'100%', height:'100%', zIndex:0, opacity:0.08 }} viewBox="0 0 500 500">
                                    {/* جانب يسار */}
                                    {[0,15,30,45,60,75,90].map((r,i)=>(
                                        <circle key={`l${i}`} cx="0" cy="250" r={120+r*3} fill="none" stroke="#0d9488" strokeWidth="1"/>
                                    ))}
                                    {/* جانب يمين */}
                                    {[0,15,30,45,60,75,90].map((r,i)=>(
                                        <circle key={`r${i}`} cx="500" cy="250" r={120+r*3} fill="none" stroke="#0d9488" strokeWidth="1"/>
                                    ))}
                                </svg>

                                {/* إطار teal رفيع */}
                                <div className="absolute pointer-events-none" style={{ inset:'0', border:'2px solid #0d9488', zIndex:3 }} />
                                <div className="absolute pointer-events-none" style={{ inset:'6px', border:'1px solid #2dd4bf', zIndex:3 }} />

                                {/* زخرفة زاوية يسار أعلى */}
                                <svg className="absolute top-0 left-0 pointer-events-none" style={{ width:'75px', height:'75px', zIndex:4 }} viewBox="0 0 75 75">
                                    <rect x="2" y="2" width="30" height="30" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <rect x="6" y="6" width="22" height="22" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="17" cy="17" r="5" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="17" cy="17" r="2" fill="#0d9488"/>
                                    <path d="M32,17 Q45,8 55,17 Q45,26 32,17 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <path d="M17,32 Q8,45 17,55 Q26,45 17,32 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <circle cx="55" cy="17" r="2" fill="#2dd4bf"/>
                                    <circle cx="17" cy="55" r="2" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يمين أعلى */}
                                <svg className="absolute top-0 right-0 pointer-events-none" style={{ width:'75px', height:'75px', zIndex:4 }} viewBox="0 0 75 75">
                                    <rect x="43" y="2" width="30" height="30" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <rect x="47" y="6" width="22" height="22" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="58" cy="17" r="5" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="58" cy="17" r="2" fill="#0d9488"/>
                                    <path d="M43,17 Q30,8 20,17 Q30,26 43,17 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <path d="M58,32 Q67,45 58,55 Q49,45 58,32 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <circle cx="20" cy="17" r="2" fill="#2dd4bf"/>
                                    <circle cx="58" cy="55" r="2" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يسار أسفل */}
                                <svg className="absolute bottom-0 left-0 pointer-events-none" style={{ width:'75px', height:'75px', zIndex:4 }} viewBox="0 0 75 75">
                                    <rect x="2" y="43" width="30" height="30" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <rect x="6" y="47" width="22" height="22" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="17" cy="58" r="5" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="17" cy="58" r="2" fill="#0d9488"/>
                                    <path d="M32,58 Q45,67 55,58 Q45,49 32,58 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <path d="M17,43 Q8,30 17,20 Q26,30 17,43 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <circle cx="55" cy="58" r="2" fill="#2dd4bf"/>
                                    <circle cx="17" cy="20" r="2" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يمين أسفل */}
                                <svg className="absolute bottom-0 right-0 pointer-events-none" style={{ width:'75px', height:'75px', zIndex:4 }} viewBox="0 0 75 75">
                                    <rect x="43" y="43" width="30" height="30" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <rect x="47" y="47" width="22" height="22" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="58" cy="58" r="5" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="58" cy="58" r="2" fill="#0d9488"/>
                                    <path d="M43,58 Q30,67 20,58 Q30,49 43,58 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <path d="M58,43 Q67,30 58,20 Q49,30 58,43 Z" fill="none" stroke="#0d9488" strokeWidth="1.2"/>
                                    <circle cx="20" cy="58" r="2" fill="#2dd4bf"/>
                                    <circle cx="58" cy="20" r="2" fill="#2dd4bf"/>
                                </svg>

                                {/* زخرفة أعلى وسط — ثلاث دوائر */}
                                <svg className="absolute top-0 pointer-events-none" style={{ left:'50%', transform:'translateX(-50%)', width:'100px', height:'28px', zIndex:4 }} viewBox="0 0 100 28">
                                    <circle cx="20" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="20" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="50" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="50" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="80" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="80" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="20" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="50" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="80" cy="14" r="2" fill="#0d9488"/>
                                </svg>
                                {/* زخرفة أسفل وسط — ثلاث دوائر */}
                                <svg className="absolute bottom-0 pointer-events-none" style={{ left:'50%', transform:'translateX(-50%)', width:'100px', height:'28px', zIndex:4 }} viewBox="0 0 100 28">
                                    <circle cx="20" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="20" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="50" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="50" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="80" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="80" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="20" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="50" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="80" cy="14" r="2" fill="#0d9488"/>
                                </svg>

                                {/* شعار الكتاب - يمين أعلى */}
                                <div className="absolute top-8 right-8 pointer-events-none text-center" style={{ zIndex:5 }}>
                                    <svg viewBox="0 0 100 90" className="w-12 h-10 mx-auto">
                                        {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="3" fill="#0d9488"/>))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#0d9488"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#0d9488"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                    </svg>
                                    <div style={{ fontSize:'7px', fontWeight:'bold', color:'#0d9488' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                    <div style={{ fontSize:'5px', color:'#888' }}>Ministry of Education</div>
                                </div>

                                {/* المحتوى */}
                                <div className="relative flex flex-col items-center justify-center h-full" style={{ padding:'16px 55px', zIndex:2 }}>
                                    <svg viewBox="0 0 700 150" className="w-full mb-2" style={{ filter:'drop-shadow(0 2px 6px rgba(13,148,136,0.5))' }}>
                                        <defs>
                                            <linearGradient id="calliGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#0d9488"/>
                                                <stop offset="40%" stopColor="#1565c0"/>
                                                <stop offset="70%" stopColor="#0d9488"/>
                                                <stop offset="100%" stopColor="#1565c0"/>
                                            </linearGradient>
                                            <filter id="glow4"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                        </defs>
                                        <text x="353" y="108" textAnchor="middle" fill="#0d9488" fillOpacity="0.1" fontSize="95" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        <g transform="skewX(-8) translate(28,0)">
                                            <text x="350" y="106" textAnchor="middle" fill="none" stroke="url(#calliGrad4)" strokeWidth="4" fontSize="90" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" opacity="0.2">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                            <text x="350" y="106" textAnchor="middle" fill="url(#calliGrad4)" fontSize="90" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" filter="url(#glow4)">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        </g>
                                    </svg>
                                    <div className="text-center space-y-1.5 w-full">
                                        <p className="text-gray-700 text-sm">{v.school || 'يسر إدارة متوسطة أسامة بن زيد'}</p>
                                        <p className="text-gray-700 text-sm">{v.praise || 'أن تتقدم بالشكر والتقدير'}</p>
                                        <p className="text-gray-800 font-bold text-base">{v.recipient || 'للطالب محمد بن فيصل السلطان'}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{v.body || 'وذلك لتميزه وتفوقه الدراسي وحسن أخلاقه وسلوكه، في الصف الأول متوسط الفصل الثاني لعام ١٤٤٦هـ'}</p>
                                    </div>
                                    <div className="flex justify-between w-full px-6 mt-4">
                                        <div className="text-center">{v.sig1.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-500':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                        <div className="text-center">{v.sig2.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-500':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                    </div>
                                </div>
                            </>) : cert.id === 'male-4' ? (<>
                                {/* إطار متدرج أزرق-أخضر */}
                                <svg className="absolute inset-0 pointer-events-none" style={{ width:'100%', height:'100%', zIndex:3 }} viewBox="0 0 500 500" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="frameGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#1565c0"/>
                                            <stop offset="50%" stopColor="#0d9488"/>
                                            <stop offset="100%" stopColor="#1565c0"/>
                                        </linearGradient>
                                    </defs>
                                    <rect x="3" y="3" width="494" height="494" fill="none" stroke="url(#frameGrad4)" strokeWidth="4"/>
                                    <rect x="10" y="10" width="480" height="480" fill="none" stroke="url(#frameGrad4)" strokeWidth="1" opacity="0.5"/>
                                </svg>
                                {/* زخرفة زاوية يسار أعلى */}
                                <svg className="absolute top-0 left-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="c4g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M3,3 L87,3 L87,12 L12,12 L12,87 L3,87 Z" fill="url(#c4g1)" opacity="0.9"/>
                                    <path d="M12,12 Q25,8 35,18 Q25,28 12,24 Z" fill="url(#c4g1)" opacity="0.7"/>
                                    <path d="M12,12 Q8,25 18,35 Q28,25 24,12 Z" fill="url(#c4g1)" opacity="0.7"/>
                                    <path d="M20,20 Q30,16 38,24 Q30,32 22,28 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M20,20 Q16,30 24,38 Q32,30 28,22 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="12" cy="12" r="3" fill="url(#c4g1)"/>
                                    <circle cx="25" cy="12" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="12" cy="25" r="1.5" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يمين أعلى */}
                                <svg className="absolute top-0 right-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="c4g2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M87,3 L3,3 L3,12 L78,12 L78,87 L87,87 Z" fill="url(#c4g2)" opacity="0.9"/>
                                    <path d="M78,12 Q65,8 55,18 Q65,28 78,24 Z" fill="url(#c4g2)" opacity="0.7"/>
                                    <path d="M78,12 Q82,25 72,35 Q62,25 66,12 Z" fill="url(#c4g2)" opacity="0.7"/>
                                    <path d="M70,20 Q60,16 52,24 Q60,32 68,28 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M70,20 Q74,30 66,38 Q58,30 62,22 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="78" cy="12" r="3" fill="url(#c4g2)"/>
                                    <circle cx="65" cy="12" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="78" cy="25" r="1.5" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يسار أسفل */}
                                <svg className="absolute bottom-0 left-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="c4g3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M3,87 L87,87 L87,78 L12,78 L12,3 L3,3 Z" fill="url(#c4g3)" opacity="0.9"/>
                                    <path d="M12,78 Q25,82 35,72 Q25,62 12,66 Z" fill="url(#c4g3)" opacity="0.7"/>
                                    <path d="M12,78 Q8,65 18,55 Q28,65 24,78 Z" fill="url(#c4g3)" opacity="0.7"/>
                                    <path d="M20,70 Q30,74 38,66 Q30,58 22,62 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M20,70 Q16,60 24,52 Q32,60 28,68 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="12" cy="78" r="3" fill="url(#c4g3)"/>
                                    <circle cx="25" cy="78" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="12" cy="65" r="1.5" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة زاوية يمين أسفل */}
                                <svg className="absolute bottom-0 right-0 pointer-events-none" style={{ width:'90px', height:'90px', zIndex:4 }} viewBox="0 0 90 90">
                                    <defs><linearGradient id="c4g4" x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
                                    <path d="M87,87 L3,87 L3,78 L78,78 L78,3 L87,3 Z" fill="url(#c4g4)" opacity="0.9"/>
                                    <path d="M78,78 Q65,82 55,72 Q65,62 78,66 Z" fill="url(#c4g4)" opacity="0.7"/>
                                    <path d="M78,78 Q82,65 72,55 Q62,65 66,78 Z" fill="url(#c4g4)" opacity="0.7"/>
                                    <path d="M70,70 Q60,74 52,66 Q60,58 68,62 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <path d="M70,70 Q74,60 66,52 Q58,60 62,68 Z" fill="#2dd4bf" opacity="0.6"/>
                                    <circle cx="78" cy="78" r="3" fill="url(#c4g4)"/>
                                    <circle cx="65" cy="78" r="1.5" fill="#2dd4bf"/>
                                    <circle cx="78" cy="65" r="1.5" fill="#2dd4bf"/>
                                </svg>
                                {/* زخرفة أعلى وسط */}
                                <svg className="absolute top-0 pointer-events-none" style={{ left:'50%', transform:'translateX(-50%)', width:'100px', height:'28px', zIndex:4 }} viewBox="0 0 100 28">
                                    <circle cx="20" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="20" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="50" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="50" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="80" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="80" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="20" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="50" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="80" cy="14" r="2" fill="#0d9488"/>
                                </svg>
                                {/* زخرفة أسفل وسط */}
                                <svg className="absolute bottom-0 pointer-events-none" style={{ left:'50%', transform:'translateX(-50%)', width:'100px', height:'28px', zIndex:4 }} viewBox="0 0 100 28">
                                    <circle cx="20" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="20" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="50" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="50" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="80" cy="14" r="10" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
                                    <circle cx="80" cy="14" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1"/>
                                    <circle cx="20" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="50" cy="14" r="2" fill="#0d9488"/>
                                    <circle cx="80" cy="14" r="2" fill="#0d9488"/>
                                </svg>
                                {/* شعار الكتاب - يمين أعلى */}
                                <div className="absolute top-8 right-8 pointer-events-none text-center" style={{ zIndex:5 }}>
                                    <svg viewBox="0 0 100 90" className="w-12 h-10 mx-auto">
                                        {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="3" fill="#0d9488"/>))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#0d9488"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#0d9488"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                    </svg>
                                    <div style={{ fontSize:'7px', fontWeight:'bold', color:'#0d9488' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                    <div style={{ fontSize:'5px', color:'#888' }}>Ministry of Education</div>
                                </div>
                                {/* المحتوى */}
                                <div className="relative flex flex-col items-center justify-center h-full" style={{ padding:'16px 55px', zIndex:2 }}>
                                    <svg viewBox="0 0 700 150" className="w-full mb-2" style={{ filter:'drop-shadow(0 2px 6px rgba(13,148,136,0.5))' }}>
                                        <defs>
                                            <linearGradient id="calliGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#0d9488"/>
                                                <stop offset="40%" stopColor="#1565c0"/>
                                                <stop offset="70%" stopColor="#0d9488"/>
                                                <stop offset="100%" stopColor="#1565c0"/>
                                            </linearGradient>
                                            <filter id="glow4"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                        </defs>
                                        <text x="353" y="108" textAnchor="middle" fill="#0d9488" fillOpacity="0.1" fontSize="95" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        <g transform="skewX(-8) translate(28,0)">
                                            <text x="350" y="106" textAnchor="middle" fill="none" stroke="url(#calliGrad4)" strokeWidth="4" fontSize="90" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" opacity="0.2">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                            <text x="350" y="106" textAnchor="middle" fill="url(#calliGrad4)" fontSize="90" fontFamily='"Noto Naskh Arabic","Scheherazade New","Amiri",serif' fontWeight="900" filter="url(#glow4)">{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</text>
                                        </g>
                                    </svg>
                                    <div className="text-center space-y-1.5 w-full">
                                        <p className="text-gray-700 text-sm">{v.school || 'يسر إدارة متوسطة أسامة بن زيد'}</p>
                                        <p className="text-gray-700 text-sm">{v.praise || 'أن تتقدم بالشكر والتقدير'}</p>
                                        <p className="text-gray-800 font-bold text-base">{v.recipient || 'للطالب محمد بن فيصل السلطان'}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{v.body || 'وذلك لتميزه وتفوقه الدراسي وحسن أخلاقه وسلوكه، في الصف الأول متوسط الفصل الثاني لعام ١٤٤٦هـ'}</p>
                                    </div>
                                    <div className="flex justify-between w-full px-6 mt-4">
                                        <div className="text-center">{v.sig1.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-500':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                        <div className="text-center">{v.sig2.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-500':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                    </div>
                                </div>
                            </>) : (<>
                            {/* إطار داخلي teal+أزرق */}
                            <div className="absolute pointer-events-none" style={{ inset: '10px', border: '2px solid #2dd4bf', borderRadius: '4px' }} />
                            <div className="absolute pointer-events-none" style={{ inset: '13px', border: '1px solid #3b82f6', borderRadius: '3px' }} />
                            <div className="absolute bottom-0 left-0 pointer-events-none opacity-10" style={{ width:'130px', height:'130px', background:'linear-gradient(135deg,#2dd4bf,#3b82f6)', borderRadius:'0 100% 0 6px' }} />
                            <div className="relative px-8 py-6">
                                <div className="absolute -top-1 right-4">
                                    <svg viewBox="0 0 100 90" className="w-14 h-12">
                                        {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="3" fill="#1a9b7a"/>))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#1a9b7a"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#1a9b7a"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <text x="50" y="82" textAnchor="middle" fontSize="7" fill="#1a9b7a" fontWeight="bold">{ta('وزارة التعـليم', 'Ministry of Education')}</text>
                                        <text x="50" y="90" textAnchor="middle" fontSize="5" fill="#666">Ministry of Education</text>
                                    </svg>
                                </div>
                                {/* عنوان شهادة شكر وتقدير */}
                                <div className="text-center mt-10 mb-2">
                                    <span style={{
                                        display: 'block',
                                        fontSize: '32px',
                                        fontWeight: '900',
                                        fontFamily: 'Cairo, sans-serif',
                                        color: '#1a9b7a',
                                    }}>{ta('شهادة شكر وتقدير', 'Appreciation Certificate')}</span>
                                </div>
                                <div className="text-center space-y-2.5 mb-8">
                                    <p className="text-gray-700 text-sm">{v.school || 'يسر إدارة متوسطة أسامة بن زيد'}</p>
                                    <p className="text-gray-700 text-sm">{v.praise || 'أن تتقدم بالشكر والتقدير'}</p>
                                    <p className="text-gray-800 font-bold text-base">{v.recipient || 'للطالب محمد بن فيصل السلطان'}</p>
                                    <p className="text-gray-700 text-sm leading-relaxed mx-auto whitespace-pre-line" style={{ maxWidth:'440px' }}>{v.body || 'وذلك لتميزه وتفوقه الدراسي وحسن أخلاقه وسلوكه، في الصف الأول متوسط الفصل الثاني لعام ١٤٤٦هـ'}</p>
                                </div>
                                <div className="flex justify-between items-start px-6">
                                    <div className="text-center">{v.sig1.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-600':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                    <div className="text-center">{v.sig2.split('\n').map((l,i)=>(<p key={i} className={`text-sm ${i===0?'text-gray-600':'font-bold text-gray-800'}`}>{l}</p>))}</div>
                                </div>
                            </div>
                            </>)}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`@media print { nav, footer, button { display: none !important; } }`}</style>
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowPreview(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <p className="font-bold text-gray-700">{ta('معاينة الشهادة', 'Certificate Preview')}</p>
                            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                        </div>
                        <div className="p-4 flex justify-center">
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', width: '500px', height: '500px', pointerEvents: 'none' }}>
                                <div dangerouslySetInnerHTML={{ __html: typeof document !== 'undefined' ? (document.getElementById('cert-preview')?.outerHTML || '') : '' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AppreciationCertificatesPage() {
    const { dir } = useTranslation();
    const [selected, setSelected] = useState<CertDef | null>(null);
    if (selected) return <CertForm cert={selected} onBack={() => setSelected(null)} />;
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-yellow-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-yellow-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Award className="w-4 h-4 text-yellow-400" /> {ta('شهادات شكر وتقدير', 'Appreciation Certificates')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('شهادات شكر وتقدير', 'Appreciation Certificates')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('إنشاء وتخصيص شهادات الشكر والتقدير بطريقة سهلة واحترافية', 'Create and customize appreciation certificates easily and professionally')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Award className="w-4 h-4" />{CERTS.length} {ta('تصميم', 'Designs')}</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {CERTS.map(cert => (
                            <Card key={cert.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(cert)}>
                                <div className={`h-2 bg-gradient-to-l ${cert.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cert.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Award className="w-6 h-6" />
                                        </div>
                                        {cert.badge && <Badge className="bg-amber-500 text-white text-xs">{cert.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{cert.title}</CardTitle>
                                    {cert.description && <CardDescription className="text-xs mt-1 line-clamp-2">{cert.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className={`w-full bg-gradient-to-l ${cert.gradient} text-white border-0 hover:opacity-90 gap-2 text-xs`}>
                                        <Eye className="w-3.5 h-3.5" /> {ta('ابدأ التصميم', 'Start Design')}
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

