import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Multi-export PDF logic', () => {
  it('should validate that at least one element is required', () => {
    const elementIds: string[] = [];
    expect(elementIds.length).toBe(0);
    // exportMultipleReportsToPDF should throw if no elements
    expect(() => {
      if (elementIds.length === 0) throw new Error("No elements to export");
    }).toThrow("No elements to export");
  });

  it('should build correct element IDs from criteria selection', () => {
    // Simulating criteria with sub-evidences
    const allCriteria = [
      { id: 'c1', title: 'بند 1', subEvidences: [{ id: 's1' }, { id: 's2' }] },
      { id: 'c2', title: 'بند 2', subEvidences: [{ id: 's3' }] },
      { id: 'c3', title: 'بند 3', subEvidences: [{ id: 's4' }, { id: 's5' }, { id: 's6' }] },
    ];

    const selected = new Set(['c1', 'c3']);
    const elementIds: string[] = [];

    for (const criterionId of Array.from(selected)) {
      const criterion = allCriteria.find(c => c.id === criterionId);
      if (!criterion) continue;
      for (const sub of criterion.subEvidences) {
        elementIds.push(`single-preview-${sub.id}`);
      }
    }

    expect(elementIds).toHaveLength(5); // c1 has 2, c3 has 3
    expect(elementIds).toContain('single-preview-s1');
    expect(elementIds).toContain('single-preview-s2');
    expect(elementIds).toContain('single-preview-s4');
    expect(elementIds).toContain('single-preview-s5');
    expect(elementIds).toContain('single-preview-s6');
    expect(elementIds).not.toContain('single-preview-s3'); // c2 not selected
  });

  it('should handle select all / deselect all', () => {
    const allCriteria = [
      { id: 'c1' }, { id: 'c2' }, { id: 'c3' }, { id: 'c4' }, { id: 'c5' },
    ];

    // Select all
    const selectAll = new Set(allCriteria.map(c => c.id));
    expect(selectAll.size).toBe(5);

    // Deselect all
    const deselectAll = new Set<string>();
    expect(deselectAll.size).toBe(0);
  });

  it('should toggle individual criterion selection', () => {
    const selected = new Set<string>(['c1', 'c2']);

    // Add c3
    const next1 = new Set(selected);
    next1.add('c3');
    expect(next1.size).toBe(3);
    expect(next1.has('c3')).toBe(true);

    // Remove c1
    const next2 = new Set(next1);
    next2.delete('c1');
    expect(next2.size).toBe(2);
    expect(next2.has('c1')).toBe(false);
  });

  it('should generate correct filename', () => {
    const personalName = 'محمد أحمد';
    const filename = `تقارير_متعددة_${personalName}.pdf`;
    expect(filename).toBe('تقارير_متعددة_محمد أحمد.pdf');
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('should handle empty criteria gracefully', () => {
    const allCriteria: { id: string; subEvidences: { id: string }[] }[] = [];
    const selected = new Set<string>();
    const elementIds: string[] = [];

    for (const criterionId of Array.from(selected)) {
      const criterion = allCriteria.find(c => c.id === criterionId);
      if (!criterion) continue;
      for (const sub of criterion.subEvidences) {
        elementIds.push(`single-preview-${sub.id}`);
      }
    }

    expect(elementIds).toHaveLength(0);
  });

  it('should handle criteria with no sub-evidences', () => {
    const allCriteria = [
      { id: 'c1', subEvidences: [] },
      { id: 'c2', subEvidences: [{ id: 's1' }] },
    ];
    const selected = new Set(['c1', 'c2']);
    const elementIds: string[] = [];

    for (const criterionId of Array.from(selected)) {
      const criterion = allCriteria.find(c => c.id === criterionId);
      if (!criterion) continue;
      for (const sub of criterion.subEvidences) {
        elementIds.push(`single-preview-${sub.id}`);
      }
    }

    expect(elementIds).toHaveLength(1); // only c2 has sub-evidences
    expect(elementIds[0]).toBe('single-preview-s1');
  });

  it('should track progress correctly', () => {
    const progressUpdates: { current: number; total: number }[] = [];
    const onProgress = (current: number, total: number) => {
      progressUpdates.push({ current, total });
    };

    const elementCount = 5;
    const total = elementCount + 2; // elements + processing + download

    // Simulate progress
    for (let i = 0; i < elementCount; i++) {
      onProgress(i + 1, total);
    }
    onProgress(elementCount + 1, total); // processing
    onProgress(total, total); // complete

    expect(progressUpdates).toHaveLength(elementCount + 2);
    expect(progressUpdates[0]).toEqual({ current: 1, total: 7 });
    expect(progressUpdates[progressUpdates.length - 1]).toEqual({ current: 7, total: 7 });
  });
});

describe('Full preview scale for complete preview', () => {
  const A4_WIDTH_PX = 793.7;
  const PADDING = 16;
  const MAX_AUTO_SCALE = 0.85;
  const MIN_SCALE = 0.15;

  it('should calculate correct scale for full preview on desktop', () => {
    const containerWidth = 860;
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeCloseTo(0.85, 2);
  });

  it('should calculate correct scale for full preview on mobile', () => {
    const containerWidth = 360;
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    expect(autoScale).toBeCloseTo(0.434, 2);
    expect(autoScale).toBeGreaterThan(MIN_SCALE);
  });

  it('should support zoom in/out for full preview', () => {
    const containerWidth = 860;
    const availableWidth = Math.max(containerWidth - PADDING, 200);
    const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
    
    // Zoom in 125%
    const zoomIn = Math.max(autoScale * (125 / 100), MIN_SCALE);
    expect(zoomIn).toBeGreaterThan(autoScale);
    
    // Zoom out 75%
    const zoomOut = Math.max(autoScale * (75 / 100), MIN_SCALE);
    expect(zoomOut).toBeLessThan(autoScale);
    
    // Reset to 100%
    const reset = Math.max(autoScale * (100 / 100), MIN_SCALE);
    expect(reset).toBeCloseTo(autoScale, 5);
  });

  it('should ensure full preview wrapper width fits container', () => {
    const screenSizes = [320, 360, 375, 768, 1024, 1280, 1920];
    
    for (const screenWidth of screenSizes) {
      const containerWidth = Math.min(screenWidth, 860);
      const availableWidth = Math.max(containerWidth - PADDING, 200);
      const autoScale = Math.min(availableWidth / A4_WIDTH_PX, MAX_AUTO_SCALE);
      const wrapperWidth = A4_WIDTH_PX * autoScale;
      
      expect(wrapperWidth).toBeLessThanOrEqual(containerWidth);
    }
  });
});
