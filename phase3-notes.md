# Phase 3 Analysis

## Existing Files:
- batch-generate: 954 lines, uses API-based approach (server-side), needs client-side Excel parsing + X/Y engine integration
- analyses: 1075 lines, has custom SVG charts, needs recharts + Excel upload + AI analysis

## What needs to change in batch-generate:
1. Add client-side Excel parsing with xlsx library (currently sends to API)
2. Add column-to-field mapping UI
3. Integrate with X/Y template engine for client-side PDF generation
4. Use bulkExportPDF and bulkExportZIP from pdf-export.ts
5. Load template canvas from Firestore instead of MySQL

## What needs to change in analyses:
1. Replace custom SVG charts with recharts (PieChart, BarChart)
2. Add drag-and-drop Excel/CSV upload
3. Add AI analysis button
4. Parse multiple columns (subjects) not just one grade column
5. Auto-detect column types

## Libraries installed:
- xlsx, papaparse, recharts, jszip, html-to-image, @types/papaparse
