'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import type { ServiceDefinition, ServiceFeature } from '@/types';

// ===== Available Icons for selection =====
const AVAILABLE_ICONS = [
    'BarChart3', 'Award', 'ClipboardList', 'Trophy', 'FileQuestion', 'Bot',
    'FileText', 'Users', 'GraduationCap', 'Target', 'BookOpen', 'Calendar',
    'Star', 'Sparkles', 'TrendingUp', 'Zap', 'Clock', 'Shield', 'Layers',
    'FolderOpen', 'Briefcase', 'Settings', 'Play', 'FileSpreadsheet',
    'FolderArchive', 'CalendarDays', 'ClipboardCheck', 'ScrollText', 'Brain',
    'Lightbulb', 'LayoutGrid',
];

// ===== Available Categories =====
const CATEGORIES = [
    { id: 'analysis', name: 'التحليل والتقييم', color: 'bg-blue-500' },
    { id: 'documents', name: 'الوثائق والشهادات', color: 'bg-amber-500' },
    { id: 'planning', name: 'التخطيط والإدارة', color: 'bg-green-500' },
    { id: 'records', name: 'السجلات والتوثيق', color: 'bg-purple-500' },
    { id: 'ai', name: 'الذكاء الاصطناعي', color: 'bg-indigo-500' },
];

// ===== Available Gradients =====
const GRADIENTS = [
    'from-blue-500 to-blue-600', 'from-amber-500 to-orange-500',
    'from-green-500 to-emerald-500', 'from-teal-500 to-cyan-500',
    'from-purple-500 to-violet-500', 'from-rose-500 to-pink-500',
    'from-red-500 to-rose-500', 'from-sky-500 to-blue-500',
    'from-yellow-500 to-amber-500', 'from-emerald-500 to-green-500',
    'from-cyan-500 to-teal-500', 'from-indigo-500 to-purple-600',
    'from-orange-500 to-amber-500',
];

