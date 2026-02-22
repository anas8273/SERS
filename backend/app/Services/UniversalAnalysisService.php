<?php

namespace App\Services;

use App\Models\UserTemplateData;
use App\Models\Template;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class UniversalAnalysisService
{
    /**
     * Perform real-time analysis on any template type
     */
    public function analyzeTemplate(string $recordId, array $options = []): array
    {
        try {
            $record = UserTemplateData::with('template')->findOrFail($recordId);
            $data = $record->user_data ?? [];
            
            // Get template schema for field types
            $schema = $this->getTemplateSchema($record->template_id);
            
            // Perform universal analysis
            $analysis = [
                'record_id' => $recordId,
                'template_id' => $record->template_id,
                'template_name' => $record->template->name_ar,
                'analysis_type' => $this->detectAnalysisType($schema, $data),
                'timestamp' => now()->toISOString(),
            ];

            // Numeric analysis (grades, scores, ratings)
            $numericAnalysis = $this->performNumericAnalysis($data, $schema);
            if (!empty($numericAnalysis)) {
                $analysis['numeric'] = $numericAnalysis;
            }

            // Text analysis (completion, quality)
            $textAnalysis = $this->performTextAnalysis($data, $schema);
            if (!empty($textAnalysis)) {
                $analysis['text'] = $textAnalysis;
            }

            // Performance analysis
            $performanceAnalysis = $this->performPerformanceAnalysis($data, $schema);
            if (!empty($performanceAnalysis)) {
                $analysis['performance'] = $performanceAnalysis;
            }

            // Completion analysis
            $completionAnalysis = $this->performCompletionAnalysis($data, $schema);
            $analysis['completion'] = $completionAnalysis;

            // Generate insights
            $analysis['insights'] = $this->generateInsights($analysis);

            // Generate recommendations
            $analysis['recommendations'] = $this->generateRecommendations($analysis);

            return [
                'success' => true,
                'data' => $analysis
            ];

        } catch (\Exception $e) {
            Log::error('Universal analysis failed', [
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
     * Perform batch analysis on multiple records
     */
    public function batchAnalyze(array $recordIds, array $options = []): array
    {
        try {
            $results = [];
            $summary = [
                'total_records' => count($recordIds),
                'successful_analyses' => 0,
                'failed_analyses' => 0,
                'aggregate_stats' => [],
            ];

            foreach ($recordIds as $recordId) {
                $analysis = $this->analyzeTemplate($recordId, $options);
                
                if ($analysis['success']) {
                    $results[$recordId] = $analysis['data'];
                    $summary['successful_analyses']++;
                } else {
                    $results[$recordId] = ['error' => $analysis['error']];
                    $summary['failed_analyses']++;
                }
            }

            // Generate aggregate statistics
            $summary['aggregate_stats'] = $this->generateAggregateStats($results);

            return [
                'success' => true,
                'data' => [
                    'individual_results' => $results,
                    'summary' => $summary,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Batch analysis failed', [
                'record_ids' => $recordIds,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Real-time calculation engine for numeric fields
     */
    public function calculateRealTimeStats(array $values, string $calculationType = 'auto'): array
    {
        $numericValues = array_filter($values, 'is_numeric');
        
        if (empty($numericValues)) {
            return [];
        }

        $stats = [
            'count' => count($numericValues),
            'sum' => array_sum($numericValues),
            'average' => round(array_sum($numericValues) / count($numericValues), 2),
            'min' => min($numericValues),
            'max' => max($numericValues),
            'range' => max($numericValues) - min($numericValues),
        ];

        // Calculate median
        sort($numericValues);
        $count = count($numericValues);
        $middle = floor($count / 2);
        
        if ($count % 2 === 0) {
            $stats['median'] = ($numericValues[$middle - 1] + $numericValues[$middle]) / 2;
        } else {
            $stats['median'] = $numericValues[$middle];
        }

        // Calculate standard deviation
        $variance = 0;
        foreach ($numericValues as $value) {
            $variance += pow($value - $stats['average'], 2);
        }
        $stats['variance'] = $variance / $count;
        $stats['standard_deviation'] = round(sqrt($stats['variance']), 2);

        // Performance levels (for grades/scores)
        if ($calculationType === 'grades' || $this->looksLikeGrades($numericValues)) {
            $stats['performance_levels'] = $this->calculatePerformanceLevels($numericValues);
            $stats['grade_distribution'] = $this->calculateGradeDistribution($numericValues);
        }

        // Rankings
        $stats['rankings'] = $this->calculateRankings($numericValues);

        return $stats;
    }

    /**
     * Perform numeric analysis on data
     */
    private function performNumericAnalysis(array $data, array $schema): array
    {
        $numericFields = $this->getFieldsByType($schema, ['number', 'grade', 'score', 'rating']);
        
        if (empty($numericFields)) {
            return [];
        }

        $analysis = [];
        
        foreach ($numericFields as $field) {
            $fieldName = $field['name'];
            $value = $data[$fieldName] ?? null;
            
            if (is_numeric($value)) {
                $analysis[$fieldName] = [
                    'value' => (float) $value,
                    'field_label' => $field['label_ar'] ?? $fieldName,
                    'field_type' => $field['type'],
                    'analysis' => $this->analyzeNumericValue($value, $field),
                ];
            }
        }

        // If we have multiple numeric values, calculate relationships
        if (count($analysis) > 1) {
            $values = array_column($analysis, 'value');
            $analysis['_aggregate'] = $this->calculateRealTimeStats($values);
        }

        return $analysis;
    }

    /**
     * Perform text analysis on data
     */
    private function performTextAnalysis(array $data, array $schema): array
    {
        $textFields = $this->getFieldsByType($schema, ['text', 'textarea']);
        
        if (empty($textFields)) {
            return [];
        }

        $analysis = [];
        
        foreach ($textFields as $field) {
            $fieldName = $field['name'];
            $value = $data[$fieldName] ?? '';
            
            if (!empty($value) && is_string($value)) {
                $analysis[$fieldName] = [
                    'value' => $value,
                    'field_label' => $field['label_ar'] ?? $fieldName,
                    'analysis' => $this->analyzeTextValue($value, $field),
                ];
            }
        }

        return $analysis;
    }

    /**
     * Perform performance analysis
     */
    private function performPerformanceAnalysis(array $data, array $schema): array
    {
        // Look for performance indicators
        $performanceFields = array_filter($schema['fields'] ?? [], function($field) {
            $name = strtolower($field['name'] ?? '');
            return str_contains($name, 'performance') || 
                   str_contains($name, 'أداء') ||
                   str_contains($name, 'grade') ||
                   str_contains($name, 'درجة') ||
                   str_contains($name, 'score') ||
                   str_contains($name, 'نقاط');
        });

        if (empty($performanceFields)) {
            return [];
        }

        $analysis = [];
        $performanceValues = [];

        foreach ($performanceFields as $field) {
            $fieldName = $field['name'];
            $value = $data[$fieldName] ?? null;
            
            if (is_numeric($value)) {
                $performanceValues[] = (float) $value;
                $analysis[$fieldName] = [
                    'value' => (float) $value,
                    'performance_level' => $this->getPerformanceLevel($value),
                    'field_label' => $field['label_ar'] ?? $fieldName,
                ];
            }
        }

        if (!empty($performanceValues)) {
            $analysis['_overall'] = [
                'average_performance' => round(array_sum($performanceValues) / count($performanceValues), 2),
                'performance_trend' => $this->calculatePerformanceTrend($performanceValues),
                'improvement_areas' => $this->identifyImprovementAreas($analysis),
            ];
        }

        return $analysis;
    }

    /**
     * Perform completion analysis
     */
    private function performCompletionAnalysis(array $data, array $schema): array
    {
        $fields = $schema['fields'] ?? [];
        $totalFields = count($fields);
        $requiredFields = array_filter($fields, fn($f) => $f['is_required'] ?? false);
        $totalRequired = count($requiredFields);
        
        $filledFields = 0;
        $filledRequired = 0;
        
        foreach ($fields as $field) {
            $fieldName = $field['name'];
            $value = $data[$fieldName] ?? null;
            
            if (!empty($value)) {
                $filledFields++;
                
                if ($field['is_required'] ?? false) {
                    $filledRequired++;
                }
            }
        }

        $completionPercentage = $totalFields > 0 ? round(($filledFields / $totalFields) * 100, 1) : 0;
        $requiredCompletionPercentage = $totalRequired > 0 ? round(($filledRequired / $totalRequired) * 100, 1) : 100;

        return [
            'total_fields' => $totalFields,
            'filled_fields' => $filledFields,
            'completion_percentage' => $completionPercentage,
            'required_fields' => $totalRequired,
            'filled_required' => $filledRequired,
            'required_completion_percentage' => $requiredCompletionPercentage,
            'completion_status' => $this->getCompletionStatus($completionPercentage, $requiredCompletionPercentage),
        ];
    }

    /**
     * Generate insights based on analysis
     */
    private function generateInsights(array $analysis): array
    {
        $insights = [];

        // Completion insights
        if (isset($analysis['completion'])) {
            $completion = $analysis['completion'];
            
            if ($completion['completion_percentage'] >= 90) {
                $insights[] = [
                    'type' => 'positive',
                    'category' => 'completion',
                    'message' => 'معدل الإكمال ممتاز - تم ملء معظم الحقول',
                    'score' => 5
                ];
            } elseif ($completion['completion_percentage'] >= 70) {
                $insights[] = [
                    'type' => 'neutral',
                    'category' => 'completion',
                    'message' => 'معدل الإكمال جيد - يمكن تحسينه بملء المزيد من الحقول',
                    'score' => 3
                ];
            } else {
                $insights[] = [
                    'type' => 'warning',
                    'category' => 'completion',
                    'message' => 'معدل الإكمال منخفض - يحتاج إلى ملء المزيد من الحقول',
                    'score' => 1
                ];
            }
        }

        // Performance insights
        if (isset($analysis['performance']['_overall'])) {
            $performance = $analysis['performance']['_overall'];
            
            if ($performance['average_performance'] >= 85) {
                $insights[] = [
                    'type' => 'positive',
                    'category' => 'performance',
                    'message' => 'الأداء العام ممتاز',
                    'score' => 5
                ];
            } elseif ($performance['average_performance'] >= 70) {
                $insights[] = [
                    'type' => 'neutral',
                    'category' => 'performance',
                    'message' => 'الأداء العام جيد مع إمكانية للتحسين',
                    'score' => 3
                ];
            } else {
                $insights[] = [
                    'type' => 'warning',
                    'category' => 'performance',
                    'message' => 'الأداء العام يحتاج إلى تحسين',
                    'score' => 2
                ];
            }
        }

        // Numeric insights
        if (isset($analysis['numeric']['_aggregate'])) {
            $numeric = $analysis['numeric']['_aggregate'];
            
            if ($numeric['standard_deviation'] > ($numeric['average'] * 0.3)) {
                $insights[] = [
                    'type' => 'info',
                    'category' => 'consistency',
                    'message' => 'هناك تباين كبير في القيم الرقمية',
                    'score' => 2
                ];
            }
        }

        return $insights;
    }

    /**
     * Generate recommendations based on analysis
     */
    private function generateRecommendations(array $analysis): array
    {
        $recommendations = [];

        // Completion recommendations
        if (isset($analysis['completion'])) {
            $completion = $analysis['completion'];
            
            if ($completion['completion_percentage'] < 100) {
                $missingFields = $completion['total_fields'] - $completion['filled_fields'];
                $recommendations[] = [
                    'priority' => 'high',
                    'category' => 'completion',
                    'action' => 'complete_fields',
                    'message' => "يُنصح بملء {$missingFields} حقل إضافي لإكمال السجل",
                    'impact' => 'يحسن من جودة البيانات والتحليل'
                ];
            }
        }

        // Performance recommendations
        if (isset($analysis['performance']['improvement_areas'])) {
            foreach ($analysis['performance']['improvement_areas'] as $area) {
                $recommendations[] = [
                    'priority' => 'medium',
                    'category' => 'performance',
                    'action' => 'improve_area',
                    'message' => "التركيز على تحسين: {$area}",
                    'impact' => 'يساهم في رفع مستوى الأداء العام'
                ];
            }
        }

        return $recommendations;
    }

    /**
     * Helper methods
     */
    private function getTemplateSchema(string $templateId): array
    {
        // This would get the schema from Firestore or cache
        // For now, return empty array
        return [];
    }

    private function detectAnalysisType(array $schema, array $data): string
    {
        $fields = $schema['fields'] ?? [];
        
        // Check for grade-like fields
        $hasGrades = !empty($this->getFieldsByType($schema, ['number', 'grade']));
        if ($hasGrades) {
            return 'academic_performance';
        }

        // Check for performance fields
        $hasPerformance = !empty(array_filter($fields, function($field) {
            return str_contains(strtolower($field['name'] ?? ''), 'performance') ||
                   str_contains(strtolower($field['name'] ?? ''), 'أداء');
        }));
        
        if ($hasPerformance) {
            return 'performance_evaluation';
        }

        return 'general_analysis';
    }

    private function getFieldsByType(array $schema, array $types): array
    {
        $fields = $schema['fields'] ?? [];
        
        return array_filter($fields, function($field) use ($types) {
            return in_array($field['type'] ?? '', $types);
        });
    }

    private function analyzeNumericValue(float $value, array $field): array
    {
        return [
            'raw_value' => $value,
            'performance_level' => $this->getPerformanceLevel($value),
            'percentile' => $this->calculatePercentile($value, $field),
        ];
    }

    private function analyzeTextValue(string $value, array $field): array
    {
        return [
            'length' => strlen($value),
            'word_count' => str_word_count($value),
            'quality_score' => $this->calculateTextQuality($value),
        ];
    }

    private function getPerformanceLevel(float $value): string
    {
        if ($value >= 90) return 'ممتاز';
        if ($value >= 80) return 'جيد جداً';
        if ($value >= 70) return 'جيد';
        if ($value >= 60) return 'مقبول';
        return 'ضعيف';
    }

    private function calculatePercentile(float $value, array $field): float
    {
        // This would calculate based on historical data
        // For now, return a mock percentile
        return min(100, max(0, ($value / 100) * 100));
    }

    private function calculateTextQuality(string $text): float
    {
        $score = 0;
        
        // Length score (0-40 points)
        $length = strlen($text);
        if ($length >= 100) $score += 40;
        elseif ($length >= 50) $score += 30;
        elseif ($length >= 20) $score += 20;
        else $score += 10;
        
        // Word count score (0-30 points)
        $wordCount = str_word_count($text);
        if ($wordCount >= 20) $score += 30;
        elseif ($wordCount >= 10) $score += 20;
        elseif ($wordCount >= 5) $score += 10;
        
        // Completeness score (0-30 points)
        if (!empty(trim($text))) $score += 30;
        
        return min(100, $score);
    }

    private function looksLikeGrades(array $values): bool
    {
        $max = max($values);
        return $max <= 100 && min($values) >= 0;
    }

    private function calculatePerformanceLevels(array $values): array
    {
        $levels = [
            'excellent' => 0, // 90-100
            'very_good' => 0, // 80-89
            'good' => 0,      // 70-79
            'acceptable' => 0, // 60-69
            'weak' => 0       // 0-59
        ];

        foreach ($values as $value) {
            if ($value >= 90) $levels['excellent']++;
            elseif ($value >= 80) $levels['very_good']++;
            elseif ($value >= 70) $levels['good']++;
            elseif ($value >= 60) $levels['acceptable']++;
            else $levels['weak']++;
        }

        return $levels;
    }

    private function calculateGradeDistribution(array $values): array
    {
        $distribution = [];
        $ranges = [
            'A' => [90, 100],
            'B' => [80, 89],
            'C' => [70, 79],
            'D' => [60, 69],
            'F' => [0, 59]
        ];

        foreach ($ranges as $grade => $range) {
            $count = count(array_filter($values, fn($v) => $v >= $range[0] && $v <= $range[1]));
            $distribution[$grade] = [
                'count' => $count,
                'percentage' => count($values) > 0 ? round(($count / count($values)) * 100, 1) : 0
            ];
        }

        return $distribution;
    }

    private function calculateRankings(array $values): array
    {
        $sorted = $values;
        rsort($sorted);
        
        $rankings = [];
        foreach ($values as $i => $value) {
            $rank = array_search($value, $sorted) + 1;
            $rankings[] = [
                'value' => $value,
                'rank' => $rank,
                'total' => count($values)
            ];
        }

        return $rankings;
    }

    private function calculatePerformanceTrend(array $values): string
    {
        if (count($values) < 2) return 'insufficient_data';
        
        $first = array_slice($values, 0, ceil(count($values) / 2));
        $second = array_slice($values, ceil(count($values) / 2));
        
        $firstAvg = array_sum($first) / count($first);
        $secondAvg = array_sum($second) / count($second);
        
        $diff = $secondAvg - $firstAvg;
        
        if ($diff > 5) return 'improving';
        if ($diff < -5) return 'declining';
        return 'stable';
    }

    private function identifyImprovementAreas(array $analysis): array
    {
        $areas = [];
        
        foreach ($analysis as $field => $data) {
            if ($field === '_overall') continue;
            
            if (isset($data['value']) && $data['value'] < 70) {
                $areas[] = $data['field_label'] ?? $field;
            }
        }

        return $areas;
    }

    private function getCompletionStatus(float $overall, float $required): string
    {
        if ($required >= 100) return 'complete';
        if ($required >= 80) return 'mostly_complete';
        if ($required >= 50) return 'partially_complete';
        return 'incomplete';
    }

    private function generateAggregateStats(array $results): array
    {
        $successfulResults = array_filter($results, fn($r) => !isset($r['error']));
        
        if (empty($successfulResults)) {
            return [];
        }

        $completionRates = [];
        $performanceScores = [];
        
        foreach ($successfulResults as $result) {
            if (isset($result['completion']['completion_percentage'])) {
                $completionRates[] = $result['completion']['completion_percentage'];
            }
            
            if (isset($result['performance']['_overall']['average_performance'])) {
                $performanceScores[] = $result['performance']['_overall']['average_performance'];
            }
        }

        $stats = [];
        
        if (!empty($completionRates)) {
            $stats['completion'] = $this->calculateRealTimeStats($completionRates);
        }
        
        if (!empty($performanceScores)) {
            $stats['performance'] = $this->calculateRealTimeStats($performanceScores);
        }

        return $stats;
    }
}