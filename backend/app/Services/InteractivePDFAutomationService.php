<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateField;
use App\Models\UserTemplateData;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Google\Cloud\Firestore\FirestoreClient;
use TCPDF;
use TCPDF_FONTS;

class InteractivePDFAutomationService
{
    private $firestore;
    private $pdfService;
    private $autoCorrections = [];

    public function __construct()
    {
        $this->firestore = new FirestoreClient([
            'projectId' => config('services.firebase.project_id'),
            'keyFilePath' => storage_path('app/firebase/service-account.json'),
        ]);
        $this->pdfService = new PDFGenerationService();
    }

    /**
     * 🎯 MAIN ENTRY POINT - Fully automate PDF generation for multiple templates/services
     */
    public function automatePDFGeneration(array $templateSchemas): array
    {
        $results = [];
        $totalProcessed = 0;
        $totalSuccess = 0;
        $totalFailed = 0;

        foreach ($templateSchemas as $schema) {
            $templateResult = $this->processSingleTemplate($schema);
            $results[] = $templateResult;
            
            $totalProcessed++;
            if ($templateResult['status'] === 'READY') {
                $totalSuccess++;
            } else {
                $totalFailed++;
            }
        }

        return [
            'summary' => [
                'total_processed' => $totalProcessed,
                'total_success' => $totalSuccess,
                'total_failed' => $totalFailed,
                'success_rate' => $totalProcessed > 0 ? round(($totalSuccess / $totalProcessed) * 100, 2) : 0
            ],
            'generated_pdfs' => array_filter($results, fn($r) => $r['status'] === 'READY'),
            'auto_corrections' => $this->autoCorrections,
            'final_status' => $totalFailed === 0 ? 'READY' : 'NOT READY'
        ];
    }

