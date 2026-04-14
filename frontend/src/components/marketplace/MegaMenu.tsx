'use client';

import { cn } from '@/lib/utils';
import { getSectionColor } from '@/hooks/useMarketplace';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import {
  BookOpen, FolderOpen, Award, ClipboardList, FileCheck,
  BarChart3, Lightbulb, Medal, Users, Presentation,
  PenTool, HeartPulse, CalendarDays, AlertTriangle,
} from 'lucide-react';
import type { Section, Category } from '@/types';

/**
 * Section icon lookup
 */
const SECTION_ICON_MAP: Record<string, React.ReactNode> = {
  'achievement-files': <FolderOpen className="w-4 h-4" />,
  'performance-evidence': <Award className="w-4 h-4" />,
  'school-records': <ClipboardList className="w-4 h-4" />,
  'tests': <FileCheck className="w-4 h-4" />,
  'reports': <BarChart3 className="w-4 h-4" />,
  'initiatives': <Lightbulb className="w-4 h-4" />,
  'certificates': <Medal className="w-4 h-4" />,
  'workshops-training': <Users className="w-4 h-4" />,
  'applied-lessons': <Presentation className="w-4 h-4" />,
  'knowledge-production': <PenTool className="w-4 h-4" />,
  'remedial-enrichment': <HeartPulse className="w-4 h-4" />,
  'plans': <CalendarDays className="w-4 h-4" />,
  'learning-loss': <AlertTriangle className="w-4 h-4" />,
};

export function getSectionIcon(slug: string) {
  return SECTION_ICON_MAP[slug] || <BookOpen className="w-4 h-4" />;
}

/**
 * MegaMenu
 * 
 * Fullwidth dropdown showing all sections with their categories.
 */
interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Array<Section & { rootCategories: Category[]; templateCount: number }>;
  onSelectSection: (sectionId: string) => void;
  onSelectCategory: (sectionId: string, categoryId: string) => void;
}

export function MegaMenu({ isOpen, onClose, sections, onSelectSection, onSelectCategory }: MegaMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {sections.map(s => (
              <div key={s.id} className="space-y-2">
                <button
                  onClick={() => onSelectSection(s.id)}
                  className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white hover:text-primary transition-colors group"
                >
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shrink-0 group-hover:scale-110 transition-transform',
                    getSectionColor(s.slug)
                  )}>
                    {getSectionIcon(s.slug)}
                  </div>
                  <span>{s.name_ar}</span>
                  <span className="text-[9px] text-gray-400 font-normal">({s.templateCount})</span>
                </button>
                <div className="pr-9 space-y-0.5">
                  {s.rootCategories.slice(0, 5).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(s.id, cat.id)}
                      className="block text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors truncate py-0.5"
                    >
                      {cat.name_ar}
                    </button>
                  ))}
                  {s.rootCategories.length > 5 && (
                    <button
                      onClick={() => onSelectSection(s.id)}
                      className="text-[10px] text-primary font-bold py-0.5"
                    >
                      + {s.rootCategories.length - 5} أخرى
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
