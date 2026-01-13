'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  History,
  Clock,
  RotateCcw,
  Eye,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Version {
  id: number;
  version_number: number;
  data: any;
  change_summary: string;
  created_at: string;
}

interface VersionHistoryProps {
  userTemplateDataId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (data: any) => void;
}

export default function VersionHistory({
  userTemplateDataId,
  open,
  onOpenChange,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (open && userTemplateDataId) {
      fetchVersions();
    }
  }, [open, userTemplateDataId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/user-templates/${userTemplateDataId}/versions`);
      setVersions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('حدث خطأ في تحميل سجل التغييرات');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      await api.post(`/user-templates/${userTemplateDataId}/versions/${selectedVersion.id}/restore`);
      onRestore(selectedVersion.data);
      toast.success(`تم استعادة النسخة ${selectedVersion.version_number}`);
      setShowRestoreDialog(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ في استعادة النسخة');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(dateString);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              سجل التغييرات
            </SheetTitle>
            <SheetDescription>
              استعرض التغييرات السابقة واستعد أي نسخة
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-semibold mb-2">لا توجد نسخ سابقة</h3>
                <p className="text-sm text-gray-500">
                  سيتم حفظ التغييرات تلقائياً عند التعديل
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-6">
                  {versions.map((version, index) => (
                    <div key={version.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? 'bg-primary'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        {version.version_number}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  النسخة {version.version_number}
                                </span>
                                {index === 0 && (
                                  <Badge className="bg-green-500">الحالية</Badge>
                                )}
                              </div>
                              {version.change_summary && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {version.change_summary}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(version.created_at)}
                            </div>

                            {index !== 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVersion(version);
                                  setShowRestoreDialog(true);
                                }}
                              >
                                <RotateCcw className="w-4 h-4 ml-1" />
                                استعادة
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استعادة النسخة السابقة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استعادة النسخة {selectedVersion?.version_number}؟
              سيتم استبدال البيانات الحالية بهذه النسخة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring}>
              {restoring ? 'جاري الاستعادة...' : 'استعادة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
