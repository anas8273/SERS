<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIConversation;
use App\Models\Analysis;
use App\Models\Plan;
use App\Models\Template;
use App\Models\UserTemplateData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', env('OPENAI_API_KEY'));
        $this->apiUrl = config('services.openai.api_url', 'https://api.openai.com/v1/chat/completions');
        $this->model = config('services.openai.model', 'gpt-4');
    }

    /**
     * Get AI suggestion for a template field.
     */
    public function suggest(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'nullable|string',
            'field_name' => 'required|string',
            'title' => 'nullable|string',
            'current_values' => 'nullable|array',
            'field_label' => 'nullable|string',
            'ai_hint' => 'nullable|string',
        ]);

        $template = null;
        if (!empty($validated['template_id'])) {
            $template = Template::find($validated['template_id']);
        }

        $prompt = $this->buildSuggestionPrompt(
            $validated['field_name'],
            $validated['title'] ?? '',
            $validated['current_values'] ?? [],
            $template,
            $validated['field_label'] ?? null,
            $validated['ai_hint'] ?? null
        );

        $response = $this->callOpenAI($prompt);

        return response()->json([
            'success' => true,
            'data' => [
                'suggestion' => $response,
                'field_name' => $validated['field_name'],
            ],
        ]);
    }

    /**
     * Fill all template fields using AI.
     */
    public function fillAll(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'nullable|uuid',
            'title' => 'required|string',
            'current_values' => 'nullable|array',
        ]);

        $template = null;
        $fields = [];

        if ($validated['template_id']) {
            $template = Template::with('fields')->find($validated['template_id']);
            $fields = $template?->fields ?? [];
        }

        $prompt = $this->buildFillAllPrompt(
            $validated['title'],
            $fields,
            $validated['current_values'] ?? []
        );

        $response = $this->callOpenAI($prompt, true);

        return response()->json([
            'success' => true,
            'data' => [
                'values' => $response,
            ],
        ]);
    }

    /**
     * Get AI analysis suggestions.
     */
    public function suggestAnalysis(Request $request)
    {
        $validated = $request->validate([
            'analysis_id' => 'required|uuid|exists:analyses,id',
        ]);

        $analysis = Analysis::where('user_id', Auth::id())
                           ->findOrFail($validated['analysis_id']);

        $prompt = $this->buildAnalysisPrompt($analysis);
        $response = $this->callOpenAI($prompt);

        // Save recommendations
        $analysis->update(['ai_recommendations' => $response]);

        return response()->json([
            'success' => true,
            'data' => [
                'recommendations' => $response,
            ],
        ]);
    }

    /**
     * Get AI plan suggestions.
     */
    public function suggestPlan(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:remedial,enrichment,weekly,curriculum',
            'subject' => 'required|string',
            'grade' => 'required|string',
            'students' => 'nullable|array',
            'context' => 'nullable|string',
        ]);

        $prompt = $this->buildPlanPrompt($validated);
        $response = $this->callOpenAI($prompt, true);

        return response()->json([
            'success' => true,
            'data' => [
                'plan_content' => $response,
            ],
        ]);
    }

    /**
     * Get AI certificate text suggestions.
     */
    public function suggestCertificate(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'recipient_name' => 'required|string',
            'recipient_title' => 'nullable|string',
            'reason' => 'nullable|string',
            'organization' => 'nullable|string',
        ]);

        $prompt = $this->buildCertificatePrompt($validated);
        $response = $this->callOpenAI($prompt);

        return response()->json([
            'success' => true,
            'data' => [
                'text' => $response,
            ],
        ]);
    }

    /**
     * AI Chatbot conversation.
     */
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|uuid',
            'context_type' => 'nullable|string',
            'context_id' => 'nullable|string',
        ]);

        $userId = Auth::id();

        // Get or create conversation
        $conversation = null;
        if ($validated['conversation_id']) {
            $conversation = AIConversation::where('user_id', $userId)
                                         ->find($validated['conversation_id']);
        }

        if (!$conversation) {
            $conversation = AIConversation::create([
                'user_id' => $userId,
                'messages' => [],
                'context_type' => $validated['context_type'] ?? null,
                'context_id' => $validated['context_id'] ?? null,
            ]);
        }

        // Add user message
        $conversation->addMessage('user', $validated['message']);

        // Build messages for API
        $messages = $this->buildChatMessages($conversation);

        // Call OpenAI
        $response = $this->callOpenAIChat($messages);

        // Add assistant message
        $conversation->addMessage('assistant', $response);

        // Update title if first message
        if ($conversation->getMessagesCount() === 2 && !$conversation->title) {
            $conversation->update(['title' => $conversation->generateTitle()]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'message' => $response,
                'conversation_id' => $conversation->id,
            ],
        ]);
    }

    /**
     * Get user's conversations.
     */
    public function conversations(Request $request)
    {
        $conversations = AIConversation::where('user_id', Auth::id())
                                       ->orderBy('updated_at', 'desc')
                                       ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    /**
     * Get a specific conversation.
     */
    public function conversation(string $id)
    {
        $conversation = AIConversation::where('user_id', Auth::id())
                                      ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $conversation,
        ]);
    }

    /**
     * Delete a conversation.
     */
    public function deleteConversation(string $id)
    {
        $conversation = AIConversation::where('user_id', Auth::id())
                                      ->findOrFail($id);

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المحادثة بنجاح',
        ]);
    }

    // ==================== PRIVATE METHODS ====================

    private function callOpenAI(string $prompt, bool $json = false): string
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'أنت مساعد تعليمي ذكي متخصص في مساعدة المعلمين والإداريين في المدارس. تجيب باللغة العربية بشكل احترافي ومفيد.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 2000,
                'response_format' => $json ? ['type' => 'json_object'] : null,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                return $json ? json_decode($content, true) : $content;
            }

            Log::error('OpenAI API Error', ['response' => $response->body()]);
            return $json ? [] : 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.';

        } catch (\Exception $e) {
            Log::error('OpenAI API Exception', ['error' => $e->getMessage()]);
            return $json ? [] : 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
        }
    }

    private function callOpenAIChat(array $messages): string
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 2000,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }

            Log::error('OpenAI Chat API Error', ['response' => $response->body()]);
            return 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.';

        } catch (\Exception $e) {
            Log::error('OpenAI Chat API Exception', ['error' => $e->getMessage()]);
            return 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
        }
    }

    private function buildSuggestionPrompt(string $fieldName, string $title, array $currentValues, ?Template $template, ?string $fieldLabel = null, ?string $aiHint = null): string
    {
        $context = "أنت مساعد تعليمي ذكي متخصص في مساعدة المعلمين والإداريين في المدارس.\n";
        $context .= "مهمتك: اقتراح محتوى احترافي ومناسب للحقل المطلوب.\n\n";
        
        $context .= "=== معلومات القالب ===\n";
        $context .= "عنوان القالب: {$title}\n";
        
        if ($template) {
            $context .= "نوع القالب: {$template->name_ar}\n";
            if ($template->description_ar) {
                $context .= "وصف القالب: {$template->description_ar}\n";
            }
        }
        
        $context .= "\n=== الحقل المطلوب ===\n";
        $context .= "اسم الحقل: {$fieldName}\n";
        if ($fieldLabel) {
            $context .= "تسمية الحقل: {$fieldLabel}\n";
        }
        if ($aiHint) {
            $context .= "تلميح: {$aiHint}\n";
        }

        if (!empty($currentValues)) {
            $context .= "\n=== القيم المدخلة حالياً ===\n";
            foreach ($currentValues as $key => $value) {
                if (!empty($value) && is_string($value)) {
                    $context .= "- {$key}: {$value}\n";
                }
            }
        }

        // إضافة تعليمات خاصة حسب نوع الحقل
        $context .= "\n=== التعليمات ===\n";
        $context .= $this->getFieldSpecificInstructions($fieldName, $fieldLabel);
        
        $context .= "\nاكتب اقتراحاً احترافياً ومناسباً للسياق التعليمي. ";
        $context .= "يجب أن يكون الاقتراح باللغة العربية الفصحى وبأسلوب تربوي رصين. ";
        $context .= "أعط الإجابة مباشرة بدون مقدمات.";

        return $context;
    }

    /**
     * Get field-specific AI instructions based on field name/label.
     */
    private function getFieldSpecificInstructions(string $fieldName, ?string $fieldLabel): string
    {
        $lowerName = mb_strtolower($fieldName);
        $lowerLabel = $fieldLabel ? mb_strtolower($fieldLabel) : '';
        
        // تعليمات خاصة لأنواع الحقول المختلفة
        $instructions = [];
        
        // الأهداف
        if (str_contains($lowerName, 'objective') || str_contains($lowerLabel, 'هدف') || str_contains($lowerLabel, 'أهداف')) {
            $instructions[] = "اكتب أهدافاً تعليمية واضحة وقابلة للقياس.";
            $instructions[] = "استخدم أفعال سلوكية مثل: يحدد، يصف، يحلل، يقارن.";
        }
        
        // الأنشطة
        if (str_contains($lowerName, 'activity') || str_contains($lowerLabel, 'نشاط') || str_contains($lowerLabel, 'أنشطة')) {
            $instructions[] = "اقترح أنشطة تعليمية متنوعة وتفاعلية.";
            $instructions[] = "راعِ الفروق الفردية بين الطلاب.";
        }
        
        // الشواهد والإنجازات
        if (str_contains($lowerName, 'evidence') || str_contains($lowerLabel, 'شاهد') || str_contains($lowerLabel, 'إنجاز')) {
            $instructions[] = "اكتب شاهداً محدداً وموثقاً على الأداء.";
            $instructions[] = "اذكر التاريخ والسياق إن أمكن.";
        }
        
        // التقييم
        if (str_contains($lowerName, 'assessment') || str_contains($lowerLabel, 'تقييم') || str_contains($lowerLabel, 'تقويم')) {
            $instructions[] = "اقترح طرق تقييم متنوعة ومناسبة.";
            $instructions[] = "راعِ التقييم التكويني والختامي.";
        }
        
        // التوصيات
        if (str_contains($lowerName, 'recommendation') || str_contains($lowerLabel, 'توصية') || str_contains($lowerLabel, 'توصيات')) {
            $instructions[] = "قدم توصيات عملية وقابلة للتنفيذ.";
            $instructions[] = "اربط التوصيات بالسياق التعليمي.";
        }
        
        // الملاحظات
        if (str_contains($lowerName, 'note') || str_contains($lowerLabel, 'ملاحظة') || str_contains($lowerLabel, 'ملاحظات')) {
            $instructions[] = "اكتب ملاحظات موضوعية ومهنية.";
            $instructions[] = "تجنب التعميمات غير المبررة.";
        }
        
        return !empty($instructions) ? implode("\n", $instructions) . "\n" : "";
    }

    private function buildFillAllPrompt(string $title, $fields, array $currentValues): string
    {
        $context = "أنت تساعد معلماً في ملء نموذج تعليمي.\n";
        $context .= "عنوان النموذج: {$title}\n";

        if (!empty($fields)) {
            $context .= "الحقول المطلوبة:\n";
            foreach ($fields as $field) {
                $context .= "- {$field->name}: {$field->label}\n";
            }
        }

        if (!empty($currentValues)) {
            $context .= "القيم الحالية:\n";
            foreach ($currentValues as $key => $value) {
                $context .= "- {$key}: {$value}\n";
            }
        }

        $context .= "\nأكمل جميع الحقول الفارغة بقيم مناسبة. أرجع النتيجة كـ JSON object حيث المفتاح هو اسم الحقل والقيمة هي المحتوى المقترح.";

        return $context;
    }

    private function buildAnalysisPrompt(Analysis $analysis): string
    {
        $results = $analysis->results ?? [];
        
        $prompt = "أنت محلل تعليمي متخصص. قم بتحليل نتائج الطلاب التالية وقدم توصيات:\n\n";
        $prompt .= "المادة: " . ($analysis->subject ?? 'غير محدد') . "\n";
        $prompt .= "الصف: " . ($analysis->grade ?? 'غير محدد') . "\n";
        $prompt .= "عدد الطلاب: " . ($results['count'] ?? 0) . "\n";
        $prompt .= "المتوسط: " . ($results['average'] ?? 0) . "\n";
        $prompt .= "أعلى درجة: " . ($results['max'] ?? 0) . "\n";
        $prompt .= "أدنى درجة: " . ($results['min'] ?? 0) . "\n";
        $prompt .= "نسبة النجاح: " . ($results['pass_rate'] ?? 0) . "%\n";

        if (isset($results['distribution'])) {
            $prompt .= "\nتوزيع الدرجات:\n";
            $prompt .= "- ممتاز: " . ($results['distribution']['excellent'] ?? 0) . "\n";
            $prompt .= "- جيد جداً: " . ($results['distribution']['very_good'] ?? 0) . "\n";
            $prompt .= "- جيد: " . ($results['distribution']['good'] ?? 0) . "\n";
            $prompt .= "- مقبول: " . ($results['distribution']['acceptable'] ?? 0) . "\n";
            $prompt .= "- راسب: " . ($results['distribution']['fail'] ?? 0) . "\n";
        }

        $prompt .= "\nقدم:\n1. تحليل عام للنتائج\n2. نقاط القوة\n3. نقاط الضعف\n4. توصيات للتحسين\n5. اقتراحات للطلاب المتفوقين والمتأخرين";

        return $prompt;
    }

    private function buildPlanPrompt(array $data): string
    {
        $typeNames = [
            'remedial' => 'علاجية',
            'enrichment' => 'إثرائية',
            'weekly' => 'أسبوعية',
            'curriculum' => 'توزيع منهج',
        ];

        $prompt = "أنت مخطط تعليمي متخصص. قم بإنشاء خطة " . ($typeNames[$data['type']] ?? $data['type']) . " للمعلم.\n\n";
        $prompt .= "المادة: {$data['subject']}\n";
        $prompt .= "الصف: {$data['grade']}\n";

        if (!empty($data['students'])) {
            $prompt .= "الطلاب المستهدفون:\n";
            foreach ($data['students'] as $student) {
                $name = $student['name'] ?? 'غير محدد';
                $grade = $student['grade'] ?? 'غير محدد';
                $prompt .= "- {$name}: {$grade}\n";
            }
        }

        if (!empty($data['context'])) {
            $prompt .= "\nسياق إضافي: {$data['context']}\n";
        }

        $prompt .= "\nأرجع خطة مفصلة كـ JSON تتضمن:\n";
        $prompt .= "- objectives: قائمة الأهداف\n";
        $prompt .= "- activities: قائمة الأنشطة\n";
        $prompt .= "- resources: الموارد المطلوبة\n";
        $prompt .= "- assessment: طرق التقييم\n";
        $prompt .= "- timeline: الجدول الزمني\n";

        return $prompt;
    }

    private function buildCertificatePrompt(array $data): string
    {
        $typeNames = [
            'appreciation' => 'تقدير',
            'thanks' => 'شكر',
            'graduation' => 'تخرج',
            'honor' => 'شرف',
            'participation' => 'مشاركة',
            'achievement' => 'إنجاز',
            'training' => 'تدريب',
        ];

        $prompt = "اكتب نص شهادة " . ($typeNames[$data['type']] ?? $data['type']) . " احترافية.\n\n";
        $prompt .= "اسم المستلم: {$data['recipient_name']}\n";
        
        if (!empty($data['recipient_title'])) {
            $prompt .= "لقب المستلم: {$data['recipient_title']}\n";
        }
        
        if (!empty($data['reason'])) {
            $prompt .= "السبب: {$data['reason']}\n";
        }
        
        if (!empty($data['organization'])) {
            $prompt .= "المؤسسة: {$data['organization']}\n";
        }

        $prompt .= "\nاكتب نص الشهادة بأسلوب رسمي واحترافي باللغة العربية الفصحى.";

        return $prompt;
    }

    private function buildChatMessages(AIConversation $conversation): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت مساعد تعليمي ذكي اسمه "سيرس" (SERS). تساعد المعلمين والإداريين في المدارس في:
