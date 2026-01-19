<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirestoreService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * EducationalServiceController
 * 
 * Handles all educational services (analyses, certificates, plans, achievements, performances, tests)
 * using Firebase Firestore as the data store.
 */
class EducationalServiceController extends Controller
{
    protected FirestoreService $firestoreService;

    // Valid service types
    protected array $validServices = [
        'analyses',
        'certificates', 
        'plans',
        'achievements',
        'performances',
        'tests',
    ];

    public function __construct(FirestoreService $firestoreService)
    {
        $this->firestoreService = $firestoreService;
    }

    /**
     * Get all items for a specific service type.
     */
    public function index(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $userId = Auth::id();
            $filters = $request->only(['status', 'type']);
            
            $items = $this->firestoreService->getUserEducationalServices(
                $serviceType,
                $userId,
                $filters
            );

            return response()->json([
                'success' => true,
                'data' => $items,
                'count' => count($items),
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific item.
     */
    public function show(string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $item = $this->firestoreService->getEducationalService($serviceType, $id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'Item not found',
                ], 404);
            }

            // Check ownership
            if ($item['user_id'] !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $item,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new item.
     */
    public function store(Request $request, string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $userId = Auth::id();
            $data = $request->all();

            $documentId = $this->firestoreService->createEducationalService(
                $serviceType,
                $userId,
                $data
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $documentId,
                    'message' => 'Item created successfully',
                ],
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an item.
     */
    public function update(Request $request, string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            // Check ownership
            $item = $this->firestoreService->getEducationalService($serviceType, $id);
            
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'Item not found',
                ], 404);
            }

            if ($item['user_id'] !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                ], 403);
            }

            $data = $request->all();
            $this->firestoreService->updateEducationalService($serviceType, $id, $data);

            return response()->json([
                'success' => true,
                'message' => 'Item updated successfully',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an item.
     */
    public function destroy(string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            // Check ownership
            $item = $this->firestoreService->getEducationalService($serviceType, $id);
            
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'Item not found',
                ], 404);
            }

            if ($item['user_id'] !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                ], 403);
            }

            $this->firestoreService->deleteEducationalService($serviceType, $id);

            return response()->json([
                'success' => true,
                'message' => 'Item deleted successfully',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export an item (generate PDF/image).
     */
    public function export(Request $request, string $serviceType, string $id): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $format = $request->input('format', 'pdf');
            
            // Check ownership
            $item = $this->firestoreService->getEducationalService($serviceType, $id);
            
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'error' => 'Item not found',
                ], 404);
            }

            if ($item['user_id'] !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                ], 403);
            }

            // TODO: Implement actual export logic
            // This would generate PDF/image based on the item data and template

            return response()->json([
                'success' => true,
                'data' => [
                    'download_url' => '/api/downloads/' . $id . '.' . $format,
                    'format' => $format,
                ],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get statistics for a service type.
     */
    public function statistics(string $serviceType): JsonResponse
    {
        if (!$this->isValidServiceType($serviceType)) {
            return response()->json(['error' => 'Invalid service type'], 400);
        }

        try {
            $userId = Auth::id();
            $items = $this->firestoreService->getUserEducationalServices($serviceType, $userId);

            $stats = [
                'total' => count($items),
                'draft' => 0,
                'completed' => 0,
                'exported' => 0,
            ];

            foreach ($items as $item) {
                $status = $item['status'] ?? 'draft';
                if (isset($stats[$status])) {
                    $stats[$status]++;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if service type is valid.
     */
    protected function isValidServiceType(string $serviceType): bool
    {
        return in_array($serviceType, $this->validServices);
    }
}
