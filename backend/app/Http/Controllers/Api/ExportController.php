<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserTemplateData;
use App\Models\InteractiveTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ExportController extends Controller
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
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

        $previewPath = $this->generateImage($userTemplateData, true);

        return response()->json([
            'success' => true,
            'preview_url' => asset('storage/' . $previewPath),
        ]);
    }

    /**
     * Export template as image.
     */
    public function exportImage(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        // Check if paid (if template is not free)
        $template = $userTemplateData->template;
        if (!$template->is_free && !$userTemplateData->is_paid) {
            return response()->json([
                'success' => false,
                'message' => 'يجب الدفع أولاً لتصدير هذا القالب',
            ], 402);
        }

        $exportPath = $this->generateImage($userTemplateData, false);

        // Update status and path
        $userTemplateData->update([
            'status' => 'exported',
            'exported_file_path' => $exportPath,
        ]);

        // Increment downloads
        $template->incrementDownloads();

        return response()->json([
            'success' => true,
            'download_url' => asset('storage/' . $exportPath),
            'message' => 'تم التصدير بنجاح',
        ]);
    }

    /**
     * Export template as PDF.
     */
    public function exportPdf(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        // Check if paid
        $template = $userTemplateData->template;
        if (!$template->is_free && !$userTemplateData->is_paid) {
            return response()->json([
                'success' => false,
                'message' => 'يجب الدفع أولاً لتصدير هذا القالب',
            ], 402);
        }

        // Generate image first
        $imagePath = $this->generateImage($userTemplateData, false);

        // For now, return the image path (PDF generation can be added later)
        $userTemplateData->update([
            'status' => 'exported',
            'exported_file_path' => $imagePath,
        ]);

        $template->incrementDownloads();

        return response()->json([
            'success' => true,
            'download_url' => asset('storage/' . $imagePath),
            'message' => 'تم التصدير بنجاح',
        ]);
    }

    /**
     * Generate the image with all fields.
     */
    protected function generateImage(UserTemplateData $userTemplateData, bool $isPreview): string
    {
        $variant = $userTemplateData->variant ?? $userTemplateData->template->defaultVariant();
        $fields = $userTemplateData->template->fields;
        $fieldValues = $userTemplateData->field_values;

        // Load background image
        $backgroundPath = storage_path('app/public/' . $variant->background_image_path);
        $image = $this->imageManager->read($backgroundPath);

        // Add watermark if preview
        if ($isPreview) {
            $image->text('معاينة - SERS', $variant->width / 2, $variant->height / 2, function ($font) {
                $font->size(48);
                $font->color('rgba(128, 128, 128, 0.5)');
                $font->align('center');
                $font->valign('middle');
            });
        }

        // Add text fields
        foreach ($fields as $field) {
            if ($field->type === 'text' || $field->type === 'textarea') {
                $value = $fieldValues[$field->name] ?? $field->default_value ?? '';
                
                if (!empty($value)) {
                    $image->text($value, $field->pos_x + ($field->width / 2), $field->pos_y + ($field->height / 2), function ($font) use ($field) {
                        $font->size($field->font_size);
                        $font->color($field->font_color);
                        $font->align($field->text_align);
                        $font->valign('middle');
                    });
                }
            }
        }

        // Save image
        $filename = $isPreview ? 'preview_' : 'export_';
        $filename .= $userTemplateData->id . '_' . time() . '.png';
        $path = 'exports/' . $filename;

        Storage::disk('public')->put($path, $image->toPng());

        return $path;
    }
}
