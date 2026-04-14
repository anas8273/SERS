<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateField;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DynamicPromptService
{
    private string $apiKey;
    private string $apiUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', '');
        $this->apiUrl = rtrim(config('services.openai.base_url', 'https://api.groq.com/openai/v1'), '/') . '/chat/completions';
        $this->model = config('services.openai.model', 'llama-3.3-70b-versatile');
    }

    /**
     * Build dynamic AI prompt based on context
     * Prompt = f(schema, user_input, service_type, locale)
     */
    public function buildPrompt(array $context): array
    {
        $templateId = $context['template_id'] ?? null;
        $fieldName = $context['field_name'] ?? null;
        $userInput = $context['user_input'] ?? '';
        $serviceType = $context['service_type'] ?? 'general';
        $locale = $context['locale'] ?? 'ar';
        $currentValues = $context['current_values'] ?? [];

        // Get template schema from Firestore
        $schema = $this->getTemplateSchema($templateId);
        
        // Get field configuration
        $fieldConfig = $this->getFieldConfig($templateId, $fieldName);

        // Build context-aware prompt
        $prompt = $this->generateContextualPrompt([
            'schema' => $schema,
            'field_config' => $fieldConfig,
            'user_input' => $userInput,
            'service_type' => $serviceType,
            'locale' => $locale,
            'current_values' => $currentValues,
            'template_id' => $templateId,
        ]);

        return [
            'prompt' => $prompt,
            'context' => [
                'template_id' => $templateId,
                'field_name' => $fieldName,
                'service_type' => $serviceType,
                'locale' => $locale,
                'schema_version' => $schema['version'] ?? null,
            ],
            'metadata' => [
                'field_type' => $fieldConfig['type'] ?? 'text',
                'ai_enabled' => $fieldConfig['ai_fillable'] ?? false,
                'prompt_hint' => $fieldConfig['ai_prompt_hint'] ?? '',
            ]
        ];
    }

    /**
     * Generate contextual prompt based on service type and field configuration
     */
    private function generateContextualPrompt(array $data): string
    {
        $schema = $data['schema'];
        $fieldConfig = $data['field_config'];
        $serviceType = $data['service_type'];
        $locale = $data['locale'];
        $currentValues = $data['current_values'];
        $userInput = $data['user_input'];

        // Base system context
        $systemContext = $this->getSystemContext($serviceType, $locale);
        
        // Template-specific context
        $templateContext = $this->getTemplateContext($schema, $currentValues);
        
        // Field-specific context
        $fieldContext = $this->getFieldContext($fieldConfig, $userInput);
        
        // Service-specific instructions
        $serviceInstructions = $this->getServiceInstructions($serviceType, $locale);

        // Combine all contexts
        $prompt = implode("\n\n", array_filter([
            $systemContext,
            $templateContext,
            $fieldContext,
            $serviceInstructions,
            $this->getOutputFormat($fieldConfig['type'] ?? 'text', $locale)
        ]));

        return $prompt;
    }

    /**
     * Get system context based on service type
     */
    private function getSystemContext(string $serviceType, string $locale): string
    {
        $contexts = [
            'ar' => [
                'general' => 'أنت خبير ومستشار تعليمي معتمد تعمل داخل منصة "SERS" (سوق السجلات التعليمية الذكية). مهمتك مساعدة المعلمين، الإداريين، والطلاب في المنظومة التعليمية السعودية لإنشاء محتوى عالي الجودة ومطابق لمعايير وزارة التعليم. حافظ على نبرة أكاديمية واحترافية.',
                'grades_analysis' => 'أنت خبير بيانات وتقويم تعليمي في منصة "SERS". استخرج رؤى إحصائية دقيقة، وقدم تحليلات متخصصة وحلولاً لتحسين مستوى الطلاب الأكاديمي.',
                'report_generation' => 'أنت خبير صياغة أكاديمية في منصة "SERS". اكتب تقارير إدارية وتعليمية رسمية وخالية من الأخطاء، مع تقسيم منطقي (مقدمة، تحليل، استنتاجات، توصيات بناءة).',
                'evidence_description' => 'أنت مقيم معتمد للجودة التعليمية في "SERS". مهمتك وصف الشواهد والأدلة بدقة، وإبراز قيمتها التربوية وارتباطها بمعايير التميز التعليمي.',
                'achievement_documentation' => 'أنت متخصص في توثيق المسيرات المهنية التعليمية في "SERS". قم بصياغة الإنجازات الأكاديمية والمهنية بلغة قوية ومؤثرة تبرز الأثر التربوي الفعال.',
            ],
            'en' => [
                'general' => 'You are a certified educational expert and consultant working within the "SERS" (Smart Educational Records Market) platform. Your mission is to assist educators in the Saudi educational system in creating high-quality content that meets Ministry of Education standards. Maintain an academic and professional tone.',
                'grades_analysis' => 'You are an educational data and evaluation expert at "SERS". Extract accurate statistical insights, and provide specialized analyses and solutions to improve student academic performance.',
                'report_generation' => 'You are an academic drafting expert at "SERS". Write formal, error-free administrative and educational reports with logical structure (introduction, analysis, conclusions, constructive recommendations).',
                'evidence_description' => 'You are a certified quality evaluator at "SERS". Describe educational evidence accurately, highlighting its pedagogical value and connection to educational excellence standards.',
                'achievement_documentation' => 'You are a specialist in documenting educational careers at "SERS". Formulate academic and professional achievements using strong, impactful language that highlights effective pedagogical output.',
            ]
        ];

        return $contexts[$locale][$serviceType] ?? $contexts[$locale]['general'];
    }

    /**
     * Get template-specific context
     */
    private function getTemplateContext(array $schema, array $currentValues): string
    {
        if (empty($schema)) {
            return '';
        }

        $templateName = $schema['template_name'] ?? 'القالب';
        $fieldsCount = count($schema['fields'] ?? []);
        $filledFields = count(array_filter($currentValues));

        $context = "السياق: تعمل على قالب '{$templateName}' الذي يحتوي على {$fieldsCount} حقل.";
        
        if ($filledFields > 0) {
            $context .= " تم ملء {$filledFields} حقل حتى الآن.";
            
            // Add context from filled fields
            $relevantValues = array_slice($currentValues, 0, 3); // First 3 values for context
            if (!empty($relevantValues)) {
                $context .= "\n\nالبيانات المتوفرة:\n";
                foreach ($relevantValues as $key => $value) {
                    if (is_string($value) && strlen($value) < 100) {
                        $context .= "- {$key}: {$value}\n";
                    }
                }
            }
        }

        return $context;
    }

    /**
     * Get field-specific context
     */
    private function getFieldContext(array $fieldConfig, string $userInput): string
    {
        if (empty($fieldConfig)) {
            return '';
        }

        $fieldName = $fieldConfig['label_ar'] ?? $fieldConfig['name'] ?? 'الحقل';
        $fieldType = $fieldConfig['type'] ?? 'text';
        $isRequired = $fieldConfig['is_required'] ?? false;
        $promptHint = $fieldConfig['ai_prompt_hint'] ?? '';

        $context = "الحقل المطلوب: {$fieldName} (نوع: {$fieldType})";
        
        if ($isRequired) {
            $context .= " - حقل مطلوب";
        }

        if ($promptHint) {
            $context .= "\nتوجيه خاص: {$promptHint}";
        }

        if ($userInput) {
            $context .= "\nمدخل المستخدم: {$userInput}";
        }

        return $context;
    }

    /**
     * Get service-specific instructions
     */
    private function getServiceInstructions(string $serviceType, string $locale): string
    {
        $instructions = [
            'ar' => [
                'general' => 'اكتب محتوى واقعي ومناسب للبيئة التعليمية السعودية بلهجة رسمية. تجنب الحشو والعبارات الترحيبية مثل (بالتأكيد، إليك ما طلبت). ادخل في صلب الموضوع مباشرة.',
                'grades_analysis' => 'حلل البيانات واستخرج الإحصائيات (المتوسط، النسب، مناطق القوة والضعف) بشكل مباشر وبدون مقدمات تسويقية.',
                'report_generation' => 'استخدم المصطلحات التربوية الدقيقة المعتمدة في المملكة العربية السعودية. اكتب التقرير بأسلوب رسمي وابتعد عن الردود الحوارية.',
                'evidence_description' => 'ركز على الأثر الرجعي للشاهد التعليمي وقيمته في تحفيز الطلاب أو تحسين سير العمل. لا تكتب مقدمات.',
                'achievement_documentation' => 'وثق الإنجاز باستخدام أفعال قوية ومباشرة (مثال: قمت بتطوير، أسست، زدت نسبة). لا تكتب أي عبارات ترحيبية.',
            ],
            'en' => [
                'general' => 'Write realistic content suitable for the Saudi educational environment using a formal tone. Avoid filler words and conversational pleasantries (e.g., "Certainly," "Here is..."). Get straight to the point.',
                'grades_analysis' => 'Analyze the data and extract statistics (averages, percentages, strengths, and weaknesses) directly without any conversational openings.',
                'report_generation' => 'Use accurate, approved educational terminology from Saudi Arabia. Write the report in a formal style avoiding conversational replies.',
                'evidence_description' => 'Focus on the pedagogical impact of the evidence and its value in motivating students or improving workflow. Do not include intros.',
                'achievement_documentation' => 'Document the achievement using strong, action-oriented verbs (e.g., Developed, Established, Increased). Remove all pleasantries.',
            ]
        ];

        return $instructions[$locale][$serviceType] ?? $instructions[$locale]['general'];
    }

    /**
     * Get output format instructions
     */
    private function getOutputFormat(string $fieldType, string $locale): string
    {
        $formats = [
            'ar' => [
                'text' => 'أرجع النص مباشرة بدون تنسيق إضافي.',
                'textarea' => 'اكتب نصاً مفصلاً في فقرات منظمة.',
                'number' => 'أرجع رقماً صحيحاً أو عشرياً فقط.',
                'date' => 'استخدم تاريخ اليوم بصيغة YYYY-MM-DD.',
                'select' => 'اختر القيمة الأنسب من الخيارات المتاحة.',
            ],
            'en' => [
                'text' => 'Return the text directly without additional formatting.',
                'textarea' => 'Write detailed text in organized paragraphs.',
                'number' => 'Return only an integer or decimal number.',
                'date' => 'Use today\'s date in YYYY-MM-DD format.',
                'select' => 'Choose the most appropriate value from available options.',
            ]
        ];

        return $formats[$locale][$fieldType] ?? $formats[$locale]['text'];
    }

    /**
     * Get template schema from Firestore
     */
    private function getTemplateSchema(string $templateId): array
    {
        try {
            $template = Template::with('fields')->find($templateId);
            if (!$template) return [];

            return [
                'template_name' => $template->name_ar ?? $template->name_en ?? '',
                'version' => '1.0',
                'fields' => ($template->fields ?? collect())->map(fn($f) => [
                    'name' => $f->name,
                    'label_ar' => $f->label_ar ?? $f->name,
                    'type' => $f->type ?? 'text',
                    'is_required' => $f->is_required ?? false,
                    'ai_fillable' => $f->ai_fillable ?? false,
                    'ai_prompt_hint' => $f->ai_prompt_hint ?? '',
                ])->toArray(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get template schema', [
                'template_id' => $templateId,
                'error' => $e->getMessage()
            ]);
        }

        return [];
    }

    /**
     * Get field configuration from MySQL
     */
    private function getFieldConfig(string $templateId, string $fieldName): array
    {
        try {
            $field = TemplateField::where('template_id', $templateId)
                                 ->where('name', $fieldName)
                                 ->first();
            
            return $field ? $field->toArray() : [];
        } catch (\Exception $e) {
            Log::error('Failed to get field config', [
                'template_id' => $templateId,
                'field_name' => $fieldName,
                'error' => $e->getMessage()
            ]);
        }

        return [];
    }

    /**
     * Analyze uploaded file/image for evidence description
     */
    public function analyzeUploadedContent(string $filePath, string $fileType): array
    {
        $analysis = [
            'type' => $fileType,
            'description' => '',
            'educational_value' => '',
            'suggested_category' => '',
        ];

        // Basic file type analysis
        if (str_contains($fileType, 'image')) {
            $analysis['description'] = 'صورة تعليمية تم رفعها كشاهد على الأداء أو الإنجاز';
            $analysis['educational_value'] = 'توثيق بصري للأنشطة والإنجازات التعليمية';
            $analysis['suggested_category'] = 'شواهد بصرية';
        } elseif (str_contains($fileType, 'pdf')) {
            $analysis['description'] = 'مستند PDF يحتوي على محتوى تعليمي أو إداري';
            $analysis['educational_value'] = 'وثيقة رسمية تدعم الأداء المهني';
            $analysis['suggested_category'] = 'وثائق رسمية';
        } elseif (str_contains($fileType, 'document')) {
            $analysis['description'] = 'مستند نصي يحتوي على محتوى تعليمي';
            $analysis['educational_value'] = 'محتوى تعليمي مكتوب يدعم العملية التعليمية';
            $analysis['suggested_category'] = 'مستندات تعليمية';
        }

        return $analysis;
    }

    /**
     * Generate bulk suggestions for all AI-enabled fields
     */
    public function generateBulkSuggestions(string $templateId, array $currentValues, string $title = ''): array
    {
        try {
            // Get AI-enabled fields
            $aiFields = TemplateField::where('template_id', $templateId)
                                   ->where('ai_fillable', true)
                                   ->orderBy('sort_order')
                                   ->get();

            $suggestions = [];
            
            foreach ($aiFields as $field) {
                $promptData = $this->buildPrompt([
                    'template_id' => $templateId,
                    'field_name' => $field->name,
                    'user_input' => $title,
                    'service_type' => $this->detectServiceType($field->type, $field->name),
                    'locale' => 'ar',
                    'current_values' => $currentValues,
                ]);

                // Generate suggestion for this field
                $suggestion = $this->generateFieldSuggestion($promptData, $field);
                
                if ($suggestion) {
                    $suggestions[$field->name] = $suggestion;
                }
            }

            return $suggestions;
        } catch (\Exception $e) {
            Log::error('Failed to generate bulk suggestions', [
                'template_id' => $templateId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Detect service type based on field characteristics
     */
    private function detectServiceType(string $fieldType, string $fieldName): string
    {
        $fieldNameLower = strtolower($fieldName);
        
        if (str_contains($fieldNameLower, 'grade') || str_contains($fieldNameLower, 'score') || str_contains($fieldNameLower, 'درجة')) {
            return 'grades_analysis';
        }
        
        if (str_contains($fieldNameLower, 'report') || str_contains($fieldNameLower, 'تقرير')) {
            return 'report_generation';
        }
        
        if (str_contains($fieldNameLower, 'evidence') || str_contains($fieldNameLower, 'شاهد')) {
            return 'evidence_description';
        }
        
        if (str_contains($fieldNameLower, 'achievement') || str_contains($fieldNameLower, 'إنجاز')) {
            return 'achievement_documentation';
        }
        
        return 'general';
    }

    /**
     * Generate suggestion for a specific field
     */
    private function generateFieldSuggestion(array $promptData, object $field): ?string
    {
        try {
            if (empty($this->apiKey)) {
                return null;
            }

            $response = Http::timeout(15)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'أنت خبير تعليمي وحصري لمنصة SERS. أجب مباشرة بدون أي مقدمات (مثل: بالتأكيد، إليك ما تريد) وبدون ترحيب. وفر مخرجات احترافية وفورية.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $promptData['prompt'] ?? "اقترح محتوى مناسب لحقل: {$field->label_ar}",
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content') ?? null;
            }

            Log::warning('DynamicPrompt: Groq API error', ['status' => $response->status()]);
        } catch (\Exception $e) {
            Log::error('DynamicPrompt: AI call failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
}