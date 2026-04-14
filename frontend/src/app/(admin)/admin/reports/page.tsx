'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import {
    BarChart3, LineChart, TrendingUp, Users, ShoppingCart,
    DollarSign, FileText, Bot, Loader2, Calendar,
    Download, RefreshCcw, Sparkles, AlertCircle,
    ChevronLeft, ChevronRight, Package, ArrowUpRight,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import {
    LineChart as RLineChart, Line, BarChart as RBarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend,
} from 'recharts';

type ReportType = 'sales' | 'users' | 'templates' | 'ai';
type DateRange = '7d' | '30d' | '90d' | 'custom';

interface ReportDefinition {
    id: ReportType;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    gradient: string;
}

const REPORT_TYPES: ReportDefinition[] = [
    { id: 'sales', label: ta('المبيعات والإيرادات', 'Sales & Revenue'), description: ta('تحليل شامل لإيرادات المنصة والطلبات', 'Comprehensive analysis of platform revenue and orders'), icon: DollarSign, color: 'text-emerald-500', gradient: 'from-emerald-500 to-green-600' },
    { id: 'users', label: ta('المستخدمون', 'Users'), description: ta('نمو قاعدة المستخدمين وتفاعلهم', 'User base growth and engagement'), icon: Users, color: 'text-blue-500', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'templates', label: ta('القوالب والخدمات', 'Templates & Services'), description: ta('أداء القوالب — مبيعات، تحميلات، تقييمات', 'Templates performance — sales, downloads, ratings'), icon: FileText, color: 'text-violet-500', gradient: 'from-violet-500 to-purple-600' },
    { id: 'ai', label: ta('استهلاك الذكاء الاصطناعي', 'AI Consumption'), description: ta('إحصائيات استخدام AI بالمنصة', 'AI usage statistics on the platform'), icon: Bot, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-600' },
];

const DATE_RANGES: { id: DateRange; label: string }[] = [
    { id: '7d', label: ta('آخر 7 أيام', 'Last 7 days') },
    { id: '30d', label: ta('آخر 30 يوم', 'Last 30 days') },
    { id: '90d', label: ta('آخر 3 أشهر', 'Last 3 months') },
    { id: 'custom', label: ta('مخصص', 'Custom') },
];

function getDateRange(range: DateRange): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    if (range === '7d') from.setDate(to.getDate() - 7);
    else if (range === '30d') from.setDate(to.getDate() - 30);
    else if (range === '90d') from.setDate(to.getDate() - 90);
    else from.setDate(to.getDate() - 30);
    return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
    };
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, gradient, change }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; gradient: string; change?: number;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br shrink-0 group-hover:scale-110 transition-transform", gradient)}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">{label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
                {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
                {typeof change === 'number' && (
                    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1",
                        change >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400")}>
                        <ArrowUpRight className={cn("w-3 h-3", change < 0 && "rotate-180")} />
                        {Math.abs(change)}%
                    </span>
                )}
            </div>
        </div>
    );
}

