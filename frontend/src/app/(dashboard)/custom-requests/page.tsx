'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { TopNavBar } from '@/components/layout/TopNavBar';
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
}



export default function CustomRequestsPage() {
  const { user } = useAuth();
  const { t, locale, dir } = useTranslation();
  const isEn = locale === 'en';
  const statusConfig = {
    pending: { label: isEn ? 'Under Review' : 'قيد المراجعة', color: 'bg-yellow-500', icon: Clock },
    approved: { label: isEn ? 'Approved' : 'تمت الموافقة', color: 'bg-blue-500', icon: CheckCircle },
    rejected: { label: isEn ? 'Rejected' : 'مرفوض', color: 'bg-red-500', icon: XCircle },
    completed: { label: isEn ? 'Completed' : 'مكتمل', color: 'bg-green-500', icon: CheckCircle },
  };
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
      const [requestsRes, myRequestsRes, categoriesRes] = await Promise.allSettled([
        api.get('/custom-requests'),
        api.get('/custom-requests/my-requests'),
        api.get('/categories'),
      ]);
      
      setRequests(requestsRes.status === 'fulfilled' ? ((requestsRes.value as any)?.data?.data || (requestsRes.value as any)?.data || []) : []);
      setMyRequests(myRequestsRes.status === 'fulfilled' ? ((myRequestsRes.value as any)?.data?.data || (myRequestsRes.value as any)?.data || []) : []);
      setCategories(categoriesRes.status === 'fulfilled' ? ((categoriesRes.value as any)?.data?.data || (categoriesRes.value as any)?.data || []) : []);
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim() || !newRequest.category_id) {
      toast.error(t('toast.customRequest.fieldsRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/custom-requests', newRequest);
      toast.success(t('toast.customRequest.sent'));
      setShowNewDialog(false);
      setNewRequest({ title: '', description: '', category_id: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('toast.error'));
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
      
      toast.success(t('toast.customRequest.voted'));
    } catch (error) {
      toast.error(t('toast.error'));
    }
  };

  const RequestCard = ({ request, showVote = true }: { request: CustomRequest; showVote?: boolean }) => {
    const StatusIcon = statusConfig[request.status].icon;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div dir={dir} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{request.category?.name_ar}</Badge>
                <Badge className={statusConfig[request.status].color}>
                  <StatusIcon className="w-3 h-3 ms-1" />
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
                {isEn ? 'Admin Response:' : ta('رد الإدارة:', 'Admin Reply:') }
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {request.admin_response}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 text-xs text-gray-500">
          <span>{isEn ? 'By' : ta('بواسطة', 'By') } {request.user?.name}</span>
          <span className="mx-2">•</span>
          <span>{new Date(request.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA')}</span>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
    <TopNavBar title={isEn ? 'Custom Requests' : '\u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062e\u0627\u0635\u0629'} />
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{isEn ? 'Custom Requests' : ta('الطلبات الخاصة', 'Custom Requests') }</h1>
          <p className="text-gray-500 mt-1">
            {isEn ? "Suggest new templates or vote on others' suggestions" : ta('اقترح قوالب جديدة أو صوّت على اقتراحات الآخرين', "Suggest new templates or vote on others' suggestions") }
          </p>
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ms-2" />
              {isEn ? 'New Request' : ta('طلب جديد', 'New Request') }
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEn ? 'Request a New Template' : ta('طلب قالب جديد', 'Request New Template') }</DialogTitle>
              <DialogDescription>
                {isEn ? 'Describe the template you need and we will work on it' : ta('صف القالب الذي تحتاجه وسنعمل على توفيره', 'Describe the template you need and we will work to provide it') }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{isEn ? 'Request Title' : ta('عنوان الطلب', 'Request Title') } *</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={isEn ? 'e.g. Sports activity report template' : ta('مثال: قالب تقرير نشاط رياضي', 'Example: Sports activity report template') }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">{isEn ? 'Category' : ta('التصنيف', 'Classification') } *</Label>
                <Select
                  value={newRequest.category_id}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isEn ? 'Select category' : ta('اختر التصنيف', 'Select Category') } />
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
                <Label htmlFor="description">{isEn ? 'Description' : ta('وصف الطلب', 'Request Description') } *</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={isEn ? 'Describe in detail what you need in this template...' : ta('صف بالتفصيل ما تحتاجه في هذا القالب...', 'Describe in detail what you need in this template...') }
                  rows={5}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                                {isEn ? 'Cancel' : ta('إلغاء', 'Cancel') }
              </Button>
              <Button onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ms-2" />
                )}
                                {isEn ? 'Submit Request' : ta('إرسال الطلب', 'Submit Request') }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
                        {isEn ? 'All Requests' : ta('جميع الطلبات', 'All Requests') }
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
                        {isEn ? 'My Requests' : ta('طلباتي', 'My Orders') }
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
              <h3 className="text-xl font-semibold mb-2">{isEn ? 'No requests yet' : ta('لا توجد طلبات', 'No Orders') }</h3>
              <p className="text-gray-500 mb-4">{isEn ? 'Be the first to suggest a new template!' : ta('كن أول من يقترح قالباً جديداً!', 'Be the first to suggest a new template!') }</p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="w-4 h-4 ms-2" />
                {isEn ? 'New Request' : ta('طلب جديد', 'New Request') }
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
              <h3 className="text-xl font-semibold mb-2">{isEn ? 'No requests submitted yet' : ta('لم تقدم أي طلبات بعد', 'You have not submitted any requests yet') }</h3>
              <p className="text-gray-500 mb-4">{isEn ? 'Suggest a new template and we will work on it' : ta('اقترح قالباً جديداً وسنعمل على توفيره', 'Suggest a new template and we will work to provide it') }</p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="w-4 h-4 ms-2" />
                {isEn ? 'New Request' : ta('طلب جديد', 'New Request') }
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
    </>
  );
}
