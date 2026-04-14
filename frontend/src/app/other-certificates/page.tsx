'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Eye, Download, RotateCcw, ChevronRight, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface CertDef {
    id: string;
    title: string;
    gradient: string;
    icon: any;
    fields: { key: string; label: string; placeholder: string }[];
}

const CERTS: CertDef[] = [
    {
        id: 'appreciation-female', title: ta('شهادة شكر وتقدير للطالبات والمعلمات', 'Appreciation Certificate for Female Students & Teachers'),
        gradient: 'from-pink-500 to-rose-600', icon: Award,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالبة / المعلمة', 'Student/Teacher Name (F)'), placeholder: ta('اسم المستلمة', 'Recipient Name (F)') },
            { key: 'reason', label: ta('سبب التقدير', 'Reason for Appreciation'), placeholder: ta('سبب منح الشهادة', 'Reason for Certificate') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'issuer', label: ta('اسم المانحة', 'Issuer Name (F)'), placeholder: ta('اسم مديرة المدرسة', 'School Principal Name (F)') },
        ],
    },
    {
        id: 'appreciation-general', title: ta('شهادة شكر وتقدير للطلاب والطالبات', 'Appreciation Certificate for Students (M/F)'),
        gradient: 'from-amber-500 to-orange-600', icon: Award,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم المستلم', 'Recipient Name') },
            { key: 'reason', label: ta('سبب التقدير', 'Reason for Appreciation'), placeholder: ta('سبب منح الشهادة', 'Reason for Certificate') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'issuer', label: ta('اسم المانح', 'Issuer Name'), placeholder: ta('اسم مدير المدرسة', 'School Principal Name') },
        ],
    },
    {
        id: 'appreciation-subject', title: ta('شهادة شكر وتقدير للطلاب والطالبات لمادة محددة', 'Appreciation Certificate for Students for a Specific Subject'),
        gradient: 'from-yellow-500 to-amber-600', icon: Award,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم المستلم', 'Recipient Name') },
            { key: 'subject', label: ta('المادة الدراسية', 'Subject'), placeholder: ta('اسم المادة', 'Subject Name') },
            { key: 'reason', label: ta('سبب التقدير', 'Reason for Appreciation'), placeholder: ta('سبب منح الشهادة', 'Reason for Certificate') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), placeholder: ta('اسم المعلم', 'Teacher Name') },
        ],
    },
    {
        id: 'graduation-1', title: ta('شهادة تخرج للطلاب والطالبات (تصميم 1)', 'Graduation Certificate for Students M/F (Design 1)'),
        gradient: 'from-blue-600 to-indigo-700', icon: GraduationCap,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم الخريج', 'Graduate Name') },
            { key: 'grade', label: ta('المرحلة الدراسية', 'School Stage'), placeholder: ta('المرحلة الدراسية', 'School Stage') },
            { key: 'year', label: ta('العام الدراسي', 'Academic Year'), placeholder: ta('العام الدراسي', 'Academic Year') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'principal', label: ta('مدير المدرسة', 'School Principal'), placeholder: ta('اسم مدير المدرسة', 'School Principal Name') },
        ],
    },
    {
        id: 'graduation-2', title: ta('شهادة تخرج للطلاب والطالبات (تصميم 2)', 'Graduation Certificate for Students M/F (Design 2)'),
        gradient: 'from-indigo-600 to-violet-700', icon: GraduationCap,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم الخريج', 'Graduate Name') },
            { key: 'grade', label: ta('المرحلة الدراسية', 'School Stage'), placeholder: ta('المرحلة الدراسية', 'School Stage') },
            { key: 'year', label: ta('العام الدراسي', 'Academic Year'), placeholder: ta('العام الدراسي', 'Academic Year') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'principal', label: ta('مدير المدرسة', 'School Principal'), placeholder: ta('اسم مدير المدرسة', 'School Principal Name') },
        ],
    },
    {
        id: 'success-1', title: ta('شهادة نجاح للطلاب والطالبات (تصميم 1)', 'Success Certificate for Students M/F (Design 1)'),
        gradient: 'from-emerald-600 to-green-700', icon: Award,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم الطالب', 'Student Name') },
            { key: 'grade', label: ta('الصف', 'Grade'), placeholder: ta('الصف الدراسي', 'Grade Level') },
            { key: 'year', label: ta('العام الدراسي', 'Academic Year'), placeholder: ta('العام الدراسي', 'Academic Year') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
        ],
    },
    {
        id: 'success-primary', title: ta('شهادة نجاح لطلاب وطالبات الابتدائي', 'Success Certificate for Primary Stage Students'),
        gradient: 'from-teal-600 to-emerald-700', icon: Award,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم الطالب', 'Student Name') },
            { key: 'grade', label: ta('الصف', 'Grade'), placeholder: ta('الصف الابتدائي', 'Primary Grade') },
            { key: 'year', label: ta('العام الدراسي', 'Academic Year'), placeholder: ta('العام الدراسي', 'Academic Year') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
        ],
    },
    {
        id: 'graduation-primary', title: ta('شهادة تخرج لطلاب وطالبات الابتدائي', 'Graduation Certificate for Primary Stage Students'),
        gradient: 'from-cyan-600 to-teal-700', icon: GraduationCap,
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), placeholder: ta('اسم المدرسة', 'School Name') },
            { key: 'recipient', label: ta('اسم الطالب / الطالبة', 'Student Name (M/F)'), placeholder: ta('اسم الخريج', 'Graduate Name') },
            { key: 'year', label: ta('العام الدراسي', 'Academic Year'), placeholder: ta('العام الدراسي', 'Academic Year') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'principal', label: ta('مدير المدرسة', 'School Principal'), placeholder: ta('اسم مدير المدرسة', 'School Principal Name') },
        ],
    },
    {
        id: 'course-male', title: ta('شهادة حضور دورة للمعلمين', 'Course Attendance Certificate for Male Teachers'),
        gradient: 'from-violet-600 to-purple-700', icon: BookOpen,
        fields: [
            { key: 'recipient', label: ta('اسم المعلم', 'Teacher Name'), placeholder: ta('اسم المعلم', 'Teacher Name') },
            { key: 'course', label: ta('اسم الدورة', 'Course Name'), placeholder: ta('اسم الدورة التدريبية', 'Training Course Name') },
            { key: 'duration', label: ta('مدة الدورة', 'Course Duration'), placeholder: ta('مدة الدورة بالساعات', 'Course Duration (Hours)') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'organizer', label: ta('الجهة المنظمة', 'Organizing Entity'), placeholder: ta('اسم الجهة المنظمة', 'Organizing Entity Name') },
            { key: 'trainer', label: ta('اسم المدرب', 'Trainer Name'), placeholder: ta('اسم المدرب', 'Trainer Name') },
        ],
    },
    {
        id: 'course-female', title: ta('شهادة حضور دورة للمعلمات', 'Course Attendance Certificate for Female Teachers'),
        gradient: 'from-fuchsia-600 to-violet-700', icon: BookOpen,
        fields: [
            { key: 'recipient', label: ta('اسم المعلمة', 'Teacher Name (F)'), placeholder: ta('اسم المعلمة', 'Teacher Name (F)') },
            { key: 'course', label: ta('اسم الدورة', 'Course Name'), placeholder: ta('اسم الدورة التدريبية', 'Training Course Name') },
            { key: 'duration', label: ta('مدة الدورة', 'Course Duration'), placeholder: ta('مدة الدورة بالساعات', 'Course Duration (Hours)') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'organizer', label: ta('الجهة المنظمة', 'Organizing Entity'), placeholder: ta('اسم الجهة المنظمة', 'Organizing Entity Name') },
            { key: 'trainer', label: ta('اسم المدربة', 'Trainer Name (F)'), placeholder: ta('اسم المدربة', 'Trainer Name (F)') },
        ],
    },
    {
        id: 'training-cert', title: ta('شهادة تنفيذ تدريب أو دورة', 'Training or Course Implementation Certificate'),
        gradient: 'from-rose-600 to-pink-700', icon: BookOpen,
        fields: [
            { key: 'recipient', label: ta('اسم المنفذ', 'Implementer Name'), placeholder: ta('اسم المعلم / المدرب', 'Teacher / Trainer Name') },
            { key: 'course', label: ta('اسم التدريب / الدورة', 'Training / Course Name'), placeholder: ta('اسم التدريب أو الدورة', 'Training or Course Name') },
            { key: 'duration', label: ta('مدة التدريب', 'Training Duration'), placeholder: ta('مدة التدريب', 'Training Duration') },
            { key: 'date', label: ta('التاريخ', 'History'), placeholder: ta('التاريخ', 'History') },
            { key: 'school', label: ta('اسم المدرسة / الجهة', 'School / Organization Name'), placeholder: ta('اسم المدرسة أو الجهة', 'School or Organization Name') },
            { key: 'issuer', label: ta('اسم المانح', 'Issuer Name'), placeholder: ta('اسم مدير المدرسة', 'School Principal Name') },
        ],
    },
];

