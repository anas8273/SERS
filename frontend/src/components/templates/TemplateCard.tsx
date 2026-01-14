'use client';

import Link from 'next/link';
import { 
  FileText,
  Download,
  Edit3,
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

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const href = template.type === 'interactive' 
    ? `/editor/${template.slug}` 
    : `/templates/${template.slug}`;

  return (
    <Link href={href} className="group">
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
  );
}
