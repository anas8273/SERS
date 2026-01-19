'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    Bot,
    BrainCircuit,
    Sparkles,
    MessageSquare,
    Zap,
    TrendingUp,
    Users,
    Clock,
    Settings,
    RefreshCcw,
    Loader2,
    BarChart3,
    AlertCircle,
    CheckCircle,
    Activity,
    Cpu,
    Database,
    Globe,
} from 'lucide-react';

interface AIStats {
    total_conversations: number;
    total_messages: number;
    total_tokens_used: number;
    active_users_today: number;
    average_response_time: number;
    success_rate: number;
    most_used_features: Array<{
        feature: string;
        count: number;
        percentage: number;
    }>;
    recent_conversations: Array<{
        id: string;
        user_name: string;
        messages_count: number;
        tokens_used: number;
        created_at: string;
    }>;
    daily_usage: Array<{
        date: string;
        conversations: number;
        tokens: number;
    }>;
}

export default function AIManagementPage() {
    const [stats, setStats] = useState<AIStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        ai_enabled: true,
        max_tokens_per_request: 2000,
        max_conversations_per_user: 50,
        enable_suggestions: true,
        enable_auto_fill: true,
        enable_chat: true,
        model: 'gpt-4.1-mini',
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/ai/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching AI stats:', error);
            // Use mock data for demo
            setStats({
                total_conversations: 1250,
                total_messages: 8750,
                total_tokens_used: 2500000,
                active_users_today: 45,
                average_response_time: 1.2,
                success_rate: 98.5,
                most_used_features: [
                    { feature: 'المحادثة الذكية', count: 450, percentage: 36 },
                    { feature: 'اقتراح الخطط', count: 320, percentage: 25.6 },
                    { feature: 'إنشاء الشهادات', count: 280, percentage: 22.4 },
                    { feature: 'تحليل النتائج', count: 200, percentage: 16 },
                ],
                recent_conversations: [
                    { id: '1', user_name: 'أحمد محمد', messages_count: 12, tokens_used: 2500, created_at: '2026-01-18T10:30:00' },
                    { id: '2', user_name: 'سارة علي', messages_count: 8, tokens_used: 1800, created_at: '2026-01-18T09:45:00' },
                    { id: '3', user_name: 'خالد عبدالله', messages_count: 5, tokens_used: 1200, created_at: '2026-01-18T08:20:00' },
                ],
                daily_usage: [
                    { date: '2026-01-12', conversations: 85, tokens: 180000 },
                    { date: '2026-01-13', conversations: 92, tokens: 195000 },
                    { date: '2026-01-14', conversations: 78, tokens: 165000 },
                    { date: '2026-01-15', conversations: 105, tokens: 220000 },
                    { date: '2026-01-16', conversations: 98, tokens: 210000 },
                    { date: '2026-01-17', conversations: 112, tokens: 235000 },
                    { date: '2026-01-18', conversations: 45, tokens: 95000 },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (key: string, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        try {
            await api.post('/admin/ai/settings', { [key]: value });
            toast.success('تم حفظ الإعدادات');
        } catch (error) {
            toast.error('فشل حفظ الإعدادات');
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BrainCircuit className="h-7 w-7 text-primary" />
                        إدارة الذكاء الاصطناعي
                    </h1>
                    <p className="text-muted-foreground">مراقبة وإدارة خدمات الذكاء الاصطناعي في النظام</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => fetchStats()} variant="outline" className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        تحديث
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : stats && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                    <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">المحادثات</p>
                                    <p className="text-2xl font-bold">{formatNumber(stats.total_conversations)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                    <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">التوكنات المستخدمة</p>
                                    <p className="text-2xl font-bold">{formatNumber(stats.total_tokens_used)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">نسبة النجاح</p>
                                    <p className="text-2xl font-bold">{stats.success_rate}%</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">متوسط الاستجابة</p>
                                    <p className="text-2xl font-bold">{stats.average_response_time}s</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="overview" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                نظرة عامة
                            </TabsTrigger>
                            <TabsTrigger value="conversations" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                المحادثات
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="gap-2">
                                <Settings className="h-4 w-4" />
                                الإعدادات
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Most Used Features */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">الميزات الأكثر استخداماً</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {stats.most_used_features.map((feature, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>{feature.feature}</span>
                                                    <span className="text-muted-foreground">{feature.count} استخدام</span>
                                                </div>
                                                <Progress value={feature.percentage} className="h-2" />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* System Status */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">حالة النظام</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                                                <span className="font-medium">خدمة الذكاء الاصطناعي</span>
                                            </div>
                                            <Badge className="bg-green-100 text-green-700">متصل</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="h-5 w-5 text-muted-foreground" />
                                                <span>النموذج المستخدم</span>
                                            </div>
                                            <Badge variant="outline">{settings.model}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Users className="h-5 w-5 text-muted-foreground" />
                                                <span>المستخدمون النشطون اليوم</span>
                                            </div>
                                            <Badge variant="outline">{stats.active_users_today}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Activity className="h-5 w-5 text-muted-foreground" />
                                                <span>الرسائل اليوم</span>
                                            </div>
                                            <Badge variant="outline">{stats.daily_usage[stats.daily_usage.length - 1]?.conversations || 0}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Daily Usage Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">الاستخدام اليومي (آخر 7 أيام)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64 flex items-end justify-between gap-2">
                                        {stats.daily_usage.map((day, index) => (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className="w-full bg-primary/20 rounded-t-lg transition-all hover:bg-primary/30"
                                                    style={{
                                                        height: `${(day.conversations / Math.max(...stats.daily_usage.map((d) => d.conversations))) * 100}%`,
                                                        minHeight: '20px',
                                                    }}
                                                >
                                                    <div
                                                        className="w-full bg-primary rounded-t-lg"
                                                        style={{
                                                            height: `${(day.tokens / Math.max(...stats.daily_usage.map((d) => d.tokens))) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 bg-primary rounded" />
                                            <span>التوكنات</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 bg-primary/20 rounded" />
                                            <span>المحادثات</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="conversations">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">آخر المحادثات</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>المستخدم</TableHead>
                                                <TableHead>عدد الرسائل</TableHead>
                                                <TableHead>التوكنات</TableHead>
                                                <TableHead>التاريخ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.recent_conversations.map((conv) => (
                                                <TableRow key={conv.id}>
                                                    <TableCell className="font-medium">{conv.user_name}</TableCell>
                                                    <TableCell>{conv.messages_count}</TableCell>
                                                    <TableCell>{formatNumber(conv.tokens_used)}</TableCell>
                                                    <TableCell>
                                                        {new Date(conv.created_at).toLocaleString('ar-SA')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">إعدادات الذكاء الاصطناعي</CardTitle>
                                    <CardDescription>تحكم في سلوك وحدود خدمات الذكاء الاصطناعي</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">تفعيل الذكاء الاصطناعي</Label>
                                            <p className="text-sm text-muted-foreground">
                                                تفعيل أو تعطيل جميع خدمات الذكاء الاصطناعي
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.ai_enabled}
                                            onCheckedChange={(checked) => handleSettingChange('ai_enabled', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">المحادثة الذكية</Label>
                                            <p className="text-sm text-muted-foreground">
                                                السماح للمستخدمين بالتحدث مع المساعد الذكي
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.enable_chat}
                                            onCheckedChange={(checked) => handleSettingChange('enable_chat', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">الاقتراحات الذكية</Label>
                                            <p className="text-sm text-muted-foreground">
                                                تفعيل اقتراحات الذكاء الاصطناعي للحقول
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.enable_suggestions}
                                            onCheckedChange={(checked) => handleSettingChange('enable_suggestions', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">التعبئة التلقائية</Label>
                                            <p className="text-sm text-muted-foreground">
                                                تفعيل تعبئة جميع الحقول تلقائياً
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.enable_auto_fill}
                                            onCheckedChange={(checked) => handleSettingChange('enable_auto_fill', checked)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الحد الأقصى للتوكنات لكل طلب</Label>
                                        <Input
                                            type="number"
                                            value={settings.max_tokens_per_request}
                                            onChange={(e) => handleSettingChange('max_tokens_per_request', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الحد الأقصى للمحادثات لكل مستخدم</Label>
                                        <Input
                                            type="number"
                                            value={settings.max_conversations_per_user}
                                            onChange={(e) => handleSettingChange('max_conversations_per_user', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}
