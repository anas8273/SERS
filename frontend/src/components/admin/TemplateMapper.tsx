'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getTemplateCanvas, saveTemplateCanvas, getDynamicForm } from '@/lib/firestore-service';
import type { TemplateCanvas, CanvasElement as FirestoreCanvasElement } from '@/types';

// ============================================================
// TEMPLATE MAPPER (Visual Canvas X/Y Coordinate Editor)
// Admin uploads background → clicks on image to create labels →
// Drags labels to exact positions → Saves X/Y to Firestore
// Coordinates are stored as PERCENTAGES (0-100) for responsive rendering
// ============================================================

interface CanvasElement {
  id: string;
  field_id: string;
  type: 'text' | 'image' | 'date' | 'qrcode' | 'line' | 'rect';
  label: string;
  // Percentage-based coordinates (0-100)
  x: number;
  y: number;
  width: number;
  height: number;
  // Styling
  font_size: number;
  font_family: string;
  font_weight: 'normal' | 'bold';
  color: string;
  text_align: 'right' | 'center' | 'left';
  rotation: number;
  max_lines: number;
  is_visible: boolean;
  // Extra display props
  placeholder_text?: string;
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
  field_id: '',
  type: 'text',
  label: 'حقل جديد',
  x: 10,
  y: 10,
  width: 25,
  height: 4,
  font_size: 16,
  font_family: 'Cairo',
  font_weight: 'normal',
  color: '#000000',
  text_align: 'center',
  rotation: 0,
  max_lines: 1,
  is_visible: true,
  placeholder_text: 'نص تجريبي',
  opacity: 1,
  z_index: 1,
};

type InteractionMode = 'select' | 'add_text' | 'add_image' | 'add_date' | 'add_qrcode';

