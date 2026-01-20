'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Analysis, ACHIEVEMENT_CATEGORIES } from '@/types';
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
    BarChart3,
    Plus,
    Search,
    FileDown,
    Trash2,
    Eye,
    Edit,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Users,
    Calculator,
    FileSpreadsheet,
    Loader2,
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

export default function AnalysesPage() {
    const router = useRouter();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newAnalysis, setNewAnalysis] = useState({
        name: '',
        subject: '',
        grade: '',
        semester: '',
        students_data: '',
    });

    useEffect(() => {
        fetchAnalyses();
    }, []);

    const fetchAnalyses = async () => {
        try {
            setLoading(true);
            const response = await api.getAnalyses();
            setAnalyses(response.data || []);
        } catch (error) {
            console.error('Error fetching analyses:', error);
            toast.error('حدث خطأ في جلب التحليلات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAnalysis = async () => {
        if (!newAnalysis.name || !newAnalysis.students_data) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            // Parse students data (CSV format: name,grade)
            const lines = newAnalysis.students_data.trim().split('\n');
            const students_data = lines.map(line => {
                const [name, grade] = line.split(',').map(s => s.trim());
                return { name, grade: parseFloat(grade) || 0 };
            });

            const response = await api.createAnalysis({
                ...newAnalysis,
                students_data,
            });

            toast.success('تم إنشاء التحليل بنجاح');
            setIsCreateDialogOpen(false);
            setNewAnalysis({ name: '', subject: '', grade: '', semester: '', students_data: '' });
            fetchAnalyses();
        } catch (error) {
            console.error('Error creating analysis:', error);
            toast.error('حدث خطأ في إنشاء التحليل');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAnalysis = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التحليل؟')) return;

        try {
            await api.deleteAnalysis(id);
            toast.success('تم حذف التحليل بنجاح');
            fetchAnalyses();
        } catch (error) {
            console.error('Error deleting analysis:', error);
            toast.error('حدث خطأ في حذف التحليل');
        }
    };

    const handleExportAnalysis = async (id: string) => {
        try {
            const response = await api.exportAnalysis(id, 'pdf');
            if (response.data?.url) {
                window.open(response.data.url, '_blank');
            }
            toast.success('تم تصدير التحليل بنجاح');
        } catch (error) {
            console.error('Error exporting analysis:', error);
            toast.error('حدث خطأ في تصدير التحليل');
        }
    };

    const filteredAnalyses = analyses.filter(analysis =>
        analysis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500">مكتمل</Badge>;
            case 'draft':
                return <Badge variant="secondary">مسودة</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getGradeColor = (average: number) => {
        if (average >= 90) return 'text-green-600';
        if (average >= 80) return 'text-blue-600';
        if (average >= 70) return 'text-yellow-600';
        if (average >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        تحليل النتائج
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        تحليل نتائج الطلاب واستخراج الإحصائيات والتوصيات
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            تحليل جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>إنشاء تحليل جديد</DialogTitle>
                            <DialogDescription>
                                أدخل بيانات الطلاب لتحليل النتائج واستخراج الإحصائيات
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">اسم التحليل *</Label>
                                <Input
                                    id="name"
                                    placeholder="مثال: تحليل نتائج الفصل الأول - رياضيات"
                                    value={newAnalysis.name}
                                    onChange={(e) => setNewAnalysis({ ...newAnalysis, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>المادة</Label>
                                    <Select
                                        value={newAnalysis.subject}
                                        onValueChange={(value) => setNewAnalysis({ ...newAnalysis, subject: value })}
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
                                        value={newAnalysis.grade}
                                        onValueChange={(value) => setNewAnalysis({ ...newAnalysis, grade: value })}
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
                                        value={newAnalysis.semester}
                                        onValueChange={(value) => setNewAnalysis({ ...newAnalysis, semester: value })}
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

                            <div className="grid gap-2">
                                <Label htmlFor="students_data">بيانات الطلاب *</Label>
                                <Textarea
                                    id="students_data"
                                    placeholder="أدخل بيانات الطلاب (اسم الطالب, الدرجة) كل طالب في سطر:&#10;أحمد محمد, 85&#10;سارة علي, 92&#10;محمد خالد, 78"
                                    className="min-h-[200px] font-mono text-sm"
                                    value={newAnalysis.students_data}
                                    onChange={(e) => setNewAnalysis({ ...newAnalysis, students_data: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    أدخل اسم الطالب والدرجة مفصولين بفاصلة، كل طالب في سطر منفصل
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleCreateAnalysis} disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        جاري الإنشاء...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="h-4 w-4 ml-2" />
                                        تحليل النتائج
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي التحليلات</CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyses.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">المكتملة</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {analyses.filter(a => a.status === 'completed').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">المسودات</CardTitle>
                        <Edit className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {analyses.filter(a => a.status === 'draft').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {analyses.reduce((sum, a) => sum + (a.students_data?.length || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في التحليلات..."
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Analyses Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredAnalyses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">لا توجد تحليلات</h3>
                            <p className="text-muted-foreground mb-4">
                                ابدأ بإنشاء تحليل جديد لنتائج طلابك
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 ml-2" />
                                إنشاء تحليل جديد
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم التحليل</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>عدد الطلاب</TableHead>
                                    <TableHead>المتوسط</TableHead>
                                    <TableHead>نسبة النجاح</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAnalyses.map((analysis) => (
                                    <TableRow key={analysis.id}>
                                        <TableCell className="font-medium">{analysis.name}</TableCell>
                                        <TableCell>
                                            {SUBJECTS.find(s => s.value === analysis.subject)?.label || analysis.subject || '-'}
                                        </TableCell>
                                        <TableCell>{analysis.students_data?.length || 0}</TableCell>
                                        <TableCell>
                                            <span className={getGradeColor(analysis.results?.average || 0)}>
                                                {analysis.results?.average?.toFixed(1) || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={getGradeColor((analysis.results?.pass_rate || 0) * 100)}>
                                                {analysis.results?.pass_rate
                                                    ? `${(analysis.results.pass_rate * 100).toFixed(1)}%`
                                                    : '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(analysis.status)}</TableCell>
                                        <TableCell>
                                            {new Date(analysis.created_at).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/analyses/${analysis.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleExportAnalysis(analysis.id)}
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteAnalysis(analysis.id)}
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
