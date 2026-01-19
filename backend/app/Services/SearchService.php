<?php

namespace App\Services;

use App\Models\Template;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SearchService
{
    /**
     * Search templates with smart filtering and ranking.
     */
    public function searchTemplates(array $params): array
    {
        $query = $params['query'] ?? '';
        $categoryId = $params['category_id'] ?? null;
        $isInteractive = $params['is_interactive'] ?? null;
        $minPrice = $params['min_price'] ?? null;
        $maxPrice = $params['max_price'] ?? null;
        $sortBy = $params['sort_by'] ?? 'relevance';
        $limit = min($params['limit'] ?? 20, 100);
        $page = $params['page'] ?? 1;

        $cacheKey = 'search_' . md5(json_encode($params));

        // Try to get from cache for common searches
        if (empty($query) || strlen($query) < 3) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return $cached;
            }
        }

        $templatesQuery = Template::with(['category', 'variants'])
            ->where('is_active', true);

        // Text search
        if (!empty($query)) {
            $searchTerms = $this->tokenizeQuery($query);
            
            $templatesQuery->where(function ($q) use ($query, $searchTerms) {
                // Exact match has highest priority
                $q->where('name_ar', 'LIKE', "%{$query}%")
                  ->orWhere('name_en', 'LIKE', "%{$query}%")
                  ->orWhere('description_ar', 'LIKE', "%{$query}%")
                  ->orWhere('description_en', 'LIKE', "%{$query}%")
                  ->orWhere('tags', 'LIKE', "%{$query}%");

                // Also search for individual terms
                foreach ($searchTerms as $term) {
                    $q->orWhere('name_ar', 'LIKE', "%{$term}%")
                      ->orWhere('tags', 'LIKE', "%{$term}%");
                }
            });
        }

        // Category filter
        if ($categoryId) {
            $templatesQuery->where('category_id', $categoryId);
        }

        // Interactive filter
        if ($isInteractive !== null) {
            $templatesQuery->where('is_interactive', $isInteractive);
        }

        // Price range filter
        if ($minPrice !== null) {
            $templatesQuery->where('price', '>=', $minPrice);
        }
        if ($maxPrice !== null) {
            $templatesQuery->where('price', '<=', $maxPrice);
        }

        // Sorting
        switch ($sortBy) {
            case 'price_asc':
                $templatesQuery->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $templatesQuery->orderBy('price', 'desc');
                break;
            case 'newest':
                $templatesQuery->orderBy('created_at', 'desc');
                break;
            case 'popular':
                $templatesQuery->orderBy('sales_count', 'desc');
                break;
            case 'rating':
                $templatesQuery->orderBy('average_rating', 'desc');
                break;
            case 'relevance':
            default:
                if (!empty($query)) {
                    // Order by relevance (exact matches first)
                    $templatesQuery->orderByRaw("
                        CASE 
                            WHEN name_ar LIKE ? THEN 1
                            WHEN name_ar LIKE ? THEN 2
                            WHEN description_ar LIKE ? THEN 3
                            ELSE 4
                        END
                    ", ["{$query}%", "%{$query}%", "%{$query}%"]);
                }
                $templatesQuery->orderBy('sales_count', 'desc');
                break;
        }

        // Pagination
        $total = $templatesQuery->count();
        $templates = $templatesQuery
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        $result = [
            'data' => $templates,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit),
            ],
        ];

        // Cache the result for 5 minutes
        Cache::put($cacheKey, $result, 300);

        return $result;
    }

    /**
     * Get search suggestions based on partial query.
     */
    public function getSuggestions(string $query, int $limit = 5): array
    {
        if (strlen($query) < 2) {
            return [];
        }

        $suggestions = [];

        // Template name suggestions
        $templates = Template::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name_ar', 'LIKE', "%{$query}%")
                  ->orWhere('name_en', 'LIKE', "%{$query}%");
            })
            ->select('id', 'name_ar', 'name_en', 'thumbnail_url')
            ->limit($limit)
            ->get();

        foreach ($templates as $template) {
            $suggestions[] = [
                'type' => 'template',
                'id' => $template->id,
                'text' => $template->name_ar,
                'thumbnail' => $template->thumbnail_url,
            ];
        }

        // Category suggestions
        $categories = Category::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name_ar', 'LIKE', "%{$query}%")
                  ->orWhere('name_en', 'LIKE', "%{$query}%");
            })
            ->select('id', 'name_ar', 'name_en', 'icon')
            ->limit(3)
            ->get();

        foreach ($categories as $category) {
            $suggestions[] = [
                'type' => 'category',
                'id' => $category->id,
                'text' => $category->name_ar,
                'icon' => $category->icon,
            ];
        }

        return $suggestions;
    }

    /**
     * Get popular search terms.
     */
    public function getPopularSearches(int $limit = 10): array
    {
        // This could be enhanced to track actual search queries
        // For now, return predefined popular terms
        return [
            'ملف الإنجاز',
            'شهادة شكر وتقدير',
            'سجل متابعة الطلاب',
            'خطة علاجية',
            'تحليل نتائج',
            'شواهد الأداء',
            'توزيع منهج',
            'سجل الحضور والغياب',
            'تقرير أسبوعي',
            'شهادة تخرج',
        ];
    }

    /**
     * Get related templates.
     */
    public function getRelatedTemplates(string $templateId, int $limit = 6): array
    {
        $template = Template::find($templateId);
        if (!$template) {
            return [];
        }

        // Get templates from same category
        $related = Template::where('is_active', true)
            ->where('id', '!=', $templateId)
            ->where('category_id', $template->category_id)
            ->orderBy('sales_count', 'desc')
            ->limit($limit)
            ->get();

        // If not enough, get from other categories based on tags
        if ($related->count() < $limit && $template->tags) {
            $tags = is_array($template->tags) ? $template->tags : json_decode($template->tags, true);
            if (!empty($tags)) {
                $additionalIds = $related->pluck('id')->toArray();
                $additionalIds[] = $templateId;

                $additional = Template::where('is_active', true)
                    ->whereNotIn('id', $additionalIds)
                    ->where(function ($q) use ($tags) {
                        foreach ($tags as $tag) {
                            $q->orWhere('tags', 'LIKE', "%{$tag}%");
                        }
                    })
                    ->orderBy('sales_count', 'desc')
                    ->limit($limit - $related->count())
                    ->get();

                $related = $related->concat($additional);
            }
        }

        return $related->toArray();
    }

    /**
     * Tokenize search query into individual terms.
     */
    private function tokenizeQuery(string $query): array
    {
        // Remove common Arabic stop words
        $stopWords = ['من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'أن', 'كان', 'قد', 'لا', 'ما', 'هو', 'هي'];
        
        // Split by spaces and filter
        $terms = preg_split('/\s+/', $query);
        $terms = array_filter($terms, function ($term) use ($stopWords) {
            return strlen($term) >= 2 && !in_array($term, $stopWords);
        });

        return array_values($terms);
    }

    /**
     * Track search query for analytics.
     */
    public function trackSearch(string $query, ?string $userId = null): void
    {
        // This could be enhanced to store search analytics
        Log::info('Search tracked', [
            'query' => $query,
            'user_id' => $userId,
            'timestamp' => now(),
        ]);
    }
}
