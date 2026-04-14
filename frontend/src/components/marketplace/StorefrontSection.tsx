'use client';
import { ta } from '@/i18n/auto-translations';

import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HorizontalSlider } from './HorizontalSlider';
import TemplateCard from '@/components/templates/TemplateCard';
import type { Template } from '@/types';

/**
 * StorefrontSection
 * 
 * Premium carousel section with gradient header and horizontal scrolling.
 * Used for Featured, AI Recommendations, Best Sellers, and section rows.
 */
interface StorefrontSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  templates: Template[];
  badge?: string;
  onViewAll?: () => void;
  searchQuery?: string;
}

export function StorefrontSection({
  icon, title, subtitle, gradient, templates,
  badge, onViewAll, searchQuery
}: StorefrontSectionProps) {
  if (templates.length === 0) return null;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shrink-0 shadow-lg',
            gradient
          )}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 dark:text-white">{title}</h2>
              {badge && (
                <span className="px-2 py-0.5 text-[9px] font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-sm">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl"
          >
            {ta('عرض الكل', 'View All')}<ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <HorizontalSlider>
        {templates.map((t, index) => (
          <div
            key={t.id}
            className="min-w-[270px] max-w-[290px] snap-start shrink-0"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TemplateCard template={t} variant="marketplace" searchQuery={searchQuery} />
          </div>
        ))}
      </HorizontalSlider>
    </section>
  );
}
