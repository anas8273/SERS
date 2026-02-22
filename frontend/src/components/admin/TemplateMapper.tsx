'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getTemplateCanvas, saveTemplateCanvas, getDynamicForm } from '@/lib/firestore-service';
import type { TemplateCanvas, CanvasElement as FirestoreCanvasElement } from '@/types';

// ============================================================
// TEMPLATE MAPPER (Visual Canvas Editor)
// Saves to BOTH MySQL (basic) and Firestore (canvas data)
// Admin drags elements on the canvas to define X/Y coordinates
// ============================================================

interface CanvasElement {
  id: string;
  element_id: string;
  type: 'text' | 'image' | 'date' | 'qrcode' | 'line' | 'rect';
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
  rotation?: number;
  opacity?: number;
  z_index?: number;
}

interface TemplateMapperProps {
  templateId: string;
  fields?: Array<{ id: string; name?: string; label_ar: string }>;
}

const FONT_FAMILIES = [
  { value: 'Cairo', label: 'Cairo (عربي)' },
  { value: 'Tajawal', label: 'Tajawal (عربي)' },
  { value: 'Amiri', label: 'Amiri (عربي)' },
  { value: 'Noto Kufi Arabic', label: 'Noto Kufi (عربي)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Georgia', label: 'Georgia' },
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
  rotation: 0,
  opacity: 1,
  z_index: 1,
};

