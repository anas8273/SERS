<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Meilisearch Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for Meilisearch integration.
    | Meilisearch is a powerful, fast, open-source search engine.
    |
    | To enable Meilisearch:
    | 1. Set MEILISEARCH_ENABLED=true in your .env file
    | 2. Set MEILISEARCH_HOST to your Meilisearch server URL
    | 3. Set MEILISEARCH_KEY to your API key (if required)
    |
    */

    'enabled' => env('MEILISEARCH_ENABLED', false),

    'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),

    'key' => env('MEILISEARCH_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Indexes Configuration
    |--------------------------------------------------------------------------
    |
    | Define the indexes that will be used in the application.
    | Each index has its own searchable, filterable, and sortable attributes.
    |
    */

    'indexes' => [
        'templates' => [
            'primaryKey' => 'id',
            'searchableAttributes' => [
                'name',
                'description',
                'category_name',
                'section_name',
                'tags',
            ],
            'filterableAttributes' => [
                'category_id',
                'section_id',
                'type',
                'is_free',
                'is_active',
                'price',
            ],
            'sortableAttributes' => [
                'name',
                'price',
                'created_at',
                'downloads_count',
                'rating',
            ],
        ],

        'users' => [
            'primaryKey' => 'id',
            'searchableAttributes' => [
                'name',
                'email',
            ],
            'filterableAttributes' => [
                'is_active',
                'is_admin',
                'created_at',
            ],
            'sortableAttributes' => [
                'name',
                'created_at',
            ],
        ],

        'orders' => [
            'primaryKey' => 'id',
            'searchableAttributes' => [
                'order_number',
                'user_name',
                'user_email',
            ],
            'filterableAttributes' => [
                'status',
                'payment_status',
                'user_id',
                'created_at',
            ],
            'sortableAttributes' => [
                'created_at',
                'total',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Sync Settings
    |--------------------------------------------------------------------------
    |
    | Configure how data is synced to Meilisearch.
    |
    */

    'sync' => [
        // Automatically sync on model events (create, update, delete)
        'auto_sync' => env('MEILISEARCH_AUTO_SYNC', true),

        // Batch size for bulk indexing
        'batch_size' => env('MEILISEARCH_BATCH_SIZE', 100),

        // Queue name for async indexing (null = sync)
        'queue' => env('MEILISEARCH_QUEUE', null),
    ],
];
