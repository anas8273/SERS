<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateField;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Firestore\FirestoreClient;

class DynamicPromptService
{
    private $firestore;

    public function __construct()
    {
        $this->firestore = new FirestoreClient([
            'projectId' => config('services.firebase.project_id'),
            'keyFilePath' => storage_path('app/firebase/service-account.json'),
        ]);
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
                'general' => 'أنت مساعد ذكي متخصص في النظام التعليمي السعودي. تساعد المعلمين والإداريين في إنشاء محتوى تعليمي احترافي.',
                'grades_analysis' => 'أنت محلل بيانات تعليمي متخصص في تحليل درجات الطلاب وتقديم رؤى إحصائية دقيقة.',
                'report_generation' => 'أنت كاتب تقارير تعليمية محترف متخصص في صياغة التقارير الإدارية والأكاديمية.',
                'evidence_description' => 'أنت محلل محتوى متخصص في وصف وتحليل الشواهد والأدلة التعليمية.',
                'achievement_documentation' => 'أنت موثق إنجازات تعليمية متخصص في توثيق الإنجازات الأكاديمية والمهنية.',
            ],
            'en' => [
                'general' => 'You are an intelligent assistant specialized in the Saudi educational system. You help teachers and administrators create professional educational content.',
                'grades_analysis' => 'You are an educational data analyst specialized in analyzing student grades and providing accurate statistical insights.',
                'report_generation' => 'You are a professional educational report writer specialized in drafting administrative and academic reports.',
                'evidence_description' => 'You are a content analyst specialized in describing and analyzing educational evidence and documentation.',
                'achievement_documentation' => 'You are an educational achievement documenter specialized in documenting academic and professional achievements.',
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
                'general' => 'اكتب محتوى مناسب وواقعي باللغة العربية الفصحى. اجعل المحتوى احترافياً ومناسباً للبيئة التعليمية السعودية.',
                'grades_analysis' => 'حلل البيانات المقدمة واستخرج الإحصائيات المهمة مثل المتوسط والنسب المئوية ونقاط القوة والضعف.',
                'report_generation' => 'اكتب تقريراً مهنياً مفصلاً يتضمن مقدمة وتحليل ونتائج وتوصيات. استخدم لغة رسمية ومصطلحات تربوية دقيقة.',
                'evidence_description' => 'صف المحتوى المرفوع بدقة وحدد نوعه وأهميته التعليمية. اربطه بالأهداف التعليمية والمعايير المهنية.',
                'achievement_documentation' => 'وثق الإنجاز بشكل مفصل يشمل الوصف والأهداف المحققة والأثر التعليمي والأدلة الداعمة.',
            ],
            'en' => [
                'general' => 'Write appropriate and realistic content in formal Arabic. Make the content professional and suitable for the Saudi educational environment.',
                'grades_analysis' => 'Analyze the provided data and extract important statistics such as averages, percentages, strengths and weaknesses.',
                'report_generation' => 'Write a detailed professional report including introduction, analysis, results and recommendations. Use formal language and accurate educational terminology.',
                'evidence_description' => 'Describe the uploaded content accurately and identify its type and educational importance. Link it to educational objectives and professional standards.',
                'achievement_documentation' => 'Document the achievement in detail including description, achieved objectives, educational impact and supporting evidence.',
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
            $docRef = $this->firestore->collection('template_schemas')->document($templateId);
            $snapshot = $docRef->snapshot();
            
            if ($snapshot->exists()) {
                return $snapshot->data();
            }
        } catch (\Exception $e) {
            Log::error('Failed to get template schema from Firestore', [
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
    private function generateFieldSuggestion(array $promptData, TemplateField $field): ?string
    {
        // This would integrate with your AI service (Gemini/OpenAI)
        // For now, return a contextual fallback
        
        $fieldType = $field->type;
        $fieldName = $field->name;
        
        $fallbacks = [
            'text' => "محتوى تم توليده تلقائياً لحقل {$field->label_ar}",
            'textarea' => "هذا نص مفصل تم إنشاؤه بناءً على سياق القالب والحقل المطلوب. يمكن تعديل هذا المحتوى حسب الحاجة.",
            'number' => rand(1, 100),
            'date' => date('Y-m-d'),
        ];
        
        return $fallbacks[$fieldType] ?? $fallbacks['text'];
    }
}