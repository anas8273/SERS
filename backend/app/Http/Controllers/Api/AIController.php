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
            'template_id'         => 'nullable|string',
            'field_name'          => 'required|string',
            'title'               => 'nullable|string',
            'current_values'      => 'nullable|array',
            'field_label'         => 'nullable|string',
            'ai_hint'             => 'nullable|string',
            'locale'              => 'nullable|string|in:ar,en',
            // [ANTI-REPEAT] Sent by frontend on re-generate to force different output
            'previous_suggestion' => 'nullable|string|max:1500',
            'attempt'             => 'nullable|integer|min:1|max:10',
        ]);

        $locale  = $this->resolveLocale($request, $validated['locale'] ?? null);
        $attempt = (int) ($validated['attempt'] ?? 1);

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
            $validated['ai_hint'] ?? null,
            $locale,
            $validated['previous_suggestion'] ?? null,
            $attempt
        );

        // [ANTI-REPEAT] Boost temperature on each re-generate attempt (max +0.24)
        $baseTemp  = $this->resolveFieldTemperature($validated['field_name'], $validated['field_label'] ?? null);
        $fieldTemp = min(1.0, $baseTemp + ($attempt > 1 ? 0.08 * min($attempt - 1, 3) : 0));

        $systemMsg = $this->buildLocaleSystemMessage($locale, 'suggest');
        $response  = $this->callOpenAI($prompt, false, 'suggest', $fieldTemp, $systemMsg);

        return response()->json([
            'success' => true,
            'data' => [
                'suggestion' => $response,
                'field_name' => $validated['field_name'],
                'locale'     => $locale,
                'attempt'    => $attempt,
            ],
        ]);
    }

    /**
     * Fill all template fields using AI.
     */
    public function fillAll(Request $request)
    {
        $validated = $request->validate([
            'template_id'    => 'nullable|uuid',
            'title'          => 'required|string',
            'current_values' => 'nullable|array',
            'locale'         => 'nullable|string|in:ar,en',
        ]);

        $locale   = $this->resolveLocale($request, $validated['locale'] ?? null);
        $template = null;
        $fields   = [];

        if ($validated['template_id']) {
            $template = Template::with('fields')->find($validated['template_id']);
            $fields   = $template?->fields ?? [];
        }

        $prompt    = $this->buildFillAllPrompt(
            $validated['title'],
            $fields,
            $validated['current_values'] ?? [],
            $locale
        );

        $systemMsg = $this->buildLocaleSystemMessage($locale, 'fill-all');
        $response  = $this->callOpenAI($prompt, true, 'fill-all', 0.82, $systemMsg);

        return response()->json([
            'success' => true,
            'data' => [
                'suggestions' => $response,  // [FIX] frontend reads response.data.suggestions
                'values'      => $response,  // backward-compat alias
                'locale'      => $locale,
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
    /**
     * [LOCALE] Detect the user's active language:
     *  1. Explicit `locale` param from the request payload
     *  2. HTTP `Accept-Language` header (fr-FR → ignore, en-* → en, ar-* → ar)
     *  3. `locale` cookie (set by the frontend when the user toggles language)
     *  4. Fallback: 'ar' (Saudi-first default)
     */
    private function resolveLocale(\Illuminate\Http\Request $request, ?string $explicit): string
    {
        if ($explicit && in_array($explicit, ['ar', 'en'])) {
            return $explicit;
        }

        // Check cookie (frontend writes `locale=ar|en`)
        $cookie = $request->cookie('locale');
        if ($cookie && in_array($cookie, ['ar', 'en'])) {
            return $cookie;
        }

        // Check Accept-Language header
        $acceptLang = $request->header('Accept-Language', '');
        if (str_starts_with($acceptLang, 'en')) {
            return 'en';
        }

        return 'ar'; // Saudi-first default
    }

    /**
     * [LOCALE] Build a locale-aware system message that instructs the LLM
     * to respond exclusively in the user's active language.
     *
     * Using an explicit language directive in the system message is the most
     * reliable way to make modern LLMs honour the locale — more reliable than
     * embedding the instruction inside the user prompt.
     */
    private function buildLocaleSystemMessage(string $locale, string $task = 'general'): string
    {
        if ($locale === 'en') {
            $taskCtx = match ($task) {
                'suggest'   => 'You fill in a single educational form field with professional English content.',
                'fill-all'  => 'You fill all fields of an educational form with coherent, professional English content and return pure JSON.',
                'chat'      => 'You are a helpful educational assistant for the SERS platform.',
                default     => 'You are a professional educational content writer.',
            };
            return "You are an expert educational content specialist for SERS — a Saudi Arabian teacher platform.\n"
                 . "{$taskCtx}\n"
                 . "CRITICAL RULE: You MUST respond ENTIRELY in English. Do NOT include any Arabic text in your response.\n"
                 . "Your writing style: professional, formal, aligned with Saudi Ministry of Education standards.\n"
                 . "Do not add greetings or meta-commentary — content only.";
        }

        // Arabic (default)
        $taskCtx = match ($task) {
            'suggest'  => 'مهمتك ملء حقل واحد في نموذج تعليمي بمحتوى عربي احترافي.',
            'fill-all' => 'مهمتك ملء جميع حقول نموذج تعليمي بمحتوى متناسق واحترافي وإرجاع JSON نقي.',
            'chat'     => 'أنت مساعد تعليمي لمنصة SERS.',
            default    => 'أنت متخصص في كتابة المحتوى التعليمي الاحترافي.',
        };
        return "أنت متخصص في المحتوى التعليمي لمنصة SERS — السوق التعليمي السعودي للمعلمين.\n"
             . "{$taskCtx}\n"
             . "قاعدة حاسمة: يجب أن يكون ردك كاملاً باللغة العربية الفصحى. لا تكتب أي كلمة إنجليزية.\n"
             . "الأسلوب: عربية فصحى رسمية تناسب الوثائق التعليمية الرسمية في المملكة العربية السعودية.\n"
             . "لا تضف تحيات أو شروحات — المحتوى مباشرة.";
    }

    private function callOpenAI(
        string  $prompt,
        bool    $json        = false,
        string  $action      = 'call',
        float   $temperature = 0.75,
        ?string $systemMsg   = null
    ): string|array {
        return $this->aiService->call(
            $prompt,
            $json,
            systemMessage: $systemMsg ?? 'أنت مساعد تعليمي ذكي متخصص في مساعدة المعلمين والإداريين في المدارس.',
            temperature: $temperature,
            action: $action,
            userId: (string) Auth::id() ?: null,
        );
    }

    /**
     * [DRY-01] Delegate to AIService::chat() — multi-turn conversation.
     * [QUALITY-07 FIX] Now forwards Auth::id() so chat logs are user-attributed.
     * [AI-PRO] Uses higher temperature (0.85) for varied responses and 2500 max tokens.
     */
    private function callOpenAIChat(array $messages): string
    {
        $result = $this->aiService->chat(
            $messages,
            temperature: 0.85,
            maxTokens: 2500,
            action: 'chat',
            userId: (string) Auth::id() ?: null,
        );
        return is_array($result) ? json_encode($result) : $result;
    }

    /**
     * [AI-QUALITY] Build a rich, field-aware suggestion prompt.
     *
     * Key improvements over the old version:
     *  1. Expert persona that changes per field type — the AI "becomes" a different
     *     specialist for objectives vs activities vs evidence etc.
     *  2. Entropy seed (microsecond timestamp) injected as a hidden comment so the
     *     LLM never generates an identical response for the same inputs.
     *  3. Full current-values context passed — AI can reference sibling fields.
     *  4. Strict output rules — no greetings, no meta-commentary, content only.
     *  5. Quality bar — minimum 40 chars, no placeholder text like "اكتب هنا".
     */
    private function buildSuggestionPrompt(
        string    $fieldName,
        string    $title,
        array     $currentValues,
        ?Template $template,
        ?string   $fieldLabel          = null,
        ?string   $aiHint              = null,
        string    $locale              = 'ar',
        ?string   $previousSuggestion  = null,
        int       $attempt             = 1
    ): string {
        $isEn = ($locale === 'en');

        // ── 1. Identify field domain and get expert persona ───────────────────────
        $domain  = $this->detectFieldDomain($fieldName, $fieldLabel);
        $persona = $this->getExpertPersona($domain, $isEn);
        $example = $this->getDomainExample($domain, $title, $isEn);

        // ── 2. Template context ───────────────────────────────────────────────────
        $templateCtx = '';
        if ($template) {
            $name = $isEn
                ? ($template->name_en ?: $template->name_ar)
                : $template->name_ar;
            $desc = $isEn
                ? ($template->description_en ?: $template->description_ar)
                : $template->description_ar;
            $templateCtx = $isEn
                ? "Template type: {$name}" . ($desc ? " — {$desc}" : '')
                : "نوع القالب: {$name}" . ($desc ? " — {$desc}" : '');
            if ($template->relationLoaded('section') && $template->section) {
                $secName = $isEn
                    ? ($template->section->name_en ?: $template->section->name_ar)
                    : $template->section->name_ar;
                $templateCtx .= $isEn ? "\nSection: {$secName}" : "\nالقسم: {$secName}";
            }
        }

        // ── 3. Sibling fields context ─────────────────────────────────────────────
        $siblingCtx = '';
        $relevant = array_filter($currentValues, fn($v) => !empty($v) && is_string($v));
        if (!empty($relevant)) {
            $lines = [];
            foreach (array_slice($relevant, 0, 6) as $k => $v) {
                $lines[] = "  • {$k}: " . mb_substr($v, 0, 80);
            }
            $siblingCtx = $isEn
                ? "### Other field values (for coherence):\n" . implode("\n", $lines)
                : "### البيانات المدخلة في الحقول الأخرى (للتناسق):\n" . implode("\n", $lines);
        }

        // ── 4. Hint ───────────────────────────────────────────────────────────────
        $hintLine = '';
        if ($aiHint) {
            $hintLine = $isEn ? "Optional guidance: {$aiHint}" : "التوجيه الاختياري: {$aiHint}";
        }

        // ── 4b. FORBIDDEN block (anti-repeat on re-generate) ─────────────────────
        // The previous suggestion is shown to the LLM as a block it MUST NOT repeat.
        // This direct instruction is far more reliable than any hidden entropy trick.
        $forbiddenBlock = '';
        if ($previousSuggestion && mb_strlen(trim($previousSuggestion)) > 10) {
            $prevTrunc = mb_substr(trim($previousSuggestion), 0, 450);
            $forbiddenBlock = $isEn
                ? "### ⛔ FORBIDDEN — Do NOT reproduce this\n"
                  . "The text below was already generated. Write something **completely different** in structure, vocabulary, and approach:\n"
                  . "```\n{$prevTrunc}\n```\n"
                : "### ❌ محظور — لا تعيد إنتاج هذا المحتوى\n"
                  . "النص التالي تمّ توليده مسبقاً. اكتب محتوى **مختلفاً كلياً** في التركيب والمفردات والأسلوب:\n"
                  . "```\n{$prevTrunc}\n```\n";
        }

        // ── 5. Anti-repetition engine (angle directive + entropy token) ───────────

        //
        // Strategy: unlike a hidden HTML comment (which the LLM ignores), we inject
        // a *visible* variation token + a randomly-chosen "angle directive" that
        // changes the approach the model takes. This guarantees a different output
        // every time the user hits "Generate Again", even with identical inputs.
        //
        $entropy = bin2hex(random_bytes(4)); // 8-char hex, e.g. "a3f7b21c"

        $angles = $isEn ? [
            'Focus on the practical classroom application angle.',
            'Emphasize the measurable outcomes and success indicators.',
            'Highlight the professional development dimension.',
            'Approach this from a differentiated instruction perspective.',
            'Stress the alignment with the Saudi curriculum framework.',
            'Emphasize collaborative and cooperative learning aspects.',
            'Frame this from a leadership and professional excellence angle.',
            'Focus on evidence-based practices and documentation.',
        ] : [
            'ركّز على الجانب التطبيقي والعملي في بيئة الفصل الدراسي.',
            'ركّز على مؤشرات النجاح وآليات القياس القابلة للملاحظة.',
            'انطلق من زاوية التطوير المهني ومجتمعات التعلم.',
            'عالج الموضوع من منظور مراعاة الفروق الفردية واحتياجات الطلاب.',
            'برِر المضمون من خلال التوافق مع الإطار الوطني للمناهج السعودية.',
            'اجعل التعلم التعاوني والنشاط محور المحتوى.',
            'صغ الإجابة بأسلوب التميز والقيادة التربوية.',
            'استند إلى التوثيق المیداني والشواهد الفعلية.',
            'ابدأ بسياق التحدي ثم انتقل إلى الحلول والنتائج.',
            'ركّز على التغذية الراجعة والتحسين المستمر.',
        ];
        $angle = $angles[array_rand($angles)];

        // ── 6. Display label ──────────────────────────────────────────────────────
        $displayLabel = $fieldLabel ?: $fieldName;

        // ── 7. Compose prompt (bilingual) ─────────────────────────────────────────
        if ($isEn) {
            return <<<PROMPT
[VAR:{$entropy}] {$angle}
{$persona}

### Task Context
- Record title: "{$title}"
{$templateCtx}

### Field to Complete
Field key: `{$fieldName}`
Display label: **{$displayLabel}**
{$hintLine}

{$siblingCtx}

{$forbiddenBlock}
### Quality Example
{$example}

### Output Rules (strict)
1. Write the **field content directly** — no preambles, no explanations.
2. Do NOT start with "Of course", "Sure", "Here is" — start with the content.
3. Minimum 40 characters. No short placeholders like "Write here".
4. Style: formal professional English suitable for Saudi Ministry of Education documents.
5. Do NOT repeat any sentence already present in the field values above.
6. Apply the angle directive from the first line throughout your response.
PROMPT;
        }

        // Arabic prompt
        return <<<PROMPT
[تنويع:{$entropy}] {$angle}
{$persona}

### سياق المهمة
- اسم السجل التعليمي: «{$title}»
{$templateCtx}

### الحقل المطلوب ملؤه
اسم الحقل: `{$fieldName}`
التسمية الظاهرة للمستخدم: **{$displayLabel}**
{$hintLine}

{$siblingCtx}

{$forbiddenBlock}
### مثال على الجودة المطلوبة
{$example}

### قواعد الإخراج (التزم بها تماماً)
1. اكتب **محتوى الحقل مباشرة** — بلا مقدمات ولا شروحات.
2. لا تبدأ بـ «بالطبع» أو «يمكن» أو «اقتراح:» — ابدأ بالمحتوى الفعلي.
3. الحد الأدنى 40 حرفاً. لا تكتب عينات قصيرة مثل «اكتب هنا» أو «يحدد الطالب».
4. الأسلوب: عربية فصحى مهنية مناسبة للوثائق الرسمية في التعليم السعودي.
5. لا تكرر أي جملة موجودة بالفعل في البيانات المدخلة أعلاه.
6. طبّق توجيه التنويع من السطر الأول على كامل إجابتك.
PROMPT;
    }

    /**
     * [AI-QUALITY] Detect the semantic domain of a field from its name/label.
     * Returns a short domain key used to select persona + example.
     */
    private function detectFieldDomain(string $fieldName, ?string $fieldLabel): string
    {
        $haystack = mb_strtolower($fieldName . ' ' . ($fieldLabel ?? ''));

        $domains = [
            'objective'      => ['objective','هدف','أهداف','مخرجات','كفاية','كفاءة'],
            'activity'       => ['activity','نشاط','أنشطة','تدريب','تطبيق','ممارسة'],
            'assessment'     => ['assessment','تقييم','تقويم','قياس','اختبار','درجة'],
            'evidence'       => ['evidence','شاهد','شواهد','إنجاز','إنجازات','توثيق','موثق'],
            'recommendation' => ['recommendation','توصية','توصيات','مقترح','مقترحات'],
            'description'    => ['description','وصف','شرح','تفصيل','محتوى','content'],
            'note'           => ['note','ملاحظة','ملاحظات','تعليق','تعليقات'],
            'plan'           => ['plan','خطة','خطط','برنامج','منهج','توزيع'],
            'challenge'      => ['challenge','تحدي','تحديات','عقبة','صعوبة'],
            'strength'       => ['strength','قوة','نقاط قوة','إيجابيات','مميزات'],
            'summary'        => ['summary','ملخص','موجز','overview'],
        ];

        foreach ($domains as $domain => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($haystack, $kw)) {
                    return $domain;
                }
            }
        }
        return 'general';
    }

    /**
     * [AI-QUALITY] Return an expert persona string per domain.
     * The persona primes the LLM to respond as a domain specialist.
     */
    private function getExpertPersona(string $domain, bool $isEn = false): string
    {
        if ($isEn) {
            return match ($domain) {
                'objective'      => 'You are an **expert educational psychologist** specializing in writing learning objectives using Bloom\'s revised taxonomy. You use action verbs that are observable and measurable.',
                'activity'       => 'You are a **professional instructional designer** specializing in classroom and extracurricular activities. You promote active learning and address individual differences among students.',
                'assessment'     => 'You are a **measurement and evaluation expert** aligned with the Saudi Ministry of Education frameworks. You balance formative and summative assessment strategies.',
                'evidence'       => 'You are a **professional performance auditor** specializing in documenting teacher performance evidence. You write precisely and objectively, citing context and dates.',
                'recommendation' => 'You are an **educational consultant** delivering practical, evidence-based recommendations that can be implemented immediately.',
                'plan'           => 'You are a **curriculum planner** specializing in lesson and unit plans aligned with the Saudi National Curriculum Framework.',
                'challenge'      => 'You are an **educational analyst** describing field challenges accurately and proposing actionable solutions.',
                'strength'       => 'You are a **professional performance evaluator** who highlights strengths positively with specific evidence.',
                'summary'        => 'You are an **educational writer** who summarizes information concisely while preserving full meaning.',
                default          => 'You are a **professional educational content specialist** for the SERS Saudi platform. You write content suitable for official educational documents.',
            };
        }

        return match ($domain) {
            'objective'      => 'أنت **خبير تربوي** متخصص في صياغة الأهداف التعليمية وفق تصنيف بلوم المحدّث. تستخدم أفعالاً إجرائية قابلة للملاحظة والقياس.',
            'activity'       => 'أنت **مصمم تعليمي** متخصص في تصميم الأنشطة الصفية واللاصفية. تراعي التعلم النشط والفروق الفردية بين الطلاب.',
            'assessment'     => 'أنت **متخصص في القياس والتقويم التربوي** وفق مرجعية وزارة التعليم السعودية. تجمع بين التقويم التكويني والختامي.',
            'evidence'       => 'أنت **مدقق أداء تربوي** متخصص في توثيق شواهد الأداء المهني للمعلمين. تكتب بدقة وموضوعية مع ذكر السياق والتاريخ.',
            'recommendation' => 'أنت **مستشار تربوي** تقدم توصيات عملية وقابلة للتنفيذ مبنية على الأدلة والبيانات.',
            'plan'           => 'أنت **مخطط منهجي** متخصص في وضع الخطط التدريسية وفق الإطار الوطني للمناهج في المملكة العربية السعودية.',
            'challenge'      => 'أنت **محلل تربوي** تصف التحديات الميدانية بدقة وتقترح مسارات للتغلب عليها.',
            'strength'       => 'أنت **مقيّم أداء مهني** تُبرز نقاط القوة بأسلوب إيجابي ومحدد يستند إلى أدلة واقعية.',
            'summary'        => 'أنت **كاتب تربوي** تلخّص المعلومات بدقة واختصار مع الحفاظ على المعنى الكامل.',
            default          => 'أنت **مساعد تعليمي متخصص** لمنصة SERS السعودية. تكتب محتوى احترافياً يناسب الوثائق الرسمية في البيئة التعليمية السعودية.',
        };
    }

    private function getDomainExample(string $domain, string $title, bool $isEn = false): string
    {
        $titleSnippet = mb_substr($title, 0, 30) ?: ($isEn ? 'the educational record' : 'السجل التعليمي');

        if ($isEn) {
            return match ($domain) {
                'objective'      => "Quality example:\n\u00bb The student will analyze the concept of {$titleSnippet} through three real-world examples and identify relationships between its core components with at least 80% accuracy.",
                'activity'       => "Quality example:\n\u00bb Cooperative activity: Students are divided into groups of four to discuss {$titleSnippet}, then each group's representative presents a two-minute summary.",
                'assessment'     => "Quality example:\n\u00bb Students are assessed via: (1) a 10-question quiz after the lesson, (2) cooperative activity observation, (3) a homework assignment due in two days.",
                'evidence'       => "Quality example:\n\u00bb Delivered a model lesson on {$titleSnippet} on 12/08/1446H before the educational supervision committee, receiving an Excellent rating with a recommendation to share the approach.",
                'recommendation' => "Quality example:\n\u00bb It is recommended to allocate one additional weekly session for {$titleSnippet}, measure the impact over one month, and document results in the monthly follow-up log.",
                'plan'           => "Quality example:\n\u00bb Week 1: Review core concepts and build readiness for {$titleSnippet}. Week 2: Apply inquiry-based learning. Week 3: Summative assessment and feedback.",
                default          => "Quality example:\n\u00bb Write clear, specific content related to {$titleSnippet} in a professional style suitable for official educational documents.",
            };
        }

        return match ($domain) {
            'objective'      => "مثال على الجودة:\n\u00bb أن يحلل الطالب مفهوم {$titleSnippet} من خلال ثلاثة أمثلة واقعية، ويستنتج العلاقة بين مكوناته الأساسية بدقة لا تقل عن 80%.",
            'activity'       => "مثال على الجودة:\n\u00bb نشاط تعاوني: يُقسَّم الطلاب إلى مجموعات رباعية لمناقشة {$titleSnippet}، ثم يقدم مقرر كل مجموعة ملخصاً أمام الفصل في دقيقتين.",
            'assessment'     => "مثال على الجودة:\n\u00bb يُقيَّم الطلاب من خلال: (1) اختبار قصير 10 أسئلة بعد الدرس، (2) ملاحظة أداء النشاط التعاوني، (3) تكليف منزلي يُسلَّم بعد يومين.",
            'evidence'       => "مثال على الجودة:\n\u00bb تنفيذ درس نموذجي بتاريخ 1446/08/12هـ في {$titleSnippet} أمام لجنة الإشراف التربوي، وحصل على تقدير ممتاز مع توصية بتعميم الأسلوب.",
            'recommendation' => "مثال على الجودة:\n\u00bb يُوصى بتخصيص حصة أسبوعية إضافية لـ{$titleSnippet} مع قياس الأثر خلال شهر، وتوثيق النتائج في سجل المتابعة الشهرية.",
            'plan'           => "مثال على الجودة:\n\u00bb الأسبوع الأول: مراجعة المفاهيم الأساسية وبناء التهيئة لـ{$titleSnippet}. الأسبوع الثاني: تطبيق استراتيجية التعلم بالاستقصاء. الأسبوع الثالث: تقييم ختامي وتغذية راجعة.",
            default          => "مثال على الجودة:\n\u00bb اكتب محتوى واضحاً ومحدداً يتعلق بـ{$titleSnippet} بأسلوب مهني يناسب الوثائق التعليمية الرسمية.",
        };
    }

    /**
     * [AI-QUALITY] Higher temperature → more diverse responses for creative fields;
     * lower temperature → consistent precision for structured fields like assessments.
     */
    private function resolveFieldTemperature(string $fieldName, ?string $fieldLabel): float
    {
        $domain = $this->detectFieldDomain($fieldName, $fieldLabel);
        return match ($domain) {
            'objective', 'assessment' => 0.70, // Precision fields
            'evidence', 'plan'        => 0.75,
            'activity', 'strength'   => 0.90, // Creative fields
            'recommendation'         => 0.85,
            default                  => 0.82,
        };
    }

    /**
     * [AI-QUALITY] Rich fill-all prompt that:
     *  - Provides the full list of fields with labels (not just names)
     *  - Tells the AI the exact JSON schema expected
     *  - Instructs the AI to maintain cross-field coherence
     *  - Uses entropy to avoid repeated batches
     */
    private function buildFillAllPrompt(string $title, $fields, array $currentValues): string
    {
        $entropy = substr(microtime(), 2, 6);

        // Build field list with labels for richer context
        $fieldList = '';
        $fieldNames = [];
        if (!empty($fields)) {
            foreach ($fields as $field) {
                $label = $field->label_ar ?? $field->label ?? $field->name;
                $fieldList .= "  - {$field->name} (التسمية: {$label})\n";
                $fieldNames[] = $field->name;
            }
        }

        // Existing values (skip empty)
        $existingLines = '';
        foreach ($currentValues as $k => $v) {
            if (!empty($v)) {
                $existingLines .= "  - {$k}: " . mb_substr((string)$v, 0, 100) . "\n";
            }
        }

        $jsonKeys = !empty($fieldNames)
            ? '"' . implode('", "', $fieldNames) . '"'
            : '"field_name"';

        return <<<PROMPT
<!--ref:{$entropy}-->
أنت مساعد تعليمي متخصص لمنصة SERS. مهمتك ملء جميع حقول نموذج تعليمي سعودي باحترافية وتناسق.

## اسم النموذج
«{$title}»

## الحقول المطلوبة
{$fieldList}
## القيم المدخلة مسبقاً (لا تعيد كتابتها — استخدمها للتناسق)
{$existingLines}
## تعليمات الإخراج
- أرجع **JSON فقط** — لا نص خارج الـ JSON إطلاقاً.
- الهيكل المطلوب: `{{"fieldName": "المحتوى المقترح", ...}}`
- المفاتيح المطلوبة: {$jsonKeys}
- لكل حقل: اكتب محتوى أصيلاً واحترافياً (40+ حرف) مناسباً لسياق السجل التعليمي.
- لا تستخدم عبارات عامة مثل «اكتب هنا» أو «يتم تحديده لاحقاً».
- حافظ على التناسق بين الحقول — المحتوى يجب أن يكوّن وثيقة متكاملة.
- الأسلوب: عربية فصحى رسمية مناسبة للوثائق التعليمية السعودية.
PROMPT;
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
        $isEn = ($locale === 'en');
        $entropy = bin2hex(random_bytes(4)); // Anti-repetition token

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
                          ->select('id', 'name_ar', 'name_en', 'section_id', 'price', 'sales_count', 'slug');
                    }])
                    ->get(['id', 'name_ar', 'name_en', 'slug', 'description_ar', 'description_en']);
            });

            $totalTemplates = $sectionsData->sum('templates_count');
            $catalogueLines = [];
            foreach ($sectionsData as $section) {
                $count = $section->templates_count ?? 0;
                $secName = $isEn ? ($section->name_en ?: $section->name_ar) : $section->name_ar;
                $catalogueLines[] = "• [{$secName}](/marketplace?section={$section->slug}) — {$count} " . ($isEn ? 'templates' : 'قالب');
                foreach ($section->templates as $tpl) {
                    $tplName = $isEn ? ($tpl->name_en ?: $tpl->name_ar) : $tpl->name_ar;
                    $price  = ($tpl->price > 0) ? "{$tpl->price} " . ($isEn ? 'SAR' : 'ريال') : ($isEn ? 'Free' : 'مجاني');
                    $sales  = $tpl->sales_count ?? 0;
                    $salesLabel = $isEn ? "{$sales} sold" : "{$sales} مبيعة";
                    $catalogueLines[] = "    - [{$tplName}](/marketplace/{$tpl->slug}) | {$price} | {$salesLabel}";
                }
            }
            $catalogueText = implode("\n", $catalogueLines);
        } catch (\Throwable $e) {
            Log::warning('AI: failed to load sections catalogue', ['error' => $e->getMessage()]);
            $catalogueText = $isEn ? 'Store available at [Marketplace](/marketplace)' : 'المتجر متاح في [متجر القوالب](/marketplace)';
        }

        // ── 2. Educational services map (bilingual) ─────────────────────────────
        $servicesText = $isEn
            ? implode("\n", [
                '• [Curriculum Distribution](/dashboard/distributions) — Weekly/semester lesson plans',
                '• [Plans & Records](/dashboard/plans) — Teaching plans and records',
                '• [Certificates](/dashboard/certificates) — Appreciation certificates',
                '• [Follow-up Log](/dashboard/follow-up-log) — Daily student tracking',
                '• [Work Evidence](/dashboard/work-evidence) — Performance evidence documentation',
                '• [Achievements](/dashboard/achievements) — Professional achievement portfolio',
                '• [Knowledge Production](/dashboard/knowledge-production) — Research & publications',
                '• [Question Bank](/dashboard/question-bank) — Exam question database',
                '• [Tests](/dashboard/tests) — Test creation and management',
                '• [Worksheets](/dashboard/worksheets) — Interactive worksheets',
            ])
            : implode("\n", [
                '• [توزيعات المنهج](/dashboard/distributions) — توزيعات أسبوعية وفصلية',
                '• [الخطط والسجلات](/dashboard/plans) — خطط التدريس والسجلات',
                '• [الشهادات](/dashboard/certificates) — شهادات التقدير الاحترافية',
                '• [سجل المتابعة](/dashboard/follow-up-log) — متابعة الطلاب اليومية',
                '• [شواهد الأداء](/dashboard/work-evidence) — توثيق الأداء الوظيفي',
                '• [الإنجازات](/dashboard/achievements) — ملف الإنجاز المهني',
                '• [الإنتاج المعرفي](/dashboard/knowledge-production) — الأبحاث والمقالات',
                '• [بنك الأسئلة](/dashboard/question-bank) — قاعدة أسئلة الاختبارات',
                '• [الاختبارات](/dashboard/tests) — إنشاء وإدارة الاختبارات',
                '• [أوراق العمل](/dashboard/worksheets) — أوراق عمل تفاعلية',
            ]);

        // ── 3. Real platform statistics ──────────────────────────────────────────
        $platformStats = '';
        try {
            $statsData = cache()->remember('ai_platform_stats', 300, function () {
                $totalUsers = \DB::table('users')->count();
                $totalOrders = \DB::table('orders')->where('status', 'completed')->count();
                $totalRevenue = (float) \DB::table('orders')->where('status', 'completed')->sum('total');
                $newUsersMonth = \DB::table('users')->where('created_at', '>=', now()->startOfMonth())->count();
                $ordersToday = \DB::table('orders')->whereDate('created_at', today())->count();

                return compact('totalUsers', 'totalOrders', 'totalRevenue', 'newUsersMonth', 'ordersToday');
            });

            if ($isEn) {
                $platformStats = "\n\n=== LIVE PLATFORM STATISTICS ===\n"
                    . "Total users: {$statsData['totalUsers']}\n"
                    . "Total completed orders: {$statsData['totalOrders']}\n"
                    . "Total revenue: " . number_format($statsData['totalRevenue'], 0) . " SAR\n"
                    . "New users this month: {$statsData['newUsersMonth']}\n"
                    . "Orders today: {$statsData['ordersToday']}\n"
                    . "Total templates: {$totalTemplates}\n"
                    . "USE these real numbers when answering questions about the platform.";
            } else {
                $platformStats = "\n\n=== إحصائيات المنصة الحقيقية (محدّثة) ===\n"
                    . "عدد المستخدمين: {$statsData['totalUsers']}\n"
                    . "الطلبات المكتملة: {$statsData['totalOrders']}\n"
                    . "إجمالي الإيرادات: " . number_format($statsData['totalRevenue'], 0) . " ريال\n"
                    . "المستخدمون الجدد هذا الشهر: {$statsData['newUsersMonth']}\n"
                    . "طلبات اليوم: {$statsData['ordersToday']}\n"
                    . "عدد القوالب: {$totalTemplates}\n"
                    . "استخدم هذه الأرقام الحقيقية عند الإجابة عن أسئلة المنصة.";
            }
        } catch (\Throwable $e) {
            Log::warning('AI: failed to load platform stats', ['error' => $e->getMessage()]);
        }

        // ── 4. User context + Role detection + Behavior ─────────────────────────
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

                $ordersCount = \DB::table('orders')
                    ->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->count();

                $lastOrder = \DB::table('orders')
                    ->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->latest()
                    ->first();

                $lastOrderInfo = '';
                if ($lastOrder) {
                    $lastOrderDate = \Carbon\Carbon::parse($lastOrder->created_at)->diffForHumans();
                    $lastOrderInfo = $isEn
                        ? "Last purchase: {$lastOrderDate}"
                        : "آخر عملية شراء: {$lastOrderDate}";
                }

                $joinDate = $user->created_at
                    ? \Carbon\Carbon::parse($user->created_at)->diffForHumans()
                    : '';

                if ($isEn) {
                    $roleName = $isAdmin ? 'System Administrator' : 'Teacher';
                    $userContext = "\n\n=== CURRENT USER PROFILE ===\n"
                        . "Name: {$user->name}\n"
                        . "Role: {$roleName}\n"
                        . "Templates owned: {$purchasedCount}\n"
                        . "Completed orders: {$ordersCount}\n"
                        . ($lastOrderInfo ? "{$lastOrderInfo}\n" : '')
                        . ($joinDate ? "Member since: {$joinDate}\n" : '')
                        . "Use this info to personalize your responses.";
                } else {
                    $roleName = $isAdmin ? 'مدير النظام' : 'معلم/معلمة';
                    $userContext = "\n\n=== ملف المستخدم الحالي ===\n"
                        . "الاسم: {$user->name}\n"
                        . "الدور: {$roleName}\n"
                        . "القوالب المكتسبة: {$purchasedCount}\n"
                        . "الطلبات المكتملة: {$ordersCount}\n"
                        . ($lastOrderInfo ? "{$lastOrderInfo}\n" : '')
                        . ($joinDate ? "عضو منذ: {$joinDate}\n" : '')
                        . "استخدم هذه المعلومات لتخصيص ردودك.";
                }
            }
        } catch (\Throwable) {
            // Non-critical — skip user context if DB query fails
        }

        // ── 5. Role-based route access map (bilingual) ──────────────────────────
        $userRoutes = $isEn
            ? implode("\n", [
                '• [Home](/) — Main landing page',
                '• [Template Store](/marketplace) — Browse and buy templates',
                '• [About](/about) — About the platform',
                '• [Services](/services) — Educational services',
                '• [Contact Us](/contact) — Support and feedback',
                '• [My Dashboard](/dashboard) — Personal workspace',
                '• [AI Assistant](/dashboard/ai-assistant) — Smart assistant',
                '• [My Library](/my-library) — Purchased templates',
                '• [Wishlist](/wishlist) — Saved templates',
                '• [My Orders](/orders) — Order history',
                '• [Settings](/settings) — Account settings',
            ])
            : implode("\n", [
                '• [الصفحة الرئيسية](/) — واجهة المنصة',
                '• [متجر القوالب](/marketplace) — تصفح وشراء القوالب',
                '• [عن المنصة](/about) — معلومات عن SERS',
                '• [الخدمات](/services) — الخدمات التعليمية',
                '• [تواصل معنا](/contact) — الدعم والملاحظات',
                '• [لوحتي](/dashboard) — مساحة العمل الشخصية',
                '• [المساعد الذكي](/dashboard/ai-assistant) — المحادثة الذكية',
                '• [مكتبتي](/my-library) — القوالب المشتراة',
                '• [قائمة الرغبات](/wishlist) — القوالب المحفوظة',
                '• [طلباتي](/orders) — سجل الطلبات',
                '• [الإعدادات](/settings) — إعدادات الحساب',
            ]);

        $adminRoutes = '';
        if ($isAdmin) {
            $adminRoutes = $isEn
                ? "\n\n=== ADMIN PAGES (Admin only) ===\n" . implode("\n", [
                    '• [Admin Dashboard](/admin) — System overview',
                    '• [Manage Templates](/admin/templates) — Template CRUD',
                    '• [Manage Orders](/admin/orders) — Order processing',
                    '• [Manage Users](/admin/users) — User management',
                    '• [Reports](/admin/reports) — Analytics and reports',
                    '• [Manage Sections](/admin/sections) — Store sections',
                    '• [Manage Categories](/admin/categories) — Categories',
                    '• [AI Management](/admin/ai-management) — AI settings',
                    '• [System Settings](/admin/settings) — Platform config',
                ])
                : "\n\n=== صفحات الإدارة (للمدير فقط) ===\n" . implode("\n", [
                    '• [لوحة الإدارة](/admin) — نظرة عامة على النظام',
                    '• [إدارة القوالب](/admin/templates) — إضافة وتعديل القوالب',
                    '• [إدارة الطلبات](/admin/orders) — معالجة الطلبات',
                    '• [إدارة المستخدمين](/admin/users) — إدارة الحسابات',
                    '• [التقارير](/admin/reports) — التحليلات والتقارير',
                    '• [إدارة الأقسام](/admin/sections) — أقسام المتجر',
                    '• [إدارة التصنيفات](/admin/categories) — التصنيفات',
                    '• [إدارة الذكاء الاصطناعي](/admin/ai-management) — إعدادات AI',
                    '• [إعدادات النظام](/admin/settings) — إعدادات المنصة',
                ]);
        }

        // ── 6. Anti-admin-leak guard ────────────────────────────────────────────
        $routeGuard = $isAdmin
            ? ''
            : ($isEn
                ? "\n\n⛔ SECURITY: This user is NOT an admin. NEVER suggest any /admin/* links even if asked."
                : "\n\n⛔ تحذير أمني: هذا المستخدم ليس مديراً. يُمنع منعاً باتاً اقتراح أي رابط /admin حتى لو طلب.");

        // ── 7. Compose system prompt (bilingual) ────────────────────────────────
        if ($isEn) {
            $systemContent = <<<PROMPT
[SEED:{$entropy}]
You are "SERS AI" — the intelligent assistant for the SERS platform (Smart Educational Records Store), a Saudi Arabian educational marketplace for teachers.

=== CORE RULES ===
1. You MUST respond ENTIRELY in English. No Arabic text at all.
2. ONLY answer questions related to:
   - The SERS platform features, pages, templates, and services
   - Saudi education system (curriculum, teaching, lesson planning)
   - Educational content creation and professional development
3. If asked about unrelated topics (cooking, sports, politics, etc.), politely decline:
   "I'm specialized in SERS platform and Saudi education. How can I help you with your teaching needs?"
4. Use ONLY real data provided below — never invent templates, pages, or statistics.
5. When mentioning a page, ALWAYS use markdown link format: [Page Name](/path)
6. Keep responses concise: max 10 lines for standard answers, up to 15 for detailed analysis.

=== RESPONSE FORMATTING (STRICT) ===
- Use ## for section headings when response has multiple parts
- Use **bold** for key numbers and important terms
- Use - for bullet lists (keep each bullet to 1-2 lines)
- Always write links as [Link Text](/path) — NEVER write raw URLs
- Add a blank line between sections for readability
- When presenting statistics, highlight them with **bold**
- Each response must be UNIQUE — vary your structure, wording, and examples

=== SERS TEMPLATE STORE ({$totalTemplates} templates) ===
{$catalogueText}

=== EDUCATIONAL SERVICES ===
{$servicesText}

=== AVAILABLE PAGES ===
{$userRoutes}{$adminRoutes}{$platformStats}{$userContext}{$routeGuard}
PROMPT;
        } else {
            $systemContent = <<<PROMPT
[بذرة:{$entropy}]
أنت "سيرس AI" — المساعد الذكي لمنصة SERS (سوق السجلات التعليمية الذكية)، سوق إلكتروني سعودي يخدم المعلمين والمعلمات.

=== القواعد الأساسية ===
1. أجب بالعربية الفصحى فقط بأسلوب مهني وودّي.
2. أجب فقط عن الأسئلة المتعلقة بـ:
   - منصة SERS: الميزات، الصفحات، القوالب، والخدمات
   - التعليم السعودي: المناهج، التحضير، التخطيط
   - إنشاء المحتوى التعليمي والتطوير المهني
3. إذا سُئلت عن مواضيع غير ذات صلة (طبخ، رياضة، سياسة، إلخ)، ارفض بلطف:
   "أنا متخصص في منصة SERS والتعليم السعودي. كيف يمكنني مساعدتك في احتياجاتك التعليمية؟"
4. لا تخترع قوالب أو صفحات — استخدم البيانات الحقيقية أدناه فقط.
5. عند ذكر صفحة، استخدم دائماً صيغة Markdown: [اسم الصفحة](/المسار)
6. اجعل الرد مختصراً: حد أقصى 10 أسطر للإجابات العادية، و15 للتحليلات.

=== تنسيق الردود (مهم جداً — التزم تماماً) ===
- استخدم ## للعناوين عندما يكون الرد متعدد الأقسام
- استخدم **نص** للأرقام المهمة والمصطلحات الرئيسية
- استخدم - لقوائم النقاط (كل نقطة سطر أو سطرين فقط)
- اكتب الروابط دائماً بصيغة [النص](/المسار) — ممنوع كتابة روابط عادية
- اترك سطراً فارغاً بين الأقسام لسهولة القراءة
- عند عرض إحصائيات، أبرزها بـ **خط عريض**
- كل رد يجب أن يكون فريداً — نوّع في الأسلوب والأمثلة والتركيب

=== متجر SERS ({$totalTemplates} قالب) ===
{$catalogueText}

=== الخدمات التعليمية ===
{$servicesText}

=== الصفحات المتاحة ===
{$userRoutes}{$adminRoutes}{$platformStats}{$userContext}{$routeGuard}
PROMPT;
        }

        // ── 8. Add open template context if any ─────────────────────────────────
        if (!empty($templateContext)) {
            if ($isEn) {
                $systemContent .= "\n\n=== CURRENTLY OPEN TEMPLATE ===\n";
                if (!empty($templateContext['name_ar'])) {
                    $systemContent .= "Template name: {$templateContext['name_ar']}\n";
                }
                if (!empty($templateContext['description_ar'])) {
                    $systemContent .= "Description: {$templateContext['description_ar']}\n";
                }
                $systemContent .= "Focus your answers on this specific template.";
            } else {
                $systemContent .= "\n\n=== سياق القالب المفتوح حالياً ===\n";
                if (!empty($templateContext['name_ar'])) {
                    $systemContent .= "اسم القالب: {$templateContext['name_ar']}\n";
                }
                if (!empty($templateContext['description_ar'])) {
                    $systemContent .= "وصف: {$templateContext['description_ar']}\n";
                }
                $systemContent .= "ركّز إجاباتك على هذا القالب تحديداً.";
            }
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