export function TemplateMapper({ templateId, fields = [] }: TemplateMapperProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [showGrid, setShowGrid] = useState(true);
  const [showAddElement, setShowAddElement] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 794, height: 1123 });
  const [formFields, setFormFields] = useState<Array<{ id: string; label_ar: string }>>([]);
  const [activeTab, setActiveTab] = useState<'elements' | 'properties' | 'canvas'>('elements');

  // ============================================================
  // LOAD (Firestore first, fallback MySQL)
  // ============================================================
  useEffect(() => {
    loadCanvasData();
    loadFormFields();
  }, [templateId]);

  const loadCanvasData = async () => {
    setIsLoading(true);
    try {
      // Try Firestore first
      const firestoreCanvas = await getTemplateCanvas(templateId);
      if (firestoreCanvas) {
        if (firestoreCanvas.background_url) setBackgroundImage(firestoreCanvas.background_url);
        if (firestoreCanvas.elements) {
          setElements(firestoreCanvas.elements.map((el: any) => ({
            ...DEFAULT_ELEMENT,
            ...el,
          })));
        }
        if (firestoreCanvas.canvas_width && firestoreCanvas.canvas_height) {
          setCanvasSize({ width: firestoreCanvas.canvas_width, height: firestoreCanvas.canvas_height });
        }
      } else {
        // Fallback to MySQL
        try {
          const response = await api.get(`/admin/templates/${templateId}/canvas`);
          if (response.success && response.data) {
            if (response.data.background_url) setBackgroundImage(response.data.background_url);
            if (response.data.elements) setElements(response.data.elements);
            if (response.data.canvas_size) setCanvasSize(response.data.canvas_size);
          }
        } catch (e) {
          console.log('No MySQL canvas found, starting fresh');
        }
      }
    } catch (error) {
      console.error('Canvas load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFormFields = async () => {
    if (fields.length > 0) {
      setFormFields(fields);
      return;
    }
    try {
      const form = await getDynamicForm(templateId);
      if (form?.fields) {
        setFormFields(form.fields.map(f => ({ id: f.id, label_ar: f.label_ar })));
      }
    } catch (e) {
      console.log('No form fields found');
    }
  };

  // ============================================================
  // SAVE (Firestore + MySQL)
  // ============================================================
  const saveCanvas = async () => {
    setIsSaving(true);
    try {
      const canvasData: TemplateCanvas = {
        template_id: templateId,
        background_url: backgroundImage || '',
        background_type: 'image' as const,
        canvas_width: canvasSize.width,
        canvas_height: canvasSize.height,
        orientation: (canvasSize.width > canvasSize.height ? 'landscape' : 'portrait') as 'portrait' | 'landscape',
        elements: elements.map(el => ({
          id: el.id,
          field_id: el.mapped_field || '',
          label: el.label,
          x: el.x_position,
          y: el.y_position,
          width: el.width,
          height: el.height,
          font_size: el.font_size,
          font_family: el.font_family,
          font_weight: (el.font_weight || 'normal') as 'normal' | 'bold',
          color: el.color,
          text_align: (el.text_align || 'right') as 'right' | 'center' | 'left',
          rotation: el.rotation || 0,
          max_lines: 1,
          is_visible: true,
        })),
        variants: [],
        updated_at: new Date().toISOString(),
      };

      // Save to Firestore (primary)
      await saveTemplateCanvas(templateId, canvasData);

      // Sync to MySQL
      try {
        await api.put(`/admin/templates/${templateId}/canvas`, {
          background_url: backgroundImage,
          elements,
          canvas_size: canvasSize,
        });
      } catch (e) {
        console.log('MySQL canvas sync skipped');
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Canvas save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // BACKGROUND UPLOAD
  // ============================================================
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('background', file);
      const response = await api.post(`/admin/templates/${templateId}/canvas/background`, formData);
      if (response.success) {
        setBackgroundImage(response.data.url);
        setHasChanges(true);
      }
    } catch (error) {
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      setHasChanges(true);
    }

    // Auto-detect image dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width > 0 && img.height > 0) {
        setCanvasSize({ width: img.width, height: img.height });
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // ============================================================
  // ELEMENT OPERATIONS
  // ============================================================
  const addElement = (type: CanvasElement['type'] = 'text') => {
    const newElement: CanvasElement = {
      ...DEFAULT_ELEMENT,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      element_id: `field_${elements.length + 1}`,
      type,
      label: type === 'text' ? 'حقل نص' : type === 'image' ? 'صورة' : type === 'qrcode' ? 'QR Code' : type === 'date' ? 'تاريخ' : type === 'line' ? 'خط' : 'مستطيل',
      x_position: 100 + elements.length * 20,
      y_position: 100 + elements.length * 20,
      z_index: elements.length + 1,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setHasChanges(true);
    setShowAddElement(false);
  };

  const removeElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElement === elementId) setSelectedElement(null);
    setHasChanges(true);
  };

  const duplicateElement = (elementId: string) => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return;
    const newEl: CanvasElement = {
      ...el,
      id: `el_${Date.now()}`,
      label: el.label + ' (نسخة)',
      x_position: el.x_position + 30,
      y_position: el.y_position + 30,
    };
    setElements([...elements, newEl]);
    setSelectedElement(newEl.id);
    setHasChanges(true);
  };

  const updateElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === elementId ? { ...el, ...updates } : el));
    setHasChanges(true);
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================
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
    const newX = Math.max(0, Math.min((e.clientX - canvasRect.left) / zoom - dragOffset.x, canvasSize.width - 50));
    const newY = Math.max(0, Math.min((e.clientY - canvasRect.top) / zoom - dragOffset.y, canvasSize.height - 20));
    updateElement(selectedElement, { x_position: Math.round(newX), y_position: Math.round(newY) });
  }, [isDragging, selectedElement, dragOffset, zoom, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // ============================================================
  // AUTO-MAP FIELDS
  // ============================================================
  const autoMapFields = () => {
    if (formFields.length === 0) return;
    const unmappedElements = elements.filter(el => !el.mapped_field && el.type === 'text');
    const unmappedFields = formFields.filter(f => !elements.some(el => el.mapped_field === f.id));
    const updates = [...elements];
    unmappedElements.forEach((el, i) => {
      if (i < unmappedFields.length) {
        const idx = updates.findIndex(u => u.id === el.id);
        if (idx !== -1) {
          updates[idx] = { ...updates[idx], mapped_field: unmappedFields[i].id, label: unmappedFields[i].label_ar };
        }
      }
    });
    setElements(updates);
    setHasChanges(true);
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
          <button onClick={() => setShowAddElement(true)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all flex items-center gap-1">
            ➕ إضافة إطار
          </button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <button onClick={() => setZoom(Math.min(zoom + 0.1, 2))} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" title="تكبير">🔍+</button>
          <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" title="تصغير">🔍-</button>
          <button onClick={() => setZoom(0.8)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" title="إعادة تعيين">↩️</button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg transition-all ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="الشبكة">
            📐
          </button>

          {formFields.length > 0 && (
            <button onClick={autoMapFields} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition-all" title="ربط تلقائي">
              🔗 ربط تلقائي
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-200">
              تغييرات غير محفوظة
            </span>
          )}
          <button onClick={saveCanvas} disabled={isSaving || !hasChanges} className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-1">
            {isSaving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الحفظ...</> : <>💾 حفظ التخطيط</>}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-4 gap-4">
        {/* Canvas Area */}
        <div className="col-span-3 bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-auto" style={{ maxHeight: '75vh' }}>
          {!backgroundImage ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              <span className="text-5xl mb-4">🖼️</span>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">رفع صورة القالب</h3>
              <p className="text-sm text-gray-500 mb-4">ارفع صورة التصميم الأساسية (PNG, JPG, PDF)</p>
              <label className="cursor-pointer px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm">
                <input type="file" accept="image/*,.pdf" onChange={handleBackgroundUpload} className="hidden" />
                📤 اختر صورة
              </label>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="relative mx-auto border border-gray-300 shadow-lg bg-white cursor-crosshair"
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
              {/* Grid */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
                  backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                }} />
              )}

              {/* Elements */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move select-none transition-shadow ${
                    selectedElement === element.id ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : 'hover:ring-1 hover:ring-blue-300'
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
                    backgroundColor: selectedElement === element.id ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                    border: `1px ${selectedElement === element.id ? 'solid' : 'dashed'} rgba(59,130,246,${selectedElement === element.id ? '0.5' : '0.3'})`,
                    borderRadius: '4px',
                    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                    opacity: element.opacity ?? 1,
                    zIndex: element.z_index ?? 1,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id); }}
                >
                  <span className="truncate px-1">{element.placeholder_text || element.label}</span>
                  {selectedElement === element.id && (
                    <div className="absolute -top-5 right-0 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-50">
                      {element.label} ({Math.round(element.x_position)}, {Math.round(element.y_position)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['elements', 'properties', 'canvas'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'elements' ? '📋 الإطارات' : tab === 'properties' ? '⚙️ الخصائص' : '🖼️ الكانفاس'}
              </button>
            ))}
          </div>

          {/* Elements Tab */}
          {activeTab === 'elements' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">الإطارات ({elements.length})</h3>
              </div>
              <div className="p-2 max-h-[50vh] overflow-y-auto">
                {elements.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">لا توجد إطارات</p>
                ) : (
                  <div className="space-y-1">
                    {elements.map((el) => (
                      <div key={el.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${selectedElement === el.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} onClick={() => { setSelectedElement(el.id); setActiveTab('properties'); }}>
                        <div className="flex items-center gap-2">
                          <span>{el.type === 'text' ? '📝' : el.type === 'image' ? '🖼️' : el.type === 'qrcode' ? '📱' : '📅'}</span>
                          <div>
                            <span className="truncate block max-w-[100px]">{el.label}</span>
                            {el.mapped_field && <span className="text-[10px] text-green-500">🔗 {el.mapped_field}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }} className="text-gray-400 hover:text-gray-600 p-1" title="نسخ">📋</button>
                          <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="text-red-400 hover:text-red-600 p-1" title="حذف">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && selectedEl && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3 max-h-[60vh] overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">⚙️ خصائص: {selectedEl.label}</h3>

              {/* Label */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">التسمية</label>
                <input type="text" value={selectedEl.label} onChange={e => updateElement(selectedEl.id, { label: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
              </div>

              {/* Mapped Field */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">ربط بحقل</label>
                <select value={selectedEl.mapped_field || ''} onChange={e => updateElement(selectedEl.id, { mapped_field: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                  <option value="">بدون ربط</option>
                  {formFields.map(f => <option key={f.id} value={f.id}>{f.label_ar}</option>)}
                </select>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">X</label>
                  <input type="number" value={selectedEl.x_position} onChange={e => updateElement(selectedEl.id, { x_position: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Y</label>
                  <input type="number" value={selectedEl.y_position} onChange={e => updateElement(selectedEl.id, { y_position: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">العرض</label>
                  <input type="number" value={selectedEl.width} onChange={e => updateElement(selectedEl.id, { width: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الارتفاع</label>
                  <input type="number" value={selectedEl.height} onChange={e => updateElement(selectedEl.id, { height: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">الخط</label>
                <select value={selectedEl.font_family} onChange={e => updateElement(selectedEl.id, { font_family: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Font Size & Color */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">حجم الخط</label>
                  <input type="number" value={selectedEl.font_size} onChange={e => updateElement(selectedEl.id, { font_size: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">اللون</label>
                  <div className="flex gap-1">
                    <input type="color" value={selectedEl.color} onChange={e => updateElement(selectedEl.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border" />
                    <input type="text" value={selectedEl.color} onChange={e => updateElement(selectedEl.id, { color: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
                  </div>
                </div>
              </div>

              {/* Text Formatting */}
              <div className="flex items-center gap-1">
                <button onClick={() => updateElement(selectedEl.id, { font_weight: selectedEl.font_weight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded ${selectedEl.font_weight === 'bold' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <strong>B</strong>
                </button>
                <button onClick={() => updateElement(selectedEl.id, { font_style: selectedEl.font_style === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded ${selectedEl.font_style === 'italic' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <em>I</em>
                </button>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                {['right', 'center', 'left'].map(align => (
                  <button key={align} onClick={() => updateElement(selectedEl.id, { text_align: align })} className={`p-1.5 rounded text-xs ${selectedEl.text_align === align ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {align === 'right' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                  </button>
                ))}
              </div>

              {/* Rotation & Opacity */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الدوران</label>
                  <input type="range" min="-180" max="180" value={selectedEl.rotation || 0} onChange={e => updateElement(selectedEl.id, { rotation: Number(e.target.value) })} className="w-full" />
                  <span className="text-[10px] text-gray-400">{selectedEl.rotation || 0}°</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الشفافية</label>
                  <input type="range" min="0" max="1" step="0.1" value={selectedEl.opacity ?? 1} onChange={e => updateElement(selectedEl.id, { opacity: Number(e.target.value) })} className="w-full" />
                  <span className="text-[10px] text-gray-400">{Math.round((selectedEl.opacity ?? 1) * 100)}%</span>
                </div>
              </div>

              {/* Placeholder */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">نص المعاينة</label>
                <input type="text" value={selectedEl.placeholder_text || ''} onChange={e => updateElement(selectedEl.id, { placeholder_text: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="النص الذي يظهر في المعاينة" />
              </div>
            </div>
          )}

          {activeTab === 'properties' && !selectedEl && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <span className="text-3xl block mb-2">👆</span>
              <p className="text-sm text-gray-500">اختر إطاراً لتعديل خصائصه</p>
            </div>
          )}

          {/* Canvas Tab */}
          {activeTab === 'canvas' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">🖼️ إعدادات الكانفاس</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">العرض (px)</label>
                  <input type="number" value={canvasSize.width} onChange={e => { setCanvasSize({ ...canvasSize, width: Number(e.target.value) }); setHasChanges(true); }} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الارتفاع (px)</label>
                  <input type="number" value={canvasSize.height} onChange={e => { setCanvasSize({ ...canvasSize, height: Number(e.target.value) }); setHasChanges(true); }} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ label: 'A4', w: 794, h: 1123 }, { label: 'A4 أفقي', w: 1123, h: 794 }, { label: 'A3', w: 1123, h: 1587 }, { label: 'شهادة', w: 1056, h: 816 }].map(preset => (
                  <button key={preset.label} onClick={() => { setCanvasSize({ width: preset.w, height: preset.h }); setHasChanges(true); }} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-all">
                    {preset.label}
                  </button>
                ))}
              </div>
              {backgroundImage && (
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*,.pdf" onChange={handleBackgroundUpload} className="hidden" />
                  <div className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm text-center hover:bg-gray-200 transition-all cursor-pointer">
                    📤 تغيير صورة الخلفية
                  </div>
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Element Modal */}
      {showAddElement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddElement(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إضافة إطار جديد</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'text' as const, icon: '📝', label: 'نص' },
                { type: 'image' as const, icon: '🖼️', label: 'صورة' },
                { type: 'date' as const, icon: '📅', label: 'تاريخ' },
                { type: 'qrcode' as const, icon: '📱', label: 'QR Code' },
                { type: 'line' as const, icon: '➖', label: 'خط' },
                { type: 'rect' as const, icon: '⬜', label: 'مستطيل' },
              ].map(item => (
                <button key={item.type} onClick={() => addElement(item.type)} className="h-20 flex flex-col items-center justify-center gap-2 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs text-gray-600">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateMapper;
