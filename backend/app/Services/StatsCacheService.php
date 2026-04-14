<?php
// app/Services/StatsCacheService.php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * StatsCacheService
 *
 * [BUG-03 FIX] Extracted from StatsController to decouple cache invalidation
 * from the HTTP controller layer.
 *
 * Centralizes all stats cache clearing operations so that Services
 * (PurchaseService, etc.) can invalidate caches without coupling to Controllers.
 */
class StatsCacheService
{
    /**
     * Clear public homepage stats cache.
     * Called after order completion, template creation, or user registration.
     */
    public static function clearPublicCache(): void
    {
        Cache::forget('public_homepage_stats');
    }

    /**
     * Clear admin dashboard stats and chart caches.
     * Called after order completion, refund, or financial changes.
     */
    public static function clearAdminCache(): void
    {
        Cache::forget('admin_stats');
        Cache::forget('admin_chart');
    }

    /**
     * Clear all stats caches (convenience method).
     */
    public static function clearAll(): void
    {
        self::clearPublicCache();
        self::clearAdminCache();
    }

    /**
     * [FIX Q-02] Clear a specific user's dashboard summary cache.
     * Called after order completion, wallet change, or role update.
     *
     * @param string|int $userId
     */
    public static function clearUserDashboardCache(string|int $userId): void
    {
        Cache::forget("dashboard_summary:{$userId}");
    }
}
