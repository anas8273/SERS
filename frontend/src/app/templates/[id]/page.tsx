'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Heart,
  Star,
  Eye,
  Download,
  Share2,
  ChevronRight,
  Palette,
  FileText,
  Sparkles,
} from 'lucide-react';
import InteractiveEditor from '@/components/editor/InteractiveEditor';

interface TemplateField {
  id: number;
  name: string;
  label_ar: string;
  label_en: string;
  type: 'text' | 'textarea' | 'image' | 'date' | 'select' | 'signature';
  placeholder_ar: string;
  placeholder_en: string;
  is_required: boolean;
  default_value: string;
  options: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  font_size: number;
  font_family: string;
  font_color: string;
  text_align: string;
}

interface TemplateVariant {
  id: number;
  name_ar: string;
  name_en: string;
  background_image: string;
  thumbnail: string;
  is_default: boolean;
}

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
  category: {
    id: number;
    name_ar: string;
    name_en: string;
    slug: string;
    parent?: {
      id: number;
      name_ar: string;
      name_en: string;
    };
  };
  fields: TemplateField[];
  variants: TemplateVariant[];
}

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<TemplateVariant | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTemplate();
    }
  }, [params.id]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/templates/${params.id}`);
      const templateData = response.data.data;
      setTemplate(templateData);
      
      // Set default variant
      const defaultVariant = templateData.variants?.find((v: TemplateVariant) => v.is_default) 
        || templateData.variants?.[0];
      setSelectedVariant(defaultVariant);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('حدث خطأ في تحميل القالب');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      router.push('/login');
      return;
    }

    try {
      await api.post(`/templates/${params.id}/favorite`);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleStartEditing = () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      router.push('/login');
      return;
    }

    if (template && !template.is_free && (template.price || 0) > 0) {
      // Check if user has purchased
      // For now, just show editor
    }

    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[500px] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">القالب غير موجود</h2>
          <Button onClick={() => router.push('/templates')}>
            العودة للقوالب
          </Button>
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <InteractiveEditor
        templateSlug={params.id as string}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <a href="/templates" className="hover:text-primary">القوالب</a>
            <ChevronRight className="w-4 h-4" />
            {template.category?.parent && (
              <>
                <span>{template.category.parent.name_ar}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span>{template.category?.name_ar}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white">{template.name_ar}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="space-y-4">
            {/* Main Preview */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[3/4] bg-gray-100">
                {selectedVariant?.background_image ? (
                  <Image
                    src={selectedVariant.background_image}
                    alt={template.name_ar}
                    fill
                    className="object-contain"
                  />
                ) : template.thumbnail ? (
                  <Image
                    src={template.thumbnail}
                    alt={template.name_ar}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText className="w-24 h-24" />
                  </div>
                )}
                
                {/* Watermark for preview */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-4xl font-bold text-gray-400/30 rotate-[-30deg]">
                    معاينة
                  </div>
                </div>
              </div>
            </Card>

            {/* Variants */}
            {template.variants && template.variants.length > 1 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  الأشكال المتاحة ({template.variants.length})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {template.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {variant.thumbnail ? (
                        <Image
                          src={variant.thumbnail}
                          alt={variant.name_ar}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold">{template.name_ar}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={isFavorite ? 'text-red-500' : ''}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {template.is_featured && (
                  <Badge className="bg-yellow-500">
                    <Star className="w-3 h-3 ml-1" />
                    مميز
                  </Badge>
                )}
                {template.is_free && (
                  <Badge className="bg-green-500">مجاني</Badge>
                )}
                <Badge variant="outline">{template.category?.name_ar}</Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {template.usage_count} استخدام
              </span>
              <span className="flex items-center gap-1">
                <Palette className="w-4 h-4" />
                {template.variants?.length || 1} شكل
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {template.fields?.length || 0} حقل
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">الوصف</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {template.description_ar}
              </p>
            </div>

            {/* Fields Preview */}
            {template.fields && template.fields.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">الحقول المطلوبة</h3>
                <div className="flex flex-wrap gap-2">
                  {template.fields.map((field) => (
                    <Badge key={field.id} variant="secondary">
                      {field.label_ar}
                      {field.is_required && <span className="text-red-500 mr-1">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Price & CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">السعر</span>
                  <span className="text-3xl font-bold text-primary">
                    {template.is_free ? 'مجاني' : `${template.price} ر.س`}
                  </span>
                </div>
                
                <Button
                  onClick={handleStartEditing}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 ml-2" />
                  ابدأ التعديل الآن
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  يمكنك تعبئة القالب وتصديره بصيغة PDF أو صورة
                </p>
              </CardContent>
            </Card>

            {/* Share */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 ml-2" />
                مشاركة
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
