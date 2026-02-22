'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowRight,
    BarChart3,
    Award,
    BookOpen,
    Trophy,
    Star,
    GraduationCap,
    FileText,
    Sparkles,
    CheckCircle2,
    Clock,
    Users,
    Zap,
    Play,
    Download,
    Share2,
    Heart,
    MessageSquare,
    Target,
    FileQuestion,
    Bot,
    FolderOpen,
    ChevronLeft,
    Shield,
    TrendingUp,
    HelpCircle,
    Layers,
    ArrowLeft,
    ExternalLink,
} from 'lucide-react';

// تعريف الخدمات التعليمية بالتفصيل
const servicesData: Record<string, {
    id: string;
    slug: string;
    title: string;
    titleEn: string;
    description: string;
    longDescription: string;
    icon: any;
    color: string;
    gradient: string;
    features: { title: string; description: string; icon: any }[];
    benefits: string[];
    howItWorks: { step: number; title: string; description: string }[];
    stats: { label: string; value: string; icon: any }[];
    pricing: { type: string; price: string; features: string[]; recommended?: boolean }[];
    faqs: { question: string; answer: string }[];
    relatedServices: string[];
    href: string;
    isNew?: boolean;
    isPremium?: boolean;
}> = {
    'analyses': {
        id: 'analyses',
        slug: 'analyses',
        title: 'تحليل النتائج',
        titleEn: 'Results Analysis',
        description: 'أدوات متقدمة لتحليل نتائج الاختبارات وقياس أداء الطلاب',
        longDescription: 'نظام تحليل النتائج الذكي يوفر لك أدوات متقدمة لتحليل نتائج الاختبارات والواجبات، مع رسوم بيانية تفاعلية وتوصيات مخصصة لتحسين أداء كل طالب. يستخدم الذكاء الاصطناعي لاكتشاف نقاط القوة والضعف وتقديم خطط علاجية مقترحة.',
        icon: BarChart3,
        color: 'text-blue-600',
        gradient: 'from-blue-500 to-blue-600',
        features: [
            { title: 'تحليل تفصيلي', description: 'تحليل شامل لنتائج الاختبارات مع تفاصيل دقيقة', icon: BarChart3 },
            { title: 'رسوم بيانية', description: 'رسوم بيانية تفاعلية لعرض البيانات بصرياً', icon: TrendingUp },
            { title: 'مقارنة الأداء', description: 'مقارنة أداء الطلاب مع بعضهم البعض', icon: Users },
            { title: 'تتبع التقدم', description: 'متابعة تطور الطلاب عبر الزمن', icon: Target },
            { title: 'تقارير PDF', description: 'تصدير تقارير احترافية بصيغة PDF', icon: FileText },
            { title: 'توصيات ذكية', description: 'اقتراحات مبنية على الذكاء الاصطناعي', icon: Sparkles },
        ],
        benefits: [
            'توفير الوقت في تحليل النتائج بنسبة 80%',
            'اتخاذ قرارات تعليمية مبنية على البيانات',
            'تحسين أداء الطلاب بشكل مستمر ومدروس',
            'تقارير احترافية جاهزة للطباعة والمشاركة',
        ],
        howItWorks: [
            { step: 1, title: 'إدخال البيانات', description: 'أدخل درجات الطلاب يدوياً أو استوردها من ملف Excel' },
            { step: 2, title: 'التحليل التلقائي', description: 'يقوم النظام بتحليل البيانات وإنشاء الرسوم البيانية' },
            { step: 3, title: 'التوصيات الذكية', description: 'يقدم الذكاء الاصطناعي توصيات مخصصة لكل طالب' },
            { step: 4, title: 'التصدير والمشاركة', description: 'صدّر التقارير بصيغة PDF أو شاركها مباشرة' },
        ],
        stats: [
            { label: 'تحليل مكتمل', value: '10,000+', icon: BarChart3 },
            { label: 'معلم يستخدم الخدمة', value: '2,500+', icon: Users },
            { label: 'دقة التوصيات', value: '95%', icon: Target },
            { label: 'توفير الوقت', value: '80%', icon: Clock },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['5 تحليلات شهرياً', 'رسوم بيانية أساسية', 'تصدير PDF'] },
            { type: 'احترافي', price: '49', features: ['تحليلات غير محدودة', 'توصيات AI', 'تصدير Excel', 'دعم فني'], recommended: true },
            { type: 'مؤسسي', price: '199', features: ['كل ميزات الاحترافي', 'حسابات متعددة', 'تقارير مخصصة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني استيراد البيانات من Excel؟', answer: 'نعم، يدعم النظام استيراد البيانات من ملفات Excel و CSV بسهولة.' },
            { question: 'هل التوصيات دقيقة؟', answer: 'نعم، تعتمد التوصيات على خوارزميات ذكاء اصطناعي متقدمة بدقة تصل إلى 95%.' },
            { question: 'هل يمكنني مشاركة التقارير مع أولياء الأمور؟', answer: 'نعم، يمكنك تصدير التقارير ومشاركتها عبر البريد الإلكتروني أو رابط مباشر.' },
        ],
        relatedServices: ['plans', 'tests', 'performance'],
        href: '/analyses',
    },
    'certificates': {
        id: 'certificates',
        slug: 'certificates',
        title: 'الشهادات والتقدير',
        titleEn: 'Certificates',
        description: 'إنشاء وتخصيص شهادات الشكر والتقدير بسهولة',
        longDescription: 'نظام إنشاء الشهادات يوفر لك مكتبة ضخمة من القوالب الاحترافية لإنشاء شهادات الشكر والتقدير والتخرج. يمكنك تخصيص كل شهادة بالألوان والخطوط والشعارات، مع إمكانية الإنشاء الجماعي لعشرات الشهادات بضغطة زر.',
        icon: Award,
        color: 'text-amber-600',
        gradient: 'from-amber-500 to-orange-500',
        features: [
            { title: 'قوالب احترافية', description: 'أكثر من 100 قالب شهادة جاهز للاستخدام', icon: Layers },
            { title: 'تخصيص كامل', description: 'تعديل الألوان والخطوط والشعارات بسهولة', icon: Sparkles },
            { title: 'إنشاء جماعي', description: 'إنشاء عشرات الشهادات دفعة واحدة', icon: Users },
            { title: 'جودة عالية', description: 'تصدير بجودة طباعة احترافية', icon: Download },
            { title: 'مكتبة شعارات', description: 'مكتبة شعارات وإطارات جاهزة', icon: FolderOpen },
            { title: 'مشاركة سهلة', description: 'مشاركة عبر البريد أو رابط مباشر', icon: Share2 },
        ],
        benefits: [
            'توفير الوقت في تصميم الشهادات',
            'شهادات احترافية بدون خبرة تصميم',
            'إنشاء مئات الشهادات بسرعة فائقة',
            'تكلفة أقل بكثير من المصممين',
        ],
        howItWorks: [
            { step: 1, title: 'اختيار القالب', description: 'اختر من بين عشرات القوالب الاحترافية المتاحة' },
            { step: 2, title: 'التخصيص', description: 'أضف النصوص والشعارات وخصص الألوان حسب رغبتك' },
            { step: 3, title: 'الإنشاء الجماعي', description: 'أدخل أسماء المستلمين أو استوردها من Excel' },
            { step: 4, title: 'التصدير', description: 'صدّر الشهادات بجودة عالية للطباعة أو المشاركة' },
        ],
        stats: [
            { label: 'شهادة تم إنشاؤها', value: '50,000+', icon: Award },
            { label: 'قالب متاح', value: '100+', icon: Layers },
            { label: 'معلم يستخدم الخدمة', value: '5,000+', icon: Users },
            { label: 'تقييم المستخدمين', value: '4.9/5', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['5 شهادات شهرياً', 'قوالب أساسية', 'تصدير PDF'] },
            { type: 'احترافي', price: '29', features: ['شهادات غير محدودة', 'جميع القوالب', 'إنشاء جماعي', 'بدون علامة مائية'], recommended: true },
            { type: 'مؤسسي', price: '99', features: ['كل ميزات الاحترافي', 'قوالب مخصصة', 'API للتكامل', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني إضافة شعار المدرسة؟', answer: 'نعم، يمكنك رفع شعار المدرسة وإضافته لجميع الشهادات بسهولة.' },
            { question: 'ما هي صيغ التصدير المتاحة؟', answer: 'يمكنك التصدير بصيغة PDF أو PNG بجودة عالية للطباعة.' },
            { question: 'هل يمكنني حفظ قالب مخصص؟', answer: 'نعم، يمكنك حفظ القوالب المخصصة لاستخدامها لاحقاً.' },
        ],
        relatedServices: ['achievements', 'performance'],
        href: '/certificates',
    },
    'plans': {
        id: 'plans',
        slug: 'plans',
        title: 'الخطط التعليمية',
        titleEn: 'Educational Plans',
        description: 'إعداد الخطط العلاجية والإثرائية وتوزيع المناهج',
        longDescription: 'نظام الخطط التعليمية يساعدك في إعداد خطط علاجية وإثرائية مخصصة لكل طالب، بالإضافة إلى توزيع المناهج الدراسية. يستخدم الذكاء الاصطناعي لاقتراح أنشطة وتمارين مناسبة بناءً على مستوى الطالب.',
        icon: BookOpen,
        color: 'text-green-600',
        gradient: 'from-green-500 to-emerald-500',
        features: [
            { title: 'خطط علاجية', description: 'خطط مخصصة لمعالجة نقاط الضعف', icon: Target },
            { title: 'خطط إثرائية', description: 'خطط لتطوير مهارات المتفوقين', icon: TrendingUp },
            { title: 'توزيع المناهج', description: 'توزيع المنهج على الأسابيع الدراسية', icon: BookOpen },
            { title: 'اقتراحات ذكية', description: 'أنشطة مقترحة بالذكاء الاصطناعي', icon: Sparkles },
            { title: 'متابعة التنفيذ', description: 'تتبع تقدم تنفيذ الخطة', icon: CheckCircle2 },
            { title: 'تقارير التقدم', description: 'تقارير دورية عن تقدم الطلاب', icon: BarChart3 },
        ],
        benefits: [
            'خطط مخصصة لكل طالب حسب مستواه',
            'توفير وقت إعداد الخطط بنسبة 70%',
            'متابعة التقدم بسهولة ووضوح',
            'تحسين نتائج الطلاب بشكل ملموس',
        ],
        howItWorks: [
            { step: 1, title: 'تحديد الطالب', description: 'اختر الطالب أو مجموعة الطلاب المستهدفين' },
            { step: 2, title: 'تحليل المستوى', description: 'يحلل النظام مستوى الطالب من النتائج السابقة' },
            { step: 3, title: 'إنشاء الخطة', description: 'يقترح الذكاء الاصطناعي خطة مخصصة' },
            { step: 4, title: 'المتابعة', description: 'تابع تنفيذ الخطة وسجل التقدم' },
        ],
        stats: [
            { label: 'خطة تم إنشاؤها', value: '15,000+', icon: BookOpen },
            { label: 'نسبة التحسن', value: '85%', icon: TrendingUp },
            { label: 'معلم يستخدم الخدمة', value: '3,000+', icon: Users },
            { label: 'رضا المستخدمين', value: '96%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['3 خطط شهرياً', 'قوالب أساسية', 'تصدير PDF'] },
            { type: 'احترافي', price: '39', features: ['خطط غير محدودة', 'اقتراحات AI', 'متابعة التقدم', 'تقارير متقدمة'], recommended: true },
            { type: 'مؤسسي', price: '149', features: ['كل ميزات الاحترافي', 'خطط مدرسية', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكن ربط الخطة بنتائج الطالب؟', answer: 'نعم، يمكن ربط الخطة بتحليل النتائج لإنشاء خطط مبنية على البيانات.' },
            { question: 'هل يمكن تعديل الخطة المقترحة؟', answer: 'نعم، يمكنك تعديل أي جزء من الخطة المقترحة حسب رؤيتك.' },
            { question: 'هل يمكن مشاركة الخطة مع ولي الأمر؟', answer: 'نعم، يمكنك تصدير الخطة ومشاركتها مع أولياء الأمور.' },
        ],
        relatedServices: ['analyses', 'tests', 'achievements'],
        href: '/plans',
    },
    'achievements': {
        id: 'achievements',
        slug: 'achievements',
        title: 'توثيق الإنجازات',
        titleEn: 'Achievements',
        description: 'سجل متكامل لتوثيق إنجازات المعلمين والطلاب',
        longDescription: 'نظام توثيق الإنجازات يوفر لك سجلاً متكاملاً لتوثيق جميع إنجازاتك المهنية وإنجازات طلابك. يمكنك إنشاء ملف إنجاز رقمي احترافي يشمل الشهادات والجوائز والمشاركات والتدريبات.',
        icon: Trophy,
        color: 'text-purple-600',
        gradient: 'from-purple-500 to-violet-500',
        features: [
            { title: 'ملف إنجاز رقمي', description: 'ملف إنجاز متكامل وقابل للمشاركة', icon: FolderOpen },
            { title: 'تصنيف الإنجازات', description: 'تصنيف حسب النوع والتاريخ', icon: Layers },
            { title: 'رفع المرفقات', description: 'رفع الشهادات والصور كشواهد', icon: Download },
            { title: 'جدول زمني', description: 'عرض الإنجازات على جدول زمني', icon: Clock },
            { title: 'تقارير سنوية', description: 'تقارير إنجاز سنوية شاملة', icon: BarChart3 },
            { title: 'ربط بالأداء', description: 'ربط الإنجازات بشواهد الأداء', icon: Target },
        ],
        benefits: [
            'توثيق منظم ومرتب لجميع الإنجازات',
            'سهولة الوصول للشواهد عند الحاجة',
            'ملف إنجاز جاهز للتقديم في أي وقت',
            'متابعة التطور المهني بوضوح',
        ],
        howItWorks: [
            { step: 1, title: 'إضافة إنجاز', description: 'أضف الإنجاز مع التفاصيل والمرفقات' },
            { step: 2, title: 'التصنيف', description: 'صنف الإنجاز حسب النوع والتاريخ' },
            { step: 3, title: 'التوثيق', description: 'ارفق الشهادات والصور كشواهد' },
            { step: 4, title: 'التصدير', description: 'صدّر ملف الإنجاز كاملاً بصيغة PDF' },
        ],
        stats: [
            { label: 'إنجاز تم توثيقه', value: '100,000+', icon: Trophy },
            { label: 'ملف إنجاز', value: '8,000+', icon: FolderOpen },
            { label: 'معلم يستخدم الخدمة', value: '4,000+', icon: Users },
            { label: 'تقييم المستخدمين', value: '4.8/5', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['20 إنجاز', 'تصدير PDF', 'مرفقات محدودة'] },
            { type: 'احترافي', price: '35', features: ['إنجازات غير محدودة', 'مرفقات غير محدودة', 'تقارير متقدمة', 'مشاركة'], recommended: true },
            { type: 'مؤسسي', price: '129', features: ['كل ميزات الاحترافي', 'ملفات مدرسية', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني رفع ملفات كبيرة؟', answer: 'نعم، يدعم النظام رفع ملفات حتى 50 ميجابايت.' },
            { question: 'هل يمكن مشاركة ملف الإنجاز؟', answer: 'نعم، يمكنك إنشاء رابط مشاركة أو تصدير PDF.' },
            { question: 'هل يمكن ربط الإنجازات بالأداء الوظيفي؟', answer: 'نعم، يمكنك ربط الإنجازات بشواهد الأداء الوظيفي.' },
        ],
        relatedServices: ['certificates', 'performance'],
        href: '/achievements',
    },
    'performance': {
        id: 'performance',
        slug: 'performance',
        title: 'تقييم الأداء',
        titleEn: 'Performance Evaluation',
        description: 'تقارير أداء شاملة للمعلمين مع مؤشرات ورسوم بيانية',
        longDescription: 'نظام تقييم الأداء يوفر لك أدوات متقدمة لتقييم أدائك المهني وفق معايير محددة. يشمل مؤشرات الأداء الرئيسية ورسوم بيانية تفاعلية وتقارير شاملة يمكن تقديمها للإدارة.',
        icon: Target,
        color: 'text-red-600',
        gradient: 'from-red-500 to-rose-500',
        features: [
            { title: 'تقييم ذاتي', description: 'تقييم شامل لأدائك المهني', icon: Target },
            { title: 'مؤشرات KPIs', description: 'مؤشرات أداء رئيسية واضحة', icon: BarChart3 },
            { title: 'رسوم بيانية', description: 'رسوم بيانية تفاعلية للأداء', icon: TrendingUp },
            { title: 'مقارنة الفترات', description: 'مقارنة الأداء مع الفترات السابقة', icon: Clock },
            { title: 'تقارير للإدارة', description: 'تقارير جاهزة للتقديم', icon: FileText },
            { title: 'توصيات للتحسين', description: 'اقتراحات لتحسين الأداء', icon: Sparkles },
        ],
        benefits: [
            'تقييم موضوعي ودقيق للأداء',
            'تحديد نقاط التحسين بوضوح',
            'تقارير احترافية للإدارة',
            'متابعة التطور المهني',
        ],
        howItWorks: [
            { step: 1, title: 'إدخال البيانات', description: 'أدخل بيانات الأداء والإنجازات' },
            { step: 2, title: 'التقييم التلقائي', description: 'يقوم النظام بحساب مؤشرات الأداء' },
            { step: 3, title: 'التحليل', description: 'عرض الرسوم البيانية والتحليلات' },
            { step: 4, title: 'التصدير', description: 'تصدير التقارير للإدارة' },
        ],
        stats: [
            { label: 'تقييم مكتمل', value: '8,000+', icon: Target },
            { label: 'معلم يستخدم الخدمة', value: '2,000+', icon: Users },
            { label: 'نسبة الرضا', value: '94%', icon: Star },
            { label: 'تحسن الأداء', value: '25%', icon: TrendingUp },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['تقييم واحد شهرياً', 'مؤشرات أساسية', 'تصدير PDF'] },
            { type: 'احترافي', price: '45', features: ['تقييمات غير محدودة', 'جميع المؤشرات', 'رسوم بيانية متقدمة', 'توصيات AI'], recommended: true },
            { type: 'مؤسسي', price: '179', features: ['كل ميزات الاحترافي', 'تقييم فريق', 'تقارير مقارنة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'ما هي معايير التقييم المستخدمة؟', answer: 'نستخدم معايير الأداء الوظيفي المعتمدة من وزارة التعليم.' },
            { question: 'هل يمكن تخصيص المعايير؟', answer: 'نعم، يمكنك إضافة معايير مخصصة حسب احتياجاتك.' },
            { question: 'هل التقارير معتمدة رسمياً؟', answer: 'التقارير استرشادية ويمكن استخدامها كمرجع للتقييم الرسمي.' },
        ],
        relatedServices: ['achievements', 'analyses'],
        href: '/performance',
    },
    'tests': {
        id: 'tests',
        slug: 'tests',
        title: 'الاختبارات',
        titleEn: 'Tests & Exams',
        description: 'إنشاء وإدارة الاختبارات وتسجيل درجات الطلاب',
        longDescription: 'نظام الاختبارات يوفر لك أدوات شاملة لإنشاء الاختبارات وإدارتها وتسجيل درجات الطلاب. يشمل بنك أسئلة متنوع وإمكانية إنشاء اختبارات إلكترونية وورقية.',
        icon: FileQuestion,
        color: 'text-cyan-600',
        gradient: 'from-cyan-500 to-teal-500',
        features: [
            { title: 'بنك أسئلة', description: 'بنك أسئلة متنوع وشامل', icon: FolderOpen },
            { title: 'إنشاء اختبارات', description: 'إنشاء اختبارات بسهولة', icon: FileQuestion },
            { title: 'تسجيل الدرجات', description: 'تسجيل درجات الطلاب', icon: CheckCircle2 },
            { title: 'تحليل النتائج', description: 'تحليل تفصيلي للنتائج', icon: BarChart3 },
            { title: 'تقارير الطلاب', description: 'تقارير فردية لكل طالب', icon: Users },
            { title: 'اختبارات إلكترونية', description: 'اختبارات أونلاين تفاعلية', icon: Zap },
        ],
        benefits: [
            'توفير الوقت في إعداد الاختبارات',
            'تحليل تلقائي للنتائج',
            'تقارير شاملة للطلاب',
            'بنك أسئلة قابل للتوسيع',
        ],
        howItWorks: [
            { step: 1, title: 'إنشاء الاختبار', description: 'أنشئ الاختبار من بنك الأسئلة أو أضف أسئلة جديدة' },
            { step: 2, title: 'تطبيق الاختبار', description: 'طبق الاختبار إلكترونياً أو ورقياً' },
            { step: 3, title: 'تسجيل الدرجات', description: 'سجل درجات الطلاب' },
            { step: 4, title: 'التحليل', description: 'احصل على تحليل شامل للنتائج' },
        ],
        stats: [
            { label: 'اختبار تم إنشاؤه', value: '5,000+', icon: FileQuestion },
            { label: 'سؤال في البنك', value: '50,000+', icon: FolderOpen },
            { label: 'معلم يستخدم الخدمة', value: '1,500+', icon: Users },
            { label: 'طالب تم تقييمه', value: '100,000+', icon: GraduationCap },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['3 اختبارات شهرياً', 'بنك أسئلة محدود', 'تقارير أساسية'] },
            { type: 'احترافي', price: '39', features: ['اختبارات غير محدودة', 'بنك أسئلة كامل', 'اختبارات إلكترونية', 'تحليل متقدم'], recommended: true },
            { type: 'مؤسسي', price: '159', features: ['كل ميزات الاحترافي', 'بنك أسئلة مدرسي', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني إضافة أسئلتي الخاصة؟', answer: 'نعم، يمكنك إضافة أسئلة جديدة لبنك الأسئلة الخاص بك.' },
            { question: 'هل يدعم النظام الاختبارات الإلكترونية؟', answer: 'نعم، يمكنك إنشاء اختبارات إلكترونية يحلها الطلاب أونلاين.' },
            { question: 'هل يمكن تصحيح الاختبارات تلقائياً؟', answer: 'نعم، الأسئلة الموضوعية تُصحح تلقائياً.' },
        ],
        relatedServices: ['analyses', 'plans'],
        href: '/tests',
    },
    'ai-assistant': {
        id: 'ai-assistant',
        slug: 'ai-assistant',
        title: 'المساعد الذكي',
        titleEn: 'AI Assistant',
        description: 'مساعد ذكي يساعدك في إعداد الخطط والتقارير',
        longDescription: 'المساعد الذكي هو أداة متقدمة تعتمد على الذكاء الاصطناعي لمساعدتك في إعداد الخطط والتقارير والشهادات. يفهم احتياجاتك ويقدم اقتراحات مخصصة لتوفير وقتك وجهدك.',
        icon: Bot,
        color: 'text-indigo-600',
        gradient: 'from-indigo-500 to-purple-600',
        features: [
            { title: 'إعداد الخطط', description: 'مساعدة في إعداد الخطط التعليمية', icon: BookOpen },
            { title: 'كتابة التقارير', description: 'كتابة تقارير احترافية', icon: FileText },
            { title: 'اقتراحات ذكية', description: 'اقتراحات مخصصة لاحتياجاتك', icon: Sparkles },
            { title: 'محادثة تفاعلية', description: 'تفاعل طبيعي مع المساعد', icon: MessageSquare },
            { title: 'تحليل البيانات', description: 'تحليل ذكي للبيانات', icon: BarChart3 },
            { title: 'تعلم مستمر', description: 'يتعلم من استخدامك ويتحسن', icon: TrendingUp },
        ],
        benefits: [
            'توفير الوقت بنسبة تصل إلى 90%',
            'نتائج احترافية بجهد أقل',
            'اقتراحات مخصصة لاحتياجاتك',
            'تحسين مستمر مع الاستخدام',
        ],
        howItWorks: [
            { step: 1, title: 'وصف المهمة', description: 'اشرح للمساعد ما تريد إنجازه' },
            { step: 2, title: 'الاقتراحات', description: 'يقدم المساعد اقتراحات مخصصة' },
            { step: 3, title: 'التعديل', description: 'عدّل الاقتراحات حسب رغبتك' },
            { step: 4, title: 'التصدير', description: 'صدّر النتيجة النهائية' },
        ],
        stats: [
            { label: 'طلب تم معالجته', value: '20,000+', icon: Bot },
            { label: 'معلم يستخدم الخدمة', value: '1,000+', icon: Users },
            { label: 'توفير الوقت', value: '90%', icon: Clock },
            { label: 'رضا المستخدمين', value: '98%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['10 طلبات شهرياً', 'ميزات أساسية', 'دعم محدود'] },
            { type: 'احترافي', price: '59', features: ['طلبات غير محدودة', 'جميع الميزات', 'أولوية المعالجة', 'دعم فني'], recommended: true },
            { type: 'مؤسسي', price: '249', features: ['كل ميزات الاحترافي', 'تخصيص المساعد', 'API للتكامل', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل المساعد يفهم العربية؟', answer: 'نعم، المساعد مُدرب على اللغة العربية ويفهمها بشكل ممتاز.' },
            { question: 'هل النتائج دقيقة؟', answer: 'نعم، المساعد يقدم نتائج دقيقة ويمكنك مراجعتها وتعديلها.' },
            { question: 'هل بياناتي آمنة؟', answer: 'نعم، جميع البيانات مشفرة ولا نشاركها مع أي طرف ثالث.' },
        ],
        relatedServices: ['plans', 'analyses', 'certificates'],
        href: '/ai-assistant',
        isNew: true,
        isPremium: true,
    },
    'distributions': {
        id: 'distributions',
        slug: 'distributions',
        title: 'التوزيعات',
        titleEn: 'Distributions',
        description: 'إعداد توزيعات المنهج الأسبوعية والشهرية والفصلية',
        longDescription: 'نظام التوزيعات يساعدك في إعداد توزيعات المنهج بشكل منظم واحترافي. يشمل توزيعات أسبوعية وشهرية وفصلية مع جدول الحصص وإمكانية التعديل والتصدير بصيغة PDF.',
        icon: BookOpen,
        color: 'text-teal-600',
        gradient: 'from-teal-500 to-cyan-500',
        features: [
            { title: 'توزيع أسبوعي', description: 'توزيع المنهج على مستوى الأسبوع', icon: BookOpen },
            { title: 'توزيع شهري', description: 'توزيع المنهج على مستوى الشهر', icon: BookOpen },
            { title: 'توزيع فصلي', description: 'توزيع المنهج على مستوى الفصل الدراسي', icon: BookOpen },
            { title: 'جدول الحصص', description: 'ربط التوزيع بجدول الحصص', icon: Clock },
            { title: 'قوالب جاهزة', description: 'قوالب توزيع جاهزة للاستخدام', icon: Layers },
            { title: 'تصدير PDF', description: 'تصدير التوزيعات بصيغة PDF', icon: Download },
        ],
        benefits: [
            'توفير الوقت في إعداد التوزيعات',
            'توزيعات منظمة واحترافية',
            'سهولة التعديل والتحديث',
            'ربط مباشر بجدول الحصص',
        ],
        howItWorks: [
            { step: 1, title: 'اختيار النوع', description: 'اختر نوع التوزيع (أسبوعي/شهري/فصلي)' },
            { step: 2, title: 'إدخال البيانات', description: 'أدخل المادة والموضوعات والأهداف' },
            { step: 3, title: 'التنظيم', description: 'نظم التوزيع حسب الأسابيع أو الأشهر' },
            { step: 4, title: 'التصدير', description: 'صدّر التوزيع بصيغة PDF احترافية' },
        ],
        stats: [
            { label: 'توزيع تم إنشاؤه', value: '12,000+', icon: BookOpen },
            { label: 'معلم يستخدم الخدمة', value: '2,800+', icon: Users },
            { label: 'قالب متاح', value: '50+', icon: Layers },
            { label: 'رضا المستخدمين', value: '95%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['3 توزيعات شهرياً', 'قوالب أساسية', 'تصدير PDF'] },
            { type: 'احترافي', price: '35', features: ['توزيعات غير محدودة', 'جميع القوالب', 'ربط بالجدول', 'تعديل مرن'], recommended: true },
            { type: 'مؤسسي', price: '129', features: ['كل ميزات الاحترافي', 'توزيعات مدرسية', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني تعديل التوزيع بعد إنشائه؟', answer: 'نعم، يمكنك تعديل التوزيع في أي وقت وإعادة تصديره.' },
            { question: 'هل يدعم جميع المواد الدراسية؟', answer: 'نعم، يدعم النظام جميع المواد الدراسية لجميع المراحل.' },
            { question: 'هل يمكنني مشاركة التوزيع مع زملائي؟', answer: 'نعم، يمكنك مشاركة التوزيع عبر رابط أو تصدير PDF.' },
        ],
        relatedServices: ['plans', 'tests'],
        href: '/distributions',
        isNew: true,
    },
    'portfolio': {
        id: 'portfolio',
        slug: 'portfolio',
        title: 'ملف الإنجاز',
        titleEn: 'Portfolio',
        description: 'ملف إنجاز رقمي شامل يجمع جميع الشهادات والإنجازات',
        longDescription: 'ملف الإنجاز الرقمي هو نظام متكامل لجمع وتنظيم جميع شهاداتك وإنجازاتك وتدريباتك ومشاركاتك في ملف واحد احترافي. يتضمن تصنيف تلقائي وجدول زمني وإمكانية التصدير والمشاركة الرقمية.',
        icon: FolderOpen,
        color: 'text-rose-600',
        gradient: 'from-rose-500 to-pink-500',
        features: [
            { title: 'ملف متكامل', description: 'ملف إنجاز شامل يجمع كل شيء', icon: FolderOpen },
            { title: 'تصنيف تلقائي', description: 'تصنيف الإنجازات تلقائياً حسب النوع', icon: Layers },
            { title: 'رفع المرفقات', description: 'رفع الشهادات والصور والملفات', icon: Download },
            { title: 'جدول زمني', description: 'عرض الإنجازات على خط زمني', icon: Clock },
            { title: 'تصدير احترافي', description: 'تصدير الملف بتصميم احترافي', icon: FileText },
            { title: 'مشاركة رقمية', description: 'مشاركة الملف عبر رابط أو QR', icon: Share2 },
        ],
        benefits: [
            'جمع كل الإنجازات في مكان واحد',
            'تصنيف تلقائي وتنظيم احترافي',
            'سهولة المشاركة والتقديم',
            'ملف جاهز للتقييم في أي وقت',
        ],
        howItWorks: [
            { step: 1, title: 'إنشاء الملف', description: 'أنشئ ملف إنجاز جديد وحدد البيانات الأساسية' },
            { step: 2, title: 'إضافة المحتوى', description: 'أضف الشهادات والإنجازات والتدريبات' },
            { step: 3, title: 'التنظيم', description: 'نظم المحتوى في أقسام وتصنيفات' },
            { step: 4, title: 'التصدير', description: 'صدّر الملف بتصميم احترافي PDF أو شاركه رقمياً' },
        ],
        stats: [
            { label: 'ملف إنجاز', value: '25,000+', icon: FolderOpen },
            { label: 'مرفق تم رفعه', value: '150,000+', icon: Download },
            { label: 'معلم يستخدم الخدمة', value: '3,500+', icon: Users },
            { label: 'تقييم المستخدمين', value: '4.9/5', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['ملف واحد', '20 مرفق', 'تصدير PDF'] },
            { type: 'احترافي', price: '39', features: ['ملفات غير محدودة', 'مرفقات غير محدودة', 'تصميمات متعددة', 'مشاركة رقمية'], recommended: true },
            { type: 'مؤسسي', price: '149', features: ['كل ميزات الاحترافي', 'ملفات مدرسية', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'ما أنواع الملفات المدعومة للرفع؟', answer: 'يدعم النظام PDF, JPG, PNG, DOCX وغيرها من الصيغ الشائعة.' },
            { question: 'هل يمكنني إنشاء أكثر من ملف إنجاز؟', answer: 'نعم، في الباقة الاحترافية يمكنك إنشاء ملفات غير محدودة.' },
            { question: 'هل يمكن مشاركة الملف مع الإدارة؟', answer: 'نعم، يمكنك إنشاء رابط مشاركة أو تصدير PDF.' },
        ],
        relatedServices: ['achievements', 'certificates', 'performance'],
        href: '/portfolio',
        isNew: true,
    },
    'work-evidence': {
        id: 'work-evidence',
        slug: 'work-evidence',
        title: 'شواهد الأداء الوظيفي',
        titleEn: 'Work Performance Evidence',
        description: 'توثيق شواهد الأداء الوظيفي الـ 11 بند المعتمدة',
        longDescription: 'نظام شواهد الأداء الوظيفي يساعدك في توثيق وإدارة شواهد الأداء الوظيفي وفق البنود الـ 11 المعتمدة من وزارة التعليم. يتضمن رفع المرفقات والأدلة وتصنيفها تلقائياً مع إمكانية إنشاء تقرير شامل.',
        icon: Target,
        color: 'text-sky-600',
        gradient: 'from-sky-500 to-blue-500',
        features: [
            { title: '11 بند معتمد', description: 'جميع بنود الأداء الوظيفي المعتمدة', icon: CheckCircle2 },
            { title: 'رفع الشواهد', description: 'رفع الأدلة والمرفقات لكل بند', icon: Download },
            { title: 'تصنيف تلقائي', description: 'تصنيف الشواهد حسب البند', icon: Layers },
            { title: 'تقرير شامل', description: 'تقرير شامل بجميع الشواهد', icon: FileText },
            { title: 'ربط بالأداء', description: 'ربط مباشر بتقييم الأداء', icon: Target },
            { title: 'تحميل PDF', description: 'تحميل التقرير بصيغة PDF', icon: Download },
        ],
        benefits: [
            'توثيق منظم لجميع شواهد الأداء',
            'جاهزية تامة لزيارات المشرفين',
            'ربط مباشر بتقييم الأداء الوظيفي',
            'تقارير احترافية جاهزة للتقديم',
        ],
        howItWorks: [
            { step: 1, title: 'اختيار البند', description: 'اختر بند الأداء الوظيفي المراد توثيقه' },
            { step: 2, title: 'رفع الشواهد', description: 'ارفع الأدلة والمرفقات الداعمة' },
            { step: 3, title: 'التوصيف', description: 'أضف وصف وتفاصيل الشاهد' },
            { step: 4, title: 'التقرير', description: 'أنشئ تقرير شامل بجميع الشواهد' },
        ],
        stats: [
            { label: 'شاهد تم توثيقه', value: '6,000+', icon: Target },
            { label: 'معلم يستخدم الخدمة', value: '1,800+', icon: Users },
            { label: 'بند مغطى', value: '11/11', icon: CheckCircle2 },
            { label: 'رضا المستخدمين', value: '96%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['3 بنود', 'مرفقات محدودة', 'تصدير PDF'] },
            { type: 'احترافي', price: '39', features: ['جميع البنود', 'مرفقات غير محدودة', 'تقارير متقدمة', 'ربط بالأداء'], recommended: true },
            { type: 'مؤسسي', price: '149', features: ['كل ميزات الاحترافي', 'شواهد مدرسية', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'ما هي البنود الـ 11 المعتمدة؟', answer: 'هي بنود الأداء الوظيفي المعتمدة من وزارة التعليم وتشمل: التخطيط، التنفيذ، التقويم، إدارة الصف، وغيرها.' },
            { question: 'هل يمكنني رفع أكثر من شاهد لكل بند؟', answer: 'نعم، يمكنك رفع عدد غير محدود من الشواهد لكل بند.' },
            { question: 'هل يمكن ربط الشواهد بملف الإنجاز؟', answer: 'نعم، يمكنك ربط الشواهد بملف الإنجاز وتقييم الأداء.' },
        ],
        relatedServices: ['performance', 'portfolio', 'achievements'],
        href: '/work-evidence',
        isNew: true,
    },
    'knowledge-production': {
        id: 'knowledge-production',
        slug: 'knowledge-production',
        title: 'الإنتاج المعرفي',
        titleEn: 'Knowledge Production',
        description: 'توثيق وإدارة الإنتاج المعرفي من أبحاث ومقالات وأوراق عمل',
        longDescription: 'نظام الإنتاج المعرفي يساعدك في توثيق وإدارة جميع إنتاجك المعرفي من أبحاث ومقالات وأوراق عمل ومبادرات تعليمية ومشاريع طلابية. يتضمن تصنيف وأرشفة وتصدير احترافي.',
        icon: Sparkles,
        color: 'text-yellow-600',
        gradient: 'from-yellow-500 to-amber-500',
        features: [
            { title: 'أبحاث ومقالات', description: 'توثيق الأبحاث والمقالات العلمية', icon: FileText },
            { title: 'أوراق عمل', description: 'إدارة أوراق العمل والورش', icon: BookOpen },
            { title: 'مبادرات تعليمية', description: 'توثيق المبادرات والمشاريع', icon: Target },
            { title: 'مشاريع طلابية', description: 'إدارة مشاريع الطلاب', icon: Users },
            { title: 'تصنيف وأرشفة', description: 'تصنيف تلقائي وأرشفة منظمة', icon: Layers },
            { title: 'تصدير احترافي', description: 'تصدير بتصميم احترافي', icon: Download },
        ],
        benefits: [
            'توثيق منظم لجميع الإنتاج المعرفي',
            'سهولة البحث والوصول للمحتوى',
            'تقارير شاملة للتقديم',
            'أرشيف رقمي دائم',
        ],
        howItWorks: [
            { step: 1, title: 'إضافة المحتوى', description: 'أضف البحث أو المقال أو المبادرة' },
            { step: 2, title: 'التصنيف', description: 'صنف المحتوى حسب النوع والتاريخ' },
            { step: 3, title: 'التوثيق', description: 'أضف التفاصيل والمرفقات' },
            { step: 4, title: 'التصدير', description: 'صدّر التقرير أو شارك المحتوى' },
        ],
        stats: [
            { label: 'إنتاج معرفي', value: '4,000+', icon: Sparkles },
            { label: 'معلم يستخدم الخدمة', value: '1,200+', icon: Users },
            { label: 'بحث ومقال', value: '2,500+', icon: FileText },
            { label: 'رضا المستخدمين', value: '94%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['5 إنتاجات', 'تصنيف أساسي', 'تصدير PDF'] },
            { type: 'احترافي', price: '35', features: ['إنتاج غير محدود', 'تصنيف متقدم', 'أرشفة كاملة', 'تقارير متقدمة'], recommended: true },
            { type: 'مؤسسي', price: '129', features: ['كل ميزات الاحترافي', 'إنتاج مدرسي', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'ما أنواع الإنتاج المعرفي المدعومة؟', answer: 'يدعم النظام الأبحاث والمقالات وأوراق العمل والمبادرات والمشاريع وغيرها.' },
            { question: 'هل يمكنني رفع ملفات كبيرة؟', answer: 'نعم، يدعم النظام رفع ملفات حتى 100 ميجابايت.' },
            { question: 'هل يمكن ربط الإنتاج بملف الإنجاز؟', answer: 'نعم، يمكنك ربط الإنتاج المعرفي بملف الإنجاز وشواهد الأداء.' },
        ],
        relatedServices: ['portfolio', 'achievements', 'work-evidence'],
        href: '/knowledge-production',
        isNew: true,
    },
    'follow-up-log': {
        id: 'follow-up-log',
        slug: 'follow-up-log',
        title: 'سجل المتابعة',
        titleEn: 'Follow-up Log',
        description: 'سجل متابعة شامل لتوثيق الزيارات والملاحظات والتوصيات',
        longDescription: 'سجل المتابعة هو نظام شامل لتوثيق الزيارات الإشرافية والملاحظات والتوصيات ومتابعة تنفيذها. يتضمن إشعارات تذكير وتقارير دورية وإمكانية المشاركة مع المشرفين.',
        icon: BookOpen,
        color: 'text-emerald-600',
        gradient: 'from-emerald-500 to-green-500',
        features: [
            { title: 'سجل الزيارات', description: 'توثيق جميع الزيارات الإشرافية', icon: BookOpen },
            { title: 'الملاحظات', description: 'تسجيل الملاحظات والنقاط', icon: FileText },
            { title: 'التوصيات', description: 'تسجيل التوصيات ومتابعتها', icon: Target },
            { title: 'متابعة التنفيذ', description: 'تتبع تنفيذ التوصيات', icon: CheckCircle2 },
            { title: 'تقارير دورية', description: 'تقارير متابعة دورية', icon: BarChart3 },
            { title: 'إشعارات تذكير', description: 'تذكيرات بمواعيد المتابعة', icon: Clock },
        ],
        benefits: [
            'توثيق منظم لجميع الزيارات',
            'متابعة تنفيذ التوصيات بسهولة',
            'تقارير جاهزة للتقديم',
            'إشعارات تذكير تلقائية',
        ],
        howItWorks: [
            { step: 1, title: 'تسجيل الزيارة', description: 'سجل تفاصيل الزيارة والتاريخ' },
            { step: 2, title: 'إضافة الملاحظات', description: 'أضف الملاحظات والتوصيات' },
            { step: 3, title: 'المتابعة', description: 'تابع تنفيذ التوصيات' },
            { step: 4, title: 'التقرير', description: 'أنشئ تقرير متابعة شامل' },
        ],
        stats: [
            { label: 'زيارة تم توثيقها', value: '7,000+', icon: BookOpen },
            { label: 'معلم يستخدم الخدمة', value: '1,500+', icon: Users },
            { label: 'توصية تم متابعتها', value: '15,000+', icon: Target },
            { label: 'رضا المستخدمين', value: '95%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['5 زيارات شهرياً', 'ملاحظات أساسية', 'تصدير PDF'] },
            { type: 'احترافي', price: '35', features: ['زيارات غير محدودة', 'متابعة التنفيذ', 'إشعارات', 'تقارير متقدمة'], recommended: true },
            { type: 'مؤسسي', price: '129', features: ['كل ميزات الاحترافي', 'سجلات مدرسية', 'تكامل مع الأنظمة', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني مشاركة السجل مع المشرف؟', answer: 'نعم، يمكنك إنشاء رابط مشاركة أو تصدير PDF.' },
            { question: 'هل يوجد إشعارات تذكير؟', answer: 'نعم، يرسل النظام إشعارات تذكير بمواعيد المتابعة.' },
            { question: 'هل يمكن ربط السجل بتقييم الأداء؟', answer: 'نعم، يمكنك ربط سجل المتابعة بتقييم الأداء الوظيفي.' },
        ],
        relatedServices: ['performance', 'work-evidence', 'achievements'],
        href: '/follow-up-log',
        isNew: true,
    },
    'my-templates': {
        id: 'my-templates',
        slug: 'my-templates',
        title: 'قوالبي المحفوظة',
        titleEn: 'My Templates',
        description: 'إدارة القوالب المحفوظة والمشتراة والمفضلة',
        longDescription: 'صفحة قوالبي تتيح لك إدارة جميع القوالب التي اشتريتها أو حفظتها أو أضفتها للمفضلة. يمكنك الوصول السريع لقوالبك وإعادة استخدامها بسهولة.',
        icon: FolderOpen,
        color: 'text-orange-600',
        gradient: 'from-orange-500 to-amber-500',
        features: [
            { title: 'القوالب المشتراة', description: 'جميع القوالب التي اشتريتها', icon: Download },
            { title: 'القوالب المفضلة', description: 'القوالب التي أضفتها للمفضلة', icon: Heart },
            { title: 'القوالب المحفوظة', description: 'القوالب التي حفظتها للاستخدام لاحقاً', icon: FolderOpen },
            { title: 'سجل الاستخدام', description: 'تاريخ استخدامك للقوالب', icon: Clock },
            { title: 'إعادة التحرير', description: 'إعادة تحرير القوالب المستخدمة', icon: FileText },
            { title: 'تنظيم بمجلدات', description: 'تنظيم القوالب في مجلدات', icon: Layers },
        ],
        benefits: [
            'وصول سريع لجميع قوالبك',
            'تنظيم القوالب بسهولة',
            'إعادة استخدام القوالب',
            'تتبع سجل الاستخدام',
        ],
        howItWorks: [
            { step: 1, title: 'الوصول', description: 'ادخل لصفحة قوالبي من القائمة' },
            { step: 2, title: 'التصفح', description: 'تصفح قوالبك المحفوظة والمشتراة' },
            { step: 3, title: 'الاختيار', description: 'اختر القالب الذي تريد استخدامه' },
            { step: 4, title: 'الاستخدام', description: 'استخدم القالب أو عدّله' },
        ],
        stats: [
            { label: 'قالب محفوظ', value: '200,000+', icon: FolderOpen },
            { label: 'مستخدم نشط', value: '8,000+', icon: Users },
            { label: 'إعادة استخدام', value: '500,000+', icon: TrendingUp },
            { label: 'رضا المستخدمين', value: '97%', icon: Star },
        ],
        pricing: [
            { type: 'مجاني', price: '0', features: ['10 قوالب محفوظة', 'مجلد واحد', 'سجل محدود'] },
            { type: 'احترافي', price: '25', features: ['قوالب غير محدودة', 'مجلدات متعددة', 'سجل كامل', 'مزامنة'], recommended: true },
            { type: 'مؤسسي', price: '99', features: ['كل ميزات الاحترافي', 'مشاركة مع الفريق', 'قوالب مؤسسية', 'دعم أولوية'] },
        ],
        faqs: [
            { question: 'هل يمكنني تنظيم القوالب في مجلدات؟', answer: 'نعم، يمكنك إنشاء مجلدات وتنظيم قوالبك فيها.' },
            { question: 'هل يمكنني مشاركة القوالب مع زملائي؟', answer: 'نعم، في الباقة المؤسسية يمكنك مشاركة القوالب مع فريقك.' },
            { question: 'ماذا يحدث إذا حذفت قالباً؟', answer: 'يمكنك استعادة القوالب المحذوفة خلال 30 يوماً.' },
        ],
        relatedServices: ['certificates', 'plans'],
        href: '/my-templates',
    },
};

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [activeTab, setActiveTab] = useState('overview');

    const service = servicesData[slug];

    if (!service) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">الخدمة غير موجودة</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">الخدمة التي تبحث عنها غير متاحة</p>
                    <Button onClick={() => router.push('/services')}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للخدمات
                    </Button>
                </div>
            </div>
        );
    }

    const Icon = service.icon;
    const relatedServicesData = service.relatedServices
        .map(id => servicesData[id])
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <Navbar />
            {/* Hero Section */}
            <div className={`bg-gradient-to-br ${service.gradient} text-white`}>
                <div className="container mx-auto px-4 py-12">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-white/70 text-sm mb-8">
                        <Link href="/services" className="hover:text-white transition-colors flex items-center gap-1">
                            <ArrowRight className="w-4 h-4" />
                            الخدمات التعليمية
                        </Link>
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-white">{service.title}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                {service.isNew && (
                                    <Badge className="bg-white/20 text-white">جديد</Badge>
                                )}
                                {service.isPremium && (
                                    <Badge className="bg-white/20 text-white">
                                        <Sparkles className="w-3 h-3 ml-1" />
                                        مميز
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{service.title}</h1>
                            <p className="text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                                {service.longDescription}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    className="bg-white text-gray-900 hover:bg-white/90 shadow-xl"
                                    onClick={() => router.push(service.href)}
                                >
                                    <Play className="w-5 h-5 ml-2" />
                                    ابدأ الاستخدام
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10"
                                >
                                    <Share2 className="w-5 h-5 ml-2" />
                                    مشاركة
                                </Button>
                            </div>
                        </div>
                        <div className="hidden md:flex">
                            <div className="h-40 w-40 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                <Icon className="h-20 w-20 text-white/80" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="container mx-auto px-4 -mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {service.stats.map((stat, index) => (
                        <Card key={index} className="border-0 shadow-lg">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                        <TabsTrigger value="overview" className="rounded-lg">نظرة عامة</TabsTrigger>
                        <TabsTrigger value="features" className="rounded-lg">المميزات</TabsTrigger>
                        <TabsTrigger value="pricing" className="rounded-lg">الأسعار</TabsTrigger>
                        <TabsTrigger value="faq" className="rounded-lg">الأسئلة الشائعة</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8">
                        {/* Benefits */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    الفوائد الرئيسية
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {service.benefits.map((benefit, index) => (
                                        <div key={index} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* How it Works */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    كيف تعمل الخدمة
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {service.howItWorks.map((step, index) => (
                                        <div key={index} className="relative">
                                            <div className="flex flex-col items-center text-center">
                                                <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white text-xl font-bold mb-4`}>
                                                    {step.step}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                                            </div>
                                            {index < service.howItWorks.length - 1 && (
                                                <div className="hidden md:block absolute top-7 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Features Tab */}
                    <TabsContent value="features">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {service.features.map((feature, index) => (
                                <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white mb-4`}>
                                            <feature.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Pricing Tab */}
                    <TabsContent value="pricing">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {service.pricing.map((plan, index) => (
                                <Card key={index} className={`border-0 shadow-sm relative overflow-hidden ${plan.recommended ? 'ring-2 ring-primary' : ''}`}>
                                    {plan.recommended && (
                                        <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-1 text-sm font-medium">
                                            الأكثر شيوعاً
                                        </div>
                                    )}
                                    <CardHeader className={plan.recommended ? 'pt-10' : ''}>
                                        <CardTitle>{plan.type}</CardTitle>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                                            {plan.price !== '0' && <span className="text-gray-500">ر.س/شهرياً</span>}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3 mb-6">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button className={`w-full ${plan.recommended ? `bg-gradient-to-r ${service.gradient}` : ''}`} variant={plan.recommended ? 'default' : 'outline'}>
                                            {plan.price === '0' ? 'ابدأ مجاناً' : 'اشترك الآن'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* FAQ Tab */}
                    <TabsContent value="faq">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {service.faqs.map((faq, index) => (
                                        <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-start gap-2">
                                                <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                                {faq.question}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 pr-7">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Related Services */}
                {relatedServicesData.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-primary" />
                            خدمات ذات صلة
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedServicesData.map((relatedService) => (
                                <Card
                                    key={relatedService.id}
                                    className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => router.push(`/services/${relatedService.slug}`)}
                                >
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${relatedService.gradient} flex items-center justify-center text-white`}>
                                            <relatedService.icon className="h-7 w-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{relatedService.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{relatedService.description}</p>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <Card className={`mt-12 bg-gradient-to-br ${service.gradient} text-white border-0`}>
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold mb-4">جاهز للبدء؟</h2>
                        <p className="text-white/80 mb-6 max-w-xl mx-auto">
                            ابدأ استخدام {service.title} الآن واستفد من جميع المميزات لتحسين عملك التعليمي
                        </p>
                        <Button
                            size="lg"
                            className="bg-white text-gray-900 hover:bg-white/90"
                            onClick={() => router.push(service.href)}
                        >
                            <Play className="w-5 h-5 ml-2" />
                            ابدأ الاستخدام مجاناً
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </div>
    );
}
