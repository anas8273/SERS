<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ResourceController extends Controller
{
    /**
     * Display a listing of resources.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Resource::active();

        // Filter by type
        if ($request->has('type')) {
            $query->ofType($request->type);
        }

        // Filter by free/paid
        if ($request->has('is_free')) {
            $query->where('is_free', $request->boolean('is_free'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                  ->orWhere('title_en', 'like', "%{$search}%")
                  ->orWhere('description_ar', 'like', "%{$search}%");
            });
        }

        // Search by tags
        if ($request->has('tag')) {
            $query->whereJsonContains('tags', $request->tag);
        }

        // Sort — whitelist to prevent SQL injection via arbitrary column names
        $allowedSorts = ['created_at', 'downloads_count', 'title_ar', 'title_en', 'is_free'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts) ? $request->get('sort_by') : 'created_at';
        $sortOrder = $request->get('sort_order', 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Cap per_page to prevent memory exhaustion
        $resources = $query->paginate(min($request->get('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $resources,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Resource $resource): JsonResponse
    {
        if (!$resource->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'المورد غير متاح',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $resource,
        ]);
    }

    /**
     * Download a resource.
     */
    public function download(Resource $resource): JsonResponse
    {
        if (!$resource->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'المورد غير متاح',
            ], 404);
        }

        $resource->incrementDownloads();

        return response()->json([
            'success' => true,
            'download_url' => $resource->file_url,
        ]);
    }

    /**
     * Get resources by type.
     */
    public function byType(string $type): JsonResponse
    {
        $resources = Resource::active()
            ->ofType($type)
            ->orderBy('downloads_count', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $resources,
        ]);
    }

    /**
     * Get popular resources.
     */
    public function popular(): JsonResponse
    {
        $resources = Resource::active()
            ->orderBy('downloads_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $resources,
        ]);
    }
}
