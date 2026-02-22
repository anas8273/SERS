'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  GripVertical,
  Bot,
  Eye,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Type,
  Hash,
  Calendar,
  FileText,
  Image,
  CheckSquare,
  Radio,
  Upload,
  PenTool
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TemplateField {
  id?: string;
  name: string;
  label_ar: string;
  label_en: string;
  type: string;
  placeholder_ar?: string;
  placeholder_en?: string;
  is_required: boolean;
  ai_enabled: boolean;
  ai_prompt_hint?: string;
  default_value?: string;
  options?: string[];
  sort_order: number;
}

interface SchemaBuilderProps {
  templateId: string;
  onSchemaUpdate?: (fields: TemplateField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'نص', icon: Type },
  { value: 'textarea', label: 'نص طويل', icon: FileText },
  { value: 'number', label: 'رقم', icon: Hash },
  { value: 'date', label: 'تاريخ', icon: Calendar },
  { value: 'select', label: 'قائمة منسدلة', icon: CheckSquare },
  { value: 'checkbox', label: 'مربع اختيار', icon: CheckSquare },
  { value: 'radio', label: 'اختيار واحد', icon: Radio },
  { value: 'file', label: 'ملف', icon: Upload },
  { value: 'image', label: 'صورة', icon: Image },
  { value: 'signature', label: 'توقيع', icon: PenTool },
];

