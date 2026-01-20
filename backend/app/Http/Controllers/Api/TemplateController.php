<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Section;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TemplateController extends Controller
{
    /**
     * Get all sections with their categories.
     */
    public function sections(): JsonResponse
    {
        $sections = Section::with(['categories' => function ($query) {
            $query->where('is_active', true)->orderBy('sort_order');
        }])->orderBy('sort_order')->get();

        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }

    /**
     * Get templates by category.
     * 
     * ARCHITECTURE: This method fetches templates from MySQL ONLY.
     * MySQL is the PRIMARY SOURCE OF TRUTH for all template metadata.
     * Firestore is optional and used only for interactive field data (future).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Template::with(['category.section', 'variants', 'defaultVariant'])
            ->active();

        // Filter by category (supports both ID and slug)
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        
        // Support category slug for frontend convenience
        if ($request->has('category') && !$request->has('category_id')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        // Filter by section
        if ($request->has('section_id')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('section_id', $request->section_id);
            });
        }

        // Filter by type (ready/interactive)
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by featured
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('description_ar', 'like', "%{$search}%")
                  ->orWhere('description_en', 'like', "%{$search}%");
            });
        }

        $templates = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Get a single template with all details.
     */
    /**
     * Get a single template with all details.
     * Supports lookup by UUID or Slug.
     */
    public function show($id): JsonResponse
    {
        // Try finding by UUID or Slug
        $template = Template::with(['category.section', 'variants', 'fields'])
            ->where('id', $id)
            ->orWhere('slug', $id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    /**
     * Get templates by section slug.
     */
    public function bySection(string $slug): JsonResponse
    {
        $section = Section::where('slug', $slug)->firstOrFail();

        $templates = Template::with(['category', 'variants', 'defaultVariant'])
            ->active()
            ->whereHas('category', function ($q) use ($section) {
                $q->where('section_id', $section->id);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'section' => $section,
                'templates' => $templates
            ]
        ]);
    }

    /**
     * Get templates by category slug.
     */
    public function byCategory(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $templates = Template::with(['variants', 'defaultVariant'])
            ->active()
            ->where('category_id', $category->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category->load('section'),
                'templates' => $templates
            ]
        ]);
    }

    /**
     * Get featured templates.
     */
    public function featured(): JsonResponse
    {
        $templates = Template::with(['category.section', 'defaultVariant'])
            ->active()
            ->featured()
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Download ready template file.
     */
    public function download(Template $template): JsonResponse
    {
        if (!$template->isReady() || !$template->ready_file) {
            return response()->json([
                'success' => false,
                'message' => 'هذا القالب غير متاح للتحميل المباشر'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'download_url' => asset('storage/' . $template->ready_file)
            ]
        ]);
    }

    // =========================================================================
    // Admin CRUD Methods
    // =========================================================================

    /**
     * Admin: Get all templates including inactive ones.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Template::with(['category.section', 'variants']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $templates = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ]
        ]);
    }

    /**
     * Admin: Store a new template.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:ready,interactive',
            'format' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'ready_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,zip|max:10240',
        ]);

        // Generate slug - robust logic for Arabic
        $slug = null;
        
        // 1. Try English name if available
        if (!empty($validated['name_en'])) {
            $slug = Str::slug($validated['name_en']);
        }
        
        // 2. If no slug yet, try transliterating Arabic or using ID-like string
        if (empty($slug)) {
            // Str::slug often fails for pure Arabic without proper locale config
            $slug = Str::slug($validated['name_ar']);
            
            if (empty($slug)) {
                // Fallback: use 'template-' + timestamp
                $slug = 'template-' . time();
            }
        }

        // Ensure uniqueness
        $originalSlug = $slug;
        $counter = 1;
        while (Template::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        // Handle thumbnail upload
        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('templates/thumbnails', 'public');
        }

        // Handle ready file upload
        $readyFilePath = null;
        if ($request->hasFile('ready_file')) {
            $readyFilePath = $request->file('ready_file')->store('templates/files', 'public');
        }

        // Create template in MySQL (PRIMARY SOURCE OF TRUTH)
        $template = Template::create([
            'name_ar' => $validated['name_ar'],
            'name_en' => $validated['name_en'] ?? $validated['name_ar'],
            'slug' => $slug,
            'description_ar' => $validated['description_ar'] ?? '',
            'description_en' => $validated['description_en'] ?? '',
            'category_id' => $validated['category_id'],
            'type' => $validated['type'],
            'format' => $validated['format'] ?? 'pdf',
            'price' => $validated['price'],
            'is_free' => $request->boolean('is_free', $validated['price'] == 0),
            'is_active' => $request->boolean('is_active', true), // Active by default for immediate visibility
            'is_featured' => $request->boolean('is_featured', false),
            'thumbnail' => $thumbnailPath,
            'ready_file' => $readyFilePath,
        ]);

        // =========================================================================
        // TODO: FIRESTORE SYNC (Future Integration)
        // =========================================================================
        // When Firebase is enabled, uncomment the following to sync interactive 
        // template data to Firestore. The UUID from MySQL is used as documentId.
        //
        // if ($validated['type'] === 'interactive') {
        //     try {
        //         $firestore = app('firebase.firestore')->database();
        //         $firestore->collection('templates')->document($template->id)->set([
        //             'fields' => [],
        //             'variants' => [],
        //             'created_at' => now()->toISOString(),
        //             'mysql_id' => $template->id, // UUID link
        //         ]);
        //     } catch (\Exception $e) {
        //         // Log error but don't fail - MySQL is source of truth
        //         \Log::warning('Firestore sync failed for template: ' . $template->id);
        //     }
        // }
        // =========================================================================

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء القالب بنجاح',
            'data' => $template->load('category')
        ], 201);
    }

    /**
     * Admin: Update an existing template.
     */
    public function update(Request $request, Template $template): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'category_id' => 'sometimes|required|exists:categories,id',
            'type' => 'sometimes|required|in:ready,interactive',
            'format' => 'nullable|string|max:50',
            'price' => 'sometimes|required|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'ready_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,zip|max:10240',
        ]);

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            // Delete old thumbnail
            if ($template->thumbnail) {
                Storage::disk('public')->delete($template->thumbnail);
            }
            $validated['thumbnail'] = $request->file('thumbnail')->store('templates/thumbnails', 'public');
        }

        // Handle ready file upload
        if ($request->hasFile('ready_file')) {
            // Delete old file
            if ($template->ready_file) {
                Storage::disk('public')->delete($template->ready_file);
            }
            $validated['ready_file'] = $request->file('ready_file')->store('templates/files', 'public');
        }

        // Update slug if name changed
        if (isset($validated['name_ar']) && $validated['name_ar'] !== $template->name_ar) {
            $slug = Str::slug($validated['name_ar'], '-');
            $originalSlug = $slug;
            $counter = 1;
            while (Template::where('slug', $slug)->where('id', '!=', $template->id)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        // Handle boolean fields
        if ($request->has('is_free')) {
            $validated['is_free'] = $request->boolean('is_free');
        }
        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }
        if ($request->has('is_featured')) {
            $validated['is_featured'] = $request->boolean('is_featured');
        }

        $template->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث القالب بنجاح',
            'data' => $template->fresh()->load('category')
        ]);
    }

    /**
     * Admin: Delete a template (soft delete).
     */
    public function destroy(Template $template): JsonResponse
    {
        // Delete associated files
        if ($template->thumbnail) {
            Storage::disk('public')->delete($template->thumbnail);
        }
        if ($template->ready_file) {
            Storage::disk('public')->delete($template->ready_file);
        }

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف القالب بنجاح'
        ]);
    }

    /**
     * Admin: Toggle template active status.
     */
    public function toggleStatus(Template $template): JsonResponse
    {
        $template->update([
            'is_active' => !$template->is_active
        ]);

        return response()->json([
            'success' => true,
            'message' => $template->is_active ? 'تم تفعيل القالب' : 'تم إلغاء تفعيل القالب',
            'data' => $template->fresh()
        ]);
    }

    /**
     * Admin: Toggle template featured status.
     */
    public function toggleFeatured(Template $template): JsonResponse
    {
        $template->update([
            'is_featured' => !$template->is_featured
        ]);

        return response()->json([
            'success' => true,
            'message' => $template->is_featured ? 'تم تمييز القالب' : 'تم إلغاء تمييز القالب',
            'data' => $template->fresh()
        ]);
    }
}

