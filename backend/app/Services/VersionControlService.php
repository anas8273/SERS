<?php

namespace App\Services;

use App\Models\UserTemplateData;
use App\Models\TemplateDataVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Firestore\FirestoreClient;

class VersionControlService
{
    private $firestore;

    public function __construct()
    {
        $this->firestore = new FirestoreClient([
            'projectId' => config('services.firebase.project_id'),
            'keyFilePath' => storage_path('app/firebase/service-account.json'),
        ]);
    }

    /**
     * Create a new version snapshot
     */
    public function createVersion(string $recordId, array $data, string $title = '', array $metadata = []): array
    {
        DB::beginTransaction();
        try {
            $record = UserTemplateData::findOrFail($recordId);
            
            // Get current schema from Firestore
            $schema = $this->getTemplateSchema($record->template_id);
            
            // Get current version number
            $currentVersion = TemplateDataVersion::where('user_template_data_id', $recordId)
                                                ->max('version_number') ?? 0;
            
            // Get current user ID safely
            $currentUserId = null;
            try {
                // Try to get user from Laravel's auth system
                if (app()->bound('auth')) {
                    $authManager = app('auth');
                    if (method_exists($authManager, 'user')) {
                        $user = $authManager->user();
                        $currentUserId = $user ? $user->id : null;
                    } elseif (method_exists($authManager, 'id')) {
                        $currentUserId = $authManager->id();
                    }
                }
            } catch (\Exception $e) {
                // Fallback for testing or when auth is not available
                $currentUserId = $metadata['created_by'] ?? 'system';
            }
            
            // Final fallback
            if (!$currentUserId) {
                $currentUserId = $metadata['created_by'] ?? 'system';
            }
            
            // Create version in MySQL
            $version = TemplateDataVersion::create([
                'user_template_data_id' => $recordId,
                'version_number' => $currentVersion + 1,
                'data' => json_encode([
                    'user_data' => $data,
                    'schema' => $schema,
                    'title' => $title ?: "الإصدار " . ($currentVersion + 1),
                    'metadata' => $metadata,
                    'created_by' => $currentUserId,
                ]),
                'note' => $title ?: "الإصدار " . ($currentVersion + 1),
                'change_type' => $metadata['change_type'] ?? 'manual',
                'ip_address' => $metadata['ip_address'] ?? null,
                'user_agent' => $metadata['user_agent'] ?? null,
            ]);

            // Store version in Firestore for better performance
            $firestoreVersionData = [
                'version_id' => $version->id,
                'record_id' => $recordId,
                'version_number' => $version->version_number,
                'title' => $title ?: "الإصدار " . ($currentVersion + 1),
                'data_snapshot' => $data,
                'schema_snapshot' => $schema,
                'metadata' => $metadata,
                'created_at' => now()->toISOString(),
                'created_by' => $currentUserId,
            ];

            $this->firestore->collection('template_versions')
                           ->document($version->id)
                           ->set($firestoreVersionData);

            DB::commit();

            return [
                'success' => true,
                'data' => [
                    'version_id' => $version->id,
                    'version_number' => $version->version_number,
                    'title' => $title ?: "الإصدار " . ($currentVersion + 1),
                    'created_at' => $version->created_at->toISOString(),
                ]
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Version creation failed', [
                'record_id' => $recordId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get version history for a record
     */
    public function getVersionHistory(string $recordId): array
    {
        try {
            $versions = TemplateDataVersion::where('user_template_data_id', $recordId)
                                         ->orderBy('version_number', 'desc')
                                         ->get()
                                         ->map(function ($version) {
                                             $versionData = json_decode($version->data, true);
                                             return [
                                                 'id' => $version->id,
                                                 'version_number' => $version->version_number,
                                                 'title' => $versionData['title'] ?? $version->note ?? "الإصدار {$version->version_number}",
                                                 'created_at' => $version->created_at->toISOString(),
                                                 'created_by' => $versionData['created_by'] ?? 'مستخدم محذوف',
                                                 'is_current' => false, // Will be set below
                                                 'changes_summary' => $this->generateChangesSummary($version),
                                                 'data_preview' => $this->getDataPreview($version->data),
                                             ];
                                         });

            // Mark the latest version as current
            if ($versions->isNotEmpty()) {
                $versions->first()['is_current'] = true;
            }

            return [
                'success' => true,
                'data' => $versions->toArray()
            ];

        } catch (\Exception $e) {
            Log::error('Failed to get version history', [
                'record_id' => $recordId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Restore a specific version
     */
    public function restoreVersion(string $recordId, string $versionId): array
    {
        DB::beginTransaction();
        try {
            $record = UserTemplateData::findOrFail($recordId);
            $version = TemplateDataVersion::where('user_template_data_id', $recordId)
                                        ->where('id', $versionId)
                                        ->firstOrFail();

            // Get version data
            $versionData = json_decode($version->data, true);
            $userData = $versionData['user_data'] ?? [];
            $versionSchema = $versionData['schema'] ?? [];
            $versionTitle = $versionData['title'] ?? "الإصدار {$version->version_number}";

            // Create backup of current state before restore
            $this->createVersion($recordId, $record->data ?? [], 'نسخة احتياطية قبل الاستعادة');

            // Update MySQL record
            $record->data = $userData;
            $record->title = $versionTitle;
            $record->updated_at = now();
            $record->save();
            
            // Force refresh from database to verify update
            $record->refresh();

            // Update Firestore record
            if ($record->firestore_doc_id) {
                $firestoreData = [
                    'user_data' => $userData,
                    'title' => $versionTitle,
                    'updated_at' => now()->toISOString(),
                    'restored_from_version' => $version->version_number,
                ];

                $this->firestore->collection('user_records')
                               ->document($record->firestore_doc_id)
                               ->update($firestoreData);
            }

            // Update template schema if different
            if ($versionSchema && $versionSchema !== $this->getTemplateSchema($record->template_id)) {
                $this->restoreTemplateSchema($record->template_id, $versionSchema);
            }

            DB::commit();

            return [
                'success' => true,
                'data' => [
                    'restored_version' => $version->version_number,
                    'restored_title' => $versionTitle,
                    'restored_data' => $userData,
                    'restored_at' => now()->toISOString(),
                ]
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Version restore failed', [
                'record_id' => $recordId,
                'version_id' => $versionId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Compare two versions
     */
    public function compareVersions(string $recordId, string $version1Id, string $version2Id): array
    {
        try {
            $version1 = TemplateDataVersion::where('user_template_data_id', $recordId)
                                         ->where('id', $version1Id)
                                         ->firstOrFail();
            
            $version2 = TemplateDataVersion::where('user_template_data_id', $recordId)
                                         ->where('id', $version2Id)
                                         ->firstOrFail();

            $version1Data = json_decode($version1->data, true);
            $version2Data = json_decode($version2->data, true);
            
            $data1 = $version1Data['user_data'] ?? [];
            $data2 = $version2Data['user_data'] ?? [];

            $differences = $this->calculateDifferences($data1, $data2);

            return [
                'success' => true,
                'data' => [
                    'version1' => [
                        'id' => $version1->id,
                        'number' => $version1->version_number,
                        'title' => $version1Data['title'] ?? $version1->note ?? "الإصدار {$version1->version_number}",
                        'created_at' => $version1->created_at->toISOString(),
                    ],
                    'version2' => [
                        'id' => $version2->id,
                        'number' => $version2->version_number,
                        'title' => $version2Data['title'] ?? $version2->note ?? "الإصدار {$version2->version_number}",
                        'created_at' => $version2->created_at->toISOString(),
                    ],
                    'differences' => $differences,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Version comparison failed', [
                'record_id' => $recordId,
                'version1_id' => $version1Id,
                'version2_id' => $version2Id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete old versions (cleanup)
     */
    public function cleanupOldVersions(string $recordId, int $keepCount = 10): array
    {
        try {
            $versions = TemplateDataVersion::where('user_template_data_id', $recordId)
                                         ->orderBy('version_number', 'desc')
                                         ->skip($keepCount)
                                         ->get();

            $deletedCount = 0;
            foreach ($versions as $version) {
                // Delete from Firestore
                $this->firestore->collection('template_versions')
                               ->document($version->id)
                               ->delete();
                
                // Delete from MySQL
                $version->delete();
                $deletedCount++;
            }

            return [
                'success' => true,
                'data' => [
                    'deleted_count' => $deletedCount,
                    'kept_count' => $keepCount,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Version cleanup failed', [
                'record_id' => $recordId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get template schema from Firestore
     */
    private function getTemplateSchema(string $templateId): array
    {
        try {
            $docRef = $this->firestore->collection('template_schemas')->document($templateId);
            $snapshot = $docRef->snapshot();
            
            return $snapshot->exists() ? $snapshot->data() : [];
        } catch (\Exception $e) {
            Log::error('Failed to get template schema', [
                'template_id' => $templateId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Restore template schema
     */
    private function restoreTemplateSchema(string $templateId, array $schema): void
    {
        try {
            $docRef = $this->firestore->collection('template_schemas')->document($templateId);
            $docRef->set(array_merge($schema, [
                'restored_at' => now()->toISOString(),
                'version' => time(),
            ]));
        } catch (\Exception $e) {
            Log::error('Failed to restore template schema', [
                'template_id' => $templateId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Generate changes summary for a version
     */
    private function generateChangesSummary(TemplateDataVersion $version): string
    {
        $versionData = json_decode($version->data, true);
        $metadata = $versionData['metadata'] ?? [];
        
        if (isset($metadata['changes_summary'])) {
            return $metadata['changes_summary'];
        }

        // Auto-generate summary based on data changes
        $userData = $versionData['user_data'] ?? [];
        $fieldCount = count($userData);
        
        return "تحديث {$fieldCount} حقل";
    }

    /**
     * Get data preview for version
     */
    private function getDataPreview(string $dataSnapshot): array
    {
        $versionData = json_decode($dataSnapshot, true) ?? [];
        $userData = $versionData['user_data'] ?? [];
        
        // Return first 3 non-empty fields for preview
        $preview = [];
        $count = 0;
        
        foreach ($userData as $key => $value) {
            if ($count >= 3) break;
            
            if (!empty($value) && is_string($value)) {
                $preview[$key] = strlen($value) > 50 
                    ? substr($value, 0, 50) . '...' 
                    : $value;
                $count++;
            }
        }
        
        return $preview;
    }

    /**
     * Calculate differences between two data sets
     */
    private function calculateDifferences(array $data1, array $data2): array
    {
        $differences = [];
        
        // Get all unique keys
        $allKeys = array_unique(array_merge(array_keys($data1), array_keys($data2)));
        
        foreach ($allKeys as $key) {
            $value1 = $data1[$key] ?? null;
            $value2 = $data2[$key] ?? null;
            
            if ($value1 !== $value2) {
                $differences[] = [
                    'field' => $key,
                    'old_value' => $value1,
                    'new_value' => $value2,
                    'change_type' => $this->getChangeType($value1, $value2),
                ];
            }
        }
        
        return $differences;
    }

    /**
     * Determine the type of change
     */
    private function getChangeType($oldValue, $newValue): string
    {
        if ($oldValue === null && $newValue !== null) {
            return 'added';
        } elseif ($oldValue !== null && $newValue === null) {
            return 'removed';
        } else {
            return 'modified';
        }
    }
}