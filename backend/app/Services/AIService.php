<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AIService
{
    protected $apiKey;
    protected $baseUrl;
    protected $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->baseUrl = config('services.openai.base_url', 'https://api.openai.com/v1');
        $this->model = config('services.openai.model', 'gpt-4.1-mini');
    }

    /**
     * Send a chat completion request to the AI
     */
    public function chat(array $messages, array $options = []): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post($this->baseUrl . '/chat/completions', [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'temperature' => $options['temperature'] ?? 0.7,
                'max_tokens' => $options['max_tokens'] ?? 2000,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'content' => $data['choices'][0]['message']['content'] ?? '',
                    'usage' => $data['usage'] ?? [],
                ];
            }

            Log::error('AI API Error', ['response' => $response->json()]);
            return [
                'success' => false,
                'error' => 'فشل في الاتصال بخدمة الذكاء الاصطناعي',
            ];
        } catch (\Exception $e) {
            Log::error('AI Service Exception', ['message' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'حدث خطأ غير متوقع: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Generate a therapeutic plan for students
     */
    public function generateTherapeuticPlan(array $data): array
    {
        $prompt = $this->buildTherapeuticPlanPrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت مساعد تعليمي متخصص في إعداد الخطط العلاجية للطلاب. قم بإنشاء خطة علاجية شاملة ومفصلة باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 3000]);
    }

    /**
     * Generate an enrichment plan for students
     */
    public function generateEnrichmentPlan(array $data): array
    {
        $prompt = $this->buildEnrichmentPlanPrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت مساعد تعليمي متخصص في إعداد الخطط الإثرائية للطلاب المتفوقين. قم بإنشاء خطة إثرائية شاملة ومفصلة باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 3000]);
    }

    /**
     * Analyze test results and provide insights
     */
    public function analyzeTestResults(array $data): array
    {
        $prompt = $this->buildTestAnalysisPrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت محلل بيانات تعليمي متخصص. قم بتحليل نتائج الاختبار وتقديم رؤى وتوصيات مفصلة باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 2500]);
    }

    /**
     * Generate a performance report
     */
    public function generatePerformanceReport(array $data): array
    {
        $prompt = $this->buildPerformanceReportPrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت كاتب تقارير تعليمية محترف. قم بإنشاء تقرير أداء شامل ومهني باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 2500]);
    }

    /**
     * Generate certificate content
     */
    public function generateCertificateContent(array $data): array
    {
        $prompt = $this->buildCertificatePrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت كاتب محتوى متخصص في صياغة الشهادات والتقديرات. قم بإنشاء نص شهادة احترافي ومؤثر باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 500]);
    }

    /**
     * Get template recommendations based on user activity
     */
    public function getRecommendations(array $userActivity): array
    {
        $cacheKey = 'ai_recommendations_' . md5(json_encode($userActivity));
        
        return Cache::remember($cacheKey, 3600, function () use ($userActivity) {
            $prompt = $this->buildRecommendationsPrompt($userActivity);
            
            $messages = [
                [
                    'role' => 'system',
                    'content' => 'أنت نظام توصيات ذكي للمعلمين. قم بتحليل نشاط المستخدم واقتراح القوالب والخدمات المناسبة. أجب بصيغة JSON فقط.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ];

            $response = $this->chat($messages, ['temperature' => 0.5]);
            
            if ($response['success']) {
                try {
                    $content = $response['content'];
                    // Extract JSON from response
                    preg_match('/\{[\s\S]*\}/', $content, $matches);
                    if (!empty($matches[0])) {
                        return json_decode($matches[0], true) ?? [];
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to parse recommendations', ['error' => $e->getMessage()]);
                }
            }
            
            return [];
        });
    }

    /**
     * Interactive chat with educational assistant
     */
    public function educationalChat(string $message, array $context = []): array
    {
        $systemPrompt = $this->buildEducationalSystemPrompt($context);
        
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];

        // Add conversation history if available
        if (!empty($context['history'])) {
            foreach ($context['history'] as $msg) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content']
                ];
            }
        }

        $messages[] = [
            'role' => 'user',
            'content' => $message
        ];

        return $this->chat($messages, ['max_tokens' => 1500]);
    }

    /**
     * Generate achievement documentation
     */
    public function generateAchievementDoc(array $data): array
    {
        $prompt = $this->buildAchievementPrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت كاتب توثيق إنجازات تعليمية. قم بتوثيق الإنجاز بشكل احترافي ومفصل باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 1000]);
    }

    /**
     * Generate curriculum distribution
     */
    public function generateCurriculumDistribution(array $data): array
    {
        $prompt = $this->buildCurriculumPrompt($data);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'أنت متخصص في توزيع المناهج الدراسية. قم بإنشاء توزيع منهج شامل ومنظم باللغة العربية.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        return $this->chat($messages, ['max_tokens' => 3000]);
    }

    // ==================== Private Helper Methods ====================

    private function buildTherapeuticPlanPrompt(array $data): string
    {
        $studentName = $data['student_name'] ?? 'الطالب';
        $subject = $data['subject'] ?? 'غير محدد';
        $grade = $data['grade'] ?? 'غير محدد';
        $weaknesses = $data['weaknesses'] ?? [];
        $currentLevel = $data['current_level'] ?? 'متوسط';
        $duration = $data['duration'] ?? '4 أسابيع';

        $weaknessesText = is_array($weaknesses) ? implode('، ', $weaknesses) : $weaknesses;

        return <<<PROMPT
أنشئ خطة علاجية شاملة للطالب/ة التالي:

**معلومات الطالب:**
- الاسم: {$studentName}
- المادة: {$subject}
- الصف: {$grade}
- المستوى الحالي: {$currentLevel}

**نقاط الضعف المحددة:**
{$weaknessesText}

**مدة الخطة:** {$duration}

**المطلوب:**
1. تحليل نقاط الضعف وأسبابها المحتملة
2. الأهداف العلاجية (قصيرة وطويلة المدى)
3. الاستراتيجيات والأنشطة العلاجية المقترحة
4. جدول زمني مفصل للتنفيذ
5. أدوات التقييم والمتابعة
6. دور ولي الأمر في الدعم
7. مؤشرات النجاح المتوقعة
PROMPT;
    }

    private function buildEnrichmentPlanPrompt(array $data): string
    {
        $studentName = $data['student_name'] ?? 'الطالب';
        $subject = $data['subject'] ?? 'غير محدد';
        $grade = $data['grade'] ?? 'غير محدد';
        $strengths = $data['strengths'] ?? [];
        $interests = $data['interests'] ?? [];
        $duration = $data['duration'] ?? '4 أسابيع';

        $strengthsText = is_array($strengths) ? implode('، ', $strengths) : $strengths;
        $interestsText = is_array($interests) ? implode('، ', $interests) : $interests;

        return <<<PROMPT
أنشئ خطة إثرائية شاملة للطالب/ة المتفوق/ة:

**معلومات الطالب:**
- الاسم: {$studentName}
- المادة: {$subject}
- الصف: {$grade}

**نقاط القوة:**
{$strengthsText}

**الاهتمامات:**
{$interestsText}

**مدة الخطة:** {$duration}

**المطلوب:**
1. تحليل نقاط القوة وكيفية تعزيزها
2. الأهداف الإثرائية المتقدمة
3. الأنشطة والمشاريع الإثرائية المقترحة
4. مصادر التعلم الإضافية
5. جدول زمني للتنفيذ
6. طرق التقييم والتحفيز
7. فرص المشاركة في المسابقات والأولمبياد
PROMPT;
    }

    private function buildTestAnalysisPrompt(array $data): string
    {
        $testName = $data['test_name'] ?? 'الاختبار';
        $subject = $data['subject'] ?? 'غير محدد';
        $grade = $data['grade'] ?? 'غير محدد';
        $totalStudents = $data['total_students'] ?? 0;
        $average = $data['average'] ?? 0;
        $highest = $data['highest'] ?? 0;
        $lowest = $data['lowest'] ?? 0;
        $passRate = $data['pass_rate'] ?? 0;

        return <<<PROMPT
قم بتحليل نتائج الاختبار التالي وتقديم رؤى تفصيلية:

**معلومات الاختبار:**
- اسم الاختبار: {$testName}
- المادة: {$subject}
- الصف: {$grade}

**الإحصائيات:**
- عدد الطلاب: {$totalStudents}
- المتوسط: {$average}%
- أعلى درجة: {$highest}%
- أدنى درجة: {$lowest}%
- نسبة النجاح: {$passRate}%

**المطلوب:**
1. تحليل عام للنتائج
2. تحديد نقاط القوة العامة
3. تحديد نقاط الضعف الشائعة
4. توصيات للمعلم
5. اقتراحات للتحسين
6. خطة متابعة مقترحة
PROMPT;
    }

    private function buildPerformanceReportPrompt(array $data): string
    {
        $teacherName = $data['teacher_name'] ?? 'المعلم';
        $period = $data['period'] ?? 'الفصل الدراسي';
        $achievements = $data['achievements'] ?? [];
        $activities = $data['activities'] ?? [];
        $challenges = $data['challenges'] ?? [];

        $achievementsText = is_array($achievements) ? implode("\n- ", $achievements) : $achievements;
        $activitiesText = is_array($activities) ? implode("\n- ", $activities) : $activities;
        $challengesText = is_array($challenges) ? implode("\n- ", $challenges) : $challenges;

        return <<<PROMPT
أنشئ تقرير أداء وظيفي شامل:

**معلومات المعلم:**
- الاسم: {$teacherName}
- الفترة: {$period}

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

    private function buildCertificatePrompt(array $data): string
    {
        $type = $data['type'] ?? 'تقدير';
        $recipientName = $data['recipient_name'] ?? 'المستلم';
        $reason = $data['reason'] ?? 'التميز';
        $organization = $data['organization'] ?? 'المؤسسة';

        return <<<PROMPT
أنشئ نص شهادة {$type} احترافية:

**المعلومات:**
- نوع الشهادة: {$type}
- اسم المستلم: {$recipientName}
- سبب التكريم: {$reason}
- الجهة المانحة: {$organization}

**المطلوب:**
1. نص الشهادة الرئيسي (3-4 أسطر)
2. عبارة تحفيزية
3. صيغة رسمية ومهنية
PROMPT;
    }

    private function buildRecommendationsPrompt(array $userActivity): string
    {
        $recentViews = $userActivity['recent_views'] ?? [];
        $purchases = $userActivity['purchases'] ?? [];
        $subject = $userActivity['subject'] ?? 'غير محدد';
        $grade = $userActivity['grade'] ?? 'غير محدد';

        return <<<PROMPT
بناءً على نشاط المستخدم التالي، اقترح القوالب والخدمات المناسبة:

**النشاط:**
- المادة: {$subject}
- الصف: {$grade}
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

    private function buildEducationalSystemPrompt(array $context): string
    {
        $userName = $context['user_name'] ?? 'المعلم';
        $subject = $context['subject'] ?? '';
        $grade = $context['grade'] ?? '';

        $subjectInfo = $subject ? "المادة: {$subject}" : '';
        $gradeInfo = $grade ? "الصف: {$grade}" : '';

        return <<<PROMPT
أنت مساعد تعليمي ذكي متخصص في دعم المعلمين والمعلمات في المملكة العربية السعودية.

**معلومات المستخدم:**
- الاسم: {$userName}
{$subjectInfo}
{$gradeInfo}

**قدراتك:**
1. إعداد الخطط العلاجية والإثرائية
2. تحليل نتائج الاختبارات
3. كتابة التقارير والشهادات
4. اقتراح أنشطة تعليمية
5. الإجابة على الاستفسارات التربوية
6. توثيق الإنجازات
7. توزيع المناهج

**إرشادات:**
- استخدم اللغة العربية الفصحى
- كن مهنياً ومفيداً
- قدم إجابات مفصلة وعملية
- اقترح حلولاً قابلة للتطبيق
- راعِ السياق التعليمي السعودي
PROMPT;
    }

    private function buildAchievementPrompt(array $data): string
    {
        $type = $data['type'] ?? 'يومي';
        $title = $data['title'] ?? 'الإنجاز';
        $description = $data['description'] ?? '';
        $date = $data['date'] ?? date('Y-m-d');

        return <<<PROMPT
قم بتوثيق الإنجاز التالي بشكل احترافي:

**معلومات الإنجاز:**
- النوع: {$type}
- العنوان: {$title}
- الوصف: {$description}
- التاريخ: {$date}

**المطلوب:**
1. صياغة احترافية للإنجاز
2. تحديد الأثر والنتائج
3. ربطه بالأهداف التعليمية
4. اقتراح أدلة داعمة
PROMPT;
    }

    private function buildCurriculumPrompt(array $data): string
    {
        $subject = $data['subject'] ?? 'غير محدد';
        $grade = $data['grade'] ?? 'غير محدد';
        $semester = $data['semester'] ?? 'الفصل الأول';
        $weeks = $data['weeks'] ?? 16;
        $topics = $data['topics'] ?? [];

        $topicsText = is_array($topics) ? implode("\n- ", $topics) : $topics;

        return <<<PROMPT
أنشئ توزيع منهج دراسي شامل:

**معلومات المنهج:**
- المادة: {$subject}
- الصف: {$grade}
- الفصل الدراسي: {$semester}
- عدد الأسابيع: {$weeks}

**الموضوعات:**
- {$topicsText}

**المطلوب:**
1. توزيع أسبوعي مفصل
2. الأهداف لكل وحدة
3. الأنشطة المقترحة
4. أساليب التقويم
5. الموارد المطلوبة
PROMPT;
    }
}
