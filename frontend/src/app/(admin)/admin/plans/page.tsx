'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    Search,
    MoreVertical,
    Eye,
    Trash2,
    Download,
    RefreshCcw,
    Loader2,
    Target,
    Sparkles,
    Calendar,
    Users,
} from 'lucide-react';

interface Plan {
    id: string;
    type: 'remedial' | 'enrichment' | 'curriculum';
    title: string;
    subject: string;
    grade: string;
    duration: string;
    students_count: number;
    status: 'draft' | 'active' | 'completed';
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

const PLAN_TYPES = {
    remedial: { label: 'علاجية', icon: Target, color: 'bg-red-100 text-red-700' },
    enrichment: { label: 'إثرائية', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
    curriculum: { label: 'توزيع منهج', icon: Calendar, color: 'bg-blue-100 text-blue-700' },
};

const STATUS_LABELS = {
    draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700' },
    active: { label: 'نشطة', color: 'bg-green-100 text-green-700' },
    completed: { label: 'مكتملة', color: 'bg-blue-100 text-blue-700' },
};

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPlans();
    }, [currentPage, searchQuery, typeFilter]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/plans', {
                params: {
                    page: currentPage,
                    search: searchQuery,
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    per_page: 10,
                },
            });
            setPlans(response.data || []);
            setTotalPages(response.meta?.last_page || 1);
        } catch (error) {
            console.error('Error fetching plans:', error);
            // Use mock data for demo
            setPlans([
                {
                    id: '1',
                    type: 'remedial',
                    title: 'خطة علاجية لمهارات القراءة',
                    subject: 'اللغة العربية',
                    grade: 'الصف الثالث',
                    duration: '4 أسابيع',
                    students_count: 5,
                    status: 'active',
                    created_at: '2026-01-15T10:30:00',
                    user: { name: 'أحمد محمد', email: 'ahmed@example.com' },
                },
                {
                    id: '2',
                    type: 'enrichment',
                    title: 'خطة إثرائية للموهوبين في الرياضيات',
                    subject: 'الرياضيات',
                    grade: 'الصف السادس',
                    duration: '6 أسابيع',
                    students_count: 8,
                    status: 'active',
                    created_at: '2026-01-14T14:20:00',
                    user: { name: 'سارة علي', email: 'sara@example.com' },
                },
                {
                    id: '3',
                    type: 'curriculum',
                    title: 'توزيع منهج العلوم - الفصل الثاني',
                    subject: 'العلوم',
                    grade: 'الصف الخامس',
                    duration: '16 أسبوع',
                    students_count: 0,
                    status: 'completed',
                    created_at: '2026-01-13T09:15:00',
                    user: { name: 'خالد عبدالله', email: 'khaled@example.com' },
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

        try {
            await api.delete(`/admin/plans/${id}`);
            toast.success('تم حذف الخطة بنجاح');
            fetchPlans();
        } catch (error) {
            toast.error('فشل حذف الخطة');
        }
    };

    const getTypeInfo = (type: string) => {
        return PLAN_TYPES[type as keyof typeof PLAN_TYPES] || {
            label: type,
            icon: ClipboardList,
            color: 'bg-gray-100 text-gray-700',
        };
    };

    const getStatusInfo = (status: string) => {
        return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || {
            label: status,
            color: 'bg-gray-100 text-gray-700',
        };
    };

    const getStats = () => {
        const stats = {
            total: plans.length,
            remedial: plans.filter((p) => p.type === 'remedial').length,
            enrichment: plans.filter((p) => p.type === 'enrichment').length,
            curriculum: plans.filter((p) => p.type === 'curriculum').length,
        };
        return stats;
    };

    const stats = getStats();

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة الخطط التعليمية</h1>
                    <p className="text-muted-foreground">عرض وإدارة الخطط العلاجية والإثرائية وتوزيع المناهج</p>
                </div>
                <Button onClick={() => fetchPlans()} variant="outline" className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    تحديث
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <ClipboardList className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي الخطط</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <Target className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">خطط علاجية</p>
                            <p className="text-2xl font-bold">{stats.remedial}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">خطط إثرائية</p>
                            <p className="text-2xl font-bold">{stats.enrichment}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">توزيع مناهج</p>
                            <p className="text-2xl font-bold">{stats.curriculum}</p>
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
                                placeholder="البحث في الخطط..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="نوع الخطة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الأنواع</SelectItem>
                                <SelectItem value="remedial">علاجية</SelectItem>
                                <SelectItem value="enrichment">إثرائية</SelectItem>
                                <SelectItem value="curriculum">توزيع منهج</SelectItem>
                            </SelectContent>
                        </Select>
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
                                    <TableHead>النوع</TableHead>
                                    <TableHead>العنوان</TableHead>
                                    <TableHead>المادة</TableHead>
                                    <TableHead>الصف</TableHead>
                                    <TableHead>المدة</TableHead>
                                    <TableHead>الطلاب</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>المُنشئ</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan) => {
                                    const typeInfo = getTypeInfo(plan.type);
                                    const statusInfo = getStatusInfo(plan.status);
                                    const TypeIcon = typeInfo.icon;
                                    return (
                                        <TableRow key={plan.id}>
                                            <TableCell>
                                                <Badge className={typeInfo.color}>
                                                    <TypeIcon className="h-3 w-3 ml-1" />
                                                    {typeInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium max-w-[200px] truncate">
                                                {plan.title}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{plan.subject}</Badge>
                                            </TableCell>
                                            <TableCell>{plan.grade}</TableCell>
                                            <TableCell>{plan.duration}</TableCell>
                                            <TableCell>
                                                {plan.students_count > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {plan.students_count}
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                            </TableCell>
                                            <TableCell>{plan.user.name}</TableCell>
                                            <TableCell>
                                                {new Date(plan.created_at).toLocaleDateString('ar-SA')}
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
                                                            onClick={() => handleDelete(plan.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            حذف
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
