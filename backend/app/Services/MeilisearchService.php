<?php
// app/Services/MeilisearchService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MeilisearchService
 * 
 * Handles all Meilisearch interactions for smart search functionality.
 * This service is prepared for future integration with Meilisearch.
 * 
 * @package App\Services
 */
class MeilisearchService
{
    protected string $host;
    protected string $apiKey;
    protected bool $enabled;

    public function __construct()
    {
        $this->host = config('services.meilisearch.host', 'http://localhost:7700');
        $this->apiKey = config('services.meilisearch.key', '');
        $this->enabled = config('services.meilisearch.enabled', false);
    }

    /**
     * Check if Meilisearch is enabled and configured.
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->host);
    }

    /**
     * Get HTTP client with Meilisearch headers.
     */
    protected function client()
    {
        return Http::baseUrl($this->host)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ]);
    }

    /**
     * Check Meilisearch health.
     */
    public function health(): array
    {
        if (!$this->isEnabled()) {
            return ['status' => 'disabled', 'message' => 'Meilisearch is not enabled'];
        }

        try {
            $response = $this->client()->get('/health');
            return $response->json();
        } catch (\Throwable $e) {
            Log::error("Meilisearch: Health check failed", ['error' => $e->getMessage()]);
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    // ==================== INDEX MANAGEMENT ====================

    /**
     * Create an index.
     */
    public function createIndex(string $indexName, string $primaryKey = 'id'): array
    {
        if (!$this->isEnabled()) {
            return ['status' => 'disabled'];
        }

        try {
            $response = $this->client()->post('/indexes', [
                'uid' => $indexName,
                'primaryKey' => $primaryKey,
            ]);

            Log::info("Meilisearch: Created index", ['index' => $indexName]);
            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to create index", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete an index.
     */
    public function deleteIndex(string $indexName): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $this->client()->delete("/indexes/{$indexName}");
            Log::info("Meilisearch: Deleted index", ['index' => $indexName]);
            return true;

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to delete index", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get index info.
     */
    public function getIndex(string $indexName): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = $this->client()->get("/indexes/{$indexName}");
            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to get index", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * List all indexes.
     */
    public function listIndexes(): array
    {
        if (!$this->isEnabled()) {
            return [];
        }

        try {
            $response = $this->client()->get('/indexes');
            return $response->json()['results'] ?? [];

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to list indexes", ['error' => $e->getMessage()]);
            return [];
        }
    }

    // ==================== DOCUMENT MANAGEMENT ====================

    /**
     * Add or update documents in an index.
     */
    public function addDocuments(string $indexName, array $documents): array
    {
        if (!$this->isEnabled()) {
            return ['status' => 'disabled'];
        }

        try {
            $response = $this->client()->post("/indexes/{$indexName}/documents", $documents);

            Log::info("Meilisearch: Added documents", [
                'index' => $indexName,
                'count' => count($documents),
            ]);

            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to add documents", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get a document by ID.
     */
    public function getDocument(string $indexName, string $documentId): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = $this->client()->get("/indexes/{$indexName}/documents/{$documentId}");
            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to get document", [
                'index' => $indexName,
                'document_id' => $documentId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Delete a document by ID.
     */
    public function deleteDocument(string $indexName, string $documentId): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $this->client()->delete("/indexes/{$indexName}/documents/{$documentId}");

            Log::info("Meilisearch: Deleted document", [
                'index' => $indexName,
                'document_id' => $documentId,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to delete document", [
                'index' => $indexName,
                'document_id' => $documentId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete all documents in an index.
     */
    public function deleteAllDocuments(string $indexName): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $this->client()->delete("/indexes/{$indexName}/documents");

            Log::info("Meilisearch: Deleted all documents", ['index' => $indexName]);
            return true;

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to delete all documents", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    // ==================== SEARCH ====================

    /**
     * Search documents in an index.
     */
    public function search(string $indexName, string $query, array $options = []): array
    {
        if (!$this->isEnabled()) {
            return ['hits' => [], 'query' => $query, 'status' => 'disabled'];
        }

        try {
            $searchParams = array_merge([
                'q' => $query,
                'limit' => $options['limit'] ?? 20,
                'offset' => $options['offset'] ?? 0,
            ], $options);

            // Add filters if provided
            if (!empty($options['filter'])) {
                $searchParams['filter'] = $options['filter'];
            }

            // Add facets if provided
            if (!empty($options['facets'])) {
                $searchParams['facets'] = $options['facets'];
            }

            // Add sort if provided
            if (!empty($options['sort'])) {
                $searchParams['sort'] = $options['sort'];
            }

            // Add attributes to retrieve
            if (!empty($options['attributesToRetrieve'])) {
                $searchParams['attributesToRetrieve'] = $options['attributesToRetrieve'];
            }

            // Add attributes to highlight
            if (!empty($options['attributesToHighlight'])) {
                $searchParams['attributesToHighlight'] = $options['attributesToHighlight'];
            }

            $response = $this->client()->post("/indexes/{$indexName}/search", $searchParams);

            Log::info("Meilisearch: Search executed", [
                'index' => $indexName,
                'query' => $query,
                'hits' => count($response->json()['hits'] ?? []),
            ]);

            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Search failed", [
                'index' => $indexName,
                'query' => $query,
                'error' => $e->getMessage(),
            ]);

            // Return empty results on error
            return ['hits' => [], 'query' => $query, 'error' => $e->getMessage()];
        }
    }

    /**
     * Multi-search across multiple indexes.
     */
    public function multiSearch(array $queries): array
    {
        if (!$this->isEnabled()) {
            return ['results' => [], 'status' => 'disabled'];
        }

        try {
            $response = $this->client()->post('/multi-search', [
                'queries' => $queries,
            ]);

            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Multi-search failed", ['error' => $e->getMessage()]);
            return ['results' => [], 'error' => $e->getMessage()];
        }
    }

    // ==================== SETTINGS ====================

    /**
     * Update index settings.
     */
    public function updateSettings(string $indexName, array $settings): array
    {
        if (!$this->isEnabled()) {
            return ['status' => 'disabled'];
        }

        try {
            $response = $this->client()->patch("/indexes/{$indexName}/settings", $settings);

            Log::info("Meilisearch: Updated settings", ['index' => $indexName]);
            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to update settings", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get index settings.
     */
    public function getSettings(string $indexName): array
    {
        if (!$this->isEnabled()) {
            return [];
        }

        try {
            $response = $this->client()->get("/indexes/{$indexName}/settings");
            return $response->json();

        } catch (\Throwable $e) {
            Log::error("Meilisearch: Failed to get settings", [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Configure searchable attributes.
     */
    public function setSearchableAttributes(string $indexName, array $attributes): array
    {
        return $this->updateSettings($indexName, [
            'searchableAttributes' => $attributes,
        ]);
    }

    /**
     * Configure filterable attributes.
     */
    public function setFilterableAttributes(string $indexName, array $attributes): array
    {
        return $this->updateSettings($indexName, [
            'filterableAttributes' => $attributes,
        ]);
    }

    /**
     * Configure sortable attributes.
     */
    public function setSortableAttributes(string $indexName, array $attributes): array
    {
        return $this->updateSettings($indexName, [
            'sortableAttributes' => $attributes,
        ]);
    }

    // ==================== TEMPLATE-SPECIFIC METHODS ====================

    /**
     * Index a template for search.
     */
    public function indexTemplate(array $template): array
    {
        $document = [
            'id' => $template['id'],
            'name' => $template['name'],
            'description' => $template['description'] ?? '',
            'category_id' => $template['category_id'] ?? null,
            'category_name' => $template['category']['name'] ?? '',
            'section_id' => $template['section_id'] ?? null,
            'section_name' => $template['section']['name'] ?? '',
            'type' => $template['type'] ?? 'ready',
            'price' => $template['price'] ?? 0,
            'is_free' => ($template['price'] ?? 0) == 0,
            'is_active' => $template['is_active'] ?? true,
            'tags' => $template['tags'] ?? [],
            'created_at' => $template['created_at'] ?? now()->toISOString(),
        ];

        return $this->addDocuments('templates', [$document]);
    }

    /**
     * Remove a template from search index.
     */
    public function removeTemplate(string $templateId): bool
    {
        return $this->deleteDocument('templates', $templateId);
    }

    /**
     * Search templates.
     */
    public function searchTemplates(string $query, array $filters = []): array
    {
        $options = [
            'limit' => $filters['limit'] ?? 20,
            'offset' => $filters['offset'] ?? 0,
            'attributesToHighlight' => ['name', 'description'],
        ];

        // Build filter string
        $filterParts = [];

        if (!empty($filters['category_id'])) {
            $filterParts[] = "category_id = '{$filters['category_id']}'";
        }

        if (!empty($filters['section_id'])) {
            $filterParts[] = "section_id = '{$filters['section_id']}'";
        }

        if (!empty($filters['type'])) {
            $filterParts[] = "type = '{$filters['type']}'";
        }

        if (isset($filters['is_free'])) {
            $filterParts[] = "is_free = " . ($filters['is_free'] ? 'true' : 'false');
        }

        if (!empty($filterParts)) {
            $options['filter'] = implode(' AND ', $filterParts);
        }

        // Add sorting
        if (!empty($filters['sort'])) {
            $options['sort'] = [$filters['sort']];
        }

        return $this->search('templates', $query, $options);
    }

    /**
     * Initialize templates index with proper settings.
     */
    public function initializeTemplatesIndex(): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        // Create index if not exists
        $this->createIndex('templates', 'id');

        // Set searchable attributes
        $this->setSearchableAttributes('templates', [
            'name',
            'description',
            'category_name',
            'section_name',
            'tags',
        ]);

        // Set filterable attributes
        $this->setFilterableAttributes('templates', [
            'category_id',
            'section_id',
            'type',
            'is_free',
            'is_active',
            'price',
        ]);

        // Set sortable attributes
        $this->setSortableAttributes('templates', [
            'name',
            'price',
            'created_at',
        ]);

        Log::info("Meilisearch: Initialized templates index");
    }
}
