'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  Check,
  RefreshCcw,
  Wand2,
  Type,
  FileText,
  ImageIcon,
  Calendar,
  List,
  PenTool,
  X,
  Copy,
  ChevronDown,
} from 'lucide-react';

interface SmartFieldInputProps {
  field: {
    id?: string;
    name: string;
    label_ar: string;
    label_en?: string;
    type: 'text' | 'textarea' | 'image' | 'date' | 'select' | 'signature' | 'list';
    placeholder_ar?: string;
    placeholder_en?: string;
    is_required?: boolean;
    options?: string[] | { value: string; label: string }[];
    ai_fillable?: boolean;
    ai_prompt_hint?: string;
  };
  value: string;
  onChange: (value: string) => void;
  templateId?: string;
  templateTitle?: string;
  context?: Record<string, any>;
  disabled?: boolean;
  className?: string;
}

export function SmartFieldInput({
  field,
  value,
  onChange,
  templateId,
  templateTitle,
  context = {},
  disabled = false,
  className,
}: SmartFieldInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const fieldIcons = {
    text: <Type className="w-4 h-4" />,
    textarea: <FileText className="w-4 h-4" />,
    image: <ImageIcon className="w-4 h-4" />,
    date: <Calendar className="w-4 h-4" />,
    select: <List className="w-4 h-4" />,
    signature: <PenTool className="w-4 h-4" />,
    list: <List className="w-4 h-4" />,
  };

  const canUseAI = field.type === 'text' || field.type === 'textarea';

  const getSuggestion = async () => {
    if (!canUseAI) return;

    setIsLoading(true);
    setSuggestion(null);

    try {
      const response = await api.post('/ai/suggest', {
        template_id: templateId,
        field_name: field.name,
        title: templateTitle || '',
        current_values: context,
        field_label: field.label_ar,
        ai_hint: field.ai_prompt_hint,
      });

      if (response.success && response.data?.suggestion) {
        setSuggestion(response.data.suggestion);
        setShowSuggestion(true);
      } else {
        toast.error('لم نتمكن من توليد اقتراح، حاول مرة أخرى');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('حدث خطأ في الاتصال بالذكاء الاصطناعي');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      onChange(suggestion);
      setSuggestion(null);
      setShowSuggestion(false);
      toast.success('تم تطبيق الاقتراح بنجاح');
    }
  };

  const copySuggestion = () => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
      toast.success('تم نسخ الاقتراح');
    }
  };

  const appendSuggestion = () => {
    if (suggestion) {
      const newValue = value ? `${value}\n${suggestion}` : suggestion;
      onChange(newValue);
      setSuggestion(null);
      setShowSuggestion(false);
      toast.success('تم إضافة الاقتراح');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label with AI button */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor={field.name}
          className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300"
        >
          <span className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-primary">
            {fieldIcons[field.type] || <Type className="w-4 h-4" />}
          </span>
          {field.label_ar}
          {field.is_required && <span className="text-red-500 mr-1">*</span>}
        </Label>

        {canUseAI && (
          <Popover open={showSuggestion} onOpenChange={setShowSuggestion}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getSuggestion}
                disabled={isLoading || disabled}
                className="h-8 text-xs font-bold text-primary hover:bg-primary/10 gap-1.5 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                اقتراح ذكي
              </Button>
            </PopoverTrigger>

            {suggestion && (
              <PopoverContent
                className="w-96 p-0 shadow-2xl border-0"
                align="end"
                sideOffset={8}
              >
                <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Wand2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          اقتراح ذكي
                        </h4>
                        <p className="text-xs text-gray-500">مدعوم بـ GPT-4</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-full"
                      onClick={() => setShowSuggestion(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Suggestion Content */}
                  <div className="p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {suggestion}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={acceptSuggestion}
                      className="flex-1 h-9 rounded-lg font-bold gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      استبدال
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={appendSuggestion}
                      className="h-9 rounded-lg font-bold gap-1.5"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      إضافة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copySuggestion}
                      className="h-9 w-9 p-0 rounded-lg"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={getSuggestion}
                      disabled={isLoading}
                      className="h-9 w-9 p-0 rounded-lg"
                    >
                      <RefreshCcw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            )}
          </Popover>
        )}
      </div>

      {/* Input Field */}
      {field.type === 'text' && (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          id={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder_ar}
          disabled={disabled}
          className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          id={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder_ar}
          disabled={disabled}
          rows={4}
          className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
        />
      )}

      {field.type === 'date' && (
        <Input
          type="date"
          id={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
      )}

      {field.type === 'select' && field.options && (
        <select
          id={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">اختر...</option>
          {field.options.map((option, index) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return (
              <option key={index} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}

export default SmartFieldInput;
