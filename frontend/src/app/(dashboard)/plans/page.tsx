'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plan, PLAN_TYPES, PLAN_STATUSES, PlanType, PlanStatus } from '@/types';
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
import { toast } from 'sonner';
import {
    ClipboardList,
    Plus,
    Search,
    FileDown,
    Trash2,
    Eye,
    Edit,
    Sparkles,
    Copy,
    Play,
    CheckCircle,
    Archive,
    Calendar,
    Loader2,
    Target,
    BookOpen,
    GraduationCap,
} from 'lucide-react';

// Educational stages
const EDUCATIONAL_STAGES = [
    { value: 'primary', label: 'المرحلة الابتدائية' },
    { value: 'intermediate', label: 'المرحلة المتوسطة' },
    { value: 'secondary', label: 'المرحلة الثانوية' },
];

// Subjects
const SUBJECTS = [
    { value: 'arabic', label: 'اللغة العربية' },
    { value: 'english', label: 'اللغة الإنجليزية' },
    { value: 'math', label: 'الرياضيات' },
    { value: 'science', label: 'العلوم' },
    { value: 'physics', label: 'الفيزياء' },
    { value: 'chemistry', label: 'الكيمياء' },
    { value: 'biology', label: 'الأحياء' },
    { value: 'social', label: 'الدراسات الاجتماعية' },
    { value: 'islamic', label: 'التربية الإسلامية' },
    { value: 'computer', label: 'الحاسب الآلي' },
    { value: 'other', label: 'أخرى' },
];

// Semesters
const SEMESTERS = [
    { value: 'first', label: 'الفصل الأول' },
    { value: 'second', label: 'الفصل الثاني' },
    { value: 'third', label: 'الفصل الثالث' },
];

