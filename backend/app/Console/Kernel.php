<?php
// app/Console/Kernel.php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // معالجة صندوق الصادر كل دقيقة
        $schedule->command('outbox:process --limit=50')
                 ->everyMinute()
                 ->withoutOverlapping();

        // [PERF] تنظيف tokens المنتهية يومياً لمنع تضخم جدول personal_access_tokens
        $schedule->command('sanctum:prune-expired --hours=48')
                 ->daily()
                 ->at('03:00');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}