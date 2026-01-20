'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Test, TEST_TYPES, TestType } from '@/types';
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
    FileQuestion,
    Plus,
    Search,
    Trash2,
    Eye,
    Edit,
    FileDown,
    Loader2,
    Users,
    BarChart3,
    Calendar,
    Clock,
    CheckCircle,
    Copy,
} from 'lucide-react';

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

// Grades
const GRADES = [
    { value: '1', label: 'الصف الأول' },
    { value: '2', label: 'الصف الثاني' },
    { value: '3', label: 'الصف الثالث' },
    { value: '4', label: 'الصف الرابع' },
    { value: '5', label: 'الصف الخامس' },
    { value: '6', label: 'الصف السادس' },
    { value: '7', label: 'الصف الأول متوسط' },
    { value: '8', label: 'الصف الثاني متوسط' },
    { value: '9', label: 'الصف الثالث متوسط' },
    { value: '10', label: 'الصف الأول ثانوي' },
    { value: '11', label: 'الصف الثاني ثانوي' },
    { value: '12', label: 'الصف الثالث ثانوي' },
];

export default function TestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTest, setNewTest] = useState({
        type: 'quiz' as TestType,
        name: '',
        subject: '',
        grade: '',
        total_marks: 100,
        duration: 60,
        date: '',
        description: '',
    });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const response = await api.getTests();
            setTests(response.data || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
            toast.error('حدث خطأ في جلب الاختبارات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTest = async () => {
        if (!newTest.name || !newTest.type || !newTest.subject) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            await api.createTest(newTest);
            toast.success('تم إنشاء الاختبار بنجاح');
            setIsCreateDialogOpen(false);
            setNewTest({
                type: 'quiz',
                name: '',
                subject: '',
                grade: '',
                total_marks: 100,
                duration: 60,
                date: '',
                description: '',
            });
            fetchTests();
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('حدث خطأ في إنشاء الاختبار');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTest = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return;

        try {
            await api.deleteTest(id);
            toast.success('تم حذف الاختبار بنجاح');
            fetchTests();
        } catch (error) {
            console.error('Error deleting test:', error);
            toast.error('حدث خطأ في حذف الاختبار');
        }
    };

    const handleDuplicateTest = async (id: string) => {
        try {
            await api.duplicateTest(id);
            toast.success('تم نسخ الاختبار بنجاح');
            fetchTests();
        } catch (error) {
            console.error('Error duplicating test:', error);
            toast.error('حدث خطأ في نسخ الاختبار');
        }
    };

    const filteredTests = tests.filter(test => {
        const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            test.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || test.type === filterType;
        const matchesSubject = filterSubject === 'all' || test.subject === filterSubject;
        return matchesSearch && matchesType && matchesSubject;
    });

    const getTypeBadge = (type: TestType) => {
        const colors: Record<TestType, string> = {
            quiz: 'bg-blue-500',
            midterm: 'bg-green-500',
            final: 'bg-purple-500',
            diagnostic: 'bg-orange-500',
            practice: 'bg-cyan-500',
        };
        return <Badge className={colors[type]}>{TEST_TYPES[type]}</Badge>;
    };

    // Calculate stats
    const totalStudents = tests.reduce((acc, t) => acc + (t.results_count || 0), 0);
    const analyzedTests = tests.filter(t => t.is_published).length;

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileQuestion className="h-6 w-6 text-primary" />
                        الاختبارات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إنشاء وإدارة الاختبارات وتحليل النتائج
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            اختبار جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>إنشاء اختبار جديد</DialogTitle>
                            <DialogDescription>
                                أنشئ اختباراً جديداً لتسجيل درجات الطلاب وتحليل النتائج
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>نوع الاختبار *</Label>
                                    <Select
                                        value={newTest.type}
                                        onValueChange={(value) => setNewTest({ ...newTest, type: value as TestType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TEST_TYPES).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>اسم الاختبار *</Label>
                                    <Input
                                        placeholder="مثال: اختبار الفصل الأول - رياضيات"
                                        value={newTest.name}
                                        onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>المادة *</Label>
                                    <Select
                                        value={newTest.subject}
                                        onValueChange={(value) => setNewTest({ ...newTest, subject: value })}
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
                                    <Label>الصف</Label>
                                    <Select
                                        value={newTest.grade}
                                        onValueChange={(value) => setNewTest({ ...newTest, grade: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الصف" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GRADES.map((grade) => (
                                                <SelectItem key={grade.value} value={grade.value}>
                                                    {grade.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>الدرجة الكلية</Label>
                                    <Input
                                        type="number"
                                        value={newTest.total_marks}
                                        onChange={(e) => setNewTest({ ...newTest, total_marks: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>المدة (بالدقائق)</Label>
                                    <Input
                                        type="number"
                                        value={newTest.duration}
                                        onChange={(e) => setNewTest({ ...newTest, duration: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>تاريخ الاختبار</Label>
                                    <Input
                                        type="date"
                                        value={newTest.date}
                                        onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>وصف الاختبار</Label>
                                <Textarea
                                    placeholder="وصف مختصر للاختبار..."
                                    value={newTest.description}
                                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button onClick={handleCreateTest} disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        جاري الإنشاء...
                                    </>
                                ) : (
                                    <>
                                        <FileQuestion className="h-4 w-4 ml-2" />
                                        إنشاء الاختبار
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
                        <CardTitle className="text-sm font-medium">إجمالي الاختبارات</CardTitle>
                        <FileQuestion className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tests.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">تم تحليلها</CardTitle>
                        <BarChart3 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{analyzedTests}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {tests.filter(t => {
                                const date = new Date(t.created_at);
                                const now = new Date();
                                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في الاختبارات..."
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="نوع الاختبار" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(TEST_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="المادة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع المواد</SelectItem>
                        {SUBJECTS.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tests Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredTests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">لا توجد اختبارات</h3>
                            <p className="text-muted-foreground mb-4">
                                ابدأ بإنشاء اختبار جديد
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 ml-2" />
                                إنشاء اختبار جديد
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم الاختبار</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>الدرجة</TableHead>
                                    <TableHead>عدد الطلاب</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTests.map((test) => (
                                    <TableRow key={test.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{test.title}</span>
                                                {test.is_published && (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(test.type)}</TableCell>
                                        <TableCell>
                                            {SUBJECTS.find(s => s.value === test.subject)?.label || test.subject}
                                        </TableCell>
                                        <TableCell>{test.total_marks}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {test.results_count || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(test.created_at).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/tests/${test.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/tests/${test.id}/results`)}
                                                >
                                                    <BarChart3 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDuplicateTest(test.id)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteTest(test.id)}
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
