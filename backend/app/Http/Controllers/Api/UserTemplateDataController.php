<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserTemplateData;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class UserTemplateDataController extends Controller
{
    /**
     * Display a listing of user's template data.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = UserTemplateData::with(['template', 'variant'])
            ->where('user_id', $user->id);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by template
        if ($request->has('template_id')) {
            $query->where('template_id', $request->template_id);
        }

        $data = $query->orderBy('updated_at', 'desc')
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Store a newly created template data.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|exists:interactive_templates,id',
            'variant_id' => 'nullable|exists:template_variants,id',
            'instance_name' => 'required|string|max:255',
            'field_values' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $templateData = UserTemplateData::create([
            'user_id' => $user->id,
            'template_id' => $request->template_id,
            'variant_id' => $request->variant_id,
            'instance_name' => $request->instance_name,
            'field_values' => $request->field_values,
            'status' => 'draft',
        ]);

        // Create initial version
        $templateData->createVersion('الإنشاء الأولي');

        return response()->json([
            'success' => true,
            'data' => $templateData->load(['template', 'variant']),
            'message' => 'تم حفظ البيانات بنجاح',
        ], 201);
    }

    /**
     * Display the specified template data.
     */
    public function show(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $userTemplateData->load(['template.fields', 'variant', 'versions', 'evidences']);

        return response()->json([
            'success' => true,
            'data' => $userTemplateData,
        ]);
    }

    /**
     * Update the specified template data.
     */
    public function update(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'variant_id' => 'nullable|exists:template_variants,id',
            'instance_name' => 'sometimes|string|max:255',
            'field_values' => 'sometimes|array',
            'status' => 'sometimes|in:draft,completed,exported',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Create version before update if field_values changed
        if ($request->has('field_values') && $request->field_values !== $userTemplateData->field_values) {
            $userTemplateData->createVersion($request->get('change_summary', 'تحديث البيانات'));
        }

        $userTemplateData->update($request->only([
            'variant_id',
            'instance_name',
            'field_values',
            'status',
        ]));

        return response()->json([
            'success' => true,
            'data' => $userTemplateData->fresh(['template', 'variant']),
            'message' => 'تم تحديث البيانات بنجاح',
        ]);
    }

    /**
     * Remove the specified template data.
     */
    public function destroy(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $userTemplateData->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف البيانات بنجاح',
        ]);
    }

    /**
     * Get version history.
     */
    public function versions(Request $request, UserTemplateData $userTemplateData): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $versions = $userTemplateData->versions()->get();

        return response()->json([
            'success' => true,
            'data' => $versions,
        ]);
    }

    /**
     * Restore from a specific version.
     */
    public function restoreVersion(Request $request, UserTemplateData $userTemplateData, int $versionNumber): JsonResponse
    {
        // Check ownership
        if ($userTemplateData->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        // Create version before restore
        $userTemplateData->createVersion('قبل الاستعادة من النسخة ' . $versionNumber);

        $restored = $userTemplateData->restoreVersion($versionNumber);

        if (!$restored) {
            return response()->json([
                'success' => false,
                'message' => 'النسخة غير موجودة',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $userTemplateData->fresh(),
            'message' => 'تم استعادة النسخة بنجاح',
        ]);
    }
}
