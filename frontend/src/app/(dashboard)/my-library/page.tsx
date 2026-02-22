'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/stores/authStore';
import { getUserRecords, deleteUserRecord, updateUserRecord, getTemplateCanvas } from '@/lib/firestore-service';
import type { UserRecord, TemplateCanvas } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Edit3,
  Trash2,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  PlusCircle,
  SortAsc,
  SortDesc,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Archive,
  Star,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'draft' | 'final' | 'exported';
type SortBy = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

const ITEMS_PER_PAGE = 12;

const STATUS_CONFIG = {
  draft: { label: 'مسودة', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Edit3 },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  final: { label: 'نهائي', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  exported: { label: 'مُصدَّر', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Download },
};

export default function MyLibraryPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [templateNames, setTemplateNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch records
  useEffect(() => {
    const fetchRecords = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const userRecords = await getUserRecords(user.id);
        setRecords(userRecords);

        // Fetch template names for each unique template_id
        const uniqueTemplateIds = [...new Set(userRecords.map(r => r.template_id))];
        const names: Record<string, string> = {};
        await Promise.all(
          uniqueTemplateIds.map(async (tid) => {
            try {
              const canvas = await getTemplateCanvas(tid);
              if (canvas) {
                names[tid] = (canvas as any).template_name || `قالب ${tid.slice(0, 8)}`;
              }
            } catch {
              names[tid] = `قالب ${tid.slice(0, 8)}`;
            }
          })
        );
        setTemplateNames(names);
      } catch (error) {
        console.error('Failed to fetch records:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchRecords();
    }
  }, [isAuthenticated, authLoading, user]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Filter by status
    if (filterStatus !== 'all') {
      const statusMap: Record<string, string[]> = {
        draft: ['draft'],
        final: ['completed', 'final'],
        exported: ['exported'],
      };
      result = result.filter(r => statusMap[filterStatus]?.includes(r.status));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => {
        const name = (r as any).template_name || templateNames[r.template_id] || '';
        const values = Object.values(r.field_values || {}).join(' ');
        return name.toLowerCase().includes(q) || values.toLowerCase().includes(q) || r.id.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        case 'date_asc':
          return new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime();
        case 'name_asc': {
          const nameA = (a as any).template_name || templateNames[a.template_id] || '';
          const nameB = (b as any).template_name || templateNames[b.template_id] || '';
          return nameA.localeCompare(nameB, 'ar');
        }
        case 'name_desc': {
          const nameA = (a as any).template_name || templateNames[a.template_id] || '';
          const nameB = (b as any).template_name || templateNames[b.template_id] || '';
          return nameB.localeCompare(nameA, 'ar');
        }
        default:
          return 0;
      }
    });

    return result;
  }, [records, filterStatus, searchQuery, sortBy, templateNames]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortBy]);

  // Delete record
  const handleDelete = async (recordId: string) => {
    setIsDeleting(true);
    try {
      await deleteUserRecord(recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete record:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Duplicate record
  const handleDuplicate = async (record: UserRecord) => {
    try {
      const { createUserRecord } = await import('@/lib/firestore-service');
      const newId = await createUserRecord({
        user_id: record.user_id,
        template_id: record.template_id,
        variant_id: record.variant_id,
        field_values: { ...record.field_values },
        status: 'draft',
      });
      // Refresh records
      if (user) {
        const updated = await getUserRecords(user.id);
        setRecords(updated);
      }
    } catch (error) {
      console.error('Failed to duplicate record:', error);
    }
  };

  // Stats
  const statsData = useMemo(() => ({
    total: records.length,
    drafts: records.filter(r => r.status === 'draft').length,
    completed: records.filter(r => r.status === 'completed' || (r.status as string) === 'final').length,
    exported: records.filter(r => r.status === 'exported').length,
  }), [records]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-gray-400 font-medium animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir="rtl">
      <Navbar />

      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ===== Header ===== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-primary" />
                مكتبتي
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                جميع المستندات والسجلات المحفوظة الخاصة بك
              </p>
            </div>
            <Link href="/services">
              <Button className="rounded-full px-6 font-black gap-2 shadow-xl shadow-primary/20">
                <PlusCircle className="w-5 h-5" />
                إنشاء مستند جديد
              </Button>
            </Link>
          </div>

          {/* ===== Stats ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MiniStatCard label="إجمالي المستندات" value={statsData.total} icon={<Layers className="w-5 h-5" />} color="text-gray-600" bgColor="bg-gray-100 dark:bg-gray-800" />
            <MiniStatCard label="المسودات" value={statsData.drafts} icon={<Edit3 className="w-5 h-5" />} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/20" />
            <MiniStatCard label="المكتملة" value={statsData.completed} icon={<CheckCircle className="w-5 h-5" />} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-900/20" />
            <MiniStatCard label="المُصدَّرة" value={statsData.exported} icon={<Download className="w-5 h-5" />} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/20" />
          </div>

          {/* ===== Toolbar ===== */}
          <Card className="rounded-2xl border-gray-100 dark:border-gray-800 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="ابحث في مستنداتك..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 rounded-xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  {([
                    { value: 'all', label: 'الكل' },
                    { value: 'draft', label: 'مسودات' },
                    { value: 'final', label: 'مكتملة' },
                    { value: 'exported', label: 'مُصدَّرة' },
                  ] as { value: FilterStatus; label: string }[]).map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilterStatus(f.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                        filterStatus === f.value
                          ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  <option value="date_desc">الأحدث أولاً</option>
                  <option value="date_asc">الأقدم أولاً</option>
                  <option value="name_asc">الاسم (أ-ي)</option>
                  <option value="name_desc">الاسم (ي-أ)</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'grid' ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'list' ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== Content ===== */}
          {isLoading ? (
            <div className={cn(
              "gap-4",
              viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"
            )}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="rounded-2xl animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <Card className="rounded-[2rem] border-gray-100 dark:border-gray-800">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Archive className="w-10 h-10" />
                </div>
                {records.length === 0 ? (
                  <>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">مكتبتك فارغة</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      لم تنشئ أي مستندات بعد. ابدأ بإنشاء مستندك الأول من محرر القوالب التفاعلي.
                    </p>
                    <Link href="/services">
                      <Button className="rounded-full px-8 font-black gap-2">
                        <PlusCircle className="w-5 h-5" />
                        إنشاء مستند جديد
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">لا توجد نتائج</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      لم يتم العثور على مستندات تطابق معايير البحث
                    </p>
                    <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="rounded-full px-6 font-bold">
                      <RefreshCw className="w-4 h-4 ml-2" />
                      إعادة تعيين الفلاتر
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* ===== Grid View ===== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedRecords.map((record) => {
                const statusConf = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                const StatusIcon = statusConf.icon;
                const recordName = (record as any).template_name || templateNames[record.template_id] || `مستند #${record.id.slice(0, 8)}`;
                const fieldPreview = Object.entries(record.field_values || {}).slice(0, 3);

                return (
                  <Card key={record.id} className="rounded-2xl border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 group overflow-hidden">
                    <CardContent className="p-0">
                      {/* Card Header with gradient */}
                      <div className={cn(
                        "p-4 border-b border-gray-50 dark:border-gray-800",
                        record.status === 'draft' ? 'bg-amber-50/50 dark:bg-amber-900/10' :
                        record.status === 'exported' ? 'bg-blue-50/50 dark:bg-blue-900/10' :
                        'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">
                              {recordName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(record.updated_at || record.created_at).toLocaleDateString('ar-SA', {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          <Badge className={cn("text-[10px] font-bold", statusConf.color)}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {statusConf.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Field Preview */}
                      <div className="p-4 space-y-2">
                        {fieldPreview.length > 0 ? (
                          fieldPreview.map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground truncate max-w-[40%]">{key}</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[55%]">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">لا توجد بيانات</p>
                        )}
                        {Object.keys(record.field_values || {}).length > 3 && (
                          <p className="text-xs text-primary font-bold text-center">
                            +{Object.keys(record.field_values).length - 3} حقول أخرى
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0 flex items-center gap-2">
                        <Link href={`/editor/${record.template_id}?recordId=${record.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full rounded-xl font-bold gap-1.5">
                            {record.status === 'draft' ? (
                              <><Edit3 className="w-3.5 h-3.5" /> تعديل</>
                            ) : (
                              <><Eye className="w-3.5 h-3.5" /> عرض</>
                            )}
                          </Button>
                        </Link>

                        {record.generated_pdf_url && (
                          <a href={record.generated_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="rounded-xl font-bold gap-1.5">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(record)}
                          className="rounded-xl text-gray-400 hover:text-primary"
                          title="نسخ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        {deleteConfirm === record.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              disabled={isDeleting}
                              className="rounded-xl text-xs px-2"
                            >
                              {isDeleting ? '...' : 'تأكيد'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-xl text-xs px-2"
                            >
                              إلغاء
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(record.id)}
                            className="rounded-xl text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* ===== List View ===== */
            <Card className="rounded-2xl border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {paginatedRecords.map((record) => {
                  const statusConf = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                  const StatusIcon = statusConf.icon;
                  const recordName = (record as any).template_name || templateNames[record.template_id] || `مستند #${record.id.slice(0, 8)}`;
                  const fieldCount = Object.keys(record.field_values || {}).length;

                  return (
                    <div key={record.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        record.status === 'draft' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                        record.status === 'exported' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      )}>
                        <StatusIcon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{recordName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(record.updated_at || record.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                          <span>{fieldCount} حقل</span>
                        </div>
                      </div>

                      <Badge className={cn("text-[10px] font-bold shrink-0", statusConf.color)}>
                        {statusConf.label}
                      </Badge>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/editor/${record.template_id}?recordId=${record.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl text-gray-400 hover:text-primary">
                            {record.status === 'draft' ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </Link>

                        {record.generated_pdf_url && (
                          <a href={record.generated_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="rounded-xl text-gray-400 hover:text-blue-500">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(record)}
                          className="rounded-xl text-gray-400 hover:text-primary"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        {deleteConfirm === record.id ? (
                          <div className="flex items-center gap-1">
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(record.id)} disabled={isDeleting} className="rounded-xl text-xs px-2">
                              {isDeleting ? '...' : 'حذف'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)} className="rounded-xl text-xs px-2">
                              إلغاء
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(record.id)} className="rounded-xl text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ===== Pagination ===== */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((page, idx, arr) => (
                  <span key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="rounded-xl w-10"
                    >
                      {page}
                    </Button>
                  </span>
                ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Results count */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            عرض {paginatedRecords.length} من {filteredRecords.length} مستند
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ===== Mini Stat Card =====
function MiniStatCard({ label, value, icon, color, bgColor }: {
  label: string; value: number; icon: React.ReactNode; color: string; bgColor: string;
}) {
  return (
    <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor, color)}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