// ===== Default services for seeding =====
const DEFAULT_SERVICES: Omit<ServiceDefinition, 'id'>[] = [
    {
        slug: 'analyses', category: 'analysis', name_ar: 'تحليل النتائج', name_en: 'Results Analysis',
        description_ar: 'تحليل نتائج الاختبارات واستخراج التقارير والإحصائيات التفصيلية مع رسوم بيانية تفاعلية',
        description_en: 'Analyze test results with detailed reports and interactive charts',
        icon: 'BarChart3', color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600',
        route: '/analyses', features: [], is_active: true, sort_order: 1,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        slug: 'certificates', category: 'documents', name_ar: 'الشهادات والتقدير', name_en: 'Certificates',
        description_ar: 'إنشاء شهادات الشكر والتقدير والتخرج بتصاميم احترافية متعددة مع إنشاء جماعي',
        description_en: 'Create professional certificates with batch generation',
        icon: 'Award', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500',
        route: '/certificates', features: [], is_active: true, sort_order: 2,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        slug: 'plans', category: 'planning', name_ar: 'الخطط التعليمية', name_en: 'Educational Plans',
        description_ar: 'إنشاء الخطط العلاجية والإثرائية وتوزيع المنهج مع متابعة التنفيذ',
        description_en: 'Create remedial and enrichment plans',
        icon: 'ClipboardList', color: 'bg-green-500', gradient: 'from-green-500 to-emerald-500',
        route: '/plans', features: [], is_active: true, sort_order: 3,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        slug: 'distributions', category: 'planning', name_ar: 'التوزيعات', name_en: 'Distributions',
        description_ar: 'إعداد توزيعات المنهج الأسبوعية والشهرية والفصلية',
        description_en: 'Prepare curriculum distributions',
        icon: 'CalendarDays', color: 'bg-teal-500', gradient: 'from-teal-500 to-cyan-500',
        route: '/distributions', features: [], is_active: true, sort_order: 4,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        slug: 'achievements', category: 'records', name_ar: 'توثيق الإنجازات', name_en: 'Achievements',
        description_ar: 'توثيق الإنجازات اليومية والأسبوعية والشهرية',
        description_en: 'Document daily, weekly, and monthly achievements',
        icon: 'Trophy', color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500',
        route: '/achievements', features: [], is_active: true, sort_order: 5,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: false, is_premium: false,
    },
    {
        slug: 'portfolio', category: 'records', name_ar: 'ملف الإنجاز', name_en: 'Portfolio',
        description_ar: 'ملف إنجاز رقمي شامل يجمع جميع الشهادات والإنجازات',
        description_en: 'Comprehensive digital portfolio',
        icon: 'FolderArchive', color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-500',
        route: '/portfolio', features: [], is_active: true, sort_order: 6,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: true, is_premium: false,
    },
    {
        slug: 'performance', category: 'analysis', name_ar: 'تقييم الأداء', name_en: 'Performance Evaluation',
        description_ar: 'إدارة تقييمات الأداء الوظيفي وشواهد الأداء للمعلمين',
        description_en: 'Manage performance evaluations with KPIs',
        icon: 'Target', color: 'bg-red-500', gradient: 'from-red-500 to-rose-500',
        route: '/work-evidence', features: [], is_active: true, sort_order: 7,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
    {
        slug: 'work-evidence', category: 'records', name_ar: 'شواهد الأداء الوظيفي', name_en: 'Work Evidence',
        description_ar: 'توثيق شواهد الأداء الوظيفي الـ 11 بند المعتمدة',
        description_en: 'Document the 11 approved work performance evidence items',
        icon: 'ClipboardCheck', color: 'bg-sky-500', gradient: 'from-sky-500 to-blue-500',
        route: '/work-evidence', features: [], is_active: true, sort_order: 8,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        slug: 'knowledge-production', category: 'records', name_ar: 'الإنتاج المعرفي', name_en: 'Knowledge Production',
        description_ar: 'توثيق وإدارة الإنتاج المعرفي للمعلم',
        description_en: 'Document knowledge production',
        icon: 'Lightbulb', color: 'bg-yellow-500', gradient: 'from-yellow-500 to-amber-500',
        route: '/knowledge-production', features: [], is_active: true, sort_order: 9,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        slug: 'follow-up-log', category: 'records', name_ar: 'سجل المتابعة', name_en: 'Follow-up Log',
        description_ar: 'سجل متابعة شامل لتوثيق الزيارات والملاحظات',
        description_en: 'Comprehensive follow-up log',
        icon: 'ScrollText', color: 'bg-emerald-500', gradient: 'from-emerald-500 to-green-500',
        route: '/follow-up-log', features: [], is_active: true, sort_order: 10,
        requires_auth: false, requires_subscription: false,
        is_new: true, is_popular: false, is_premium: false,
    },
    {
        slug: 'tests', category: 'analysis', name_ar: 'الاختبارات', name_en: 'Tests & Exams',
        description_ar: 'إنشاء وإدارة الاختبارات وتسجيل درجات الطلاب',
        description_en: 'Create and manage tests with question bank',
        icon: 'FileQuestion', color: 'bg-cyan-500', gradient: 'from-cyan-500 to-teal-500',
        route: '/tests', features: [], is_active: true, sort_order: 11,
        requires_auth: false, requires_subscription: false,
        is_new: false, is_popular: false, is_premium: false,
    },
    {
        slug: 'ai-assistant', category: 'ai', name_ar: 'المساعد الذكي', name_en: 'AI Assistant',
        description_ar: 'مساعد ذكي يساعدك في إعداد الخطط والتقارير',
        description_en: 'AI assistant for plans and reports',
        icon: 'Bot', color: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-600',
        route: '/ai-assistant', features: [], is_active: true, sort_order: 12,
        requires_auth: false, requires_subscription: true,
        is_new: false, is_popular: true, is_premium: true,
    },
    {
        slug: 'my-templates', category: 'documents', name_ar: 'قوالبي المحفوظة', name_en: 'My Templates',
        description_ar: 'إدارة القوالب المحفوظة والمشتراة والمفضلة',
        description_en: 'Manage saved and purchased templates',
        icon: 'FolderOpen', color: 'bg-orange-500', gradient: 'from-orange-500 to-amber-500',
        route: '/marketplace', features: [], is_active: true, sort_order: 13,
        requires_auth: true, requires_subscription: false,
        is_new: false, is_popular: true, is_premium: false,
    },
];

interface FormData {
    slug: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    icon: string;
    color: string;
    gradient: string;
    category: string;
    route: string;
    is_active: boolean;
    is_new: boolean;
    is_popular: boolean;
    is_premium: boolean;
    requires_auth: boolean;
    requires_subscription: boolean;
    sort_order: number;
}

const INITIAL_FORM: FormData = {
    slug: '', name_ar: '', name_en: '', description_ar: '', description_en: '',
    icon: 'FileText', color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600',
    category: 'analysis', route: '', is_active: true, is_new: false,
    is_popular: false, is_premium: false, requires_auth: false,
    requires_subscription: false, sort_order: 1,
};

export default function AdminServicesPage() {
    const [services, setServices] = useState<ServiceDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<ServiceDefinition | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedService, setExpandedService] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [activeTab, setActiveTab] = useState<'list' | 'seed'>('list');
    const [featureInput, setFeatureInput] = useState({ title_ar: '', title_en: '', description_ar: '', description_en: '' });
    const [editFeatures, setEditFeatures] = useState<ServiceFeature[]>([]);

    // Load services from Firestore
    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        try {
            const { getAllServices } = await import('@/lib/firestore-service');
            const data = await getAllServices();
            setServices(data);
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('خطأ في تحميل الخدمات');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setEditingService(null);
        setEditFeatures([]);
        setShowForm(false);
    };

    const handleEdit = (service: ServiceDefinition) => {
        setFormData({
            slug: service.slug,
            name_ar: service.name_ar,
            name_en: service.name_en,
            description_ar: service.description_ar,
            description_en: service.description_en || '',
            icon: service.icon,
            color: service.color,
            gradient: service.gradient || 'from-blue-500 to-blue-600',
            category: service.category,
            route: service.route,
            is_active: service.is_active,
            is_new: service.is_new || false,
            is_popular: service.is_popular || false,
            is_premium: service.is_premium || false,
            requires_auth: service.requires_auth,
            requires_subscription: service.requires_subscription,
            sort_order: service.sort_order,
        });
        setEditFeatures(service.features || []);
        setEditingService(service);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name_ar || !formData.slug) {
            toast.error('الاسم والمعرف مطلوبان');
            return;
        }

        setIsSaving(true);
        try {
            const serviceData: Partial<ServiceDefinition> = {
                ...formData,
                features: editFeatures,
            };

            if (editingService) {
                const { saveService } = await import('@/lib/firestore-service');
                await saveService(editingService.id, serviceData);
                toast.success('تم تحديث الخدمة بنجاح');
            } else {
                const { createService } = await import('@/lib/firestore-service');
                await createService(serviceData as Omit<ServiceDefinition, 'id'>);
                toast.success('تم إضافة الخدمة بنجاح');
            }

            resetForm();
            await loadServices();
        } catch (error: any) {
            console.error('Error saving service:', error);
            toast.error(error.message || 'حدث خطأ في الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (serviceId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

        try {
            const { deleteService } = await import('@/lib/firestore-service');
            await deleteService(serviceId);
            toast.success('تم حذف الخدمة');
            await loadServices();
        } catch (error) {
            toast.error('خطأ في حذف الخدمة');
        }
    };

    const toggleVisibility = async (service: ServiceDefinition) => {
        try {
            const { saveService } = await import('@/lib/firestore-service');
            await saveService(service.id, { is_active: !service.is_active });
            toast.success(service.is_active ? 'تم إخفاء الخدمة' : 'تم تفعيل الخدمة');
            await loadServices();
        } catch (error) {
            toast.error('خطأ في تحديث الحالة');
        }
    };

    const seedDefaultServices = async () => {
        if (!confirm('سيتم إضافة 13 خدمة افتراضية إلى Firestore. هل تريد المتابعة؟')) return;

        setIsSaving(true);
        try {
            const { createService } = await import('@/lib/firestore-service');
            let count = 0;
            for (const service of DEFAULT_SERVICES) {
                // Check if service with same slug exists
                const exists = services.find(s => s.slug === service.slug);
                if (!exists) {
                    await createService(service as Omit<ServiceDefinition, 'id'>);
                    count++;
                }
            }
            toast.success(`تم إضافة ${count} خدمة بنجاح`);
            await loadServices();
        } catch (error) {
            toast.error('خطأ في إضافة الخدمات الافتراضية');
        } finally {
            setIsSaving(false);
        }
    };

    const addFeature = () => {
        if (!featureInput.title_ar) return;
        setEditFeatures([...editFeatures, {
            ...featureInput,
            icon: 'CheckCircle',
        }]);
        setFeatureInput({ title_ar: '', title_en: '', description_ar: '', description_en: '' });
    };

    const removeFeature = (index: number) => {
        setEditFeatures(editFeatures.filter((_, i) => i !== index));
    };

    const filteredServices = services.filter(s =>
        !searchQuery ||
        s.name_ar.includes(searchQuery) ||
        s.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-2xl">🎓</span> إدارة الخدمات التعليمية
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        إضافة وتعديل وتنظيم الخدمات التعليمية ({services.length} خدمة)
                        {services.length > 0 && (
                            <Badge className="mr-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Firestore
                            </Badge>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white">
                        <span className="ml-1">+</span> خدمة جديدة
                    </Button>
                    {services.length === 0 && (
                        <Button onClick={seedDefaultServices} variant="outline" disabled={isSaving}>
                            <span className="ml-1">🌱</span> {isSaving ? 'جاري الإضافة...' : 'إضافة الخدمات الافتراضية'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xl">🎓</div>
                    <div>
                        <p className="text-sm text-gray-500">إجمالي الخدمات</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{services.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-xl">✅</div>
                    <div>
                        <p className="text-sm text-gray-500">خدمات نشطة</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{services.filter(s => s.is_active).length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-xl">⭐</div>
                    <div>
                        <p className="text-sm text-gray-500">خدمات شائعة</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{services.filter(s => s.is_popular).length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-xl">🆕</div>
                    <div>
                        <p className="text-sm text-gray-500">خدمات جديدة</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{services.filter(s => s.is_new).length}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <Input
                    placeholder="بحث في الخدمات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-white dark:bg-gray-800 dark:border-gray-700"
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && services.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد خدمات بعد</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        يمكنك إضافة الخدمات الافتراضية أو إنشاء خدمات جديدة
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={seedDefaultServices} disabled={isSaving}>
                            🌱 {isSaving ? 'جاري الإضافة...' : 'إضافة 13 خدمة افتراضية'}
                        </Button>
                        <Button onClick={() => setShowForm(true)} variant="outline">
                            + إضافة يدوياً
                        </Button>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            {editingService ? '✏️ تعديل الخدمة' : '➕ إضافة خدمة جديدة'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم بالعربية *</label>
                                    <Input value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} required className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name in English *</label>
                                    <Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required dir="ltr" className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المعرف (Slug) *</label>
                                    <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required dir="ltr" className="dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. analyses" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المسار (Route) *</label>
                                    <Input value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} required dir="ltr" className="dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. /analyses" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف بالعربية</label>
                                <textarea rows={2} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description in English</label>
                                <textarea rows={2} dir="ltr" className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} />
                            </div>

                            {/* Category & Icon */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأيقونة</label>
                                    <select
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {AVAILABLE_ICONS.map(icon => (
                                            <option key={icon} value={icon}>{icon}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الترتيب</label>
                                    <Input type="number" min="1" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })} className="dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>

                            {/* Gradient */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التدرج اللوني</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADIENTS.map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gradient: g })}
                                            className={`h-8 w-16 rounded-lg bg-gradient-to-r ${g} ${formData.gradient === g ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Flags */}
                            <div className="grid grid-cols-3 gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">نشطة</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_new} onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })} className="w-4 h-4" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">جديدة</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_popular} onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })} className="w-4 h-4" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">شائعة</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.is_premium} onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })} className="w-4 h-4" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">مميزة</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.requires_auth} onChange={(e) => setFormData({ ...formData, requires_auth: e.target.checked })} className="w-4 h-4" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">تسجيل دخول</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.requires_subscription} onChange={(e) => setFormData({ ...formData, requires_subscription: e.target.checked })} className="w-4 h-4" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">اشتراك</span>
                                </label>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الميزات ({editFeatures.length})</label>
                                {editFeatures.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{f.title_ar}</span>
                                        <button type="button" onClick={() => removeFeature(i)} className="text-red-500 text-xs hover:text-red-700">✕</button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        placeholder="عنوان الميزة بالعربية"
                                        value={featureInput.title_ar}
                                        onChange={(e) => setFeatureInput({ ...featureInput, title_ar: e.target.value })}
                                        className="flex-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <Button type="button" onClick={addFeature} variant="outline" size="sm">+</Button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isSaving}>
                                    {isSaving ? 'جاري الحفظ...' : editingService ? 'تحديث' : 'إضافة'}
                                </Button>
                                <Button type="button" onClick={resetForm} variant="outline" className="flex-1 dark:text-gray-200 dark:border-gray-600">إلغاء</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Services List */}
            {!isLoading && (
                <div className="space-y-3">
                    {filteredServices.map((service) => (
                        <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                            <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${service.gradient || 'from-gray-500 to-gray-600'}`}
                                    >
                                        <span className="text-lg font-bold">{service.icon?.charAt(0) || '?'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{service.name_ar}</h3>
                                            <span className="text-xs text-gray-400" dir="ltr">/{service.slug}</span>
                                            {!service.is_active && (
                                                <Badge variant="outline" className="border-red-300 text-red-600 text-[10px]">مخفي</Badge>
                                            )}
                                            {service.is_new && (
                                                <Badge className="bg-green-500 text-white text-[10px]">جديد</Badge>
                                            )}
                                            {service.is_popular && (
                                                <Badge className="bg-yellow-500 text-white text-[10px]">شائع</Badge>
                                            )}
                                            {service.is_premium && (
                                                <Badge className="bg-purple-500 text-white text-[10px]">مميز</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{service.description_ar}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                            <span>التصنيف: {CATEGORIES.find(c => c.id === service.category)?.name || service.category}</span>
                                            <span>|</span>
                                            <span>المسار: {service.route}</span>
                                            <span>|</span>
                                            <span>الترتيب: {service.sort_order}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => setExpandedService(expandedService === service.id ? null : service.id)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="التفاصيل">
                                        {expandedService === service.id ? '▲' : '▼'}
                                    </button>
                                    <button onClick={() => toggleVisibility(service)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                        {service.is_active ? '👁️' : '🙈'}
                                    </button>
                                    <button onClick={() => handleEdit(service)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">✏️</button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">🗑️</button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedService === service.id && (
                                <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">المعلومات الأساسية</h4>
                                            <div className="space-y-1 text-gray-600 dark:text-gray-400">
                                                <p><strong>الاسم EN:</strong> {service.name_en}</p>
                                                <p><strong>الأيقونة:</strong> {service.icon}</p>
                                                <p><strong>اللون:</strong> {service.color}</p>
                                                <p><strong>التدرج:</strong> {service.gradient}</p>
                                                <p><strong>يتطلب تسجيل:</strong> {service.requires_auth ? 'نعم' : 'لا'}</p>
                                                <p><strong>يتطلب اشتراك:</strong> {service.requires_subscription ? 'نعم' : 'لا'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">الميزات ({service.features?.length || 0})</h4>
                                            {service.features && service.features.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {service.features.map((f, i) => (
                                                        <li key={i} className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                            <span className="text-green-500">✓</span>
                                                            {typeof f === 'string' ? f : f.title_ar}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-400">لا توجد ميزات محددة</p>
                                            )}
                                        </div>
                                    </div>
                                    {service.description_en && (
                                        <div className="mt-3 text-sm text-gray-500" dir="ltr">
                                            <strong>EN:</strong> {service.description_en}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
