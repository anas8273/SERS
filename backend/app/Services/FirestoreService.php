<?php
// app/Services/FirestoreService.php

namespace App\Services;

use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Support\Facades\Log;

/**
 * FirestoreService
 * 
 * Handles all Firestore interactions for interactive educational records.
 * Provides CRUD operations for user records, AI interactions, and educational services.
 * 
 * @package App\Services
 */
class FirestoreService
{
    protected ?FirestoreClient $firestore = null;

    /**
     * Get Firestore client instance (lazy initialization).
     */
    protected function getFirestore(): FirestoreClient
    {
        if ($this->firestore === null) {
            $this->firestore = new FirestoreClient([
                'projectId' => config('services.firebase.project_id'),
                'keyFilePath' => storage_path('app/firebase/service-account.json'),
            ]);
        }
        return $this->firestore;
    }

    // ==================== USER RECORDS ====================

    /**
     * Create a new user record in Firestore.
     * 
     * @param string $userId User UUID
     * @param string $templateId Template UUID
     * @param array $templateStructure Initial template structure from template
     * @return string The created document ID
     */
    public function createUserRecord(string $userId, string $templateId, array $templateStructure): string
    {
        try {
            $collection = $this->getFirestore()->collection('user_records');
            
            $documentData = [
                'user_id' => $userId,
                'template_id' => $templateId,
                'template_structure' => $templateStructure,
                'user_data' => [], // Empty user data initially
                'status' => 'active',
                'created_at' => new \DateTime(),
                'updated_at' => new \DateTime(),
            ];

            $documentRef = $collection->add($documentData);

            Log::info("Firestore: Created user record", [
                'document_id' => $documentRef->id(),
                'user_id' => $userId,
                'template_id' => $templateId,
            ]);

            return $documentRef->id();

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to create user record", [
                'user_id' => $userId,
                'template_id' => $templateId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get a specific user record from Firestore.
     * 
     * @param string $recordId Firestore document ID
     * @return array|null Record data or null if not found
     */
    public function getUserRecord(string $recordId): ?array
    {
        try {
            $document = $this->getFirestore()
                ->collection('user_records')
                ->document($recordId)
                ->snapshot();

            if (!$document->exists()) {
                return null;
            }

            return array_merge(['id' => $document->id()], $document->data());

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get user record", [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update user data in a record.
     * 
     * @param string $recordId Firestore document ID
     * @param array $userData Updated user data
     * @return bool Success status
     */
    public function updateUserData(string $recordId, array $userData): bool
    {
        try {
            $this->getFirestore()
                ->collection('user_records')
                ->document($recordId)
                ->update([
                    ['path' => 'user_data', 'value' => $userData],
                    ['path' => 'updated_at', 'value' => new \DateTime()],
                ]);

            Log::info("Firestore: Updated user record", [
                'record_id' => $recordId,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to update user record", [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a user record from Firestore.
     * 
     * @param string $recordId Firestore document ID
     * @return bool Success status
     */
    public function deleteUserRecord(string $recordId): bool
    {
        try {
            $this->getFirestore()
                ->collection('user_records')
                ->document($recordId)
                ->delete();

            Log::info("Firestore: Deleted user record", [
                'record_id' => $recordId,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to delete user record", [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get all records for a specific user.
     * 
     * @param string $userId User UUID
     * @return array List of user records
     */
    public function getUserRecords(string $userId): array
    {
        try {
            $documents = $this->getFirestore()
                ->collection('user_records')
                ->where('user_id', '=', $userId)
                ->documents();

            $records = [];
            foreach ($documents as $document) {
                if ($document->exists()) {
                    $records[] = array_merge(['id' => $document->id()], $document->data());
                }
            }

            return $records;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get user records", [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    // ==================== AI INTERACTIONS ====================

    /**
     * Save an AI interaction to Firestore.
     */
    public function saveAIInteraction(
        string $recordId,
        string $fieldName,
        string $prompt,
        string $response,
        bool $accepted = false
    ): string {
        try {
            $collection = $this->getFirestore()->collection('ai_interactions');
            
            $documentData = [
                'record_id' => $recordId,
                'field_name' => $fieldName,
                'prompt' => $prompt,
                'response' => $response,
                'accepted' => $accepted,
                'created_at' => new \DateTime(),
            ];

            $documentRef = $collection->add($documentData);

            Log::info("Firestore: Saved AI interaction", [
                'document_id' => $documentRef->id(),
                'record_id' => $recordId,
                'field_name' => $fieldName,
            ]);

            return $documentRef->id();

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to save AI interaction", [
                'record_id' => $recordId,
                'field_name' => $fieldName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get AI interactions for a specific record.
     */
    public function getAIInteractions(string $recordId): array
    {
        try {
            $documents = $this->getFirestore()
                ->collection('ai_interactions')
                ->where('record_id', '=', $recordId)
                ->documents();

            $interactions = [];
            foreach ($documents as $document) {
                if ($document->exists()) {
                    $interactions[] = array_merge(['id' => $document->id()], $document->data());
                }
            }

            return $interactions;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get AI interactions", [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update AI interaction acceptance status.
     */
    public function updateAIInteractionAcceptance(string $interactionId, bool $accepted): bool
    {
        try {
            $this->getFirestore()
                ->collection('ai_interactions')
                ->document($interactionId)
                ->update([
                    ['path' => 'accepted', 'value' => $accepted],
                ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to update AI interaction", [
                'interaction_id' => $interactionId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    // ==================== EDUCATIONAL SERVICES ====================

    /**
     * Create an educational service record (Analysis, Certificate, Plan, etc.)
     * 
     * @param string $collection Collection name (analyses, certificates, plans, achievements, performances, tests)
     * @param string $userId User UUID
     * @param array $data Service data
     * @return string The created document ID
     */
    public function createEducationalService(string $collection, string $userId, array $data): string
    {
        try {
            $collectionRef = $this->getFirestore()->collection($collection);
            
            $documentData = array_merge($data, [
                'user_id' => $userId,
                'status' => $data['status'] ?? 'draft',
                'created_at' => new \DateTime(),
                'updated_at' => new \DateTime(),
            ]);

            $documentRef = $collectionRef->add($documentData);

            Log::info("Firestore: Created educational service", [
                'collection' => $collection,
                'document_id' => $documentRef->id(),
                'user_id' => $userId,
            ]);

            return $documentRef->id();

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to create educational service", [
                'collection' => $collection,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get educational service by ID.
     */
    public function getEducationalService(string $collection, string $documentId): ?array
    {
        try {
            $document = $this->getFirestore()
                ->collection($collection)
                ->document($documentId)
                ->snapshot();

            if (!$document->exists()) {
                return null;
            }

            return array_merge(['id' => $document->id()], $document->data());

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get educational service", [
                'collection' => $collection,
                'document_id' => $documentId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get all educational services for a user.
     */
    public function getUserEducationalServices(string $collection, string $userId, array $filters = []): array
    {
        try {
            $query = $this->getFirestore()
                ->collection($collection)
                ->where('user_id', '=', $userId);

            // Apply additional filters
            foreach ($filters as $field => $value) {
                $query = $query->where($field, '=', $value);
            }

            $documents = $query->documents();

            $services = [];
            foreach ($documents as $document) {
                if ($document->exists()) {
                    $services[] = array_merge(['id' => $document->id()], $document->data());
                }
            }

            return $services;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get user educational services", [
                'collection' => $collection,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update educational service.
     */
    public function updateEducationalService(string $collection, string $documentId, array $data): bool
    {
        try {
            $updates = [];
            foreach ($data as $key => $value) {
                $updates[] = ['path' => $key, 'value' => $value];
            }
            $updates[] = ['path' => 'updated_at', 'value' => new \DateTime()];

            $this->getFirestore()
                ->collection($collection)
                ->document($documentId)
                ->update($updates);

            Log::info("Firestore: Updated educational service", [
                'collection' => $collection,
                'document_id' => $documentId,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to update educational service", [
                'collection' => $collection,
                'document_id' => $documentId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete educational service.
     */
    public function deleteEducationalService(string $collection, string $documentId): bool
    {
        try {
            $this->getFirestore()
                ->collection($collection)
                ->document($documentId)
                ->delete();

            Log::info("Firestore: Deleted educational service", [
                'collection' => $collection,
                'document_id' => $documentId,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to delete educational service", [
                'collection' => $collection,
                'document_id' => $documentId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    // ==================== ANALYSES (تحليل النتائج) ====================

    public function createAnalysis(string $userId, array $data): string
    {
        return $this->createEducationalService('analyses', $userId, $data);
    }

    public function getAnalysis(string $analysisId): ?array
    {
        return $this->getEducationalService('analyses', $analysisId);
    }

    public function getUserAnalyses(string $userId): array
    {
        return $this->getUserEducationalServices('analyses', $userId);
    }

    public function updateAnalysis(string $analysisId, array $data): bool
    {
        return $this->updateEducationalService('analyses', $analysisId, $data);
    }

    public function deleteAnalysis(string $analysisId): bool
    {
        return $this->deleteEducationalService('analyses', $analysisId);
    }

    // ==================== CERTIFICATES (الشهادات) ====================

    public function createCertificate(string $userId, array $data): string
    {
        return $this->createEducationalService('certificates', $userId, $data);
    }

    public function getCertificate(string $certificateId): ?array
    {
        return $this->getEducationalService('certificates', $certificateId);
    }

    public function getUserCertificates(string $userId): array
    {
        return $this->getUserEducationalServices('certificates', $userId);
    }

    public function updateCertificate(string $certificateId, array $data): bool
    {
        return $this->updateEducationalService('certificates', $certificateId, $data);
    }

    public function deleteCertificate(string $certificateId): bool
    {
        return $this->deleteEducationalService('certificates', $certificateId);
    }

    // ==================== PLANS (الخطط التعليمية) ====================

    public function createPlan(string $userId, array $data): string
    {
        return $this->createEducationalService('plans', $userId, $data);
    }

    public function getPlan(string $planId): ?array
    {
        return $this->getEducationalService('plans', $planId);
    }

    public function getUserPlans(string $userId): array
    {
        return $this->getUserEducationalServices('plans', $userId);
    }

    public function updatePlan(string $planId, array $data): bool
    {
        return $this->updateEducationalService('plans', $planId, $data);
    }

    public function deletePlan(string $planId): bool
    {
        return $this->deleteEducationalService('plans', $planId);
    }

    // ==================== ACHIEVEMENTS (الإنجازات) ====================

    public function createAchievement(string $userId, array $data): string
    {
        return $this->createEducationalService('achievements', $userId, $data);
    }

    public function getAchievement(string $achievementId): ?array
    {
        return $this->getEducationalService('achievements', $achievementId);
    }

    public function getUserAchievements(string $userId): array
    {
        return $this->getUserEducationalServices('achievements', $userId);
    }

    public function updateAchievement(string $achievementId, array $data): bool
    {
        return $this->updateEducationalService('achievements', $achievementId, $data);
    }

    public function deleteAchievement(string $achievementId): bool
    {
        return $this->deleteEducationalService('achievements', $achievementId);
    }

    // ==================== PERFORMANCES (تقييم الأداء) ====================

    public function createPerformance(string $userId, array $data): string
    {
        return $this->createEducationalService('performances', $userId, $data);
    }

    public function getPerformance(string $performanceId): ?array
    {
        return $this->getEducationalService('performances', $performanceId);
    }

    public function getUserPerformances(string $userId): array
    {
        return $this->getUserEducationalServices('performances', $userId);
    }

    public function updatePerformance(string $performanceId, array $data): bool
    {
        return $this->updateEducationalService('performances', $performanceId, $data);
    }

    public function deletePerformance(string $performanceId): bool
    {
        return $this->deleteEducationalService('performances', $performanceId);
    }

    // ==================== TESTS (الاختبارات) ====================

    public function createTest(string $userId, array $data): string
    {
        return $this->createEducationalService('tests', $userId, $data);
    }

    public function getTest(string $testId): ?array
    {
        return $this->getEducationalService('tests', $testId);
    }

    public function getUserTests(string $userId): array
    {
        return $this->getUserEducationalServices('tests', $userId);
    }

    public function updateTest(string $testId, array $data): bool
    {
        return $this->updateEducationalService('tests', $testId, $data);
    }

    public function deleteTest(string $testId): bool
    {
        return $this->deleteEducationalService('tests', $testId);
    }

    // ==================== AI CONVERSATIONS (محادثات الذكاء الاصطناعي) ====================

    public function createAIConversation(string $userId, array $data): string
    {
        return $this->createEducationalService('ai_conversations', $userId, $data);
    }

    public function getAIConversation(string $conversationId): ?array
    {
        return $this->getEducationalService('ai_conversations', $conversationId);
    }

    public function getUserAIConversations(string $userId): array
    {
        return $this->getUserEducationalServices('ai_conversations', $userId);
    }

    public function addMessageToConversation(string $conversationId, array $message): bool
    {
        try {
            $document = $this->getFirestore()
                ->collection('ai_conversations')
                ->document($conversationId)
                ->snapshot();

            if (!$document->exists()) {
                return false;
            }

            $data = $document->data();
            $messages = $data['messages'] ?? [];
            $messages[] = array_merge($message, ['timestamp' => new \DateTime()]);

            $this->getFirestore()
                ->collection('ai_conversations')
                ->document($conversationId)
                ->update([
                    ['path' => 'messages', 'value' => $messages],
                    ['path' => 'updated_at', 'value' => new \DateTime()],
                ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to add message to conversation", [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function deleteAIConversation(string $conversationId): bool
    {
        return $this->deleteEducationalService('ai_conversations', $conversationId);
    }
}
