<?php
// app/Services/FirestoreService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * FirestoreService — HTTP-based (no gRPC required)
 *
 * Uses Firestore REST API directly via Laravel HTTP client.
 * Avoids google/cloud-firestore PHP library which requires gRPC extension.
 */
class FirestoreService
{
    protected string $projectId;
    protected string $baseUrl;
    protected string $serviceAccountPath;

    public function __construct()
    {
        $this->projectId          = config('services.firebase.project_id');
        $this->serviceAccountPath = storage_path('app/firebase/service-account.json');
        $this->baseUrl            = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents";
    }

    // In-memory token cache to avoid repeated HTTP calls within same request
    private static ?string $cachedToken = null;
    private static int $tokenExpiry = 0;

    protected function getAccessToken(): string
    {
        // Use in-memory cache first (fastest, no I/O)
        if (self::$cachedToken && time() < self::$tokenExpiry) {
            return self::$cachedToken;
        }

        // Try file cache (survives across requests, no DB needed)
        $cacheFile = storage_path('framework/cache/firestore_token.json');
        if (file_exists($cacheFile)) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if ($cached && isset($cached['token'], $cached['expires_at']) && time() < $cached['expires_at']) {
                self::$cachedToken = $cached['token'];
                self::$tokenExpiry = $cached['expires_at'];
                return self::$cachedToken;
            }
        }

        // Fetch new token from Google
        $sa = json_decode(file_get_contents($this->serviceAccountPath), true);

        $now = time();
        $header  = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
        $payload = rtrim(strtr(base64_encode(json_encode([
            'iss'   => $sa['client_email'],
            'scope' => 'https://www.googleapis.com/auth/datastore',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600,
        ])), '+/', '-_'), '=');

