<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCollection;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * عرض المنتجات
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->latest()
            ->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => new ProductCollection($products),
        ]);
    }

    /**
     * عرض منتج واحد
     */
    public function show($id): JsonResponse
    {
        $product = Product::where('id', $id)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * 🔍 البحث عن المنتجات (بدون Scout)
     */
    public function search(Request $request): JsonResponse
    {
        $queryStr = $request->get('q', '');

        if (empty($queryStr)) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        // بحث SQL عادي لتجنب مشاكل Scout / MeiliSearch
        $products = Product::where(function ($query) use ($queryStr) {
                $query->where('name_ar', 'LIKE', "%{$queryStr}%")
                      ->orWhere('name_en', 'LIKE', "%{$queryStr}%");
            })
            ->where('is_active', true)
            ->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => new ProductCollection($products),
        ]);
    }
}
