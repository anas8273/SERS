<?php
// app/Jobs/ProcessOutboxJob.php

namespace App\Jobs;

use App\Models\Outbox;
use App\Services\FirestoreService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessOutboxJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Outbox $outboxEvent
    ) {}

    public function handle(FirestoreService $firestoreService): void
    {
        $this->outboxEvent->markAsProcessing();

        try {
            match ($this->outboxEvent->event_type) {
                'order.completed' => $this->handleOrderCompleted($firestoreService),
                'record.deleted' => $this->handleRecordDeleted($firestoreService),
                default => throw new \Exception("Unknown event type: {$this->outboxEvent->event_type}"),
            };

            $this->outboxEvent->markAsCompleted();
            
            Log::info("Outbox event processed successfully", [
                'event_id' => $this->outboxEvent->id,
                'event_type' => $this->outboxEvent->event_type,
            ]);

        } catch (\Exception $e) {
            $this->outboxEvent->markAsFailed($e->getMessage());
            
            Log::error("Outbox event processing failed", [
                'event_id' => $this->outboxEvent->id,
                'event_type' => $this->outboxEvent->event_type,
                'error' => $e->getMessage(),
            ]);

            // إعادة المحاولة إذا لم نصل للحد الأقصى
            if ($this->outboxEvent->attempts < $this->outboxEvent->max_attempts) {
                throw $e; // سيقوم Laravel بإعادة المحاولة
            }
        }
    }

    protected function handleOrderCompleted(FirestoreService $firestoreService): void
    {
        $payload = $this->outboxEvent->payload;

        foreach ($payload['items'] as $item) {
            if ($item['template_type'] === 'interactive') {
                // [FIX] template_structure may be null for legacy payloads or fields-less templates
                $structure = $item['template_structure'] ?? [];

                // Create Firestore user_record with full field schema
                $recordId = $firestoreService->createUserRecord(
                    (string) $payload['user_id'],
                    (string) $item['template_id'],
                    $structure   // array of field definitions (may be empty [])
                );

                // Update OrderItem with Firestore record ID for future reference
                \App\Models\OrderItem::where('id', $item['order_item_id'])
                    ->update([
                        'firestore_record_id' => $recordId,
                        'sync_status'         => 'synced',
                    ]);

                Log::info('Firestore user_record created', [
                    'record_id'   => $recordId,
                    'template_id' => $item['template_id'],
                    'user_id'     => $payload['user_id'],
                    'fields'      => count($structure),
                ]);
            }
            // Non-interactive templates (PDF/downloadable): no Firestore record needed
            // Access is via order download link, not the editor
        }
    }


    protected function handleRecordDeleted(FirestoreService $firestoreService): void
    {
        $payload = $this->outboxEvent->payload;
        $firestoreService->deleteUserRecord($payload['record_id']);
    }
}