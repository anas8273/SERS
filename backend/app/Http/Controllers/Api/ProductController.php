<?php
// app/Http/Controllers/Api/ProductController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCollection;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * ProductController
 * 
 * Handles product listing (public) and CRUD operations (admin).
 * Includes secure file handling for thumbnails and product files.
 * 
 * @package App\Http\Controllers\Api
 */
class ProductController extends Controller
{
    // ==================== PUBLIC METHODS ====================

    /**
     * List all active products with pagination.
     * 
     * GET /api/products
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with('category');

        // Search by name/description
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'LIKE', "%{$search}%")
                  ->orWhere('name_en', 'LIKE', "%{$search}%")
                  ->orWhere('description_ar', 'LIKE', "%{$search}%");
            });
        }

        // Filter by category (slug or ID)
        if ($request->filled('category')) {
            $category = $request->input('category');
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('slug', $category)->orWhere('id', $category);
            });
        }

        // Filter by category_id (direct)
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by educational stage
        if ($request->filled('educational_stage')) {
            $query->where('educational_stage', $request->educational_stage);
        }

        // Filter by subject
        if ($request->filled('subject')) {
            $query->where('subject', $request->subject);
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $allowedSorts = ['created_at', 'price', 'average_rating', 'downloads_count'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $products = $query->paginate($request->get('per_page', 12));

        // Return items directly for easier frontend consumption
        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Get a single product by slug.
     * 
     * GET /api/products/{slug}
     * 
     * @param string $slug Product slug
     * @return JsonResponse
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with(['category', 'reviews' => function ($q) {
                $q->where('is_approved', true)->latest()->limit(5);
            }])
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * Get featured products.
     * 
     * GET /api/products/featured
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function featured(Request $request): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->where('is_featured', true)
            ->with('category')
            ->latest()
            ->limit($request->get('limit', 8))
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
        ]);
    }

    /**
     * Search products.
     * 
     * GET /api/products/search
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');

        if (empty($query)) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        // SQL-based search (Scout/MeiliSearch can be enabled later)
        $products = Product::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name_ar', 'LIKE', "%{$query}%")
                  ->orWhere('name_en', 'LIKE', "%{$query}%")
                  ->orWhere('description_ar', 'LIKE', "%{$query}%")
                  ->orWhere('description_en', 'LIKE', "%{$query}%");
            })
            ->with('category')
            ->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => new ProductCollection($products),
        ]);
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Create a new product (Admin only).
     * 
     * POST /api/admin/products
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug',
            'description_ar' => 'required|string',
            'description_en' => 'required|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0|lt:price',
            'type' => 'required|in:downloadable,interactive',
            'category_id' => 'required|uuid|exists:categories,id',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'preview_images.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'product_file' => 'nullable|file|max:51200', // 50MB max
            'template_structure' => 'nullable|array',
            'educational_stage' => 'nullable|string|max:100',
            'subject' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'is_featured' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ], [
            'name_ar.required' => 'اسم المنتج بالعربية مطلوب',
            'name_en.required' => 'اسم المنتج بالإنجليزية مطلوب',
            'price.required' => 'السعر مطلوب',
            'type.required' => 'نوع المنتج مطلوب',
            'type.in' => 'نوع المنتج يجب أن يكون downloadable أو interactive',
            'category_id.required' => 'التصنيف مطلوب',
            'category_id.exists' => 'التصنيف غير موجود',
            'thumbnail.image' => 'يجب أن تكون الصورة المصغرة صورة',
            'thumbnail.max' => 'حجم الصورة المصغرة لا يجب أن يتجاوز 2 ميجابايت',
            'product_file.max' => 'حجم الملف لا يجب أن يتجاوز 50 ميجابايت',
        ]);

        try {
            // Generate slug if not provided
            $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name_en']);

            // Handle thumbnail upload (public disk)
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('products/thumbnails', 'public');
                $validated['thumbnail_url'] = Storage::disk('public')->url($thumbnailPath);
            }

            // Handle preview images upload (public disk)
            if ($request->hasFile('preview_images')) {
                $previewUrls = [];
                foreach ($request->file('preview_images') as $image) {
                    $path = $image->store('products/previews', 'public');
                    $previewUrls[] = Storage::disk('public')->url($path);
                }
                $validated['preview_images'] = $previewUrls;
            }

            // Handle product file upload (private disk)
            if ($request->hasFile('product_file')) {
                $file = $request->file('product_file');
                $validated['file_path'] = $file->store('products/files', 'local');
                $validated['file_name'] = $file->getClientOriginalName();
                $validated['file_size'] = $file->getSize();
            }

            // Set defaults
            $validated['is_featured'] = $validated['is_featured'] ?? false;
            $validated['is_active'] = $validated['is_active'] ?? true;

            $product = Product::create($validated);

            Log::info("Product created by admin", [
                'product_id' => $product->id,
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء المنتج بنجاح',
                'data' => new ProductResource($product->load('category')),
            ], 201);

        } catch (\Throwable $e) {
            Log::error("Failed to create product", [
                'error' => $e->getMessage(),
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء المنتج',
                'error' => 'create_error',
            ], 500);
        }
    }

    /**
     * Update an existing product (Admin only).
     * 
     * PUT /api/admin/products/{id}
     * 
     * @param Request $request
     * @param string $id Product UUID
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:products,slug,' . $product->id,
            'description_ar' => 'sometimes|string',
            'description_en' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'type' => 'sometimes|in:downloadable,interactive',
            'category_id' => 'sometimes|uuid|exists:categories,id',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'preview_images.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'product_file' => 'nullable|file|max:51200',
            'template_structure' => 'nullable|array',
            'educational_stage' => 'nullable|string|max:100',
            'subject' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'is_featured' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ], [
            'slug.unique' => 'هذا الرابط مستخدم بالفعل',
            'category_id.exists' => 'التصنيف غير موجود',
        ]);

        try {
            // Handle thumbnail upload
            if ($request->hasFile('thumbnail')) {
                // Delete old thumbnail
                if ($product->thumbnail_url) {
                    $oldPath = str_replace('/storage/', '', parse_url($product->thumbnail_url, PHP_URL_PATH));
                    Storage::disk('public')->delete($oldPath);
                }
                $thumbnailPath = $request->file('thumbnail')->store('products/thumbnails', 'public');
                $validated['thumbnail_url'] = Storage::disk('public')->url($thumbnailPath);
            }

            // Handle preview images upload
            if ($request->hasFile('preview_images')) {
                $previewUrls = [];
                foreach ($request->file('preview_images') as $image) {
                    $path = $image->store('products/previews', 'public');
                    $previewUrls[] = Storage::disk('public')->url($path);
                }
                $validated['preview_images'] = $previewUrls;
            }

            // Handle product file upload
            if ($request->hasFile('product_file')) {
                // Delete old file
                if ($product->file_path) {
                    Storage::disk('local')->delete($product->file_path);
                }
                $file = $request->file('product_file');
                $validated['file_path'] = $file->store('products/files', 'local');
                $validated['file_name'] = $file->getClientOriginalName();
                $validated['file_size'] = $file->getSize();
            }

            $product->update($validated);

            Log::info("Product updated by admin", [
                'product_id' => $product->id,
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث المنتج بنجاح',
                'data' => new ProductResource($product->fresh()->load('category')),
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to update product", [
                'product_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث المنتج',
                'error' => 'update_error',
            ], 500);
        }
    }

    /**
     * Delete a product (Admin only).
     * 
     * DELETE /api/admin/products/{id}
     * 
     * @param Request $request
     * @param string $id Product UUID
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        try {
            // Soft delete (keeps files for recovery)
            $product->delete();

            Log::info("Product deleted by admin", [
                'product_id' => $id,
                'admin_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المنتج بنجاح',
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to delete product", [
                'product_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حذف المنتج',
                'error' => 'delete_error',
            ], 500);
        }
    }

    /**
     * List all products for admin (including inactive).
     * 
     * GET /api/admin/products
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Product::query()->with('category');

        // Include soft deleted if requested
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name (for GlobalSearch)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Get a single product for admin (by ID).
     * 
     * GET /api/admin/products/{id}
     * 
     * @param string $id Product UUID
     * @return JsonResponse
     */
    public function adminShow(string $id): JsonResponse
    {
        $product = Product::withTrashed()->with('category')->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }
}
