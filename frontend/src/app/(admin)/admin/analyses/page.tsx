'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    BarChart3,
    Search,
    MoreVertical,
    Eye,
    Trash2,
    Download,
    Filter,
    RefreshCcw,
    Loader2,
    Users,
    TrendingUp,
    TrendingDown,
    AlertCircle,
} from 'lucide-react';

interface Analysis {
    id: string;
    title: string;
    subject: string;
    grade: string;
    total_students: number;
    passed_count: number;
    failed_count: number;
    average_score: number;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

export default function AdminAnalysesPage() {
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAnalyses();
    }, [currentPage, searchQuery]);

    const fetchAnalyses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/analyses', {
                params: {
                    page: currentPage,
                    search: searchQuery,
                    per_page: 10,
                },
            });
            setAnalyses(response.data || []);
            setTotalPages(response.meta?.last_page || 1);
        } catch (error) {
            console.error('Error fetching analyses:', error);
            // Use mock data for demo
            setAnalyses([
                {
                    id: '1',
                    title: 'تحليل اختبار الرياضيات - الفصل الأول',
                    subject: 'الرياضيات',
                    grade: 'الصف السادس',
                    total_students: 35,
                    passed_count: 28,
                    failed_count: 7,
                    average_score: 78.5,
                    created_at: '2026-01-15T10:30:00',
                    user: { name: 'أحمد محمد', email: 'ahmed@example.com' },
                },
                {
                    id: '2',
                    title: 'تحليل اختبار العلوم - منتصف الفصل',
                    subject: 'العلوم',
                    grade: 'الصف الخامس',
                    total_students: 32,
                    passed_count: 25,
                    failed_count: 7,
                    average_score: 72.3,
                    created_at: '2026-01-14T14:20:00',
                    user: { name: 'سارة علي', email: 'sara@example.com' },
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التحليل؟')) return;

        try {
            await api.delete(`/admin/analyses/${id}`);
            toast.success('تم حذف التحليل بنجاح');
            fetchAnalyses();
        } catch (error) {
            toast.error('فشل حذف التحليل');
        }
    };

    const getPassRate = (passed: number, total: number) => {
        return ((passed / total) * 100).toFixed(1);
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة التحليلات</h1>
                    <p className="text-muted-foreground">عرض وإدارة جميع تحليلات النتائج</p>
                </div>
                <Button onClick={() => fetchAnalyses()} variant="outline" className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    تحديث
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي التحليلات</p>
                            <p className="text-2xl font-bold">{analyses.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">متوسط النجاح</p>
                            <p className="text-2xl font-bold">
                                {analyses.length > 0
                                    ? (analyses.reduce((sum, a) => sum + (a.passed_count / a.total_students) * 100, 0) / analyses.length).toFixed(1)
                                    : 0}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                            <p className="text-2xl font-bold">
                                {analyses.reduce((sum, a) => sum + a.total_students, 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">يحتاجون علاج</p>
                            <p className="text-2xl font-bold">
                                {analyses.reduce((sum, a) => sum + a.failed_count, 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="البحث في التحليلات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            تصفية
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>العنوان</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>الصف</TableHead>
                                    <TableHead>الطلاب</TableHead>
                                    <TableHead>نسبة النجاح</TableHead>
                                    <TableHead>المتوسط</TableHead>
                                    <TableHead>المعلم</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyses.map((analysis) => (
                                    <TableRow key={analysis.id}>
                                        <TableCell className="font-medium">{analysis.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{analysis.subject}</Badge>
                                        </TableCell>
                                        <TableCell>{analysis.grade}</TableCell>
                                        <TableCell>{analysis.total_students}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {parseFloat(getPassRate(analysis.passed_count, analysis.total_students)) >= 60 ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                                <span>{getPassRate(analysis.passed_count, analysis.total_students)}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{analysis.average_score.toFixed(1)}</TableCell>
                                        <TableCell>{analysis.user.name}</TableCell>
                                        <TableCell>
                                            {new Date(analysis.created_at).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        عرض التفاصيل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Download className="h-4 w-4" />
                                                        تصدير
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive"
                                                        onClick={() => handleDelete(analysis.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        حذف
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        السابق
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        صفحة {currentPage} من {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        التالي
                    </Button>
                </div>
            )}
        </div>
    );
}
