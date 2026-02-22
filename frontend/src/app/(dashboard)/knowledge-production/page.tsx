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
  Lightbulb, Plus, Search, FileDown, Trash2, Eye, Sparkles,
  Calendar, CheckCircle2, Loader2, Brain, Edit, BookOpen,
  FileText, Download, Upload, ExternalLink, Award, Star,
  BarChart3, Users, Clock, Filter, Grid3X3, List, PenTool,
  GraduationCap, Microscope, Newspaper, Presentation, File,
} from 'lucide-react';

// ===== أنواع الإنتاج المعرفي =====
const PRODUCTION_TYPES = {
  research: { label: 'بحث تربوي', icon: Microscope, color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  article: { label: 'مقال علمي', icon: Newspaper, color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-500 to-purple-600' },
  paper: { label: 'ورقة عمل', icon: FileText, color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600' },
  presentation: { label: 'عرض تقديمي', icon: Presentation, color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-amber-600' },
  book: { label: 'كتاب/دليل', icon: BookOpen, color: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600' },
  initiative: { label: 'مبادرة تعليمية', icon: Lightbulb, color: 'bg-teal-100 text-teal-700', gradient: 'from-teal-500 to-teal-600' },
  tool: { label: 'أداة/وسيلة تعليمية', icon: PenTool, color: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-500 to-indigo-600' },
};

interface KnowledgeItem {
  id: string;
  title: string;
  type: keyof typeof PRODUCTION_TYPES;
  description: string;
  abstract?: string;
  authors: string[];
  date: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  tags: string[];
  attachments: string[];
  publishedIn?: string;
  doi?: string;
  citations?: number;
}

const STATUS_MAP = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700' },
  in_review: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
  published: { label: 'منشور', color: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'مؤرشف', color: 'bg-slate-100 text-slate-700' },
};

const SAMPLE_ITEMS: KnowledgeItem[] = [
  {
    id: '1', title: 'أثر استخدام التقنية في تحسين التحصيل الدراسي', type: 'research',
    description: 'بحث تربوي يدرس أثر استخدام التقنيات الحديثة في تحسين مستوى التحصيل الدراسي لطلاب المرحلة المتوسطة.',
    abstract: 'هدفت هذه الدراسة إلى معرفة أثر استخدام التقنية في تحسين التحصيل الدراسي...',
    authors: ['أحمد محمد', 'خالد عبدالله'], date: '2026-02-15', status: 'published',
    tags: ['تقنية', 'تحصيل', 'بحث تربوي'], attachments: ['البحث.pdf'],
    publishedIn: 'مجلة التربية والتعليم', citations: 5,
  },
  {
    id: '2', title: 'استراتيجيات التعلم النشط في الرياضيات', type: 'paper',
    description: 'ورقة عمل تقدم مجموعة من استراتيجيات التعلم النشط المناسبة لتدريس الرياضيات.',
    authors: ['أحمد محمد'], date: '2026-02-10', status: 'published',
    tags: ['تعلم نشط', 'رياضيات'], attachments: ['ورقة_العمل.pdf'],
  },
  {
    id: '3', title: 'دليل المعلم للتقويم التكويني', type: 'book',
    description: 'دليل شامل يوضح أساليب التقويم التكويني المستمر وكيفية تطبيقها في الفصل الدراسي.',
    authors: ['أحمد محمد', 'سارة علي'], date: '2026-01-20', status: 'in_review',
    tags: ['تقويم', 'دليل'], attachments: ['الدليل.pdf'],
  },
  {
    id: '4', title: 'مبادرة "رياضيات بلا حدود"', type: 'initiative',
    description: 'مبادرة تعليمية تهدف إلى تبسيط مفاهيم الرياضيات باستخدام الألعاب التعليمية والتطبيقات الرقمية.',
    authors: ['أحمد محمد'], date: '2026-01-05', status: 'published',
    tags: ['مبادرة', 'رياضيات', 'ألعاب تعليمية'], attachments: [],
  },
];

export default function KnowledgeProductionPage() {
  const [items, setItems] = useState<KnowledgeItem[]>(SAMPLE_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [newItem, setNewItem] = useState({
    title: '', type: 'research' as keyof typeof PRODUCTION_TYPES,
    description: '', abstract: '', authors: '', tags: '',
  });

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter(i => i.status === 'published').length,
    inReview: items.filter(i => i.status === 'in_review').length,
    totalCitations: items.reduce((sum, i) => sum + (i.citations || 0), 0),
  }), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.title.includes(searchQuery) || i.description.includes(searchQuery);
      const matchType = filterType === 'all' || i.type === filterType;
      const matchStatus = filterStatus === 'all' || i.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [items, searchQuery, filterType, filterStatus]);

  const handleCreate = () => {
    if (!newItem.title) { toast.error('يرجى إدخال العنوان'); return; }
    const item: KnowledgeItem = {
      id: Date.now().toString(), title: newItem.title, type: newItem.type,
      description: newItem.description, abstract: newItem.abstract,
      authors: newItem.authors.split(',').map(a => a.trim()).filter(a => a),
      date: new Date().toISOString().split('T')[0], status: 'draft',
      tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
      attachments: [],
    };
    setItems(prev => [item, ...prev]);
    setIsCreateDialogOpen(false);
    setNewItem({ title: '', type: 'research', description: '', abstract: '', authors: '', tags: '' });
    toast.success('تم إضافة الإنتاج المعرفي بنجاح');
  };

  const handleAIAssist = () => {
    setIsAIGenerating(true);
    setTimeout(() => {
      setNewItem(prev => ({
        ...prev,
        abstract: 'هدفت هذه الدراسة إلى استكشاف ' + prev.title + '. استخدم الباحث المنهج الوصفي التحليلي على عينة من المعلمين والطلاب. أظهرت النتائج وجود أثر إيجابي ذي دلالة إحصائية...',
      }));
      setIsAIGenerating(false);
      toast.success('تم توليد الملخص بالذكاء الاصطناعي');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/20">
      <div className="container mx-auto py-6 px-4 max-w-7xl">

        {/* ===== الهيدر ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl text-white">
                <Lightbulb className="w-7 h-7" />
              </div>
              الإنتاج المعرفي
            </h1>
            <p className="text-gray-500 mt-2">إدارة الأبحاث والمقالات وأوراق العمل والمبادرات التعليمية</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><FileDown className="w-4 h-4 ml-2" /> تصدير</Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="w-4 h-4 ml-2" /> إضافة إنتاج
            </Button>
          </div>
        </div>

        {/* ===== الإحصائيات ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Lightbulb, label: 'إجمالي الإنتاج', value: stats.total, color: '#10b981' },
            { icon: CheckCircle2, label: 'منشور', value: stats.published, color: '#3b82f6' },
            { icon: Clock, label: 'قيد المراجعة', value: stats.inReview, color: '#f59e0b' },
            { icon: Star, label: 'الاستشهادات', value: stats.totalCitations, color: '#8b5cf6' },
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

        {/* ===== الفلاتر ===== */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(PRODUCTION_TYPES).map(([key, type]) => (
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
          <div className="flex gap-1">
            <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ===== قائمة الإنتاج ===== */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredItems.map(item => {
            const typeInfo = PRODUCTION_TYPES[item.type];
            const TypeIcon = typeInfo.icon;
            const statusInfo = STATUS_MAP[item.status];
            return (
              <Card key={item.id} className="shadow-md border-0 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedItem(item)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <Badge className={statusInfo.color + ' text-xs'}>{statusInfo.label}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.authors.length} مؤلف</span>
                    {item.citations && item.citations > 0 && (
                      <span className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3" /> {item.citations} استشهاد</span>
                    )}
                  </div>
                  {item.publishedIn && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      منشور في: {item.publishedIn}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ===== نافذة الإنشاء ===== */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-green-600" /> إضافة إنتاج معرفي جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>النوع</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem(prev => ({ ...prev, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCTION_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>العنوان *</Label>
                <Input placeholder="عنوان الإنتاج المعرفي" value={newItem.title}
                  onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea placeholder="وصف مختصر..." value={newItem.description}
                  onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label className="flex items-center justify-between">
                  الملخص
                  <Button type="button" size="sm" variant="outline" onClick={handleAIAssist} disabled={isAIGenerating || !newItem.title}>
                    {isAIGenerating ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Sparkles className="w-3 h-3 ml-1" />}
                    توليد بالذكاء الاصطناعي
                  </Button>
                </Label>
                <Textarea placeholder="ملخص البحث أو المقال..." value={newItem.abstract}
                  onChange={e => setNewItem(prev => ({ ...prev, abstract: e.target.value }))} rows={4} />
              </div>
              <div>
                <Label>المؤلفون (مفصولون بفاصلة)</Label>
                <Input placeholder="أحمد محمد, خالد عبدالله" value={newItem.authors}
                  onChange={e => setNewItem(prev => ({ ...prev, authors: e.target.value }))} />
              </div>
              <div>
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <Input placeholder="بحث تربوي, تقنية, تعليم" value={newItem.tags}
                  onChange={e => setNewItem(prev => ({ ...prev, tags: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 ml-2" /> إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
