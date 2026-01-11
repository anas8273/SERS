<?php
// app/Http/Controllers/Api/DownloadController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * DownloadController
 * 
 * Handles secure file downloads for purchased products.
 * Verifies ownership before allowing download.
 * 
 * @package App\Http\Controllers\Api
 */
class DownloadController extends Controller
{
    /**
     * Download a purchased product file.
     * 
     * GET /api/downloads/{orderItemId}
     * 
     * Security checks:
     * - User must be authenticated
     * - Order must be completed
     * - User must own the order
     * - Product must have a file
     * 
     * @param Request $request
     * @param string $orderItemId
     * @return JsonResponse|StreamedResponse
     */
    public function download(Request $request, string $orderItemId)
    {
        $user = $request->user();

        // Find the order item with product
        $orderItem = OrderItem::with(['order', 'product'])->find($orderItemId);

        if (!$orderItem) {
            return response()->json([
                'success' => false,
                'message' => 'عنصر الطلب غير موجود',
                'error' => 'not_found',
            ], 404);
        }

        // Verify ownership
        if ($orderItem->order->user_id !== $user->id) {
            Log::warning("Unauthorized download attempt", [
                'user_id' => $user->id,
                'order_item_id' => $orderItemId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية لتحميل هذا الملف',
                'error' => 'forbidden',
            ], 403);
        }

        // Verify order is completed
        if ($orderItem->order->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'الطلب غير مكتمل',
                'error' => 'order_not_completed',
            ], 400);
        }

        // Get the product
        $product = $orderItem->product;

        // Verify product has a file
        if (!$product->file_path) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد ملف للتحميل',
                'error' => 'no_file',
            ], 404);
        }

        // Verify file exists
        if (!Storage::disk('local')->exists($product->file_path)) {
            Log::error("Product file not found", [
                'product_id' => $product->id,
                'file_path' => $product->file_path,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود، يرجى التواصل مع الدعم',
                'error' => 'file_missing',
            ], 404);
        }

        // Increment download count
        $product->increment('downloads_count');

        Log::info("File downloaded", [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'order_item_id' => $orderItemId,
        ]);

        // Stream the file download
        $fileName = $product->file_name ?? 'download';
        
        return Storage::disk('local')->download(
            $product->file_path,
            $fileName,
            [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]
        );
    }

    /**
     * Get download info (without downloading).
     * 
     * GET /api/downloads/{orderItemId}/info
     * 
     * @param Request $request
     * @param string $orderItemId
     * @return JsonResponse
     */
    public function info(Request $request, string $orderItemId): JsonResponse
    {
        $user = $request->user();

        $orderItem = OrderItem::with(['order', 'product'])->find($orderItemId);

        if (!$orderItem || $orderItem->order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير موجود',
            ], 404);
        }

        $product = $orderItem->product;
        $canDownload = $orderItem->order->status === 'completed' 
            && $product->file_path 
            && Storage::disk('local')->exists($product->file_path);

        return response()->json([
            'success' => true,
            'data' => [
                'order_item_id' => $orderItemId,
                'product_name' => $product->name_ar,
                'file_name' => $product->file_name,
                'file_size' => $product->file_size,
                'file_size_formatted' => $this->formatBytes($product->file_size),
                'can_download' => $canDownload,
                'downloads_count' => $product->downloads_count,
            ],
        ]);
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes(?int $bytes): string
    {
        if (!$bytes) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
