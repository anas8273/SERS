'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { Plus, Trash2, Edit, Loader2, GraduationCap, BookMarked, ListOrdered, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface Stage { id: string; name: string; order: number; }
interface Grade { id: string; name: string; stageId: string; order: number; }
interface Subject { id: string; name: string; stageId: string; gradeId?: string; semester?: string; }

// Default Saudi curriculum data
const DEFAULT_STAGES: Stage[] = [
  { id: 'primary', name: ta('المرحلة الابتدائية', 'Elementary Stage'), order: 1 },
  { id: 'middle', name: ta('المرحلة المتوسطة', 'Intermediate Stage'), order: 2 },
  { id: 'high', name: ta('المرحلة الثانوية', 'Secondary Stage'), order: 3 },
];
const DEFAULT_GRADES: Grade[] = [
  { id: 'g1', name: ta('الصف الأول', 'First Grade'), stageId: 'primary', order: 1 },
  { id: 'g2', name: ta('الصف الثاني', 'Second Grade'), stageId: 'primary', order: 2 },
  { id: 'g3', name: ta('الصف الثالث', 'Third Grade'), stageId: 'primary', order: 3 },
  { id: 'g4', name: ta('الصف الرابع', 'Fourth Grade'), stageId: 'primary', order: 4 },
  { id: 'g5', name: ta('الصف الخامس', 'Fifth Grade'), stageId: 'primary', order: 5 },
  { id: 'g6', name: ta('الصف السادس', 'Sixth Grade'), stageId: 'primary', order: 6 },
  { id: 'g7', name: ta('الصف الأول المتوسط', 'First Intermediate Grade'), stageId: 'middle', order: 1 },
  { id: 'g8', name: ta('الصف الثاني المتوسط', 'Second Intermediate Grade'), stageId: 'middle', order: 2 },
  { id: 'g9', name: ta('الصف الثالث المتوسط', 'Third Intermediate Grade'), stageId: 'middle', order: 3 },
  { id: 'g10', name: ta('الصف الأول الثانوي', 'First Secondary Grade'), stageId: 'high', order: 1 },
  { id: 'g11', name: ta('الصف الثاني الثانوي', 'Second Secondary Grade'), stageId: 'high', order: 2 },
  { id: 'g12', name: ta('الصف الثالث الثانوي', 'Third Secondary Grade'), stageId: 'high', order: 3 },
];
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 's1', name: ta('القرآن الكريم', 'Quran'), stageId: 'primary' },
  { id: 's2', name: ta('التوحيد', 'Monotheism'), stageId: 'primary' },
  { id: 's3', name: ta('الفقه', 'Jurisprudence'), stageId: 'primary' },
  { id: 's4', name: ta('اللغة العربية', 'Arabic Language'), stageId: 'primary' },
  { id: 's5', name: ta('الرياضيات', 'Mathematics'), stageId: 'primary' },
  { id: 's6', name: ta('العلوم', 'Science'), stageId: 'primary' },
  { id: 's7', name: ta('التاريخ', 'History'), stageId: 'middle' },
  { id: 's8', name: ta('الجغرافيا', 'Geography'), stageId: 'middle' },
  { id: 's9', name: ta('التربية الوطنية', 'Civic Education'), stageId: 'middle' },
  { id: 's10', name: ta('اللغة الإنجليزية', 'English Language'), stageId: 'primary' },
  { id: 's11', name: ta('الحاسب والتقنية', 'Computer & Technology'), stageId: 'middle' },
  { id: 's12', name: ta('التربية البدنية', 'Physical Education'), stageId: 'primary' },
];

