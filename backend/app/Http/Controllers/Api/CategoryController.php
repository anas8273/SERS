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
            ->sorted();

        // Filter by parent (null = root categories only)
        if ($request->has('root') && $request->boolean('root')) {
            $query->root();
        }

        // Include children count
        $query->withCount('products');

        // Eager load children if requested
        if ($request->boolean('with_children')) {
            $query->with(['children' => function ($q) {
                $q->where('is_active', true)->sorted();
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
                $q->where('is_active', true)->sorted();
            }])
            ->withCount('products')
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'التصنيف غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        // Get products in this category
        $products = $category->products()
            ->where('is_active', true)
            ->latest()
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category,
                'products' => $products,
            ],
        ]);
    }
}
