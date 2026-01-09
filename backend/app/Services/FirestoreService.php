<?php
// app/Services/FirestoreService.php

namespace App\Services;

use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Support\Facades\Log;

/**
 * FirestoreService
 * 
 * Handles all Firestore interactions for interactive educational records.
 * Provides CRUD operations for user records and AI interactions.
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
     * @param string $productId Product UUID
     * @param array $templateStructure Initial template structure from product
     * @return string The created document ID
     */
    public function createUserRecord(string $userId, string $productId, array $templateStructure): string
    {
        try {
            $collection = $this->getFirestore()->collection('user_records');
            
            $documentData = [
                'user_id' => $userId,
                'product_id' => $productId,
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
                'product_id' => $productId,
            ]);

            return $documentRef->id();

        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to create user record", [
                'user_id' => $userId,
                'product_id' => $productId,
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
     * 
     * @param string $recordId User record ID
     * @param string $fieldName Field that was edited with AI
     * @param string $prompt User's prompt/question
     * @param string $response AI's response
     * @param bool $accepted Whether user accepted the suggestion
     * @return string The created interaction document ID
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
     * 
     * @param string $recordId User record ID
     * @return array List of AI interactions
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
     * 
     * @param string $interactionId Firestore document ID
     * @param bool $accepted Acceptance status
     * @return bool Success status
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
}
