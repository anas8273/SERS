'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, RefreshCw, Check, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

// Available prompt types and their context
export type AIPromptType =
    | 'objectives'        // أهداف الدرس
    | 'description'       // وصف عام
    | 'certificate_text'  // نص شهادة
    | 'evidence_desc'     // وصف شاهد أداء
    | 'plan_content'      // محتوى خطة
    | 'topics'            // مواضيع المنهج
    | 'questions'         // أسئلة اختبار
    | 'notes'             // ملاحظات
    | 'followup'          // إجراء متابعة
    | 'abstract'          // ملخص بحثي
    | 'worksheet'         // ورقة عمل
    | 'general';          // عام

export interface AIAssistContext {
    subject?: string;
    grade?: string;
    topic?: string;
    category?: string;
    type?: string;
    existingContent?: string;
    [key: string]: any;
}

interface AIAssistButtonProps {
    promptType: AIPromptType;
    context?: AIAssistContext;
    onResult: (text: string) => void;
    className?: string;
    variant?: 'button' | 'inline' | 'icon';
    label?: string;
    disabled?: boolean;
}

const PROMPT_TEMPLATES: Record<AIPromptType, { ar: string; en: string; instruction: string }> = {
    objectives: {
        ar: 'أهداف الدرس',
        en: 'Lesson Objectives',
        instruction: 'اكتب أهداف تعليمية واضحة وقابلة للقياس باستخدام تصنيف بلوم',
    },
    description: {
        ar: 'وصف',
        en: 'Description',
        instruction: 'اكتب وصفاً مهنياً واضحاً ومختصراً',
    },
    certificate_text: {
        ar: 'نص شهادة',
        en: 'Certificate Text',
        instruction: 'اكتب نص شهادة تقدير رسمية احترافية',
    },
    evidence_desc: {
        ar: 'وصف شاهد أداء',
        en: 'Performance Evidence',
        instruction: 'اكتب وصفاً تفصيلياً لشاهد الأداء الوظيفي يوضح المهارات والكفايات',
    },
    plan_content: {
        ar: 'محتوى الخطة',
        en: 'Plan Content',
        instruction: 'اكتب خطة تعليمية منظمة تشمل الأهداف والأنشطة والتقويم',
    },
    topics: {
        ar: 'مواضيع المنهج',
        en: 'Curriculum Topics',
        instruction: 'اكتب قائمة مرتبة بمواضيع ووحدات المنهج الدراسي',
    },
    questions: {
        ar: 'أسئلة اختبار',
        en: 'Test Questions',
        instruction: 'اكتب أسئلة اختبار متنوعة المستويات (تذكر، فهم، تطبيق، تحليل)',
    },
    notes: {
        ar: 'ملاحظات',
        en: 'Notes',
        instruction: 'اكتب ملاحظات مهنية واضحة ومفيدة',
    },
    followup: {
        ar: 'إجراء متابعة',
        en: 'Follow-up Action',
        instruction: 'اكتب إجراء متابعة واضح ومحدد زمنياً وقابل للتحقق',
    },
    abstract: {
        ar: 'ملخص بحثي',
        en: 'Research Abstract',
        instruction: 'اكتب ملخصاً بحثياً أكاديمياً يشمل الهدف والمنهجية والنتائج',
    },
    worksheet: {
        ar: 'ورقة عمل',
        en: 'Worksheet',
        instruction: 'اكتب محتوى ورقة عمل تعليمية تفاعلية مناسبة للمرحلة',
    },
    general: {
        ar: 'محتوى',
        en: 'Content',
        instruction: 'اكتب محتوى تعليمي مهني واحترافي',
    },
};

const SUBJECTS = [
    'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم',
    'الفيزياء', 'الكيمياء', 'الأحياء', 'الدراسات الاجتماعية',
    'التربية الإسلامية', 'الحاسب الآلي', 'التربية الفنية', 'التربية البدنية',
];

const GRADES = [
    'الأول ابتدائي', 'الثاني ابتدائي', 'الثالث ابتدائي',
    'الرابع ابتدائي', 'الخامس ابتدائي', 'السادس ابتدائي',
    'الأول متوسط', 'الثاني متوسط', 'الثالث متوسط',
    'الأول ثانوي', 'الثاني ثانوي', 'الثالث ثانوي',
];

