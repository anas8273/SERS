<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use App\Services\FirestoreService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FirestoreService::class, function ($app) {
            return new FirestoreService();
        });
    }

    public function boot(): void
    {
        //
    }
}