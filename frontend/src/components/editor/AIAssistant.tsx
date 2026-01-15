'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles, X, Check, RefreshCcw, Loader2, BrainCircuit, Lightbulb, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
    // Mode 1: Inline field suggestion
    recordId?: string;
    fieldName?: string;
    context?: Record<string, unknown>;
    onAccept?: (suggestion: string) => void;
    initialPrompt?: string;

    // Mode 2: Full template assistant (InteractiveEditor)
    template?: any;
    formData?: Record<string, any>;
    onSuggestion?: (fieldName: string, suggestion: string) => void;
    onApply?: (suggestion: string) => void;
    onClose?: () => void;
}

export function AIAssistant({ 
    recordId, 
    fieldName, 
    context, 
    onAccept,
    initialPrompt,
    template,
    formData,
    onSuggestion,
    onApply,
    onClose
}: AIAssistantProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(initialPrompt || '');

    // Mode 1: Field Suggestion
    const getFieldSuggestion = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            // If we have a recordId and fieldName, use the specific endpoint
            if (recordId && fieldName) {
                const response = await api.getAISuggestion(recordId, fieldName, context || {});
                setSuggestion(response.data.suggestion);
            } else {
                // Otherwise use the general suggestion endpoint
                const response = await api.getAISuggestion('general', 'content', { 
                    prompt: prompt || 'اكتب محتوى تعليمي إبداعي',
                    ...context 
                });
                setSuggestion(response.data.suggestion);
            }
        } catch (err) {
            setError('عذراً، واجهت مشكلة في الاتصال بمركز الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = () => {
        if (suggestion) {
            if (onAccept) onAccept(suggestion);
            if (onApply) onApply(suggestion);
            setSuggestion(null);
        }
    };

    // If it's the full assistant mode (InteractiveEditor)
    if (template) {
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-md animate-fade-in" dir="rtl">
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 dark:border-gray-800">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <BrainCircuit className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">المساعد الذكي</h3>
                                <p className="text-xs font-bold text-primary uppercase tracking-widest">مدعوم بتقنيات GPT-4</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                كيف يمكنني مساعدتك؟
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                يمكنني تحليل قالب <span className="font-bold text-primary">"{template.name_ar}"</span> وتوليد محتوى تعليمي احترافي ومتكامل لكل الحقول بضغطة زر واحدة.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 bg-primary/5 dark:bg-primary/10 rounded-3xl border border-primary/10 space-y-3">
                                <div className="flex items-center gap-2 text-primary font-black text-sm">
                                    <Wand2 className="w-4 h-4" />
                                    المميزات الذكية:
                                </div>
                                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        تحليل سياق السجل التعليمي وعنوانه
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        توليد أهداف تعليمية وأنشطة مبتكرة
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        تنسيق النصوص بأسلوب تربوي رصين
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                                <X className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3">
                        <Button
                            disabled={isLoading}
                            onClick={async () => {
                                setIsLoading(true);
                                setError(null);
                                try {
                                    const response = await api.getAIFillAll({
                                        template_id: Number(template.id),
                                        title: formData?.title || '',
                                        current_values: formData || {}
                                    });
                                    if (response.success && onSuggestion) {
                                        Object.entries(response.data.suggestions).forEach(([key, val]) => {
                                            onSuggestion(key, val as string);
                                        });
                                        toast.success('تم توليد جميع البيانات بنجاح ✨');
                                        onClose?.();
                                    }
                                } catch (err) {
                                    setError('حدث خطأ أثناء توليد البيانات. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.');
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="flex-1 h-14 rounded-2xl font-black text-lg gap-3 shadow-xl shadow-primary/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : <Sparkles className="w-6 h-6" />}
                            توليد السجل بالكامل
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-8 h-14 rounded-2xl font-black border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            إلغاء
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Inline Mode (Field Suggestion)
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="font-black text-gray-900 dark:text-white">اقتراح ذكي</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    {!suggestion && !isLoading && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                سأقوم بكتابة محتوى إبداعي لهذا الحقل بناءً على السياق التعليمي.
                            </p>
                            <Button 
                                onClick={getFieldSuggestion} 
                                className="w-full h-12 rounded-xl font-bold gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                ابدأ التوليد
                            </Button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="py-10 flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-pulse" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 animate-pulse">جاري التفكير في محتوى إبداعي...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    {suggestion && (
                        <div className="space-y-4 animate-slide-up">
                            <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{suggestion}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleAccept}
                                    className="flex-1 h-11 rounded-xl font-bold gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    قبول وتطبيق
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={getFieldSuggestion}
                                    className="w-11 h-11 p-0 rounded-xl border-2"
                                    title="اقتراح آخر"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AIAssistant;
