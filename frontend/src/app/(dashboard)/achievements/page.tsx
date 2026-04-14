'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';
import { TopNavBar } from '@/components/layout/TopNavBar';

import { useTranslation } from '@/i18n/useTranslation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Achievement, AchievementType, AchievementCategory } from '@/types';
import { useLocalizedTypes } from '@/hooks/useLocalizedTypes';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
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
    Sparkles,
    Paperclip,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AchievementsPage() {
    const { dir, t, locale } = useTranslation();
    const { achievementTypes, achievementCategories } = useLocalizedTypes();
    const router = useRouter();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        type: 'daily' as AchievementType,
        category: 'teaching' as AchievementCategory,
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        end_date: '',
        goals: '',
    });
    const [isUpdating, setIsUpdating] = useState(false);
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
            logger.error('Error fetching achievements:', error);
            toast.error(t('toast.achievement.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAchievement = async () => {
        if (!newAchievement.title || !newAchievement.description) {
            toast.error(t('toast.achievement.fieldsRequired'));
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

            toast.success(t('toast.achievement.added'));
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
            logger.error('Error creating achievement:', error);
            toast.error(t('toast.achievement.addError'));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAchievement = async (id: string) => {
        if (!confirm(t('eduPage.confirm.delete'))) return;

        try {
            await api.deleteAchievement(id);
            toast.success(t('toast.achievement.deleted'));
            fetchAchievements();
        } catch (error) {
            logger.error('Error deleting achievement:', error);
            toast.error(t('common.error'));
        }
    };

    const handleOpenEdit = (achievement: Achievement) => {
        setEditingAchievement(achievement);
        setEditForm({
            type: achievement.type,
            category: (achievement.category || 'teaching') as AchievementCategory,
            title: achievement.title,
            description: achievement.description || '',
            date: achievement.date || new Date().toISOString().split('T')[0],
            end_date: achievement.end_date || '',
            goals: Array.isArray(achievement.goals) ? achievement.goals.join('\n') : (achievement.goals || ''),
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateAchievement = async () => {
        if (!editForm.title || !editForm.description) { toast.error(t('toast.achievement.fieldsRequired')); return; }
        if (!editingAchievement) return;
        setIsUpdating(true);
        try {
            const goals = editForm.goals.split('\n').map(l => l.trim()).filter(l => l);
            await api.updateAchievement(editingAchievement.id, { ...editForm, goals });
            toast.success(t('toast.saved'));
            setIsEditDialogOpen(false);
            setEditingAchievement(null);
            fetchAchievements();
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setIsUpdating(false);
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
        return <Badge className={colors[type]}>{achievementTypes[type]}</Badge>;
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
        return <Badge variant="outline" className={colors[category]}>{achievementCategories[category]}</Badge>;
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
    <>
    <TopNavBar title={ta('الإنجازات', 'Achievements' )} />
        <div className="container mx-auto py-6 px-4" dir={dir}>
            {/* Gradient Hero */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><Trophy className="h-6 w-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black">{t('eduPage.heroTitle.achievements')}</h1>
                            <p className="text-white/80 text-sm mt-0.5">{t('eduPage.heroDesc.achievements')}</p>
                        </div>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-white text-purple-600 hover:bg-gray-100 font-bold">
                                <Plus className="h-4 w-4" />
                                {t('eduPage.newItem.achievements')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('eduPage.dialogTitle.achievements')}</DialogTitle>
                                <DialogDescription>{t('eduPage.dialogDesc.achievements')}</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('eduPage.form.type')}</Label>
                                        <Select value={newAchievement.type} onValueChange={(value) => setNewAchievement({ ...newAchievement, type: value as AchievementType })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(achievementTypes).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('eduPage.form.category')}</Label>
                                        <Select value={newAchievement.category} onValueChange={(value) => setNewAchievement({ ...newAchievement, category: value as AchievementCategory })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(achievementCategories).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('eduPage.form.title')}</Label>
                                    <Input placeholder={t('eduPage.form.titlePlaceholder')} value={newAchievement.title} onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label>{t('eduPage.form.date')}</Label><Input type="date" value={newAchievement.date} onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })} /></div>
                                    <div className="grid gap-2"><Label>{t('eduPage.form.endDate')}</Label><Input type="date" value={newAchievement.end_date} onChange={(e) => setNewAchievement({ ...newAchievement, end_date: e.target.value })} /></div>
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{t('eduPage.form.description')}</Label>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!newAchievement.title) { toast.error(t('eduPage.form.enterTitleFirst')); return; }
                                                try {
                                                    const res = await api.chatWithAI(`اكتب وصفاً احترافياً ومفصلاً لإنجاز تعليمي بعنوان: "${newAchievement.title}" من نوع ${achievementTypes[newAchievement.type] || newAchievement.type}. الوصف يجب أن يكون بالعربية ومن 3-5 جمل.`);
                                                    const content = res?.data?.message || res?.message || res?.data?.response || '';
                                                    if (content) setNewAchievement(prev => ({ ...prev, description: content }));
                                                } catch { toast.error(t('eduPage.ai.aiFailed')); }
                                            }}
                                            className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors"
                                        >
                                            <Sparkles className="w-3 h-3" /> {t('eduPage.ai.fillWithAI')}
                                        </button>
                                    </div>
                                    <Textarea placeholder={t('eduPage.form.descPlaceholder')} className="min-h-[100px]" value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{t('eduPage.form.goals')}</Label>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!newAchievement.title) { toast.error(t('eduPage.form.enterTitleFirst')); return; }
                                                try {
                                                    const res = await api.chatWithAI(`اقترح 5 أهداف محققة لإنجاز تعليمي بعنوان: "${newAchievement.title}". اكتب كل هدف في سطر منفصل باللغة العربية.`);
                                                    const content = res?.data?.message || res?.message || res?.data?.response || '';
                                                    if (content) setNewAchievement(prev => ({ ...prev, goals: content }));
                                                } catch { toast.error(t('eduPage.ai.aiFailed')); }
                                            }}
                                            className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors"
                                        >
                                            <Sparkles className="w-3 h-3" /> {t('eduPage.ai.suggestGoals')}
                                        </button>
                                    </div>
                                    <Textarea placeholder={t('eduPage.form.goalsPlaceholder')} className="min-h-[80px]" value={newAchievement.goals} onChange={(e) => setNewAchievement({ ...newAchievement, goals: e.target.value })} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{t('common.cancel')}</Button>
                                <Button onClick={handleCreateAchievement} disabled={isCreating} className="bg-purple-600 hover:bg-purple-700">
                                    {isCreating ? (<><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('eduPage.btn.saving')}</>) : (<><Trophy className="h-4 w-4 ms-2" />{t('eduPage.btn.save')}</>)}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: t('eduPage.stat.total'), value: achievements.length, icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: t('eduPage.stat.thisWeek'), value: thisWeekCount, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('eduPage.stat.thisMonth'), value: thisMonthCount, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: t('eduPage.stat.verified'), value: verifiedCount, icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                                    <div><p className="text-xs text-muted-foreground">{stat.label}</p><p className="text-xl font-black">{stat.value}</p></div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">{t('eduPage.tab.all')}</TabsTrigger>
                    <TabsTrigger value="week">{t('eduPage.tab.week')}</TabsTrigger>
                    <TabsTrigger value="month">{t('eduPage.tab.month')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('eduPage.filter.searchAchievements')}
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('eduPage.filter.type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('eduPage.filter.allTypes')}</SelectItem>
                        {Object.entries(achievementTypes).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('eduPage.filter.category')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('eduPage.filter.allCategories')}</SelectItem>
                        {Object.entries(achievementCategories).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Achievements Grid */}
            {loading ? (
                <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-16"><Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" /><p className="text-muted-foreground">SERS</p></CardContent></Card>
            ) : filteredAchievements.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4"><Trophy className="h-8 w-8 text-purple-500" /></div>
                        <h3 className="text-lg font-bold mb-2">{t('eduPage.emptyTitle.achievements')}</h3>
                        <p className="text-muted-foreground mb-4 text-sm">{t('eduPage.emptyDesc.achievements')}</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-xl gap-2 bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-4 w-4" />
                            {t('eduPage.emptyAction.achievements')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAchievements.map((achievement, index) => (
                        <motion.div key={achievement.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl">
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
                                    {new Date(achievement.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}
                                    {achievement.end_date && (
                                        <span> - {new Date(achievement.end_date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {achievement.description}
                                </p>

                                {achievement.goals && achievement.goals.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">{t('eduPage.goals')}</p>
                                        <ul className="text-xs space-y-1">
                                            {achievement.goals.slice(0, 3).map((goal, goalIndex) => (
                                                <li key={goalIndex} className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-yellow-500" />
                                                    {goal}
                                                </li>
                                            ))}
                                            {achievement.goals.length > 3 && (
                                                <li className="text-muted-foreground">
                                                    +{achievement.goals.length - 3} {t('eduPage.moreGoals')}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {achievement.attachments && achievement.attachments.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                        <Image className="h-3 w-3" />
                                        {achievement.attachments.length} {t('eduPage.attachments')}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => handleOpenEdit(achievement)}>
                                        <Eye className="h-4 w-4 ms-1" />
                                        {t('eduPage.btn.view')}
                                    </Button>
                                    <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleOpenEdit(achievement)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAchievement(achievement.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingAchievement(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('eduPage.editDialog.title')}</DialogTitle>
                        <DialogDescription>{t('eduPage.editDialog.desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t('eduPage.form.type')}</Label>
                                <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v as AchievementType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(achievementTypes).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('eduPage.form.category')}</Label>
                                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v as AchievementCategory })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(achievementCategories).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2"><Label>{t('eduPage.form.title')}</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>{t('eduPage.form.date')}</Label><Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>{t('eduPage.form.endDate')}</Label><Input type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} /></div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>{t('eduPage.form.description')}</Label>
                                <button type="button" onClick={async () => { if (!editForm.title) return; try { const res = await api.chatWithAI(`اكتب وصفاً احترافياً لإنجاز تعليمي بعنوان: "${editForm.title}". 3-5 جمل بالعربية.`); const content = res?.data?.message || res?.message || ''; if (content) setEditForm(p => ({ ...p, description: content })); } catch { toast.error(t('eduPage.ai.aiFailed')); } }} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors">
                                    <Sparkles className="w-3 h-3" /> {t('eduPage.ai.fillWithAI')}
                                </button>
                            </div>
                            <Textarea className="min-h-[100px]" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>{t('eduPage.form.goalsOneLine')}</Label>
                                <button type="button" onClick={async () => { if (!editForm.title) return; try { const res = await api.chatWithAI(`اقترح 5 أهداف محققة لإنجاز: "${editForm.title}". كل هدف في سطر بالعربية.`); const content = res?.data?.message || res?.message || ''; if (content) setEditForm(p => ({ ...p, goals: content })); } catch { toast.error(t('eduPage.ai.aiFailed')); } }} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors">
                                    <Sparkles className="w-3 h-3" /> {t('eduPage.ai.suggestGoals')}
                                </button>
                            </div>
                            <Textarea className="min-h-[80px]" value={editForm.goals} onChange={(e) => setEditForm({ ...editForm, goals: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleUpdateAchievement} disabled={isUpdating} className="bg-purple-600 hover:bg-purple-700">
                            {isUpdating ? <><Loader2 className="h-4 w-4 animate-spin ms-2" />{t('eduPage.btn.saving')}</> : <><Trophy className="h-4 w-4 ms-2" />{t('eduPage.btn.saveChanges')}</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </>
    );
}
