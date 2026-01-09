<?php
// app/Http/Controllers/Api/AIController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirestoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AIController
 * 
 * Handles AI-powered suggestions for interactive educational records.
 * Integrates with external AI services and saves interactions to Firestore.
 * 
 * @package App\Http\Controllers\Api
 */
class AIController extends Controller
{
    protected FirestoreService $firestoreService;

    public function __construct(FirestoreService $firestoreService)
    {
        $this->firestoreService = $firestoreService;
    }

    /**
     * Generate AI suggestion for a record field.
     * 
     * POST /api/ai/suggest
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function suggest(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'record_id' => 'required|string|max:255',
            'field_name' => 'required|string|max:255',
            'prompt' => 'required|string|max:2000',
            'context' => 'nullable|array',
        ], [
            'record_id.required' => 'معرف السجل مطلوب',
            'field_name.required' => 'اسم الحقل مطلوب',
            'prompt.required' => 'النص المطلوب مطلوب',
            'prompt.max' => 'النص المطلوب طويل جداً',
        ]);

        try {
            // Verify the record exists and belongs to user
            $record = $this->firestoreService->getUserRecord($validated['record_id']);
            
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'السجل غير موجود',
                    'error' => 'record_not_found',
                ], 404);
            }

            // Check if this record belongs to the authenticated user
            if ($record['user_id'] !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح لك بالوصول لهذا السجل',
                    'error' => 'forbidden',
                ], 403);
            }

            // Generate AI suggestion (placeholder for actual AI integration)
            $aiResponse = $this->generateAISuggestion(
                $validated['prompt'],
                $validated['field_name'],
                $validated['context'] ?? []
            );

            // Save interaction to Firestore
            $interactionId = $this->firestoreService->saveAIInteraction(
                $validated['record_id'],
                $validated['field_name'],
                $validated['prompt'],
                $aiResponse,
                false // Not accepted yet
            );

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الاقتراح بنجاح',
                'data' => [
                    'interaction_id' => $interactionId,
                    'suggestion' => $aiResponse,
                    'field_name' => $validated['field_name'],
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error("AI suggestion failed", [
                'record_id' => $validated['record_id'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء الاقتراح',
                'error' => 'ai_error',
            ], 500);
        }
    }

    /**
     * Accept or reject an AI suggestion.
     * 
     * POST /api/ai/accept
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function acceptSuggestion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'interaction_id' => 'required|string|max:255',
            'accepted' => 'required|boolean',
        ], [
            'interaction_id.required' => 'معرف التفاعل مطلوب',
            'accepted.required' => 'حالة القبول مطلوبة',
        ]);

        try {
            $this->firestoreService->updateAIInteractionAcceptance(
                $validated['interaction_id'],
                $validated['accepted']
            );

            return response()->json([
                'success' => true,
                'message' => $validated['accepted'] ? 'تم قبول الاقتراح' : 'تم رفض الاقتراح',
            ]);

        } catch (\Throwable $e) {
            Log::error("Failed to update AI interaction", [
                'interaction_id' => $validated['interaction_id'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الاقتراح',
                'error' => 'update_error',
            ], 500);
        }
    }

    /**
     * Generate AI suggestion using external AI service.
     * 
     * @param string $prompt User's prompt
     * @param string $fieldName Target field name
     * @param array $context Additional context
     * @return string AI-generated suggestion
     */
    protected function generateAISuggestion(string $prompt, string $fieldName, array $context): string
    {
        // Check if OpenAI API key is configured
        $apiKey = config('services.openai.api_key');
        
        if (!$apiKey) {
            // Return a placeholder response if AI is not configured
            Log::warning("OpenAI API key not configured, returning placeholder response");
            return $this->getPlaceholderSuggestion($fieldName);
        }

        try {
            // Build the system prompt based on field type
            $systemPrompt = $this->buildSystemPrompt($fieldName, $context);
            
            // Call OpenAI API
            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-3.5-turbo'),
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 500,
                    'temperature' => 0.7,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['choices'][0]['message']['content'] ?? $this->getPlaceholderSuggestion($fieldName);
            }

            Log::warning("OpenAI API returned non-success", [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->getPlaceholderSuggestion($fieldName);

        } catch (\Throwable $e) {
            Log::error("OpenAI API call failed", [
                'error' => $e->getMessage(),
            ]);
            return $this->getPlaceholderSuggestion($fieldName);
        }
    }

    /**
     * Build system prompt based on field type.
     */
    protected function buildSystemPrompt(string $fieldName, array $context): string
    {
        $locale = app()->getLocale();
        $language = $locale === 'ar' ? 'Arabic' : 'English';
        
        return "You are an educational content assistant helping teachers and students in Saudi Arabia. 
                Respond in {$language}. 
                You are helping with the field: {$fieldName}. 
                Provide clear, concise, and educationally appropriate suggestions.
                Context: " . json_encode($context);
    }

    /**
     * Get placeholder suggestion when AI is not available.
     */
    protected function getPlaceholderSuggestion(string $fieldName): string
    {
        $placeholders = [
            'name' => 'اسم الطالب: [أدخل الاسم هنا]',
            'grade' => 'أ (ممتاز)',
            'notes' => 'ملاحظة: الطالب متميز في هذا المجال',
            'comment' => 'تعليق المعلم: أداء ممتاز، يُنصح بالاستمرار',
            'default' => 'اقتراح: [أدخل المحتوى المناسب هنا]',
        ];

        return $placeholders[$fieldName] ?? $placeholders['default'];
    }
}