export function TemplateMapper({ templateId, fields = [] }: TemplateMapperProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundDataUrl, setBackgroundDataUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [zoom, setZoom] = useState(0.75);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 794, height: 1123 });
  const [formFields, setFormFields] = useState<Array<{ id: string; label_ar: string }>>([]);
  const [activeTab, setActiveTab] = useState<'elements' | 'properties' | 'canvas'>('elements');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddPos, setQuickAddPos] = useState({ x: 0, y: 0 });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    loadCanvasData();
    loadFormFields();
  }, [templateId]);

  const loadCanvasData = async () => {
    setIsLoading(true);
    try {
      const firestoreCanvas = await getTemplateCanvas(templateId);
      if (firestoreCanvas) {
        if (firestoreCanvas.background_url) {
          setBackgroundImage(firestoreCanvas.background_url);
        }
        if (firestoreCanvas.elements) {
          setElements(firestoreCanvas.elements.map((el: any) => ({
            ...DEFAULT_ELEMENT,
            ...el,
            // Ensure percentage-based coords
            x: el.x ?? 10,
            y: el.y ?? 10,
            width: el.width ?? 25,
            height: el.height ?? 4,
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
            if (response.data.elements) {
              // Convert pixel coords to percentage if coming from old format
              const cw = response.data.canvas_size?.width || 794;
              const ch = response.data.canvas_size?.height || 1123;
              setElements(response.data.elements.map((el: any) => ({
                ...DEFAULT_ELEMENT,
                ...el,
                x: el.x ?? (el.x_position ? (el.x_position / cw) * 100 : 10),
                y: el.y ?? (el.y_position ? (el.y_position / ch) * 100 : 10),
                width: el.width ?? ((el.width_px || 200) / cw) * 100,
                height: el.height ?? ((el.height_px || 40) / ch) * 100,
                field_id: el.field_id || el.mapped_field || '',
              })));
            }
            if (response.data.canvas_size) setCanvasSize(response.data.canvas_size);
          }
        } catch (e) {
          console.log('No existing canvas data, starting fresh');
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
  // SAVE TO FIRESTORE
  // ============================================================
  const saveCanvas = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const canvasData: TemplateCanvas = {
        template_id: templateId,
        background_url: backgroundImage || '',
        background_type: 'image',
        canvas_width: canvasSize.width,
        canvas_height: canvasSize.height,
        orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
        elements: elements.map(el => ({
          id: el.id,
          field_id: el.field_id || '',
          label: el.label,
          x: Math.round(el.x * 100) / 100,
          y: Math.round(el.y * 100) / 100,
          width: Math.round(el.width * 100) / 100,
          height: Math.round(el.height * 100) / 100,
          font_size: el.font_size,
          font_family: el.font_family,
          font_weight: el.font_weight,
          color: el.color,
          text_align: el.text_align,
          rotation: el.rotation || 0,
          max_lines: el.max_lines || 1,
          is_visible: el.is_visible !== false,
        })),
        variants: [],
        updated_at: new Date().toISOString(),
      };

      await saveTemplateCanvas(templateId, canvasData);

      // Also sync to MySQL (best effort)
      try {
        await api.put(`/admin/templates/${templateId}/canvas`, {
          background_url: backgroundImage,
          elements: elements,
          canvas_size: canvasSize,
        });
      } catch (e) {
        console.log('MySQL canvas sync skipped');
      }

      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Canvas save error:', error);
      alert('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
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

    // Create local preview immediately
    const localUrl = URL.createObjectURL(file);
    setBackgroundImage(localUrl);

    // Also store as data URL for persistence
    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Try uploading to server
    try {
      const formData = new FormData();
      formData.append('background', file);
      const response = await api.post(`/admin/templates/${templateId}/canvas/background`, formData);
      if (response.success && response.data?.url) {
        setBackgroundImage(response.data.url);
      }
    } catch (error) {
      console.log('Server upload failed, using local preview');
      // Keep local URL - will use data URL when saving
    }

    // Auto-detect image dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width > 0 && img.height > 0) {
        setCanvasSize({ width: img.width, height: img.height });
      }
    };
    img.src = localUrl;
    setHasChanges(true);
  };

  // ============================================================
  // CLICK ON CANVAS TO ADD LABEL
  // ============================================================
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging || isResizing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate percentage position
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (interactionMode === 'select') {
      // Deselect if clicking on empty space
      setSelectedElement(null);
      return;
    }

    // Add element at click position
    const typeMap: Record<string, CanvasElement['type']> = {
      'add_text': 'text',
      'add_image': 'image',
      'add_date': 'date',
      'add_qrcode': 'qrcode',
    };

    const type = typeMap[interactionMode] || 'text';
    addElementAt(type, clickX, clickY);

    // Switch back to select mode after adding
    setInteractionMode('select');
  };

  const handleCanvasRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setQuickAddPos({ x: clickX, y: clickY });
    setShowQuickAdd(true);
  };

  // ============================================================
  // ELEMENT OPERATIONS
  // ============================================================
  const addElementAt = (type: CanvasElement['type'], x: number, y: number) => {
    const labelMap: Record<string, string> = {
      'text': 'حقل نص',
      'image': 'صورة',
      'date': 'تاريخ',
      'qrcode': 'QR Code',
      'line': 'خط',
      'rect': 'مستطيل',
    };

    const newElement: CanvasElement = {
      ...DEFAULT_ELEMENT,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      label: labelMap[type] || 'عنصر',
      x: Math.max(0, Math.min(x - 12.5, 75)),
      y: Math.max(0, Math.min(y - 2, 96)),
      z_index: elements.length + 1,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setActiveTab('properties');
    setHasChanges(true);
    setShowQuickAdd(false);
  };

  const addElement = (type: CanvasElement['type'] = 'text') => {
    const yOffset = (elements.length * 5) % 80;
    addElementAt(type, 37.5, 10 + yOffset);
  };

  const removeElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
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
      x: Math.min(el.x + 3, 90),
      y: Math.min(el.y + 3, 90),
    };
    setElements(prev => [...prev, newEl]);
    setSelectedElement(newEl.id);
    setHasChanges(true);
  };

  const updateElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === elementId ? { ...el, ...updates } : el));
    setHasChanges(true);
  };

  // ============================================================
  // DRAG & DROP (Percentage-based)
  // ============================================================
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDragging(true);
    setSelectedElement(elementId);
    setDragOffset({
      x: clickXPercent - element.x,
      y: clickYPercent - element.y,
    });
  }, [elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElement) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDragging) {
      const newX = Math.max(0, Math.min(mouseXPercent - dragOffset.x, 100 - 5));
      const newY = Math.max(0, Math.min(mouseYPercent - dragOffset.y, 100 - 2));
      updateElement(selectedElement, {
        x: Math.round(newX * 100) / 100,
        y: Math.round(newY * 100) / 100,
      });
    }

    if (isResizing) {
      const el = elements.find(e => e.id === selectedElement);
      if (!el) return;
      if (resizeHandle === 'se') {
        const newW = Math.max(5, mouseXPercent - el.x);
        const newH = Math.max(2, mouseYPercent - el.y);
        updateElement(selectedElement, {
          width: Math.round(newW * 100) / 100,
          height: Math.round(newH * 100) / 100,
        });
      }
    }
  }, [isDragging, isResizing, selectedElement, dragOffset, elements, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedElement(elementId);
  };

  // ============================================================
  // AUTO-MAP FIELDS
  // ============================================================
  const autoMapFields = () => {
    if (formFields.length === 0) return;
    const unmappedElements = elements.filter(el => !el.field_id && el.type === 'text');
    const unmappedFields = formFields.filter(f => !elements.some(el => el.field_id === f.id));
    const updates = [...elements];
    unmappedElements.forEach((el, i) => {
      if (i < unmappedFields.length) {
        const idx = updates.findIndex(u => u.id === el.id);
        if (idx !== -1) {
          updates[idx] = { ...updates[idx], field_id: unmappedFields[i].id, label: unmappedFields[i].label_ar };
        }
      }
    });
    setElements(updates);
    setHasChanges(true);
  };

  // Quick-add all form fields as elements
  const addAllFormFields = () => {
    if (formFields.length === 0) return;
    const newElements: CanvasElement[] = formFields
      .filter(f => !elements.some(el => el.field_id === f.id))
      .map((field, i) => ({
        ...DEFAULT_ELEMENT,
        id: `el_${Date.now()}_${i}`,
        field_id: field.id,
        label: field.label_ar,
        x: 20,
        y: 10 + (i * 6) % 80,
        z_index: elements.length + i + 1,
      }));

    if (newElements.length === 0) {
      alert('جميع الحقول مضافة بالفعل!');
      return;
    }

    setElements(prev => [...prev, ...newElements]);
    setHasChanges(true);
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  // ============================================================
  // CURSOR STYLE
  // ============================================================
  const getCursorStyle = () => {
    if (isDragging) return 'grabbing';
    if (interactionMode !== 'select') return 'crosshair';
    return 'default';
  };

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
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setInteractionMode('select')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${interactionMode === 'select' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="وضع التحديد"
            >
              ↖️ تحديد
            </button>
            <button
              onClick={() => setInteractionMode('add_text')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${interactionMode === 'add_text' ? 'bg-white dark:bg-gray-600 shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="انقر على الصورة لإضافة حقل نص"
            >
              📝 نص
            </button>
            <button
              onClick={() => setInteractionMode('add_date')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${interactionMode === 'add_date' ? 'bg-white dark:bg-gray-600 shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="انقر على الصورة لإضافة تاريخ"
            >
              📅 تاريخ
            </button>
            <button
              onClick={() => setInteractionMode('add_image')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${interactionMode === 'add_image' ? 'bg-white dark:bg-gray-600 shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="انقر على الصورة لإضافة صورة"
            >
              🖼️ صورة
            </button>
            <button
              onClick={() => setInteractionMode('add_qrcode')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${interactionMode === 'add_qrcode' ? 'bg-white dark:bg-gray-600 shadow text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="انقر على الصورة لإضافة QR"
            >
              📱 QR
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Zoom */}
          <button onClick={() => setZoom(Math.min(zoom + 0.1, 2))} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 text-xs" title="تكبير">🔍+</button>
          <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 text-xs" title="تصغير">🔍-</button>
          <button onClick={() => setZoom(0.75)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 text-xs" title="إعادة تعيين">↩️</button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-all text-xs ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="الشبكة"
          >
            📐
          </button>

          {formFields.length > 0 && (
            <>
              <button onClick={autoMapFields} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition-all" title="ربط تلقائي">
                🔗 ربط تلقائي
              </button>
              <button onClick={addAllFormFields} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-all" title="إضافة جميع الحقول">
                ➕ إضافة كل الحقول
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-200">
              تغييرات غير محفوظة
            </span>
          )}
          {saveSuccess && (
            <span className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full border border-green-200">
              ✅ تم الحفظ بنجاح
            </span>
          )}
          <button
            onClick={saveCanvas}
            disabled={isSaving || !hasChanges}
            className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {isSaving ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الحفظ...</>
            ) : (
              <>💾 حفظ في Firestore</>
            )}
          </button>
        </div>
      </div>

      {/* Interaction Mode Hint */}
      {interactionMode !== 'select' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-500 text-lg">👆</span>
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              انقر على أي مكان في الصورة لإضافة {interactionMode === 'add_text' ? 'حقل نص' : interactionMode === 'add_date' ? 'تاريخ' : interactionMode === 'add_image' ? 'صورة' : 'QR Code'}
            </span>
          </div>
          <button onClick={() => setInteractionMode('select')} className="text-xs text-blue-500 hover:text-blue-700 underline">
            إلغاء
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-4 gap-4">
        {/* Canvas Area (3/4) */}
        <div
          ref={canvasContainerRef}
          className="col-span-3 bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-auto"
          style={{ maxHeight: '78vh' }}
        >
          {!backgroundImage ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
              <span className="text-6xl mb-4">🖼️</span>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">الخطوة الأولى: رفع صورة القالب</h3>
              <p className="text-sm text-gray-500 mb-1">ارفع صورة التصميم الأساسية (شهادة فارغة، نموذج، إلخ)</p>
              <p className="text-xs text-gray-400 mb-4">PNG, JPG, WEBP - يُفضل بدقة عالية</p>
              <label className="cursor-pointer px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm font-medium shadow-lg shadow-blue-500/25">
                <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                📤 اختر صورة القالب
              </label>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="relative mx-auto border border-gray-300 shadow-lg bg-white"
              style={{
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                cursor: getCursorStyle(),
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              onContextMenu={handleCanvasRightClick}
            >
              {/* Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
                  backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
                }} />
              )}

              {/* Percentage Guide Lines (every 25%) */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  {[25, 50, 75].map(p => (
                    <div key={`h${p}`}>
                      <div className="absolute w-full border-t border-dashed border-red-300/30" style={{ top: `${p}%` }} />
                      <div className="absolute h-full border-r border-dashed border-red-300/30" style={{ right: `${p}%` }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Elements */}
              {elements.map((element) => {
                if (!element.is_visible) return null;
                const isSelected = selectedElement === element.id;

                return (
                  <div
                    key={element.id}
                    className={`absolute select-none group transition-shadow ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg z-50' : 'hover:ring-1 hover:ring-blue-300 hover:shadow'
                    }`}
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: `${element.width}%`,
                      height: `${element.height}%`,
                      fontSize: element.font_size * zoom,
                      fontFamily: element.font_family,
                      fontWeight: element.font_weight,
                      color: element.color,
                      textAlign: element.text_align,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: element.text_align === 'center' ? 'center' : element.text_align === 'right' ? 'flex-end' : 'flex-start',
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.05)',
                      border: `${isSelected ? '2px solid' : '1px dashed'} rgba(59,130,246,${isSelected ? '0.6' : '0.3'})`,
                      borderRadius: '3px',
                      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                      opacity: element.opacity ?? 1,
                      zIndex: isSelected ? 999 : (element.z_index ?? 1),
                      cursor: interactionMode === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
                    }}
                    onMouseDown={(e) => {
                      if (interactionMode === 'select') handleMouseDown(e, element.id);
                    }}
                    onClick={(e) => {
                      if (interactionMode === 'select') {
                        e.stopPropagation();
                        setSelectedElement(element.id);
                        setActiveTab('properties');
                      }
                    }}
                  >
                    <span className="truncate px-1 pointer-events-none">
                      {element.placeholder_text || element.label}
                    </span>

                    {/* Label Badge */}
                    {isSelected && (
                      <div className="absolute -top-6 right-0 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded whitespace-nowrap z-[1000] shadow">
                        {element.label} ({element.x.toFixed(1)}%, {element.y.toFixed(1)}%)
                        {element.field_id && <span className="mr-1 text-blue-200">🔗</span>}
                      </div>
                    )}

                    {/* Field mapping indicator */}
                    {element.field_id && !isSelected && (
                      <div className="absolute -top-4 right-0 text-[9px] bg-green-500 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        🔗 مربوط
                      </div>
                    )}

                    {/* Resize Handle */}
                    {isSelected && interactionMode === 'select' && (
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize z-[1001]"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                      />
                    )}
                  </div>
                );
              })}

              {/* Quick Add Context Menu */}
              {showQuickAdd && (
                <div
                  className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-[2000] min-w-[160px]"
                  style={{
                    left: `${quickAddPos.x}%`,
                    top: `${quickAddPos.y}%`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1 text-[10px] text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700 mb-1">
                    إضافة عنصر هنا
                  </div>
                  {[
                    { type: 'text' as const, icon: '📝', label: 'حقل نص' },
                    { type: 'date' as const, icon: '📅', label: 'تاريخ' },
                    { type: 'image' as const, icon: '🖼️', label: 'صورة' },
                    { type: 'qrcode' as const, icon: '📱', label: 'QR Code' },
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => addElementAt(item.type, quickAddPos.x, quickAddPos.y)}
                      className="w-full px-3 py-1.5 text-right text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel (1/4) */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['elements', 'properties', 'canvas'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'elements' ? '📋 العناصر' : tab === 'properties' ? '⚙️ الخصائص' : '🖼️ الكانفاس'}
              </button>
            ))}
          </div>

          {/* Elements Tab */}
          {activeTab === 'elements' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">العناصر ({elements.length})</h3>
                <button onClick={() => addElement('text')} className="text-xs text-blue-500 hover:text-blue-700">+ إضافة</button>
              </div>
              <div className="p-2 max-h-[50vh] overflow-y-auto">
                {elements.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="text-3xl block mb-2">📝</span>
                    <p className="text-xs text-gray-500 mb-2">لا توجد عناصر بعد</p>
                    <p className="text-[10px] text-gray-400">انقر على الصورة أو اضغط زر الماوس الأيمن لإضافة عنصر</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {elements.map((el) => (
                      <div
                        key={el.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                          selectedElement === el.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => { setSelectedElement(el.id); setActiveTab('properties'); }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{el.type === 'text' ? '📝' : el.type === 'image' ? '🖼️' : el.type === 'qrcode' ? '📱' : el.type === 'date' ? '📅' : '⬜'}</span>
                          <div className="min-w-0">
                            <span className="truncate block max-w-[100px]">{el.label}</span>
                            {el.field_id && (
                              <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                                🔗 {formFields.find(f => f.id === el.field_id)?.label_ar || el.field_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3 max-h-[65vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">⚙️ خصائص العنصر</h3>
                <button onClick={() => removeElement(selectedEl.id)} className="text-xs text-red-500 hover:text-red-700">🗑️ حذف</button>
              </div>

              {/* Label */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">التسمية</label>
                <input type="text" value={selectedEl.label} onChange={e => updateElement(selectedEl.id, { label: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
              </div>

              {/* Mapped Field */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">🔗 ربط بحقل النموذج</label>
                <select value={selectedEl.field_id || ''} onChange={e => updateElement(selectedEl.id, { field_id: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700">
                  <option value="">بدون ربط</option>
                  {formFields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label_ar} {elements.some(el => el.field_id === f.id && el.id !== selectedEl.id) ? '(مربوط)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position (Percentage) */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">📍 الموقع (نسبة مئوية)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">X %</label>
                    <input type="number" step="0.1" min="0" max="100" value={selectedEl.x} onChange={e => updateElement(selectedEl.id, { x: Number(e.target.value) })} className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Y %</label>
                    <input type="number" step="0.1" min="0" max="100" value={selectedEl.y} onChange={e => updateElement(selectedEl.id, { y: Number(e.target.value) })} className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700" />
                  </div>
                </div>
              </div>

              {/* Size (Percentage) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">العرض %</label>
                  <input type="number" step="0.5" min="1" max="100" value={selectedEl.width} onChange={e => updateElement(selectedEl.id, { width: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الارتفاع %</label>
                  <input type="number" step="0.5" min="1" max="100" value={selectedEl.height} onChange={e => updateElement(selectedEl.id, { height: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">الخط</label>
                <select value={selectedEl.font_family} onChange={e => updateElement(selectedEl.id, { font_family: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700">
                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Font Size & Color */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">حجم الخط (pt)</label>
                  <input type="number" min="8" max="120" value={selectedEl.font_size} onChange={e => updateElement(selectedEl.id, { font_size: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">اللون</label>
                  <div className="flex gap-1">
                    <input type="color" value={selectedEl.color} onChange={e => updateElement(selectedEl.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border" />
                    <input type="text" value={selectedEl.color} onChange={e => updateElement(selectedEl.id, { color: e.target.value })} className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700" />
                  </div>
                </div>
              </div>

              {/* Text Formatting */}
              <div className="flex items-center gap-1">
                <button onClick={() => updateElement(selectedEl.id, { font_weight: selectedEl.font_weight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded text-sm ${selectedEl.font_weight === 'bold' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <strong>B</strong>
                </button>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                {(['right', 'center', 'left'] as const).map(align => (
                  <button key={align} onClick={() => updateElement(selectedEl.id, { text_align: align })} className={`p-1.5 rounded text-xs ${selectedEl.text_align === align ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {align === 'right' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                  </button>
                ))}
              </div>

              {/* Rotation */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">الدوران ({selectedEl.rotation || 0}°)</label>
                <input type="range" min="-180" max="180" value={selectedEl.rotation || 0} onChange={e => updateElement(selectedEl.id, { rotation: Number(e.target.value) })} className="w-full" />
              </div>

              {/* Max Lines */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">أقصى عدد أسطر</label>
                <input type="number" min="1" max="20" value={selectedEl.max_lines || 1} onChange={e => updateElement(selectedEl.id, { max_lines: Number(e.target.value) })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
              </div>

              {/* Placeholder */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">نص المعاينة</label>
                <input type="text" value={selectedEl.placeholder_text || ''} onChange={e => updateElement(selectedEl.id, { placeholder_text: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" placeholder="النص الذي يظهر في المعاينة" />
              </div>

              {/* Visibility */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedEl.is_visible} onChange={e => updateElement(selectedEl.id, { is_visible: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-xs text-gray-600">مرئي</span>
              </label>
            </div>
          )}

          {activeTab === 'properties' && !selectedEl && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <span className="text-3xl block mb-2">👆</span>
              <p className="text-sm text-gray-500 mb-1">اختر عنصراً لتعديل خصائصه</p>
              <p className="text-xs text-gray-400">أو انقر على الصورة لإضافة عنصر جديد</p>
            </div>
          )}

          {/* Canvas Tab */}
          {activeTab === 'canvas' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">🖼️ إعدادات الكانفاس</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">العرض (px)</label>
                  <input type="number" value={canvasSize.width} onChange={e => { setCanvasSize(prev => ({ ...prev, width: Number(e.target.value) })); setHasChanges(true); }} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الارتفاع (px)</label>
                  <input type="number" value={canvasSize.height} onChange={e => { setCanvasSize(prev => ({ ...prev, height: Number(e.target.value) })); setHasChanges(true); }} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'A4 عمودي', w: 794, h: 1123 },
                  { label: 'A4 أفقي', w: 1123, h: 794 },
                  { label: 'A3', w: 1123, h: 1587 },
                  { label: 'شهادة', w: 1056, h: 816 },
                  { label: 'بطاقة', w: 600, h: 400 },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => { setCanvasSize({ width: preset.w, height: preset.h }); setHasChanges(true); }}
                    className={`px-3 py-1 rounded-lg text-xs transition-all ${
                      canvasSize.width === preset.w && canvasSize.height === preset.h
                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {backgroundImage && (
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                  <div className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm text-center hover:bg-gray-200 transition-all cursor-pointer">
                    📤 تغيير صورة الخلفية
                  </div>
                </label>
              )}

              {/* Canvas Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-[10px] text-gray-400 space-y-1">
                <p>📐 الأبعاد: {canvasSize.width} × {canvasSize.height} px</p>
                <p>📊 الاتجاه: {canvasSize.width > canvasSize.height ? 'أفقي' : 'عمودي'}</p>
                <p>🎯 العناصر: {elements.length}</p>
                <p>🔗 المربوطة: {elements.filter(e => e.field_id).length}</p>
              </div>
            </div>
          )}

          {/* Help Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3">
            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">💡 نصائح</h4>
            <ul className="text-[10px] text-blue-600 dark:text-blue-400 space-y-1">
              <li>• اختر وضع "نص" ثم انقر على الصورة لإضافة حقل</li>
              <li>• اضغط زر الماوس الأيمن لقائمة الإضافة السريعة</li>
              <li>• اسحب العناصر لتحريكها بدقة</li>
              <li>• اربط كل عنصر بحقل من النموذج</li>
              <li>• الإحداثيات بالنسب المئوية (0-100%)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateMapper;
