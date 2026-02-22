'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Move,
  Type,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Settings,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CanvasElement {
  id: string;
  element_id: string;
  type: 'text' | 'image' | 'date' | 'qrcode';
  label: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  font_size: number;
  font_family: string;
  font_weight: string;
  font_style: string;
  color: string;
  text_align: string;
  mapped_field?: string;
  placeholder_text?: string;
}

interface TemplateMapperProps {
  templateId: string;
  fields?: Array<{ id: string; name: string; label_ar: string }>;
}

const FONT_FAMILIES = [
  { value: 'Cairo', label: 'Cairo (عربي)' },
  { value: 'Tajawal', label: 'Tajawal (عربي)' },
  { value: 'Amiri', label: 'Amiri (عربي)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
];

const DEFAULT_ELEMENT: Omit<CanvasElement, 'id'> = {
  element_id: '',
  type: 'text',
  label: '',
  x_position: 100,
  y_position: 100,
  width: 200,
  height: 40,
  font_size: 16,
  font_family: 'Cairo',
  font_weight: 'normal',
  font_style: 'normal',
  color: '#000000',
  text_align: 'center',
  placeholder_text: 'نص تجريبي',
};

export function TemplateMapper({ templateId, fields = [] }: TemplateMapperProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showAddElement, setShowAddElement] = useState(false);
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 794, height: 1123 }); // A4 at 96 DPI

  // Load canvas data
  useEffect(() => {
    loadCanvasData();
  }, [templateId]);

  const loadCanvasData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/templates/${templateId}/canvas`);
      if (response.success && response.data) {
        if (response.data.background_image) {
          setBackgroundImage(response.data.background_image);
        }
        if (response.data.elements) {
          setElements(response.data.elements);
        }
        if (response.data.canvas_size) {
          setCanvasSize(response.data.canvas_size);
        }
      }
    } catch (error: any) {
      console.error('Canvas load error:', error);
      // Not an error if canvas doesn't exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const saveCanvas = async () => {
    setIsSaving(true);
    try {
      const response = await api.put(`/admin/templates/${templateId}/canvas`, {
        background_image: backgroundImage,
        elements: elements,
        canvas_size: canvasSize,
      });

      if (response.success) {
        toast.success('تم حفظ تخطيط القالب بنجاح');
        setHasChanges(false);
      }
    } catch (error: any) {
      console.error('Canvas save error:', error);
      toast.error('فشل في حفظ تخطيط القالب');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle background image upload
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('background', file);

      const response = await api.post(`/admin/templates/${templateId}/canvas/background`, formData);
      if (response.success) {
        setBackgroundImage(response.data.url);
        toast.success('تم رفع صورة الخلفية بنجاح');
        setHasChanges(true);
      }
    } catch (error) {
      // Fallback: use local URL
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      setHasChanges(true);
      toast.success('تم تحميل صورة الخلفية');
    }
  };

  // Add new element
  const addElement = (type: CanvasElement['type'] = 'text') => {
    const newElement: CanvasElement = {
      ...DEFAULT_ELEMENT,
      id: `el_${Date.now()}`,
      element_id: `field_${elements.length + 1}`,
      type,
      label: type === 'text' ? 'حقل نص جديد' : type === 'image' ? 'صورة' : type === 'qrcode' ? 'QR Code' : 'تاريخ',
      x_position: 100 + elements.length * 20,
      y_position: 100 + elements.length * 20,
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setHasChanges(true);
    setShowAddElement(false);
  };

  // Remove element
  const removeElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
    setHasChanges(true);
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    ));
    setHasChanges(true);
  };

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setIsDragging(true);
    setSelectedElement(elementId);
    setDragOffset({
      x: (e.clientX - canvasRect.left) / zoom - element.x_position,
      y: (e.clientY - canvasRect.top) / zoom - element.y_position,
    });
  }, [elements, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const newX = Math.max(0, Math.min(
      (e.clientX - canvasRect.left) / zoom - dragOffset.x,
      canvasSize.width - 50
    ));
    const newY = Math.max(0, Math.min(
      (e.clientY - canvasRect.top) / zoom - dragOffset.y,
      canvasSize.height - 20
    ));

    updateElement(selectedElement, {
      x_position: Math.round(newX),
      y_position: Math.round(newY),
    });
  }, [isDragging, selectedElement, dragOffset, zoom, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const selectedEl = elements.find(el => el.id === selectedElement);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-500">جاري تحميل محرر الإطارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddElement(true)} className="gap-1">
            <Plus className="w-4 h-4" /> إضافة إطار
          </Button>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(zoom + 0.1, 2))} title="تكبير">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))} title="تصغير">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(1)} title="إعادة تعيين">
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            title="إظهار/إخفاء الشبكة"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              تغييرات غير محفوظة
            </Badge>
          )}
          <Button onClick={saveCanvas} disabled={isSaving || !hasChanges} size="sm" className="gap-1">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التخطيط
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas Area */}
        <div className="lg:col-span-3 bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
          {!backgroundImage ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">رفع صورة القالب</h3>
              <p className="text-sm text-gray-500 mb-4">ارفع صورة التصميم الأساسية (PNG, JPG)</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
                <Button asChild>
                  <span><Upload className="w-4 h-4 ml-2" /> اختر صورة</span>
                </Button>
              </label>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="relative mx-auto border border-gray-300 dark:border-gray-600 shadow-lg bg-white cursor-crosshair"
              style={{
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => setSelectedElement(null)}
            >
              {/* Grid overlay */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
                    backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                  }}
                />
              )}

              {/* Elements */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move select-none transition-shadow ${
                    selectedElement === element.id
                      ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg'
                      : 'hover:ring-1 hover:ring-blue-300'
                  }`}
                  style={{
                    left: element.x_position * zoom,
                    top: element.y_position * zoom,
                    width: element.width * zoom,
                    height: element.height * zoom,
                    fontSize: element.font_size * zoom,
                    fontFamily: element.font_family,
                    fontWeight: element.font_weight,
                    fontStyle: element.font_style,
                    color: element.color,
                    textAlign: element.text_align as any,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: element.text_align === 'center' ? 'center' : element.text_align === 'right' ? 'flex-end' : 'flex-start',
                    backgroundColor: selectedElement === element.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    border: `1px ${selectedElement === element.id ? 'solid' : 'dashed'} rgba(59, 130, 246, ${selectedElement === element.id ? '0.5' : '0.3'})`,
                    borderRadius: '4px',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                  }}
                >
                  <span className="truncate px-1">
                    {element.placeholder_text || element.label}
                  </span>
                  
                  {/* Position indicator */}
                  {selectedElement === element.id && (
                    <div className="absolute -top-5 right-0 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                      {element.label} ({Math.round(element.x_position)}, {Math.round(element.y_position)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {/* Elements List */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                الإطارات ({elements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 max-h-48 overflow-y-auto">
              {elements.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">لا توجد إطارات</p>
              ) : (
                <div className="space-y-1">
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                        selectedElement === el.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSelectedElement(el.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Type className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{el.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeElement(el.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Element Properties */}
          {selectedEl && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  خصائص الإطار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {/* Label */}
                <div className="space-y-1">
                  <Label className="text-xs">التسمية</Label>
                  <Input
                    value={selectedEl.label}
                    onChange={(e) => updateElement(selectedEl.id, { label: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Mapped Field */}
                <div className="space-y-1">
                  <Label className="text-xs">ربط بحقل</Label>
                  <Select
                    value={selectedEl.mapped_field || ''}
                    onValueChange={(value) => updateElement(selectedEl.id, { mapped_field: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="اختر حقل..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون ربط</SelectItem>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.name}>
                          {field.label_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={selectedEl.x_position}
                      onChange={(e) => updateElement(selectedEl.id, { x_position: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={selectedEl.y_position}
                      onChange={(e) => updateElement(selectedEl.id, { y_position: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">العرض</Label>
                    <Input
                      type="number"
                      value={selectedEl.width}
                      onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الارتفاع</Label>
                    <Input
                      type="number"
                      value={selectedEl.height}
                      onChange={(e) => updateElement(selectedEl.id, { height: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Font */}
                <div className="space-y-1">
                  <Label className="text-xs">الخط</Label>
                  <Select
                    value={selectedEl.font_family}
                    onValueChange={(value) => updateElement(selectedEl.id, { font_family: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size & Color */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">حجم الخط</Label>
                    <Input
                      type="number"
                      value={selectedEl.font_size}
                      onChange={(e) => updateElement(selectedEl.id, { font_size: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">اللون</Label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={selectedEl.color}
                        onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border"
                      />
                      <Input
                        value={selectedEl.color}
                        onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Formatting */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={selectedEl.font_weight === 'bold' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateElement(selectedEl.id, {
                      font_weight: selectedEl.font_weight === 'bold' ? 'normal' : 'bold'
                    })}
                  >
                    <Bold className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={selectedEl.font_style === 'italic' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateElement(selectedEl.id, {
                      font_style: selectedEl.font_style === 'italic' ? 'normal' : 'italic'
                    })}
                  >
                    <Italic className="w-3 h-3" />
                  </Button>
                  <div className="h-5 w-px bg-gray-300 mx-1" />
                  <Button
                    variant={selectedEl.text_align === 'right' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateElement(selectedEl.id, { text_align: 'right' })}
                  >
                    <AlignRight className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={selectedEl.text_align === 'center' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateElement(selectedEl.id, { text_align: 'center' })}
                  >
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={selectedEl.text_align === 'left' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateElement(selectedEl.id, { text_align: 'left' })}
                  >
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                </div>

                {/* Placeholder Text */}
                <div className="space-y-1">
                  <Label className="text-xs">نص المعاينة</Label>
                  <Input
                    value={selectedEl.placeholder_text || ''}
                    onChange={(e) => updateElement(selectedEl.id, { placeholder_text: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="النص الذي يظهر في المعاينة"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload new background */}
          {backgroundImage && (
            <Card>
              <CardContent className="p-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" className="w-full gap-1" asChild>
                    <span><Upload className="w-4 h-4" /> تغيير صورة الخلفية</span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Element Dialog */}
      <Dialog open={showAddElement} onOpenChange={setShowAddElement}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة إطار جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => addElement('text')}
            >
              <Type className="w-6 h-6" />
              <span className="text-xs">نص</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => addElement('image')}
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">صورة</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => addElement('date')}
            >
              <span className="text-2xl">📅</span>
              <span className="text-xs">تاريخ</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => addElement('qrcode')}
            >
              <span className="text-2xl">📱</span>
              <span className="text-xs">QR Code</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateMapper;
