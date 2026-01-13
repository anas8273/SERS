<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evidence;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EvidenceController extends Controller
{
    /**
     * Display a listing of user's evidences.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Evidence::where('user_id', $user->id);

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by template data
        if ($request->has('user_template_data_id')) {
            $query->where('user_template_data_id', $request->user_template_data_id);
        }

        $evidences = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $evidences,
        ]);
    }

    /**
     * Store a newly created evidence.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_template_data_id' => 'nullable|exists:user_template_data,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|in:image,document,link,qrcode',
            'file' => 'required_if:type,image,document|file|max:10240',
            'external_url' => 'required_if:type,link|nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $filePath = null;

        // Handle file upload
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('evidences', 'public');
        }

        $evidence = Evidence::create([
            'user_id' => $user->id,
            'user_template_data_id' => $request->user_template_data_id,
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'file_path' => $filePath,
            'external_url' => $request->external_url,
            'metadata' => $request->hasFile('file') ? [
                'original_name' => $request->file('file')->getClientOriginalName(),
                'mime_type' => $request->file('file')->getMimeType(),
                'size' => $request->file('file')->getSize(),
            ] : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $evidence,
            'message' => 'تم إضافة الشاهد بنجاح',
        ], 201);
    }

    /**
     * Display the specified evidence.
     */
    public function show(Request $request, Evidence $evidence): JsonResponse
    {
        // Check ownership
        if ($evidence->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $evidence,
        ]);
    }

    /**
     * Update the specified evidence.
     */
    public function update(Request $request, Evidence $evidence): JsonResponse
    {
        // Check ownership
        if ($evidence->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $evidence->update($request->only(['title', 'description']));

        return response()->json([
            'success' => true,
            'data' => $evidence,
            'message' => 'تم تحديث الشاهد بنجاح',
        ]);
    }

    /**
     * Remove the specified evidence.
     */
    public function destroy(Request $request, Evidence $evidence): JsonResponse
    {
        // Check ownership
        if ($evidence->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        // Delete files
        if ($evidence->file_path) {
            Storage::disk('public')->delete($evidence->file_path);
        }
        if ($evidence->qr_code_path) {
            Storage::disk('public')->delete($evidence->qr_code_path);
        }

        $evidence->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الشاهد بنجاح',
        ]);
    }
}
