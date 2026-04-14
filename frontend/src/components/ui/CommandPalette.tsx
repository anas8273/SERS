'use client';
import { ta } from '@/i18n/auto-translations';

/**
 * CommandPalette.tsx
 * Global command palette triggered by Cmd/Ctrl+K.
 * Allows users to navigate anywhere in the app instantly.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  Search, LayoutDashboard, ShoppingBag, BookOpen, FileText,
  Award, Calendar, ClipboardList, BarChart2, Settings,
  LogOut, User, Sparkles, ChevronRight, Clock, X,
  Target, Lightbulb, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  category: string;
  keywords?: string[];
}

const RECENT_KEY = 'cmd_palette_recent';

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent commands
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) setRecent(JSON.parse(saved));
    } catch {}
  }, []);

  // Define all commands
  const allCommands: Command[] = [
    // Navigation
    { id: 'go-home', label: 'الصفحة الرئيسية', icon: LayoutDashboard, category: 'التنقل', action: () => router.push('/'), keywords: ['home', 'رئيسية'] },
    { id: 'go-marketplace', label: 'متجر القوالب', icon: ShoppingBag, category: 'التنقل', action: () => router.push('/marketplace'), keywords: ['shop', 'متجر', 'قوالب'] },
    { id: 'go-dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, category: 'التنقل', action: () => router.push('/dashboard'), keywords: ['dashboard', 'لوحة'] },
    { id: 'go-plans', label: 'الخطط الدراسية', icon: BookOpen, category: 'الخدمات التعليمية', action: () => router.push('/plans'), keywords: ['plans', 'خطط'] },
    { id: 'go-distributions', label: 'التوزيعات والتحضير', icon: Calendar, category: 'الخدمات التعليمية', action: () => router.push('/distributions'), keywords: ['distributions', 'توزيع', 'تحضير'] },
    { id: 'go-certificates', label: 'الشهادات', icon: Award, category: 'الخدمات التعليمية', action: () => router.push('/certificates'), keywords: ['certificates', 'شهادات'] },
    { id: 'go-followup', label: 'سجل المتابعة', icon: ClipboardList, category: 'الخدمات التعليمية', action: () => router.push('/follow-up-log'), keywords: ['followup', 'متابعة'] },
    { id: 'go-achievements', label: 'الإنجازات', icon: Target, category: 'الخدمات التعليمية', action: () => router.push('/achievements'), keywords: ['achievements', 'إنجازات'] },
    { id: 'go-evidence', label: 'شواهد الأداء', icon: FolderOpen, category: 'الخدمات التعليمية', action: () => router.push('/work-evidence'), keywords: ['evidence', 'شواهد'] },
    { id: 'go-knowledge', label: 'الإنتاج المعرفي', icon: Lightbulb, category: 'الخدمات التعليمية', action: () => router.push('/knowledge-production'), keywords: ['knowledge', 'معرفي'] },
    { id: 'go-my-templates', label: 'قوالبي', icon: FileText, category: 'التنقل', action: () => router.push('/my-templates'), keywords: ['my templates', 'قوالبي'] },
    { id: 'go-profile', label: 'الملف الشخصي', icon: User, category: 'الحساب', action: () => router.push('/profile'), keywords: ['profile', 'ملف'] },
    { id: 'go-ai', label: 'المساعد الذكي', icon: Sparkles, category: 'التنقل', action: () => router.push('/dashboard'), keywords: ['ai', 'ذكاء', 'مساعد'] },
    { id: 'go-analytics', label: 'التحليلات', icon: BarChart2, category: 'التنقل', action: () => router.push('/dashboard'), keywords: ['analytics', 'تحليل'] },
    { id: 'logout', label: 'تسجيل الخروج', icon: LogOut, category: 'الحساب', action: () => { logout(); router.push('/login'); }, keywords: ['logout', 'خروج'] },
  ];

  // Filter commands
  const filtered = query.trim()
    ? allCommands.filter(cmd => {
        const q = query.toLowerCase();
        return (
          cmd.label.includes(q) ||
          cmd.description?.includes(q) ||
          cmd.category.includes(q) ||
          cmd.keywords?.some(k => k.includes(q))
        );
      })
    : allCommands.filter(cmd => recent.includes(cmd.id)).slice(0, 5).concat(
        allCommands.filter(cmd => !recent.includes(cmd.id)).slice(0, 8)
      );

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const runCommand = useCallback((cmd: Command) => {
    // Save to recent
    const updated = [cmd.id, ...recent.filter(r => r !== cmd.id)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    cmd.action();
    setOpen(false);
    setQuery('');
  }, [recent]);

  // Keyboard handler for opening/navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIdx(0);
      }
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatFiltered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && flatFiltered[selectedIdx]) runCommand(flatFiltered[selectedIdx]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatFiltered, selectedIdx, runCommand]);

  // Reset selection on query change
  useEffect(() => { setSelectedIdx(0); }, [query]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Trigger hint in sidebar (optional, small) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[90] hidden lg:flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl shadow-sm text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
        title="لوحة الأوامر السريعة"
      >
        <Search className="w-3.5 h-3.5" />
        <span>{ta('بحث سريع', 'Quick Search')}</span>
        <kbd className="ml-1 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl K</kbd>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          onClick={() => { setOpen(false); setQuery(''); }}
        />
      )}

      {/* Palette */}
      {open && (
        <div
          className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[201] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          dir="rtl"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={ta('ابحث أو انتقل إلى أي صفحة...', 'Search or navigate to any page...')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden md:block px-2 py-1 bg-muted rounded text-[10px] font-mono text-muted-foreground">ESC</kbd>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[400px] py-2">
            {flatFiltered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">لا توجد نتائج لـ "{query}"</p>
            ) : (
              Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <p className="px-4 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{category}</p>
                  {cmds.map(cmd => {
                    const globalIdx = flatFiltered.indexOf(cmd);
                    const isSelected = globalIdx === selectedIdx;
                    const Icon = cmd.icon;
                    const isRecent = recent.includes(cmd.id) && !query;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => runCommand(cmd)}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                          isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-medium">{cmd.label}</p>
                          {cmd.description && <p className="text-xs text-muted-foreground">{cmd.description}</p>}
                        </div>
                        {isRecent && <Clock className="w-3 h-3 text-muted-foreground" />}
                        {isSelected && <ChevronRight className="w-3 h-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">↑↓</kbd> {ta('تنقل', 'Navigate')}</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Enter</kbd> {ta('فتح', 'Open')}</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Esc</kbd> {ta('إغلاق', 'Close')}</span>
          </div>
        </div>
      )}
    </>
  );
}
