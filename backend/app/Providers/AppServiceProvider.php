<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use App\Services\FirestoreService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Cache;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // [PERF-M5] Firestore as singleton — instantiated ONCE per process, not per request.
        // Lazy binding: only created when first injected, not on cold start.
        $this->app->singleton(FirestoreService::class, function ($app) {
            return new FirestoreService();
        });
    }

    public function boot(): void
    {
        // [PERF] Prevent silent attribute discarding — catches bugs without crashing
        Model::preventSilentlyDiscardingAttributes(!app()->isProduction());

        if (app()->isProduction()) {
            // [PERF] Disable query log in production — saves significant memory
            // under high concurrent load (each query object accumulates in RAM).
            DB::disableQueryLog();

            // Only log extremely slow queries in production (>1s)
            DB::listen(function ($query) {
                if ($query->time > 1000) {
                    Log::warning('[SLOW QUERY] ' . $query->time . 'ms', ['sql' => $query->sql]);
                }
            });
        } else {
            // [DEV] Log slow queries AND track repeated queries per request (N+1 detection)
            static $queryCount  = 0;
            static $requestId   = null;

            DB::listen(function ($query) use (&$queryCount, &$requestId) {
                $currentId = request()->header('X-Request-ID', spl_object_id(request()));
                if ($requestId !== $currentId) {
                    $queryCount = 0;
                    $requestId  = $currentId;
                }
                $queryCount++;

                // Slow query warning
                if ($query->time > 150) {
                    Log::warning('[SLOW QUERY] ' . round($query->time) . 'ms', [
                        'sql'      => $query->sql,
                        'bindings' => $query->bindings,
                    ]);
                }

                // N+1 detection: >20 queries on a single request is suspicious
                if ($queryCount === 20) {
                    Log::warning('[N+1 SUSPECT] More than 20 DB queries on this request', [
                        'url' => request()->fullUrl(),
                    ]);
                }
            });
        }
    }

}