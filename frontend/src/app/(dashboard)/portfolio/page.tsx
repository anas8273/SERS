'use client';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { FolderArchive, Plus, Trash2, Edit, Download, Share2, Loader2, Sparkles, Trophy, Award, ClipboardCheck, Lightbulb, BookOpen, FileText, CalendarDays, CheckCircle, TrendingUp, ExternalLink, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { exportToPDF } from '@/lib/export-utils';
import { qrCodeToDataURL } from '@/lib/export-utils';
import { useLocalizedTypes } from '@/hooks/useLocalizedTypes';

interface PortfolioSection {
  id: string; title: string; description: string; icon: string;
  items: any[]; isCustom: boolean; order: number; color: string;
}

const BUILT_IN_SECTIONS_DATA = [
  { id: 'achievements', titleKey: 'achievements' as const, icon: 'Trophy', href: '/achievements', color: 'from-purple-500 to-violet-500', serviceType: 'achievements' },
  { id: 'certificates', titleKey: 'certificates' as const, icon: 'Award', href: '/certificates', color: 'from-amber-500 to-orange-500', serviceType: 'certificates' },
  { id: 'work-evidence', titleKey: 'work-evidence' as const, icon: 'ClipboardCheck', href: '/work-evidence', color: 'from-emerald-500 to-teal-500', serviceType: 'work-evidence' },
  { id: 'knowledge', titleKey: 'knowledge' as const, icon: 'Lightbulb', href: '/knowledge-production', color: 'from-yellow-500 to-amber-500', serviceType: 'knowledge-production' },
  { id: 'plans', titleKey: 'plans' as const, icon: 'BookOpen', href: '/plans', color: 'from-green-500 to-emerald-500', serviceType: 'plans' },
  { id: 'distributions', titleKey: 'distributions' as const, icon: 'CalendarDays', href: '/distributions', color: 'from-teal-500 to-cyan-500', serviceType: 'distributions' },
  { id: 'tests', titleKey: 'tests' as const, icon: 'FileText', href: '/tests', color: 'from-red-500 to-rose-500', serviceType: 'tests' },
  { id: 'question-bank', titleKey: 'question-bank' as const, icon: 'FileText', href: '/question-bank', color: 'from-fuchsia-500 to-pink-500', serviceType: 'question-bank' },
];

const ICON_MAP: Record<string, any> = { Trophy, Award, ClipboardCheck, Lightbulb, BookOpen, FileText, CalendarDays, CheckCircle, TrendingUp, Star };

export default function PortfolioPage() {
  const { dir, t, locale } = useTranslation();
  const isEn = locale === 'en';
  const { portfolioSections } = useLocalizedTypes();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [customSections, setCustomSections] = useState<PortfolioSection[]>([]);
  const [addDialog, setAddDialog] = useState(false);
  const [editSection, setEditSection] = useState<PortfolioSection | null>(null);
  const [newSection, setNewSection] = useState({ title: '', description: '', color: 'from-blue-500 to-indigo-500' });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const results: Record<string, number> = {};
    await Promise.allSettled(BUILT_IN_SECTIONS_DATA.map(async s => {
      try { const r = await api.getEducationalServiceStats(s.serviceType); results[s.serviceType] = r?.data?.total || 0; } catch { results[s.serviceType] = 0; }
    }));
    setCounts(results);
    try {
      const r = await api.getEducationalServices('portfolio-sections');
      setCustomSections(r?.data || []);
    } catch {}
    setLoading(false);
  };

  const totalItems = Object.values(counts).reduce((s, c) => s + c, 0);
  const filledSections = BUILT_IN_SECTIONS_DATA.filter(s => (counts[s.serviceType] || 0) > 0).length;
  const completionPct = Math.min(Math.round((filledSections / BUILT_IN_SECTIONS_DATA.length) * 100), 100);
  const level = totalItems >= 50 ? t('eduPage.portfolio.levelExpert') : totalItems >= 20 ? t('eduPage.portfolio.levelAdvanced') : totalItems >= 5 ? t('eduPage.portfolio.levelIntermediate') : t('eduPage.portfolio.levelBeginner');

  const saveSection = async () => {
    if (!newSection.title) { toast.error(t('eduPage.portfolio.sectionTitle')); return; }
    setSaving(true);
    try {
      const payload = { ...newSection, isCustom: true, items: [], order: customSections.length };
      if (editSection) {
        await api.updateEducationalService('portfolio-sections', editSection.id, payload);
        setCustomSections(p => p.map(s => s.id === editSection.id ? { ...s, ...payload } : s));
        toast.success(t('toast.saved'));
      } else {
        const res = await api.createEducationalService('portfolio-sections', payload);
        setCustomSections(p => [...p, { id: res?.data?.id || Date.now().toString(), ...payload, createdAt: new Date().toISOString() } as any]);
        toast.success(t('toast.saved'));
      }
      setAddDialog(false); setEditSection(null); setNewSection({ title: '', description: '', color: 'from-blue-500 to-indigo-500' });
    } catch { toast.error(t('common.error')); } finally { setSaving(false); }
  };

  const deleteSection = async (id: string) => {
    try { await api.deleteEducationalService('portfolio-sections', id); } catch {}
    setCustomSections(p => p.filter(s => s.id !== id)); toast.success(t('common.delete'));
  };

  const exportPortfolioPDF = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      await exportToPDF(previewRef.current, isEn ? 'portfolio' : 'ملف_الإنجاز', { title: isEn ? 'Digital Portfolio' : 'ملف الإنجاز الرقمي', includeQR: true, qrData: `SERS:portfolio:${Date.now()}` });
      toast.success(t('toast.achievement.exported'));
    } catch { toast.error(t('common.error')); }
    setExporting(false);
  };

  const generateShareLink = () => {
    const url = `${window.location.origin}/portfolio`;
    setShareUrl(url);
    navigator.clipboard.writeText(url).then(() => toast.success(t('product.linkCopied'))).catch(() => toast.error(t('common.error')));
  };

  const COLORS = ['from-blue-500 to-indigo-500', 'from-purple-500 to-violet-500', 'from-green-500 to-emerald-500', 'from-amber-500 to-orange-500', 'from-red-500 to-rose-500', 'from-teal-500 to-cyan-500', 'from-pink-500 to-fuchsia-500'];

  return (
    <>
    <TopNavBar title={ta('الملف المهني', 'الملف المهني' )} />
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><FolderArchive className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black">{t('eduPage.heroTitle.portfolio')}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t('eduPage.heroDesc.portfolio')}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={generateShareLink} size="sm" className="bg-white/20 hover:bg-white/30 border-white/30 text-white gap-2 rounded-xl"><Share2 className="h-4 w-4" />{t('eduPage.btn.share')}</Button>
            <Button onClick={exportPortfolioPDF} size="sm" disabled={exporting} className="bg-white/20 hover:bg-white/30 border-white/30 text-white gap-2 rounded-xl">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t('eduPage.btn.exportPdf')}
            </Button>
          </div>
        </div>
        {/* Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: t('eduPage.stat.totalItems'), value: loading ? '...' : totalItems },
            { label: t('eduPage.stat.filledSections'), value: `${filledSections}/${BUILT_IN_SECTIONS_DATA.length}` },
            { label: t('eduPage.stat.level'), value: loading ? '...' : level },
            { label: t('eduPage.stat.completion'), value: `${completionPct}%` },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{s.value}</p><p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="relative mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
          </div>
          <p className="text-xs text-white/60 mt-1">{t('eduPage.portfolio.completionPct')} {completionPct}%</p>
        </div>
      </motion.div>

      {/* Built-in Sections */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{t('eduPage.portfolio.builtInSections')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {BUILT_IN_SECTIONS_DATA.map((section, i) => {
          const Icon = ICON_MAP[section.icon] || FileText;
          const count = counts[section.serviceType] || 0;
          return (
            <motion.div key={section.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Link href={section.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer group border-0 shadow-sm rounded-2xl h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0`}><Icon className="h-5 w-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between"><h3 className="font-bold text-sm">{portfolioSections[section.titleKey] || section.titleKey}</h3><ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-primary" /></div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={count > 0 ? 'default' : 'outline'} className="text-xs">{loading ? '...' : `${count} ${t('eduPage.item')}`}</Badge>
                          {count > 0 && <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Sections */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t('eduPage.portfolio.customSections')}</h2>
        <Dialog open={addDialog} onOpenChange={v => { setAddDialog(v); if (!v) { setEditSection(null); setNewSection({ title: '', description: '', color: 'from-blue-500 to-indigo-500' }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm"><Plus className="h-4 w-4" />{t('eduPage.btn.addSection')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editSection ? t('eduPage.portfolio.editSection') : t('eduPage.portfolio.addSectionDialog')}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>{t('eduPage.portfolio.sectionTitle')}</Label><Input placeholder={t('eduPage.portfolio.sectionTitlePlaceholder')} value={newSection.title} onChange={e => setNewSection(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>{t('eduPage.portfolio.sectionDesc')}</Label><Textarea placeholder={t('eduPage.portfolio.sectionDescPlaceholder')} className="min-h-[80px]" value={newSection.description} onChange={e => setNewSection(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid gap-2">
                <Label>{t('eduPage.portfolio.sectionColor')}</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => <button key={c} type="button" onClick={() => setNewSection(p => ({ ...p, color: c }))} className={`h-8 w-12 rounded-lg bg-gradient-to-r ${c} border-2 transition-all ${newSection.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} />)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialog(false)}>{t('common.cancel')}</Button>
              <Button onClick={saveSection} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('eduPage.btn.saving')}</> : <><Plus className="h-4 w-4 ms-2" />{editSection ? t('eduPage.btn.update') : t('eduPage.btn.addSection')}</>}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {customSections.length === 0 ? (
        <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3"><Plus className="h-7 w-7 text-primary" /></div>
            <h3 className="font-bold mb-1">{t('eduPage.portfolio.addCustom')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('eduPage.portfolio.addCustomDesc')}</p>
            <Button onClick={() => setAddDialog(true)} size="sm" className="gap-2"><Plus className="h-4 w-4" />{t('eduPage.btn.addSection')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {customSections.map((section, i) => (
            <motion.div key={section.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                <div className={`h-2 bg-gradient-to-r ${section.color || 'from-blue-500 to-indigo-500'} rounded-t-2xl`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditSection(section); setNewSection({ title: section.title, description: section.description, color: section.color }); setAddDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSection(section.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{section.items?.length || 0} {t('eduPage.items')}</Badge>
                    <Button variant="outline" size="sm" className="gap-1 text-xs rounded-lg h-7"><Plus className="h-3 w-3" />{t('common.add')}</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-4">{t('eduPage.portfolio.quickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          {[{ label: t('eduPage.portfolio.docAchievement'), href: '/achievements', icon: Trophy }, { label: t('eduPage.portfolio.addCertificate'), href: '/certificates', icon: Award }, { label: t('eduPage.portfolio.workEvidence'), href: '/work-evidence', icon: ClipboardCheck }, { label: t('eduPage.portfolio.knowledgeProd'), href: '/knowledge-production', icon: Lightbulb }, { label: t('eduPage.portfolio.lessonPrep'), href: '/distributions', icon: CalendarDays }].map(a => {
            const Icon = a.icon;
            return <Link key={a.href} href={a.href}><Button variant="outline" size="sm" className="gap-2 rounded-xl"><Icon className="h-4 w-4" />{a.label}</Button></Link>;
          })}
        </div>
      </div>

      {shareUrl && (
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20 mb-4">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-blue-700 dark:text-blue-300">{t('eduPage.portfolio.shareLink')}</p><p className="text-xs text-muted-foreground truncate max-w-xs">{shareUrl}</p></div>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast.success(t('eduPage.btn.copy')))} className="shrink-0">{t('eduPage.btn.copy')}</Button>
          </CardContent>
        </Card>
      )}

      {/* Hidden PDF preview template */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
          <div className="text-center border-b-4 border-rose-500 pb-6 mb-8">
            <h1 className="text-3xl font-black text-gray-900">{isEn ? 'Digital Portfolio' : ta('ملف الإنجاز الرقمي', 'ملف الإنجاز الرقمي') }</h1>
            <p className="text-rose-600 font-bold mt-2">{isEn ? 'SERS Platform — Educational Services' : ta('منصة SERS — نظام الخدمات التعليمية', 'منصة SERS — نظام الخدمات التعليمية') }</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {BUILT_IN_SECTIONS_DATA.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-bold">{portfolioSections[s.titleKey] || s.titleKey}</div>
                <div className="mr-auto text-lg font-black text-rose-600">{counts[s.serviceType] || 0}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-end border-t-2 border-gray-200 pt-4 mt-6">
            <div><p className="text-xs text-gray-400">{isEn ? 'Exported' : ta('تم التصدير', 'تم التصدير') }: {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p></div>
            <div className="text-center"><img src={qrCodeToDataURL('SERS:portfolio', 80)} alt="QR" className="inline-block" /><p className="text-[10px] text-gray-400 mt-1">{isEn ? 'Scan to preview' : ta('امسح للمعاينة', 'امسح للمعاينة') }</p></div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
