'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { TemplateEditor } from './TemplateEditor';
import { AIAssistant } from './AIAssistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  BrainCircuit,
  Sparkles,
  Save,
  Download,
  Share2,
  Settings,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Eye,
  Clock,
  User,
  FileText,
  Palette,
  Layout,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveEditorProps {
  templateSlug: string;
}

interface Template {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  type: 'interactive' | 'ready';
  category: {
    id: string;
    name_ar: string;
    slug: string;
  };
  fields: any[];
  variants: any[];
  is_paid: boolean;
  price: number;
  discount_price?: number;
}

export function InteractiveEditor({ templateSlug }: InteractiveEditorProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // State
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Load template and check access
  useEffect(() => {
    const loadTemplate = async () => {
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.getTemplateForEditor(templateSlug);
        
        if (response.success && response.data) {
          const templateData = response.data.template;
          setTemplate(templateData);
          
          // Check if payment is required
          if (templateData.is_paid && !response.data.has_access) {
            setIsPaymentRequired(true);
            return;
          }
          
          // Load existing record if available
          if (response.data.record) {
            setRecordId(response.data.record.id);
            setFormData(response.data.record.user_data || {});
          }
        } else {
          throw new Error('فشل في تحميل القالب');
        }
      } catch (error: any) {
        console.error('Template Load Error:', error);
        toast.error(error.message || 'حدث خطأ أثناء تحميل القالب');
        router.push('/marketplace');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateSlug, user, router]);

  // Calculate completion percentage
  useEffect(() => {
    if (!template) return;
    
    const requiredFields = template.fields.filter(f => f.is_required);
    const filledFields = requiredFields.filter(f => formData[f.name]?.toString().trim());
    const percentage = requiredFields.length > 0 
      ? Math.round((filledFields.length / requiredFields.length) * 100)
      : 100;
    
    setCompletionPercentage(percentage);
  }, [template, formData]);

  // Handle AI suggestions
  const handleAISuggestion = useCallback((fieldName: string, suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: suggestion
    }));
    toast.success(`تم تطبيق الاقتراح لحقل "${fieldName}" ✨`);
  }, []);

  // Handle payment redirect
  const handlePayment = () => {
    if (!template) return;
    
    toast.success('🔒 جاري توجيهك لبوابة الدفع...', {
      icon: '💳',
      duration: 2000,
    });
    router.push(`/checkout?template=${template.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              جاري تحميل المحرر الذكي
            </h3>
            <p className="text-sm text-gray-500">
              يتم إعداد بيئة التحرير المتقدمة...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Payment required state
  if (isPaymentRequired && template) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              يتطلب الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {template.name_ar}
              </h3>
              <p className="text-sm text-gray-500">
                هذا القالب مدفوع ويتطلب الشراء للوصول إلى المحرر الذكي
              </p>
            </div>
            
            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-primary mb-1">
                {template.discount_price 
                  ? `${template.discount_price} ر.س`
                  : `${template.price} ر.س`
                }
              </div>
              {template.discount_price && (
                <div className="text-sm text-gray-500 line-through">
                  {template.price} ر.س
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg"
              >
                <Zap className="w-5 h-5" />
                شراء والوصول للمحرر
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/marketplace')}
                className="w-full h-12 rounded-xl font-bold"
              >
                العودة للسوق
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main editor interface
  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              فشل في تحميل القالب
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              حدث خطأ أثناء تحميل القالب المطلوب
            </p>
            <Button
              onClick={() => router.push('/marketplace')}
              variant="outline"
              className="rounded-xl"
            >
              العودة للسوق
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Enhanced Header with AI Prominence */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Template Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white">
                  {template.name_ar}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    <Zap className="w-3 h-3 mr-1" />
                    محرر ذكي
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {template.category.name_ar}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Progress */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    الإكمال
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {completionPercentage}%
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>

            {/* Right: AI Assistant Button (Prominent) */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAIAssistant(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/25 font-black text-lg px-6 py-3 h-auto rounded-2xl gap-3 transform hover:scale-105 transition-all duration-200"
              >
                <BrainCircuit className="w-6 h-6" />
                <span className="hidden sm:inline">مساعدة الذكاء الاصطناعي</span>
                <span className="sm:hidden">AI</span>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </Button>
            </div>
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                إكمال القالب
              </span>
              <span className="text-xs font-bold text-primary">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="flex-1">
        <TemplateEditor
          recordId={recordId || undefined}
          template={template}
          initialData={formData}
          onSave={(data) => {
            setFormData(data);
            toast.success('تم حفظ التغييرات بنجاح ✨');
          }}
          onClose={() => router.push('/marketplace')}
        />
      </main>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <AIAssistant
          template={template}
          formData={formData}
          onSuggestion={handleAISuggestion}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Context-Aware Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => setShowAIAssistant(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-2xl shadow-purple-500/30 transform hover:scale-110 transition-all duration-300"
        >
          <BrainCircuit className="w-7 h-7" />
        </Button>
      </div>
    </div>
  );
}

export default InteractiveEditor;