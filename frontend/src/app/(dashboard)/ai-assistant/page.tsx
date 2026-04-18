'use client';
export const dynamic = 'force-dynamic';

/**
 * AI Assistant Page — /dashboard/ai-assistant
 * 
 * SERS AI v2 — Smart, role-aware, locale-responsive assistant.
 * Features:
 *  - Clickable navigation links with icons
 *  - Rich markdown rendering (headings, lists, bold, code)
 *  - Dynamic quick prompts based on user role & locale
 *  - Locale-aware responses (ar/en auto-detection)
 *  - Role-based route protection (no admin links for regular users)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFirestoreForms } from '@/hooks/useFirestoreForms';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Plus, Copy, Check,
  BookOpen, ShoppingBag, Calendar, Award, ClipboardList,
  BarChart2, Lightbulb, Target, User, Bot, Loader2,
  ExternalLink, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter, usePathname } from 'next/navigation';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Route Icon Mapper ────────────────────────────────────────────────────────
// Returns a contextual icon for each link based on its path
function getRouteIcon(href: string) {
  if (href.includes('marketplace')) return ShoppingBag;
  if (href.includes('dashboard') || href === '/') return Target;
  if (href.includes('certificates')) return Award;
  if (href.includes('achievements')) return Award;
  if (href.includes('plans') || href.includes('distributions')) return Calendar;
  if (href.includes('follow-up') || href.includes('tests') || href.includes('question-bank')) return ClipboardList;
  if (href.includes('admin')) return BarChart2;
  if (href.includes('contact')) return BookOpen;
  if (href.includes('library') || href.includes('orders')) return BookOpen;
  return Lightbulb;
}

// ─── Smart Link Component ─────────────────────────────────────────────────────
// Renders clickable navigation buttons for internal links from AI responses
function SmartLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const isInternal = href.startsWith('/');
  const IconComponent = getRouteIcon(href);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInternal) {
      router.push(href);
    } else {
      window.open(href, '_blank', 'noopener');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
        'bg-gradient-to-r from-primary/10 to-violet-500/10 text-primary',
        'hover:from-primary/20 hover:to-violet-500/20',
        'border border-primary/20 hover:border-primary/40',
        'hover:scale-[1.03] active:scale-[0.97] cursor-pointer mx-0.5 my-0.5',
        'shadow-sm hover:shadow-md hover:shadow-primary/10'
      )}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{children}</span>
      {isInternal ? (
        <ArrowRight className="w-3 h-3 rtl:rotate-180 opacity-60" />
      ) : (
        <ExternalLink className="w-3 h-3 opacity-60" />
      )}
    </button>
  );
}

// ─── Rich Message Formatter ───────────────────────────────────────────────────
// Converts AI markdown response into React elements with clickable links
function RichMessage({ content, role }: { content: string; role: 'user' | 'assistant' }) {
  if (role === 'user') {
    // User messages: simple text with line breaks
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  // AI messages: parse markdown-like formatting into React elements
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let prevWasHeading = false;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`br-${lineIdx}`} className="h-3" />);
      prevWasHeading = false;
      return;
    }

    // ## Headings — with decorative accent bar
    if (trimmed.startsWith('## ')) {
      // Add separator before heading (unless first element)
      if (elements.length > 0 && !prevWasHeading) {
        elements.push(
          <div key={`sep-${lineIdx}`} className="h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent my-3" />
        );
      }
      elements.push(
        <h3 key={`h-${lineIdx}`} className="text-sm font-black text-foreground mt-2 mb-2 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-primary to-violet-500 rounded-full shrink-0" />
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      prevWasHeading = true;
      return;
    }

    prevWasHeading = false;

    // - List items with enhanced bullet styling
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(
        <div key={`li-${lineIdx}`} className="flex items-start gap-2.5 my-1 text-sm leading-relaxed">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-primary/70 to-violet-500/70 mt-1.5 shrink-0 ring-2 ring-primary/10" />
          <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
        </div>
      );
      return;
    }

    // Numbered list (1. 2. 3.) with enhanced number badges
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={`ol-${lineIdx}`} className="flex items-start gap-2.5 my-1 text-sm leading-relaxed">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-primary/10">
            {numMatch[1]}
          </span>
          <span className="flex-1">{parseInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className="text-sm leading-relaxed my-1">
        {parseInline(trimmed)}
      </p>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Inline Markdown Parser ───────────────────────────────────────────────────
// Parses **bold**, *italic*, `code`, and [link](url) into React elements
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex matches: [text](url), **bold**, *italic*, `code`
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // [link text](url)
      parts.push(
        <SmartLink key={`link-${keyIdx++}`} href={match[2]}>
          {match[1]}
        </SmartLink>
      );
    } else if (match[3]) {
      // **bold**
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-foreground">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // *italic*
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // `code`
      parts.push(
        <code key={`c-${keyIdx++}`} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
          {match[5]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// ─── Dynamic Quick Prompts ────────────────────────────────────────────────────
// Context-aware prompts that change based on role and locale
function getQuickPrompts(isAdmin: boolean, locale: string) {
  if (locale === 'en') {
    const base = [
      { icon: ShoppingBag, label: 'Best template?', color: 'violet', prompt: 'What is the best-selling achievement portfolio template on SERS? Include the price and direct link.' },
      { icon: Calendar, label: 'Create distribution', color: 'teal', prompt: 'How do I create a professional weekly distribution for a Math class on SERS?' },
      { icon: Award, label: 'Issue certificate', color: 'amber', prompt: 'How do I create and issue a student appreciation certificate on SERS?' },
      { icon: ClipboardList, label: 'Daily follow-up', color: 'blue', prompt: 'What tools are available on SERS for daily student follow-up tracking?' },
      { icon: BookOpen, label: 'AI lesson prep', color: 'green', prompt: 'Help me prepare a professional Science lesson for 3rd grade middle school.' },
      { icon: Target, label: 'Learning objectives', color: 'red', prompt: 'Write behavioral objectives for a decimal fractions lesson for 4th grade according to the Saudi curriculum.' },
    ];
    if (isAdmin) {
      base.push(
        { icon: BarChart2, label: 'Sales analysis', color: 'purple', prompt: 'Analyze the current sales performance and give me 3 actionable recommendations.' },
        { icon: Lightbulb, label: 'Growth plan', color: 'orange', prompt: 'Based on the current stats, what is a 30-day growth plan for the platform?' },
      );
    }
    return base;
  }

  // Arabic prompts
  const base = [
    { icon: ShoppingBag, label: ta('اقترح قالب إنجاز', 'Suggest Achievement Template'), color: 'violet', prompt: ta('اقترح لي أفضل قالب ملف إنجاز في متجر SERS مع السعر ورابط الشراء المباشر', 'Suggest the best achievement portfolio template in SERS store with price and direct purchase link') },
    { icon: Calendar, label: ta('توزيع أسبوعي', 'Weekly Distribution'), color: 'teal', prompt: ta('كيف أنشئ توزيع أسبوعي احترافي لمادة الرياضيات في منصة SERS؟ أعطني رابط الصفحة', 'How do I create a professional weekly distribution for Math in SERS? Give me the page link') },
    { icon: Award, label: ta('إصدار شهادة', 'Issue Certificate'), color: 'amber', prompt: ta('كيف أنشئ وأصدر شهادة تقدير للطالب في منصة SERS؟ وجّهني للصفحة المناسبة', 'How do I create and issue a student appreciation certificate in SERS? Direct me to the appropriate page') },
    { icon: ClipboardList, label: ta('سجل متابعة', 'Follow-up Record'), color: 'blue', prompt: ta('ما الأدوات المتاحة في SERS لسجل المتابعة اليومية للطلاب؟ أرسل لي الروابط', 'What tools are available in SERS for daily student follow-up records? Send me the links') },
    { icon: BookOpen, label: ta('تحضير درس', 'Lesson Preparation'), color: 'green', prompt: ta('ساعدني في تحضير درس احترافي لمادة العلوم للصف الثالث متوسط', 'Help me prepare a professional science lesson for Third Intermediate Grade') },
    { icon: Target, label: ta('أهداف سلوكية', 'Behavioral objectives'), color: 'red', prompt: ta('اكتب أهدافاً سلوكية لدرس الكسور العشرية للصف الرابع ابتدائي وفق المنهج السعودي', 'Write behavioral objectives for a decimal fractions lesson for Fourth Primary Grade according to the Saudi curriculum') },
  ];

  if (isAdmin) {
    base.push(
      { icon: BarChart2, label: ta('تحليل المبيعات', 'Sales Analysis'), color: 'purple', prompt: ta('حلّل أداء المبيعات الحالي وقدّم 3 توصيات لزيادة الإيرادات', 'Analyze current sales performance and provide 3 recommendations to increase revenue') },
      { icon: Lightbulb, label: ta('خطة نمو', 'Growth Plan'), color: 'orange', prompt: ta('بناءً على الإحصائيات الحالية، ما هي خطة عمل 30 يوم لتحسين أداء المنصة؟', 'Based on current statistics, what is a 30-day action plan to improve platform performance?') },
    );
  }

  return base;
}

const colorMap: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-violet-200 dark:border-violet-800 dark:text-violet-400',
  teal: 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 border-teal-200 dark:border-teal-800 dark:text-teal-400',
  amber: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800 dark:text-amber-400',
  blue: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800 dark:text-blue-400',
  green: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 dark:border-green-800 dark:text-green-400',
  red: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200 dark:border-red-800 dark:text-red-400',
  purple: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200 dark:border-purple-800 dark:text-purple-400',
  orange: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200 dark:border-orange-800 dark:text-orange-400',
};

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { dir, t, locale } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
    // Firestore dynamic sync
    useFirestoreForms('ai-assistant', [{
        id: 'sers-ai', title: ta('مساعد SERS الذكي', 'SERS AI Assistant'),
        description: ta('مساعد ذكي تفاعلي', 'Smart interactive assistant'),
        icon: null, color: '', gradient: 'from-primary to-violet-600', fields: [],
    }]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.is_admin || user?.role === 'admin';
  const quickPrompts = getQuickPrompts(isAdmin || false, locale);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send locale so AI responds in the correct language
      const res = await api.chatWithAI(msg, conversationId || undefined, locale);
      const data = res?.data ?? res;

      const aiText =
        data?.message ||
        data?.response ||
        data?.content ||
        (locale === 'en'
          ? 'Sorry, I could not process your request. Please try again.'
          : 'عذراً، لم أتلقَّ رداً. يرجى المحاولة مرة أخرى.');

      if (data?.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        (locale === 'en' ? 'Connection error' : 'حدث خطأ في الاتصال');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      }]);
      toast.error(t('common.aiError'));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, conversationId, locale]);

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
  };

  const firstName = user?.name?.split(' ')[0] || t('aiAssistant.defaultUser');
  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 pt-6 pb-0" dir={dir}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="text-lg font-black">{t('aiAssistant.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('aiAssistant.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('common.connected')}
          </span>
          {messages.length > 0 && (
            <button
              onClick={newChat}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('common.newChat')}
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-muted/20 mb-4">
        {showWelcome ? (
          // Welcome screen
          <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-2xl shadow-primary/30 mb-6"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-black mb-2"
            >
              {t('aiAssistant.welcome').replace('{name}', firstName)}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground mb-8 max-w-md"
            >
              {t('aiAssistant.welcomeDesc')}
            </motion.p>

            {/* Quick prompts grid — dynamic based on role & locale */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-3xl"
            >
              {quickPrompts.slice(0, 8).map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.prompt)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-3 rounded-xl border text-start transition-all hover:scale-[1.02] active:scale-[0.98]',
                      colorMap[p.color]
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{p.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'group relative max-w-[85%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm shadow-sm'
                  )}>
                    {/* Rich message rendering */}
                    <RichMessage content={msg.content} role={msg.role} />

                    <div className={cn(
                      'flex items-center gap-2 mt-2',
                      msg.role === 'user' ? 'justify-start' : 'justify-end'
                    )}>
                      <span className={cn(
                        'text-[10px]',
                        msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'
                      )}>
                        {msg.timestamp.toLocaleTimeString(locale === 'en' ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                        >
                          {copiedId === msg.id
                            ? <Check className="w-3 h-3 text-green-500" />
                            : <Copy className="w-3 h-3" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading bubble */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 pb-4">
        {/* Quick prompts strip (when chatting — first few messages only) */}
        {messages.length > 0 && messages.length < 4 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {quickPrompts.slice(0, 4).map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={i}
                  onClick={() => sendMessage(p.prompt)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                    colorMap[p.color]
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-3 shadow-sm focus-within:border-primary/50 focus-within:shadow-md transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={t('aiAssistant.placeholder')}
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground max-h-32 leading-relaxed"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          {t('aiAssistant.hint')}
        </p>
      </div>
    </div>
  );
}