function CertForm({ cert, onBack }: { cert: CertDef; onBack: () => void }) {
  const { dir } = useTranslation();
    const [v, setV] = useState<Record<string, string>>({});
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const hasData = Object.values(v).some(x => x);
    const Icon = cert.icon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للشهادات المتنوعة', 'Back to Various Certificates')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${cert.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                                <CardTitle className="text-sm">{cert.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {cert.fields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                                    <Input placeholder={f.placeholder} value={v[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`flex-1 gap-2 bg-gradient-to-l ${cert.gradient} text-white border-0`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                                <Button onClick={() => setV({})} variant="ghost" size="icon"><RotateCcw className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {hasData ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${cert.gradient} p-6 text-white text-center`}>
                                    <p className="text-xs opacity-80 mb-2">{ta('المملكة العربية السعودية — وزارة التعليم', 'Kingdom of Saudi Arabia — Ministry of Education')}</p>
                                    <Icon className="w-12 h-12 mx-auto mb-3 opacity-90" />
                                    <h2 className="text-xl font-black">{cert.title}</h2>
                                    {v.school && <p className="text-sm opacity-90 mt-1">{v.school}</p>}
                                </div>
                                <div className="p-6 text-center space-y-3">
                                    {v.recipient && (
                                        <>
                                            <p className="text-sm text-gray-500">{ta('تُقدَّم هذه الشهادة إلى', 'This certificate is presented to')}</p>
                                            <p className="text-2xl font-black text-gray-800">{v.recipient}</p>
                                        </>
                                    )}
                                    {cert.fields.filter(f => !['school','recipient'].includes(f.key)).map(f =>
                                        v[f.key] ? (
                                            <div key={f.key} className="flex gap-2 text-sm border-b border-gray-100 pb-1.5 text-start">
                                                <span className="font-bold text-gray-600 min-w-[100px]">{f.label}:</span>
                                                <span className="text-gray-800">{v[f.key]}</span>
                                            </div>
                                        ) : null
                                    )}
                                    {v.issuer && (
                                        <div className="border-t border-gray-100 pt-4 mt-4">
                                            <div className="border-b border-gray-400 w-24 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-gray-700">{v.issuer}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

export default function OtherCertificatesPage() {
  const { dir } = useTranslation();
    const [selected, setSelected] = useState<CertDef | null>(null);
    if (selected) return <CertForm cert={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-orange-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-orange-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <GraduationCap className="w-4 h-4 text-orange-400" /> {ta('شهادات متنوعة', 'Various Certificates')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('شهادات متنوعة', 'Various Certificates')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('شهادات تخرج، شهادات حضور دورة، شهادات متنوعة', 'Graduation certificates, course attendance certificates, various certificates')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Award className="w-4 h-4" />{CERTS.length} شهادة</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {CERTS.map(cert => {
                            const Icon = cert.icon;
                            return (
                                <Card key={cert.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(cert)}>
                                    <div className={`h-2 bg-gradient-to-l ${cert.gradient}`} />
                                    <CardHeader className="pb-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{cert.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <Button className={`w-full bg-gradient-to-l ${cert.gradient} text-white border-0 hover:opacity-90 gap-2 text-xs`}>
                                            <Eye className="w-3.5 h-3.5" /> {ta('ابدأ التصميم', 'Start Design')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
