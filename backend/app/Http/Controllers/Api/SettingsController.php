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
     * Update system settings.
     * POST /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $allowed = ['site_name', 'site_description', 'contact_email', 'default_currency', 'maintenance_mode', 'allow_registration'];
        $data = $request->only($allowed);

        // [FIX-CRITICAL] Persist settings to DB to prevent data loss on cache expiry.
        // The old implementation only used Cache (24h) — after expiry or cache:clear,
        // all settings would reset to defaults silently.
        try {
            foreach ($data as $key => $value) {
                DB::table('system_settings')->updateOrInsert(
                    ['key' => $key],
                    ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value, 'updated_at' => now()]
                );
            }
        } catch (\Throwable $e) {
            // DB table might not exist yet — fallback to cache only and log warning
            Log::warning('system_settings table not found, falling back to cache', ['error' => $e->getMessage()]);
        }

        // Also keep cache for fast reads (backed by DB for durability)
        Cache::put('admin_settings', $data, 86400);

        return response()->json(['success' => true, 'message' => 'تم حفظ الإعدادات بنجاح', 'data' => $data]);
    }


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
            $isDebug = (bool) config('app.debug');
            $isProduction = config('app.env') === 'production';

            // [FIX-C02] Read custom settings from DB first, fall back to cache, then defaults
            $customSettings = [];
            try {
                $customSettings = DB::table('system_settings')
                    ->pluck('value', 'key')
                    ->toArray();
            } catch (\Throwable $e) {
                // DB table might not exist yet — try cache fallback
                $customSettings = Cache::get('admin_settings', []);
            }

            $siteName = $customSettings['site_name'] ?? config('app.name');
            $settings = [
                // App Info — custom settings override config defaults
                'app_name'         => $siteName,
                'site_name'        => $siteName, // [FIX] Frontend reads site_name
                'app_env'          => config('app.env'),
                'site_description' => $customSettings['site_description'] ?? '',
                'contact_email'    => $customSettings['contact_email'] ?? config('mail.from.address'),
                'default_currency' => $customSettings['default_currency'] ?? 'SAR',
                'allow_registration' => isset($customSettings['allow_registration'])
                    ? (bool) $customSettings['allow_registration']
                    : true,
                'maintenance_mode' => app()->isDownForMaintenance(), // [FIX] Frontend reads maintenance_mode
                // Security: expose only whether debug is safe (off in prod), not the raw boolean
                'debug_mode'       => $isDebug ? 'enabled' : 'disabled',
                // Alert flag for the admin dashboard so it shows a banner warning
                'debug_warning'    => $isDebug && $isProduction,
                'app_url'          => config('app.url'),

                // Mail Config (limited info for security)
                'mail_mailer'      => config('mail.default'),
                'mail_from'        => config('mail.from.address'),

                // Cache & Queue
                'cache_driver'     => config('cache.default'),
                'queue_connection' => config('queue.default'),
                'session_driver'   => config('session.driver'),

                // Storage
                'filesystem_disk'  => config('filesystems.default'),

                // System Status — mask minor PHP version to prevent fingerprinting
                'php_version'      => PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '.x',
                'laravel_version'  => app()->version(),
                'timezone'         => config('app.timezone'),

                // Health Check
                'database_connected' => $this->isDatabaseConnected(),
                'storage_writable'   => is_writable(storage_path()),
                'cache_working'      => $this->isCacheWorking(),
            ];

            return response()->json([
                'success' => true,
                'data'    => $settings,
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
     * Body: { "enable": true|false }
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function toggleMaintenance(Request $request): JsonResponse
    {
        try {
            $enable = $request->boolean('enable');

            if ($enable) {
                // [FIX-11] Generate a stable bypass secret stored in cache so the admin
                // knows which URL to use to bypass maintenance mode.
                // Access: GET http://your-domain?secret=<bypass_secret>
                $secret = 'sers-admin-' . bin2hex(random_bytes(12));

                Artisan::call('down', [
                    '--secret' => $secret,
                    '--render' => 'errors.503',
                    '--retry'  => 60,
                ]);

                // Store secret for 24h so admin can retrieve it if needed
                Cache::put('maintenance_bypass_secret', $secret, now()->addHours(24));

                Log::warning('Maintenance mode ENABLED', [
                    'admin_id' => auth()->id(),
                ]);

                return response()->json([
                    'success'            => true,
                    'message'            => 'تم تفعيل وضع الصيانة',
                    'maintenance_mode'   => true,
                    // Return bypass secret so admin can still access the site
                    'bypass_secret'      => $secret,
                    'bypass_url_hint'    => config('app.url') . '/' . $secret,
                ]);
            } else {
                Artisan::call('up');

                Cache::forget('maintenance_bypass_secret');

                Log::info('Maintenance mode DISABLED', [
                    'admin_id' => auth()->id(),
                ]);

                return response()->json([
                    'success'          => true,
                    'message'          => 'تم إلغاء وضع الصيانة. الموقع يعمل الآن بشكل طبيعي.',
                    'maintenance_mode' => false,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to toggle maintenance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تغيير وضع الصيانة. يرجى المحاولة مرة أخرى',
            ], 500);
        }
    }

    /**
     * Get current maintenance mode status.
     *
     * GET /api/admin/settings/maintenance
     *
     * @return JsonResponse
     */
    public function maintenanceStatus(): JsonResponse
    {
        $isDown   = app()->isDownForMaintenance();
        $secret   = $isDown ? Cache::get('maintenance_bypass_secret') : null;

        return response()->json([
            'success'          => true,
            'maintenance_mode' => $isDown,
            'bypass_secret'    => $secret,
        ]);
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
