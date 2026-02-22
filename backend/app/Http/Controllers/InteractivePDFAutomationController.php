<?php

namespace App\Http\Controllers;

use App\Services\InteractivePDFAutomationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class InteractivePDFAutomationController extends Controller
{
    private $pdfAutomationService;

    public function __construct(InteractivePDFAutomationService $pdfAutomationService)
    {
        $this->pdfAutomationService = $pdfAutomationService;
    }

    /**
     * 🎯 MAIN ENDPOINT - Automate PDF generation for multiple templates
     */
    public function automate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'templates' => 'required|array|min:1',
            'templates.*.template_id' => 'required|string',
            'templates.*.service_type' => 'required|string',
            'templates.*.fields' => 'required|array',
            'templates.*.fields.*.name' => 'required|string',
            'templates.*.fields.*.type' => 'required|string|in:text,number,date,checkbox,dropdown,file,signature,textarea',
            'templates.*.fields.*.label_ar' => 'required|string',
            'templates.*.fields.*.label_en' => 'required|string',
            'templates.*.fields.*.required' => 'boolean',
            'templates.*.fields.*.options' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            $templateSchemas = $request->templates;
            $results = $this->pdfAutomationService->automatePDFGeneration($templateSchemas);

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Automation failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload template file and process with schema
     */
    public function uploadAndProcess(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_file' => 'required|file|mimes:pdf,docx,doc,jpg,jpeg,png|max:10240',
            'schema' => 'required|json',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            // Store uploaded file
            $file = $request->file('template_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('template_uploads', $fileName);

            // Parse schema
            $schema = json_decode($request->schema, true);
            
            // Add file path to schema
            $schema['template_file_path'] = $filePath;

            // Process single template
            $results = $this->pdfAutomationService->automatePDFGeneration([$schema]);

            return response()->json([
                'success' => true,
                'data' => $results,
                'uploaded_file' => $filePath
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Upload processing failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify generated PDFs
     */
    public function verify(): JsonResponse
    {
        try {
            $verification = $this->pdfAutomationService->verifyGeneratedPDFs();

            return response()->json([
                'success' => true,
                'data' => $verification
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Verification failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download generated PDF
     */
    public function download(string $templateId): JsonResponse
    {
        try {
            // Find template
            $template = \App\Models\Template::findOrFail($templateId);
            
            if (!$template->file_path || !Storage::exists($template->file_path)) {
                return response()->json([
                    'success' => false,
                    'error' => 'PDF not found'
                ], 404);
            }

            // Generate download URL
            $downloadUrl = Storage::url($template->file_path);

            return response()->json([
                'success' => true,
                'data' => [
                    'template_id' => $templateId,
                    'download_url' => $downloadUrl,
                    'filename' => basename($template->file_path),
                    'size' => Storage::size($template->file_path)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Download failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template schema
     */
    public function getSchema(string $templateId): JsonResponse
    {
        try {
            $template = \App\Models\Template::with('fields')->findOrFail($templateId);
            
            $schema = [
                'template_id' => $template->id,
                'service_type' => $template->service_type,
                'name_en' => $template->name_en,
                'name_ar' => $template->name_ar,
                'description_en' => $template->description_en,
                'description_ar' => $template->description_ar,
                'fields' => $template->fields->map(function ($field) {
                    return [
                        'name' => $field->name,
                        'type' => $field->type,
                        'label_ar' => $field->label_ar,
                        'label_en' => $field->label_en,
                        'required' => $field->is_required,
                        'options' => $field->options ? json_decode($field->options, true) : null,
                        'position' => $field->position,
                        'validation_rules' => $field->validation_rules
                    ];
                })->toArray()
            ];

            return response()->json([
                'success' => true,
                'data' => $schema
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Schema retrieval failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all generated PDFs
     */
    public function list(): JsonResponse
    {
        try {
            $templates = \App\Models\Template::whereNotNull('file_path')
                ->where('file_path', '!=', '')
                ->with('fields')
                ->get();

            $pdfList = $templates->map(function ($template) {
                return [
                    'template_id' => $template->id,
                    'service_type' => $template->service_type,
                    'name_en' => $template->name_en,
                    'name_ar' => $template->name_ar,
                    'pdf_path' => $template->file_path,
                    'pdf_url' => Storage::url($template->file_path),
                    'fields_count' => $template->fields->count(),
                    'size' => Storage::exists($template->file_path) ? Storage::size($template->file_path) : 0,
                    'created_at' => $template->created_at,
                    'updated_at' => $template->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_pdfs' => $pdfList->count(),
                    'pdfs' => $pdfList
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'List retrieval failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete generated PDF
     */
    public function delete(string $templateId): JsonResponse
    {
        try {
            $template = \App\Models\Template::findOrFail($templateId);
            
            if ($template->file_path && Storage::exists($template->file_path)) {
                Storage::delete($template->file_path);
            }

            // Update template
            $template->update(['file_path' => null]);

            return response()->json([
                'success' => true,
                'message' => 'PDF deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Deletion failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}