export default function PlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [newPlan, setNewPlan] = useState({
        type: 'weekly' as PlanType,
        name: '',
        description: '',
        subject: '',
        grade: '',
        semester: '',
        start_date: '',
        end_date: '',
        objectives: '',
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.getPlans();
            setPlans(response.data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('حدث خطأ في جلب الخطط');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlan.name || !newPlan.type) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            const objectives = newPlan.objectives
                .split('\n')
                .map(line => line.trim())
                .filter(line => line);

            await api.createPlan({
                ...newPlan,
                objectives,
                content: {},
            });

            toast.success('تم إنشاء الخطة بنجاح');
            setIsCreateDialogOpen(false);
            setNewPlan({
                type: 'weekly',
                name: '',
                description: '',
                subject: '',
                grade: '',
                semester: '',
                start_date: '',
                end_date: '',
                objectives: '',
            });
            fetchPlans();
        } catch (error) {
            console.error('Error creating plan:', error);
            toast.error('حدث خطأ في إنشاء الخطة');
        } finally {
            setIsCreating(false);
        }
    };

    const handleGenerateAIPlan = async () => {
        if (!newPlan.type || !newPlan.subject || !newPlan.grade) {
            toast.error('يرجى اختيار نوع الخطة والمادة والمرحلة أولاً');
            return;
        }

        try {
            setIsGeneratingAI(true);
            const response = await api.suggestPlan({
                type: newPlan.type,
                subject: newPlan.subject,
                grade: newPlan.grade,
            });

            if (response.data?.suggestion) {
                setNewPlan({
                    ...newPlan,
                    objectives: response.data.suggestion.objectives?.join('\n') || '',
                    description: response.data.suggestion.description || newPlan.description,
                });
                toast.success('تم توليد الخطة بنجاح');
            }
        } catch (error) {
            console.error('Error generating AI plan:', error);
            toast.error('حدث خطأ في توليد الخطة');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

        try {
            await api.deletePlan(id);
            toast.success('تم حذف الخطة بنجاح');
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast.error('حدث خطأ في حذف الخطة');
        }
    };

    const handleActivatePlan = async (id: string) => {
        try {
            await api.activatePlan(id);
            toast.success('تم تفعيل الخطة بنجاح');
            fetchPlans();
        } catch (error) {
            console.error('Error activating plan:', error);
            toast.error('حدث خطأ في تفعيل الخطة');
        }
    };

    const handleCompletePlan = async (id: string) => {
        try {
            await api.completePlan(id);
            toast.success('تم إكمال الخطة بنجاح');
            fetchPlans();
        } catch (error) {
            console.error('Error completing plan:', error);
            toast.error('حدث خطأ في إكمال الخطة');
        }
    };

    const handleArchivePlan = async (id: string) => {
        try {
            await api.archivePlan(id);
            toast.success('تم أرشفة الخطة بنجاح');
            fetchPlans();
        } catch (error) {
            console.error('Error archiving plan:', error);
            toast.error('حدث خطأ في أرشفة الخطة');
        }
    };

    const handleDuplicatePlan = async (id: string) => {
        try {
            await api.duplicatePlan(id);
            toast.success('تم نسخ الخطة بنجاح');
            fetchPlans();
        } catch (error) {
            console.error('Error duplicating plan:', error);
            toast.error('حدث خطأ في نسخ الخطة');
        }
    };

    const handleExportPlan = async (id: string) => {
        try {
            const response = await api.exportPlan(id, 'pdf');
            if (response.data?.url) {
                window.open(response.data.url, '_blank');
            }
            toast.success('تم تصدير الخطة بنجاح');
        } catch (error) {
            console.error('Error exporting plan:', error);
            toast.error('حدث خطأ في تصدير الخطة');
        }
    };

    const filteredPlans = plans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || plan.type === filterType;
        const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const getTypeBadge = (type: PlanType) => {
        const colors: Record<PlanType, string> = {
            remedial: 'bg-red-500',
            enrichment: 'bg-green-500',
            weekly: 'bg-blue-500',
            curriculum: 'bg-purple-500',
            daily: 'bg-cyan-500',
            semester: 'bg-orange-500',
        };
        return <Badge className={colors[type]}>{PLAN_TYPES[type]}</Badge>;
    };

    const getStatusBadge = (status: PlanStatus) => {
        const colors: Record<PlanStatus, string> = {
            draft: 'bg-gray-500',
            active: 'bg-green-500',
            completed: 'bg-blue-500',
            archived: 'bg-yellow-500',
        };
        return <Badge className={colors[status]}>{PLAN_STATUSES[status]}</Badge>;
    };

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        الخطط التعليمية
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إنشاء وإدارة الخطط العلاجية والإثرائية وتوزيع المنهج
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            خطة جديدة
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>إنشاء خطة جديدة</DialogTitle>
                            <DialogDescription>
                                أنشئ خطة علاجية أو إثرائية أو توزيع منهج
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>نوع الخطة *</Label>
                                    <Select
                                        value={newPlan.type}
                                        onValueChange={(value) => setNewPlan({ ...newPlan, type: value as PlanType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PLAN_TYPES).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>اسم الخطة *</Label>
                                    <Input
                                        placeholder="مثال: خطة علاجية - رياضيات"
                                        value={newPlan.name}
                                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>المادة</Label>
                                    <Select
                                        value={newPlan.subject}
                                        onValueChange={(value) => setNewPlan({ ...newPlan, subject: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المادة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUBJECTS.map((subject) => (
                                                <SelectItem key={subject.value} value={subject.value}>
                                                    {subject.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>المرحلة</Label>
                                    <Select
                                        value={newPlan.grade}
                                        onValueChange={(value) => setNewPlan({ ...newPlan, grade: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المرحلة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EDUCATIONAL_STAGES.map((stage) => (
                                                <SelectItem key={stage.value} value={stage.value}>
                                                    {stage.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>الفصل الدراسي</Label>
                                    <Select
                                        value={newPlan.semester}
                                        onValueChange={(value) => setNewPlan({ ...newPlan, semester: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الفصل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SEMESTERS.map((semester) => (
                                                <SelectItem key={semester.value} value={semester.value}>
                                                    {semester.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>تاريخ البداية</Label>
                                    <Input
                                        type="date"
                                        value={newPlan.start_date}
                                        onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>تاريخ النهاية</Label>
                                    <Input
                                        type="date"
                                        value={newPlan.end_date}
                                        onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>الوصف</Label>
                                <Textarea
                                    placeholder="وصف مختصر للخطة..."
                                    value={newPlan.description}
                                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>الأهداف</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGenerateAIPlan}
                                        disabled={isGeneratingAI}
                                    >
                                        {isGeneratingAI ? (
                                            <Loader2 className="h-4 w-4 animate-spin ml-1" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 ml-1" />
                                        )}
                                        توليد بالذكاء الاصطناعي
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="أدخل كل هدف في سطر منفصل..."
                                    className="min-h-[120px]"
                                    value={newPlan.objectives}
                                    onChange={(e) => setNewPlan({ ...newPlan, objectives: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleCreatePlan} disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        جاري الإنشاء...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="h-4 w-4 ml-2" />
                                        إنشاء الخطة
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
                        <CardTitle className="text-sm font-medium">إجمالي الخطط</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{plans.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">الخطط النشطة</CardTitle>
                        <Play className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {plans.filter(p => p.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">الخطط العلاجية</CardTitle>
                        <Target className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {plans.filter(p => p.type === 'remedial').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">الخطط الإثرائية</CardTitle>
                        <GraduationCap className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {plans.filter(p => p.type === 'enrichment').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في الخطط..."
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="نوع الخطة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(PLAN_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
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
                        {Object.entries(PLAN_STATUSES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Plans Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredPlans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">لا توجد خطط</h3>
                            <p className="text-muted-foreground mb-4">
                                ابدأ بإنشاء خطة جديدة
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 ml-2" />
                                إنشاء خطة جديدة
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم الخطة</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>تاريخ البداية</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPlans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">{plan.name}</TableCell>
                                        <TableCell>{getTypeBadge(plan.type)}</TableCell>
                                        <TableCell>
                                            {SUBJECTS.find(s => s.value === plan.subject)?.label || plan.subject || '-'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(plan.status)}</TableCell>
                                        <TableCell>
                                            {plan.start_date
                                                ? new Date(plan.start_date).toLocaleDateString('ar-SA')
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/plans/${plan.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {plan.status === 'draft' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleActivatePlan(plan.id)}
                                                    >
                                                        <Play className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                )}
                                                {plan.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleCompletePlan(plan.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDuplicatePlan(plan.id)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleExportPlan(plan.id)}
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
