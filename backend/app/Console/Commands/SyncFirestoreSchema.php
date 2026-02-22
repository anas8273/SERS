<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Template;
use App\Models\TemplateField;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Firestore\FirestoreClient;

/**
 * Sync Schema to Firestore
 * 
 * Run with: php artisan sync:firestore-schema
 */
class SyncFirestoreSchema extends Command
{
    protected $signature = 'sync:firestore-schema {templateId?}';
    protected $description = 'Sync MySQL template fields to Firestore schema';

    public function handle()
    {
        $this->info('================================================');
        $this->info('🔄 SERS Firestore Schema Sync');
        $this->info('================================================');

        try {
            $firestore = new FirestoreClient([
                'projectId' => config('services.firebase.project_id'),
                'keyFilePath' => storage_path('app/firebase/service-account.json'),
            ]);

            $templateId = $this->argument('templateId');

            if ($templateId) {
                $this->syncSingleTemplate($firestore, $templateId);
            } else {
                $this->syncAllTemplates($firestore);
            }

            $this->info('✅ Sync completed successfully!');
            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Sync failed: {$e->getMessage()}");
            Log::error('Firestore Sync Failed', ['error' => $e->getMessage()]);
            return 1;
        }
    }

    private function syncSingleTemplate(FirestoreClient $firestore, string $templateId): void
    {
        $template = Template::with(['fields' => function($query) {
            $query->orderBy('sort_order');
        }])->findOrFail($templateId);

        $this->syncTemplateToFirestore($firestore, $template);
    }

    private function syncAllTemplates(FirestoreClient $firestore): void
    {
        $templates = Template::with(['fields' => function($query) {
            $query->orderBy('sort_order');
        }])->where('is_active', true)->get();

        $this->info("Found {$templates->count()} active templates to sync");

        foreach ($templates as $template) {
            $this->syncTemplateToFirestore($firestore, $template);
        }
    }

    private function syncTemplateToFirestore(FirestoreClient $firestore, Template $template): void
    {
        $fields = $template->fields->map(function($field) {
            return [
                'id' => $field->id,
                'name' => $field->name,
                'label_ar' => $field->label_ar,
                'label_en' => $field->label_en,
                'type' => $field->type,
                'placeholder_ar' => $field->placeholder_ar,
                'placeholder_en' => $field->placeholder_en,
                'is_required' => (bool) $field->is_required,
                'ai_enabled' => (bool) $field->ai_fillable,
                'ai_prompt_hint' => $field->ai_prompt_hint,
                'default_value' => $field->default_value,
                'options' => $field->options ? json_decode($field->options, true) : null,
                'sort_order' => $field->sort_order,
            ];
        })->toArray();

        $firestoreSchema = [
            'template_id' => $template->id,
            'template_name_ar' => $template->name_ar,
            'template_name_en' => $template->name_en,
            'template_type' => $template->type,
            'fields' => $fields,
            'fields_count' => count($fields),
            'updated_at' => now()->toISOString(),
            'version' => time(),
        ];

        $docRef = $firestore->collection('template_schemas')->document($template->id);
        $docRef->set($firestoreSchema);

        $this->info("✅ Synced: {$template->name_en} ({$template->id}) - {$template->fields->count()} fields");
        
        Log::info('Template schema synced to Firestore', [
            'template_id' => $template->id,
            'fields_count' => count($fields),
        ]);
    }
}
