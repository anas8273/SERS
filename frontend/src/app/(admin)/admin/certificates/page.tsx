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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Award,
    Search,
    MoreVertical,
    Eye,
    Trash2,
    Download,
    Filter,
    RefreshCcw,
    Loader2,
    Plus,
    FileText,
    Star,
    Heart,
    Trophy,
} from 'lucide-react';

interface Certificate {
    id: string;
    type: string;
    recipient_name: string;
    reason: string;
    organization: string;
    template_id: string;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

const CERTIFICATE_TYPES = {
    appreciation: { label: 'تقدير', icon: Star, color: 'bg-yellow-100 text-yellow-700' },
    thanks: { label: 'شكر', icon: Heart, color: 'bg-pink-100 text-pink-700' },
    graduation: { label: 'تخرج', icon: Award, color: 'bg-blue-100 text-blue-700' },
    participation: { label: 'مشاركة', icon: FileText, color: 'bg-green-100 text-green-700' },
    achievement: { label: 'إنجاز', icon: Trophy, color: 'bg-purple-100 text-purple-700' },
};

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCertificates();
    }, [currentPage, searchQuery, typeFilter]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/certificates', {
                params: {
                    page: currentPage,
                    search: searchQuery,
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    per_page: 10,
                },
            });
            setCertificates(response.data || []);
            setTotalPages(response.meta?.last_page || 1);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            // Use mock data for demo
            setCertificates([
                {
                    id: '1',
                    type: 'appreciation',
                    recipient_name: 'محمد أحمد الغامدي',
                    reason: 'التفوق الدراسي في مادة الرياضيات',
                    organization: 'مدرسة الأمل الابتدائية',
                    template_id: 'cert-001',
                    created_at: '2026-01-15T10:30:00',
                    user: { name: 'أحمد محمد', email: 'ahmed@example.com' },
                },
                {
                    id: '2',
                    type: 'thanks',
                    recipient_name: 'سارة علي القحطاني',
                    reason: 'المشاركة الفعالة في الأنشطة المدرسية',
                    organization: 'مدرسة النور المتوسطة',
                    template_id: 'cert-002',
                    created_at: '2026-01-14T14:20:00',
                    user: { name: 'سارة علي', email: 'sara@example.com' },
                },
                {
                    id: '3',
                    type: 'achievement',
                    recipient_name: 'خالد عبدالله العتيبي',
                    reason: 'الفوز بالمركز الأول في مسابقة القرآن الكريم',
                    organization: 'إدارة التعليم بمنطقة الرياض',
                    template_id: 'cert-003',
                    created_at: '2026-01-13T09:15:00',
                    user: { name: 'خالد عبدالله', email: 'khaled@example.com' },
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الشهادة؟')) return;

        try {
            await api.delete(`/admin/certificates/${id}`);
            toast.success('تم حذف الشهادة بنجاح');
            fetchCertificates();
        } catch (error) {
            toast.error('فشل حذف الشهادة');
        }
    };

    const getTypeInfo = (type: string) => {
        return CERTIFICATE_TYPES[type as keyof typeof CERTIFICATE_TYPES] || {
            label: type,
            icon: Award,
            color: 'bg-gray-100 text-gray-700',
        };
    };

    const getStats = () => {
        const stats = {
            total: certificates.length,
            appreciation: 0,
            thanks: 0,
            achievement: 0,
        };
        certificates.forEach((cert) => {
            if (cert.type === 'appreciation') stats.appreciation++;
            else if (cert.type === 'thanks') stats.thanks++;
            else if (cert.type === 'achievement') stats.achievement++;
        });
        return stats;
    };

    const stats = getStats();

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">إدارة الشهادات</h1>
                    <p className="text-muted-foreground">عرض وإدارة جميع الشهادات المُنشأة</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => fetchCertificates()} variant="outline" className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        تحديث
                    </Button>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        إضافة قالب شهادة
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Award className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي الشهادات</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Star className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">شهادات التقدير</p>
                            <p className="text-2xl font-bold">{stats.appreciation}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center">
                            <Heart className="h-6 w-6 text-pink-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">شهادات الشكر</p>
                            <p className="text-2xl font-bold">{stats.thanks}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">شهادات الإنجاز</p>
                            <p className="text-2xl font-bold">{stats.achievement}</p>
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
                                placeholder="البحث في الشهادات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="نوع الشهادة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الأنواع</SelectItem>
                                <SelectItem value="appreciation">تقدير</SelectItem>
                                <SelectItem value="thanks">شكر</SelectItem>
                                <SelectItem value="graduation">تخرج</SelectItem>
                                <SelectItem value="participation">مشاركة</SelectItem>
                                <SelectItem value="achievement">إنجاز</SelectItem>
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
                                    <TableHead>اسم المستلم</TableHead>
                                    <TableHead>السبب</TableHead>
                                    <TableHead>الجهة</TableHead>
                                    <TableHead>المُنشئ</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {certificates.map((certificate) => {
                                    const typeInfo = getTypeInfo(certificate.type);
                                    const TypeIcon = typeInfo.icon;
                                    return (
                                        <TableRow key={certificate.id}>
                                            <TableCell>
                                                <Badge className={typeInfo.color}>
                                                    <TypeIcon className="h-3 w-3 ml-1" />
                                                    {typeInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {certificate.recipient_name}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {certificate.reason}
                                            </TableCell>
                                            <TableCell>{certificate.organization}</TableCell>
                                            <TableCell>{certificate.user.name}</TableCell>
                                            <TableCell>
                                                {new Date(certificate.created_at).toLocaleDateString('ar-SA')}
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
                                                            عرض الشهادة
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2">
                                                            <Download className="h-4 w-4" />
                                                            تحميل PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-2 text-destructive"
                                                            onClick={() => handleDelete(certificate.id)}
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