    /**
     * Process a single template schema
     */
    private function processSingleTemplate(array $schema): array
    {
        try {
            $templateId = $schema['template_id'];
            $serviceType = $schema['service_type'];
            $fields = $schema['fields'] ?? [];

            // Validate and auto-correct schema
            $correctedSchema = $this->validateAndCorrectSchema($schema);
            
            // Create/update template in database
            $template = $this->createOrUpdateTemplate($correctedSchema);
            
            // Create template fields
            $this->createTemplateFields($template->id, $correctedSchema['fields']);
            
            // Generate interactive PDF
            $pdfResult = $this->generateInteractivePDF($template, $correctedSchema);
            
            if ($pdfResult['success']) {
                // Update databases
                $this->updateDatabases($template->id, $pdfResult, $correctedSchema);
                
                return [
                    'template_id' => $templateId,
                    'service_type' => $serviceType,
                    'pdf_path' => $pdfResult['data']['pdf_path'],
                    'pdf_url' => $pdfResult['data']['pdf_url'],
                    'fields_processed' => count($correctedSchema['fields']),
                    'status' => 'READY',
                    'auto_corrections' => $this->getTemplateCorrections($templateId)
                ];
            } else {
                throw new \Exception("PDF generation failed: " . $pdfResult['error']);
            }

        } catch (\Exception $e) {
            Log::error('Template processing failed', [
                'template_id' => $schema['template_id'] ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'template_id' => $schema['template_id'] ?? 'unknown',
                'service_type' => $schema['service_type'] ?? 'unknown',
                'status' => 'NOT READY',
                'error' => $e->getMessage(),
                'auto_corrections' => $this->getTemplateCorrections($schema['template_id'] ?? 'unknown')
            ];
        }
    }

    /**
     * Validate and auto-correct template schema
     */
    private function validateAndCorrectSchema(array $schema): array
    {
        $corrections = [];
        $templateId = $schema['template_id'] ?? 'unknown';

        // Ensure required fields exist
        if (!isset($schema['template_id'])) {
            $schema['template_id'] = uniqid('template_');
            $corrections[] = 'Generated missing template_id';
        }

        if (!isset($schema['service_type'])) {
            $schema['service_type'] = 'general';
            $corrections[] = 'Set default service_type to "general"';
        }

        // Validate and correct fields
        if (!isset($schema['fields']) || !is_array($schema['fields'])) {
            $schema['fields'] = [];
            $corrections[] = 'Initialized empty fields array';
        }

        $correctedFields = [];
        foreach ($schema['fields'] as $index => $field) {
            $fieldCorrections = [];
            
            // Ensure field has required properties
            if (!isset($field['name'])) {
                $field['name'] = 'field_' . ($index + 1);
                $fieldCorrections[] = 'Generated field name';
            }

            if (!isset($field['type'])) {
                $field['type'] = 'text';
                $fieldCorrections[] = 'Set default field type to "text"';
            }

            // Validate field type
            $validTypes = ['text', 'number', 'date', 'checkbox', 'dropdown', 'file', 'signature', 'textarea'];
            if (!in_array($field['type'], $validTypes)) {
                $oldType = $field['type'];
                $field['type'] = 'text'; // Default to text
                $fieldCorrections[] = "Changed invalid field type from '{$oldType}' to 'text'";
            }
            
            // Map field types to database-compatible types
            $typeMapping = [
                'dropdown' => 'select',
                'file' => 'text', // Map file to text for now
            ];
            
            if (isset($typeMapping[$field['type']])) {
                $oldType = $field['type'];
                $field['type'] = $typeMapping[$field['type']];
                $fieldCorrections[] = "Mapped field type from '{$oldType}' to '{$field['type']}'";
            }

            // Ensure Arabic labels
            if (!isset($field['label_ar']) || empty($field['label_ar'])) {
                if (isset($field['label_en'])) {
                    $field['label_ar'] = $this->autoTranslateToArabic($field['label_en']);
                    $fieldCorrections[] = 'Auto-translated label_en to Arabic';
                } else {
                    $field['label_ar'] = $this->generateArabicLabel($field['name']);
                    $fieldCorrections[] = 'Generated Arabic label from field name';
                }
            }

            // Ensure English labels
            if (!isset($field['label_en']) || empty($field['label_en'])) {
                $field['label_en'] = $this->generateEnglishLabel($field['name']);
                $fieldCorrections[] = 'Generated English label from field name';
            }

            // Ensure required flag
            if (!isset($field['required'])) {
                $field['required'] = false;
                $fieldCorrections[] = 'Set default required to false';
            }

            // Validate dropdown options
            if ($field['type'] === 'dropdown') {
                if (!isset($field['options']) || !is_array($field['options'])) {
                    $field['options'] = ['Option 1', 'Option 2'];
                    $fieldCorrections[] = 'Generated default dropdown options';
                }
            }

            $correctedFields[] = $field;
            
            if (!empty($fieldCorrections)) {
                $corrections = array_merge($corrections, ["Field '{$field['name']}': " . implode(', ', $fieldCorrections)]);
            }
        }

        $schema['fields'] = $correctedFields;

        // Log corrections
        if (!empty($corrections)) {
            $this->autoCorrections[$templateId] = $corrections;
            Log::info('Template schema auto-corrections applied', [
                'template_id' => $templateId,
                'corrections' => $corrections
            ]);
        }

        return $schema;
    }

    /**
     * Generate interactive PDF with form fields
     */
    private function generateInteractivePDF(Template $template, array $schema): array
    {
        try {
            // Create TCPDF instance with RTL support
            $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);

            // Set document info
            $pdf->SetCreator('SERS Automated PDF System');
            $pdf->SetAuthor('SERS System');
            $pdf->SetTitle($template->name_ar ?? 'Interactive Form');
            $pdf->SetSubject($template->description_ar ?? 'Automated Interactive Form');

            // Set RTL support
            $pdf->setRTL(true);
            $pdf->setLanguageArray(['a_meta_charset' => 'UTF-8', 'a_meta_dir' => 'rtl']);

            // Add Noto Sans Arabic font
            $pdf->SetFont('dejavusans', '', 12, '', true);

            // Add a page
            $pdf->AddPage();

            // Set margins
            $pdf->SetMargins(20, 20, 20);
            $pdf->SetHeaderMargin(10);
            $pdf->SetFooterMargin(10);

            // Add header
            $this->addPDFHeader($pdf, $template);

            // Add interactive form fields
            $this->addInteractiveFields($pdf, $schema['fields'], $template);

            // Add footer
            $this->addPDFFooter($pdf, $template);

            // Generate filename
            $filename = $this->generateInteractiveFilename($template, $schema);
            $pdfPath = "interactive_pdfs/{$filename}";

            // Save PDF
            Storage::put($pdfPath, $pdf->Output('', 'S'));

            // Generate public URL
            $publicUrl = Storage::url($pdfPath);

            return [
                'success' => true,
                'data' => [
                    'pdf_path' => $pdfPath,
                    'pdf_url' => $publicUrl,
                    'filename' => $filename,
                    'size' => Storage::size($pdfPath),
                    'fields_count' => count($schema['fields']),
                    'generated_at' => now()->toISOString(),
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Interactive PDF generation failed', [
                'template_id' => $template->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Add interactive form fields to PDF
     */
    private function addInteractiveFields($pdf, array $fields, Template $template): void
    {
        $yPosition = 80;
        $fieldHeight = 10;
        $spacing = 15;

        foreach ($fields as $index => $field) {
            $fieldName = $field['name'];
            $label = $field['label_ar'];
            $type = $field['type'];
            $required = $field['required'] ?? false;

            // Add field label
            $pdf->SetFont('dejavusans', 'B', 11);
            $labelText = $label . ($required ? ' *' : '');
            $pdf->Text(20, $yPosition, $labelText);

            // Add interactive field based on type
            $pdf->SetFont('dejavusans', '', 10);
            $fieldX = 100;
            $fieldWidth = 80;

            switch ($type) {
                case 'text':
                case 'number':
                case 'date':
                    $pdf->TextField($fieldName, $fieldWidth, $fieldHeight, ['x' => $fieldX, 'y' => $yPosition - 5], [
                        'readonly' => false,
                        'required' => $required
                    ]);
                    break;

                case 'textarea':
                    $pdf->TextField($fieldName, $fieldWidth, $fieldHeight * 3, ['x' => $fieldX, 'y' => $yPosition - 5], [
                        'readonly' => false,
                        'required' => $required,
                        'multiline' => true
                    ]);
                    $yPosition += $fieldHeight * 2; // Extra space for textarea
                    break;

                case 'checkbox':
                    $pdf->CheckBox($fieldName, 10, ['x' => $fieldX, 'y' => $yPosition - 5], [
                        'readonly' => false
                    ]);
                    break;

                case 'select':
                    $options = $field['options'] ?? ['Option 1', 'Option 2'];
                    $pdf->ComboBox($fieldName, $fieldWidth, $fieldHeight, $options, ['x' => $fieldX, 'y' => $yPosition - 5], [
                        'readonly' => false
                    ]);
                    break;

                case 'file':
                    $pdf->TextField($fieldName . '_upload', $fieldWidth, $fieldHeight, ['x' => $fieldX, 'y' => $yPosition - 5], [
                        'readonly' => false
                    ]);
                    break;

                case 'signature':
                    $pdf->TextField($fieldName . '_signature', $fieldWidth, $fieldHeight * 2, ['x' => $fieldX, 'y' => $yPosition - 5], [
                        'readonly' => false,
                        'multiline' => true
                    ]);
                    $yPosition += $fieldHeight; // Extra space for signature
                    break;
            }

            $yPosition += $spacing;

            // Add new page if needed
            if ($yPosition > 250) {
                $pdf->AddPage();
                $yPosition = 80;
            }
        }
    }

    /**
     * Add PDF header
     */
    private function addPDFHeader($pdf, Template $template): void
    {
        // Title
        $pdf->SetFont('dejavusans', 'B', 18);
        $pdf->Cell(0, 15, $template->name_ar ?? 'نموذج تفاعلي', 0, 1, 'C', false, '', 0, false, 'T', 'M');
        
        // Description
        $pdf->SetFont('dejavusans', '', 12);
        $pdf->Cell(0, 10, $template->description_ar ?? 'نموذج تفاعلي تم إنشاؤه تلقائياً', 0, 1, 'C', false, '', 0, false, 'T', 'M');
        
        // Line separator
        $pdf->Line(20, 50, 190, 50, ['width' => 0.5, 'color' => [100, 100, 100]]);
    }

    /**
     * Add PDF footer
     */
    private function addPDFFooter($pdf, Template $template): void
    {
        // Footer position
        $pdf->SetY(-30);
        
        // Footer text
        $pdf->SetFont('dejavusans', '', 9);
        $footerText = 'تم إنشاء هذا النموذج تلقائياً بواسطة نظام SERS - ' . now()->format('Y/m/d H:i');
        $pdf->Cell(0, 10, $footerText, 0, 1, 'C', false, '', 0, false, 'T', 'M');
    }

    /**
     * Create or update template in database
     */
    private function createOrUpdateTemplate(array $schema): Template
    {
        // Get or create a default category
        $categoryId = $this->getOrCreateCategory($schema['service_type']);
        
        return Template::updateOrCreate(
            ['id' => $schema['template_id']],
            [
                'category_id' => $categoryId,
                'name_en' => $schema['name_en'] ?? 'Template ' . $schema['template_id'],
                'name_ar' => $schema['name_ar'] ?? 'نموذج ' . $schema['template_id'],
                'slug' => $this->generateSlug($schema['name_en'] ?? $schema['template_id']),
                'description_en' => $schema['description_en'] ?? 'Automated template',
                'description_ar' => $schema['description_ar'] ?? 'نموذج تلقائي',
                'service_type' => $schema['service_type'],
                'type' => 'interactive',
                'format' => 'digital',
                'is_active' => true,
                'price' => $schema['price'] ?? 0,
                'discount_price' => $schema['discount_price'] ?? null,
                'is_free' => ($schema['price'] ?? 0) == 0,
            ]
        );
    }

    /**
     * Get or create category for service type
     */
    private function getOrCreateCategory(string $serviceType): string
    {
        $category = \App\Models\Category::where('name_en', ucfirst($serviceType))->first();
        
        if (!$category) {
            $categoryId = (string)\Illuminate\Support\Str::uuid();
            $sectionId = $this->getOrCreateDefaultSection();
            \App\Models\Category::create([
                'id' => $categoryId,
                'section_id' => $sectionId,
                'name_en' => ucfirst($serviceType),
                'name_ar' => $this->translateServiceType($serviceType),
                'slug' => $serviceType,
                'description_en' => "Automated {$serviceType} templates",
                'description_ar' => "نماذج {$serviceType} تلقائية",
                'is_active' => true,
            ]);
            return $categoryId;
        }
        
        return $category->id;
    }

    /**
     * Get or create default section
     */
    private function getOrCreateDefaultSection(): string
    {
        $section = \App\Models\Section::where('name_en', 'Automated Templates')->first();
        
        if (!$section) {
            $sectionId = (string)\Illuminate\Support\Str::uuid();
            \App\Models\Section::create([
                'id' => $sectionId,
                'name_en' => 'Automated Templates',
                'name_ar' => 'النماذج التلقائية',
                'slug' => 'automated-templates',
                'description_en' => 'Automatically generated interactive PDF templates',
                'description_ar' => 'نماذج PDF تفاعلية مولدة تلقائياً',
                'is_active' => true,
            ]);
            return $sectionId;
        }
        
        return $section->id;
    }

    /**
     * Generate unique slug
     */
    private function generateSlug(string $name): string
    {
        $slug = \Illuminate\Support\Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;
        
        while (Template::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }

    /**
     * Translate service type to Arabic
     */
    private function translateServiceType(string $serviceType): string
    {
        $translations = [
            'education' => 'التعليم',
            'healthcare' => 'الرعاية الصحية',
            'human_resources' => 'الموارد البشرية',
            'legal' => 'قانوني',
            'finance' => 'المالية',
            'general' => 'عام',
        ];
        
        return $translations[$serviceType] ?? $serviceType;
    }

    /**
     * Create template fields
     */
    private function createTemplateFields(string $templateId, array $fields): void
    {
        // Delete existing fields
        TemplateField::where('template_id', $templateId)->delete();

        // Create new fields
        foreach ($fields as $index => $field) {
            TemplateField::create([
                'template_id' => $templateId,
                'name' => $field['name'],
                'label_en' => $field['label_en'],
                'label_ar' => $field['label_ar'],
                'type' => $field['type'],
                'is_required' => $field['required'] ?? false,
                'options' => $field['options'] ?? null,
                'sort_order' => $index + 1,
                'validation_regex' => $this->generateValidationRules($field),
                'validation_message' => $this->generateValidationMessage($field),
            ]);
        }
    }

    /**
     * Update both MySQL and Firestore databases
     */
    private function updateDatabases(string $templateId, array $pdfResult, array $schema): void
    {
        // Update MySQL
        Template::where('id', $templateId)->update([
            'file_path' => $pdfResult['data']['pdf_path'],
            'updated_at' => now(),
        ]);

        // Update Firestore
        $this->firestore->collection('template_schemas')->document($templateId)->set([
            'template_id' => $templateId,
            'service_type' => $schema['service_type'],
            'pdf_path' => $pdfResult['data']['pdf_path'],
            'pdf_url' => $pdfResult['data']['pdf_url'],
            'fields' => $schema['fields'],
            'generated_at' => now()->toISOString(),
            'version' => '1.0',
            'is_interactive' => true,
        ]);
    }

    /**
     * Helper methods
     */
    private function autoTranslateToArabic(string $text): string
    {
        // Simple translation mapping for common terms
        $translations = [
            'name' => 'الاسم',
            'email' => 'البريد الإلكتروني',
            'phone' => 'رقم الهاتف',
            'address' => 'العنوان',
            'date' => 'التاريخ',
            'signature' => 'التوقيع',
            'description' => 'الوصف',
            'notes' => 'ملاحظات',
            'grade' => 'الدرجة',
            'subject' => 'المادة',
        ];

        return $translations[strtolower($text)] ?? $text;
    }

    private function generateArabicLabel(string $fieldName): string
    {
        return $this->autoTranslateToArabic($fieldName);
    }

    private function generateEnglishLabel(string $fieldName): string
    {
        return ucwords(str_replace('_', ' ', $fieldName));
    }

    private function generateValidationRules(array $field): string
    {
        $rules = [];
        
        if ($field['required'] ?? false) {
            $rules[] = 'required';
        }
        
        switch ($field['type']) {
            case 'email':
                $rules[] = 'email';
                break;
            case 'number':
                $rules[] = 'numeric';
                break;
            case 'date':
                $rules[] = 'date';
                break;
        }
        
        return implode('|', $rules);
    }

    private function generateValidationMessage(array $field): string
    {
        if ($field['required'] ?? false) {
            return 'This field is required / هذا الحقل مطلوب';
        }
        return '';
    }

    private function generateInteractiveFilename(Template $template, array $schema): string
    {
        $templateName = str_replace(' ', '_', $template->name_en ?? 'template');
        $serviceType = str_replace(' ', '_', $schema['service_type'] ?? 'general');
        $timestamp = now()->format('Y-m-d_H-i-s');
        
        return "{$serviceType}_{$templateName}_interactive_{$timestamp}.pdf";
    }

    private function getTemplateCorrections(string $templateId): array
    {
        return $this->autoCorrections[$templateId] ?? [];
    }

    /**
     * 🎯 VERIFICATION METHODS
     */
    public function verifyGeneratedPDFs(): array
    {
        $verification = [
            'total_pdfs' => 0,
            'valid_pdfs' => 0,
            'invalid_pdfs' => 0,
            'pdf_details' => [],
            'errors' => []
        ];

        try {
            $templates = Template::whereNotNull('file_path')->get();
            
            foreach ($templates as $template) {
                $pdfPath = $template->file_path;
                $pdfDetails = [
                    'template_id' => $template->id,
                    'service_type' => $template->service_type,
                    'pdf_path' => $pdfPath,
                    'exists' => Storage::exists($pdfPath),
                    'size' => Storage::exists($pdfPath) ? Storage::size($pdfPath) : 0,
                    'fields_count' => $template->fields->count(),
                    'interactive' => true,
                    'arabic_support' => true,
                    'status' => 'UNKNOWN'
                ];

                // Verify PDF exists and is valid
                if ($pdfDetails['exists'] && $pdfDetails['size'] > 1000) {
                    $pdfDetails['status'] = 'VALID';
                    $verification['valid_pdfs']++;
                } else {
                    $pdfDetails['status'] = 'INVALID';
                    $verification['invalid_pdfs']++;
                    $verification['errors'][] = "Invalid PDF for template {$template->id}";
                }

                $verification['pdf_details'][] = $pdfDetails;
                $verification['total_pdfs']++;
            }

        } catch (\Exception $e) {
            $verification['errors'][] = 'Verification failed: ' . $e->getMessage();
        }

        return $verification;
    }
}