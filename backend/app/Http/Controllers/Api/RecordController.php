<?php
// app/Http/Controllers/Api/RecordController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Services\FirestoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * RecordController
 * 
 * Handles interactive educational records stored in Firestore.
 * Provides listing, viewing, and updating of user records.
 * 
 * @package App\Http\Controllers\Api
 */
class RecordController extends Controller
{
    public function __construct(
        protected FirestoreService $firestoreService
    ) {}

    /**
     * List user's interactive records.
     * 
     * GET /api/records
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get records from Firestore
            $records = $this->firestoreService->getUserRecords($request->user()->id);

            // Enhance with product info from MySQL
            $recordsWithProducts = collect($records)->map(function ($record) {
                $orderItem = OrderItem::where('firestore_record_id', $record['id'])
                    ->with('product:id,name_ar,name_en,thumbnail_url,type')
                    ->first();

                return array_merge($record, [
                    'product' => $orderItem?->product,
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $recordsWithProducts->values(),
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to fetch user records", [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء جلب السجلات',
                'error' => 'fetch_error',
            ], 500);
        }
    }

    /**
     * Get a single record by ID.
     * 
     * GET /api/records/{recordId}
     * 
     * @param Request $request
     * @param string $recordId Firestore document ID
     * @return JsonResponse
     */
    public function show(Request $request, string $recordId): JsonResponse
    {
        try {
            // Verify ownership through OrderItem
            $orderItem = OrderItem::where('firestore_record_id', $recordId)
                ->whereHas('order', function ($query) use ($request) {
                    $query->where('user_id', $request->user()->id);
                })
                ->with('product')
                ->first();

            if (!$orderItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'السجل غير موجود أو غير مصرح لك بالوصول إليه',
                    'error' => 'not_found',
                ], 404);
            }

            // Get record from Firestore
            $record = $this->firestoreService->getUserRecord($recordId);

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'السجل غير موجود في Firestore',
                    'error' => 'firestore_not_found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => array_merge($record, [
                    'product' => $orderItem->product,
                ]),
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to fetch record", [
                'record_id' => $recordId,
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء جلب السجل',
                'error' => 'fetch_error',
            ], 500);
        }
    }

    /**
     * Update record data.
     * 
     * PUT /api/records/{recordId}
     * 
     * @param Request $request
     * @param string $recordId Firestore document ID
     * @return JsonResponse
     */
    public function update(Request $request, string $recordId): JsonResponse
    {
        // Verify ownership
        $orderItem = OrderItem::where('firestore_record_id', $recordId)
            ->whereHas('order', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->first();

        if (!$orderItem) {
            return response()->json([
                'success' => false,
                'message' => 'السجل غير موجود أو غير مصرح لك بالوصول إليه',
                'error' => 'not_found',
            ], 404);
        }

        $validated = $request->validate([
            'user_data' => 'required|array',
        ], [
            'user_data.required' => 'بيانات المستخدم مطلوبة',
            'user_data.array' => 'بيانات المستخدم يجب أن تكون مصفوفة',
        ]);

        try {
            $success = $this->firestoreService->updateUserData(
                $recordId,
                $validated['user_data']
            );

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل تحديث السجل',
                    'error' => 'update_failed',
                ], 500);
            }

            Log::info("Record updated", [
                'record_id' => $recordId,
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث السجل بنجاح',
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to update record", [
                'record_id' => $recordId,
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث السجل',
                'error' => 'update_error',
            ], 500);
        }
    }
}
