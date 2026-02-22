# Phase 2 Analysis Notes

## What Already Exists:
1. **TemplateMapper** (688 lines) - Admin visual canvas editor with:
   - Background upload (via API)
   - Drag-and-drop elements on canvas
   - Element properties panel (position, font, color, alignment, rotation, opacity)
   - Save to Firestore + MySQL sync
   - Auto-map fields feature
   - Grid overlay
   - Canvas size presets (A4, A3, certificate)
   - BUT: Uses pixel coordinates (not percentage), needs "click-to-add" feature

2. **SchemaBuilder** (694 lines) - Form builder with:
   - Add/edit/delete fields
   - Field groups
   - Form settings (auto-save, AI assist)
   - Save to Firestore + MySQL sync

3. **Editor page** (969 lines) - User editor with:
   - Split-screen layout (form left, canvas right)
   - Dynamic form rendering (all field types)
   - Canvas rendering with HTML5 Canvas API
   - AI assistant integration
   - Auto-save, undo/redo
   - Export (image + PDF via API)
   - BUT: Uses percentage-based coordinates, needs html2canvas/jspdf for client-side PDF

4. **AIPromptManager** (539 lines) - AI prompt config

## What Needs Enhancement:
1. **TemplateMapper**: Add "click on image to create label" feature (currently only "add element" button)
2. **Editor**: Enhance PDF export to use html2canvas + jspdf (client-side)
3. **Editor**: The canvas rendering uses HTML5 Canvas API with percentage coords, but TemplateMapper saves pixel coords - MISMATCH needs fixing
4. **TemplateMapper**: Background upload uses API endpoint that may not exist yet - add FileReader fallback

## Key Architecture:
- TemplateMapper saves x_position/y_position in PIXELS
- Editor renderCanvas converts from PERCENTAGE (el.x/100 * cw)
- Firestore CanvasElement type uses percentage (x: number 0-100)
- TemplateMapper saveCanvas converts: x: el.x_position, y: el.y_position (raw pixels)
- This means the mapper saves pixels but the editor expects percentages!

## Fix Plan:
1. Make TemplateMapper save coordinates as PERCENTAGES (x_position / canvasSize.width * 100)
2. Add click-to-add-label on canvas image
3. Enhance editor with DOM-based preview (div overlay) instead of Canvas API for better PDF export
4. Add client-side PDF export with html2canvas + jspdf
