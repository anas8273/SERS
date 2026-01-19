'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Performance, PERFORMANCE_STATUSES, PERFORMANCE_SEMESTERS, PERFORMANCE_GRADES, PerformanceSemester, PerformanceStatus, PerformanceGrade } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
    BarChart3,
    Plus,
    Search,
    Trash2,
    Eye,
    Edit,
    FileDown,
    Loader2,
    Target,
    TrendingUp,
    Award,
    Calendar,
    Star,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

// Performance criteria
const PERFORMANCE_CRITERIA = [
    { id: 'planning', name: 'التخطيط للتدريس', weight: 15 },
    { id: 'execution', name: 'تنفيذ الدرس', weight: 20 },
    { id: 'evaluation', name: 'التقويم', weight: 15 },
    { id: 'classroom', name: 'إدارة الصف', weight: 15 },
    { id: 'professional', name: 'التطوير المهني', weight: 10 },
    { id: 'communication', name: 'التواصل', weight: 10 },
    { id: 'technology', name: 'استخدام التقنية', weight: 10 },
    { id: 'activities', name: 'الأنشطة اللاصفية', weight: 5 },
];

export default function PerformancePage() {
    const router = useRouter();
    const [performances, setPerformances] = useState<Performance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSemester, setFilterSemester] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newPerformance, setNewPerformance] = useState({
        semester: 'first' as PerformanceSemester,
        year: new Date().getFullYear(),
        scores: {} as Record<string, number>,
        notes: '',
        strengths: '',
        weaknesses: '',
        recommendations: '',
    });

    useEffect(() => {
        fetchPerformances();
    }, []);

    const fetchPerformances = async () => {
        try {
            setLoading(true);
            const response = await api.getPerformances();
            setPerformances(response.data || []);
        } catch (error) {
            console.error('Error fetching performances:', error);
            toast.error('حدث خطأ في جلب التقييمات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePerformance = async () => {
        if (!newPerformance.semester || !newPerformance.year) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            await api.createPerformance({
                semester: newPerformance.semester,
                year: newPerformance.year,
                criteria: PERFORMANCE_CRITERIA.reduce((acc, criterion) => {
                    acc[criterion.id] = {
                        name: criterion.name,
                        weight: criterion.weight,
                        score: newPerformance.scores[criterion.id] || 0,
                        items: {},
                    };
                    return acc;
                }, {} as Record<string, any>),
                strengths: newPerformance.strengths,
                weaknesses: newPerformance.weaknesses,
                recommendations: newPerformance.recommendations,
                notes: newPerformance.notes,
            });

            toast.success('تم إنشاء التقييم بنجاح');
            setIsCreateDialogOpen(false);
            setNewPerformance({
                semester: 'first',
                year: new Date().getFullYear(),
                scores: {},
                notes: '',
                strengths: '',
                weaknesses: '',
                recommendations: '',
            });
            fetchPerformances();
        } catch (error) {
            console.error('Error creating performance:', error);
            toast.error('حدث خطأ في إنشاء التقييم');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeletePerformance = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

        try {
            await api.deletePerformance(id);
            toast.success('تم حذف التقييم بنجاح');
            fetchPerformances();
        } catch (error) {
            console.error('Error deleting performance:', error);
            toast.error('حدث خطأ في حذف التقييم');
        }
    };

    const handleExportPerformance = async (id: string) => {
        try {
            const response = await api.exportPerformance(id, 'pdf');
            if (response.data?.url) {
                window.open(response.data.url, '_blank');
            }
            toast.success('تم تصدير التقييم بنجاح');
        } catch (error) {
            console.error('Error exporting performance:', error);
            toast.error('حدث خطأ في تصدير التقييم');
        }
    };

    const calculateTotalScore = (scores: Record<string, number>) => {
        let total = 0;
        let maxTotal = 0;

        PERFORMANCE_CRITERIA.forEach(criterion => {
            const score = scores[criterion.id] || 0;
            total += (score / 100) * criterion.weight;
            maxTotal += criterion.weight;
        });

        return Math.round((total / maxTotal) * 100);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeFromScore = (score: number): PerformanceGrade => {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'very_good';
        if (score >= 70) return 'good';
        if (score >= 60) return 'acceptable';
        return 'weak';
    };

    const filteredPerformances = performances.filter(perf => {
        const matchesSearch = perf.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            perf.strengths?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSemester = filterSemester === 'all' || perf.semester === filterSemester;
        const matchesStatus = filterStatus === 'all' || perf.status === filterStatus;
        return matchesSearch && matchesSemester && matchesStatus;
    });

    const getSemesterBadge = (semester: PerformanceSemester) => {
        const colors: Record<PerformanceSemester, string> = {
            first: 'bg-blue-500',
            second: 'bg-green-500',
            annual: 'bg-purple-500',
        };
        return <Badge className={colors[semester]}>{PERFORMANCE_SEMESTERS[semester]}</Badge>;
    };

    const getStatusBadge = (status: PerformanceStatus) => {
        const colors: Record<PerformanceStatus, string> = {
            draft: 'bg-gray-500',
            submitted: 'bg-blue-500',
            reviewed: 'bg-yellow-500',
            approved: 'bg-green-500',
            rejected: 'bg-red-500',
        };
        return <Badge className={colors[status]}>{PERFORMANCE_STATUSES[status]}</Badge>;
    };

    // Calculate averages
    const avgScore = performances.length > 0
        ? Math.round(performances.reduce((acc, p) => acc + (p.total_score || 0), 0) / performances.length)
        : 0;

    const excellentCount = performances.filter(p => (p.total_score || 0) >= 90).length;
    const needsImprovementCount = performances.filter(p => (p.total_score || 0) < 70).length;

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        تقييم الأداء
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة وتتبع تقييمات الأداء الوظيفي
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            تقييم جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>إنشاء تقييم أداء جديد</DialogTitle>
                            <DialogDescription>
                                أدخل بيانات التقييم والدرجات لكل معيار
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>الفصل الدراسي</Label>
                                    <Select
                                        value={newPerformance.semester}
                                        onValueChange={(value: PerformanceSemester) =>
                                            setNewPerformance({ ...newPerformance, semester: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الفصل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PERFORMANCE_SEMESTERS).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>السنة</Label>
                                    <Input
                                        type="number"
                                        value={newPerformance.year}
                                        onChange={(e) =>
                                            setNewPerformance({ ...newPerformance, year: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">معايير التقييم</Label>
                                {PERFORMANCE_CRITERIA.map((criterion) => (
                                    <div key={criterion.id} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>{criterion.name}</Label>
                                            <span className="text-sm text-muted-foreground">
                                                الوزن: {criterion.weight}% | الدرجة: {newPerformance.scores[criterion.id] || 0}%
                                            </span>
                                        </div>
                                        <Slider
                                            value={[newPerformance.scores[criterion.id] || 0]}
                                            onValueChange={([value]) =>
                                                setNewPerformance({
                                                    ...newPerformance,
                                                    scores: { ...newPerformance.scores, [criterion.id]: value },
                                                })
                                            }
                                            max={100}
                                            step={1}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">المجموع الكلي:</span>
                                    <span className={`text-2xl font-bold ${getScoreColor(calculateTotalScore(newPerformance.scores))}`}>
                                        {calculateTotalScore(newPerformance.scores)}%
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    التقدير: {PERFORMANCE_GRADES[getGradeFromScore(calculateTotalScore(newPerformance.scores))].name}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>نقاط القوة</Label>
                                <Textarea
                                    placeholder="أدخل نقاط القوة..."
                                    value={newPerformance.strengths}
                                    onChange={(e) =>
                                        setNewPerformance({ ...newPerformance, strengths: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>نقاط الضعف</Label>
                                <Textarea
                                    placeholder="أدخل نقاط الضعف..."
                                    value={newPerformance.weaknesses}
                                    onChange={(e) =>
                                        setNewPerformance({ ...newPerformance, weaknesses: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>التوصيات</Label>
                                <Textarea
                                    placeholder="أدخل التوصيات..."
                                    value={newPerformance.recommendations}
                                    onChange={(e) =>
                                        setNewPerformance({ ...newPerformance, recommendations: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>ملاحظات إضافية</Label>
                                <Textarea
                                    placeholder="أدخل أي ملاحظات إضافية..."
                                    value={newPerformance.notes}
                                    onChange={(e) =>
                                        setNewPerformance({ ...newPerformance, notes: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleCreatePerformance} disabled={isCreating}>
                                {isCreating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                إنشاء التقييم
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            إجمالي التقييمات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performances.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            متوسط الدرجات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                            {avgScore}%
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            تقييمات ممتازة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            تحتاج تحسين
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{needsImprovementCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث في التقييمات..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        </div>

                        <Select value={filterSemester} onValueChange={setFilterSemester}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="الفصل الدراسي" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الفصول</SelectItem>
                                {Object.entries(PERFORMANCE_SEMESTERS).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الحالات</SelectItem>
                                {Object.entries(PERFORMANCE_STATUSES).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredPerformances.length === 0 ? (
                        <div className="text-center py-12">
                            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">لا توجد تقييمات</h3>
                            <p className="text-muted-foreground mb-4">
                                ابدأ بإنشاء تقييم أداء جديد
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 ml-2" />
                                إنشاء تقييم
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الفصل</TableHead>
                                    <TableHead>السنة</TableHead>
                                    <TableHead>الدرجة</TableHead>
                                    <TableHead>التقدير</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPerformances.map((performance) => (
                                    <TableRow key={performance.id}>
                                        <TableCell>{getSemesterBadge(performance.semester)}</TableCell>
                                        <TableCell>{performance.year}</TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${getScoreColor(performance.total_score || 0)}`}>
                                                {performance.total_score || 0}%
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {performance.grade && PERFORMANCE_GRADES[performance.grade]?.name}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(performance.status)}</TableCell>
                                        <TableCell>
                                            {new Date(performance.created_at).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/performance/${performance.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleExportPerformance(performance.id)}
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeletePerformance(performance.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