        openssl_sign("{$header}.{$payload}", $signature, $sa['private_key'], 'SHA256');
        $sig = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $response = Http::timeout(10)->asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => "{$header}.{$payload}.{$sig}",
        ]);

        $token = $response->json('access_token');
        $expiresAt = $now + 3500;

        // Save to file cache
        file_put_contents($cacheFile, json_encode(['token' => $token, 'expires_at' => $expiresAt]));

        self::$cachedToken = $token;
        self::$tokenExpiry = $expiresAt;

        return $token;
    }

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->getAccessToken(),
            'Content-Type'  => 'application/json',
        ];
    }

    // ==================== FIRESTORE VALUE ENCODING ====================

    protected function encodeValue(mixed $value): array
    {
        if (is_null($value))    return ['nullValue' => null];
        if (is_bool($value))    return ['booleanValue' => $value];
        if (is_int($value))     return ['integerValue' => (string) $value];
        if (is_float($value))   return ['doubleValue' => $value];
        if ($value instanceof \DateTime) return ['timestampValue' => $value->format(\DateTime::RFC3339)];
        if (is_array($value) && array_is_list($value)) {
            return ['arrayValue' => ['values' => array_map([$this, 'encodeValue'], $value)]];
        }
        if (is_array($value)) {
            $fields = [];
            foreach ($value as $k => $v) $fields[$k] = $this->encodeValue($v);
            return ['mapValue' => ['fields' => $fields]];
        }
        return ['stringValue' => (string) $value];
    }

    protected function encodeDocument(array $data): array
    {
        $fields = [];
        foreach ($data as $key => $value) {
            $fields[$key] = $this->encodeValue($value);
        }
        return ['fields' => $fields];
    }

    protected function decodeValue(array $value): mixed
    {
        if (isset($value['nullValue']))      return null;
        if (isset($value['booleanValue']))   return $value['booleanValue'];
        if (isset($value['integerValue']))   return (int) $value['integerValue'];
        if (isset($value['doubleValue']))    return (float) $value['doubleValue'];
        if (isset($value['timestampValue'])) return $value['timestampValue'];
        if (isset($value['stringValue']))    return $value['stringValue'];
        if (isset($value['arrayValue']))     return array_map([$this, 'decodeValue'], $value['arrayValue']['values'] ?? []);
        if (isset($value['mapValue'])) {
            $result = [];
            foreach ($value['mapValue']['fields'] ?? [] as $k => $v) $result[$k] = $this->decodeValue($v);
            return $result;
        }
        return null;
    }

    protected function decodeDocument(array $doc): array
    {
        $data = [];
        foreach ($doc['fields'] ?? [] as $key => $value) {
            $data[$key] = $this->decodeValue($value);
        }
        // Extract document ID from name
        $name = $doc['name'] ?? '';
        $id   = basename($name);
        return array_merge(['id' => $id], $data);
    }

    // ==================== CRUD HELPERS ====================

    protected function addDocument(string $collection, array $data): string
    {
        $url      = "{$this->baseUrl}/{$collection}";
        $response = Http::withHeaders($this->headers())->timeout(15)->connectTimeout(5)->post($url, $this->encodeDocument($data));

        if ($response->failed()) {
            throw new \RuntimeException("Firestore add failed: " . $response->body());
        }

        return basename($response->json('name'));
    }

    protected function getDocument(string $collection, string $documentId): ?array
    {
        $url      = "{$this->baseUrl}/{$collection}/{$documentId}";
        $response = Http::withHeaders($this->headers())->timeout(10)->connectTimeout(5)->get($url);

        if ($response->status() === 404) return null;
        if ($response->failed()) throw new \RuntimeException("Firestore get failed: " . $response->body());

        return $this->decodeDocument($response->json());
    }

    protected function updateDocument(string $collection, string $documentId, array $data): void
    {
        $data['updated_at'] = new \DateTime();
        $fields = array_keys($data);
        $mask   = implode('&updateMask.fieldPaths=', array_map('urlencode', $fields));
        $url    = "{$this->baseUrl}/{$collection}/{$documentId}?updateMask.fieldPaths=" . $mask;

        $response = Http::withHeaders($this->headers())->timeout(15)->connectTimeout(5)->patch($url, $this->encodeDocument($data));

        if ($response->failed()) {
            throw new \RuntimeException("Firestore update failed: " . $response->body());
        }
    }

    protected function deleteDocument(string $collection, string $documentId): void
    {
        $url      = "{$this->baseUrl}/{$collection}/{$documentId}";
        $response = Http::withHeaders($this->headers())->timeout(10)->connectTimeout(5)->delete($url);

        if ($response->failed()) {
            throw new \RuntimeException("Firestore delete failed: " . $response->body());
        }
    }

    /**
     * List ALL documents in a collection (REST API — no gRPC needed).
     * Used by admin endpoints that need cross-user data.
     * Supports pageSize (max 300 per Firestore REST limit) and auto-pagination.
     *
     * @param string $collection  Collection name
     * @param int    $limit       Maximum docs to return (default 1000, capped for safety)
     * @return array  Array of decoded documents
     */
    public function listDocuments(string $collection, int $limit = 1000): array
    {
        $limit    = min($limit, 2000); // Safety cap
        $pageSize = min(300, $limit);  // Firestore REST max per page
        $results  = [];
        $nextPageToken = null;

        do {
            $url = "{$this->baseUrl}/{$collection}?pageSize={$pageSize}";
            if ($nextPageToken) {
                $url .= "&pageToken=" . urlencode($nextPageToken);
            }

            $response = Http::withHeaders($this->headers())->timeout(15)->connectTimeout(5)->get($url);

            if ($response->failed()) {
                // [QUALITY-03 FIX] Throw instead of silent break. Callers must handle
                // the exception — returning a partial list with no error indication
                // masked Firestore quota/auth failures and corrupted downstream state.
                Log::error("Firestore listDocuments failed for {$collection}", [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 500),
                ]);
                throw new \RuntimeException(
                    "Firestore listDocuments failed for '{$collection}' [HTTP {$response->status()}]"
                );
            }

            $json = $response->json();
            $documents = $json['documents'] ?? [];

            foreach ($documents as $doc) {
                $results[] = $this->decodeDocument($doc);
                if (count($results) >= $limit) break 2;
            }

            $nextPageToken = $json['nextPageToken'] ?? null;
        } while ($nextPageToken && count($results) < $limit);

        return $results;
    }

    protected function queryDocuments(string $collection, array $filters = []): array
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery";

        $where = null;
        if (count($filters) === 1) {
            [$field, $value] = array_values($filters[0]);
            $where = [
                'fieldFilter' => [
                    'field'  => ['fieldPath' => $field],
                    'op'     => 'EQUAL',
                    'value'  => $this->encodeValue($value),
                ],
            ];
        } elseif (count($filters) > 1) {
            $conditions = array_map(fn($f) => [
                'fieldFilter' => [
                    'field'  => ['fieldPath' => $f['field']],
                    'op'     => 'EQUAL',
                    'value'  => $this->encodeValue($f['value']),
                ],
            ], $filters);
            $where = ['compositeFilter' => ['op' => 'AND', 'filters' => $conditions]];
        }

        $query = ['from' => [['collectionId' => $collection]]];
        if ($where) $query['where'] = $where;

        $response = Http::withHeaders($this->headers())->timeout(15)->connectTimeout(5)->post($url, ['structuredQuery' => $query]);

        if ($response->failed()) {
            throw new \RuntimeException("Firestore query failed: " . $response->body());
        }

        $results = [];
        foreach ($response->json() as $item) {
            if (isset($item['document'])) {
                $results[] = $this->decodeDocument($item['document']);
            }
        }
        return $results;
    }

    // ==================== USER RECORDS ====================

    public function createUserRecord(string $userId, string $templateId, array $templateStructure): string
    {
        try {
            $id = $this->addDocument('user_records', [
                'user_id'            => $userId,
                'template_id'        => $templateId,
                'template_structure' => $templateStructure,
                'user_data'          => [],
                'status'             => 'active',
                'created_at'         => new \DateTime(),
                'updated_at'         => new \DateTime(),
            ]);
            Log::info("Firestore: Created user record", ['id' => $id, 'user_id' => $userId]);
            return $id;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to create user record", ['user_id' => $userId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getUserRecord(string $recordId): ?array
    {
        try {
            return $this->getDocument('user_records', $recordId);
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get user record", ['record_id' => $recordId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function updateUserData(string $recordId, array $userData): bool
    {
        try {
            $this->updateDocument('user_records', $recordId, ['user_data' => $userData]);
            return true;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to update user record", ['record_id' => $recordId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function deleteUserRecord(string $recordId): bool
    {
        try {
            $this->deleteDocument('user_records', $recordId);
            return true;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to delete user record", ['record_id' => $recordId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getUserRecords(string $userId): array
    {
        try {
            return $this->queryDocuments('user_records', [['field' => 'user_id', 'value' => $userId]]);
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get user records", ['user_id' => $userId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    // ==================== AI INTERACTIONS ====================

    public function saveAIInteraction(string $recordId, string $fieldName, string $prompt, string $response, bool $accepted = false): string
    {
        try {
            return $this->addDocument('ai_interactions', [
                'record_id'  => $recordId,
                'field_name' => $fieldName,
                'prompt'     => $prompt,
                'response'   => $response,
                'accepted'   => $accepted,
                'created_at' => new \DateTime(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to save AI interaction", ['record_id' => $recordId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getAIInteractions(string $recordId): array
    {
        try {
            return $this->queryDocuments('ai_interactions', [['field' => 'record_id', 'value' => $recordId]]);
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get AI interactions", ['record_id' => $recordId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function updateAIInteractionAcceptance(string $interactionId, bool $accepted): bool
    {
        try {
            $this->updateDocument('ai_interactions', $interactionId, ['accepted' => $accepted]);
            return true;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to update AI interaction", ['interaction_id' => $interactionId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    // ==================== EDUCATIONAL SERVICES ====================

    public function createEducationalService(string $collection, string $userId, array $data): string
    {
        try {
            $id = $this->addDocument($collection, array_merge($data, [
                'user_id'    => $userId,
                'status'     => $data['status'] ?? 'draft',
                'created_at' => new \DateTime(),
                'updated_at' => new \DateTime(),
            ]));
            Log::info("Firestore: Created educational service", ['collection' => $collection, 'id' => $id]);
            return $id;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to create educational service", ['collection' => $collection, 'user_id' => $userId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getEducationalService(string $collection, string $documentId): ?array
    {
        try {
            return $this->getDocument($collection, $documentId);
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get educational service", ['collection' => $collection, 'document_id' => $documentId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getUserEducationalServices(string $collection, string $userId, array $filters = []): array
    {
        try {
            $conditions = [['field' => 'user_id', 'value' => $userId]];
            foreach ($filters as $field => $value) {
                $conditions[] = ['field' => $field, 'value' => $value];
            }
            return $this->queryDocuments($collection, $conditions);
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to get user educational services", ['collection' => $collection, 'user_id' => $userId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function updateEducationalService(string $collection, string $documentId, array $data): bool
    {
        try {
            $this->updateDocument($collection, $documentId, $data);
            return true;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to update educational service", ['collection' => $collection, 'document_id' => $documentId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function deleteEducationalService(string $collection, string $documentId): bool
    {
        try {
            $this->deleteDocument($collection, $documentId);
            return true;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to delete educational service", ['collection' => $collection, 'document_id' => $documentId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * [CASCADE] Delete ALL Firestore data belonging to a specific user.
     * Called when an admin permanently deletes a user account.
     * Covers: all educational service collections, user_records, ai_interactions.
     *
     * @param  string $userId   MySQL user ID (stored as user_id in Firestore docs)
     * @throws \Throwable       Re-throws on unexpected failures (caller decides to ignore or abort)
     */
    public function deleteAllUserData(string $userId): void
    {
        // All collections that may hold user-owned documents
        $collections = [
            // Educational service types
            'analyses', 'certificates', 'plans', 'achievements',
            'performances', 'tests', 'distributions', 'work-evidence',
            'knowledge-production', 'follow-up-log', 'question-bank',
            'worksheets', 'weekly-plans', 'lesson-preparations',
            'unit-plans', 'portfolio-sections', 'curriculum',
            // System collections
            'user_records',
            'ai_interactions',
            'ai_conversations',
        ];

        $totalDeleted = 0;

        foreach ($collections as $collection) {
            try {
                // Find all documents owned by this user in this collection
                $docs = $this->queryDocuments($collection, [
                    ['field' => 'user_id', 'value' => $userId],
                ]);

                foreach ($docs as $doc) {
                    $docId = $doc['id'] ?? null;
                    if ($docId) {
                        try {
                            $this->deleteDocument($collection, $docId);
                            $totalDeleted++;
                        } catch (\Throwable $e) {
                            // Log individual doc failures but continue cleanup
                            Log::warning("Firestore: Failed to delete doc during user purge", [
                                'collection' => $collection,
                                'doc_id'     => $docId,
                                'user_id'    => $userId,
                                'error'      => $e->getMessage(),
                            ]);
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Collection may not exist or query may fail — log and continue
                Log::warning("Firestore: Skipping collection during user purge", [
                    'collection' => $collection,
                    'user_id'    => $userId,
                    'error'      => $e->getMessage(),
                ]);
            }
        }

        Log::info("Firestore: User data purge complete", [
            'user_id'       => $userId,
            'docs_deleted'  => $totalDeleted,
            'collections'   => count($collections),
        ]);
    }


    // ==================== DYNAMIC SHORTCUTS ====================

    protected static array $serviceTypes = [
        'Analysis'        => 'analyses',
        'Analyses'        => 'analyses',
        'Certificate'     => 'certificates',
        'Certificates'    => 'certificates',
        'Plan'            => 'plans',
        'Plans'           => 'plans',
        'Achievement'     => 'achievements',
        'Achievements'    => 'achievements',
        'Performance'     => 'performances',
        'Performances'    => 'performances',
        'Test'            => 'tests',
        'Tests'           => 'tests',
        'AIConversation'  => 'ai_conversations',
        'AIConversations' => 'ai_conversations',
    ];

    public function __call(string $method, array $arguments): mixed
    {
        $patterns = [
            '/^create(\w+)$/'  => 'createEducationalService',
            '/^get(\w+)$/'     => 'getEducationalService',
            '/^getUser(\w+)$/' => 'getUserEducationalServices',
            '/^update(\w+)$/'  => 'updateEducationalService',
            '/^delete(\w+)$/'  => 'deleteEducationalService',
        ];

        foreach ($patterns as $pattern => $genericMethod) {
            if (preg_match($pattern, $method, $matches)) {
                $typeSuffix = $matches[1];
                if (isset(self::$serviceTypes[$typeSuffix])) {
                    return $this->{$genericMethod}(self::$serviceTypes[$typeSuffix], ...$arguments);
                }
            }
        }

        throw new \BadMethodCallException("Method {$method} does not exist on " . static::class);
    }

    // ==================== AI CONVERSATIONS ====================

    public function addMessageToConversation(string $conversationId, array $message): bool
    {
        try {
            $doc = $this->getDocument('ai_conversations', $conversationId);
            if (!$doc) return false;

            $messages   = $doc['messages'] ?? [];
            $messages[] = array_merge($message, ['timestamp' => (new \DateTime())->format(\DateTime::RFC3339)]);

            $this->updateDocument('ai_conversations', $conversationId, ['messages' => $messages]);
            return true;
        } catch (\Throwable $e) {
            Log::error("Firestore: Failed to add message to conversation", ['conversation_id' => $conversationId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }
}
