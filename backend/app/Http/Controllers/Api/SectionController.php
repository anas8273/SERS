<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\JsonResponse;

class SectionController extends Controller
{
    /**
     * Get all sections.
     */
    public function index(): JsonResponse
    {
        $sections = Section::orderBy('order')->get();

        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }

    /**
     * Get a single section with categories.
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
}
