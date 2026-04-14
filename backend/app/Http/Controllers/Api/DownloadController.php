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
 * Handles secure file downloads for purchased templates.
 * Verifies ownership before allowing download.
 * Updated to use templates instead of products.
 * 
 * @package App\Http\Controllers\Api
 */
class DownloadController extends Controller
{
    /**
     * List all purchased/downloadable items for the authenticated user.
     *
     * GET /api/downloads
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $orderItems = OrderItem::with(['order', 'template:id,name_ar,thumbnail,type,ready_file'])
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->where('status', 'completed');
            })
            ->whereNotNull('template_id')
            ->paginate(min($request->input('per_page', 20), 50));

        $items = $orderItems->getCollection()->map(function ($item) {
            $template = $item->template;
            $hasFile  = $template && $template->ready_file && Storage::disk('public')->exists($template->ready_file);

            return [
                'order_item_id'  => $item->id,
                'template_id'    => $template?->id,
                'template_name'  => $template?->name_ar,
                'template_type'  => $template?->type,
                'thumbnail_url'  => $template?->thumbnail_url,
                'can_download'   => $hasFile,
                'purchased_at'   => $item->order->paid_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $orderItems->currentPage(),
                'last_page'    => $orderItems->lastPage(),
                'total'        => $orderItems->total(),
            ],
        ]);
    }

    /**
     * Download a purchased template file.
     *
     * GET /api/downloads/{orderItemId}
     *
     * Security checks:
     * - User must be authenticated
     * - Order must be completed
     * - User must own the order
     * - Template must have a file
     *
     * @param Request $request
     * @param string $orderItemId
     * @return JsonResponse|StreamedResponse
     */
    public function download(Request $request, string $orderItemId)
    {
        $user = $request->user();

        // Find the order item with template
        $orderItem = OrderItem::with(['order', 'template'])->find($orderItemId);

        // [FIX-DL] Fallback: the frontend may send a UserLibrary ID instead of OrderItem ID
        // (this happens with cached responses before the fix was deployed)
        if (!$orderItem) {
            $libraryEntry = \App\Models\UserLibrary::where('id', $orderItemId)
                ->where('user_id', $user->id)
                ->first();

            if ($libraryEntry) {
                // Find the actual OrderItem via order_id + template_id
                $orderItem = OrderItem::with(['order', 'template'])
                    ->where('order_id', $libraryEntry->order_id)
                    ->where('template_id', $libraryEntry->template_id)
                    ->first();

                Log::info("Download fallback: resolved UserLibrary ID to OrderItem", [
                    'user_library_id' => $orderItemId,
                    'order_item_id' => $orderItem?->id,
                ]);
            }
        }

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

        // Get the template
        $template = $orderItem->template;

        // Verify template has a file (ready_file for ready templates)
        if (!$template->ready_file) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد ملف للتحميل',
                'error' => 'no_file',
            ], 404);
        }

        // Verify file exists
        if (!Storage::disk('public')->exists($template->ready_file)) {
            Log::error("Template file not found", [
                'template_id' => $template->id,
                'file_path' => $template->ready_file,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود، يرجى التواصل مع الدعم',
                'error' => 'file_missing',
            ], 404);
        }

        Log::info("File downloaded", [
            'user_id' => $user->id,
            'template_id' => $template->id,
            'order_item_id' => $orderItemId,
        ]);

        // Sanitize filename (keep Arabic/Unicode letters, numbers, spaces, dashes, underscores)
        $safeName = preg_replace('/[^\p{L}\p{N}\s\-_]/u', '', $template->name_ar) ?: 'template';
        $extension = pathinfo($template->ready_file, PATHINFO_EXTENSION);
        $fileName = trim($safeName) . '.' . $extension;

        // RFC 5987: Use filename* for proper Unicode (Arabic) support in Content-Disposition
        // Also provide an ASCII-only fallback filename for older browsers
        $asciiName = 'template_' . substr(md5($template->id), 0, 8) . '.' . $extension;
        $encodedName = rawurlencode($fileName);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->download(
            $template->ready_file,
            $fileName,
            [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => "attachment; filename=\"{$asciiName}\"; filename*=UTF-8''{$encodedName}",
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

        $orderItem = OrderItem::with(['order', 'template'])->find($orderItemId);

        if (!$orderItem || $orderItem->order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'غير موجود',
            ], 404);
        }

        $template = $orderItem->template;
        $fileExists = $template->ready_file && Storage::disk('public')->exists($template->ready_file);
        $canDownload = $orderItem->order->status === 'completed' && $fileExists;

        $fileSize = null;
        if ($fileExists) {
            $fileSize = Storage::disk('public')->size($template->ready_file);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_item_id' => $orderItemId,
                'template_name' => $template->name_ar,
                'template_type' => $template->type,
                'file_name' => $template->ready_file ? basename($template->ready_file) : null,
                'file_size' => $fileSize,
                'file_size_formatted' => $this->formatBytes($fileSize),
                'can_download' => $canDownload,
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