export default function AdminReportsPage() {
    const { dir } = useTranslation();
    const [activeReport, setActiveReport] = useState<ReportType>('sales');
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [hasError, setHasError] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const getParams = useCallback(() => {
        if (dateRange === 'custom' && customFrom && customTo) {
            return { from: customFrom, to: customTo };
        }
        return getDateRange(dateRange);
    }, [dateRange, customFrom, customTo]);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setHasError(false);
        setAiInsight('');
        try {
            const params = getParams();
            let res: any;
            if (activeReport === 'sales') res = await api.getAdminReportSales(params);
            else if (activeReport === 'users') res = await api.getAdminReportUsers(params);
            else if (activeReport === 'templates') res = await api.getAdminReportTemplates(params);
            else res = await api.getAdminReportAI(params);
            setReportData(res.data ?? res);
        } catch {
            setHasError(true);
            toast.error(ta('فشل في تحميل بيانات التقرير', 'Failed to load report data'));
        } finally {
            setIsLoading(false);
        }
    }, [activeReport, getParams]);

    useEffect(() => {
        fetchReport();
    }, [activeReport, dateRange]);

    const generateAIInsight = async () => {
        if (!reportData) return;
        setIsGeneratingAI(true);
        try {
            const res = await api.chatWithAI(
                `أنت محلل بيانات خبير. قدّم تحليلاً احترافياً موجزاً (4-5 نقاط) لهذه البيانات:\n${JSON.stringify(reportData, null, 2).slice(0, 2000)}\nالتقرير: ${activeReport}. أبرز أهم الاتجاهات والتوصيات.`
            );
            setAiInsight(res?.data?.response || res?.response || 'لم يتم توليد تحليل، يرجى المحاولة مرة أخرى.');
        } catch {
            toast.error(ta('فشل في توليد التحليل الذكي', 'AI analysis generation failed'));
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const exportCSV = () => {
        if (!reportData) return;
        const chart = reportData.chart || reportData.timeline || reportData.daily || [];
        if (!chart.length) { toast.error(ta('لا توجد بيانات للتصدير', 'No data to export')); return; }
        const headers = Object.keys(chart[0]).join(',');
        const rows = chart.map((r: any) => Object.values(r).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${activeReport}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(ta('تم تصدير CSV بنجاح', 'CSV exported'));
    };

    const printReport = () => { window.print(); };

    const reportDef = REPORT_TYPES.find(r => r.id === activeReport)!;
    const chartData = reportData?.chart || reportData?.timeline || reportData?.daily || [];
    const summaryStats = reportData?.summary || reportData?.stats || {};

    return (
        <div dir={dir} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary" />
                        {ta('التقارير التحليلية', 'Analytical Reports')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">بيانات حقيقية من قاعدة البيانات — آخر تحديث {new Date().toLocaleTimeString('ar-SA')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchReport} disabled={isLoading} className="rounded-xl gap-2 text-xs font-bold">
                        <RefreshCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                        {ta('تحديث', 'Update')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl gap-2 text-xs font-bold">
                        <Download className="w-3.5 h-3.5" />
                        CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={printReport} className="rounded-xl gap-2 text-xs font-bold print:hidden">
                        <Printer className="w-3.5 h-3.5" />
                        {ta('طباعة', 'Print')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Report type selector */}
                <div className="lg:col-span-1 space-y-3">
                    <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{ta('نماذج التقارير', 'Report Templates')}</p>
                    {REPORT_TYPES.map((report) => {
                        const Icon = report.icon;
                        const isActive = activeReport === report.id;
                        return (
                            <button
                                key={report.id}
                                onClick={() => setActiveReport(report.id)}
                                className={cn(
                                    "w-full text-start flex items-center gap-3 p-4 rounded-xl border transition-all",
                                    isActive
                                        ? "bg-gradient-to-l from-primary/10 to-primary/5 border-primary/20 shadow-sm"
                                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary/20 hover:shadow-sm"
                                )}
                            >
                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shrink-0", report.gradient)}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className={cn("text-sm font-bold truncate", isActive ? "text-primary" : "text-gray-700 dark:text-gray-300")}>{report.label}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{report.description}</p>
                                </div>
                                {isActive && <ChevronLeft className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                        );
                    })}

                    {/* Date Range */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                        <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{ta('الفترة الزمنية', 'Time Period')}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {DATE_RANGES.map((dr) => (
                                <button
                                    key={dr.id}
                                    onClick={() => setDateRange(dr.id)}
                                    className={cn(
                                        "px-2 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        dateRange === dr.id
                                            ? "bg-primary text-white shadow-sm"
                                            : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    )}
                                >
                                    {dr.label}
                                </button>
                            ))}
                        </div>
                        {dateRange === 'custom' && (
                            <div className="space-y-2 text-xs">
                                <div>
                                    <label className="font-bold text-gray-600 dark:text-gray-400">{ta('من', 'From')}</label>
                                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-600 dark:text-gray-400">{ta('إلى', 'To')}</label>
                                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 outline-none" />
                                </div>
                                {customFrom && customTo && (
                                    <Button size="sm" onClick={fetchReport} className="w-full rounded-lg text-xs">{ta('تطبيق', 'Apply')}</Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Report content */}
                <div className="lg:col-span-3 space-y-5" ref={reportRef}>
                    {isLoading && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{ta('جاري تحميل بيانات التقرير...', 'Loading report data...')}</p>
                        </div>
                    )}

                    {!isLoading && hasError && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('فشل تحميل البيانات', 'Failed to load data')}</p>
                            <p className="text-sm text-gray-400 mb-4">{ta('تأكد من أن الخادم يعمل وأن endpoint للتقارير متاح', 'Make sure the server is running and the reports endpoint is available')}</p>
                            <Button size="sm" onClick={fetchReport} className="rounded-xl gap-2">
                                <RefreshCcw className="w-4 h-4" /> {ta('إعادة المحاولة', 'Try Again')}
                            </Button>
                        </div>
                    )}

                    {!isLoading && !hasError && reportData && !chartData.length && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
                            <Package className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                            <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{ta('لا توجد بيانات للفترة المحددة', 'No data for the selected period')}</p>
                            <p className="text-sm text-gray-400">{ta('جرب تغيير النطاق الزمني', 'Try changing the time range')}</p>
                        </div>
                    )}

                    {!isLoading && !hasError && reportData && (
                        <>
                            {Object.keys(summaryStats).length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {Object.entries(summaryStats).slice(0, 6).map(([key, value]: [string, any]) => {
                                        const Icon = key.includes('revenue') || key.includes('income') ? DollarSign
                                            : key.includes('user') ? Users
                                                : key.includes('order') ? ShoppingCart
                                                    : key.includes('template') ? FileText : TrendingUp;
                                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        const displayValue = typeof value === 'number' && key.includes('revenue')
                                            ? formatPrice(value)
                                            : String(value);
                                        return (
                                            <StatCard
                                                key={key}
                                                label={label}
                                                value={displayValue}
                                                icon={Icon}
                                                gradient={reportDef.gradient}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {chartData.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-primary" />
                                            {ta('التمثيل المرئي للبيانات', 'Data Visualization')}
                                        </h2>
                                    </div>
                                    <div className="h-72" dir="ltr">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {activeReport === 'sales' ? (
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => formatPrice(v)} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none' }} formatter={(v: number | undefined) => [formatPrice(v ?? 0), ta('الإيرادات', 'Revenue')]} />
                                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradient)" activeDot={{ r: 5 }} />
                                                </AreaChart>
                                            ) : activeReport === 'users' ? (
                                                <RLineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none' }} />
                                                    <Line type="monotone" dataKey="new_users" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} name="مستخدمون جدد" />
                                                    <Line type="monotone" dataKey="total_users" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 2" dot={false} name="الإجمالي" />
                                                    <Legend />
                                                </RLineChart>
                                            ) : (
                                                <RBarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none' }} />
                                                    <Bar dataKey={activeReport === 'templates' ? 'downloads' : 'requests'} fill="#8b5cf6" radius={[4, 4, 0, 0]} name={activeReport === 'templates' ? ta('تحميلات', 'Downloads') : ta('طلبات', 'orders') } />
                                                    <Legend />
                                                </RBarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {reportData?.top_templates && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white">{ta('أكثر القوالب مبيعاً', 'Best-Selling Templates')}</h3>
                                    </div>
                                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {reportData.top_templates.slice(0, 8).map((t: any, i: number) => (
                                            <div key={t.id || i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{i + 1}</span>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{t.name_ar || t.name}</p>
                                                </div>
                                                <div className="text-start">
                                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatPrice(t.revenue || 0)}</p>
                                                    <p className="text-[10px] text-gray-400">{t.sales_count || t.downloads || 0} مبيعة</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-gradient-to-br from-violet-50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/5 rounded-2xl border border-violet-100 dark:border-violet-900/20 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-violet-500" />
                                        {ta('رؤى الذكاء الاصطناعي', 'AI Insights')}
                                    </h3>
                                    <Button
                                        size="sm"
                                        onClick={generateAIInsight}
                                        disabled={isGeneratingAI || !reportData}
                                        className="rounded-xl gap-2 text-xs font-bold bg-gradient-to-l from-violet-500 to-purple-600 hover:opacity-90"
                                    >
                                        {isGeneratingAI ? (
                                            <><Loader2 className="w-3 h-3 animate-spin" /> {ta('جاري التحليل...', 'Analyzing')}</>
                                        ) : (
                                            <><Sparkles className="w-3 h-3" />{ta('توليد تحليل', 'Generate Analysis')}</>
                                        )}
                                    </Button>
                                </div>
                                {aiInsight ? (
                                    <div className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                                        {aiInsight}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        {ta('اضغط على &quot;توليد تحليل&quot; للحصول على رؤى ذكية من البيانات', 'Click "Generate Analysis" to get smart insights from data')}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {!isLoading && !hasError && !reportData && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center">
                            <BarChart3 className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                            <p className="font-bold text-gray-600 dark:text-gray-300">{ta('اختر نموذج تقرير من القائمة الجانبية', 'Select a report template from the sidebar')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
