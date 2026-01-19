'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Achievement, ACHIEVEMENT_TYPES, ACHIEVEMENT_CATEGORIES, AchievementType, AchievementCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Trophy,
    Plus,
    Search,
    Trash2,
    Eye,
    Edit,
    Calendar,
    Loader2,
    Star,
    TrendingUp,
    CheckCircle,
    Upload,
    FileText,
    Image,
} from 'lucide-react';

export default function AchievementsPage() {
    const router = useRouter();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newAchievement, setNewAchievement] = useState({
        type: 'daily' as AchievementType,
        category: 'teaching' as AchievementCategory,
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        end_date: '',
        goals: '',
    });

    useEffect(() => {
        fetchAchievements();
    }, [activeTab]);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            let response;
            switch (activeTab) {
                case 'week':
                    response = await api.getThisWeekAchievements();
                    break;
                case 'month':
                    response = await api.getThisMonthAchievements();
                    break;
                default:
                    response = await api.getAchievements();
            }
            setAchievements(response.data || []);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            toast.error('حدث خطأ في جلب الإنجازات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAchievement = async () => {
        if (!newAchievement.title || !newAchievement.description) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            const goals = newAchievement.goals
                .split('\n')
                .map(line => line.trim())
                .filter(line => line);

            await api.createAchievement({
                ...newAchievement,
                goals,
            });

            toast.success('تم إضافة الإنجاز بنجاح');
            setIsCreateDialogOpen(false);
            setNewAchievement({
                type: 'daily',
                category: 'teaching',
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                end_date: '',
                goals: '',
            });
            fetchAchievements();
        } catch (error) {
            console.error('Error creating achievement:', error);
            toast.error('حدث خطأ في إضافة الإنجاز');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAchievement = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) return;

        try {
            await api.deleteAchievement(id);
            toast.success('تم حذف الإنجاز بنجاح');
            fetchAchievements();
        } catch (error) {
            console.error('Error deleting achievement:', error);
            toast.error('حدث خطأ في حذف الإنجاز');
        }
    };

    const filteredAchievements = achievements.filter(achievement => {
        const matchesSearch = achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || achievement.type === filterType;
        const matchesCategory = filterCategory === 'all' || achievement.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    const getTypeBadge = (type: AchievementType) => {
        const colors: Record<AchievementType, string> = {
            daily: 'bg-blue-500',
            weekly: 'bg-green-500',
            monthly: 'bg-purple-500',
            semester: 'bg-orange-500',
            annual: 'bg-red-500',
        };
        return <Badge className={colors[type]}>{ACHIEVEMENT_TYPES[type]}</Badge>;
    };

    const getCategoryBadge = (category: AchievementCategory) => {
        const colors: Record<AchievementCategory, string> = {
            teaching: 'bg-blue-100 text-blue-800',
            administrative: 'bg-gray-100 text-gray-800',
            professional: 'bg-green-100 text-green-800',
            community: 'bg-yellow-100 text-yellow-800',
            creative: 'bg-pink-100 text-pink-800',
            other: 'bg-purple-100 text-purple-800',
        };
        return <Badge variant="outline" className={colors[category]}>{ACHIEVEMENT_CATEGORIES[category]}</Badge>;
    };

    // Calculate stats
    const thisWeekCount = achievements.filter(a => {
        const date = new Date(a.date);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return date >= weekStart;
    }).length;

    const thisMonthCount = achievements.filter(a => {
        const date = new Date(a.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const verifiedCount = achievements.filter(a => a.is_verified).length;

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        توثيق الإنجازات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        توثيق الإنجازات اليومية والأسبوعية والشهرية
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            إنجاز جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>توثيق إنجاز جديد</DialogTitle>
                            <DialogDescription>
                                سجّل إنجازاتك لتوثيقها والرجوع إليها
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>نوع الإنجاز *</Label>
                                    <Select
                                        value={newAchievement.type}
                                        onValueChange={(value) => setNewAchievement({ ...newAchievement, type: value as AchievementType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ACHIEVEMENT_TYPES).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>التصنيف</Label>
                                    <Select
                                        value={newAchievement.category}
                                        onValueChange={(value) => setNewAchievement({ ...newAchievement, category: value as AchievementCategory })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ACHIEVEMENT_CATEGORIES).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>عنوان الإنجاز *</Label>
                                <Input
                                    placeholder="مثال: تنفيذ درس نموذجي في مادة الرياضيات"
                                    value={newAchievement.title}
                                    onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>تاريخ الإنجاز *</Label>
                                    <Input
                                        type="date"
                                        value={newAchievement.date}
                                        onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>تاريخ الانتهاء (اختياري)</Label>
                                    <Input
                                        type="date"
                                        value={newAchievement.end_date}
                                        onChange={(e) => setNewAchievement({ ...newAchievement, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>وصف الإنجاز *</Label>
                                <Textarea
                                    placeholder="اكتب وصفاً تفصيلياً للإنجاز..."
                                    className="min-h-[100px]"
                                    value={newAchievement.description}
                                    onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>الأهداف المحققة (اختياري)</Label>
                                <Textarea
                                    placeholder="أدخل كل هدف في سطر منفصل..."
                                    className="min-h-[80px]"
                                    value={newAchievement.goals}
                                    onChange={(e) => setNewAchievement({ ...newAchievement, goals: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleCreateAchievement} disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="h-4 w-4 ml-2" />
                                        حفظ الإنجاز
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإنجازات</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{achievements.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">هذا الأسبوع</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{thisWeekCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{thisMonthCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">الموثقة</CardTitle>
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{verifiedCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">جميع الإنجازات</TabsTrigger>
                    <TabsTrigger value="week">هذا الأسبوع</TabsTrigger>
                    <TabsTrigger value="month">هذا الشهر</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في الإنجازات..."
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="نوع الإنجاز" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(ACHIEVEMENT_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع التصنيفات</SelectItem>
                        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Achievements Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredAchievements.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد إنجازات</h3>
                        <p className="text-muted-foreground mb-4">
                            ابدأ بتوثيق إنجازاتك اليومية
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            توثيق إنجاز جديد
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAchievements.map((achievement) => (
                        <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-2 flex-wrap">
                                        {getTypeBadge(achievement.type)}
                                        {achievement.category && getCategoryBadge(achievement.category)}
                                    </div>
                                    {achievement.is_verified && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                                <CardTitle className="text-lg mt-2">{achievement.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(achievement.date).toLocaleDateString('ar-SA')}
                                    {achievement.end_date && (
                                        <span> - {new Date(achievement.end_date).toLocaleDateString('ar-SA')}</span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {achievement.description}
                                </p>

                                {achievement.goals && achievement.goals.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">الأهداف:</p>
                                        <ul className="text-xs space-y-1">
                                            {achievement.goals.slice(0, 3).map((goal, index) => (
                                                <li key={index} className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-yellow-500" />
                                                    {goal}
                                                </li>
                                            ))}
                                            {achievement.goals.length > 3 && (
                                                <li className="text-muted-foreground">
                                                    +{achievement.goals.length - 3} أهداف أخرى
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {achievement.attachments && achievement.attachments.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                        <Image className="h-3 w-3" />
                                        {achievement.attachments.length} مرفق
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => router.push(`/achievements/${achievement.id}`)}
                                    >
                                        <Eye className="h-4 w-4 ml-1" />
                                        عرض
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => handleDeleteAchievement(achievement.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
