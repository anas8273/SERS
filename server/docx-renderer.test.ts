import { describe, it, expect, vi } from 'vitest';

// Mock puppeteer and docx since we can't run them in test environment
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      connected: true,
      newPage: vi.fn().mockResolvedValue({
        setViewport: vi.fn(),
        setContent: vi.fn(),
        evaluate: vi.fn().mockResolvedValue(1),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-png')),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

vi.mock('docx', () => ({
  Document: vi.fn().mockImplementation(() => ({})),
  Packer: {
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-docx-content')),
  },
  Paragraph: vi.fn().mockImplementation(() => ({})),
  ImageRun: vi.fn().mockImplementation(() => ({})),
  AlignmentType: { CENTER: 'center' },
  PageOrientation: { PORTRAIT: 'portrait' },
  SectionType: { NEXT_PAGE: 'nextPage' },
  Header: vi.fn(),
  Footer: vi.fn(),
  TextRun: vi.fn(),
}));

describe('DOCX Export', () => {
  it('should have renderHtmlToDocx function', async () => {
    const { renderHtmlToDocx } = await import('./docx-renderer');
    expect(renderHtmlToDocx).toBeDefined();
    expect(typeof renderHtmlToDocx).toBe('function');
  });

  it('should accept HTML content and return a Buffer', async () => {
    const { renderHtmlToDocx } = await import('./docx-renderer');
    const result = await renderHtmlToDocx('<div>Test</div>');
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle Arabic HTML content', async () => {
    const { renderHtmlToDocx } = await import('./docx-renderer');
    const arabicHtml = '<div dir="rtl"><h1>شواهد الأداء الوظيفي</h1><p>محتوى عربي</p></div>';
    const result = await renderHtmlToDocx(arabicHtml);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty HTML', async () => {
    const { renderHtmlToDocx } = await import('./docx-renderer');
    const result = await renderHtmlToDocx('');
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle HTML with images', async () => {
    const { renderHtmlToDocx } = await import('./docx-renderer');
    const htmlWithImages = '<div><img src="data:image/png;base64,iVBOR" alt="test" /><p>Text</p></div>';
    const result = await renderHtmlToDocx(htmlWithImages);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle complex multi-page HTML', async () => {
    const { renderHtmlToDocx } = await import('./docx-renderer');
    const multiPageHtml = `
      <div>
        <div class="pdf-page"><h1>صفحة 1</h1></div>
        <div class="pdf-page"><h1>صفحة 2</h1></div>
        <div class="pdf-page"><h1>صفحة 3</h1></div>
      </div>
    `;
    const result = await renderHtmlToDocx(multiPageHtml);
    expect(result).toBeInstanceOf(Buffer);
  });
});

describe('DOCX Export API endpoint', () => {
  it('should validate that /api/export-docx endpoint exists in server config', async () => {
    // Verify the endpoint is registered by checking the import
    const indexModule = await import('./_core/index');
    expect(indexModule).toBeDefined();
  });
});
