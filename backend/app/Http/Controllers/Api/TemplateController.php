<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Section;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
     */
    public function index(Request $request): JsonResponse
    {
        $query = Template::with(['category.section', 'variants', 'defaultVariant'])
            ->active();

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
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
    public function show(Template $template): JsonResponse
    {
        $template->load(['category.section', 'variants', 'fields']);

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
}
