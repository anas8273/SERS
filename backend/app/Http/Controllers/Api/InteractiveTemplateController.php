<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\FavoriteTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InteractiveTemplateController extends Controller
{
    /**
     * Display a listing of the templates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Template::with(['category', 'variants'])
            ->interactive()
            ->active();

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by free/paid
        if ($request->has('is_free')) {
            $query->where('is_free', $request->boolean('is_free'));
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

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $templates = $query->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Display the specified template.
     */
    public function show(Template $template): JsonResponse
    {
        // Ensure it's an interactive template
        if (!$template->isInteractive()) {
            return response()->json([
                'success' => false,
                'message' => 'هذا القالب ليس تفاعلياً'
            ], 404);
        }

        $template->load(['category', 'variants', 'fields']);
        $template->incrementUses();

        return response()->json([
            'success' => true,
            'data' => $template,
        ]);
    }

    /**
     * Get templates by category.
     */
    public function byCategory(int $categoryId): JsonResponse
    {
        $templates = Template::with(['variants'])
            ->interactive()
            ->active()
            ->where('category_id', $categoryId)
            ->orderBy('downloads_count', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Get popular templates.
     */
    public function popular(): JsonResponse
    {
        $templates = Template::with(['category', 'variants'])
            ->interactive()
            ->active()
            ->orderBy('downloads_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Get free templates.
     */
    public function free(): JsonResponse
    {
        $templates = Template::with(['category', 'variants'])
            ->interactive()
            ->active()
            ->free()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Toggle favorite status.
     */
    public function toggleFavorite(Request $request, Template $template): JsonResponse
    {
        $user = $request->user();

        $favorite = FavoriteTemplate::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->first();

        if ($favorite) {
            $favorite->delete();
            $isFavorite = false;
        } else {
            FavoriteTemplate::create([
                'user_id' => $user->id,
                'template_id' => $template->id,
            ]);
            $isFavorite = true;
        }

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
            'message' => $isFavorite ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة',
        ]);
    }

    /**
     * Get user's favorite templates.
     */
    public function favorites(Request $request): JsonResponse
    {
        $user = $request->user();

        $templates = Template::with(['category', 'variants'])
            ->interactive()
            ->whereHas('favoritedByUsers', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }
}
