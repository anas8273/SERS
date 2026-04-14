<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIConversation;
use App\Models\Analysis;
use App\Models\Plan;
use App\Models\Section;
use App\Models\Template;
use App\Models\UserTemplateData;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;
    private AIService $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;

        $this->apiKey = config('services.openai.api_key', '');

        $this->apiUrl = rtrim(
            config('services.openai.base_url', 'https://api.groq.com/openai/v1'),
            '/'
        ) . '/chat/completions';

        $this->model = config('services.openai.model', 'llama-3.3-70b-versatile');
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

        $response = $this->callOpenAI($prompt, false, 'suggest');

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

        $response = $this->callOpenAI($prompt, true, 'fill-all');

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
            'message' => 'required|string|max:20000',
            'conversation_id' => 'nullable|uuid',
            'context_type' => 'nullable|string',
            'context_id' => 'nullable|string',
            'locale' => 'nullable|string|in:ar,en',
            'template_context' => 'nullable|array',
            'template_context.id' => 'nullable|string',
            'template_context.name_ar' => 'nullable|string',
            'template_context.description_ar' => 'nullable|string',
        ]);

        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'يجب تسجيل الدخول لاستخدام المساعد الذكي.',
                ], 401);
            }

            // Get or create conversation
            $conversation = null;
            if (!empty($validated['conversation_id'])) {
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

            // Build messages for API — inject template context, locale, and user role
            $locale = $validated['locale'] ?? 'ar';
            $messages = $this->buildChatMessages($conversation, $validated['template_context'] ?? null, $locale);

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
        } catch (\Exception $e) {
            Log::error('AI Chat Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
                'error' => config('app.debug') ? $e->getMessage() : 'ai_processing_error',
            ], 500);
        }
    }

    /**
     * Get user's conversations.
     */
    public function conversations(Request $request)
    {
        $conversations = AIConversation::where('user_id', Auth::id())
                                       ->orderBy('updated_at', 'desc')
                                       ->paginate(min($request->get('per_page', 20), 50));

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

    // ===========================================================================
    // ADMIN ENDPOINTS
    // ===========================================================================

    /**
     * Get AI usage statistics for admin dashboard.
     * Combines AIConversation data with ai_request_logs for real metrics.
     */
    public function adminStats()
    {
        try {
            // ── Conversation stats (existing table) ──────────────────────────
            $totalConversations = AIConversation::count();

            $totalMessages = 0;
            try {
                $totalMessages = (int) AIConversation::whereNotNull('messages')
                    ->sum(\Illuminate\Support\Facades\DB::raw('JSON_LENGTH(messages)'));
            } catch (\Throwable $e) {
                $totalMessages = AIConversation::whereNotNull('messages')->get()
                    ->sum(fn($c) => is_array($c->messages) ? count($c->messages) : 0);
            }

            $activeUsersToday = AIConversation::whereDate('created_at', today())
                ->distinct('user_id')
                ->count('user_id');

            $dailyConvCounts = AIConversation::where('created_at', '>=', now()->subDays(6)->startOfDay())
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->pluck('count', 'date');

            // ── AI Request Log stats (new table) ─────────────────────────────
            $logsExist = \App\Models\AIRequestLog::count() > 0;

            // Total tokens from real usage data
            $totalInputTokens  = (int) \App\Models\AIRequestLog::sum('input_tokens');
            $totalOutputTokens = (int) \App\Models\AIRequestLog::sum('output_tokens');
            $totalTokensUsed   = $logsExist
                ? ($totalInputTokens + $totalOutputTokens)
                : ($totalMessages * 150); // Fallback estimate

            // Success rate (last 30 days)
            $last30Logs    = \App\Models\AIRequestLog::lastDays(30);
            $totalLog30    = (clone $last30Logs)->count();
            $successLog30  = (clone $last30Logs)->successful()->count();
            $successRate   = $totalLog30 > 0 ? round(($successLog30 / $totalLog30) * 100, 1) : null;

            // Average response latency (last 30 days, only successful calls)
            $avgLatency = $logsExist
                ? (int) \App\Models\AIRequestLog::lastDays(30)->successful()->avg('latency_ms')
                : null;

            // Feature distribution from logs
            $featureCounts = \App\Models\AIRequestLog::lastDays(30)
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action')
                ->toArray();
            $totalFeatureCount = max(array_sum($featureCounts), 1);

            $featureLabels = [
                'chat'                       => 'المحادثة الذكية',
                'suggest'                    => 'اقتراح حقل',
                'fill-all'                   => 'ملء تلقائي',
                'suggest-plan'               => 'اقتراح الخطط',
                'suggest-certificate'        => 'إنشاء الشهادات',
                'generate-performance-report'=> 'تقارير الأداء',
                'generate-achievement-doc'   => 'وثائق الإنجاز',
                'generate-curriculum'        => 'المناهج الدراسية',
                'bulk-suggest'               => 'الاقتراح الجماعي',
                'contextual-suggest'         => 'الاقتراح السياقي',
            ];

            $mostUsedFeatures = collect($featureLabels)->map(function ($label, $key) use ($featureCounts, $totalFeatureCount) {
                $count = $featureCounts[$key] ?? 0;
                return [
                    'feature'    => $label,
                    'count'      => $count,
                    'percentage' => $count > 0 ? round(($count / $totalFeatureCount) * 100, 1) : 0,
                ];
            })->values()->sortByDesc('count')->values()->toArray();

            // If no logs yet, fall back to conversations-only data
            if (!$logsExist) {
                $mostUsedFeatures = [
                    ['feature' => 'المحادثة الذكية', 'count' => $totalConversations, 'percentage' => 100],
                ];
            }

            // Daily usage (merge conversation count + log counts for chart)
            $dailyLogCounts = \App\Models\AIRequestLog::where('created_at', '>=', now()->subDays(6)->startOfDay())
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(input_tokens + output_tokens) as tokens')
                ->groupBy('date')
                ->get()
                ->keyBy('date');

            $dailyUsage = [];
            for ($i = 6; $i >= 0; $i--) {
                $date    = now()->subDays($i)->format('Y-m-d');
                $logRow  = $dailyLogCounts[$date] ?? null;
                $dailyUsage[] = [
                    'date'          => $date,
                    'conversations' => $dailyConvCounts[$date] ?? 0,
                    'requests'      => $logRow ? (int) $logRow->count  : 0,
                    'tokens'        => $logRow ? (int) $logRow->tokens : (($dailyConvCounts[$date] ?? 0) * 4 * 150),
                ];
            }

            // Recent conversations
            $recentConvs = AIConversation::with('user')->latest()->take(5)->get()->map(function ($conv) {
                $msgCount = is_array($conv->messages) ? count($conv->messages) : 0;
                return [
                    'id'             => $conv->id,
                    'user_name'      => $conv->user->name ?? 'مستخدم محذوف',
                    'messages_count' => $msgCount,
                    'tokens_used'    => $msgCount * 150,
                    'created_at'     => $conv->created_at->toISOString(),
                ];
            });

            return response()->json([
                'success'               => true,
                'total_conversations'   => $totalConversations,
                'total_messages'        => $totalMessages,
                'total_tokens_used'     => $totalTokensUsed,
                'total_input_tokens'    => $totalInputTokens,
                'total_output_tokens'   => $totalOutputTokens,
                'active_users_today'    => $activeUsersToday,
                // [AI-PERSIST] Now real data from ai_request_logs
                'average_response_time' => $avgLatency,
                'success_rate'          => $successRate,
                'most_used_features'    => $mostUsedFeatures,
                'recent_conversations'  => $recentConvs,
                'daily_usage'           => $dailyUsage,
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin AI stats error', ['error' => $e->getMessage()]);
            return response()->json([
                'success'               => false,
                'total_conversations'   => 0,
                'total_messages'        => 0,
                'total_tokens_used'     => 0,
                'active_users_today'    => 0,
                'average_response_time' => null,
                'success_rate'          => null,
                'most_used_features'    => [],
                'recent_conversations'  => [],
                'daily_usage'           => [],
            ]);
        }
    }

    /**
     * Update AI settings for admin dashboard.
     *
     * [GAP-04 FIX] This endpoint is intentionally a no-op stub.
     * AI settings (model, temperature, etc.) are currently managed via .env
     * and config/services.php. A database-backed settings table would be needed
     * to persist admin changes. We now return an honest response instead of
     * silently pretending to save.
     */
    public function updateSettings(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('AIController@updateSettings called (stub — no persistence)', [
            'admin_id' => $request->user()?->id,
            'payload'  => array_keys($request->all()),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'إعدادات الذكاء الاصطناعي تُدار حالياً من إعدادات الخادم. سيتم دعم التعديل من لوحة التحكم قريباً.',
            'persisted' => false,
        ]);
    }

    // ===========================================================================
    // PRIVATE METHODS
    // ===========================================================================

    /**
     * [DRY-01] Delegate to AIService::call() — single prompt.
     * [QUALITY-07 FIX] Now forwards Auth::id() and $action so ai_request_logs
     * contain real user attribution instead of NULL for every row.
     */
    private function callOpenAI(string $prompt, bool $json = false, string $action = 'call'): string|array
    {
        return $this->aiService->call(
            $prompt,
            $json,
            action: $action,
            userId: (string) Auth::id() ?: null,
        );
    }

    /**
     * [DRY-01] Delegate to AIService::chat() — multi-turn conversation.
     * [QUALITY-07 FIX] Now forwards Auth::id() so chat logs are user-attributed.
     */
    private function callOpenAIChat(array $messages): string
    {
        $result = $this->aiService->chat(
            $messages,
            action: 'chat',
            userId: (string) Auth::id() ?: null,
        );
        return is_array($result) ? json_encode($result) : $result;
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

    private function buildChatMessages(AIConversation $conversation, ?array $templateContext = null, string $locale = 'ar'): array
    {
        // ── 1. Query live marketplace data safely ──────────────────────────────
        $catalogueText = '';
        $totalTemplates = 0;
        try {
            $sectionsData = cache()->remember('ai_sections_context', 600, function () {
                return Section::active()
                    ->ordered()
                    ->withCount(['templates' => fn($q) => $q->where('is_active', true)])
                    ->with(['templates' => function ($q) {
                        $q->where('is_active', true)
                          ->orderByDesc('sales_count')
                          ->limit(3)
                          ->select('id', 'name_ar', 'section_id', 'price', 'sales_count', 'slug');
                    }])
                    ->get(['id', 'name_ar', 'slug', 'description_ar']);
            });

            $totalTemplates = $sectionsData->sum('templates_count');
            $catalogueLines = [];
            foreach ($sectionsData as $section) {
                $count = $section->templates_count ?? 0;
                $catalogueLines[] = "• [{$section->name_ar}]({$count} template) — /marketplace?section={$section->slug}";
                foreach ($section->templates as $tpl) {
                    $price  = ($tpl->price > 0) ? "{$tpl->price} SAR" : 'Free';
                    $sales  = $tpl->sales_count ?? 0;
                    $catalogueLines[] = "    - {$tpl->name_ar} | {$price} | {$sales} sold | /marketplace/{$tpl->slug}";
                }
            }
            $catalogueText = implode("\n", $catalogueLines);
        } catch (\Throwable $e) {
            Log::warning('AI: failed to load sections catalogue', ['error' => $e->getMessage()]);
            $catalogueText = 'Store available at /marketplace';
        }

        // ── 2. Educational services map ─────────────────────────────────────────
        $servicesText = implode("\n", [
            '• خطط الدروس والتوزيعات (Lesson Plans) — /dashboard/distributions',
            '• السجلات والتقارير (Records & Plans) — /dashboard/plans',
            '• شهادات التقدير (Certificates) — /dashboard/certificates',
            '• سجل المتابعة اليومية (Follow-up Log) — /dashboard/follow-up-log',
            '• شواهد الأداء (Work Evidence) — /dashboard/work-evidence',
            '• الإنجازات والتوثيق (Achievements) — /dashboard/achievements',
            '• الإنتاج المعرفي (Knowledge Production) — /dashboard/knowledge-production',
            '• بنك الأسئلة (Question Bank) — /dashboard/question-bank',
            '• الاختبارات (Tests) — /dashboard/tests',
            '• أوراق العمل (Worksheets) — /dashboard/worksheets',
        ]);

        // ── 3. User context + Role detection ────────────────────────────────────
        $userContext = '';
        $isAdmin = false;
        $userName = '';
        try {
            $user = $conversation->user;
            if ($user) {
                $userName = $user->name ?? '';
                $isAdmin = (bool) ($user->is_admin ?? false) || ($user->role ?? '') === 'admin';

                $purchasedCount = \DB::table('user_libraries')
                    ->where('user_id', $user->id)
                    ->count();

                $roleName = $isAdmin ? 'مدير النظام (Admin)' : 'معلم/معلمة (Teacher)';
                $userContext = "\n\n=== معلومات المستخدم الحالي ===\nالاسم: {$user->name}\nالدور: {$roleName}\nالقوالب المشتراة: {$purchasedCount}";
            }
        } catch (\Throwable) {
            // Non-critical — skip user context if DB query fails
        }

        // ── 4. Role-based route access map ──────────────────────────────────────
        // This tells the AI exactly which pages the current user can access
        $userRoutes = implode("\n", [
            '• الصفحة الرئيسية — /',
            '• متجر القوالب — /marketplace',
            '• عن المنصة — /about',
            '• الخدمات — /services',
            '• تواصل معنا — /contact',
            '• لوحتي — /dashboard',
            '• المساعد الذكي — /dashboard/ai-assistant',
            '• مكتبتي — /my-library',
            '• قائمة الرغبات — /wishlist',
            '• طلباتي — /orders',
            '• الإعدادات — /settings',
        ]);

        $adminRoutes = '';
        if ($isAdmin) {
            $adminRoutes = "\n\n=== صفحات الإدارة (للمدير فقط) ===\n" . implode("\n", [
                '• لوحة الإدارة — /admin',
                '• إدارة القوالب — /admin/templates',
                '• إدارة الطلبات — /admin/orders',
                '• إدارة المستخدمين — /admin/users',
                '• التقارير — /admin/reports',
                '• إدارة الأقسام — /admin/sections',
                '• إدارة التصنيفات — /admin/categories',
                '• إدارة الذكاء الاصطناعي — /admin/ai-management',
                '• إعدادات النظام — /admin/settings',
            ]);
        }

        // ── 5. Locale-aware response instructions ───────────────────────────────
        $langInstruction = $locale === 'en'
            ? "\n\n=== LANGUAGE INSTRUCTION ===\nThe user's interface is in English. You MUST respond entirely in English. Use professional, friendly English."
            : "\n\n=== تعليمات اللغة ===\nواجهة المستخدم بالعربية. أجب بالعربية الفصحى دائماً بأسلوب ودي ومهني.";

        // ── 6. Anti-admin-leak guard (for non-admin users) ──────────────────────
        $routeGuard = $isAdmin
            ? ''
            : "\n\n⛔ تحذير أمني: هذا المستخدم ليس مديراً. يُمنع منعاً باتاً اقتراح أو إرسال أي رابط يبدأ بـ /admin — حتى لو طلب المستخدم ذلك. إذا سأل عن صفحات إدارية أخبره أنها غير متاحة لحسابه.";

        // ── 7. Compose system prompt ────────────────────────────────────────────
        $systemContent = <<<PROMPT
أنت مساعد ذكي متخصص لمنصة SERS - سوق السجلات التعليمية الذكية. اسمك "سيرس" وأنت **خبير حقيقي** بمحتوى المنصة.

=== مبادئ الإجابة الأساسية ===
1. أشر إلى القوالب والصفحات **الحقيقية فقط** من البيانات المتاحة أدناه.
2. لا تخترع قوالب أو صفحات غير موجودة — استخدم البيانات المُحقنة فقط.
3. كن مختصراً ومنظماً — لا تتجاوز 8 أسطر في الإجابة العادية.
4. إذا لم تعرف الإجابة، قل ذلك بصراحة واقترح التواصل مع الدعم.

=== قواعد تنسيق الردود (مهم جداً) ===
- عند اقتراح صفحة أو قسم، اكتب الرابط بنسق Markdown هكذا: [اسم الصفحة](/المسار)
  مثال: [متجر القوالب](/marketplace) أو [ملفات الإنجاز](/dashboard/achievements)
- استخدم **نص** للتأكيد على الكلمات المهمة.
- استخدم - في بداية السطر للقوائم.
- استخدم ## للعناوين الفرعية إذا كان الرد طويلاً.
- لا تكتب روابط كنص عادي أبداً — استخدم دائماً صيغة [النص](الرابط).

=== متجر SERS ({$totalTemplates} قالب) ===
{$catalogueText}

=== الخدمات التعليمية التفاعلية ===
{$servicesText}

=== الصفحات المتاحة لهذا المستخدم ===
{$userRoutes}{$adminRoutes}{$userContext}{$langInstruction}{$routeGuard}
PROMPT;

        // ── 8. Add open template context if any ─────────────────────────────────
        if (!empty($templateContext)) {
            $systemContent .= "\n\n=== سياق القالب المفتوح حالياً ===\n";
            if (!empty($templateContext['name_ar'])) {
                $systemContent .= "اسم القالب: {$templateContext['name_ar']}\n";
            }
            if (!empty($templateContext['description_ar'])) {
                $systemContent .= "وصف: {$templateContext['description_ar']}\n";
            }
            $systemContent .= "ركّز إجاباتك على هذا القالب تحديداً.";
        }

        // ── 9. Assemble message array (last 10 turns only) ──────────────────────
        $messages = [['role' => 'system', 'content' => $systemContent]];

        $recentMessages = collect($conversation->messages ?? [])
            ->filter(fn($m) => !empty($m['role']) && !empty($m['content']))
            ->reverse()->take(10)->reverse()->values();

        foreach ($recentMessages as $message) {
            $messages[] = ['role' => $message['role'], 'content' => $message['content']];
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
     * Smart template recommendations powered by AI (Groq + LLaMA 3.3).
     *
     * Receives the user's browsing context and candidate templates, asks
     * the AI to rank them intelligently, and returns ordered template IDs.
     */
    public function getRecommendations(Request $request)
    {
        $validated = $request->validate([
            'browsed_sections'   => 'nullable|array',
            'browsed_categories' => 'nullable|array',
            'recently_viewed'    => 'nullable|array',
            'candidates'         => 'nullable|array',
            'candidates.*.id'    => 'nullable|string',
            'candidates.*.name_ar' => 'nullable|string',
            'limit'              => 'nullable|integer|min:1|max:20',
            // Legacy fields kept for backward compatibility
            'subject' => 'nullable|string',
            'grade' => 'nullable|string',
            'recent_views' => 'nullable|array',
            'purchases' => 'nullable|array',
        ]);

        $limit      = $validated['limit'] ?? 4;
        $candidates = $validated['candidates'] ?? [];

        // If no candidates provided, fall back to legacy behavior
        if (empty($candidates)) {
            $prompt = $this->buildRecommendationsPrompt($validated);
            $response = $this->callOpenAI($prompt, true);
            return response()->json(['success' => true, 'data' => $response]);
        }

        // Build a compact catalog for the prompt
        $catalogLines = collect($candidates)->map(fn($c) =>
            "- ID: {$c['id']} | الاسم: " . ($c['name_ar'] ?? 'غير محدد')
        )->implode("\n");

        $browsingContext = '';
        if (!empty($validated['browsed_sections'])) {
            $browsingContext .= "الأقسام التي استعرضها المستخدم: " . implode('، ', $validated['browsed_sections']) . "\n";
        }
        if (!empty($validated['browsed_categories'])) {
            $browsingContext .= "الفئات التي استعرضها: " . implode('، ', $validated['browsed_categories']) . "\n";
        }
        if (!empty($validated['recently_viewed'])) {
            $count = count($validated['recently_viewed']);
            $browsingContext .= "شاهد {$count} قالباً مؤخراً.\n";
        }

        $prompt = <<<PROMPT
أنت محرك توصيات ذكي لمنصة قوالب تعليمية سعودية.

**سياق المستخدم (نشاطه الأخير):**
{$browsingContext}

**القوالب المتاحة للتوصية (لم يشاهدها بعد):**
{$catalogLines}

**مهمتك:**
اختر أفضل {$limit} قوالب لتوصيتها لهذا المستخدم بناءً على اهتماماته. راعِ:
- التنويع بين الأقسام المختلفة
- الملاءمة لاحتياجاته الواضحة من سياق تصفحه
- التنوع بدلاً من التكرار

**أعد فقط** JSON بهذا الشكل بدون أي شرح:
{"recommended_ids": ["id1", "id2", "id3", "id4"]}
PROMPT;

        try {
            $rawResponse = $this->callOpenAI($prompt, false);
            // Extract JSON from the response
            preg_match('/\{.*"recommended_ids".*\}/s', $rawResponse, $matches);
            $decoded = !empty($matches[0]) ? json_decode($matches[0], true) : null;
            $recommendedIds = $decoded['recommended_ids'] ?? [];

            // Validate returned IDs exist in candidates
            $validIds = collect($candidates)->pluck('id')->toArray();
            $filteredIds = array_values(array_filter(
                $recommendedIds,
                fn($id) => in_array($id, $validIds)
            ));

            return response()->json([
                'success' => true,
                'data'    => ['recommended_ids' => array_slice($filteredIds, 0, $limit)],
            ]);

        } catch (\Exception $e) {
            Log::error('Recommendations AI error', ['error' => $e->getMessage()]);
            // Fallback: return first N candidates
            $fallbackIds = collect($candidates)->take($limit)->pluck('id')->values()->toArray();
            return response()->json([
                'success' => true,
                'data'    => ['recommended_ids' => $fallbackIds],
            ]);
        }
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

    // ===========================================================================
    // CONTEXTUAL AI METHODS (previously missing — registered in routes)
    // ===========================================================================

    /**
     * Contextual field suggestion using dynamic prompts.
     */
    public function contextualSuggest(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|string',
            'field_name' => 'required|string',
            'user_input' => 'nullable|string',
            'service_type' => 'nullable|string',
            'locale' => 'nullable|string|in:ar,en',
            'current_values' => 'nullable|array',
        ]);

        $locale = $validated['locale'] ?? 'ar';
        $serviceType = $validated['service_type'] ?? 'general';

        // Build a contextual prompt
        $template = Template::find($validated['template_id']);

        $prompt = "أنت مساعد تعليمي ذكي متخصص في النظام التعليمي السعودي.\n";
        $prompt .= "السياق: {$serviceType}\n";

        if ($template) {
            $prompt .= "القالب: {$template->name_ar}\n";
            if ($template->description_ar) {
                $prompt .= "وصف القالب: {$template->description_ar}\n";
            }
        }

        $prompt .= "الحقل المطلوب: {$validated['field_name']}\n";

        if (!empty($validated['user_input'])) {
            $prompt .= "مدخل المستخدم: {$validated['user_input']}\n";
        }

        if (!empty($validated['current_values'])) {
            $prompt .= "القيم الحالية:\n";
            foreach ($validated['current_values'] as $key => $value) {
                if (!empty($value) && is_string($value)) {
                    $prompt .= "- {$key}: {$value}\n";
                }
            }
        }

        $prompt .= "\nاكتب اقتراحاً احترافياً ومناسباً للسياق التعليمي السعودي. أعط الإجابة مباشرة بدون مقدمات.";

        $response = $this->callOpenAI($prompt);

        return response()->json([
            'success' => true,
            'data' => [
                'suggestion' => $response,
                'field_name' => $validated['field_name'],
                'service_type' => $serviceType,
            ],
        ]);
    }

    /**
     * Bulk field suggestions for all AI-enabled fields in a template.
     */
    public function bulkSuggest(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|string',
            'current_values' => 'nullable|array',
            'title' => 'nullable|string',
        ]);

        $template = Template::with('fields')->find($validated['template_id']);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'القالب غير موجود',
            ], 404);
        }

        $aiFields = ($template->fields ?? collect())->filter(fn($f) => $f->ai_fillable ?? false);

        if ($aiFields->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => ['suggestions' => []],
            ]);
        }

        $fieldsList = $aiFields->map(fn($f) => "- {$f->name}: {$f->label_ar} (نوع: {$f->type})")->implode("\n");
        $title = $validated['title'] ?? $template->name_ar;
        $currentText = '';

        if (!empty($validated['current_values'])) {
            foreach ($validated['current_values'] as $key => $value) {
                if (!empty($value) && is_string($value)) {
                    $currentText .= "- {$key}: {$value}\n";
                }
            }
        }

        $prompt = <<<PROMPT
