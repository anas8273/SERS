<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SectionController extends Controller
{
    /**
     * Get all active sections (public).
     */
    public function index(): JsonResponse
    {
        // [PERF] Cache public sections — rarely change, heavily requested
        $sections = Cache::remember('public_sections', 3600, function () {
            return Section::where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }

    /**
     * Get a single section with categories (public).
     */
    public function show(Section $section): JsonResponse
    {
        $section->load(['categories' => function ($query) {
            $query->where('is_active', true)->orderBy('sort_order');
        }]);

        return response()->json([
            'success' => true,
            'data' => $section
        ]);
    }

    /**
     * Get section by slug with categories and templates.
     */
    public function bySlug(string $slug): JsonResponse
    {
        $section = Section::where('slug', $slug)
            ->with(['categories' => function ($query) {
                $query->where('is_active', true)
                    ->orderBy('sort_order')
                    ->with(['templates' => function ($q) {
                        $q->where('is_active', true)->with('defaultVariant');
                    }]);
            }])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $section
        ]);
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Get all sections for admin (including inactive).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Section::withCount(['categories', 'templates'])
            ->orderBy('sort_order');

        if ($request->has('search')) {
            $query->search($request->search);
        }

        $sections = $query->get();

        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }

    /**
     * Show single section for admin.
     */
    public function adminShow(string $id): JsonResponse
    {
        $section = Section::with(['categories' => function ($q) {
            $q->orderBy('sort_order');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $section
        ]);
    }

    /**
     * Create a new section.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:sections,slug',
            'description_ar' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $section = Section::create($validated);

        Cache::forget('public_sections');

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء القسم بنجاح',
            'data' => $section
        ], 201);
    }

    /**
     * Update a section.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $section = Section::findOrFail($id);

        $validated = $request->validate([
            'name_ar' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:sections,slug,' . $section->id,
            'description_ar' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $section->update($validated);

        Cache::forget('public_sections');

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث القسم بنجاح',
            'data' => $section->fresh()
        ]);
    }

    /**
     * Delete a section.
     */
    public function destroy(string $id): JsonResponse
    {
        $section = Section::findOrFail($id);

        // Check for templates directly linked to this section
        if ($section->templates()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف القسم لأنه يحتوي على قوالب'
            ], 422);
        }

        $section->delete();

        Cache::forget('public_sections');

        return response()->json([
            'success' => true,
            'message' => 'تم حذف القسم بنجاح'
        ]);
    }

    /**
     * Reorder sections by updating sort_order.
     * Body: { ids: ["id1", "id2", "id3", ...] } — ordered array of section IDs
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'required|string|exists:sections,id',
        ]);

        foreach ($request->ids as $index => $id) {
            Section::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        Cache::forget('public_sections');

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث ترتيب الأقسام بنجاح',
        ]);
    }
}


