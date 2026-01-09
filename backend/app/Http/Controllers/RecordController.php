<?php
// app/Http/Controllers/Api/RecordController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Services\FirestoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecordController extends Controller
{
    public function __construct(
        protected FirestoreService $firestoreService
    ) {}

    /**
     * الحصول على سجلات المستخدم
     */
    public function index(Request $request): JsonResponse
    {
        // الحصول على السجلات من Firestore
        $records = $this->firestoreService->getUserRecords($request->user()->id);

        // إضافة معلومات المنتج من MySQL
        $recordsWithProducts = collect($records)->map(function ($record) {
            $orderItem = OrderItem::where('firestore_record_id', $record['id'])
                ->with('product:id,name_ar,name_en,thumbnail_url')
                ->first();

            return array_merge($record, [
                'product' => $orderItem?->product,
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $recordsWithProducts,
        ]);
    }

    /**
     * الحصول على سجل واحد
     */
    public function show(Request $request, string $recordId): JsonResponse
    {
        // التحقق من ملكية السجل
        $orderItem = OrderItem::where('firestore_record_id', $recordId)
            ->whereHas('order', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->firstOrFail();

        $record = $this->firestoreService->getUserRecord($recordId);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'السجل غير موجود',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $record,
        ]);
    }

    /**
     * تحديث بيانات السجل
     */
    public function update(Request $request, string $recordId): JsonResponse
    {
        // التحقق من ملكية السجل
        $orderItem = OrderItem::where('firestore_record_id', $recordId)
            ->whereHas('order', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->firstOrFail();

        $validated = $request->validate([
            'user_data' => 'required|array',
        ]);

        $success = $this->firestoreService->updateUserData(
            $recordId,
            $validated['user_data']
        );

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'فشل تحديث السجل',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث السجل بنجاح',
        ]);
    }
}