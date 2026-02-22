'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  History,
  Clock,
  RotateCcw,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  FileText,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Version {
  id: string;
  version_number: number;
  title: string;
  data: Record<string, any>;
  created_at: string;
  is_current: boolean;
  changes_summary?: string;
  user_name?: string;
}

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  templateTitle?: string;
  onRestore?: (versionData: Record<string, any>) => void;
}

export function VersionHistory({ 
  isOpen, 
  onClose, 
  recordId, 
  templateTitle,
  onRestore 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  useEffect(() => {
    if (isOpen && recordId) {
      fetchVersionHistory();
    }
  }, [isOpen, recordId]);

  const fetchVersionHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.getVersionHistory(recordId);
      if (response.success && response.data) {
        setVersions(response.data);
      }
    } catch (error: any) {
      console.error('Version History Error:', error);
      toast.error('فشل في تحميل تاريخ الإصدارات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: Version) => {
    setIsRestoring(true);
    try {
      const response = await api.restoreVersion(recordId, version.id);
      if (response.success) {
        toast.success(`تم استرداد الإصدار ${version.version_number} بنجاح ✨`);
        
        // Call the onRestore callback with the version data
        if (onRestore) {
          onRestore(version.data);
        }
        
        // Refresh version history
        await fetchVersionHistory();
        setShowRestoreDialog(false);
        setSelectedVersion(null);
      }
    } catch (error: any) {
      console.error('Restore Version Error:', error);
      toast.error('فشل في استرداد الإصدار');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportVersion = async (version: Version) => {
    try {
      const response = await api.exportTemplate(recordId, 'pdf');
      if (response.success && response.data?.url) {
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = `${templateTitle || 'template'}-v${version.version_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.success('تم تصدير الإصدار بنجاح');
      }
    } catch (error: any) {
      console.error('Export Version Error:', error);
      toast.error('فشل في تصدير الإصدار');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  const getVersionIcon = (version: Version) => {
    if (version.is_current) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getVersionBadge = (version: Version) => {
    if (version.is_current) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          الحالي
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-gray-500">
        الإصدار {version.version_number}
      </Badge>
    );
  };

  const renderVersionPreview = (version: Version) => {
    const data = version.data || {};
    const fields = Object.entries(data).slice(0, 5); // Show first 5 fields
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900 dark:text-white">
            {version.title || `الإصدار ${version.version_number}`}
          </h4>
          {getVersionBadge(version)}
        </div>
        
        <div className="space-y-2">
          {fields.map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                {key}:
              </span>
              <span className="text-gray-900 dark:text-white mr-2">
                {typeof value === 'string' 
                  ? value.length > 50 
                    ? `${value.substring(0, 50)}...` 
                    : value
                  : JSON.stringify(value)
                }
              </span>
            </div>
          ))}
          
          {Object.keys(data).length > 5 && (
            <p className="text-xs text-gray-500">
              +{Object.keys(data).length - 5} حقول أخرى
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                <History className="w-6 h-6 text-primary" />
              </div>
              تاريخ الإصدارات
            </DialogTitle>
            <DialogDescription>
              تصفح واسترد الإصدارات السابقة من {templateTitle || 'القالب'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-gray-500">جاري تحميل تاريخ الإصدارات...</p>
                </div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    لا توجد إصدارات سابقة
                  </h3>
                  <p className="text-sm text-gray-500">
                    سيتم حفظ الإصدارات تلقائياً عند إجراء تغييرات على القالب
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <Card 
                      key={version.id} 
                      className={`transition-all duration-200 hover:shadow-md ${
                        version.is_current 
                          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getVersionIcon(version)}
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  {version.title || `الإصدار ${version.version_number}`}
                                </h4>
                                {getVersionBadge(version)}
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(version.created_at)}
                                </span>
                                {version.user_name && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {version.user_name}
                                  </span>
                                )}
                              </div>
                              
                              {version.changes_summary && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {version.changes_summary}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 mr-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVersion(version);
                                setShowPreviewDialog(true);
                              }}
                              className="h-8 w-8 p-0 rounded-lg"
                              title="معاينة"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportVersion(version)}
                              className="h-8 w-8 p-0 rounded-lg"
                              title="تصدير"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            {!version.is_current && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVersion(version);
                                  setShowRestoreDialog(true);
                                }}
                                className="h-8 w-8 p-0 rounded-lg text-primary hover:text-primary"
                                title="استرداد"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={fetchVersionHistory}
              disabled={isLoading}
              className="gap-2 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              تحديث
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="rounded-xl"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              تأكيد الاسترداد
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استرداد الإصدار {selectedVersion?.version_number}؟
              <br />
              سيتم استبدال البيانات الحالية بالبيانات من هذا الإصدار.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedVersion && handleRestore(selectedVersion)}
              disabled={isRestoring}
              className="gap-2"
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              استرداد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              معاينة الإصدار
            </DialogTitle>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-4">
              {renderVersionPreview(selectedVersion)}
              
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                {!selectedVersion.is_current && (
                  <Button
                    onClick={() => {
                      setShowPreviewDialog(false);
                      setShowRestoreDialog(true);
                    }}
                    className="gap-2 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                    استرداد هذا الإصدار
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewDialog(false)}
                  className="rounded-xl"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VersionHistory;