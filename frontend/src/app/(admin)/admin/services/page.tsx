'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  features: string[];
  sub_services: SubService[];
}

interface SubService {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  icon: string;
  is_active: boolean;
}

// Default services data
const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: '1', name_ar: 'تحليل النتائج', name_en: 'Results Analysis', slug: 'analyses',
    description_ar: 'تحليل شامل لنتائج الطلاب مع رسوم بيانية وتوصيات',
    description_en: 'Comprehensive student results analysis with charts and recommendations',
    icon: '📊', color: '#3B82F6', is_active: true, sort_order: 1,
    features: ['تحليل فردي', 'تحليل جماعي', 'مقارنة نتائج', 'رسوم بيانية', 'توصيات ذكية'],
    sub_services: [
      { id: '1-1', name_ar: 'تحليل فردي', name_en: 'Individual Analysis', slug: 'individual', description_ar: 'تحليل نتائج طالب واحد', icon: '👤', is_active: true },
      { id: '1-2', name_ar: 'تحليل جماعي', name_en: 'Group Analysis', slug: 'group', description_ar: 'تحليل نتائج مجموعة طلاب', icon: '👥', is_active: true },
      { id: '1-3', name_ar: 'تحليل مقارن', name_en: 'Comparative Analysis', slug: 'comparative', description_ar: 'مقارنة نتائج بين فترات', icon: '📈', is_active: true },
    ],
  },
  {
    id: '2', name_ar: 'الشهادات والتقدير', name_en: 'Certificates', slug: 'certificates',
    description_ar: 'إنشاء شهادات تقدير وتميز احترافية',
    description_en: 'Create professional appreciation and excellence certificates',
    icon: '🏆', color: '#F59E0B', is_active: true, sort_order: 2,
    features: ['شهادات تقدير', 'شهادات تميز', 'شهادات حضور', 'شهادات إنجاز', 'تصاميم متعددة'],
    sub_services: [
      { id: '2-1', name_ar: 'شهادة تقدير', name_en: 'Appreciation Certificate', slug: 'appreciation', description_ar: 'شهادة تقدير للطلاب المتميزين', icon: '⭐', is_active: true },
      { id: '2-2', name_ar: 'شهادة حضور', name_en: 'Attendance Certificate', slug: 'attendance', description_ar: 'شهادة حضور دورة أو فعالية', icon: '📋', is_active: true },
      { id: '2-3', name_ar: 'شهادة إنجاز', name_en: 'Achievement Certificate', slug: 'achievement', description_ar: 'شهادة إنجاز لإتمام مهمة', icon: '🏅', is_active: true },
    ],
  },
  {
    id: '3', name_ar: 'الخطط التعليمية', name_en: 'Educational Plans', slug: 'plans',
    description_ar: 'إنشاء خطط تعليمية أسبوعية وشهرية وسنوية',
    description_en: 'Create weekly, monthly, and yearly educational plans',
    icon: '📝', color: '#10B981', is_active: true, sort_order: 3,
    features: ['خطة أسبوعية', 'خطة شهرية', 'خطة سنوية', 'توزيع المنهج', 'خطة علاجية'],
    sub_services: [
      { id: '3-1', name_ar: 'خطة أسبوعية', name_en: 'Weekly Plan', slug: 'weekly', description_ar: 'تخطيط أسبوعي للدروس', icon: '📅', is_active: true },
      { id: '3-2', name_ar: 'توزيع المنهج', name_en: 'Curriculum Distribution', slug: 'curriculum', description_ar: 'توزيع المنهج على الفصل الدراسي', icon: '📚', is_active: true },
      { id: '3-3', name_ar: 'خطة علاجية', name_en: 'Remedial Plan', slug: 'remedial', description_ar: 'خطة علاجية للطلاب المتأخرين', icon: '🩺', is_active: true },
    ],
  },
  {
    id: '4', name_ar: 'توثيق الإنجازات', name_en: 'Achievement Documentation', slug: 'achievements',
    description_ar: 'توثيق وأرشفة الإنجازات التعليمية والمهنية',
    description_en: 'Document and archive educational and professional achievements',
    icon: '📂', color: '#8B5CF6', is_active: true, sort_order: 4,
    features: ['ملف إنجاز', 'سجل مهني', 'إنتاج معرفي', 'توثيق فعاليات'],
    sub_services: [
      { id: '4-1', name_ar: 'ملف الإنجاز', name_en: 'Portfolio', slug: 'portfolio', description_ar: 'ملف إنجاز شامل', icon: '📁', is_active: true },
      { id: '4-2', name_ar: 'سجل مهني', name_en: 'Professional Record', slug: 'professional', description_ar: 'سجل الأداء المهني', icon: '💼', is_active: true },
      { id: '4-3', name_ar: 'إنتاج معرفي', name_en: 'Knowledge Production', slug: 'knowledge', description_ar: 'توثيق الإنتاج المعرفي', icon: '💡', is_active: true },
    ],
  },
  {
    id: '5', name_ar: 'تقييم الأداء', name_en: 'Performance Evaluation', slug: 'evaluations',
    description_ar: 'أدوات تقييم أداء الطلاب والمعلمين',
    description_en: 'Student and teacher performance evaluation tools',
    icon: '📋', color: '#EC4899', is_active: true, sort_order: 5,
    features: ['تقييم طلاب', 'تقييم معلمين', 'استبيانات', 'تقارير أداء'],
    sub_services: [
      { id: '5-1', name_ar: 'تقييم الطلاب', name_en: 'Student Evaluation', slug: 'students', description_ar: 'تقييم أداء الطلاب', icon: '👨‍🎓', is_active: true },
      { id: '5-2', name_ar: 'تقييم المعلمين', name_en: 'Teacher Evaluation', slug: 'teachers', description_ar: 'تقييم أداء المعلمين', icon: '👨‍🏫', is_active: true },
    ],
  },
  {
    id: '6', name_ar: 'الاختبارات', name_en: 'Tests', slug: 'tests',
    description_ar: 'إنشاء اختبارات وأسئلة تعليمية',
    description_en: 'Create educational tests and questions',
    icon: '📝', color: '#06B6D4', is_active: true, sort_order: 6,
    features: ['اختبارات قصيرة', 'اختبارات نهائية', 'بنك أسئلة', 'تصحيح تلقائي'],
    sub_services: [],
  },
  {
    id: '7', name_ar: 'المساعد الذكي', name_en: 'AI Assistant', slug: 'ai-assistant',
    description_ar: 'مساعد ذكي يعمل بالذكاء الاصطناعي',
    description_en: 'AI-powered smart assistant',
    icon: '🤖', color: '#6366F1', is_active: true, sort_order: 7,
    features: ['إنشاء محتوى', 'تلخيص', 'ترجمة', 'تصحيح لغوي'],
    sub_services: [],
  },
  {
    id: '8', name_ar: 'سجلات المتابعة', name_en: 'Follow-up Records', slug: 'records',
    description_ar: 'سجلات متابعة الطلاب والحضور والسلوك',
    description_en: 'Student follow-up, attendance, and behavior records',
    icon: '📋', color: '#F97316', is_active: true, sort_order: 8,
    features: ['سجل حضور', 'سجل سلوك', 'سجل متابعة', 'سجل واجبات'],
    sub_services: [
      { id: '8-1', name_ar: 'سجل الحضور', name_en: 'Attendance Record', slug: 'attendance', description_ar: 'متابعة حضور وغياب الطلاب', icon: '✅', is_active: true },
      { id: '8-2', name_ar: 'سجل السلوك', name_en: 'Behavior Record', slug: 'behavior', description_ar: 'متابعة سلوك الطلاب', icon: '📌', is_active: true },
      { id: '8-3', name_ar: 'سجل الواجبات', name_en: 'Homework Record', slug: 'homework', description_ar: 'متابعة تسليم الواجبات', icon: '📝', is_active: true },
    ],
  },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    icon: '📚',
    color: '#3B82F6',
    is_active: true,
  });

  // Try to load from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await api.get('/admin/services');
        if (response.success && response.data?.length > 0) {
          setServices(response.data);
        }
      } catch (error) {
        console.log('Using default services data');
      }
    };
    loadServices();
  }, []);

  const resetForm = () => {
    setFormData({ name_ar: '', name_en: '', description_ar: '', description_en: '', icon: '📚', color: '#3B82F6', is_active: true });
    setEditingService(null);
    setShowForm(false);
  };

  const handleEdit = (service: ServiceItem) => {
    setFormData({
      name_ar: service.name_ar,
      name_en: service.name_en,
      description_ar: service.description_ar,
      description_en: service.description_en,
      icon: service.icon,
      color: service.color,
      is_active: service.is_active,
    });
    setEditingService(service);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...formData } : s));
        toast.success('تم تحديث الخدمة بنجاح');
      } else {
        const newService: ServiceItem = {
          id: `${Date.now()}`,
          ...formData,
          slug: formData.name_en.toLowerCase().replace(/\s+/g, '-'),
          sort_order: services.length + 1,
          features: [],
          sub_services: [],
        };
        setServices([...services, newService]);
        toast.success('تم إضافة الخدمة بنجاح');
      }
      resetForm();

      // Try to save to API
      try {
        await api.post('/admin/services/sync', { services });
      } catch (e) { /* API may not exist yet */ }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleDelete = (serviceId: string) => {
    setServices(services.filter(s => s.id !== serviceId));
    toast.success('تم حذف الخدمة');
  };

  const toggleVisibility = (serviceId: string) => {
    setServices(services.map(s =>
      s.id === serviceId ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const filteredServices = services.filter(s =>
    !searchQuery ||
    s.name_ar.includes(searchQuery) ||
    s.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🎓 إدارة الخدمات التعليمية
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إضافة وتعديل وتنظيم الخدمات التعليمية ({services.length} خدمة)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary-600 hover:bg-primary-700 text-white">
          ➕ خدمة جديدة
        </Button>
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
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-xl">📂</div>
          <div>
            <p className="text-sm text-gray-500">خدمات فرعية</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{services.reduce((acc, s) => acc + s.sub_services.length, 0)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-xl">⚡</div>
          <div>
            <p className="text-sm text-gray-500">إجمالي الميزات</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{services.reduce((acc, s) => acc + s.features.length, 0)}</p>
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingService ? '✏️ تعديل الخدمة' : '➕ إضافة خدمة جديدة'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف بالعربية</label>
                <textarea rows={2} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأيقونة</label>
                  <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اللون</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                    <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1 dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="service_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="service_active" className="text-sm text-gray-700 dark:text-gray-300">خدمة نشطة</label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white">
                  {editingService ? 'تحديث' : 'إضافة'}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline" className="flex-1 dark:text-gray-200 dark:border-gray-600">إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{service.name_ar}</h3>
                    {!service.is_active && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded">مخفي</span>
                    )}
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded">
                      {service.sub_services.length} فرعية
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{service.description_ar}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {service.features.slice(0, 4).map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded">{f}</span>
                    ))}
                    {service.features.length > 4 && (
                      <span className="text-[10px] text-gray-400">+{service.features.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setExpandedService(expandedService === service.id ? null : service.id)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="التفاصيل">
                  {expandedService === service.id ? '▲' : '▼'}
                </button>
                <button onClick={() => toggleVisibility(service.id)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  {service.is_active ? '👁️' : '🙈'}
                </button>
                <button onClick={() => handleEdit(service)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">✏️</button>
                <button onClick={() => handleDelete(service.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">🗑️</button>
              </div>
            </div>

            {/* Expanded Sub-services */}
            {expandedService === service.id && service.sub_services.length > 0 && (
              <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">الخدمات الفرعية:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {service.sub_services.map((sub) => (
                    <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border dark:border-gray-700 flex items-center gap-3">
                      <span className="text-xl">{sub.icon}</span>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">{sub.name_ar}</h5>
                        <p className="text-xs text-gray-500">{sub.description_ar}</p>
                      </div>
                      {!sub.is_active && (
                        <span className="px-1 py-0.5 bg-red-100 text-red-600 text-[9px] rounded mr-auto">مخفي</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
