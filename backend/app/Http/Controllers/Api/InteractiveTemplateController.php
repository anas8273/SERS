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
     * Supports both route model binding (for /templates/{id}/favorite)
     * and request body (for /wishlist/toggle with template_id)
     */
    public function toggleFavorite(Request $request, ?Template $template = null): JsonResponse
    {
        $user = $request->user();
        
        // Get template from route binding OR from request body
        if (!$template && $request->has('template_id')) {
            $template = Template::find($request->template_id);
        }
        
        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'القالب غير موجود'
            ], 404);
        }

        $favorite = FavoriteTemplate::where('user_id', $user->id)
            ->where('template_id', $template->id)
            ->first();

        if ($favorite) {
            $favorite->delete();
            $isFavorite = false;
            $action = 'removed';
        } else {
            FavoriteTemplate::create([
                'user_id' => $user->id,
                'template_id' => $template->id,
            ]);
            $isFavorite = true;
            $action = 'added';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'is_wishlisted' => $isFavorite,
                'action' => $action,
            ],
            'message' => $isFavorite ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة',
        ]);
    }

    /**
     * Get user's favorite template IDs.
     * Returns array of template IDs for wishlistStore.
     */
    public function favorites(Request $request): JsonResponse
    {
        $user = $request->user();

        // Return just the IDs for the wishlistStore
        $templateIds = FavoriteTemplate::where('user_id', $user->id)
            ->pluck('template_id')
            ->map(fn($id) => (string) $id)
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => $templateIds,
        ]);
    }
}
