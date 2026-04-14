'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Search, Trash2, Loader2, Download, Image as ImageIcon, RefreshCw, Check, Clock, ScrollText, MessageSquare, CheckCircle, User, Edit } from 'lucide-react';
import { FileUpload, type Attachment } from '@/components/shared/FileUpload';
import { AIAssistButton } from '@/components/shared/AIAssistButton';
import { exportToPDF, exportToImage, qrCodeToDataURL } from '@/lib/export-utils';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';

type LogType = 'followUp.type.classVisit' | 'followUp.type.supervisionVisit' | 'followUp.type.meeting' | 'followUp.type.observation' | 'followUp.type.studentFollowUp' | 'followUp.type.dailyReport';

const LOG_TYPE_KEYS: LogType[] = [
    'followUp.type.classVisit',
    'followUp.type.supervisionVisit',
    'followUp.type.meeting',
    'followUp.type.observation',
    'followUp.type.studentFollowUp',
    'followUp.type.dailyReport',
];

// Map translation keys to legacy Arabic values for API compatibility
const LOG_TYPE_TO_API: Record<LogType, string> = {
    'followUp.type.classVisit': 'زيارة صفية',
    'followUp.type.supervisionVisit': 'زيارة إشرافية',
    'followUp.type.meeting': 'اجتماع',
    'followUp.type.observation': 'ملاحظة',
    'followUp.type.studentFollowUp': 'متابعة طالب',
    'followUp.type.dailyReport': 'تقرير يومي',
};

const API_TO_LOG_TYPE: Record<string, LogType> = {
    'زيارة صفية': 'followUp.type.classVisit',
    'زيارة إشرافية': 'followUp.type.supervisionVisit',
    'اجتماع': 'followUp.type.meeting',
    'ملاحظة': 'followUp.type.observation',
    'متابعة طالب': 'followUp.type.studentFollowUp',
    'تقرير يومي': 'followUp.type.dailyReport',
};

interface FollowUpLog {
    id: string;
    title: string;
    logType: LogType;
    details: string;
    action: string;
    status: 'open' | 'closed';
    date: string;
    createdAt: string;
    attachments: Attachment[];
}

