'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Bot,
  Save,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  Wand2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface AIPrompt {
  id: string;
  field_name: string;
  field_label: string;
  prompt_type: 'fill' | 'suggest' | 'validate' | 'transform';
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  model: string;
}

interface AIPromptManagerProps {
  templateId: string;
  fields?: Array<{ id: string; name: string; label_ar: string; ai_enabled: boolean }>;
}

const PROMPT_TYPES = [
  { value: 'fill', label: 'ملء تلقائي', icon: Wand2, description: 'يملأ الحقل تلقائياً بناءً على السياق' },
  { value: 'suggest', label: 'اقتراحات', icon: Sparkles, description: 'يقدم اقتراحات متعددة للمستخدم' },
  { value: 'validate', label: 'تحقق', icon: CheckCircle2, description: 'يتحقق من صحة المدخلات' },
  { value: 'transform', label: 'تحويل', icon: RefreshCw, description: 'يحول النص لصيغة أخرى' },
];

const AI_MODELS = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (سريع)' },
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (أسرع)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

const PROMPT_TEMPLATES = {
  fill: {
    system: 'أنت مساعد تعليمي متخصص في إنشاء المحتوى التعليمي السعودي. أجب بالعربية فقط وبشكل مختصر ومفيد.',
    user: 'قم بملء حقل "{{field_label}}" بناءً على المعلومات التالية:\n{{context}}\n\nأعط إجابة مباشرة بدون شرح إضافي.',
  },
  suggest: {
    system: 'أنت مساعد تعليمي. قدم 3 اقتراحات مناسبة بالعربية، كل اقتراح في سطر منفصل.',
    user: 'اقترح 3 خيارات لحقل "{{field_label}}":\nالسياق: {{context}}\n\nقدم الاقتراحات مرقمة.',
  },
  validate: {
    system: 'أنت مدقق محتوى تعليمي. تحقق من صحة المدخلات وأعط ملاحظات بالعربية.',
    user: 'تحقق من صحة القيمة التالية لحقل "{{field_label}}":\nالقيمة: {{value}}\n\nأجب بـ "صحيح" أو اذكر المشكلة.',
  },
  transform: {
    system: 'أنت محرر نصوص تعليمية. حول النص للصيغة المطلوبة بالعربية.',
    user: 'حول النص التالي لحقل "{{field_label}}":\nالنص الأصلي: {{value}}\n\nحوله لصيغة رسمية مناسبة.',
  },
};

