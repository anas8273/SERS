'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  FolderOpen,
  FileText,
  Award,
  ClipboardList,
  Calendar,
  BookOpen,
  Presentation,
  User,
  CreditCard,
  BarChart3,
  Table,
  FileQuestion,
  Loader2
} from 'lucide-react';

// أيقونات الأقسام
const sectionIcons: Record<string, any> = {
  'ملفات الإنجاز': FolderOpen,
  'شواهد الأداء الوظيفي': Award,
  'التقارير': FileText,
  'الشهادات': Award,
  'الخطط': ClipboardList,
  'السجلات': BookOpen,
  'العروض التقديمية': Presentation,
  'السيرة الذاتية': User,
  'البطاقات': CreditCard,
  'الإنفوجرافيك': BarChart3,
  'الجداول': Table,
  'الاختبارات': FileQuestion,
};

// ألوان الأقسام
const sectionColors: Record<string, string> = {
  'ملفات الإنجاز': 'from-blue-500 to-blue-600',
  'شواهد الأداء الوظيفي': 'from-green-500 to-green-600',
  'التقارير': 'from-purple-500 to-purple-600',
  'الشهادات': 'from-yellow-500 to-yellow-600',
  'الخطط': 'from-red-500 to-red-600',
  'السجلات': 'from-indigo-500 to-indigo-600',
  'العروض التقديمية': 'from-pink-500 to-pink-600',
  'السيرة الذاتية': 'from-teal-500 to-teal-600',
  'البطاقات': 'from-orange-500 to-orange-600',
  'الإنفوجرافيك': 'from-cyan-500 to-cyan-600',
  'الجداول': 'from-lime-500 to-lime-600',
  'الاختبارات': 'from-rose-500 to-rose-600',
};

interface Section {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  order: number;
  is_active: boolean;
  categories_count?: number;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await api.getSections();
      if (response.success) {
        const sectionsData = response.data || [];
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
      } else {
        setSections([]);
      }
    } catch (err: any) {
      console.error('Error fetching sections:', err);
      setError(err.message || 'حدث خطأ في تحميل الأقسام');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchSections}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">الأقسام الرئيسية</h1>
          <p className="text-xl opacity-90">
            اختر القسم المناسب لاحتياجاتك واستكشف القوالب المتاحة
          </p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sections.map((section) => {
            const IconComponent = sectionIcons[section.name_ar] || FolderOpen;
            const colorClass = sectionColors[section.name_ar] || 'from-gray-500 to-gray-600';

            return (
              <Link
                key={section.id}
                href={`/sections/${section.slug}`}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  {/* Icon Header */}
                  <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <IconComponent className="w-12 h-12" />
                      {section.categories_count !== undefined && (
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          {section.categories_count} فئة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                      {section.name_ar}
                    </h3>
                    {section.description_ar && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        {section.description_ar}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد أقسام متاحة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
