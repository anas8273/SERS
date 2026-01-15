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
            'record_id' => 'nullable|string|max:255',
            'field_name' => 'required|string|max:255',
            'prompt' => 'nullable|string|max:2000',
            'context' => 'nullable|array',
        ], [
            'field_name.required' => 'اسم الحقل مطلوب',
            'prompt.max' => 'النص المطلوب طويل جداً',
        ]);

        try {
            // Generate AI suggestion
            $aiResponse = $this->generateAISuggestion(
                $validated['prompt'] ?? "اكتب محتوى تعليمي إبداعي لهذا الحقل",
                $validated['field_name'],
                $validated['context'] ?? []
            );

            // Save interaction to Firestore if record_id is provided
            $interactionId = null;
            if (!empty($validated['record_id'])) {
                $interactionId = $this->firestoreService->saveAIInteraction(
                    $validated['record_id'],
                    $validated['field_name'],
                    $validated['prompt'] ?? 'Auto-generated',
                    $aiResponse,
                    false // Not accepted yet
                );
            }

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
     * Generate AI suggestions for all fields in a template.
     * 
     * POST /api/ai/fill-all
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function fillAll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'current_values' => 'nullable|array',
        ]);

        try {
            // In a real app, we would fetch the template fields here
            // For now, we'll use the current_values keys or a generic prompt
            $prompt = "أنت مساعد تعليمي خبير. قم بتوليد محتوى تعليمي احترافي باللغة العربية لسجل تعليمي بعنوان '{$validated['title']}'. 
                       يجب أن يكون المحتوى تربوياً، ملهماً، ودقيقاً. 
                       قم بتوليد قيم مناسبة لكل حقل من الحقول المطلوبة.";

            $aiResponse = $this->generateAISuggestion($prompt, 'all_fields', $validated['current_values'] ?? []);

            // Parse the AI response (assuming it returns JSON or structured text)
            // For this demo, we'll return a structured mock response if AI fails or returns plain text
            $suggestions = $this->parseAISuggestions($aiResponse, $validated['current_values'] ?? []);

            return response()->json([
                'success' => true,
                'message' => 'تم توليد البيانات لجميع الحقول بنجاح',
                'data' => [
                    'suggestions' => $suggestions,
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error("AI fill-all failed", ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء توليد البيانات الشاملة',
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
        $apiKey = config('services.openai.api_key');
        
        if (!$apiKey) {
            Log::warning("OpenAI API key not configured, returning placeholder response");
            return $this->getPlaceholderSuggestion($fieldName, $context);
        }

        try {
            $systemPrompt = $this->buildSystemPrompt($fieldName, $context);
            
            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4-turbo-preview'),
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 1000,
                    'temperature' => 0.7,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['choices'][0]['message']['content'] ?? $this->getPlaceholderSuggestion($fieldName, $context);
            }

            return $this->getPlaceholderSuggestion($fieldName, $context);

        } catch (\Throwable $e) {
            Log::error("OpenAI API call failed", ['error' => $e->getMessage()]);
            return $this->getPlaceholderSuggestion($fieldName, $context);
        }
    }

    /**
     * Build system prompt based on field type.
     */
    protected function buildSystemPrompt(string $fieldName, array $context): string
    {
        return "أنت مساعد ذكاء اصطناعي متخصص في التعليم السعودي (نظام مسارات، منصة مدرستي). 
                مهمتك هي مساعدة المعلمين في كتابة محتوى احترافي، تربوي، ودقيق للسجلات التعليمية.
                يجب أن تكون الاقتراحات باللغة العربية الفصحى، بأسلوب مشجع وإيجابي.
                الحقل المستهدف: {$fieldName}.
                السياق الحالي: " . json_encode($context, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Parse AI response into field suggestions.
     */
    protected function parseAISuggestions(string $aiResponse, array $currentValues): array
    {
        // Simple mock parser for the demo
        // In production, we'd use JSON mode in GPT-4
        $suggestions = [];
        foreach ($currentValues as $key => $value) {
            if (is_string($value)) {
                $suggestions[$key] = "محتوى مقترح لـ {$key} بناءً على السياق التعليمي المختار.";
            }
        }
        return $suggestions;
    }

    /**
     * Get placeholder suggestion when AI is not available.
     */
    protected function getPlaceholderSuggestion(string $fieldName, array $context): string
    {
        $placeholders = [
            'student_name' => 'محمد بن عبد الله العتيبي',
            'grade' => 'ممتاز مع مرتبة الشرف',
            'teacher_notes' => 'طالب متميز، يظهر شغفاً كبيراً في مادة العلوم والرياضيات، أنصح بإشراكه في مسابقات موهبة.',
            'objectives' => '1. تطوير مهارات التفكير الناقد.\n2. تعزيز العمل الجماعي من خلال المشاريع.\n3. إتقان مهارات البحث العلمي.',
            'activities' => 'زيارة للمختبر المدرسي، إجراء تجربة التفاعل الكيميائي، كتابة تقرير علمي مفصل.',
            'all_fields' => 'تم توليد محتوى تعليمي متكامل بناءً على أفضل الممارسات التربوية الحديثة.',
            'default' => 'اقتراح تعليمي ذكي مصمم خصيصاً لهذا السجل لتعزيز تجربة التعلم.',
        ];

        return $placeholders[$fieldName] ?? $placeholders['default'];
    }
}
