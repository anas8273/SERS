'use client';

import { useEffect, useState } from 'react';
import { ServiceCard } from './ServiceCard';
import {
    BarChart3, Award, ClipboardList, Trophy, FileText, Bot,
    Target, Sparkles, Calendar, GraduationCap, Users, BookOpen,
    FolderArchive, ClipboardCheck, ScrollText, Lightbulb, CalendarDays,
    FolderOpen, FileQuestion,
} from 'lucide-react';
import type { ServiceDefinition } from '@/types';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, any> = {
    'BarChart3': BarChart3, 'Award': Award, 'ClipboardList': ClipboardList,
    'Trophy': Trophy, 'FileText': FileText, 'Bot': Bot, 'Target': Target,
    'Sparkles': Sparkles, 'Calendar': Calendar, 'GraduationCap': GraduationCap,
    'Users': Users, 'BookOpen': BookOpen, 'FolderArchive': FolderArchive,
    'ClipboardCheck': ClipboardCheck, 'ScrollText': ScrollText,
    'Lightbulb': Lightbulb, 'CalendarDays': CalendarDays,
    'FolderOpen': FolderOpen, 'FileQuestion': FileQuestion,
};

// Color mapping from Firestore color classes to card-friendly colors
const COLOR_MAP: Record<string, string> = {
    'bg-blue-500': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'bg-amber-500': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    'bg-green-500': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    'bg-teal-500': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    'bg-purple-500': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'bg-rose-500': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    'bg-red-500': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    'bg-sky-500': 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    'bg-yellow-500': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    'bg-emerald-500': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    'bg-cyan-500': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    'bg-indigo-500': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    'bg-orange-500': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
};

// Fallback services (used when Firestore is empty/unavailable)
// All routes point to /services/[slug] - the dynamic storefront
const FALLBACK_SERVICES: ServiceCardData[] = [
    {
        title: 'تحليل النتائج',
        description: 'تحليل شامل لنتائج الاختبارات مع رسوم بيانية وتوصيات ذكية للتحسين',
        icon: BarChart3,
        href: '/services/analyses',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        features: ['تحليل تلقائي', 'رسوم بيانية', 'تقارير PDF'],
        isAI: true,
    },
    {
        title: 'الشهادات والتقدير',
        description: 'إنشاء شهادات شكر وتقدير احترافية بتصاميم متنوعة وقابلة للتخصيص',
        icon: Award,
        href: '/services/certificates',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
        features: ['قوالب متنوعة', 'تخصيص كامل', 'تصدير متعدد'],
        badge: 'الأكثر استخداماً',
    },
    {
        title: 'الخطط العلاجية',
        description: 'إنشاء خطط علاجية مخصصة للطلاب المتعثرين مع متابعة التقدم',
        icon: Target,
        href: '/services/remedial-plans',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        features: ['تشخيص ذكي', 'متابعة التقدم', 'تقارير دورية'],
        isAI: true,
    },
    {
        title: 'الخطط الإثرائية',
        description: 'خطط إثرائية للطلاب المتفوقين لتنمية مهاراتهم وقدراتهم',
        icon: Sparkles,
        href: '/services/enrichment-plans',
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        features: ['أنشطة متقدمة', 'تحديات ذكية', 'مشاريع إبداعية'],
        isNew: true,
    },
    {
        title: 'توزيع المنهج',
        description: 'توزيع المنهج الدراسي على الأسابيع مع مراعاة الإجازات والمناسبات',
        icon: Calendar,
        href: '/services/curriculum-distribution',
        color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
        features: ['توزيع تلقائي', 'مرونة التعديل', 'طباعة جاهزة'],
    },
    {
        title: 'توثيق الإنجازات',
        description: 'توثيق الإنجازات اليومية والأسبوعية والشهرية بشكل منظم',
        icon: Trophy,
        href: '/services/achievements',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        features: ['توثيق سهل', 'أرشفة ذكية', 'مشاركة سريعة'],
    },
    {
        title: 'تقييم الأداء',
        description: 'إنشاء تقارير أداء شاملة للمعلمين والطلاب مع مؤشرات قياس',
        icon: FileText,
        href: '/services/performance-evaluation',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        features: ['مؤشرات أداء', 'تقارير مفصلة', 'مقارنات'],
        isAI: true,
    },
    {
        title: 'المساعد الذكي',
        description: 'مساعد ذكي يساعدك في إنجاز مهامك التعليمية بسرعة وكفاءة',
        icon: Bot,
        href: '/ai-assistant',
        color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        features: ['محادثة ذكية', 'اقتراحات فورية', 'تعلم مستمر'],
        isNew: true,
        isAI: true,
    },
];

interface ServiceCardData {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
    features: string[];
    isNew?: boolean;
    isAI?: boolean;
    badge?: string;
}

function mapFirestoreToCard(service: ServiceDefinition): ServiceCardData {
    const icon = ICON_MAP[service.icon] || FileText;
    const color = COLOR_MAP[service.color] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    const features = service.features?.slice(0, 3).map(f =>
        typeof f === 'string' ? f : f.title_ar
    ) || [];

    return {
        title: service.name_ar,
        description: service.description_ar,
        icon,
        href: service.route || `/services/${service.slug}`,
        color,
        features,
        isNew: service.is_new || false,
        isAI: service.category === 'ai' || service.is_premium || false,
        badge: service.is_popular ? 'شائع' : undefined,
    };
}

export function ServicesSection() {
    const [cardData, setCardData] = useState<ServiceCardData[]>(FALLBACK_SERVICES);
    const [totalServices, setTotalServices] = useState(50);

    useEffect(() => {
        const loadFromFirestore = async () => {
            try {
                const { getServices } = await import('@/lib/firestore-service');
                const firestoreServices = await getServices();
                if (firestoreServices && firestoreServices.length > 0) {
                    // Show first 8 services on homepage
                    const mapped = firestoreServices.slice(0, 8).map(mapFirestoreToCard);
                    setCardData(mapped);
                    setTotalServices(firestoreServices.length);
                }
            } catch (error) {
                console.log('Using fallback services for homepage');
            }
        };
        loadFromFirestore();
    }, []);

    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>خدمات تعليمية متكاملة</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        كل ما تحتاجه في مكان واحد
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        مجموعة شاملة من الأدوات والخدمات التعليمية المدعومة بالذكاء الاصطناعي
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cardData.map((service, index) => (
                        <ServiceCard key={index} {...service} />
                    ))}
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="text-4xl font-black text-primary mb-2">+{totalServices}</div>
                        <div className="text-gray-500 dark:text-gray-400">خدمة تعليمية</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-black text-primary mb-2">+1000</div>
                        <div className="text-gray-500 dark:text-gray-400">قالب جاهز</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-black text-primary mb-2">+10K</div>
                        <div className="text-gray-500 dark:text-gray-400">مستخدم نشط</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-black text-primary mb-2">4.9</div>
                        <div className="text-gray-500 dark:text-gray-400">تقييم المستخدمين</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