export function AIPromptManager({ templateId, fields = [] }: AIPromptManagerProps) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // New prompt form
  const [newPrompt, setNewPrompt] = useState<Partial<AIPrompt>>({
    field_name: '',
    prompt_type: 'fill',
    system_prompt: PROMPT_TEMPLATES.fill.system,
    user_prompt_template: PROMPT_TEMPLATES.fill.user,
    temperature: 0.7,
    max_tokens: 500,
    is_active: true,
    model: 'gpt-4.1-mini',
  });

  useEffect(() => {
    loadPrompts();
  }, [templateId]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/templates/${templateId}/ai-prompts`);
      if (response.success) {
        setPrompts(response.data || []);
      }
    } catch (error: any) {
      console.error('AI Prompts load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompts = async () => {
    setIsSaving(true);
    try {
      const response = await api.put(`/admin/templates/${templateId}/ai-prompts`, {
        prompts: prompts,
      });

      if (response.success) {
        toast.success('تم حفظ إعدادات الذكاء الاصطناعي بنجاح');
        setHasChanges(false);
      }
    } catch (error: any) {
      console.error('AI Prompts save error:', error);
      toast.error('فشل في حفظ إعدادات الذكاء الاصطناعي');
    } finally {
      setIsSaving(false);
    }
  };

  const addPrompt = () => {
    if (!newPrompt.field_name) {
      toast.error('يرجى اختيار الحقل');
      return;
    }

    const field = fields.find(f => f.name === newPrompt.field_name);
    const prompt: AIPrompt = {
      id: `prompt_${Date.now()}`,
      field_name: newPrompt.field_name!,
      field_label: field?.label_ar || newPrompt.field_name!,
      prompt_type: newPrompt.prompt_type as any || 'fill',
      system_prompt: newPrompt.system_prompt || '',
      user_prompt_template: newPrompt.user_prompt_template || '',
      temperature: newPrompt.temperature || 0.7,
      max_tokens: newPrompt.max_tokens || 500,
      is_active: newPrompt.is_active ?? true,
      model: newPrompt.model || 'gpt-4.1-mini',
    };

    setPrompts([...prompts, prompt]);
    setHasChanges(true);
    setShowAddPrompt(false);
    resetNewPrompt();
    toast.success('تم إضافة البرومبت بنجاح');
  };

  const removePrompt = (promptId: string) => {
    setPrompts(prompts.filter(p => p.id !== promptId));
    setHasChanges(true);
    toast.success('تم حذف البرومبت');
  };

  const updatePrompt = (promptId: string, updates: Partial<AIPrompt>) => {
    setPrompts(prompts.map(p =>
      p.id === promptId ? { ...p, ...updates } : p
    ));
    setHasChanges(true);
  };

  const resetNewPrompt = () => {
    setNewPrompt({
      field_name: '',
      prompt_type: 'fill',
      system_prompt: PROMPT_TEMPLATES.fill.system,
      user_prompt_template: PROMPT_TEMPLATES.fill.user,
      temperature: 0.7,
      max_tokens: 500,
      is_active: true,
      model: 'gpt-4.1-mini',
    });
  };

  const handlePromptTypeChange = (type: string) => {
    const template = PROMPT_TEMPLATES[type as keyof typeof PROMPT_TEMPLATES];
    setNewPrompt({
      ...newPrompt,
      prompt_type: type as 'fill' | 'suggest' | 'validate' | 'transform',
      system_prompt: template?.system || '',
      user_prompt_template: template?.user || '',
    });
  };

  // Preview AI response
  const previewPrompt = async (prompt: AIPrompt) => {
    setShowPreview(prompt.id);
    setIsPreviewLoading(true);
    setPreviewResult('');

    try {
      const response = await api.post(`/admin/templates/${templateId}/ai-prompts/preview`, {
        system_prompt: prompt.system_prompt,
        user_prompt: prompt.user_prompt_template.replace('{{field_label}}', prompt.field_label).replace('{{context}}', 'بيانات تجريبية للمعاينة').replace('{{value}}', 'قيمة تجريبية'),
        model: prompt.model,
        temperature: prompt.temperature,
        max_tokens: prompt.max_tokens,
      });

      if (response.success) {
        setPreviewResult(response.data.result || 'لا توجد نتيجة');
      }
    } catch (error: any) {
      setPreviewResult('فشل في المعاينة - تأكد من إعدادات API');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const aiEnabledFields = fields.filter(f => f.ai_enabled);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-gray-500">جاري تحميل إعدادات الذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-500" />
            إدارة الذكاء الاصطناعي
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            إعداد Hidden Prompts لكل حقل في القالب
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <AlertCircle className="w-3 h-3 mr-1" />
              تغييرات غير محفوظة
            </Badge>
          )}

          <Button onClick={() => setShowAddPrompt(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4" />
            إضافة برومبت
          </Button>

          <Button onClick={savePrompts} disabled={isSaving || !hasChanges} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {/* AI Fields Info */}
      {aiEnabledFields.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-300">لا توجد حقول مفعّل فيها الذكاء الاصطناعي</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                يرجى تفعيل الذكاء الاصطناعي في منشئ المخطط (Schema Builder) أولاً لإضافة البرومبتات.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts List */}
      {prompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">لا توجد برومبتات</h3>
            <p className="text-sm text-gray-500 mb-4">أضف Hidden Prompts لتفعيل الذكاء الاصطناعي في القالب</p>
            <Button onClick={() => setShowAddPrompt(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4" />
              إضافة أول برومبت
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => {
            const typeInfo = PROMPT_TYPES.find(t => t.value === prompt.prompt_type);
            const TypeIcon = typeInfo?.icon || Bot;

            return (
              <Card key={prompt.id} className={`transition-all ${!prompt.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        prompt.prompt_type === 'fill' ? 'bg-blue-100 text-blue-600' :
                        prompt.prompt_type === 'suggest' ? 'bg-purple-100 text-purple-600' :
                        prompt.prompt_type === 'validate' ? 'bg-green-100 text-green-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{prompt.field_label}</h4>
                          <Badge variant="outline" className="text-xs">{typeInfo?.label}</Badge>
                          <Badge variant="outline" className="text-xs">{prompt.model}</Badge>
                          {!prompt.is_active && (
                            <Badge variant="outline" className="text-red-500 border-red-300">معطّل</Badge>
                          )}
                        </div>

                        <div className="mt-2 space-y-2">
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1 font-medium">System Prompt:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{prompt.system_prompt}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1 font-medium">User Prompt Template:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{prompt.user_prompt_template}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Temperature: {prompt.temperature}</span>
                          <span>Max Tokens: {prompt.max_tokens}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mr-4">
                      <Switch
                        checked={prompt.is_active}
                        onCheckedChange={(checked) => updatePrompt(prompt.id, { is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewPrompt(prompt)}
                        className="h-8 w-8 p-0 text-purple-500"
                        title="معاينة"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPrompt(prompt)}
                        className="h-8 w-8 p-0"
                        title="تعديل"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrompt(prompt.id)}
                        className="h-8 w-8 p-0 text-red-500"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Prompt Dialog */}
      <Dialog open={showAddPrompt} onOpenChange={setShowAddPrompt}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              إضافة Hidden Prompt جديد
            </DialogTitle>
            <DialogDescription>
              أعد برومبت مخفي للذكاء الاصطناعي لمساعدة المستخدم في ملء الحقول
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Field Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحقل المستهدف</Label>
                <Select
                  value={newPrompt.field_name}
                  onValueChange={(value) => setNewPrompt({ ...newPrompt, field_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر حقل..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        <div className="flex items-center gap-2">
                          {field.label_ar}
                          {field.ai_enabled && <Badge className="text-[10px] bg-purple-100 text-purple-600">AI</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع البرومبت</Label>
                <Select
                  value={newPrompt.prompt_type}
                  onValueChange={handlePromptTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Model & Parameters */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>النموذج</Label>
                <Select
                  value={newPrompt.model}
                  onValueChange={(value) => setNewPrompt({ ...newPrompt, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature ({newPrompt.temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={newPrompt.temperature}
                  onChange={(e) => setNewPrompt({ ...newPrompt, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={newPrompt.max_tokens}
                  onChange={(e) => setNewPrompt({ ...newPrompt, max_tokens: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                System Prompt
                <Badge variant="outline" className="text-[10px]">مخفي عن المستخدم</Badge>
              </Label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={newPrompt.system_prompt}
                onChange={(e) => setNewPrompt({ ...newPrompt, system_prompt: e.target.value })}
                placeholder="تعليمات النظام للذكاء الاصطناعي..."
              />
            </div>

            {/* User Prompt Template */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                User Prompt Template
                <Badge variant="outline" className="text-[10px]">يدعم المتغيرات</Badge>
              </Label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={newPrompt.user_prompt_template}
                onChange={(e) => setNewPrompt({ ...newPrompt, user_prompt_template: e.target.value })}
                placeholder="قالب الطلب مع المتغيرات..."
              />
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-purple-50"
                  onClick={() => setNewPrompt({ ...newPrompt, user_prompt_template: (newPrompt.user_prompt_template || '') + '{{field_label}}' })}>
                  {'{{field_label}}'} - اسم الحقل
                </Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-purple-50"
                  onClick={() => setNewPrompt({ ...newPrompt, user_prompt_template: (newPrompt.user_prompt_template || '') + '{{context}}' })}>
                  {'{{context}}'} - السياق
                </Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-purple-50"
                  onClick={() => setNewPrompt({ ...newPrompt, user_prompt_template: (newPrompt.user_prompt_template || '') + '{{value}}' })}>
                  {'{{value}}'} - القيمة الحالية
                </Badge>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={addPrompt} className="flex-1 bg-purple-600 hover:bg-purple-700">
                إضافة البرومبت
              </Button>
              <Button variant="outline" onClick={() => setShowAddPrompt(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              معاينة نتيجة الذكاء الاصطناعي
            </DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 min-h-[100px]">
            {isPreviewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="mr-2 text-sm text-gray-500">جاري التوليد...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {previewResult || 'لا توجد نتيجة'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Dialog */}
      <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل البرومبت - {editingPrompt?.field_label}</DialogTitle>
          </DialogHeader>
          {editingPrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>النموذج</Label>
                  <Select
                    value={editingPrompt.model}
                    onValueChange={(value) => {
                      setEditingPrompt({ ...editingPrompt, model: value });
                      updatePrompt(editingPrompt.id, { model: value });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Temperature ({editingPrompt.temperature})</Label>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={editingPrompt.temperature}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEditingPrompt({ ...editingPrompt, temperature: val });
                      updatePrompt(editingPrompt.id, { temperature: val });
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={editingPrompt.max_tokens}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setEditingPrompt({ ...editingPrompt, max_tokens: val });
                      updatePrompt(editingPrompt.id, { max_tokens: val });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>System Prompt</Label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editingPrompt.system_prompt}
                  onChange={(e) => {
                    setEditingPrompt({ ...editingPrompt, system_prompt: e.target.value });
                    updatePrompt(editingPrompt.id, { system_prompt: e.target.value });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>User Prompt Template</Label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editingPrompt.user_prompt_template}
                  onChange={(e) => {
                    setEditingPrompt({ ...editingPrompt, user_prompt_template: e.target.value });
                    updatePrompt(editingPrompt.id, { user_prompt_template: e.target.value });
                  }}
                />
              </div>

              <Button onClick={() => setEditingPrompt(null)} className="w-full">
                تم التعديل
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AIPromptManager;