export default function AdminCurriculumPage() {
  const { dir, t } = useTranslation();
  const [tab, setTab] = useState('stages');
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [grades, setGrades] = useState<Grade[]>(DEFAULT_GRADES);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stage form
  const [stageDialog, setStageDialog] = useState(false);
  const [stageForm, setStageForm] = useState({ name: '', order: 1 });
  const [editStageId, setEditStageId] = useState<string | null>(null);

  // Grade form
  const [gradeDialog, setGradeDialog] = useState(false);
  const [gradeForm, setGradeForm] = useState({ name: '', stageId: '', order: 1 });
  const [editGradeId, setEditGradeId] = useState<string | null>(null);

  // Subject form
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', stageId: '', gradeId: '' });
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);

  useEffect(() => { fetchCurriculum(); }, []);

  const fetchCurriculum = async () => {
    setLoading(true);
    try {
      const [sRes, gRes, subRes] = await Promise.allSettled([
        api.get('/admin/curriculum/stages'),
        api.get('/admin/curriculum/grades'),
        api.get('/admin/curriculum/subjects'),
      ]);
      if (sRes.status === 'fulfilled' && (sRes.value as any)?.data?.length) setStages((sRes.value as any).data);
      if (gRes.status === 'fulfilled' && (gRes.value as any)?.data?.length) setGrades((gRes.value as any).data);
      if (subRes.status === 'fulfilled' && (subRes.value as any)?.data?.length) setSubjects((subRes.value as any).data);
    } catch { /* fallback to defaults */ } finally { setLoading(false); }
  };

  const saveStage = async () => {
    if (!stageForm.name) { toast.error(ta('أدخل اسم المرحلة', 'Enter stage name')); return; }
    setSaving(true);
    try {
      if (editStageId) {
        await api.put(`/admin/curriculum/stages/${editStageId}`, stageForm);
        setStages(p => p.map(s => s.id === editStageId ? { ...s, ...stageForm } : s));
        toast.success(ta('تم تحديث المرحلة', 'Stage updated'));
      } else {
        const res = await api.post('/admin/curriculum/stages', stageForm) as any;
        setStages(p => [...p, { id: res?.data?.id || Date.now().toString(), ...stageForm }]);
        toast.success(ta('تمت إضافة المرحلة', 'Stage added'));
      }
      setStageDialog(false); setStageForm({ name: '', order: 1 }); setEditStageId(null);
    } catch { toast.error(ta('حدث خطأ', 'Error occurred')); } finally { setSaving(false); }
  };

  const deleteStage = async (id: string) => {
    try { await api.delete(`/admin/curriculum/stages/${id}`); } catch { /* ignore */ }
    setStages(p => p.filter(s => s.id !== id));
    toast.success(ta('تم الحذف', 'Deleted'));
  };

  const saveGrade = async () => {
    if (!gradeForm.name || !gradeForm.stageId) { toast.error(ta('أدخل اسم الصف والمرحلة', 'Enter grade and stage name')); return; }
    setSaving(true);
    try {
      if (editGradeId) {
        await api.put(`/admin/curriculum/grades/${editGradeId}`, gradeForm);
        setGrades(p => p.map(g => g.id === editGradeId ? { ...g, ...gradeForm } : g));
        toast.success(ta('تم تحديث الصف', 'Grade updated'));
      } else {
        const res = await api.post('/admin/curriculum/grades', gradeForm) as any;
        setGrades(p => [...p, { id: res?.data?.id || Date.now().toString(), ...gradeForm }]);
        toast.success(ta('تمت إضافة الصف', 'Grade added'));
      }
      setGradeDialog(false); setGradeForm({ name: '', stageId: '', order: 1 }); setEditGradeId(null);
    } catch { toast.error(ta('حدث خطأ', 'Error occurred')); } finally { setSaving(false); }
  };

  const deleteGrade = async (id: string) => {
    try { await api.delete(`/admin/curriculum/grades/${id}`); } catch { /* ignore */ }
    setGrades(p => p.filter(g => g.id !== id));
    toast.success(ta('تم الحذف', 'Deleted'));
  };

  const saveSubject = async () => {
    if (!subjectForm.name || !subjectForm.stageId) { toast.error(ta('أدخل المادة والمرحلة', 'Enter subject and stage')); return; }
    setSaving(true);
    try {
      if (editSubjectId) {
        await api.put(`/admin/curriculum/subjects/${editSubjectId}`, subjectForm);
        setSubjects(p => p.map(s => s.id === editSubjectId ? { ...s, ...subjectForm } : s));
        toast.success(ta('تم تحديث المادة', 'Subject updated'));
      } else {
        const res = await api.post('/admin/curriculum/subjects', subjectForm) as any;
        setSubjects(p => [...p, { id: res?.data?.id || Date.now().toString(), ...subjectForm }]);
        toast.success(ta('تمت إضافة المادة', 'Subject added'));
      }
      setSubjectDialog(false); setSubjectForm({ name: '', stageId: '', gradeId: '' }); setEditSubjectId(null);
    } catch { toast.error(ta('حدث خطأ', 'Error occurred')); } finally { setSaving(false); }
  };

  const deleteSubject = async (id: string) => {
    try { await api.delete(`/admin/curriculum/subjects/${id}`); } catch { /* ignore */ }
    setSubjects(p => p.filter(s => s.id !== id));
    toast.success(ta('تم الحذف', 'Deleted'));
  };

  return (
    <div className="container mx-auto py-6 px-4" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/educational-services"><Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-black">{ta('إدارة المنهج السعودي', 'Saudi Curriculum Management')}</h1>
          <p className="text-muted-foreground text-sm">{ta('تحكم كامل في المراحل والصفوف والمواد الدراسية', 'Full control over stages, grades and subjects')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: ta('المراحل الدراسية', 'Academic Stages'), value: stages.length, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: ta('الصفوف', 'Grades'), value: grades.length, icon: ListOrdered, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: ta('المواد الدراسية', 'Academic Subjects'), value: subjects.length, icon: BookMarked, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map(s => {
          const I = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><I className={`h-5 w-5 ${s.color}`} /></div>
                <div><p className="text-2xl font-black">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="stages" className="gap-2"><GraduationCap className="h-4 w-4" />{ta('المراحل الدراسية', 'Academic Stages')}</TabsTrigger>
          <TabsTrigger value="grades" className="gap-2"><ListOrdered className="h-4 w-4" />{ta('الصفوف', 'Grades')}</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2"><BookMarked className="h-4 w-4" />{ta('المواد الدراسية', 'Academic Subjects')}</TabsTrigger>
        </TabsList>

        {/* ─── Stages Tab ─── */}
        <TabsContent value="stages">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">{ta('المراحل الدراسية', 'Academic Stages')} ({stages.length})</h2>
            <Dialog open={stageDialog} onOpenChange={v => { setStageDialog(v); if (!v) { setEditStageId(null); setStageForm({ name: '', order: 1 }); } }}>
              <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />{ta('إضافة مرحلة', 'Add Stage')}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editStageId ? ta('تعديل المرحلة', 'Edit Stage') : ta('إضافة مرحلة دراسية', 'Add Academic Stage')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>{ta('اسم المرحلة *', 'Stage Name *')}</Label><Input placeholder={ta('المرحلة الابتدائية', 'Elementary Stage')} value={stageForm.name} onChange={e => setStageForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>{ta('الترتيب', 'Order')}</Label><Input type="number" min={1} value={stageForm.order} onChange={e => setStageForm(p => ({ ...p, order: +e.target.value }))} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStageDialog(false)}>{t('common.cancel')}</Button>
                  <Button onClick={saveStage} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <Save className="h-4 w-4 ms-2" />}{editStageId ? t('common.save') : t('services.add')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stages.sort((a, b) => a.order - b.order).map((stage, i) => (
              <motion.div key={stage.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">{stage.name}</CardTitle><Badge variant="outline">#{stage.order}</Badge></div></CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">{grades.filter(g => g.stageId === stage.id).length} {ta('صفوف', 'grades')} · {subjects.filter(s => s.stageId === stage.id).length} {ta('مواد', 'subjects')}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditStageId(stage.id); setStageForm({ name: stage.name, order: stage.order }); setStageDialog(true); }}><Edit className="h-3.5 w-3.5" />{ta('تعديل', 'Edit')}</Button>
                      <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={() => deleteStage(stage.id)}><Trash2 className="h-3.5 w-3.5" />{ta('حذف', 'Delete')}</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ─── Grades Tab ─── */}
        <TabsContent value="grades">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">{ta('الصفوف الدراسية', 'Academic Grades')} ({grades.length})</h2>
            <Dialog open={gradeDialog} onOpenChange={v => { setGradeDialog(v); if (!v) { setEditGradeId(null); setGradeForm({ name: '', stageId: '', order: 1 }); } }}>
              <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />{ta('إضافة صف', 'Add Grade')}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editGradeId ? ta('تعديل الصف', 'Edit Grade') : ta('إضافة صف دراسي', 'Add Academic Grade')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>{ta('اسم الصف *', 'Grade Name *')}</Label><Input placeholder={ta('الصف الأول', 'First Grade')} value={gradeForm.name} onChange={e => setGradeForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>{ta('المرحلة الدراسية *', 'Academic Stage *')}</Label><Select value={gradeForm.stageId} onValueChange={v => setGradeForm(p => ({ ...p, stageId: v }))}><SelectTrigger><SelectValue placeholder={ta('اختر المرحلة', 'Select Stage')} /></SelectTrigger><SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid gap-2"><Label>{ta('الترتيب', 'Order')}</Label><Input type="number" min={1} value={gradeForm.order} onChange={e => setGradeForm(p => ({ ...p, order: +e.target.value }))} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setGradeDialog(false)}>{t('common.cancel')}</Button><Button onClick={saveGrade} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <Save className="h-4 w-4 ms-2" />}{editGradeId ? t('common.save') : t('services.add')}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4">
            {stages.map(stage => {
              const stageGrades = grades.filter(g => g.stageId === stage.id).sort((a, b) => a.order - b.order);
              if (!stageGrades.length) return null;
              return (
                <div key={stage.id}>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" />{stage.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {stageGrades.map((grade, i) => (
                      <motion.div key={grade.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm font-medium">{grade.name}</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditGradeId(grade.id); setGradeForm({ name: grade.name, stageId: grade.stageId, order: grade.order }); setGradeDialog(true); }}><Edit className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteGrade(grade.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Subjects Tab ─── */}
        <TabsContent value="subjects">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">{ta('المواد الدراسية', 'Academic Subjects')} ({subjects.length})</h2>
            <Dialog open={subjectDialog} onOpenChange={v => { setSubjectDialog(v); if (!v) { setEditSubjectId(null); setSubjectForm({ name: '', stageId: '', gradeId: '' }); } }}>
              <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />{ta('إضافة مادة', 'Add Subject')}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editSubjectId ? ta('تعديل المادة', 'Edit Subject') : ta('إضافة مادة دراسية', 'Add Academic Subject')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>{ta('اسم المادة *', 'Subject Name *')}</Label><Input placeholder={ta('الرياضيات', 'Mathematics')} value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>{ta('المرحلة الدراسية *', 'Academic Stage *')}</Label><Select value={subjectForm.stageId} onValueChange={v => setSubjectForm(p => ({ ...p, stageId: v, gradeId: '' }))}><SelectTrigger><SelectValue placeholder={ta('اختر المرحلة', 'Select Stage')} /></SelectTrigger><SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid gap-2"><Label>{ta('الصف (اختياري)', 'Grade (optional)')}</Label><Select value={subjectForm.gradeId} onValueChange={v => setSubjectForm(p => ({ ...p, gradeId: v }))}><SelectTrigger><SelectValue placeholder={ta('جميع الصفوف', 'All Grades')} /></SelectTrigger><SelectContent><SelectItem value="">{ta('جميع الصفوف', 'All Grades')}</SelectItem>{grades.filter(g => g.stageId === subjectForm.stageId).map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setSubjectDialog(false)}>{t('common.cancel')}</Button><Button onClick={saveSubject} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <Save className="h-4 w-4 ms-2" />}{editSubjectId ? t('common.save') : t('services.add')}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map((subject, i) => {
              const stage = stages.find(s => s.id === subject.stageId);
              const grade = grades.find(g => g.id === subject.gradeId);
              return (
                <motion.div key={subject.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{subject.name}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditSubjectId(subject.id); setSubjectForm({ name: subject.name, stageId: subject.stageId, gradeId: subject.gradeId || '' }); setSubjectDialog(true); }}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSubject(subject.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{stage?.name}{grade && ` • ${grade.name}`}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