export default function FollowUpLogPage() {
    const { t, dir, locale } = useTranslation();
    const [logs, setLogs] = useState<FollowUpLog[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isCreating, setIsCreating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
    const [previewLog, setPreviewLog] = useState<FollowUpLog | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [newLog, setNewLog] = useState({
        title: '',
        logType: 'followUp.type.classVisit' as LogType,
        details: '',
        action: '',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await api.getEducationalServices('follow-up-log');
            const items = response?.data || [];
            setLogs(items.map((item: any) => ({
                id: item.id,
                title: item.title || '',
                logType: API_TO_LOG_TYPE[item.logType || item.log_type] || 'followUp.type.classVisit',
                details: item.details || '',
                action: item.action || '',
                status: item.status || 'open',
                date: item.date || '',
                createdAt: item.createdAt || item.created_at || new Date().toISOString(),
                attachments: item.attachments || [],
            })));
        } catch { } finally { setIsLoading(false); }
    };

    const handleCreateOrUpdate = async () => {
        if (!newLog.title) { toast.error(t('followUp.requiredTitle' as any)); return; }
        setIsCreating(true);
        try {
            const apiLogType = LOG_TYPE_TO_API[newLog.logType];
            const payload = { ...newLog, logType: apiLogType, attachments: [...newAttachments] };
            if (editingId) {
                await api.updateEducationalService('follow-up-log', editingId, payload);
                setLogs(prev => prev.map(l => l.id === editingId ? { ...l, ...newLog, attachments: [...newAttachments] } as FollowUpLog : l));
                toast.success(t('followUp.successUpdate' as any));
            } else {
                const fullPayload = { ...payload, status: 'open' };
                const response = await api.createEducationalService('follow-up-log', fullPayload);
                const log: FollowUpLog = {
                    id: response?.data?.id || Date.now().toString(),
                    ...newLog,
                    status: 'open',
                    createdAt: new Date().toISOString(),
                    attachments: [...newAttachments],
                };
                setLogs(prev => [log, ...prev]);
                toast.success(t('followUp.successCreate' as any));
            }
            setIsCreateOpen(false);
            setEditingId(null);
            setNewLog({ title: '', logType: 'followUp.type.classVisit', details: '', action: '', date: new Date().toISOString().split('T')[0] });
            setNewAttachments([]);
        } catch { toast.error(t('followUp.errorSave' as any)); } finally { setIsCreating(false); }
    };

    const handleEditClick = (log: FollowUpLog) => {
        setEditingId(log.id);
        setNewLog({ title: log.title, logType: log.logType, details: log.details || '', action: log.action || '', date: log.date || new Date().toISOString().split('T')[0] });
        setNewAttachments(log.attachments || []);
        setIsCreateOpen(true);
    };

    const handleToggleStatus = async (id: string) => {
        const log = logs.find(l => l.id === id);
        if (!log) return;
        const newStatus = log.status === 'open' ? 'closed' : 'open';
        try { await api.updateEducationalService('follow-up-log', id, { status: newStatus }); } catch {}
        setLogs(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        toast.success(newStatus === 'closed' ? t('followUp.successClosed' as any) : t('followUp.successReopened' as any));
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('followUp.confirmDelete' as any))) return;
        try { await api.deleteEducationalService('follow-up-log', id); } catch {}
        setLogs(prev => prev.filter(l => l.id !== id));
        toast.success(t('followUp.successDelete' as any));
    };

    const handleExportPDF = async (log: FollowUpLog) => {
        setPreviewLog(log); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) {
            try {
                await exportToPDF(previewRef.current, `follow-up_${log.title}`, { title: t('followUp.pdfHeaderTitle' as any), includeQR: true, qrData: `SERS-Log:${log.id}` });
                toast.success(t('followUp.successPDF' as any));
            } catch { toast.error(t('followUp.errorExport' as any)); }
        }
        setIsExporting(false); setPreviewLog(null);
    };

    const handleExportImage = async (log: FollowUpLog) => {
        setPreviewLog(log); setIsExporting(true);
        await new Promise(r => setTimeout(r, 300));
        if (previewRef.current) {
            try {
                await exportToImage(previewRef.current, `follow-up_${log.title}`);
                toast.success(t('followUp.successImage' as any));
            } catch { toast.error(t('followUp.errorExport' as any)); }
        }
        setIsExporting(false); setPreviewLog(null);
    };

    const filtered = logs.filter(l =>
        (l.title + l.details + t(l.logType)).toLowerCase().includes(searchQuery.toLowerCase())
        && (filterStatus === 'all' || l.status === filterStatus)
    );

    return (
        <>
        <TopNavBar title={t('followUp.title')} />
        <div className="container mx-auto py-6 px-4" dir={dir}>
            {/* Gradient Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <ScrollText className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black">{t('followUp.pageTitle' as any)}</h1>
                            <p className="text-white/80 text-sm mt-0.5">{t('followUp.pageDesc' as any)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (!open) { setEditingId(null); setNewLog({ title: '', logType: 'followUp.type.classVisit', details: '', action: '', date: new Date().toISOString().split('T')[0] }); setNewAttachments([]); }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-white text-emerald-600 hover:bg-gray-100">
                                    <Plus className="h-4 w-4" /> {t('followUp.newLog' as any)}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={dir}>
                                <DialogHeader>
                                    <DialogTitle>{editingId ? t('followUp.editTitle' as any) : t('followUp.addTitle' as any)}</DialogTitle>
                                    <DialogDescription>{t('followUp.dialogDesc' as any)}</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>{t('followUp.labelTitle' as any)}</Label>
                                        <Input placeholder={t('followUp.titlePlaceholder' as any)} value={newLog.title} onChange={e => setNewLog({ ...newLog, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>{t('followUp.labelType' as any)}</Label>
                                            <Select value={newLog.logType} onValueChange={v => setNewLog({ ...newLog, logType: v as LogType })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {LOG_TYPE_KEYS.map(key => (
                                                        <SelectItem key={key} value={key}>{t(key)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('followUp.labelDate' as any)}</Label>
                                            <Input type="date" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('followUp.labelDetails' as any)}</Label>
                                            <AIAssistButton promptType="notes" context={{ type: LOG_TYPE_TO_API[newLog.logType] }} onResult={v => setNewLog({ ...newLog, details: v })} variant="inline" label={t('followUp.aiNotes' as any)} />
                                        </div>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder={t('followUp.detailsPlaceholder' as any)}
                                            value={newLog.details}
                                            onChange={e => setNewLog({ ...newLog, details: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{t('followUp.labelAction' as any)}</Label>
                                            <AIAssistButton promptType="followup" context={{ type: LOG_TYPE_TO_API[newLog.logType], existingContent: newLog.details }} onResult={v => setNewLog({ ...newLog, action: v })} variant="inline" label={t('followUp.aiAction' as any)} />
                                        </div>
                                        <textarea
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder={t('followUp.actionPlaceholder' as any)}
                                            value={newLog.action}
                                            onChange={e => setNewLog({ ...newLog, action: e.target.value })}
                                        />
                                    </div>
                                    <FileUpload attachments={newAttachments} onAttachmentsChange={setNewAttachments} label={t('followUp.labelAction' as any)} maxFiles={5} compact />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('followUp.btnCancel' as any)}</Button>
                                    <Button onClick={handleCreateOrUpdate} disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
                                        {isCreating
                                            ? <><Loader2 className="h-4 w-4 animate-spin ms-2" /> {t('followUp.btnSaving' as any)}</>
                                            : <><ClipboardList className="h-4 w-4 ms-2" /> {editingId ? t('followUp.btnUpdate' as any) : t('followUp.btnAdd' as any)}</>
                                        }
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: t('followUp.statTotal' as any), value: logs.length, icon: ScrollText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: t('followUp.statOpen' as any), value: logs.filter(e => e.status === 'open').length, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('followUp.statClosed' as any), value: logs.filter(e => e.status === 'closed').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: t('followUp.statClassVisits' as any), value: logs.filter(e => e.logType === 'followUp.type.classVisit').length, icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        <p className="text-xl font-black">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('followUp.search' as any)} className="pe-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('followUp.filterAll' as any)}</SelectItem>
                        <SelectItem value="open">{t('followUp.filterOpen' as any)}</SelectItem>
                        <SelectItem value="closed">{t('followUp.filterClosed' as any)}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-muted-foreground">{t('followUp.loading' as any)}</p>
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                            <ScrollText className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t('followUp.empty' as any)}</h3>
                        <p className="text-muted-foreground mb-4 text-sm">{t('followUp.emptyDesc' as any)}</p>
                        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl gap-2">
                            <Plus className="h-4 w-4" /> {t('followUp.addLog' as any)}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((log, index) => (
                        <motion.div key={log.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
                            <Card className={`border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl border-s-4 ${log.status === 'open' ? 'border-amber-500' : 'border-green-500'}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <Badge variant="outline" className="rounded-lg">{t(log.logType)}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`gap-1 text-xs ${log.status === 'open' ? 'text-amber-600' : 'text-green-600'}`}
                                            onClick={() => handleToggleStatus(log.id)}
                                        >
                                            {log.status === 'open'
                                                ? <><Clock className="h-3 w-3" /> {t('followUp.statusOpen' as any)}</>
                                                : <><Check className="h-3 w-3" /> {t('followUp.statusClosed' as any)}</>
                                            }
                                        </Button>
                                    </div>
                                    <CardTitle className="text-base mt-2">{log.title}</CardTitle>
                                    <CardDescription>{log.date && new Date(log.date).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {log.details && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{log.details.substring(0, 100)}</p>}
                                    {log.action && <p className="text-xs text-indigo-600 mb-3 line-clamp-1">📌 {log.action.substring(0, 80)}</p>}
                                    {log.attachments.length > 0 && (
                                        <p className="text-xs text-muted-foreground mb-3">
                                            📎 {log.attachments.length} {log.attachments.length === 1 ? t('followUp.attachment' as any) : t('followUp.attachments' as any)}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportPDF(log)} disabled={isExporting}>
                                            <Download className="h-3.5 w-3.5" /> {t('followUp.btnPdf' as any)}
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleExportImage(log)} disabled={isExporting}>
                                            <ImageIcon className="h-3.5 w-3.5" /> {t('followUp.btnImage' as any)}
                                        </Button>
                                        <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700 rounded-lg shrink-0" onClick={() => handleEditClick(log)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive shrink-0 rounded-lg hover:bg-red-50" onClick={() => handleDelete(log.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Hidden PDF Preview */}
            {previewLog && (
                <div className="fixed left-[-9999px] top-0">
                    <div ref={previewRef} className="w-[793px] bg-white p-10 font-sans" dir={dir}>
                        <div className="border-b-4 border-indigo-500 pb-4 mb-6">
                            <h1 className="text-2xl font-bold">{t('followUp.pdfHeaderTitle' as any)}</h1>
                            <p className="text-indigo-600 font-semibold mt-1">{t(previewLog.logType)} — {previewLog.status === 'open' ? t('followUp.statusOpen' as any) : t('followUp.statusClosed' as any)}</p>
                        </div>
                        <h2 className="text-xl font-bold mb-4">{previewLog.title}</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500">{t('followUp.pdfDateLabel' as any)}</p>
                                <p className="font-bold">{previewLog.date && new Date(previewLog.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500">{t('followUp.pdfStatusLabel' as any)}</p>
                                <p className="font-bold">{previewLog.status === 'open' ? t('followUp.statusOpen' as any) : t('followUp.statusClosed' as any)}</p>
                            </div>
                        </div>
                        {previewLog.details && (
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-700 mb-2">{t('followUp.pdfDetailsLabel' as any)}</h3>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{previewLog.details}</p>
                            </div>
                        )}
                        {previewLog.action && (
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-700 mb-2">{t('followUp.pdfActionLabel' as any)}</h3>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{previewLog.action}</p>
                            </div>
                        )}
                        <div className="border-t-2 pt-4 mt-6 flex justify-between items-end">
                            <p className="text-xs text-gray-400">SERS</p>
                            <img src={qrCodeToDataURL(`SERS-Log:${previewLog.id}`, 80)} alt="QR" className="inline-block" />
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