أنت مساعد تعليمي ذكي. ساعد المعلم في ملء حقول قالب "{$title}".

الحقول المطلوب ملؤها:
{$fieldsList}

{$currentText}

أكمل جميع الحقول بقيم مناسبة واحترافية. أرجع النتيجة كـ JSON object حيث المفتاح هو اسم الحقل والقيمة هي المحتوى المقترح.
PROMPT;

        $response = $this->callOpenAI($prompt, true);

        return response()->json([
            'success' => true,
            'data' => ['suggestions' => $response],
        ]);
    }

    /**
     * Analyze uploaded content (file metadata description).
     */
    public function analyzeContent(Request $request)
    {
        $validated = $request->validate([
            'content_type' => 'required|string',
            'file_name' => 'nullable|string',
            'description' => 'nullable|string|max:2000',
            'context' => 'nullable|string|max:500',
        ]);

        $prompt = "أنت محلل محتوى تعليمي متخصص.\n\n";
        $prompt .= "نوع المحتوى: {$validated['content_type']}\n";

        if (!empty($validated['file_name'])) {
            $prompt .= "اسم الملف: {$validated['file_name']}\n";
        }
        if (!empty($validated['description'])) {
            $prompt .= "الوصف: {$validated['description']}\n";
        }
        if (!empty($validated['context'])) {
            $prompt .= "السياق: {$validated['context']}\n";
        }

        $prompt .= "\nالمطلوب:\n";
        $prompt .= "1. وصف احترافي للمحتوى التعليمي\n";
        $prompt .= "2. تحديد القيمة التعليمية\n";
        $prompt .= "3. اقتراح الفئة المناسبة\n";
        $prompt .= "4. ربطه بالمعايير المهنية\n";
        $prompt .= "\nأجب بشكل مختصر ومهني.";

        $response = $this->callOpenAI($prompt);

        return response()->json([
            'success' => true,
            'data' => [
                'analysis' => $response,
                'content_type' => $validated['content_type'],
            ],
        ]);
    }

    /**
     * Global search across templates, sections, and services.
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        if (empty($query) || mb_strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => ['results' => []],
            ]);
        }

        $results = [];

        // Search templates
        try {
            $templates = Template::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('name_ar', 'LIKE', "%{$query}%")
                      ->orWhere('description_ar', 'LIKE', "%{$query}%");
                })
                ->limit(10)
                ->get(['id', 'name_ar', 'slug', 'price', 'section_id']);

            foreach ($templates as $template) {
                $results[] = [
                    'id' => $template->id,
                    'type' => 'template',
                    'title' => $template->name_ar,
                    'subtitle' => $template->name_ar,
                    'url' => "/marketplace/{$template->slug}",
                    'price' => $template->price,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Search: template query failed', ['error' => $e->getMessage()]);
        }

        // Search sections
        try {
            $sections = Section::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('name_ar', 'LIKE', "%{$query}%");
                })
                ->limit(5)
                ->get(['id', 'name_ar', 'slug']);

            foreach ($sections as $section) {
                $results[] = [
                    'id' => $section->id,
                    'type' => 'section',
                    'title' => $section->name_ar,
                    'subtitle' => $section->name_ar,
                    'url' => "/marketplace?section={$section->slug}",
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Search: section query failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'results' => $results,
                'query' => $query,
                'total' => count($results),
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════
    // [E-02] Async AI Job System
    // ═══════════════════════════════════════════════════════

    /**
     * Submit an AI request to the queue for async processing.
     *
     * POST /api/ai/async
     * Body: { prompt: string, json_mode?: bool }
     * Returns: { job_id: string }
     */
    public function asyncRequest(Request $request)
    {
        $validated = $request->validate([
            'prompt'    => 'required|string|max:10000',
            'json_mode' => 'sometimes|boolean',
        ]);

        $jobId = (string) \Illuminate\Support\Str::uuid();

        \Illuminate\Support\Facades\Cache::put("ai_job:{$jobId}:status", 'pending', 600);

        \App\Jobs\ProcessAIRequest::dispatch(
            $jobId,
            $validated['prompt'],
            $validated['json_mode'] ?? false,
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'job_id'  => $jobId,
                'message' => 'تم إرسال الطلب للمعالجة',
            ],
        ]);
    }

    /**
     * Poll for AI job status/result.
     *
     * GET /api/ai/jobs/{jobId}
     * Returns: { status, result?, error? }
     */
    public function jobStatus(string $jobId)
    {
        $cachePrefix = "ai_job:{$jobId}";
        $status = \Illuminate\Support\Facades\Cache::get("{$cachePrefix}:status");

        if (!$status) {
            return response()->json([
                'success' => false,
                'error'   => 'Job not found',
            ], 404);
        }

        $data = ['status' => $status];

        if ($status === 'completed') {
            $data['result'] = \Illuminate\Support\Facades\Cache::get("{$cachePrefix}:result");
        } elseif ($status === 'failed') {
            $data['error'] = \Illuminate\Support\Facades\Cache::get("{$cachePrefix}:error");
        }

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}

