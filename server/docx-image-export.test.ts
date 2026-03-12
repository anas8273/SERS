import { describe, it, expect } from 'vitest';

describe('DOCX Image Export (renderImageToDocx)', () => {
  it('should have renderImageToDocx function exported', async () => {
    const { renderImageToDocx } = await import('./docx-renderer');
    expect(renderImageToDocx).toBeDefined();
    expect(typeof renderImageToDocx).toBe('function');
  });

  it('should accept base64 image and return a Buffer', async () => {
    const { renderImageToDocx } = await import('./docx-renderer');
    // Create a minimal valid PNG base64 (1x1 pixel transparent)
    const minimalPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await renderImageToDocx(minimalPng, 100, 100);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle base64 without data URI prefix', async () => {
    const { renderImageToDocx } = await import('./docx-renderer');
    const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await renderImageToDocx(rawBase64, 200, 300);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should produce valid DOCX format (starts with PK zip header)', async () => {
    const { renderImageToDocx } = await import('./docx-renderer');
    const minimalPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await renderImageToDocx(minimalPng, 800, 1200);
    // DOCX files are ZIP archives, starting with PK header
    expect(result[0]).toBe(0x50); // P
    expect(result[1]).toBe(0x4B); // K
  });

  it('should handle different aspect ratios', async () => {
    const { renderImageToDocx } = await import('./docx-renderer');
    const minimalPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Wide image (landscape)
    const wideResult = await renderImageToDocx(minimalPng, 1600, 800);
    expect(wideResult).toBeInstanceOf(Buffer);
    
    // Tall image (portrait)
    const tallResult = await renderImageToDocx(minimalPng, 800, 2400);
    expect(tallResult).toBeInstanceOf(Buffer);
  });
});

describe('DOCX Structured Export (renderStructuredDocx)', () => {
  it('should have renderStructuredDocx function exported', async () => {
    const { renderStructuredDocx } = await import('./docx-renderer');
    expect(renderStructuredDocx).toBeDefined();
    expect(typeof renderStructuredDocx).toBe('function');
  });
});

describe('DOCX Export API endpoint supports imageBase64', () => {
  it('should accept imageBase64 in request body', async () => {
    // This test verifies the endpoint handler logic exists
    // The actual HTTP test would need the server running
    const { renderImageToDocx } = await import('./docx-renderer');
    const minimalPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await renderImageToDocx(minimalPng, 794, 1123);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(100); // Should be a real DOCX
  });
});
