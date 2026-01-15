'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  MessageSquare,
  ThumbsUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Filter,
  MoreVertical,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomRequest {
  id: number;
  title: string;
  description: string;
  category_suggestion: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
  admin_notes: string;
  ai_analysis: string;
  priority_score: number;
  votes_count: number;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

const statusConfig = {
  pending: { label: 'قيد الانتظار', color: 'bg-gray-500', icon: Clock },
  under_review: { label: 'قيد المراجعة', color: 'bg-blue-500', icon: AlertCircle },
  approved: { label: 'موافق عليه', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-500', icon: XCircle },
  implemented: { label: 'تم التنفيذ', color: 'bg-purple-500', icon: CheckCircle },
};

export default function AdminCustomRequestsPage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/admin/custom-requests', { params });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/admin/custom-requests/${id}/status`, {
        status,
        admin_notes: adminNotes,
      });
      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, status: status as any, admin_notes: adminNotes } : r))
      );
      toast.success('تم تحديث حالة الطلب');
      setShowDetailsDialog(false);
    } catch (error) {
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzingAI(true);
    try {
      const response = await api.post('/admin/custom-requests/ai-summary');
      setAiSummary(response.data.data.summary);
    } catch (error) {
      toast.error('حدث خطأ في تحليل الطلبات');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleViewDetails = (request: CustomRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setShowDetailsDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRequests = requests.filter(r =>
    r.title.includes(searchQuery) ||
    r.description.includes(searchQuery) ||
    r.user.name.includes(searchQuery)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات الخاصة</h1>
          <p className="text-gray-500 mt-1">
            مراجعة طلبات المستخدمين للقوالب الجديدة
          </p>
        </div>

        <Button onClick={handleAnalyzeWithAI} disabled={analyzingAI}>
          <Sparkles className="w-4 h-4 ml-2" />
          {analyzingAI ? 'جاري التحليل...' : 'تحليل بالذكاء الاصطناعي'}
        </Button>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <Card className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              ملخص الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{aiSummary}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setAiSummary(null)}
            >
              إغلاق
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="ابحث في الطلبات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="فلترة حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="under_review">قيد المراجعة</SelectItem>
            <SelectItem value="approved">موافق عليه</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="implemented">تم التنفيذ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = requests.filter(r => r.status === status).length;
          const Icon = config.icon;
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter(status)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">لا توجد طلبات</h3>
          <p className="text-gray-500">لم يتم العثور على طلبات مطابقة</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>التصنيف المقترح</TableHead>
                <TableHead className="text-center">التصويتات</TableHead>
                <TableHead className="text-center">الأولوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const config = statusConfig[request.status];
                const Icon = config.icon;

                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <p className="font-medium line-clamp-1">{request.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {request.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-xs text-gray-500">{request.user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.category_suggestion || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-gray-400" />
                        <span>{request.votes_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={request.priority_score >= 7 ? 'destructive' : 'secondary'}
                      >
                        {request.priority_score}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={config.color}>
                        <Icon className="w-3 h-3 ml-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'under_review')}>
                            قيد المراجعة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'approved')}>
                            موافقة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'rejected')}>
                            رفض
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'implemented')}>
                            تم التنفيذ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">العنوان</Label>
                <p className="font-medium">{selectedRequest.title}</p>
              </div>

              <div>
                <Label className="text-gray-500">الوصف</Label>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">المستخدم</Label>
                  <p>{selectedRequest.user.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">التصنيف المقترح</Label>
                  <p>{selectedRequest.category_suggestion || '-'}</p>
                </div>
              </div>

              {selectedRequest.ai_analysis && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    تحليل الذكاء الاصطناعي
                  </Label>
                  <p className="text-sm mt-1">{selectedRequest.ai_analysis}</p>
                </div>
              )}

              <div>
                <Label htmlFor="admin_notes">ملاحظات الإدارة</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظاتك هنا..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleUpdateStatus(selectedRequest.id, 'rejected')}
            >
              رفض
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => selectedRequest && handleUpdateStatus(selectedRequest.id, 'approved')}
            >
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
