'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ClipboardList, Plus, Search, FileDown, Trash2, Eye, Sparkles,
  Calendar, CheckCircle2, Loader2, Brain, Edit, BookOpen,
  FileText, Download, Users, Clock, Filter, BarChart3,
  AlertTriangle, ThumbsUp, ThumbsDown, MessageSquare,
  UserCheck, UserX, Star, TrendingUp, Shield, Bell,
} from 'lucide-react';

// ===== أنواع السجلات =====
const LOG_TYPES = {
  visit: { label: 'زيارة صفية', icon: Eye, color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  observation: { label: 'ملاحظة', icon: MessageSquare, color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-500 to-purple-600' },
  behavior: { label: 'تقييم سلوك', icon: Shield, color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-amber-600' },
  attendance: { label: 'حضور وغياب', icon: UserCheck, color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600' },
  recommendation: { label: 'توصية', icon: Sparkles, color: 'bg-teal-100 text-teal-700', gradient: 'from-teal-500 to-teal-600' },
  incident: { label: 'حادثة', icon: AlertTriangle, color: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600' },
};

interface LogEntry {
  id: string;
  type: keyof typeof LOG_TYPES;
  title: string;
  description: string;
  date: string;
  time: string;
  studentName?: string;
  className: string;
  subject: string;
  rating?: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  followUpDate?: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
}

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

const STATUS_MAP = {
  open: { label: 'مفتوح', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'قيد المتابعة', color: 'bg-amber-100 text-amber-700' },
  closed: { label: 'مغلق', color: 'bg-emerald-100 text-emerald-700' },
};

const PRIORITY_MAP = {
  low: { label: 'منخفض', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'متوسط', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'عالي', color: 'bg-red-100 text-red-700' },
};

const SAMPLE_LOGS: LogEntry[] = [
  {
    id: '1', type: 'visit', title: 'زيارة صفية - الرياضيات 3م',
    description: 'زيارة صفية لمتابعة تطبيق استراتيجية التعلم التعاوني في حصة الرياضيات.',
    date: '2026-02-22', time: '09:30', className: '3/أ', subject: 'الرياضيات',
    rating: 4, strengths: ['إدارة الوقت', 'تفاعل الطلاب', 'تنويع الأنشطة'],
    improvements: ['تفعيل التقنية أكثر'], recommendations: ['استخدام السبورة التفاعلية'],
    status: 'closed', priority: 'medium',
  },
  {
    id: '2', type: 'behavior', title: 'تقييم سلوك - أحمد خالد',
    description: 'ملاحظة سلوك الطالب أحمد خالد خلال الأسبوع الماضي. تحسن ملحوظ في الانضباط.',
    date: '2026-02-21', time: '11:00', studentName: 'أحمد خالد', className: '2/ب', subject: 'عام',
    rating: 3, strengths: ['تحسن الانضباط'], improvements: ['المشاركة في الحصة'],
    recommendations: ['تعزيز إيجابي مستمر'], followUpDate: '2026-03-01',
    status: 'in_progress', priority: 'high',
  },
  {
    id: '3', type: 'observation', title: 'ملاحظة - أداء الفصل 1/أ',
    description: 'ملاحظة عامة حول مستوى أداء طلاب الفصل 1/أ في مادة الرياضيات.',
    date: '2026-02-20', time: '08:00', className: '1/أ', subject: 'الرياضيات',
    strengths: ['مستوى جيد عموماً'], improvements: ['حل الواجبات', 'المشاركة الصفية'],
    recommendations: ['تكثيف الأنشطة التفاعلية'], status: 'open', priority: 'low',
  },
  {
    id: '4', type: 'recommendation', title: 'توصية - تطوير المنهج',
    description: 'توصية بإضافة أنشطة تطبيقية عملية في وحدة الهندسة للصف الثالث.',
    date: '2026-02-18', time: '14:00', className: '3/ب', subject: 'الرياضيات',
    strengths: [], improvements: [], recommendations: ['إضافة أنشطة عملية', 'ربط بالحياة اليومية'],
    status: 'open', priority: 'medium',
  },
];

const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', date: '2026-02-22', className: '3/أ', totalStudents: 30, present: 28, absent: 1, late: 1, excused: 0 },
  { id: '2', date: '2026-02-22', className: '2/ب', totalStudents: 28, present: 25, absent: 2, late: 0, excused: 1 },
  { id: '3', date: '2026-02-22', className: '1/أ', totalStudents: 32, present: 30, absent: 1, late: 1, excused: 0 },
  { id: '4', date: '2026-02-21', className: '3/أ', totalStudents: 30, present: 27, absent: 2, late: 1, excused: 0 },
];

export default function FollowUpLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SAMPLE_ATTENDANCE);
  const [activeTab, setActiveTab] = useState<'logs' | 'attendance' | 'stats'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  const [newLog, setNewLog] = useState({
    type: 'visit' as keyof typeof LOG_TYPES, title: '', description: '',
    className: '', subject: '', studentName: '', priority: 'medium' as 'low' | 'medium' | 'high',
    strengths: '', improvements: '', recommendations: '',
  });

  const stats = useMemo(() => ({
    totalLogs: logs.length,
    openLogs: logs.filter(l => l.status === 'open').length,
    highPriority: logs.filter(l => l.priority === 'high').length,
    avgAttendance: attendance.length > 0
      ? Math.round(attendance.reduce((sum, a) => sum + (a.present / a.totalStudents * 100), 0) / attendance.length)
      : 0,
  }), [logs, attendance]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = l.title.includes(searchQuery) || l.description.includes(searchQuery);
      const matchType = filterType === 'all' || l.type === filterType;
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [logs, searchQuery, filterType, filterStatus]);

  const handleCreateLog = () => {
    if (!newLog.title) { toast.error('يرجى إدخال العنوان'); return; }
    const log: LogEntry = {
      id: Date.now().toString(), type: newLog.type, title: newLog.title,
      description: newLog.description, date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5), className: newLog.className,
      subject: newLog.subject, studentName: newLog.studentName || undefined,
      priority: newLog.priority,
      strengths: newLog.strengths.split('\n').filter(s => s.trim()),
      improvements: newLog.improvements.split('\n').filter(i => i.trim()),
      recommendations: newLog.recommendations.split('\n').filter(r => r.trim()),
      status: 'open',
    };
    setLogs(prev => [log, ...prev]);
    setIsCreateDialogOpen(false);
    setNewLog({ type: 'visit', title: '', description: '', className: '', subject: '', studentName: '', priority: 'medium', strengths: '', improvements: '', recommendations: '' });
    toast.success('تم إضافة السجل بنجاح');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white">
                <ClipboardList className="w-7 h-7" />
              </div>
              سجل المتابعة والإدارة الصفية
            </h1>
            <p className="text-gray-500 mt-2">زيارات صفية، ملاحظات، تقييم سلوك، حضور وغياب، توصيات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><FileDown className="w-4 h-4 ml-2" /> تصدير</Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600">
              <Plus className="w-4 h-4 ml-2" /> سجل جديد
            </Button>
          </div>
        </div>

        {/* ===== التبويبات ===== */}
        <div className="flex gap-2 mb-6 border-b pb-3">
          {[
            { id: 'logs' as const, label: 'السجلات', icon: ClipboardList },
            { id: 'attendance' as const, label: 'الحضور والغياب', icon: UserCheck },
            { id: 'stats' as const, label: 'الإحصائيات', icon: BarChart3 },
          ].map(tab => (
            <Button key={tab.id} variant={activeTab === tab.id ? 'default' : 'ghost'} size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-purple-600 hover:bg-purple-700' : ''}>
              <tab.icon className="w-4 h-4 ml-2" /> {tab.label}
            </Button>
          ))}
        </div>

        {/* ===== الإحصائيات ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: ClipboardList, label: 'إجمالي السجلات', value: stats.totalLogs, color: '#8b5cf6' },
            { icon: Bell, label: 'مفتوحة', value: stats.openLogs, color: '#3b82f6' },
            { icon: AlertTriangle, label: 'أولوية عالية', value: stats.highPriority, color: '#ef4444' },
            { icon: UserCheck, label: 'نسبة الحضور', value: `${stats.avgAttendance}%`, color: '#10b981' },
          ].map((s, i) => (
            <Card key={i} className="border-t-4" style={{ borderTopColor: s.color }}>
              <CardContent className="p-3 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }} />
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ===== تبويب السجلات ===== */}
        {activeTab === 'logs' && (
          <>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40"><SelectValue placeholder="النوع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(LOG_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(STATUS_MAP).map(([key, s]) => (
                    <SelectItem key={key} value={key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredLogs.map(log => {
                const typeInfo = LOG_TYPES[log.type];
                const TypeIcon = typeInfo.icon;
                const statusInfo = STATUS_MAP[log.status];
                const priorityInfo = PRIORITY_MAP[log.priority];
                return (
                  <Card key={log.id} className="shadow-md border-0 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{log.title}</h3>
                            <Badge className={statusInfo.color + ' text-xs'}>{statusInfo.label}</Badge>
                            <Badge className={priorityInfo.color + ' text-xs'}>{priorityInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{log.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {log.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time}</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {log.className} - {log.subject}</span>
                            {log.studentName && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {log.studentName}</span>}
                          </div>
                          {(log.strengths.length > 0 || log.improvements.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {log.strengths.length > 0 && (
                                <div className="p-2 bg-emerald-50 rounded text-xs">
                                  <span className="font-semibold text-emerald-700">نقاط القوة:</span>
                                  <ul className="mt-1">{log.strengths.map((s, i) => <li key={i} className="text-emerald-600">• {s}</li>)}</ul>
                                </div>
                              )}
                              {log.improvements.length > 0 && (
                                <div className="p-2 bg-amber-50 rounded text-xs">
                                  <span className="font-semibold text-amber-700">مجالات التحسين:</span>
                                  <ul className="mt-1">{log.improvements.map((im, i) => <li key={i} className="text-amber-600">• {im}</li>)}</ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost"><Edit className="w-4 h-4 text-gray-400" /></Button>
                          <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ===== تبويب الحضور والغياب ===== */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">سجل الحضور والغياب</h2>
              <Button onClick={() => setIsAttendanceDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" /> تسجيل حضور
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">التاريخ</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">الفصل</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">الإجمالي</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">حاضر</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">غائب</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">متأخر</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">مستأذن</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(record => {
                    const percent = Math.round((record.present / record.totalStudents) * 100);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 border-b">
                        <td className="p-3 text-sm">{record.date}</td>
                        <td className="p-3 text-sm font-medium">{record.className}</td>
                        <td className="p-3 text-center text-sm">{record.totalStudents}</td>
                        <td className="p-3 text-center"><Badge className="bg-emerald-100 text-emerald-700">{record.present}</Badge></td>
                        <td className="p-3 text-center"><Badge className="bg-red-100 text-red-700">{record.absent}</Badge></td>
                        <td className="p-3 text-center"><Badge className="bg-amber-100 text-amber-700">{record.late}</Badge></td>
                        <td className="p-3 text-center"><Badge className="bg-blue-100 text-blue-700">{record.excused}</Badge></td>
                        <td className="p-3 text-center">
                          <Badge className={percent >= 90 ? 'bg-emerald-100 text-emerald-700' : percent >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                            {percent}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== تبويب الإحصائيات ===== */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0">
              <CardHeader><CardTitle className="text-lg">توزيع السجلات حسب النوع</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(LOG_TYPES).map(([key, type]) => {
                    const count = logs.filter(l => l.type === key).length;
                    const percent = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                    const TypeIcon = type.icon;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${type.color}`}><TypeIcon className="w-4 h-4" /></div>
                        <span className="text-sm flex-1">{type.label}</span>
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-purple-500" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-8 text-left">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader><CardTitle className="text-lg">ملخص الحضور الأسبوعي</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['3/أ', '2/ب', '1/أ'].map(cls => {
                    const classRecords = attendance.filter(a => a.className === cls);
                    const avgPresent = classRecords.length > 0
                      ? Math.round(classRecords.reduce((sum, a) => sum + (a.present / a.totalStudents * 100), 0) / classRecords.length)
                      : 0;
                    return (
                      <div key={cls} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">الفصل {cls}</span>
                          <Badge className={avgPresent >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                            {avgPresent}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${avgPresent >= 90 ? 'bg-emerald-500' : avgPresent >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${avgPresent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" /> تحليل ذكي بالذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-800 mb-3">
                    بناءً على تحليل سجلاتك، إليك أبرز الملاحظات:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-emerald-700 text-sm mb-1">نقاط القوة</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• نسبة حضور مرتفعة (93%)</li>
                        <li>• متابعة منتظمة للزيارات الصفية</li>
                        <li>• توثيق جيد للملاحظات</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-amber-700 text-sm mb-1">مجالات التحسين</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• زيادة الزيارات الصفية</li>
                        <li>• متابعة التوصيات المفتوحة</li>
                        <li>• تنويع أساليب التقييم</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-blue-700 text-sm mb-1">توصيات</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• جدولة زيارة أسبوعية لكل فصل</li>
                        <li>• إغلاق 3 سجلات مفتوحة</li>
                        <li>• إعداد تقرير شهري</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== نافذة إنشاء سجل ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" /> سجل متابعة جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>النوع</Label>
                  <Select value={newLog.type} onValueChange={v => setNewLog(prev => ({ ...prev, type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOG_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الأولوية</Label>
                  <Select value={newLog.priority} onValueChange={v => setNewLog(prev => ({ ...prev, priority: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>العنوان *</Label>
                <Input placeholder="عنوان السجل" value={newLog.title}
                  onChange={e => setNewLog(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الفصل</Label>
                  <Input placeholder="3/أ" value={newLog.className}
                    onChange={e => setNewLog(prev => ({ ...prev, className: e.target.value }))} />
                </div>
                <div>
                  <Label>المادة</Label>
                  <Input placeholder="الرياضيات" value={newLog.subject}
                    onChange={e => setNewLog(prev => ({ ...prev, subject: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>اسم الطالب (اختياري)</Label>
                <Input placeholder="اسم الطالب" value={newLog.studentName}
                  onChange={e => setNewLog(prev => ({ ...prev, studentName: e.target.value }))} />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea placeholder="وصف تفصيلي..." value={newLog.description}
                  onChange={e => setNewLog(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>نقاط القوة (سطر لكل نقطة)</Label>
                <Textarea placeholder="إدارة الوقت&#10;تفاعل الطلاب" value={newLog.strengths}
                  onChange={e => setNewLog(prev => ({ ...prev, strengths: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>مجالات التحسين</Label>
                <Textarea placeholder="تفعيل التقنية&#10;تنويع الأنشطة" value={newLog.improvements}
                  onChange={e => setNewLog(prev => ({ ...prev, improvements: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>التوصيات</Label>
                <Textarea placeholder="استخدام السبورة التفاعلية&#10;تطبيق التعلم التعاوني" value={newLog.recommendations}
                  onChange={e => setNewLog(prev => ({ ...prev, recommendations: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateLog} className="bg-purple-600 hover:bg-purple-700">
                <CheckCircle2 className="w-4 h-4 ml-2" /> إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
