'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { AIConversation, AIMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Bot,
    Send,
    Plus,
    Trash2,
    MessageSquare,
    Sparkles,
    Loader2,
    User,
    Clock,
    ChevronLeft,
    Menu,
    X,
    Lightbulb,
    BookOpen,
    FileText,
    Calculator,
    Award,
    ClipboardList,
    Target,
    Trophy,
    BarChart3,
    Calendar,
    Copy,
    Check,
    Download,
    Wand2,
    GraduationCap,
    Users,
    FileQuestion,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Quick prompts for users
const QUICK_PROMPTS = [
    {
        icon: BookOpen,
        title: 'خطة درس',
        prompt: 'ساعدني في إعداد خطة درس لمادة الرياضيات للصف السادس الابتدائي',
        category: 'plans',
    },
    {
        icon: Calculator,
        title: 'تحليل نتائج',
        prompt: 'كيف أحلل نتائج اختبار الطلاب وأستخرج الطلاب المحتاجين لخطة علاجية؟',
        category: 'analysis',
    },
    {
        icon: ClipboardList,
        title: 'خطة علاجية',
        prompt: 'ساعدني في إعداد خطة علاجية لطالب يعاني من ضعف في القراءة',
        category: 'plans',
    },
    {
        icon: Award,
        title: 'نص شهادة',
        prompt: 'اكتب لي نص شهادة تقدير لطالب متفوق',
        category: 'certificates',
    },
    {
        icon: FileText,
        title: 'تقرير أداء',
        prompt: 'ساعدني في كتابة تقرير أداء وظيفي',
        category: 'reports',
    },
    {
        icon: Lightbulb,
        title: 'أفكار إبداعية',
        prompt: 'أعطني أفكاراً إبداعية لتحفيز الطلاب على التعلم',
        category: 'ideas',
    },
    {
        icon: Trophy,
        title: 'توثيق إنجاز',
        prompt: 'ساعدني في توثيق إنجاز تعليمي بشكل احترافي',
        category: 'achievements',
    },
    {
        icon: Calendar,
        title: 'توزيع المنهج',
        prompt: 'ساعدني في إعداد توزيع منهج دراسي للفصل الدراسي',
        category: 'plans',
    },
];

