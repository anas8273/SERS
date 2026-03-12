import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook للمعاينة - يحسب scale ديناميكياً بناءً على عرض الحاوية
 * متوافق مع جميع الأجهزة: موبايل (320px+)، تابلت (768px+)، ديسكتوب
 * 
 * النهج: 
 * - يستخدم ResizeObserver + window resize + fallback timeouts
 * - يحسب scale تلقائياً ليتسع A4 داخل الحاوية
 * - يدعم تكبير/تصغير يدوي
 */

const A4_WIDTH_PX = 793.7; // 210mm in px
const A4_MIN_HEIGHT_PX = 1122.5; // 297mm in px
const PADDING = 16; // 8px each side
const MAX_AUTO_SCALE = 0.85;
const MIN_SCALE = 0.15;

export function usePreviewScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  
  const [manualZoom, setManualZoom] = useState(100);
  const [dimensions, setDimensions] = useState(() => {
    // حساب أولي فوري بناءً على عرض الشاشة
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 800;
    const availW = Math.max(Math.min(screenW, 860) - PADDING * 2, 200);
    const s = Math.min(availW / A4_WIDTH_PX, MAX_AUTO_SCALE);
    return {
      scale: s,
      wrapperWidth: A4_WIDTH_PX * s,
      wrapperHeight: A4_MIN_HEIGHT_PX * s,
    };
  });

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    
    // نحصل على العرض المتاح
    let containerWidth = 0;
    
    if (container) {
      // نحاول getBoundingClientRect أولاً (أدق)
      const rect = container.getBoundingClientRect();
      containerWidth = rect.width;
      
      // fallback إلى clientWidth
      if (containerWidth <= 0) {
        containerWidth = container.clientWidth;
      }
      
      // fallback إلى offsetWidth
      if (containerWidth <= 0) {
        containerWidth = container.offsetWidth;
      }
    }
    
    // إذا لم نحصل على عرض من الحاوية، نستخدم عرض الشاشة
    if (containerWidth <= 0) {
      containerWidth = Math.min(window.innerWidth, 860);
    }
    
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    const finalScale = Math.max(autoScale * (manualZoom / 100), MIN_SCALE);
    
    // ارتفاع الصفحة الفعلي
    const page = pageRef.current;
    const pageHeight = page ? Math.max(page.scrollHeight, A4_MIN_HEIGHT_PX) : A4_MIN_HEIGHT_PX;
    
    setDimensions({
      scale: finalScale,
      wrapperWidth: A4_WIDTH_PX * finalScale,
      wrapperHeight: pageHeight * finalScale,
    });
  }, [manualZoom]);

  // مراقبة تغيير حجم الحاوية + النافذة
  useEffect(() => {
    const container = containerRef.current;
    
    // حساب أولي فوري
    recalculate();

    // ResizeObserver
    let ro: ResizeObserver | null = null;
    if (container) {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(recalculate);
      });
      ro.observe(container);
    }
    
    // مراقبة تغيير حجم النافذة (تدوير الشاشة + resize)
    const handleResize = () => requestAnimationFrame(recalculate);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // تأخيرات متعددة لضمان اكتمال layout على جميع الأجهزة
    const timers = [50, 150, 300, 600, 1200].map(ms => 
      setTimeout(recalculate, ms)
    );

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [recalculate]);

  // مراقبة تغيير حجم الصفحة (عند تحميل محتوى)
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(recalculate);
    });
    ro.observe(page);
    return () => ro.disconnect();
  }, [recalculate]);

  // تكبير
  const zoomIn = useCallback(() => {
    setManualZoom(prev => Math.min(prev + 25, 200));
  }, []);

  // تصغير
  const zoomOut = useCallback(() => {
    setManualZoom(prev => Math.max(prev - 25, 25));
  }, []);

  // إعادة الحجم الأصلي
  const resetZoom = useCallback(() => {
    setManualZoom(100);
  }, []);

  return {
    containerRef,
    pageRef,
    previewScale: dimensions.scale,
    wrapperWidth: dimensions.wrapperWidth,
    wrapperHeight: dimensions.wrapperHeight,
    recalculate,
    zoomLevel: manualZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
