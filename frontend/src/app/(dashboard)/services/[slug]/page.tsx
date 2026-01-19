'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';

// تعريف الخدمات التعليمية
const servicesData: Record<string, {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  longDescription: string;
  icon: any;
  color: string;
  bgColor: string;
  features: string[];
  benefits: string[];
  howItWorks: { step: number; title: string; description: string }[];
  stats: { label: string; value: string }[];
  pricing: { type: string; price: string; features: string[] }[];
  faqs: { question: string; answer: string }[];
  relatedServices: string[];
  href: string;
}> = {
  'analyses': {
    id: 'analyses',
    title: 'تحليل النتائج',
    titleEn: 'Results Analysis',
    description: 'أدوات متقدمة لتحليل نتائج الاختبارات وقياس أداء الطلاب',
    longDescription: 'نظام تحليل النتائج الذكي يوفر لك أدوات متقدمة لتحليل نتائج الاختبارات والواجبات، مع رسوم بيانية تفاعلية وتوصيات مخصصة لتحسين أداء كل طالب. يستخدم الذكاء الاصطناعي لاكتشاف نقاط القوة والضعف وتقديم خطط علاجية مقترحة.',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    features: [
      'تحليل تفصيلي لنتائج الاختبارات',
      'رسوم بيانية تفاعلية',
      'مقارنة الأداء بين الطلاب',
      'تتبع التقدم عبر الزمن',
      'تقارير PDF احترافية',
      'توصيات ذكية لتحسين الأداء',
      'تصدير البيانات إلى Excel',
      'مشاركة التقارير مع أولياء الأمور',
    ],
    benefits: [
      'توفير الوقت في تحليل النتائج',
      'اتخاذ قرارات مبنية على البيانات',
      'تحسين أداء الطلاب بشكل مستمر',
      'تقارير احترافية جاهزة للطباعة',
    ],
    howItWorks: [
      { step: 1, title: 'إدخال البيانات', description: 'أدخل درجات الطلاب يدوياً أو استوردها من ملف Excel' },
      { step: 2, title: 'التحليل التلقائي', description: 'يقوم النظام بتحليل البيانات وإنشاء الرسوم البيانية' },
      { step: 3, title: 'التوصيات الذكية', description: 'يقدم الذكاء الاصطناعي توصيات مخصصة لكل طالب' },
      { step: 4, title: 'التصدير والمشاركة', description: 'صدّر التقارير بصيغة PDF أو شاركها مباشرة' },
    ],
    stats: [
      { label: 'تحليل مكتمل', value: '10,000+' },
      { label: 'معلم يستخدم الخدمة', value: '2,500+' },
      { label: 'دقة التوصيات', value: '95%' },
      { label: 'توفير الوقت', value: '80%' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['5 تحليلات شهرياً', 'رسوم بيانية أساسية', 'تصدير PDF'] },
      { type: 'احترافي', price: '49', features: ['تحليلات غير محدودة', 'توصيات AI', 'تصدير Excel', 'دعم فني'] },
    ],
    faqs: [
      { question: 'هل يمكنني استيراد البيانات من Excel؟', answer: 'نعم، يدعم النظام استيراد البيانات من ملفات Excel و CSV.' },
      { question: 'هل التوصيات دقيقة؟', answer: 'نعم، تعتمد التوصيات على خوارزميات ذكاء اصطناعي متقدمة بدقة 95%.' },
    ],
    relatedServices: ['plans', 'tests', 'performance'],
    href: '/analyses',
  },
  'certificates': {
    id: 'certificates',
    title: 'الشهادات والتقدير',
    titleEn: 'Certificates',
    description: 'إنشاء وتخصيص شهادات الشكر والتقدير بسهولة',
    longDescription: 'نظام إنشاء الشهادات يوفر لك مكتبة ضخمة من القوالب الاحترافية لإنشاء شهادات الشكر والتقدير والتخرج. يمكنك تخصيص كل شهادة بالألوان والخطوط والشعارات، مع إمكانية الإنشاء الجماعي لعشرات الشهادات بضغطة زر.',
    icon: Award,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    features: [
      'قوالب شهادات احترافية متعددة',
      'تخصيص كامل (ألوان، خطوط، شعارات)',
      'إنشاء جماعي للشهادات',
      'تصدير بجودة عالية (PDF, PNG)',
      'مكتبة شعارات وإطارات',
      'حفظ القوالب المخصصة',
      'مشاركة عبر البريد الإلكتروني',
      'طباعة مباشرة',
    ],
    benefits: [
      'توفير الوقت في تصميم الشهادات',
      'شهادات احترافية بدون خبرة تصميم',
      'إنشاء مئات الشهادات بسرعة',
      'تكلفة أقل من المصممين',
    ],
    howItWorks: [
      { step: 1, title: 'اختيار القالب', description: 'اختر من بين عشرات القوالب الاحترافية' },
      { step: 2, title: 'التخصيص', description: 'أضف النصوص والشعارات وخصص الألوان' },
      { step: 3, title: 'الإنشاء الجماعي', description: 'أدخل أسماء المستلمين أو استوردها من Excel' },
      { step: 4, title: 'التصدير', description: 'صدّر الشهادات بجودة عالية للطباعة' },
    ],
    stats: [
      { label: 'شهادة تم إنشاؤها', value: '50,000+' },
      { label: 'قالب متاح', value: '100+' },
      { label: 'معلم يستخدم الخدمة', value: '5,000+' },
      { label: 'تقييم المستخدمين', value: '4.9/5' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['5 شهادات شهرياً', 'قوالب أساسية', 'تصدير PDF'] },
      { type: 'احترافي', price: '29', features: ['شهادات غير محدودة', 'جميع القوالب', 'إنشاء جماعي', 'بدون علامة مائية'] },
    ],
    faqs: [
      { question: 'هل يمكنني إضافة شعار المدرسة؟', answer: 'نعم، يمكنك رفع شعار المدرسة وإضافته لجميع الشهادات.' },
      { question: 'ما هي صيغ التصدير المتاحة؟', answer: 'يمكنك التصدير بصيغة PDF أو PNG بجودة عالية للطباعة.' },
    ],
    relatedServices: ['achievements', 'performance'],
    href: '/certificates',
  },
  'plans': {
    id: 'plans',
    title: 'الخطط التعليمية',
    titleEn: 'Educational Plans',
    description: 'إعداد الخطط العلاجية والإثرائية وتوزيع المناهج',
    longDescription: 'نظام الخطط التعليمية يساعدك في إعداد خطط علاجية وإثرائية مخصصة لكل طالب، بالإضافة إلى توزيع المناهج الدراسية. يستخدم الذكاء الاصطناعي لاقتراح أنشطة وتمارين مناسبة بناءً على مستوى الطالب.',
    icon: BookOpen,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    features: [
      'خطط علاجية مخصصة',
      'خطط إثرائية للمتفوقين',
      'توزيع المناهج الدراسية',
      'اقتراحات ذكية للأنشطة',
      'متابعة تنفيذ الخطة',
      'تقارير التقدم',
      'ربط مع تحليل النتائج',
      'قوالب جاهزة للخطط',
    ],
    benefits: [
      'خطط مخصصة لكل طالب',
      'توفير وقت إعداد الخطط',
      'متابعة التقدم بسهولة',
      'تحسين نتائج الطلاب',
    ],
    howItWorks: [
      { step: 1, title: 'تحديد الطالب', description: 'اختر الطالب أو مجموعة الطلاب' },
      { step: 2, title: 'تحليل المستوى', description: 'يحلل النظام مستوى الطالب من النتائج السابقة' },
      { step: 3, title: 'إنشاء الخطة', description: 'يقترح الذكاء الاصطناعي خطة مخصصة' },
      { step: 4, title: 'المتابعة', description: 'تابع تنفيذ الخطة وسجل التقدم' },
    ],
    stats: [
      { label: 'خطة تم إنشاؤها', value: '15,000+' },
      { label: 'نسبة التحسن', value: '85%' },
      { label: 'معلم يستخدم الخدمة', value: '3,000+' },
      { label: 'رضا المستخدمين', value: '96%' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['3 خطط شهرياً', 'قوالب أساسية', 'تصدير PDF'] },
      { type: 'احترافي', price: '39', features: ['خطط غير محدودة', 'اقتراحات AI', 'متابعة التقدم', 'تقارير متقدمة'] },
    ],
    faqs: [
      { question: 'هل يمكن ربط الخطة بنتائج الطالب؟', answer: 'نعم، يمكن ربط الخطة بتحليل النتائج لإنشاء خطط مبنية على البيانات.' },
      { question: 'هل يمكن تعديل الخطة المقترحة؟', answer: 'نعم، يمكنك تعديل أي جزء من الخطة المقترحة.' },
    ],
    relatedServices: ['analyses', 'tests', 'achievements'],
    href: '/plans',
  },
  'achievements': {
    id: 'achievements',
    title: 'توثيق الإنجازات',
    titleEn: 'Achievements',
    description: 'سجل متكامل لتوثيق إنجازات المعلمين والطلاب',
    longDescription: 'نظام توثيق الإنجازات يوفر لك سجلاً متكاملاً لتوثيق جميع إنجازاتك المهنية وإنجازات طلابك. يمكنك إنشاء ملف إنجاز رقمي احترافي يشمل الشهادات والجوائز والمشاركات والتدريبات.',
    icon: Trophy,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    features: [
      'ملف إنجاز رقمي متكامل',
      'تصنيف الإنجازات حسب النوع',
      'رفع المرفقات والشهادات',
      'جدول زمني للإنجازات',
      'تقارير سنوية',
      'مشاركة الملف',
      'تصدير PDF احترافي',
      'ربط مع شواهد الأداء',
    ],
    benefits: [
      'توثيق منظم للإنجازات',
      'سهولة الوصول للشواهد',
      'ملف إنجاز جاهز للتقديم',
      'متابعة التطور المهني',
    ],
    howItWorks: [
      { step: 1, title: 'إضافة إنجاز', description: 'أضف الإنجاز مع التفاصيل والمرفقات' },
      { step: 2, title: 'التصنيف', description: 'صنف الإنجاز حسب النوع والتاريخ' },
      { step: 3, title: 'التوثيق', description: 'ارفق الشهادات والصور كشواهد' },
      { step: 4, title: 'التصدير', description: 'صدّر ملف الإنجاز كاملاً' },
    ],
    stats: [
      { label: 'إنجاز تم توثيقه', value: '100,000+' },
      { label: 'ملف إنجاز', value: '8,000+' },
      { label: 'معلم يستخدم الخدمة', value: '4,000+' },
      { label: 'تقييم المستخدمين', value: '4.8/5' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['20 إنجاز', 'تصدير PDF', 'مرفقات محدودة'] },
      { type: 'احترافي', price: '35', features: ['إنجازات غير محدودة', 'مرفقات غير محدودة', 'تقارير متقدمة', 'مشاركة'] },
    ],
    faqs: [
      { question: 'هل يمكنني رفع ملفات كبيرة؟', answer: 'نعم، يدعم النظام رفع ملفات حتى 50 ميجابايت.' },
      { question: 'هل يمكن مشاركة ملف الإنجاز؟', answer: 'نعم، يمكنك إنشاء رابط مشاركة أو تصدير PDF.' },
    ],
    relatedServices: ['certificates', 'performance'],
    href: '/achievements',
  },
  'performance': {
    id: 'performance',
    title: 'تقييم الأداء',
    titleEn: 'Performance Evaluation',
    description: 'تقارير أداء شاملة للمعلمين مع مؤشرات ورسوم بيانية',
    longDescription: 'نظام تقييم الأداء يوفر لك أدوات متقدمة لتقييم أدائك المهني وفق معايير محددة. يشمل مؤشرات الأداء الرئيسية ورسوم بيانية تفاعلية وتقارير شاملة يمكن تقديمها للإدارة.',
    icon: Star,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    features: [
      'تقييم ذاتي شامل',
      'مؤشرات أداء رئيسية (KPIs)',
      'رسوم بيانية تفاعلية',
      'مقارنة مع الفترات السابقة',
      'تقارير للإدارة',
      'ربط مع الإنجازات',
      'توصيات للتحسين',
      'تصدير PDF احترافي',
    ],
    benefits: [
      'تقييم موضوعي للأداء',
      'تحديد نقاط التحسين',
      'تقارير جاهزة للإدارة',
      'متابعة التطور المهني',
    ],
    howItWorks: [
      { step: 1, title: 'اختيار المعايير', description: 'اختر معايير التقييم المناسبة' },
      { step: 2, title: 'إدخال البيانات', description: 'أدخل بيانات الأداء والشواهد' },
      { step: 3, title: 'التحليل', description: 'يحلل النظام الأداء ويحسب المؤشرات' },
      { step: 4, title: 'التقرير', description: 'احصل على تقرير شامل مع توصيات' },
    ],
    stats: [
      { label: 'تقييم مكتمل', value: '20,000+' },
      { label: 'معلم يستخدم الخدمة', value: '6,000+' },
      { label: 'نسبة الرضا', value: '94%' },
      { label: 'تحسن الأداء', value: '78%' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['تقييم واحد شهرياً', 'تقرير أساسي', 'تصدير PDF'] },
      { type: 'احترافي', price: '45', features: ['تقييمات غير محدودة', 'تقارير متقدمة', 'توصيات AI', 'مقارنات'] },
    ],
    faqs: [
      { question: 'ما هي المعايير المستخدمة؟', answer: 'نستخدم معايير وزارة التعليم بالإضافة لمعايير مخصصة.' },
      { question: 'هل يمكن تقديم التقرير للإدارة؟', answer: 'نعم، التقارير مصممة لتقديمها للإدارة مباشرة.' },
    ],
    relatedServices: ['achievements', 'analyses'],
    href: '/performance',
  },
  'tests': {
    id: 'tests',
    title: 'الاختبارات الإلكترونية',
    titleEn: 'Electronic Tests',
    description: 'إنشاء وإدارة الاختبارات الإلكترونية مع تصحيح تلقائي',
    longDescription: 'نظام الاختبارات الإلكترونية يمكنك من إنشاء اختبارات متنوعة (اختيار من متعدد، صح/خطأ، مقالي) مع تصحيح تلقائي وتحليل للنتائج. يدعم بنك الأسئلة وإنشاء اختبارات عشوائية.',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    features: [
      'أنواع أسئلة متعددة',
      'تصحيح تلقائي فوري',
      'بنك أسئلة متكامل',
      'اختبارات عشوائية',
      'تحديد وقت الاختبار',
      'تحليل النتائج',
      'تقارير تفصيلية',
      'مشاركة مع الطلاب',
    ],
    benefits: [
      'توفير وقت التصحيح',
      'نتائج فورية ودقيقة',
      'تحليل شامل للأداء',
      'سهولة إنشاء الاختبارات',
    ],
    howItWorks: [
      { step: 1, title: 'إنشاء الاختبار', description: 'أنشئ الاختبار وأضف الأسئلة' },
      { step: 2, title: 'الإعدادات', description: 'حدد الوقت والدرجات والإعدادات' },
      { step: 3, title: 'المشاركة', description: 'شارك رابط الاختبار مع الطلاب' },
      { step: 4, title: 'النتائج', description: 'احصل على النتائج والتحليل فوراً' },
    ],
    stats: [
      { label: 'اختبار تم إنشاؤه', value: '30,000+' },
      { label: 'طالب أدى الاختبارات', value: '200,000+' },
      { label: 'معلم يستخدم الخدمة', value: '7,000+' },
      { label: 'دقة التصحيح', value: '100%' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['5 اختبارات شهرياً', '50 طالب/اختبار', 'تصحيح تلقائي'] },
      { type: 'احترافي', price: '55', features: ['اختبارات غير محدودة', 'طلاب غير محدودين', 'بنك أسئلة', 'تحليل متقدم'] },
    ],
    faqs: [
      { question: 'هل يدعم الأسئلة المقالية؟', answer: 'نعم، مع إمكانية التصحيح اليدوي أو بمساعدة AI.' },
      { question: 'هل يمكن منع الغش؟', answer: 'نعم، يوفر النظام عدة خيارات لمنع الغش.' },
    ],
    relatedServices: ['analyses', 'plans'],
    href: '/tests',
  },
  'ai-assistant': {
    id: 'ai-assistant',
    title: 'المساعد الذكي',
    titleEn: 'AI Assistant',
    description: 'مساعد ذكي يساعدك في جميع مهامك التعليمية',
    longDescription: 'المساعد الذكي هو رفيقك في رحلتك التعليمية. يمكنه مساعدتك في إعداد الدروس، كتابة التقارير، اقتراح الأنشطة، الإجابة على أسئلتك، وأكثر من ذلك. يتعلم من تفاعلاتك ليقدم لك تجربة مخصصة.',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    features: [
      'محادثة ذكية طبيعية',
      'إعداد الدروس والأنشطة',
      'كتابة التقارير',
      'اقتراحات مخصصة',
      'إجابة الأسئلة التعليمية',
      'تلخيص المحتوى',
      'ترجمة النصوص',
      'تعلم من تفاعلاتك',
    ],
    benefits: [
      'توفير الوقت والجهد',
      'أفكار إبداعية جديدة',
      'مساعدة فورية 24/7',
      'تحسين جودة العمل',
    ],
    howItWorks: [
      { step: 1, title: 'ابدأ المحادثة', description: 'اكتب سؤالك أو طلبك بلغة طبيعية' },
      { step: 2, title: 'الفهم', description: 'يفهم المساعد طلبك ويحلله' },
      { step: 3, title: 'الاستجابة', description: 'يقدم لك إجابة أو محتوى مخصص' },
      { step: 4, title: 'التحسين', description: 'يمكنك طلب تعديلات أو توضيحات' },
    ],
    stats: [
      { label: 'محادثة تمت', value: '500,000+' },
      { label: 'معلم يستخدم الخدمة', value: '10,000+' },
      { label: 'رضا المستخدمين', value: '97%' },
      { label: 'وقت الاستجابة', value: '<2 ثانية' },
    ],
    pricing: [
      { type: 'مجاني', price: '0', features: ['20 رسالة يومياً', 'ميزات أساسية'] },
      { type: 'احترافي', price: '59', features: ['رسائل غير محدودة', 'جميع الميزات', 'أولوية الاستجابة', 'حفظ المحادثات'] },
    ],
    faqs: [
      { question: 'هل المساعد يفهم العربية؟', answer: 'نعم، المساعد يفهم العربية بطلاقة ويمكنه الكتابة بها.' },
      { question: 'هل يمكنه إعداد درس كامل؟', answer: 'نعم، يمكنه إعداد خطة درس كاملة مع الأنشطة والتقييم.' },
    ],
    relatedServices: ['plans', 'analyses', 'certificates'],
    href: '/ai-assistant',
  },
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState('overview');

  const service = servicesData[slug];

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">الخدمة غير موجودة</h1>
        <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على هذه الخدمة</p>
        <Button onClick={() => router.push('/services')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للخدمات
        </Button>
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="space-y-8 pb-10" dir="rtl">
      {/* Hero Section */}
      <div className={`${service.bgColor} rounded-3xl p-8 md:p-12 relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className={`w-20 h-20 ${service.bgColor} border-4 border-white rounded-2xl flex items-center justify-center shadow-lg`}>
            <Icon className={`w-10 h-10 ${service.color}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                {service.title}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {service.titleEn}
              </Badge>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              {service.longDescription}
            </p>
          </div>

          <div className="flex gap-3">
            <Button size="lg" className="rounded-full" asChild>
              <Link href={service.href}>
                <Play className="w-5 h-5 ml-2" />
                ابدأ الآن
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {service.stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <p className={`text-3xl font-black ${service.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl">نظرة عامة</TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl">المميزات</TabsTrigger>
          <TabsTrigger value="how-it-works" className="rounded-xl">كيف يعمل</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl">الأسعار</TabsTrigger>
          <TabsTrigger value="faq" className="rounded-xl">الأسئلة الشائعة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  المميزات الرئيسية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${service.color.replace('text-', 'bg-')}`} />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  الفوائد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {service.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {service.features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 ${service.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <CheckCircle2 className={`w-6 h-6 ${service.color}`} />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="how-it-works" className="mt-6">
          <div className="grid md:grid-cols-4 gap-6">
            {service.howItWorks.map((step, index) => (
              <div key={index} className="relative">
                {index < service.howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -translate-x-1/2" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 ${service.bgColor} rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-gray-900 shadow-lg`}>
                    <span className={`text-2xl font-black ${service.color}`}>{step.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {service.pricing.map((plan, index) => (
              <Card key={index} className={index === 1 ? 'border-2 border-primary relative' : ''}>
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">الأكثر شيوعاً</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.type}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                    {plan.price !== '0' && <span className="text-gray-500 mr-1">ر.س/شهر</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6 rounded-full" variant={index === 1 ? 'default' : 'outline'}>
                    {plan.price === '0' ? 'ابدأ مجاناً' : 'اشترك الآن'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {service.faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 pr-7">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Services */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">خدمات ذات صلة</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {service.relatedServices.map((relatedSlug) => {
            const related = servicesData[relatedSlug];
            if (!related) return null;
            const RelatedIcon = related.icon;
            return (
              <Link key={relatedSlug} href={`/services/${relatedSlug}`}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className={`w-12 h-12 ${related.bgColor} rounded-xl flex items-center justify-center`}>
                      <RelatedIcon className={`w-6 h-6 ${related.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{related.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{related.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Card className={`${service.bgColor} border-none`}>
        <CardContent className="py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            جاهز للبدء مع {service.title}؟
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
            انضم لآلاف المعلمين الذين يستخدمون هذه الخدمة لتحسين أدائهم وتوفير وقتهم
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="rounded-full" asChild>
              <Link href={service.href}>
                ابدأ الآن مجاناً
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full">
              تواصل معنا
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