// AI Tools
const AI_TOOLS = [
    {
        id: 'therapeutic-plan',
        title: 'خطة علاجية',
        description: 'إنشاء خطة علاجية للطلاب',
        icon: Target,
        color: 'bg-red-500',
    },
    {
        id: 'enrichment-plan',
        title: 'خطة إثرائية',
        description: 'إنشاء خطة إثرائية للمتفوقين',
        icon: Sparkles,
        color: 'bg-purple-500',
    },
    {
        id: 'certificate-text',
        title: 'نص شهادة',
        description: 'إنشاء نص شهادة تقدير',
        icon: Award,
        color: 'bg-yellow-500',
    },
    {
        id: 'performance-report',
        title: 'تقرير أداء',
        description: 'إنشاء تقرير أداء وظيفي',
        icon: BarChart3,
        color: 'bg-blue-500',
    },
    {
        id: 'achievement-doc',
        title: 'توثيق إنجاز',
        description: 'توثيق إنجاز تعليمي',
        icon: Trophy,
        color: 'bg-green-500',
    },
    {
        id: 'curriculum',
        title: 'توزيع المنهج',
        description: 'إنشاء توزيع منهج دراسي',
        icon: Calendar,
        color: 'bg-cyan-500',
    },
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

export default function AIAssistantPage() {
    const [conversations, setConversations] = useState<AIConversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('chat');
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [toolDialogOpen, setToolDialogOpen] = useState(false);
    const [toolLoading, setToolLoading] = useState(false);
    const [toolResult, setToolResult] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Tool form states
    const [toolForm, setToolForm] = useState({
        student_name: '',
        subject: '',
        grade: '',
        weaknesses: '',
        strengths: '',
        interests: '',
        duration: '4 أسابيع',
        type: 'appreciation',
        recipient_name: '',
        reason: '',
        organization: '',
        user_name: '',
        period: '',
        achievements: '',
        activities: '',
        challenges: '',
        title: '',
        description: '',
        date: '',
        semester: 'الفصل الأول',
        weeks: 16,
        topics: '',
    });

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            const response = await api.getAIConversations();
            setConversations(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    };

    const loadConversation = async (id: string) => {
        try {
            const response = await api.getAIConversation(id);
            setCurrentConversation(response.data);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error loading conversation:', error);
            toast.error('حدث خطأ في تحميل المحادثة');
        }
    };

    const startNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
        setInputMessage('');
    };

    const sendMessage = async (messageText?: string) => {
        const text = messageText || inputMessage.trim();
        if (!text) return;

        const userMessage: AIMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            const response = await api.chatWithAI(
                text,
                currentConversation?.id
            );

            if (response.data) {
                const assistantMessage: AIMessage = {
                    role: 'assistant',
                    content: response.data.message || response.data.response,
                    timestamp: new Date().toISOString(),
                };

                setMessages(prev => [...prev, assistantMessage]);

                // Update current conversation if new
                if (!currentConversation && response.data.conversation_id) {
                    setCurrentConversation({
                        id: response.data.conversation_id,
                        user_id: '',
                        messages: [...messages, userMessage, assistantMessage],
                        tokens_used: response.data.tokens_used || 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                    fetchConversations();
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('حدث خطأ في إرسال الرسالة');
            // Remove the user message if failed
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    const deleteConversation = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟')) return;

        try {
            await api.deleteAIConversation(id);
            toast.success('تم حذف المحادثة بنجاح');
            if (currentConversation?.id === id) {
                startNewConversation();
            }
            fetchConversations();
        } catch (error) {
            console.error('Error deleting conversation:', error);
            toast.error('حدث خطأ في حذف المحادثة');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            toast.success('تم النسخ');
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (error) {
            toast.error('فشل النسخ');
        }
    };

    const openToolDialog = (toolId: string) => {
        setSelectedTool(toolId);
        setToolResult(null);
        setToolDialogOpen(true);
    };

    const executeAITool = async () => {
        if (!selectedTool) return;

        setToolLoading(true);
        setToolResult(null);

        try {
            let response;
            
            switch (selectedTool) {
                case 'therapeutic-plan':
                    response = await api.suggestPlan({
                        type: 'remedial',
                        subject: toolForm.subject,
                        grade: toolForm.grade,
                        students: [{ name: toolForm.student_name, weaknesses: toolForm.weaknesses }],
                        context: `نقاط الضعف: ${toolForm.weaknesses}، المدة: ${toolForm.duration}`,
                    });
                    setToolResult(response.data?.plan_content || JSON.stringify(response.data, null, 2));
                    break;

                case 'enrichment-plan':
                    response = await api.suggestPlan({
                        type: 'enrichment',
                        subject: toolForm.subject,
                        grade: toolForm.grade,
                        students: [{ name: toolForm.student_name, strengths: toolForm.strengths }],
                        context: `نقاط القوة: ${toolForm.strengths}، الاهتمامات: ${toolForm.interests}`,
                    });
                    setToolResult(response.data?.plan_content || JSON.stringify(response.data, null, 2));
                    break;

                case 'certificate-text':
                    response = await api.suggestCertificate({
                        type: toolForm.type,
                        recipient_name: toolForm.recipient_name,
                        reason: toolForm.reason,
                        organization: toolForm.organization,
                    });
                    setToolResult(response.data?.text || response.data);
                    break;

                case 'performance-report':
                    response = await api.generatePerformanceReport({
                        user_name: toolForm.user_name,
                        period: toolForm.period,
                        achievements: toolForm.achievements.split('\n').filter(Boolean),
                        activities: toolForm.activities.split('\n').filter(Boolean),
                        challenges: toolForm.challenges.split('\n').filter(Boolean),
                    });
                    setToolResult(response.data?.report || response.data);
                    break;

                case 'achievement-doc':
                    response = await api.generateAchievementDoc({
                        type: toolForm.type as 'daily' | 'weekly' | 'monthly' | 'semester',
                        title: toolForm.title,
                        description: toolForm.description,
                        date: toolForm.date || new Date().toISOString().split('T')[0],
                    });
                    setToolResult(response.data?.documentation || response.data);
                    break;

                case 'curriculum':
                    response = await api.generateCurriculum({
                        subject: toolForm.subject,
                        grade: toolForm.grade,
                        semester: toolForm.semester,
                        weeks: toolForm.weeks,
                        topics: toolForm.topics.split('\n').filter(Boolean),
                    });
                    setToolResult(typeof response.data?.distribution === 'object' 
                        ? JSON.stringify(response.data.distribution, null, 2) 
                        : response.data?.distribution || response.data);
                    break;

                default:
                    toast.error('أداة غير معروفة');
            }

            toast.success('تم إنشاء المحتوى بنجاح');
        } catch (error) {
            console.error('Error executing AI tool:', error);
            toast.error('حدث خطأ في تنفيذ الأداة');
        } finally {
            setToolLoading(false);
        }
    };

    const renderToolForm = () => {
        switch (selectedTool) {
            case 'therapeutic-plan':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم الطالب</Label>
                                <Input
                                    value={toolForm.student_name}
                                    onChange={(e) => setToolForm({ ...toolForm, student_name: e.target.value })}
                                    placeholder="أدخل اسم الطالب"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>المادة</Label>
                                <Select
                                    value={toolForm.subject}
                                    onValueChange={(value) => setToolForm({ ...toolForm, subject: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر المادة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBJECTS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الصف</Label>
                                <Select
                                    value={toolForm.grade}
                                    onValueChange={(value) => setToolForm({ ...toolForm, grade: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الصف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map((g) => (
                                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>مدة الخطة</Label>
                                <Select
                                    value={toolForm.duration}
                                    onValueChange={(value) => setToolForm({ ...toolForm, duration: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="أسبوعين">أسبوعين</SelectItem>
                                        <SelectItem value="4 أسابيع">4 أسابيع</SelectItem>
                                        <SelectItem value="6 أسابيع">6 أسابيع</SelectItem>
                                        <SelectItem value="8 أسابيع">8 أسابيع</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>نقاط الضعف</Label>
                            <Textarea
                                value={toolForm.weaknesses}
                                onChange={(e) => setToolForm({ ...toolForm, weaknesses: e.target.value })}
                                placeholder="اذكر نقاط الضعف التي يعاني منها الطالب..."
                                rows={3}
                            />
                        </div>
                    </div>
                );

            case 'enrichment-plan':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم الطالب</Label>
                                <Input
                                    value={toolForm.student_name}
                                    onChange={(e) => setToolForm({ ...toolForm, student_name: e.target.value })}
                                    placeholder="أدخل اسم الطالب"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>المادة</Label>
                                <Select
                                    value={toolForm.subject}
                                    onValueChange={(value) => setToolForm({ ...toolForm, subject: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر المادة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBJECTS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>نقاط القوة</Label>
                            <Textarea
                                value={toolForm.strengths}
                                onChange={(e) => setToolForm({ ...toolForm, strengths: e.target.value })}
                                placeholder="اذكر نقاط القوة لدى الطالب..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الاهتمامات</Label>
                            <Textarea
                                value={toolForm.interests}
                                onChange={(e) => setToolForm({ ...toolForm, interests: e.target.value })}
                                placeholder="اذكر اهتمامات الطالب..."
                                rows={2}
                            />
                        </div>
                    </div>
                );

            case 'certificate-text':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>نوع الشهادة</Label>
                                <Select
                                    value={toolForm.type}
                                    onValueChange={(value) => setToolForm({ ...toolForm, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="appreciation">تقدير</SelectItem>
                                        <SelectItem value="thanks">شكر</SelectItem>
                                        <SelectItem value="graduation">تخرج</SelectItem>
                                        <SelectItem value="participation">مشاركة</SelectItem>
                                        <SelectItem value="achievement">إنجاز</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>اسم المستلم</Label>
                                <Input
                                    value={toolForm.recipient_name}
                                    onChange={(e) => setToolForm({ ...toolForm, recipient_name: e.target.value })}
                                    placeholder="أدخل اسم المستلم"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>سبب التكريم</Label>
                            <Input
                                value={toolForm.reason}
                                onChange={(e) => setToolForm({ ...toolForm, reason: e.target.value })}
                                placeholder="مثال: التفوق الدراسي"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الجهة المانحة</Label>
                            <Input
                                value={toolForm.organization}
                                onChange={(e) => setToolForm({ ...toolForm, organization: e.target.value })}
                                placeholder="مثال: مدرسة الأمل الابتدائية"
                            />
                        </div>
                    </div>
                );

            case 'performance-report':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم المستخدم</Label>
                                <Input
                                    value={toolForm.user_name}
                                    onChange={(e) => setToolForm({ ...toolForm, user_name: e.target.value })}
                                    placeholder="أدخل اسم المستخدم"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>الفترة</Label>
                                <Input
                                    value={toolForm.period}
                                    onChange={(e) => setToolForm({ ...toolForm, period: e.target.value })}
                                    placeholder="مثال: الفصل الدراسي الأول"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>الإنجازات (كل إنجاز في سطر)</Label>
                            <Textarea
                                value={toolForm.achievements}
                                onChange={(e) => setToolForm({ ...toolForm, achievements: e.target.value })}
                                placeholder="اذكر الإنجازات..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الأنشطة (كل نشاط في سطر)</Label>
                            <Textarea
                                value={toolForm.activities}
                                onChange={(e) => setToolForm({ ...toolForm, activities: e.target.value })}
                                placeholder="اذكر الأنشطة..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>التحديات (كل تحدي في سطر)</Label>
                            <Textarea
                                value={toolForm.challenges}
                                onChange={(e) => setToolForm({ ...toolForm, challenges: e.target.value })}
                                placeholder="اذكر التحديات..."
                                rows={2}
                            />
                        </div>
                    </div>
                );

            case 'achievement-doc':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>نوع الإنجاز</Label>
                                <Select
                                    value={toolForm.type}
                                    onValueChange={(value) => setToolForm({ ...toolForm, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">يومي</SelectItem>
                                        <SelectItem value="weekly">أسبوعي</SelectItem>
                                        <SelectItem value="monthly">شهري</SelectItem>
                                        <SelectItem value="semester">فصلي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>التاريخ</Label>
                                <Input
                                    type="date"
                                    value={toolForm.date}
                                    onChange={(e) => setToolForm({ ...toolForm, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>عنوان الإنجاز</Label>
                            <Input
                                value={toolForm.title}
                                onChange={(e) => setToolForm({ ...toolForm, title: e.target.value })}
                                placeholder="أدخل عنوان الإنجاز"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>وصف الإنجاز</Label>
                            <Textarea
                                value={toolForm.description}
                                onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                                placeholder="صف الإنجاز بالتفصيل..."
                                rows={4}
                            />
                        </div>
                    </div>
                );

            case 'curriculum':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>المادة</Label>
                                <Select
                                    value={toolForm.subject}
                                    onValueChange={(value) => setToolForm({ ...toolForm, subject: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر المادة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBJECTS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>الصف</Label>
                                <Select
                                    value={toolForm.grade}
                                    onValueChange={(value) => setToolForm({ ...toolForm, grade: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الصف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map((g) => (
                                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الفصل الدراسي</Label>
                                <Select
                                    value={toolForm.semester}
                                    onValueChange={(value) => setToolForm({ ...toolForm, semester: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="الفصل الأول">الفصل الأول</SelectItem>
                                        <SelectItem value="الفصل الثاني">الفصل الثاني</SelectItem>
                                        <SelectItem value="الفصل الثالث">الفصل الثالث</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>عدد الأسابيع</Label>
                                <Input
                                    type="number"
                                    value={toolForm.weeks}
                                    onChange={(e) => setToolForm({ ...toolForm, weeks: parseInt(e.target.value) })}
                                    min={1}
                                    max={52}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>الموضوعات (كل موضوع في سطر)</Label>
                            <Textarea
                                value={toolForm.topics}
                                onChange={(e) => setToolForm({ ...toolForm, topics: e.target.value })}
                                placeholder="اذكر موضوعات المنهج..."
                                rows={4}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar */}
            <div
                className={cn(
                    'bg-muted/30 border-l transition-all duration-300 flex flex-col',
                    isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
                )}
            >
                <div className="p-4 border-b">
                    <Button
                        onClick={startNewConversation}
                        className="w-full gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        محادثة جديدة
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {loadingConversations ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                لا توجد محادثات سابقة
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={cn(
                                        'group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors',
                                        currentConversation?.id === conv.id && 'bg-muted'
                                    )}
                                    onClick={() => loadConversation(conv.id)}
                                >
                                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {conv.title || 'محادثة جديدة'}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(conv.created_at).toLocaleDateString('ar-SA')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conv.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold">المساعد الذكي</h2>
                                <p className="text-xs text-muted-foreground">مساعدك الشخصي للمهام التعليمية</p>
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="chat" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                المحادثة
                            </TabsTrigger>
                            <TabsTrigger value="tools" className="gap-2">
                                <Wand2 className="h-4 w-4" />
                                الأدوات
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {activeTab === 'chat' ? (
                    <>
                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <div className="text-center mb-8">
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                                            <Sparkles className="h-10 w-10 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">مرحباً بك في المساعد الذكي</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            أنا هنا لمساعدتك في إعداد الخطط والتقارير والشهادات وتحليل النتائج. اختر من الاقتراحات أدناه أو اكتب سؤالك.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl">
                                        {QUICK_PROMPTS.map((prompt, index) => (
                                            <Card
                                                key={index}
                                                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                                                onClick={() => sendMessage(prompt.prompt)}
                                            >
                                                <CardContent className="p-4 flex flex-col items-center text-center">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                                        <prompt.icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <p className="text-sm font-medium">{prompt.title}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                'flex gap-3',
                                                message.role === 'user' ? 'flex-row-reverse' : ''
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                                                    message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                                )}
                                            >
                                                {message.role === 'user' ? (
                                                    <User className="h-4 w-4" />
                                                ) : (
                                                    <Bot className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    'flex-1 max-w-[80%]',
                                                    message.role === 'user' ? 'text-left' : ''
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        'rounded-2xl p-4',
                                                        message.role === 'user'
                                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                            : 'bg-muted rounded-tl-sm'
                                                    )}
                                                >
                                                    {message.role === 'assistant' ? (
                                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                                    )}
                                                </div>
                                                {message.role === 'assistant' && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => copyToClipboard(message.content, index)}
                                                        >
                                                            {copiedIndex === index ? (
                                                                <Check className="h-3 w-3 ml-1" />
                                                            ) : (
                                                                <Copy className="h-3 w-3 ml-1" />
                                                            )}
                                                            نسخ
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="bg-muted rounded-2xl rounded-tl-sm p-4">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span className="text-sm text-muted-foreground">جاري الكتابة...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t">
                            <div className="max-w-4xl mx-auto flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="اكتب رسالتك هنا..."
                                    disabled={loading}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => sendMessage()}
                                    disabled={!inputMessage.trim() || loading}
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Tools Tab */
                    <ScrollArea className="flex-1 p-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold mb-2">أدوات الذكاء الاصطناعي</h3>
                                <p className="text-muted-foreground">
                                    استخدم هذه الأدوات لإنشاء محتوى تعليمي احترافي بسرعة
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {AI_TOOLS.map((tool) => (
                                    <Card
                                        key={tool.id}
                                        className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                                        onClick={() => openToolDialog(tool.id)}
                                    >
                                        <CardContent className="p-6">
                                            <div className={`h-12 w-12 rounded-xl ${tool.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                                <tool.icon className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-bold mb-1">{tool.title}</h4>
                                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Tool Dialog */}
            <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-primary" />
                            {AI_TOOLS.find(t => t.id === selectedTool)?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {AI_TOOLS.find(t => t.id === selectedTool)?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {!toolResult ? (
                        <>
                            {renderToolForm()}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setToolDialogOpen(false)}>
                                    إلغاء
                                </Button>
                                <Button onClick={executeAITool} disabled={toolLoading}>
                                    {toolLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                            جاري الإنشاء...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 ml-2" />
                                            إنشاء
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{toolResult}</ReactMarkdown>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setToolResult(null)}>
                                    تعديل
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => copyToClipboard(toolResult, -1)}
                                >
                                    <Copy className="h-4 w-4 ml-2" />
                                    نسخ
                                </Button>
                                <Button onClick={() => setToolDialogOpen(false)}>
                                    إغلاق
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
