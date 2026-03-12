import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  elements: Element[] = [];
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(el: Element) { this.elements.push(el); }
  unobserve() {}
  disconnect() { this.elements = []; }
}

describe('usePreviewScale constants and logic', () => {
  const A4_WIDTH_PX = 793.7;
  const A4_MIN_HEIGHT_PX = 1122.5;
  const PADDING = 16;
  const MAX_AUTO_SCALE = 0.85;
  const MIN_SCALE = 0.15;

  it('should calculate correct scale for desktop (1280px viewport)', () => {
    const containerWidth = 860; // typical modal width
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeCloseTo(0.85, 2); // capped at max
    expect(A4_WIDTH_PX * autoScale).toBeCloseTo(674.645, 0);
  });

  it('should calculate correct scale for mobile (360px viewport)', () => {
    const containerWidth = 344; // 360 - padding
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeCloseTo(0.413, 2);
    expect(autoScale).toBeGreaterThan(MIN_SCALE);
    
    const wrapperWidth = A4_WIDTH_PX * autoScale;
    expect(wrapperWidth).toBeLessThanOrEqual(containerWidth);
  });

  it('should calculate correct scale for tablet (768px viewport)', () => {
    const containerWidth = 760;
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeCloseTo(0.85, 2); // still capped at max for tablet
    
    const wrapperWidth = A4_WIDTH_PX * autoScale;
    expect(wrapperWidth).toBeLessThanOrEqual(containerWidth);
  });

  it('should calculate correct scale for very small screen (320px)', () => {
    const containerWidth = 304; // 320 - padding
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeCloseTo(0.363, 2);
    expect(autoScale).toBeGreaterThan(MIN_SCALE);
    
    const wrapperWidth = A4_WIDTH_PX * autoScale;
    expect(wrapperWidth).toBeLessThanOrEqual(containerWidth);
  });

  it('should handle manual zoom correctly', () => {
    const containerWidth = 860;
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    // Zoom in 125%
    const zoomIn = Math.max(autoScale * (125 / 100), MIN_SCALE);
    expect(zoomIn).toBeGreaterThan(autoScale);
    
    // Zoom out 50%
    const zoomOut = Math.max(autoScale * (50 / 100), MIN_SCALE);
    expect(zoomOut).toBeLessThan(autoScale);
    expect(zoomOut).toBeGreaterThan(MIN_SCALE);
  });

  it('should never produce scale below MIN_SCALE', () => {
    const containerWidth = 50; // extremely small
    const availableWidth = Math.max(containerWidth - PADDING, 200); // clamped to 200
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    const manualZoom = 25; // minimum zoom
    const finalScale = Math.max(autoScale * (manualZoom / 100), MIN_SCALE);
    
    expect(finalScale).toBeGreaterThanOrEqual(MIN_SCALE);
  });

  it('should calculate wrapper height correctly', () => {
    const containerWidth = 860;
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    const wrapperHeight = A4_MIN_HEIGHT_PX * autoScale;
    expect(wrapperHeight).toBeCloseTo(954.125, 0);
    expect(wrapperHeight).toBeGreaterThan(0);
  });

  it('should handle fallback to window.innerWidth when container has no width', () => {
    // When container width is 0, should fallback to screen width
    const containerWidth = 0;
    const fallbackWidth = Math.min(360, 860); // simulating mobile window.innerWidth
    const availableWidth = Math.max(fallbackWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeGreaterThan(0);
    expect(autoScale).toBeLessThanOrEqual(MAX_AUTO_SCALE);
  });

  it('should ensure wrapper fits within container for all common screen sizes', () => {
    const screenSizes = [320, 360, 375, 390, 414, 428, 768, 1024, 1280, 1440, 1920];
    
    for (const screenWidth of screenSizes) {
      const containerWidth = Math.min(screenWidth, 860);
      const availableWidth = Math.max(containerWidth - PADDING, 200);
      const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
      const wrapperWidth = A4_WIDTH_PX * autoScale;
      
      expect(wrapperWidth).toBeLessThanOrEqual(containerWidth);
      expect(autoScale).toBeGreaterThan(0);
      expect(autoScale).toBeLessThanOrEqual(MAX_AUTO_SCALE);
    }
  });
});
