<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserTemplateData;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

/**
 * ExportController
 * 
 * Handles exporting templates to various formats:
 * - PDF (with Arabic font support)
 * - Image (PNG)
 * - Preview generation
 * 
 * يدعم التصدير إلى PDF مع دعم كامل للخطوط العربية
 */
class ExportController extends Controller
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
    }

    /**
     * Export template to PDF.
     * تصدير القالب إلى ملف PDF مع دعم اللغة العربية
     * 
     * POST /api/export/pdf
     */
    public function toPdf(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|string',
            'user_template_data_id' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'field_values' => 'nullable|array',
        ], [
            'template_id.required' => 'معرف القالب مطلوب',
        ]);

        try {
            $template = Template::findOrFail($validated['template_id']);
            
            // Check payment authorization using Policy
            $this->authorize('export', $template);
            
            // Get user template data if provided
            $userTemplateData = null;
            $fieldValues = $validated['field_values'] ?? [];
            
            if (!empty($validated['user_template_data_id'])) {
                $userTemplateData = UserTemplateData::where('id', $validated['user_template_data_id'])
                    ->where('user_id', $request->user()->id)
                    ->first();
                    
                if ($userTemplateData) {
                    $fieldValues = array_merge($userTemplateData->field_values ?? [], $fieldValues);
                }
            }

            // Use new PDF generation service
            $pdfService = new \App\Services\PDFGenerationService();
            $result = $pdfService->generatePDF($validated['user_template_data_id'], [
                'format' => 'pdf',
                'include_qr' => true,
                'include_images' => true,
            ]);

            if ($result['success']) {
                // Increment downloads
                $template->incrementDownloads();

                return response()->json([
                    'success' => true,
                    'message' => 'تم تصدير القالب بنجاح',
                    'data' => $result['data']
                ]);
            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            Log::error('PDF Export Error: ' . $e->getMessage(), [
                'template_id' => $validated['template_id'] ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التصدير: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate PDF file with Arabic support.
     */
    protected function generatePdf(Template $template, array $fieldValues, ?string $title = null): string
    {
        $pdf = app('dompdf.wrapper');
        
        // Configure for RTL and Arabic
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
            'isPhpEnabled' => true,
        ]);

        // Build HTML content
        $html = $this->buildPdfHtml($template, $fieldValues, $title);
        
        $pdf->loadHTML($html);
        $pdf->setPaper('a4', 'portrait');

        // Save to storage
        $filename = 'template_' . $template->id . '_' . time() . '.pdf';
        $path = 'exports/pdf/' . $filename;
        
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    /**
     * Build HTML for PDF generation with RTL support.
     */
    protected function buildPdfHtml(Template $template, array $fieldValues, ?string $title = null): string
    {
        $templateTitle = $title ?? $template->name_ar ?? $template->name_en ?? 'قالب تعليمي';
        $description = $template->description_ar ?? '';
        
        // Get fields
        $fields = $template->fields ?? collect();
        
        $fieldsHtml = '';
        foreach ($fields as $field) {
            $value = $fieldValues[$field->name] ?? $field->default_value ?? '';
            if (!empty($value)) {
                $label = $field->label_ar ?? $field->label_en ?? $field->name;
                $fieldsHtml .= "
                    <div class='field'>
                        <div class='field-label'>{$label}</div>
                        <div class='field-value'>{$value}</div>
                    </div>
                ";
            }
        }

        // If no fields defined, show the values directly
        if (empty($fieldsHtml) && !empty($fieldValues)) {
            foreach ($fieldValues as $key => $value) {
                if (!empty($value) && is_string($value)) {
                    $fieldsHtml .= "
                        <div class='field'>
                            <div class='field-label'>{$key}</div>
                            <div class='field-value'>{$value}</div>
                        </div>
                    ";
                }
            }
        }

        $categoryName = $template->category->name_ar ?? 'عام';
        $currentDate = now()->format('Y-m-d');
        $descriptionHtml = $description ? "<div class='description'>{$description}</div>" : '';
        
        return <<<HTML
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$templateTitle}</title>
    <style>
        @font-face {
            font-family: 'Amiri';
            src: url('https://fonts.gstatic.com/s/amiri/v17/J7aRnpd8CGxBHqUpvrIw74NL.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Amiri', 'DejaVu Sans', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            background: #fff;
            color: #333;
            line-height: 1.8;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #6b7280;
        }
        
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-label {
            font-size: 12px;
            color: #6b7280;
        }
        
        .meta-value {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .content {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 18px;
            color: #3b82f6;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background: #fafafa;
            border-radius: 8px;
            border-right: 4px solid #3b82f6;
        }
        
        .field-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .field-value {
            font-size: 16px;
            color: #1f2937;
        }
        
        .description {
            padding: 20px;
            background: #eff6ff;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #1e40af;
        }
        
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
        }
        
        .footer-logo {
            color: #3b82f6;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">SERS</div>
        <div class="title">{$templateTitle}</div>
        <div class="subtitle">نظام السجلات التعليمية الذكي</div>
    </div>
    
    <div class="meta-info">
        <div class="meta-item">
            <div class="meta-label">التصنيف</div>
            <div class="meta-value">{$categoryName}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">تاريخ التصدير</div>
            <div class="meta-value">{$currentDate}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">نوع القالب</div>
            <div class="meta-value">{$template->type}</div>
        </div>
    </div>
    
    {$descriptionHtml}
    
    <div class="content">
        <div class="section-title">البيانات</div>
        {$fieldsHtml}
    </div>
    
    <div class="footer">
        <p>تم التصدير بواسطة <span class="footer-logo">SERS</span> - نظام السجلات التعليمية الذكي</p>
        <p>جميع الحقوق محفوظة © {$currentDate}</p>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Fallback export when dompdf is not available.
     */
    protected function generateFallbackExport(Template $template, array $fieldValues, ?string $title = null): JsonResponse
    {
        // Create a simple HTML file as fallback
        $html = $this->buildPdfHtml($template, $fieldValues, $title);
        
        $filename = 'template_' . $template->id . '_' . time() . '.html';
        $path = 'exports/html/' . $filename;
        
        Storage::disk('public')->put($path, $html);
        
        // Increment downloads
        $template->incrementDownloads();

        return response()->json([
            'success' => true,
            'message' => 'تم تصدير القالب بنجاح (تنسيق HTML). قم بتثبيت حزمة dompdf لدعم PDF.',
            'download_url' => asset('storage/' . $path),
            'filename' => $filename,
            'format' => 'html',
        ]);
    }

    /**
     * Export template as image.
     * تصدير القالب كصورة
     * 
     * POST /api/export/image
     */
    public function toImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|string',
            'user_template_data_id' => 'nullable|string',
        ]);

        try {
            $template = Template::findOrFail($validated['template_id']);
            
            // Get user template data if provided
            $userTemplateData = null;
            if (!empty($validated['user_template_data_id'])) {
                $userTemplateData = UserTemplateData::where('id', $validated['user_template_data_id'])
                    ->where('user_id', $request->user()->id)
                    ->first();
            }

            $imagePath = $this->generateImage($template, $userTemplateData);
            
            // Increment downloads
            $template->incrementDownloads();

            return response()->json([
                'success' => true,
                'message' => 'تم تصدير الصورة بنجاح',
                'download_url' => asset('storage/' . $imagePath),
            ]);

        } catch (\Exception $e) {
            Log::error('Image Export Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التصدير',
            ], 500);
        }
    }

    /**
     * Export to Word format (placeholder).
     * 
     * POST /api/export/word
     */
    public function toWord(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'تصدير Word قيد التطوير',
        ], 501);
    }

    /**
     * Download exported file.
     * 
     * GET /api/export/download/{filename}
     */
    public function download(string $filename)
    {
        $path = 'exports/' . $filename;
        
        if (!Storage::disk('public')->exists($path)) {
            // Try subfolders
            $possiblePaths = [
                'exports/pdf/' . $filename,
                'exports/html/' . $filename,
                'exports/images/' . $filename,
            ];
            
            foreach ($possiblePaths as $possiblePath) {
                if (Storage::disk('public')->exists($possiblePath)) {
                    $path = $possiblePath;
                    break;
                }
            }
        }
        
        if (!Storage::disk('public')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود',
            ], 404);
        }

        return Storage::disk('public')->download($path);
    }

    /**
     * Generate preview image.
     */
    public function preview(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        try {
            $previewPath = $this->generateImage($userTemplateData->template, $userTemplateData, true);

            return response()->json([
                'success' => true,
                'preview_url' => asset('storage/' . $previewPath),
            ]);
        } catch (\Exception $e) {
            Log::error('Preview Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء المعاينة',
            ], 500);
        }
    }

    /**
     * Generate the image with all fields.
     */
    protected function generateImage(Template $template, ?UserTemplateData $userTemplateData = null, bool $isPreview = false): string
    {
        // Get variant
        $variant = $userTemplateData?->variant ?? $template->defaultVariant;
        
        if (!$variant || !$variant->background_image_path) {
            // Create a default image
            $image = $this->imageManager->create(800, 600)->fill('#f8fafc');
            
            // Add template name
            $image->text($template->name_ar ?? 'قالب', 400, 300, function ($font) {
                $font->size(32);
                $font->color('#1f2937');
                $font->align('center');
                $font->valign('middle');
            });
        } else {
            // Load background image
            $backgroundPath = storage_path('app/public/' . $variant->background_image_path);
            
            if (!file_exists($backgroundPath)) {
                $image = $this->imageManager->create(800, 600)->fill('#f8fafc');
            } else {
                $image = $this->imageManager->read($backgroundPath);
            }
        }

        // Add watermark if preview
        if ($isPreview) {
            $image->text('معاينة - SERS', $image->width() / 2, $image->height() / 2, function ($font) {
                $font->size(48);
                $font->color('rgba(128, 128, 128, 0.5)');
                $font->align('center');
                $font->valign('middle');
            });
        }

        // Add text fields if user template data exists
        if ($userTemplateData) {
            $fields = $template->fields;
            $fieldValues = $userTemplateData->field_values ?? [];

            foreach ($fields as $field) {
                if ($field->type === 'text' || $field->type === 'textarea') {
                    $value = $fieldValues[$field->name] ?? $field->default_value ?? '';
                    
                    if (!empty($value)) {
                        $image->text($value, $field->pos_x + ($field->width / 2), $field->pos_y + ($field->height / 2), function ($font) use ($field) {
                            $font->size($field->font_size ?? 14);
                            $font->color($field->font_color ?? '#1f2937');
                            $font->align($field->text_align ?? 'center');
                            $font->valign('middle');
                        });
                    }
                }
            }
        }

        // Save image
        $prefix = $isPreview ? 'preview_' : 'export_';
        $filename = $prefix . $template->id . '_' . time() . '.png';
        $path = 'exports/images/' . $filename;

        Storage::disk('public')->put($path, $image->toPng());

        return $path;
    }
}
