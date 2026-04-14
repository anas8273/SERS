<?php
// app/Console/Commands/ProcessOutbox.php

namespace App\Console\Commands;

use App\Jobs\ProcessOutboxJob;
use App\Models\Outbox;
use Illuminate\Console\Command;

class ProcessOutbox extends Command
{
    protected $signature = 'outbox:process {--limit=100}';
    protected $description = 'Process pending outbox events';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        
        $events = Outbox::pending()
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        if ($events->isEmpty()) {
            $this->info('No pending outbox events.');
            return 0;
        }

        $this->info("Processing {$events->count()} outbox events...");

        foreach ($events as $event) {
            ProcessOutboxJob::dispatch($event);
        }

        $this->info('All events dispatched to queue.');
        return 0;
    }
}