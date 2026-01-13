<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentLibrary;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ContentLibraryController extends Controller
{
    /**
     * Display a listing of user's content library.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = ContentLibrary::where('user_id', $user->id);

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by favorites
        if ($request->boolean('favorites_only')) {
            $query->favorites();
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        if ($sortBy === 'usage') {
            $query->mostUsed();
        } else {
            $query->orderBy($sortBy, 'desc');
        }

        $items = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Store a newly created content item.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:text,image,signature,logo',
            'content' => 'required_if:type,text|nullable|string',
            'file' => 'required_if:type,image,signature,logo|nullable|file|image|max:5120',
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
            $filePath = $request->file('file')->store('content_library/' . $user->id, 'public');
        }

        $item = ContentLibrary::create([
            'user_id' => $user->id,
            'title' => $request->title,
            'type' => $request->type,
            'content' => $request->content,
            'file_path' => $filePath,
        ]);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'تم إضافة المحتوى بنجاح',
        ], 201);
    }

    /**
     * Display the specified content item.
     */
    public function show(Request $request, ContentLibrary $contentLibrary): JsonResponse
    {
        // Check ownership
        if ($contentLibrary->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $contentLibrary,
        ]);
    }

    /**
     * Update the specified content item.
     */
    public function update(Request $request, ContentLibrary $contentLibrary): JsonResponse
    {
        // Check ownership
        if ($contentLibrary->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $contentLibrary->update($request->only(['title', 'content']));

        return response()->json([
            'success' => true,
            'data' => $contentLibrary,
            'message' => 'تم تحديث المحتوى بنجاح',
        ]);
    }

    /**
     * Remove the specified content item.
     */
    public function destroy(Request $request, ContentLibrary $contentLibrary): JsonResponse
    {
        // Check ownership
        if ($contentLibrary->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        // Delete file
        if ($contentLibrary->file_path) {
            Storage::disk('public')->delete($contentLibrary->file_path);
        }

        $contentLibrary->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المحتوى بنجاح',
        ]);
    }

    /**
     * Toggle favorite status.
     */
    public function toggleFavorite(Request $request, ContentLibrary $contentLibrary): JsonResponse
    {
        // Check ownership
        if ($contentLibrary->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $isFavorite = $contentLibrary->toggleFavorite();

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
            'message' => $isFavorite ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة',
        ]);
    }

    /**
     * Increment usage count (called when content is used).
     */
    public function use(Request $request, ContentLibrary $contentLibrary): JsonResponse
    {
        // Check ownership
        if ($contentLibrary->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح',
            ], 403);
        }

        $contentLibrary->incrementUsage();

        return response()->json([
            'success' => true,
            'usage_count' => $contentLibrary->usage_count,
        ]);
    }
}
