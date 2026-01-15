<?php
// app/Http/Controllers/Api/CategoryController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CategoryController
 * 
 * Handles public category listing and retrieval.
 * Categories organize products into educational stages and subjects.
 * 
 * @package App\Http\Controllers\Api
 */
class CategoryController extends Controller
{
    /**
     * List all active categories.
     * 
     * GET /api/categories
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()
            ->where('is_active', true)
            ->ordered();

        // Filter by parent (null = root categories only)
        if ($request->has('root') && $request->boolean('root')) {
            $query->root();
        }

        // Include children count
        $query->withCount('templates');

        // Eager load children if requested
        if ($request->boolean('with_children')) {
            $query->with(['children' => function ($q) {
                $q->where('is_active', true)->ordered();
            }]);
        }

        $categories = $query->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get a single category by slug.
     * 
     * GET /api/categories/{slug}
     * 
     * @param string $slug Category slug
     * @return JsonResponse
     */
    public function show(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)
            ->where('is_active', true)
            ->with(['children' => function ($q) {
                $q->where('is_active', true)->ordered();
            }])
            ->withCount('templates')
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'التصنيف غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        // Get templates in this category
        $templates = $category->templates()
            ->where('is_active', true)
            ->latest()
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category,
                'templates' => $templates,
            ],
        ]);
    }

    /**
     * List all categories for admin (including inactive).
     * 
     * GET /api/admin/categories
     * 
     * @return JsonResponse
     */
    public function adminIndex(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('templates')
            ->ordered()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Create a new category.
     * 
     * POST /api/admin/categories
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = \Str::slug($validated['name_en']);
        }

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء التصنيف بنجاح',
            'data' => $category,
        ], 201);
    }

    /**
     * Update a category.
     * 
     * PUT /api/admin/categories/{id}
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $id,
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التصنيف بنجاح',
            'data' => $category->fresh(),
        ]);
    }

    /**
     * Delete a category.
     * 
     * DELETE /api/admin/categories/{id}
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $category = Category::withCount('templates')->findOrFail($id);

        // Check if category has templates
        if ($category->templates_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف التصنيف لأنه يحتوي على قوالب. قم بنقل القوالب أولاً.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التصنيف بنجاح',
        ]);
    }
}
