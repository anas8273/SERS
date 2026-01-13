'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomRequest {
  id: number;
  title: string;
  description: string;
  category: {
    id: number;
    name_ar: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  votes_count: number;
  user_voted: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
  admin_response?: string;
}

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
}

const statusConfig = {
  pending: { label: 'قيد المراجعة', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'تمت الموافقة', color: 'bg-blue-500', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-500', icon: XCircle },
  completed: { label: 'مكتمل', color: 'bg-green-500', icon: CheckCircle },
};

export default function CustomRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [myRequests, setMyRequests] = useState<CustomRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New request form
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, myRequestsRes, categoriesRes] = await Promise.all([
        api.get('/custom-requests'),
        api.get('/custom-requests/my'),
        api.get('/categories'),
      ]);
      
      setRequests(requestsRes.data.data || []);
      setMyRequests(myRequestsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim() || !newRequest.category_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/custom-requests', newRequest);
      toast.success('تم إرسال طلبك بنجاح');
      setShowNewDialog(false);
      setNewRequest({ title: '', description: '', category_id: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId: number) => {
    try {
      await api.post(`/custom-requests/${requestId}/vote`);
      
      // Update local state
      setRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            votes_count: r.user_voted ? r.votes_count - 1 : r.votes_count + 1,
            user_voted: !r.user_voted,
          };
        }
        return r;
      }));
      
      toast.success('تم تسجيل تصويتك');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const RequestCard = ({ request, showVote = true }: { request: CustomRequest; showVote?: boolean }) => {
    const StatusIcon = statusConfig[request.status].icon;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{request.category?.name_ar}</Badge>
                <Badge className={statusConfig[request.status].color}>
                  <StatusIcon className="w-3 h-3 ml-1" />
                  {statusConfig[request.status].label}
                </Badge>
              </div>
            </div>
            {showVote && (
              <Button
                variant={request.user_voted ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote(request.id)}
                className="flex items-center gap-1"
              >
                <ThumbsUp className={`w-4 h-4 ${request.user_voted ? 'fill-current' : ''}`} />
                <span>{request.votes_count}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
            {request.description}
          </p>
          
          {request.admin_response && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                رد الإدارة:
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {request.admin_response}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 text-xs text-gray-500">
          <span>بواسطة {request.user?.name}</span>
          <span className="mx-2">•</span>
          <span>{new Date(request.created_at).toLocaleDateString('ar-SA')}</span>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">الطلبات الخاصة</h1>
          <p className="text-gray-500 mt-1">
            اقترح قوالب جديدة أو صوّت على اقتراحات الآخرين
          </p>
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              طلب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>طلب قالب جديد</DialogTitle>
              <DialogDescription>
                صف القالب الذي تحتاجه وسنعمل على توفيره
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الطلب *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: قالب تقرير نشاط رياضي"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">التصنيف *</Label>
                <Select
                  value={newRequest.category_id}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">وصف الطلب *</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="صف بالتفصيل ما تحتاجه في هذا القالب..."
                  rows={5}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                إرسال الطلب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            جميع الطلبات
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            طلباتي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500 mb-4">كن أول من يقترح قالباً جديداً!</p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                طلب جديد
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لم تقدم أي طلبات بعد</h3>
              <p className="text-gray-500 mb-4">اقترح قالباً جديداً وسنعمل على توفيره</p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                طلب جديد
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map((request) => (
                <RequestCard key={request.id} request={request} showVote={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
