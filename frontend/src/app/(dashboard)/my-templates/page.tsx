'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Download,
  Clock,
  MoreVertical,
  Copy,
  History,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface UserTemplate {
  id: number;
  title: string;
  data: any;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  template: {
    id: number;
    name_ar: string;
    name_en: string;
    thumbnail: string;
    category: {
      id: number;
      name_ar: string;
    };
  };
  variant: {
    id: number;
    name_ar: string;
    thumbnail: string;
  };
  versions_count: number;
}

export default function MyTemplatesPage() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user-templates');
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/user-templates/${deleteId}`);
      setTemplates(prev => prev.filter(t => t.id !== deleteId));
      toast.success('تم حذف القالب');
    } catch (error) {
      toast.error('حدث خطأ في الحذف');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const response = await api.post(`/user-templates/${id}/duplicate`);
      setTemplates(prev => [response.data.data, ...prev]);
      toast.success('تم نسخ القالب');
    } catch (error) {
      toast.error('حدث خطأ في النسخ');
    }
  };

  const handleExport = async (id: number, format: 'image' | 'pdf') => {
    try {
      const response = await api.post(
        `/export/${id}/${format}`,
        {},
        { responseType: 'blob' }
      );

      const template = templates.find(t => t.id === id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${template?.title || 'template'}.${format === 'image' ? 'png' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`تم تصدير الملف بصيغة ${format === 'image' ? 'صورة' : 'PDF'}`);
    } catch (error) {
      toast.error('حدث خطأ في التصدير');
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.template.name_ar.includes(searchQuery)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">قوالبي</h1>
          <p className="text-gray-500 mt-1">
            جميع القوالب التي قمت بإنشائها أو تعديلها
          </p>
        </div>

        <Link href="/templates">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            قالب جديد
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="ابحث في قوالبك..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد قوالب'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'جرب البحث بكلمات مختلفة'
              : 'ابدأ بإنشاء قالبك الأول'}
          </p>
          {!searchQuery && (
            <Link href="/templates">
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                تصفح القوالب
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-100">
                {template.variant?.thumbnail ? (
                  <Image
                    src={template.variant.thumbnail}
                    alt={template.title}
                    fill
                    className="object-cover"
                  />
                ) : template.template?.thumbnail ? (
                  <Image
                    src={template.template.thumbnail}
                    alt={template.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText className="w-16 h-16" />
                  </div>
                )}

                {/* Status Badge */}
                <Badge
                  className={`absolute top-2 right-2 ${
                    template.is_completed ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                >
                  {template.is_completed ? 'مكتمل' : 'مسودة'}
                </Badge>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 left-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(template.id, 'image')}>
                      <Download className="w-4 h-4 ml-2" />
                      تصدير كصورة
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(template.id, 'pdf')}>
                      <Download className="w-4 h-4 ml-2" />
                      تصدير PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Link href={`/my-templates/${template.id}/versions`}>
                      <DropdownMenuItem>
                        <History className="w-4 h-4 ml-2" />
                        سجل التغييرات ({template.versions_count})
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{template.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.template?.category?.name_ar}</Badge>
                  <span className="text-xs text-gray-500">{template.template?.name_ar}</span>
                </div>
              </CardHeader>

              <CardFooter className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(template.updated_at)}
                </div>

                <Link href={`/my-templates/${template.id}/edit`}>
                  <Button size="sm">
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا القالب نهائياً ولن تتمكن من استعادته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
