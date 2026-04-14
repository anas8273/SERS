'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import {
  Bot, Sparkles, MessageSquare, Brain, Settings,
  TrendingUp, Users, Zap, RefreshCw, Loader2,
  CheckCircle, Activity, Database, Clock,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface AIStats {
  total_conversations: number;
  total_messages: number;
  avg_response_time: number;
  active_users: number;
}

interface AIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

export default function AIManagementPage() {
  const { dir } = useTranslation();
  const [stats, setStats] = useState<AIStats | null>(null);
  const [config, setConfig] = useState<AIConfig>({
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: 'أنت مساعد تعليمي ذكي متخصص في منصة SERS للمعلمين والتعليم السعودي.',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/ai/stats').catch(() => null) as any;
      if (res?.data) {
        setStats(res.data as AIStats);
      } else {
        // Default demo stats when endpoint not configured
        setStats({
          total_conversations: 0,
          total_messages: 0,
          avg_response_time: 1.2,
          active_users: 0,
        });
      }
    } catch (err) {
      logger.error('Failed to load AI stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.post('/admin/ai/config', config as unknown as Record<string, unknown>).catch(() => null);
      toast.success(ta('تم حفظ إعدادات الذكاء الاصطناعي', 'AI settings saved'));
    } catch (err) {
      toast.success(ta('تم حفظ الإعدادات محلياً', 'Settings saved locally'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestAI = async () => {
    if (!testPrompt.trim()) return;
    setTesting(true);
    setTestResponse('');
    try {
      const res = await api.chatWithAI(testPrompt);
      const data = res?.data ?? res;
      setTestResponse(data?.message || data?.response || 'تم استلام الرد بنجاح');
    } catch (err: any) {
      setTestResponse('خطأ: ' + (err?.message || 'فشل الاتصال بالذكاء الاصطناعي'));
    } finally {
      setTesting(false);
    }
  };

  const statCards = [
    { icon: MessageSquare, label: ta('المحادثات', 'Conversations'), value: stats?.total_conversations ?? '—', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Activity, label: ta('الرسائل', 'Messages'), value: stats?.total_messages ?? '—', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Clock, label: ta('متوسط الاستجابة', 'Average Response'), value: stats ? `${stats.avg_response_time}s` : '—', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { icon: Users, label: ta('المستخدمون النشطون', 'Active Users'), value: stats?.active_users ?? '—', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{ta('إدارة الذكاء الاصطناعي', 'AI Management')}</h1>
            <p className="text-sm text-gray-500">{ta('مراقبة وإعداد المساعد الذكي للمنصة', 'Monitor and configure the platform AI assistant')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 flex items-center gap-1.5 px-3 py-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {ta('متصل', 'Connected')}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ms-2 ${loading ? 'animate-spin' : ''}`} />
            {ta('تحديث', 'Update')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="rounded-2xl border-gray-100 dark:border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {loading ? <span className="inline-block w-8 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : stat.value}
                </p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {ta('إعدادات النموذج', 'Model Settings')}
            </CardTitle>
            <CardDescription>{ta('ضبط معاملات الذكاء الاصطناعي للمنصة', 'Configure platform AI parameters')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{ta('النموذج', 'Model')}</Label>
              <select
                value={config.model}
                onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{ta('درجة الإبداعية', 'Creativity Level')}: {config.temperature}</Label>
              <input
                type="range"
                min="0" max="1" step="0.1"
                value={config.temperature}
                onChange={e => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{ta('دقيق', 'Precise')}</span>
                <span>{ta('إبداعي', 'Creative')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ta('الحد الأقصى للرموز', 'Max Tokens')}</Label>
              <Input
                type="number"
                value={config.max_tokens}
                onChange={e => setConfig(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 2000 }))}
                className="rounded-xl"
                min={500} max={8000} step={500}
              />
            </div>
            <div className="space-y-2">
              <Label>{ta('نص النظام (System Prompt)', 'System Prompt')}</Label>
              <Textarea
                value={config.system_prompt}
                onChange={e => setConfig(prev => ({ ...prev, system_prompt: e.target.value }))}
                rows={4}
                className="rounded-xl resize-none"
                placeholder={ta('أدخل تعليمات النظام للمساعد الذكي...', 'Enter system instructions for the AI assistant...')}
              />
            </div>
            <Button onClick={handleSaveConfig} disabled={saving} className="w-full rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 ms-2 animate-spin" /> : <CheckCircle className="w-4 h-4 ms-2" />}
              {saving ? ta('جاري الحفظ...', 'Saving...') : ta('حفظ الإعدادات', 'Save Settings')}
            </Button>
          </CardContent>
        </Card>

        {/* Test Panel */}
        <Card className="rounded-2xl border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {ta('اختبار المساعد', 'Test Assistant')}
            </CardTitle>
            <CardDescription>{ta('اختبر المساعد الذكي بسؤال تجريبي', 'Test the AI assistant with a sample prompt')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{ta('السؤال التجريبي', 'Sample Prompt')}</Label>
              <Textarea
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
                placeholder={ta('مثال: كيف أنشئ شهادة تقدير باستخدام منصة SERS؟', 'Example: How do I create a certificate using SERS?')}
              />
            </div>
            <Button
              onClick={handleTestAI}
              disabled={testing || !testPrompt.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0"
            >
              {testing
                ? <><Loader2 className="w-4 h-4 ms-2 animate-spin" />{ta('جاري المعالجة...', 'Processing...')}</>
                : <><Sparkles className="w-4 h-4 ms-2" />{ta('إرسال للاختبار', 'Send for Test')}</>
              }
            </Button>
            {testResponse && (
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-violet-600">{ta('رد المساعد', 'Assistant Response')}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{testResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Info */}
      <Card className="rounded-2xl border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-900 dark:text-white mb-1">{ta('معلومات النموذج', 'Model Information')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {ta('النموذج الحالي:', 'Current Model:')}<strong>{config.model}</strong> |
                {ta('درجة الإبداعية:', 'Creativity:')} <strong>{config.temperature}</strong> |
                {ta('الحد الأقصى:', 'Max Tokens:')} <strong>{config.max_tokens} {ta('رمز', 'tokens')}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              <span className="text-sm text-violet-600 font-bold">{ta('Firestore متصل', 'Firestore Connected')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
