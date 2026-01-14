'use client';

import Link from 'next/link';
import { 
  FolderOpen, 
  FileText, 
  Award, 
  ClipboardList, 
  BookOpen,
  Presentation,
  User,
  CreditCard,
  BarChart3,
  Table,
  FileQuestion
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

interface SectionCardProps {
  section: Section;
}

export default function SectionCard({ section }: SectionCardProps) {
  const IconComponent = sectionIcons[section.name_ar] || FolderOpen;
  const colorClass = sectionColors[section.name_ar] || 'from-gray-500 to-gray-600';
  
  return (
    <Link href={`/sections/${section.slug}`} className="group">
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
}
