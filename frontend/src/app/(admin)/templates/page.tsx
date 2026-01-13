'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Upload,
  FileText,
  Palette,
  Settings,
  MoreVertical,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Template {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  thumbnail: string;
  price: number;
  is_free: boolean;
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  category_id: number;
  category: {
    id: number;
    name_ar: string;
  };
  variants_count: number;
  fields_count: number;
}

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  children?: Category[];
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    category_id: '',
    price: '0',
    is_free: true,
    is_featured: false,
    is_active: true,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        api.get('/admin/templates'),
        api.get('/categories'),
      ]);
      setTemplates(templatesRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_ar || !formData.category_id) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, String(value));
      });
      if (thumbnailFile) {
        data.append('thumbnail', thumbnailFile);
      }

      if (editingTemplate) {
        await api.post(`/admin/templates/${editingTemplate.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('تم تحديث القالب بنجاح');
      } else {
        await api.post('/admin/templates', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('تم إنشاء القالب بنجاح');
      }

      setShowCreateDialog(false);
      setEditingTemplate(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name_ar: template.name_ar,
      name_en: template.name_en || '',
      description_ar: template.description_ar || '',
      description_en: template.description_en || '',
      category_id: template.category_id.toString(),
      price: template.price.toString(),
      is_free: template.is_free,
      is_featured: template.is_featured,
      is_active: template.is_active,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    try {
      await api.delete(`/admin/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('تم حذف القالب');
    } catch (error) {
      toast.error('حدث خطأ في الحذف');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await api.patch(`/admin/templates/${id}/toggle-active`);
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, is_active: !isActive } : t))
      );
      toast.success(isActive ? 'تم إلغاء تفعيل القالب' : 'تم تفعيل القالب');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleToggleFeatured = async (id: number, isFeatured: boolean) => {
    try {
      await api.patch(`/admin/templates/${id}/toggle-featured`);
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, is_featured: !isFeatured } : t))
      );
      toast.success(isFeatured ? 'تم إزالة التمييز' : 'تم تمييز القالب');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      category_id: '',
      price: '0',
      is_free: true,
      is_featured: false,
      is_active: true,
    });
    setThumbnailFile(null);
  };

  const filteredTemplates = templates.filter(t =>
    t.name_ar.includes(searchQuery) ||
    t.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.name_ar.includes(searchQuery)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة القوالب التفاعلية</h1>
          <p className="text-gray-500 mt-1">
            إنشاء وتعديل القوالب التفاعلية وإدارة الحقول والأشكال
          </p>
        </div>

        <Button onClick={() => {
          resetForm();
          setEditingTemplate(null);
          setShowCreateDialog(true);
        }}>
          <Plus className="w-4 h-4 ml-2" />
          قالب جديد
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="ابحث عن قالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Templates Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">الصورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead className="text-center">الأشكال</TableHead>
                <TableHead className="text-center">الحقول</TableHead>
                <TableHead className="text-center">الاستخدام</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden">
                      {template.thumbnail ? (
                        <Image
                          src={template.thumbnail}
                          alt={template.name_ar}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name_ar}</p>
                      {template.is_featured && (
                        <Badge className="bg-yellow-500 mt-1">
                          <Star className="w-3 h-3 ml-1" />
                          مميز
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category?.name_ar}</Badge>
                  </TableCell>
                  <TableCell>
                    {template.is_free ? (
                      <Badge className="bg-green-500">مجاني</Badge>
                    ) : (
                      <span>{template.price} ر.س</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{template.variants_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{template.fields_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {template.usage_count}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => handleToggleActive(template.id, template.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Palette className="w-4 h-4 ml-2" />
                          إدارة الأشكال
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 ml-2" />
                          إدارة الحقول
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(template.id, template.is_featured)}
                        >
                          <Star className="w-4 h-4 ml-2" />
                          {template.is_featured ? 'إزالة التمييز' : 'تمييز'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات القالب التفاعلي
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">التصنيف *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_ar">الوصف بالعربية</Label>
              <Textarea
                id="description_ar"
                value={formData.description_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">السعر</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  disabled={formData.is_free}
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_free}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked }))}
                  />
                  <Label>مجاني</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label>مميز</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>صورة القالب</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="thumbnail"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                />
                <Label htmlFor="thumbnail" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {thumbnailFile ? thumbnailFile.name : 'اختر صورة'}
                  </p>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : editingTemplate ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
