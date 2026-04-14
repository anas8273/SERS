'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    GraduationCap, Eye, Download, Layers, FileText,
} from 'lucide-react';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface Section {
    id: string;
    title: string;
    description: string;
    gradient: string;
    badge?: string;
    route: string;
    formsCount: number;
}

const SECTIONS: Section[] = [
    {
        id: 'job-duties',
        title: ta('أداء الواجبات الوظيفية', 'Job Duties Performance'),
        description: ta('تقارير ونماذج جاهزة لتوثيق أداء الواجبات الوظيفية للمعلمين، الإذاعة المدرسية، حصص الانتظار، والأنشطة اللاصفية', 'Ready reports and forms for teacher job duty documentation'),
        gradient: 'from-emerald-600 to-green-700',
        badge: 'الأكثر استخداماً',
        route: '/job-duties-forms',
        formsCount: 3,
    },
    {
        id: 'professional-community',
        title: ta('التفاعل مع المجتمع المهني', 'Professional Community Interaction'),
        description: ta('نماذج تقييم مشاركة المعلم وتفاعله مع المجتمع المهني والزملاء والتطوير المهني', 'Forms for assessing teacher participation in professional community and CPD'),
        gradient: 'from-teal-600 to-emerald-700',
        route: '/professional-community',
        formsCount: 5,
    },
    {
        id: 'parents-interaction',
        title: ta('التفاعل مع أولياء الأمور', 'Parent Interaction'),
        description: ta('نماذج تقييم مستوى تواصل المعلم مع أولياء الأمور ومتابعة أبنائهم', 'Forms for assessing teacher communication with parents'),
        gradient: 'from-green-600 to-teal-700',
        route: '/parents-interaction',
        formsCount: 2,
    },
    {
        id: 'improve-results',
        title: ta('تحسين نتائج المتعلمين', 'Improve Learner Results'),
        description: ta('نماذج تقييم جهود المعلم في تحسين مستوى تحصيل الطلاب ونتائجهم', 'Forms for assessing teacher efforts to improve student achievement'),
        gradient: 'from-emerald-700 to-green-800',
        route: '/improve-results',
        formsCount: 1,
    },
    {
        id: 'analyze-results',
        title: ta('تحليل نتائج المتعلمين وتشخيصها', 'Analyze and Diagnose Learner Results'),
        description: ta('نماذج تقييم قدرة المعلم على تحليل نتائج الطلاب وتشخيص نقاط الضعف والقوة', 'Forms for assessing teacher ability to analyze and diagnose student results'),
        gradient: 'from-cyan-700 to-teal-800',
        route: '/analyze-results',
        formsCount: 4,
    },
    {
        id: 'school-environment',
        title: ta('تهيئة البيئة المدرسية للبرامج والأنشطة', 'Preparing school environment for programs and activities'),
        description: ta('نماذج تقييم مساهمة المعلم في تهيئة البيئة المدرسية وتنظيم البرامج والأنشطة', 'Forms for assessing teacher contribution to school environment'),
        gradient: 'from-green-700 to-emerald-800',
        route: '/school-environment',
        formsCount: 1,
    },
];

export default function TeacherEvaluationFormsPage() {
  const { dir } = useTranslation();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-emerald-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-emerald-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-green-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <GraduationCap className="w-4 h-4 text-emerald-400" /> {ta('عناصر تقييم أداء المعلمين', 'Teacher Performance Evaluation Elements')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('عناصر تقييم أداء المعلمين', 'Teacher Performance Evaluation Elements')}</h1>
                        <p className="text-lg text-white/70 mb-6">
                            {ta('نماذج مفرغة وجاهزة لإضافة محتواك لجميع عناصر تقييم الأداء الوظيفي للمعلمين', 'Blank forms for all teacher performance evaluation elements')}
                        </p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{SECTIONS.length} أقسام</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF مجاني', 'Free PDF Download')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                {/* Sections Grid */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SECTIONS.map(section => (
                            <Card
                                key={section.id}
                                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800"
                                onClick={() => router.push(section.route)}
                            >
                                <div className={`h-2 bg-gradient-to-l ${section.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        {section.badge
                                            ? <Badge className="bg-amber-500 text-white text-xs">{section.badge}</Badge>
                                            : <span />
                                        }
                                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                        {section.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1">
                                        {section.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{section.formsCount} نموذج</span>
                                    </div>
                                    <Button className={`w-full bg-gradient-to-l ${section.gradient} text-white border-0 hover:opacity-90 gap-2`}>
                                        <Eye className="w-4 h-4" /> {ta('استعراض القسم', 'Browse Section')}
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
