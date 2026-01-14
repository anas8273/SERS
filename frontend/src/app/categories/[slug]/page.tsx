'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowRight, 
  FileText,
  Download,
  Edit3,
  Loader2,
  ChevronLeft,
  Star,
  Eye
} from 'lucide-react';

interface Template {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  type: 'ready' | 'interactive';
  thumbnail: string | null;
  preview_image: string | null;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  is_active: boolean;
  downloads_count: number;
  views_count: number;
  variants_count?: number;
}

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  section: {
    id: number;
    name_ar: string;
    slug: string;
  };
  templates: Template[];
}

export default function CategoryTemplatesPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ready' | 'interactive'>('all');

  useEffect(() => {
    if (slug) {
      fetchCategoryWithTemplates();
    }
  }, [slug]);

  const fetchCategoryWithTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplatesByCategory(slug);
      if (response.success) {
        setCategory(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل الفئة');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = category?.templates.filter(template => {
    if (filter === 'all') return true;
    return template.type === filter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'الفئة غير موجودة'}</p>
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
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-gray-500 hover:text-primary">
              الرئيسية
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <Link href="/sections" className="text-gray-500 hover:text-primary">
              الأقسام
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <Link href={`/sections/${category.section.slug}`} className="text-gray-500 hover:text-primary">
              {category.section.name_ar}
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <span className="text-primary font-medium">{category.name_ar}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="container mx-auto px-4">
          <Link 
            href={`/sections/${category.section.slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة إلى {category.section.name_ar}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{category.name_ar}</h1>
          {category.description_ar && (
            <p className="text-lg opacity-90">{category.description_ar}</p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-gray-600 dark:text-gray-400">تصفية حسب:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              الكل ({category.templates.length})
            </button>
            <button
              onClick={() => setFilter('interactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'interactive'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              تفاعلي ({category.templates.filter(t => t.type === 'interactive').length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'ready'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Download className="w-4 h-4" />
              جاهز ({category.templates.filter(t => t.type === 'ready').length})
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Link
              key={template.id}
              href={template.type === 'interactive' 
                ? `/editor/${template.slug}` 
                : `/templates/${template.slug}`
              }
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  {template.thumbnail ? (
                    <img 
                      src={template.thumbnail} 
                      alt={template.name_ar}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <FileText className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    template.type === 'interactive'
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {template.type === 'interactive' ? (
                      <>
                        <Edit3 className="w-3 h-3" />
                        تفاعلي
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        جاهز
                      </>
                    )}
                  </div>

                  {/* Featured Badge */}
                  {template.is_featured && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      مميز
                    </div>
                  )}

                  {/* Free Badge */}
                  {template.is_free && (
                    <div className="absolute bottom-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      مجاني
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {template.name_ar}
                  </h3>
                  
                  {template.description_ar && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                      {template.description_ar}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {template.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {template.downloads_count}
                      </span>
                    </div>
                    
                    {!template.is_free && (
                      <span className="text-primary font-bold">
                        {template.price} ر.س
                      </span>
                    )}
                  </div>

                  {/* Variants Count */}
                  {template.type === 'interactive' && template.variants_count && template.variants_count > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500">
                        {template.variants_count} تصميم متاح
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد قوالب متاحة في هذه الفئة</p>
          </div>
        )}
      </div>
    </div>
  );
}