export function AIAssistButton({
    promptType,
    context = {},
    onResult,
    className,
    variant = 'button',
    label,
    disabled = false,
}: AIAssistButtonProps) {
    const { dir, t, locale } = useTranslation() as any;
    const isAr = dir === 'rtl';
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [extraInstructions, setExtraInstructions] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(context.subject || '');
    const [selectedGrade, setSelectedGrade] = useState(context.grade || '');

    const template = PROMPT_TEMPLATES[promptType] || PROMPT_TEMPLATES.general;
    const templateLabel = isAr ? template.ar : (template.en || template.ar);

    const buildPrompt = () => {
        const sersContext = `أنت مساعد متخصص في إنشاء المحتوى التعليمي لمنصة SERS السعودية.\nالمنصة تخدم المعلمين والمعلمات في المملكة العربية السعودية لإنشاء السجلات التعليمية الرسمية.\nاكتب المحتوى بأسلوب مهني رسمي مناسب للوثائق التعليمية الرسمية. لا تتجاوز 3-5 أسطر ما لم يُطلب أكثر.`;
        const parts = [sersContext, '', template.instruction];
        if (selectedSubject) parts.push(`المادة الدراسية: ${selectedSubject}`);
        if (selectedGrade) parts.push(`المرحلة/الصف: ${selectedGrade}`);
        if (context.topic) parts.push(`الموضوع: ${context.topic}`);
        if (context.category) parts.push(`البند: ${context.category}`);
        if (context.type) parts.push(`نوع السجل: ${context.type}`);
        if (context.existingContent) parts.push(`المحتوى الحالي للتحسين:\n${context.existingContent}`);
        if (extraInstructions) parts.push(`تعليمات إضافية: ${extraInstructions}`);
        parts.push('أجب باللغة العربية الفصحى مباشرة بالمحتوى المطلوب، بدون مقدمات أو تفسيرات.');
        return parts.join('\n');
    };

    const handleGenerate = useCallback(async () => {
        setLoading(true);
        setResult('');
        try {
            const prompt = buildPrompt();
            const response = await api.chatWithAI(prompt, undefined, locale);
            const text = response?.data?.message || response?.data?.response || response?.data?.content || '';
            setResult(text);
        } catch (error: any) {
            toast.error(t('common.aiError') || 'فشل الاتصال بالذكاء الاصطناعي');
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [promptType, selectedSubject, selectedGrade, extraInstructions, context]);

    const handleAccept = () => {
        onResult(result);
        setOpen(false);
        setResult('');
        setExtraInstructions('');
        toast.success(isAr ? 'تم إدراج المحتوى ✓' : 'Content inserted ✓');
    };

    const triggerButton = {
        button: (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950', className)}
                onClick={() => setOpen(true)}
                disabled={disabled}
            >
                <Sparkles className="h-3.5 w-3.5" />
                {label || `✨ ${templateLabel}`}
            </Button>
        ),
        inline: (
            <button
                type="button"
                className={cn('inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors', className)}
                onClick={() => setOpen(true)}
                disabled={disabled}
            >
                <Sparkles className="h-3 w-3" />
                {label || 'AI'}
            </button>
        ),
        icon: (
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950', className)}
                onClick={() => setOpen(true)}
                disabled={disabled}
            >
                <Wand2 className="h-3.5 w-3.5" />
            </Button>
        ),
    };

    return (
        <>
            {triggerButton[variant]}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            {isAr ? `توليد ${templateLabel} بالذكاء الاصطناعي` : `Generate ${templateLabel} with AI`}
                        </DialogTitle>
                        <DialogDescription>
                            {isAr
                                ? 'حدد السياق ثم اضغط "توليد" — يمكنك التعديل على النتيجة قبل الإدراج'
                                : 'Set the context then press "Generate" — you can edit the result before inserting.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Context selectors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{isAr ? 'المادة' : 'Subject'}</Label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المادة (اختياري)' : 'Select subject (optional)'} /></SelectTrigger>
                                    <SelectContent>
                                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>{isAr ? 'الصف' : 'Grade'}</Label>
                                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر الصف (اختياري)' : 'Select grade (optional)'} /></SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Extra instructions */}
                        <div className="grid gap-2">
                            <Label>{isAr ? 'تعليمات إضافية (اختياري)' : 'Extra instructions (optional)'}</Label>
                            <Textarea
                                placeholder={isAr ? 'مثال: اجعل الأهداف تتبع تصنيف بلوم...' : 'e.g. Use Bloom\'s taxonomy levels...'}
                                value={extraInstructions}
                                onChange={(e) => setExtraInstructions(e.target.value)}
                                className="min-h-[60px]"
                            />
                        </div>

                        {/* Generate button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="gap-2 bg-gradient-to-l from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> {isAr ? 'جاري التوليد...' : 'Generating...'}</>
                            ) : (
                                <><Sparkles className="h-4 w-4" /> {isAr ? 'توليد' : 'Generate'}</>
                            )}
                        </Button>

                        {/* Result */}
                        {result && (
                            <div className="grid gap-2">
                                <Label className="flex items-center justify-between">
                                    <span>{isAr ? 'النتيجة' : 'Result'}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-xs"
                                        onClick={handleGenerate}
                                        disabled={loading}
                                    >
                                        <RefreshCw className="h-3 w-3" /> {isAr ? 'إعادة التوليد' : 'Regenerate'}
                                    </Button>
                                </Label>
                                <Textarea
                                    value={result}
                                    onChange={(e) => setResult(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                    dir={dir}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {isAr ? 'إلغاء' : 'Cancel'}
                        </Button>
                        {result && (
                            <Button onClick={handleAccept} className="gap-2 bg-green-600 hover:bg-green-700">
                                <Check className="h-4 w-4" /> {isAr ? 'إدراج المحتوى' : 'Insert Content'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
