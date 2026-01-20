'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Certificate, CERTIFICATE_TYPES, CertificateType } from '@/types';
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
    Award,
    Plus,
    Search,
    FileDown,
    Trash2,
    Eye,
    Edit,
    Sparkles,
    Copy,
    Users,
    Calendar,
    Loader2,
    QrCode,
    Download,
    Share2,
} from 'lucide-react';

export default function CertificatesPage() {
    const router = useRouter();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [newCertificate, setNewCertificate] = useState({
        type: 'appreciation' as CertificateType,
        recipient_name: '',
        recipient_title: '',
        issuer_name: '',
        issuer_title: '',
        organization: '',
        reason: '',
        issue_date: new Date().toISOString().split('T')[0],
    });
    const [bulkData, setBulkData] = useState({
        type: 'appreciation' as CertificateType,
        recipients: '',
        issuer_name: '',
        issuer_title: '',
        organization: '',
        reason: '',
        issue_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await api.getCertificates();
            setCertificates(response.data || []);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            toast.error('حدث خطأ في جلب الشهادات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCertificate = async () => {
        if (!newCertificate.recipient_name || !newCertificate.type) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            await api.createCertificate(newCertificate);
            toast.success('تم إنشاء الشهادة بنجاح');
            setIsCreateDialogOpen(false);
            setNewCertificate({
                type: 'appreciation',
                recipient_name: '',
                recipient_title: '',
                issuer_name: '',
                issuer_title: '',
                organization: '',
                reason: '',
                issue_date: new Date().toISOString().split('T')[0],
            });
            fetchCertificates();
        } catch (error) {
            console.error('Error creating certificate:', error);
            toast.error('حدث خطأ في إنشاء الشهادة');
        } finally {
            setIsCreating(false);
        }
    };

    const handleBulkCreate = async () => {
        if (!bulkData.recipients || !bulkData.type) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        try {
            setIsCreating(true);
            const recipients = bulkData.recipients
                .split('\n')
                .map(line => line.trim())
                .filter(line => line);

            await api.createBulkCertificates({
                ...bulkData,
                recipients,
            });

            toast.success(`تم إنشاء ${recipients.length} شهادة بنجاح`);
            setIsBulkDialogOpen(false);
            setBulkData({
                type: 'appreciation',
                recipients: '',
                issuer_name: '',
                issuer_title: '',
                organization: '',
                reason: '',
                issue_date: new Date().toISOString().split('T')[0],
            });
            fetchCertificates();
        } catch (error) {
            console.error('Error creating bulk certificates:', error);
            toast.error('حدث خطأ في إنشاء الشهادات');
        } finally {
            setIsCreating(false);
        }
    };

    const handleGenerateAIText = async () => {
        try {
            setIsGeneratingAI(true);
            const response = await api.suggestCertificateText({
                type: newCertificate.type,
                recipient_name: newCertificate.recipient_name,
                recipient_title: newCertificate.recipient_title,
                reason: newCertificate.reason,
                organization: newCertificate.organization,
            });

            if (response.data?.suggestion) {
                setNewCertificate({
                    ...newCertificate,
                    reason: response.data.suggestion,
                });
                toast.success('تم توليد النص بنجاح');
            }
        } catch (error) {
            console.error('Error generating AI text:', error);
            toast.error('حدث خطأ في توليد النص');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleDeleteCertificate = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الشهادة؟')) return;

        try {
            await api.deleteCertificate(id);
            toast.success('تم حذف الشهادة بنجاح');
            fetchCertificates();
        } catch (error) {
            console.error('Error deleting certificate:', error);
            toast.error('حدث خطأ في حذف الشهادة');
        }
    };

    const handleDownloadCertificate = async (id: string) => {
        try {
            const response = await api.generateCertificate(id, 'pdf');
            if (response.data?.url) {
                window.open(response.data.url, '_blank');
            }
            toast.success('تم تحميل الشهادة بنجاح');
        } catch (error) {
            console.error('Error downloading certificate:', error);
            toast.error('حدث خطأ في تحميل الشهادة');
        }
    };

    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = cert.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.reason?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || cert.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeBadge = (type: CertificateType) => {
        const colors: Record<CertificateType, string> = {
            appreciation: 'bg-blue-500',
            thanks: 'bg-green-500',
            graduation: 'bg-purple-500',
            honor: 'bg-yellow-500',
            participation: 'bg-cyan-500',
            achievement: 'bg-orange-500',
            training: 'bg-pink-500',
            custom: 'bg-gray-500',
        };
        return <Badge className={colors[type]}>{CERTIFICATE_TYPES[type]}</Badge>;
    };

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Award className="h-6 w-6 text-primary" />
                        الشهادات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إنشاء وإدارة شهادات الشكر والتقدير والتخرج
                    </p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Users className="h-4 w-4" />
                                إنشاء متعدد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>إنشاء شهادات متعددة</DialogTitle>
                                <DialogDescription>
                                    أنشئ شهادات لعدة أشخاص دفعة واحدة
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>نوع الشهادة *</Label>
                                        <Select
                                            value={bulkData.type}
                                            onValueChange={(value) => setBulkData({ ...bulkData, type: value as CertificateType })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(CERTIFICATE_TYPES).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>تاريخ الإصدار</Label>
                                        <Input
                                            type="date"
                                            value={bulkData.issue_date}
                                            onChange={(e) => setBulkData({ ...bulkData, issue_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>أسماء المستلمين *</Label>
                                    <Textarea
                                        placeholder="أدخل اسم كل مستلم في سطر منفصل:&#10;أحمد محمد&#10;سارة علي&#10;محمد خالد"
                                        className="min-h-[150px]"
                                        value={bulkData.recipients}
                                        onChange={(e) => setBulkData({ ...bulkData, recipients: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>اسم المُصدر</Label>
                                        <Input
                                            placeholder="اسم من يصدر الشهادة"
                                            value={bulkData.issuer_name}
                                            onChange={(e) => setBulkData({ ...bulkData, issuer_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>منصب المُصدر</Label>
                                        <Input
                                            placeholder="مثال: مدير المدرسة"
                                            value={bulkData.issuer_title}
                                            onChange={(e) => setBulkData({ ...bulkData, issuer_title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>الجهة / المؤسسة</Label>
                                    <Input
                                        placeholder="اسم المدرسة أو المؤسسة"
                                        value={bulkData.organization}
                                        onChange={(e) => setBulkData({ ...bulkData, organization: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>سبب منح الشهادة</Label>
                                    <Textarea
                                        placeholder="سبب منح الشهادة..."
                                        value={bulkData.reason}
                                        onChange={(e) => setBulkData({ ...bulkData, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleBulkCreate} disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                            جاري الإنشاء...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="h-4 w-4 ml-2" />
                                            إنشاء الشهادات
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                شهادة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>إنشاء شهادة جديدة</DialogTitle>
                                <DialogDescription>
                                    أنشئ شهادة شكر أو تقدير أو تخرج
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>نوع الشهادة *</Label>
                                        <Select
                                            value={newCertificate.type}
                                            onValueChange={(value) => setNewCertificate({ ...newCertificate, type: value as CertificateType })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(CERTIFICATE_TYPES).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>تاريخ الإصدار</Label>
                                        <Input
                                            type="date"
                                            value={newCertificate.issue_date}
                                            onChange={(e) => setNewCertificate({ ...newCertificate, issue_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>اسم المستلم *</Label>
                                        <Input
                                            placeholder="اسم الشخص الذي ستُمنح له الشهادة"
                                            value={newCertificate.recipient_name}
                                            onChange={(e) => setNewCertificate({ ...newCertificate, recipient_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>لقب المستلم</Label>
                                        <Input
                                            placeholder="مثال: الطالب، المعلم، الأستاذ"
                                            value={newCertificate.recipient_title}
                                            onChange={(e) => setNewCertificate({ ...newCertificate, recipient_title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>اسم المُصدر</Label>
                                        <Input
                                            placeholder="اسم من يصدر الشهادة"
                                            value={newCertificate.issuer_name}
                                            onChange={(e) => setNewCertificate({ ...newCertificate, issuer_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>منصب المُصدر</Label>
                                        <Input
                                            placeholder="مثال: مدير المدرسة"
                                            value={newCertificate.issuer_title}
                                            onChange={(e) => setNewCertificate({ ...newCertificate, issuer_title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>الجهة / المؤسسة</Label>
                                    <Input
                                        placeholder="اسم المدرسة أو المؤسسة"
                                        value={newCertificate.organization}
                                        onChange={(e) => setNewCertificate({ ...newCertificate, organization: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>سبب منح الشهادة</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleGenerateAIText}
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
                                        placeholder="سبب منح الشهادة..."
                                        className="min-h-[100px]"
                                        value={newCertificate.reason}
                                        onChange={(e) => setNewCertificate({ ...newCertificate, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={handleCreateCertificate} disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                            جاري الإنشاء...
                                        </>
                                    ) : (
                                        <>
                                            <Award className="h-4 w-4 ml-2" />
                                            إنشاء الشهادة
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الشهادات</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{certificates.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">شهادات التقدير</CardTitle>
                        <Award className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {certificates.filter(c => c.type === 'appreciation').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">شهادات الشكر</CardTitle>
                        <Award className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {certificates.filter(c => c.type === 'thanks').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {certificates.filter(c => {
                                const date = new Date(c.created_at);
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
                        placeholder="بحث في الشهادات..."
                        className="pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="نوع الشهادة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(CERTIFICATE_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Certificates Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredCertificates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Award className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">لا توجد شهادات</h3>
                            <p className="text-muted-foreground mb-4">
                                ابدأ بإنشاء شهادة جديدة
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 ml-2" />
                                إنشاء شهادة جديدة
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المستلم</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>الجهة</TableHead>
                                    <TableHead>تاريخ الإصدار</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCertificates.map((certificate) => (
                                    <TableRow key={certificate.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{certificate.recipient_name}</div>
                                                {certificate.recipient_title && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {certificate.recipient_title}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(certificate.type)}</TableCell>
                                        <TableCell>{certificate.organization || '-'}</TableCell>
                                        <TableCell>
                                            {certificate.issue_date
                                                ? new Date(certificate.issue_date).toLocaleDateString('ar-SA')
                                                : new Date(certificate.created_at).toLocaleDateString('ar-SA')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/certificates/${certificate.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownloadCertificate(certificate.id)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteCertificate(certificate.id)}
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