- إنشاء وتعبئة السجلات والنماذج التعليمية
- تحليل نتائج الطلاب وتقديم توصيات
- إنشاء الخطط العلاجية والإثرائية
- إعداد الشهادات والتقارير
- الإجابة على الاستفسارات التعليمية
- توثيق الإنجازات اليومية والأسبوعية والشهرية
- إعداد توزيع المناهج الدراسية
- تقييم الأداء الوظيفي وشواهد الأداء

تجيب باللغة العربية بشكل احترافي ومفيد ومختصر. إذا لم تكن متأكداً من إجابة، اعترف بذلك واقترح مصادر للمساعدة.',
            ],
        ];

        foreach ($conversation->messages ?? [] as $message) {
            $messages[] = [
                'role' => $message['role'],
                'content' => $message['content'],
            ];
        }

        return $messages;
    }

    /**
     * Generate performance report using AI.
     */
    public function generatePerformanceReport(Request $request)
    {
        $validated = $request->validate([
            'teacher_name' => 'required|string|max:100',
            'period' => 'required|string|max:50',
            'achievements' => 'required|array',
            'activities' => 'nullable|array',
            'challenges' => 'nullable|array',
        ]);

        $prompt = $this->buildPerformanceReportPrompt($validated);
        $response = $this->callOpenAI($prompt);

        return response()->json([
            'success' => true,
            'data' => [
                'report' => $response,
            ],
        ]);
    }

    /**
     * Generate achievement documentation using AI.
     */
    public function generateAchievementDoc(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:daily,weekly,monthly,semester',
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:1000',
            'date' => 'nullable|date',
        ]);

        $prompt = $this->buildAchievementDocPrompt($validated);
        $response = $this->callOpenAI($prompt);

        return response()->json([
            'success' => true,
            'data' => [
                'documentation' => $response,
            ],
        ]);
    }

    /**
     * Generate curriculum distribution using AI.
     */
    public function generateCurriculumDistribution(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:50',
            'grade' => 'required|string|max:50',
            'semester' => 'required|string|max:50',
            'weeks' => 'required|integer|min:1|max:52',
            'topics' => 'required|array',
        ]);

        $prompt = $this->buildCurriculumDistributionPrompt($validated);
        $response = $this->callOpenAI($prompt, true);

        return response()->json([
            'success' => true,
            'data' => [
                'distribution' => $response,
            ],
        ]);
    }

    /**
     * Get AI recommendations based on user activity.
     */
    public function getRecommendations(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'nullable|string',
            'grade' => 'nullable|string',
            'recent_views' => 'nullable|array',
            'purchases' => 'nullable|array',
        ]);

        $prompt = $this->buildRecommendationsPrompt($validated);
        $response = $this->callOpenAI($prompt, true);

        return response()->json([
            'success' => true,
            'data' => $response,
        ]);
    }

    /**
     * Quick AI suggestions based on context.
     */
    public function quickSuggestions(Request $request)
    {
        $validated = $request->validate([
            'context' => 'required|string|in:plan,certificate,report,analysis',
            'data' => 'nullable|array',
        ]);

        $suggestions = [];
        
        switch ($validated['context']) {
            case 'plan':
                $suggestions = [
                    'therapeutic' => [
                        'title' => 'خطة علاجية',
                        'description' => 'إنشاء خطة علاجية للطلاب ذوي المستوى المنخفض',
                        'action' => 'generate_therapeutic_plan'
                    ],
                    'enrichment' => [
                        'title' => 'خطة إثرائية',
                        'description' => 'إنشاء خطة إثرائية للطلاب المتفوقين',
                        'action' => 'generate_enrichment_plan'
                    ],
                    'curriculum' => [
                        'title' => 'توزيع المنهج',
                        'description' => 'إنشاء توزيع منهج دراسي',
                        'action' => 'generate_curriculum'
                    ],
                ];
                break;
            case 'certificate':
                $suggestions = [
                    'appreciation' => [
                        'title' => 'شهادة تقدير',
                        'description' => 'إنشاء شهادة تقدير للطالب أو المعلم',
                        'action' => 'generate_appreciation'
                    ],
                    'thanks' => [
                        'title' => 'شهادة شكر',
                        'description' => 'إنشاء شهادة شكر وتقدير',
                        'action' => 'generate_thanks'
                    ],
                    'participation' => [
                        'title' => 'شهادة مشاركة',
                        'description' => 'إنشاء شهادة مشاركة في فعالية',
                        'action' => 'generate_participation'
                    ],
                ];
                break;
            case 'report':
                $suggestions = [
                    'performance' => [
                        'title' => 'تقرير أداء',
                        'description' => 'إنشاء تقرير أداء وظيفي',
                        'action' => 'generate_performance_report'
                    ],
                    'achievement' => [
                        'title' => 'توثيق إنجاز',
                        'description' => 'توثيق إنجاز يومي أو أسبوعي',
                        'action' => 'generate_achievement'
                    ],
                ];
                break;
            case 'analysis':
                $suggestions = [
                    'test_analysis' => [
                        'title' => 'تحليل اختبار',
                        'description' => 'تحليل نتائج اختبار وتقديم توصيات',
                        'action' => 'analyze_test'
                    ],
                ];
                break;
        }

        return response()->json([
            'success' => true,
            'data' => $suggestions,
        ]);
    }

    // ==================== ADDITIONAL PRIVATE METHODS ====================

    private function buildPerformanceReportPrompt(array $data): string
    {
        $achievementsText = implode("\n- ", $data['achievements'] ?? []);
        $activitiesText = implode("\n- ", $data['activities'] ?? []);
        $challengesText = implode("\n- ", $data['challenges'] ?? []);

        return <<<PROMPT
أنشئ تقرير أداء وظيفي شامل:

**معلومات المعلم:**
- الاسم: {$data['teacher_name']}
- الفترة: {$data['period']}

**الإنجازات:**
- {$achievementsText}

**الأنشطة:**
- {$activitiesText}

**التحديات:**
- {$challengesText}

**المطلوب:**
1. ملخص تنفيذي
2. تفصيل الإنجازات مع الأدلة
3. تحليل الأنشطة وأثرها
4. التحديات وكيفية التعامل معها
5. نقاط القوة والتميز
6. مجالات التطوير
7. الأهداف المستقبلية
PROMPT;
    }

    private function buildAchievementDocPrompt(array $data): string
    {
        $typeLabels = [
            'daily' => 'يومي',
            'weekly' => 'أسبوعي',
            'monthly' => 'شهري',
            'semester' => 'فصلي',
        ];
        $type = $typeLabels[$data['type']] ?? $data['type'];
        $date = $data['date'] ?? date('Y-m-d');

        return <<<PROMPT
قم بتوثيق الإنجاز التالي بشكل احترافي:

**معلومات الإنجاز:**
- النوع: {$type}
- العنوان: {$data['title']}
- الوصف: {$data['description']}
- التاريخ: {$date}

**المطلوب:**
1. صياغة احترافية للإنجاز
2. تحديد الأثر والنتائج
3. ربطه بالأهداف التعليمية
4. اقتراح أدلة داعمة
PROMPT;
    }

    private function buildCurriculumDistributionPrompt(array $data): string
    {
        $topicsText = implode("\n- ", $data['topics'] ?? []);

        return <<<PROMPT
أنشئ توزيع منهج دراسي شامل:

**معلومات المنهج:**
- المادة: {$data['subject']}
- الصف: {$data['grade']}
- الفصل الدراسي: {$data['semester']}
- عدد الأسابيع: {$data['weeks']}

**الموضوعات:**
- {$topicsText}

**المطلوب:**
أرجع النتيجة كـ JSON يتضمن:
- weeks: مصفوفة من الأسابيع، كل أسبوع يحتوي على: week_number, topic, objectives, activities, assessment
- summary: ملخص التوزيع
PROMPT;
    }

    private function buildRecommendationsPrompt(array $data): string
    {
        $recentViews = implode(', ', $data['recent_views'] ?? []);
        $purchases = implode(', ', $data['purchases'] ?? []);

        return <<<PROMPT
بناءً على نشاط المستخدم التالي، اقترح القوالب والخدمات المناسبة:

**النشاط:**
- المادة: {$data['subject']}
- الصف: {$data['grade']}
- القوالب المشاهدة مؤخراً: {$recentViews}
- المشتريات السابقة: {$purchases}

**المطلوب:**
أجب بصيغة JSON فقط تحتوي على:
{
    "recommended_templates": ["قائمة بأسماء القوالب المقترحة"],
    "recommended_services": ["قائمة بالخدمات المقترحة"],
    "tips": ["نصائح للمستخدم"],
    "reason": "سبب التوصيات"
}
PROMPT;
    }
}
