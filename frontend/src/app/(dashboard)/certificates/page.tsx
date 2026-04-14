'use client';

import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { Award, Plus, Search, Trash2, Loader2, Download, Image as ImageIcon, RefreshCw, Star, Users, Sparkles } from 'lucide-react';
import { FileUpload, type Attachment } from '@/components/shared/FileUpload';
import { exportToPDF, exportToImage, qrCodeToDataURL } from '@/lib/export-utils';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useLocalizedTypes } from '@/hooks/useLocalizedTypes';

const CERT_STYLES = ['classic', 'modern', 'elegant', 'simple'] as const;

interface Certificate {
  id: string; recipientName: string; certType: string;
  description: string; issueDate: string; style: typeof CERT_STYLES[number];
  createdAt: string; attachments: Attachment[];
}

export default function CertificatesPage() {
  const { dir, t, locale } = useTranslation();
  const { certTypeOptions, certStyleLabels } = useLocalizedTypes();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [newCert, setNewCert] = useState({
    recipientName: '', certType: '',
    description: '', issueDate: new Date().toISOString().split('T')[0],
    style: 'modern' as typeof CERT_STYLES[number],
  });

  useEffect(() => { fetchCertificates(); }, []);

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const response = await api.getEducationalServices('certificates');
      const items = response?.data || [];
      setCertificates(items.map((item: any) => ({
        id: item.id, recipientName: item.recipientName || item.recipient_name || '',
        certType: item.certType || item.cert_type || certTypeOptions[1],
        description: item.description || '', issueDate: item.issueDate || item.issue_date || '',
        style: item.style || 'modern', createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        attachments: item.attachments || [],
      })));
    } catch { } finally { setIsLoading(false); }
  };

  const aiAssist = async (prompt: string, onResult: (text: string) => void) => {
    setAiLoading(true);
    try {
      const res = await api.chatWithAI(prompt);
      const text = res?.data?.message || res?.data?.response || res?.data?.content || '';
      if (text) onResult(text); else toast.error(t('common.error'));
    } catch { toast.error(t('common.error')); } finally { setAiLoading(false); }
  };

  const handleCreate = async () => {
    if (!newCert.recipientName) { toast.error(t('certificates.recipient')); return; }
    setIsCreating(true);
    try {
      const payload = { ...newCert, attachments: [...newAttachments] };
      const response = await api.createEducationalService('certificates', payload);
      const cert: Certificate = { id: response?.data?.id || Date.now().toString(), ...newCert, createdAt: new Date().toISOString(), attachments: [...newAttachments] };
      setCertificates(prev => [cert, ...prev]);
      toast.success(t('certificates.add'));
      setIsCreateOpen(false);
      setNewCert({ recipientName: '', certType: certTypeOptions[1], description: '', issueDate: new Date().toISOString().split('T')[0], style: 'modern' });
      setNewAttachments([]);
    } catch { toast.error(t('common.error')); } finally { setIsCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteEducationalService('certificates', id); } catch {}
    setCertificates(prev => prev.filter(c => c.id !== id));
    toast.success(t('common.delete'));
  };

  const handleExportPDF = async (cert: Certificate) => {
    setPreviewCert(cert); setIsExporting(true);
    await new Promise(r => setTimeout(r, 300));
    if (previewRef.current) { try { await exportToPDF(previewRef.current, `cert_${cert.recipientName}`, { title: cert.certType, includeQR: true, qrData: `SERS-Cert:${cert.id}` }); toast.success('PDF'); } catch { toast.error(t('common.error')); } }
    setIsExporting(false); setPreviewCert(null);
  };

  const handleExportImage = async (cert: Certificate) => {
    setPreviewCert(cert); setIsExporting(true);
    await new Promise(r => setTimeout(r, 300));
    if (previewRef.current) { try { await exportToImage(previewRef.current, `cert_${cert.recipientName}`); toast.success(t('followUp.successImage')); } catch { toast.error(t('common.error')); } }
    setIsExporting(false); setPreviewCert(null);
  };

  const styleColors: Record<string, string> = { classic: 'border-amber-600', modern: 'border-blue-600', elegant: 'border-purple-600', simple: 'border-gray-600' };
  const styleLabels: Record<string, string> = certStyleLabels;
  const filtered = certificates.filter(c => (c.recipientName + c.certType + c.description).includes(searchQuery));

  const stats = [
    { label: t('certificates.add'), value: certificates.length, icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: t('certificates.recipient'), value: new Set(certificates.map(c => c.recipientName)).size, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: t('certificates.reason'), value: new Set(certificates.map(c => c.certType)).size, icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <>
    <TopNavBar title={t('certificates.add')} />
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Award className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black">{t('certificates.add')}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t('certificates.noCertificatesDesc')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCertificates} disabled={isLoading} className="bg-white/20 hover:bg-white/30 border-white/30 text-white rounded-xl">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> {t('certificates.add')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                <DialogHeader>
                  <DialogTitle>{t('certificates.add')}</DialogTitle>
                  <DialogDescription>{t('certificates.noCertificatesDesc')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t('certificates.recipient')} *</Label>
                      <Input placeholder={locale === 'en' ? 'Mohammed Ahmed' : ta('محمد أحمد', 'Mohammed Ahmed') } value={newCert.recipientName} onChange={e => setNewCert({ ...newCert, recipientName: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('certificates.reason')}</Label>
                      <Select value={newCert.certType} onValueChange={v => setNewCert({ ...newCert, certType: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{certTypeOptions.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t('plans.startDate')}</Label>
                      <Input type="date" value={newCert.issueDate} onChange={e => setNewCert({ ...newCert, issueDate: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('certificates.issuer')}</Label>
                      <Select value={newCert.style} onValueChange={v => setNewCert({ ...newCert, style: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CERT_STYLES.map(s => <SelectItem key={s} value={s}>{styleLabels[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Inline AI for certificate text */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('achievements.description')}</Label>
                      <button type="button" disabled={aiLoading}
                        onClick={() => aiAssist(
                          `اكتب نص شهادة ${newCert.certType} للمعلم/الطالب "${newCert.recipientName}". اجعله رسمياً ومؤثراً ومناسباً للطباعة. لا تتجاوز 3 أسطر.`,
                          text => setNewCert(p => ({ ...p, description: text }))
                        )}
                        className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        ✨ {t('services.tryAI')}
                      </button>
                    </div>
                    <Textarea className="min-h-[100px]" placeholder={locale === 'en' ? 'Detailed certificate text...' : ta('نص الشهادة التفصيلي...', 'Detailed certificate text...') } value={newCert.description} onChange={e => setNewCert({ ...newCert, description: e.target.value })} />
                  </div>
                  <FileUpload attachments={newAttachments} onAttachmentsChange={setNewAttachments} label={t('followUp.attachment')} maxFiles={3} compact />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleCreate} disabled={isCreating} className="bg-amber-600 hover:bg-amber-700">
                    {isCreating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('common.save')}...</> : <><Award className="h-4 w-4 ms-2" />{t('certificates.add')}</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                  <div><p className="text-xs text-muted-foreground">{stat.label}</p><p className="text-xl font-black">{stat.value}</p></div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" /><p className="text-muted-foreground">{t('common.loading')}</p></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4"><Award className="h-8 w-8 text-amber-500" /></div>
          <h3 className="text-lg font-bold mb-2">{t('certificates.noCertificates')}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t('certificates.noCertificatesDesc')}</p>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> {t('certificates.add')}</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cert, index) => (
            <motion.div key={cert.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
              <Card className={`border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl border-r-4 ${styleColors[cert.style]}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="rounded-lg">{cert.certType}</Badge>
                    <Badge className="bg-amber-100 text-amber-700 rounded-lg">{styleLabels[cert.style]}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">🏆 {cert.recipientName}</CardTitle>
                  <CardDescription>{cert.issueDate && new Date(cert.issueDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {cert.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cert.description.substring(0, 120)}</p>}
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportPDF(cert)} disabled={isExporting}><Download className="h-3.5 w-3.5" /> PDF</Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportImage(cert)} disabled={isExporting}><ImageIcon className="h-3.5 w-3.5" /> {t('followUp.btnImage')}</Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cert.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Hidden PDF Preview */}
      {previewCert && (
        <div className="fixed left-[-9999px] top-0">
          <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
            <div className={`border-4 ${styleColors[previewCert.style]} p-8 text-center`}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{previewCert.certType}</h1>
              <div className="w-20 h-1 bg-amber-500 mx-auto mb-6" />
              <p className="text-lg text-gray-600 mb-4">{t('certificates.recipient')}</p>
              <p className="text-2xl font-bold text-blue-800 mb-6">{previewCert.recipientName}</p>
              {previewCert.description && <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">{previewCert.description}</p>}
              <p className="text-sm text-gray-500">{t('plans.startDate')}: {previewCert.issueDate && new Date(previewCert.issueDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p>
              <div className="mt-6"><img src={qrCodeToDataURL(`SERS-Cert:${previewCert.id}`, 80)} alt="QR" className="inline-block" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
