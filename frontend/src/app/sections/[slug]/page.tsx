'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowRight, 
  FolderOpen, 
  FileText,
  Loader2,
  ChevronLeft
} from 'lucide-react';

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  image: string | null;
  order: number;
  is_active: boolean;
  templates_count?: number;
  children?: Category[];
}

interface Section {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  categories: Category[];
}

export default function SectionCategoriesPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSectionWithCategories();
    }
  }, [slug]);

  const fetchSectionWithCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getSectionBySlug(slug);
      if (response.success) {
        setSection(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل القسم');
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

  if (error || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'القسم غير موجود'}</p>
          <Link 
            href="/sections"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            العودة للأقسام
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-primary">
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <Link href="/sections" className="text-gray-500 hover:text-primary">
              الأقسام
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <span className="text-primary font-medium">{section.name_ar}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="container mx-auto px-4">
          <Link 
            href="/sections"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للأقسام
          </Link>
          <h1 className="text-3xl font-bold mb-2">{section.name_ar}</h1>
          {section.description_ar && (
            <p className="text-lg opacity-90">{section.description_ar}</p>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          الفئات المتاحة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Image */}
                {category.image ? (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name_ar}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <FolderOpen className="w-16 h-16 text-primary/40" />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {category.name_ar}
                    </h3>
                    {category.templates_count !== undefined && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {category.templates_count} قالب
                      </span>
                    )}
                  </div>
                  {category.description_ar && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {category.description_ar}
                    </p>
                  )}
                  
                  {/* Subcategories */}
                  {category.children && category.children.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">الفئات الفرعية:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.children.slice(0, 3).map((child) => (
                          <span 
                            key={child.id}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs"
                          >
                            {child.name_ar}
                          </span>
                        ))}
                        {category.children.length > 3 && (
                          <span className="text-gray-400 text-xs">
                            +{category.children.length - 3} أخرى
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {section.categories.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد فئات متاحة في هذا القسم</p>
          </div>
        )}
      </div>
    </div>
  );
}
