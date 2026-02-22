<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateField;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Google\Cloud\Firestore\FirestoreClient;

class AdminSchemaController extends Controller
{
    private $firestore;

    public function __construct()
    {
        $this->firestore = new FirestoreClient([
            'projectId' => config('services.firebase.project_id'),
            'keyFilePath' => storage_path('app/firebase/service-account.json'),
        ]);
    }

    /**
     * Get template schema for admin editing
     */
    public function getTemplateSchema(string $templateId): JsonResponse
    {
        try {
            $template = Template::with(['fields' => function($query) {
                $query->orderBy('sort_order');
            }])->findOrFail($templateId);

            // Get Firestore schema
            $firestoreSchema = null;
            try {
                $docRef = $this->firestore->collection('template_schemas')->document($templateId);
                $snapshot = $docRef->snapshot();
                if ($snapshot->exists()) {
                    $firestoreSchema = $snapshot->data();
                }
            } catch (\Exception $e) {
                // Firestore schema doesn't exist yet
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'template' => $template,
                    'firestore_schema' => $firestoreSchema,
                    'mysql_fields' => $template->fields->toArray(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load template schema',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update template schema (NO-CODE BUILDER)
     */
    public function updateTemplateSchema(Request $request, string $templateId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fields' => 'required|array',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.label_ar' => 'required|string|max:255',
            'fields.*.label_en' => 'required|string|max:255',
            'fields.*.type' => 'required|in:text,textarea,number,date,select,checkbox,radio,file,image,signature',
            'fields.*.is_required' => 'boolean',
            'fields.*.ai_enabled' => 'boolean',
            'fields.*.sort_order' => 'integer',
            'fields.*.options' => 'nullable|array',
            'sections' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $template = Template::findOrFail($templateId);
            $fields = $request->input('fields');
            $sections = $request->input('sections', []);

            // 1. Update MySQL template_fields table
            TemplateField::where('template_id', $templateId)->delete();
            
            foreach ($fields as $index => $fieldData) {
                TemplateField::create([
                    'template_id' => $templateId,
                    'name' => $fieldData['name'],
                    'label_ar' => $fieldData['label_ar'],
                    'label_en' => $fieldData['label_en'],
                    'type' => $fieldData['type'],
                    'placeholder_ar' => $fieldData['placeholder_ar'] ?? '',
                    'placeholder_en' => $fieldData['placeholder_en'] ?? '',
                    'is_required' => $fieldData['is_required'] ?? false,
                    'ai_fillable' => $fieldData['ai_enabled'] ?? false,
                    'ai_prompt_hint' => $fieldData['ai_prompt_hint'] ?? '',
                    'default_value' => $fieldData['default_value'] ?? '',
                    'options' => $fieldData['options'] ? json_encode($fieldData['options']) : null,
                    'sort_order' => $fieldData['sort_order'] ?? $index,
                    'position_x' => $fieldData['position_x'] ?? 0,
                    'position_y' => $fieldData['position_y'] ?? 0,
                    'width' => $fieldData['width'] ?? 100,
                    'height' => $fieldData['height'] ?? 30,
                    'font_size' => $fieldData['font_size'] ?? 12,
                    'font_family' => $fieldData['font_family'] ?? 'Arial',
                    'color' => $fieldData['color'] ?? '#000000',
                    'text_align' => $fieldData['text_align'] ?? 'right',
                ]);
            }

            // 2. Update Firestore schema
            $firestoreSchema = [
                'template_id' => $templateId,
                'fields' => $fields,
                'sections' => $sections,
                'updated_at' => new \DateTime(),
                'version' => time(), // Version for cache busting
            ];

            $docRef = $this->firestore->collection('template_schemas')->document($templateId);
            $docRef->set($firestoreSchema);

            // 3. Update template metadata
            $template->update([
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Template schema updated successfully',
                'data' => [
                    'template_id' => $templateId,
                    'fields_count' => count($fields),
                    'firestore_version' => $firestoreSchema['version'],
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template schema',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add new field to template
     */
    public function addField(Request $request, string $templateId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'label_ar' => 'required|string|max:255',
            'label_en' => 'required|string|max:255',
            'type' => 'required|in:text,textarea,number,date,select,checkbox,radio,file,image,signature',
            'is_required' => 'boolean',
            'ai_enabled' => 'boolean',
            'position' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $template = Template::findOrFail($templateId);
            $maxOrder = TemplateField::where('template_id', $templateId)->max('sort_order') ?? 0;

            $field = TemplateField::create([
                'template_id' => $templateId,
                'name' => $request->input('name'),
                'label_ar' => $request->input('label_ar'),
                'label_en' => $request->input('label_en'),
                'type' => $request->input('type'),
                'is_required' => $request->input('is_required', false),
                'ai_fillable' => $request->input('ai_enabled', false),
                'sort_order' => $request->input('position', $maxOrder + 1),
            ]);

            // Update Firestore
            $this->syncFieldsToFirestore($templateId);

            return response()->json([
                'success' => true,
                'message' => 'Field added successfully',
                'data' => $field
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add field',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove field from template
     */
    public function removeField(string $templateId, string $fieldId): JsonResponse
    {
        try {
            $field = TemplateField::where('template_id', $templateId)
                                 ->where('id', $fieldId)
                                 ->firstOrFail();
            
            $field->delete();

            // Update Firestore
            $this->syncFieldsToFirestore($templateId);

            return response()->json([
                'success' => true,
                'message' => 'Field removed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove field',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder fields (Drag & Drop)
     */
    public function reorderFields(Request $request, string $templateId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'field_orders' => 'required|array',
            'field_orders.*.field_id' => 'required|string',
            'field_orders.*.sort_order' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($request->input('field_orders') as $order) {
                TemplateField::where('template_id', $templateId)
                           ->where('id', $order['field_id'])
                           ->update(['sort_order' => $order['sort_order']]);
            }

            // Update Firestore
            $this->syncFieldsToFirestore($templateId);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Fields reordered successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder fields',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle AI for specific field
     */
    public function toggleFieldAI(string $templateId, string $fieldId): JsonResponse
    {
        try {
            $field = TemplateField::where('template_id', $templateId)
                                 ->where('id', $fieldId)
                                 ->firstOrFail();
            
            $field->update([
                'ai_fillable' => !$field->ai_fillable
            ]);

            // Update Firestore
            $this->syncFieldsToFirestore($templateId);

            return response()->json([
                'success' => true,
                'message' => 'AI setting updated successfully',
                'data' => [
                    'field_id' => $fieldId,
                    'ai_enabled' => $field->ai_fillable
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle AI setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync MySQL fields to Firestore
     */
    private function syncFieldsToFirestore(string $templateId): void
    {
        $fields = TemplateField::where('template_id', $templateId)
                              ->orderBy('sort_order')
                              ->get()
                              ->toArray();

        $firestoreSchema = [
            'template_id' => $templateId,
            'fields' => $fields,
            'updated_at' => new \DateTime(),
            'version' => time(),
        ];

        $docRef = $this->firestore->collection('template_schemas')->document($templateId);
        $docRef->set($firestoreSchema);
    }
}