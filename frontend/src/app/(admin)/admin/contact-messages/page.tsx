'use client';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ta } from '@/i18n/auto-translations';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Mail, Trash2, CheckCircle, Clock, Search, RefreshCw, User, Calendar, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/useTranslation';

interface ContactMessage {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedResponse {
    data: ContactMessage[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminContactMessagesPage() {
  const { dir } = useTranslation();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchMessages = async (currentPage = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/contact-messages', {
                params: { page: currentPage, search: search || undefined }
            }) as any;

            if (res?.success && res.data) {
                const paginated = res.data as PaginatedResponse;
                setMessages(paginated.data ?? []);
                setTotal(paginated.total ?? 0);
                setLastPage(paginated.last_page ?? 1);
                setPage(paginated.current_page ?? 1);
            }
        } catch {
            toast.error(ta('فشل تحميل الرسائل', 'Failed to load messages'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages(1);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMessages(1);
    };

    const handleMarkRead = async (msg: ContactMessage) => {
        if (msg.is_read) return;
        try {
            await api.put(`/admin/contact-messages/${msg.id}/read`, {});
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
            if (selectedMessage?.id === msg.id) {
                setSelectedMessage({ ...msg, is_read: true });
            }
            toast.success(ta('تم وضع علامة مقروء', 'Marked as read'));
        } catch {
            toast.error(ta('فشل تحديث الحالة', 'Failed to update status'));
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
        try {
            await api.delete(`/admin/contact-messages/${id}`);
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selectedMessage?.id === id) setSelectedMessage(null);
            toast.success(ta('تم حذف الرسالة', 'Message deleted'));
        } catch {
            toast.error(ta('فشل الحذف', 'Delete failed'));
        }
    };

    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <div dir={dir} className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Mail className="w-7 h-7 text-primary" />
                        رسائل التواصل
                        {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs font-bold">
                                {unreadCount} غير مقروءة
                            </Badge>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">إجمالي {total} رسالة</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchMessages(page)} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {ta('تحديث', 'Update')}
                </Button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={ta('بحث بالاسم أو البريد...', 'Search by name or email...')}
                        className="pr-10 text-start"
                    />
                </div>
                <Button type="submit">{ta('بحث', 'Search')}</Button>
            </form>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Messages List */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="border-b pb-3">
                        <CardTitle className="text-base font-bold">{ta('قائمة الرسائل', 'Message List')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                                {ta('جاري التحميل...', 'Loading...')}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>{ta('لا توجد رسائل', 'No messages')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {messages.map(msg => (
                                    <button
                                        key={msg.id}
                                        onClick={() => { setSelectedMessage(msg); handleMarkRead(msg); }}
                                        className={`w-full text-start p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedMessage?.id === msg.id ? 'bg-primary/5 border-r-2 border-primary' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {!msg.is_read && (
                                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                    )}
                                                    <p className={`font-bold text-sm truncate ${!msg.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {msg.name}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{msg.email}</p>
                                                {msg.subject && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{msg.subject}</p>
                                                )}
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end gap-1">
                                                <Badge variant={msg.is_read ? 'secondary' : 'default'} className="text-[10px]">
                                                    {msg.is_read ? ta('مقروءة', 'Read') : ta('جديدة', 'New') }
                                                </Badge>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(msg.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {lastPage > 1 && (
                            <div className="p-3 border-t flex items-center justify-between">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => fetchMessages(page - 1)}
                                    disabled={page === 1}
                                >{ta('السابق', 'Previous')}</Button>
                                <span className="text-sm text-gray-500">{page} / {lastPage}</span>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => fetchMessages(page + 1)}
                                    disabled={page === lastPage}
                                >{ta('التالي', 'Next')}</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Message Detail */}
                <Card className="lg:col-span-3">
                    {selectedMessage ? (
                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                                        {selectedMessage.subject || 'بدون موضوع'}
                                    </h2>
                                    <Badge variant={selectedMessage.is_read ? 'secondary' : 'default'}>
                                        {selectedMessage.is_read ? <><CheckCircle className="w-3 h-3 ms-1" />{ta('مقروءة', 'Read')}</> : <><Clock className="w-3 h-3 ms-1" />{ta('جديدة', 'New')}</>}
                                    </Badge>
                                </div>
                                <Button
                                    variant="destructive" size="sm"
                                    onClick={() => setDeleteConfirmId(String(selectedMessage.id))}
                                    className="gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {ta('حذف', 'Delete')}
                                </Button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">{ta('المرسل', 'Sender')}</p>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedMessage.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">{ta('البريد الإلكتروني', 'Email')}</p>
                                        <a href={`mailto:${selectedMessage.email}`} className="font-bold text-sm text-primary hover:underline">
                                            {selectedMessage.email}
                                        </a>
                                    </div>
                                </div>
                                {selectedMessage.phone && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400">{ta('الهاتف', 'Phone')}</p>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedMessage.phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">{ta('تاريخ الإرسال', 'Sent Date')}</p>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                                            {new Date(selectedMessage.created_at).toLocaleDateString('ar-SA', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                <p className="text-xs text-gray-400 mb-2 font-medium">{ta('الرسالة', 'Message')}</p>
                                <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </p>
                            </div>

                            <a href={`mailto:${selectedMessage.email}?subject=رد: ${selectedMessage.subject || 'رسالتك'}`}>
                                <Button className="w-full gap-2 rounded-xl">
                                    <Mail className="w-4 h-4" />
                                    {ta('الرد عبر البريد الإلكتروني', 'Reply via Email')}
                                </Button>
                            </a>
                        </CardContent>
                    ) : (
                        <CardContent className="flex flex-col items-center justify-center h-80 text-center text-gray-400">
                            <Mail className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium">{ta('اختر رسالة من القائمة لعرضها', 'Select a message from the list to view')}</p>
                        </CardContent>
                    )}
                </Card>
            </div>
        
            <ConfirmDialog
                open={!!deleteConfirmId}
                title={ta('تأكيد الحذف', 'Confirm Delete')}
                message={ta('هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to permanently delete this item? This action cannot be undone.')}
                confirmLabel={ta('حذف نهائياً', 'Delete Permanently')}
                onConfirm={() => {
                    if (deleteConfirmId) handleDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                }}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
}