export function SchemaBuilder({ templateId, onSchemaUpdate }: SchemaBuilderProps) {
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // New field form state
  const [newField, setNewField] = useState<Partial<TemplateField>>({
    name: '',
    label_ar: '',
    label_en: '',
    type: 'text',
    is_required: false,
    ai_enabled: false,
    placeholder_ar: '',
    placeholder_en: '',
    default_value: '',
    options: [],
  });

  useEffect(() => {
    loadSchema();
  }, [templateId]);

  const loadSchema = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/templates/${templateId}/schema`);
      if (response.success) {
        setFields(response.data.mysql_fields || []);
      }
    } catch (error: any) {
      console.error('Schema load error:', error);
      toast.error('فشل في تحميل مخطط القالب');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchema = async () => {
    setIsSaving(true);
    try {
      const response = await api.put(`/admin/templates/${templateId}/schema`, {
        fields: fields.map((field, index) => ({
          ...field,
          sort_order: index
        }))
      });

      if (response.success) {
        toast.success('تم حفظ المخطط بنجاح ✨');
        setHasChanges(false);
        onSchemaUpdate?.(fields);
      }
    } catch (error: any) {
      console.error('Schema save error:', error);
      toast.error('فشل في حفظ المخطط');
    } finally {
      setIsSaving(false);
    }
  };

  const addField = async () => {
    if (!newField.name || !newField.label_ar) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      const response = await api.post(`/admin/templates/${templateId}/fields`, {
        ...newField,
        position: fields.length
      });

      if (response.success) {
        setFields([...fields, response.data]);
        setHasChanges(true);
        setShowAddField(false);
        resetNewField();
        toast.success('تم إضافة الحقل بنجاح');
      }
    } catch (error: any) {
      console.error('Add field error:', error);
      toast.error('فشل في إضافة الحقل');
    }
  };

  const removeField = async (fieldId: string) => {
    try {
      const response = await api.delete(`/admin/templates/${templateId}/fields/${fieldId}`);
      
      if (response.success) {
        setFields(fields.filter(f => f.id !== fieldId));
        setHasChanges(true);
        setDeleteFieldId(null);
        toast.success('تم حذف الحقل بنجاح');
      }
    } catch (error: any) {
      console.error('Remove field error:', error);
      toast.error('فشل في حذف الحقل');
    }
  };

  const toggleFieldAI = async (fieldId: string) => {
    try {
      const response = await api.post(`/admin/templates/${templateId}/fields/${fieldId}/toggle-ai`);
      
      if (response.success) {
        setFields(fields.map(f => 
          f.id === fieldId 
            ? { ...f, ai_enabled: response.data.ai_enabled }
            : f
        ));
        setHasChanges(true);
        toast.success('تم تحديث إعداد الذكاء الاصطناعي');
      }
    } catch (error: any) {
      console.error('Toggle AI error:', error);
      toast.error('فشل في تحديث إعداد الذكاء الاصطناعي');
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const newFields = Array.from(fields);
    const [reorderedField] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, reorderedField);

    setFields(newFields);
    setHasChanges(true);

    // Update field orders on server
    try {
      const fieldOrders = newFields.map((field, index) => ({
        field_id: field.id,
        sort_order: index
      }));

      await api.post(`/admin/templates/${templateId}/fields/reorder`, {
        field_orders: fieldOrders
      });
    } catch (error: any) {
      console.error('Reorder error:', error);
      toast.error('فشل في إعادة ترتيب الحقول');
    }
  };

  const resetNewField = () => {
    setNewField({
      name: '',
      label_ar: '',
      label_en: '',
      type: 'text',
      is_required: false,
      ai_enabled: false,
      placeholder_ar: '',
      placeholder_en: '',
      default_value: '',
      options: [],
    });
  };

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(ft => ft.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-500">جاري تحميل مخطط القالب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            منشئ المخطط
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            إدارة حقول القالب بدون كتابة كود
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <AlertCircle className="w-3 h-3 mr-1" />
              تغييرات غير محفوظة
            </Badge>
          )}
          
          <Button
            onClick={() => setShowAddField(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة حقل
          </Button>
          
          <Button
            onClick={saveSchema}
            disabled={isSaving || !hasChanges}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ المخطط
          </Button>
        </div>
      </div>

      {/* Fields List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            حقول القالب ({fields.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Type className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  لا توجد حقول
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  ابدأ بإضافة حقول لقالبك
                </p>
                <Button onClick={() => setShowAddField(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة أول حقل
                </Button>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {fields.map((field, index) => {
                      const FieldIcon = getFieldIcon(field.type);
                      return (
                        <Draggable key={field.id || index} draggableId={field.id || index.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all ${
                                snapshot.isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* Drag Handle */}
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>

                                {/* Field Icon & Info */}
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <FieldIcon className="w-5 h-5 text-primary" />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-gray-900 dark:text-white">
                                        {field.label_ar}
                                      </h4>
                                      {field.is_required && (
                                        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                                          مطلوب
                                        </Badge>
                                      )}
                                      {field.ai_enabled && (
                                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                          <Bot className="w-3 h-3 mr-1" />
                                          AI
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>الاسم: {field.name}</span>
                                      <span>النوع: {FIELD_TYPES.find(ft => ft.value === field.type)?.label}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleFieldAI(field.id!)}
                                    className={`h-8 w-8 p-0 ${field.ai_enabled ? 'text-purple-600' : 'text-gray-400'}`}
                                    title="تبديل الذكاء الاصطناعي"
                                  >
                                    <Bot className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingField(field)}
                                    className="h-8 w-8 p-0"
                                    title="تعديل"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteFieldId(field.id!)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Add Field Dialog */}
      <Dialog open={showAddField} onOpenChange={setShowAddField}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حقل جديد</DialogTitle>
            <DialogDescription>
              أضف حقل جديد لقالبك بدون كتابة كود
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الحقل (بالإنجليزية)</Label>
                <Input
                  id="name"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  placeholder="field_name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">نوع الحقل</Label>
                <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label_ar">التسمية بالعربية</Label>
              <Input
                id="label_ar"
                value={newField.label_ar}
                onChange={(e) => setNewField({ ...newField, label_ar: e.target.value })}
                placeholder="اسم الحقل بالعربية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label_en">التسمية بالإنجليزية</Label>
              <Input
                id="label_en"
                value={newField.label_en}
                onChange={(e) => setNewField({ ...newField, label_en: e.target.value })}
                placeholder="Field Label in English"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={newField.is_required}
                  onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                />
                <Label htmlFor="required">حقل مطلوب</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai_enabled"
                  checked={newField.ai_enabled}
                  onCheckedChange={(checked) => setNewField({ ...newField, ai_enabled: checked })}
                />
                <Label htmlFor="ai_enabled">تفعيل الذكاء الاصطناعي</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={addField} className="flex-1">
                إضافة الحقل
              </Button>
              <Button variant="outline" onClick={() => setShowAddField(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFieldId} onOpenChange={() => setDeleteFieldId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الحقل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFieldId && removeField(deleteFieldId)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SchemaBuilder;