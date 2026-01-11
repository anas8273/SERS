<?php
// app/Http/Controllers/Api/SettingsController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * SettingsController
 * 
 * Manages system settings and administrative functions.
 * All endpoints require admin authentication.
 * 
 * @package App\Http\Controllers\Api
 */
class SettingsController extends Controller
{
    /**
     * Get system settings and status.
     * 
     * GET /api/admin/settings
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $settings = [
                // App Info
                'app_name' => config('app.name'),
                'app_env' => config('app.env'),
                'app_debug' => config('app.debug'),
                'app_url' => config('app.url'),
                
                // Mail Config (limited info for security)
                'mail_mailer' => config('mail.default'),
                'mail_from' => config('mail.from.address'),
                
                // Cache & Queue
                'cache_driver' => config('cache.default'),
                'queue_connection' => config('queue.default'),
                'session_driver' => config('session.driver'),
                
                // Storage
                'filesystem_disk' => config('filesystems.default'),
                
                // System Status
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'timezone' => config('app.timezone'),
                
                // Health Check
                'database_connected' => $this->isDatabaseConnected(),
                'storage_writable' => is_writable(storage_path()),
                'cache_working' => $this->isCacheWorking(),
            ];

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch settings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب الإعدادات',
            ], 500);
        }
    }

    /**
     * Clear application caches.
     * 
     * POST /api/admin/settings/clear-cache
     * 
     * @return JsonResponse
     */
    public function clearCache(): JsonResponse
    {
        try {
            Cache::flush();
            
            // Clear Laravel caches
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('view:clear');
            Artisan::call('route:clear');

            Log::info('Caches cleared by admin', [
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم مسح جميع ذاكرة التخزين المؤقت بنجاح',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to clear cache: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في مسح الذاكرة المؤقتة',
            ], 500);
        }
    }

    /**
     * Get system activity logs.
     * 
     * GET /api/admin/settings/logs
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logs(Request $request): JsonResponse
    {
        try {
            $logFile = storage_path('logs/laravel.log');
            
            if (!file_exists($logFile)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'logs' => [],
                        'message' => 'لا يوجد ملف سجلات',
                    ],
                ]);
            }

            // Read last 100 lines
            $lines = $this->tailFile($logFile, 100);
            
            // Parse log entries
            $logs = $this->parseLogEntries($lines);

            return response()->json([
                'success' => true,
                'data' => [
                    'logs' => array_reverse($logs), // Most recent first
                    'file_size' => filesize($logFile),
                    'last_modified' => date('Y-m-d H:i:s', filemtime($logFile)),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب السجلات',
            ], 500);
        }
    }

    /**
     * Toggle maintenance mode.
     * 
     * POST /api/admin/settings/maintenance
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function toggleMaintenance(Request $request): JsonResponse
    {
        try {
            $enable = $request->boolean('enable');
            
            if ($enable) {
                Artisan::call('down', ['--secret' => 'admin-bypass-' . bin2hex(random_bytes(8))]);
                $message = 'تم تفعيل وضع الصيانة';
            } else {
                Artisan::call('up');
                $message = 'تم إلغاء وضع الصيانة';
            }

            Log::info('Maintenance mode toggled', [
                'admin_id' => auth()->id(),
                'enabled' => $enable,
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'maintenance_mode' => $enable,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to toggle maintenance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تغيير وضع الصيانة',
            ], 500);
        }
    }

    /**
     * Get storage/disk usage info.
     * 
     * GET /api/admin/settings/storage
     * 
     * @return JsonResponse
     */
    public function storage(): JsonResponse
    {
        try {
            $storagePath = storage_path('app/public');
            $uploadedFiles = 0;
            $totalSize = 0;

            if (is_dir($storagePath)) {
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($storagePath)
                );
                
                foreach ($iterator as $file) {
                    if ($file->isFile()) {
                        $uploadedFiles++;
                        $totalSize += $file->getSize();
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_files' => $uploadedFiles,
                    'total_size_bytes' => $totalSize,
                    'total_size_mb' => round($totalSize / 1024 / 1024, 2),
                    'storage_path' => 'storage/app/public',
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to get storage info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في جلب معلومات التخزين',
            ], 500);
        }
    }

    /**
     * Check if database is connected.
     */
    private function isDatabaseConnected(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check if cache is working.
     */
    private function isCacheWorking(): bool
    {
        try {
            Cache::put('health_check', 'ok', 1);
            return Cache::get('health_check') === 'ok';
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Read last N lines of a file.
     */
    private function tailFile(string $filepath, int $lines = 100): array
    {
        $file = file($filepath);
        return array_slice($file, -$lines);
    }

    /**
     * Parse Laravel log entries.
     */
    private function parseLogEntries(array $lines): array
    {
        $logs = [];
        $current = null;
        
        foreach ($lines as $line) {
            // Match log line pattern: [2024-01-10 12:00:00] production.ERROR: Message
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*)/', $line, $matches)) {
                if ($current) {
                    $logs[] = $current;
                }
                $current = [
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => strtolower($matches[3]),
                    'message' => $matches[4],
                ];
            } elseif ($current) {
                // Append to current message if it's a continuation
                $current['message'] .= "\n" . trim($line);
            }
        }
        
        if ($current) {
            $logs[] = $current;
        }
        
        return $logs;
    }
}
