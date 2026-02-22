<?php

namespace App\Services;

use App\Models\Template;
use App\Models\UserTemplateData;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Google\Cloud\Firestore\FirestoreClient;

class PDFGenerationService
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
     * Generate high-quality PDF with RTL support
     */
    public function generatePDF(string $recordId, array $options = []): array
    {
        try {
            // Get user template data
            $record = UserTemplateData::with('template')->findOrFail($recordId);
            
            // Get Firestore data
            $firestoreData = $this->getFirestoreData($record->firestore_doc_id);
            
            // Merge data sources
            $templateData = array_merge(
                $record->data ?? [],
                $firestoreData['user_data'] ?? []
            );

            // Get template schema
            $schema = $this->getTemplateSchema($record->template_id);

            // Generate HTML content
            $htmlContent = $this->generateHTMLContent($record->template, $templateData, $schema, $options);

            // Configure PDF options for RTL and high quality
            $pdfOptions = $this->getPDFOptions($options);

            // Generate PDF using Snappy
            $pdf = SnappyPdf::loadHTML($htmlContent)
                ->setOptions($pdfOptions);

            // Generate filename
            $filename = $this->generateFilename($record, $options);

            // Save PDF
            $pdfPath = "pdfs/{$filename}";
            Storage::put($pdfPath, $pdf->output());

            // Generate public URL
            $publicUrl = Storage::url($pdfPath);

            return [
                'success' => true,
                'data' => [
                    'pdf_path' => $pdfPath,
                    'pdf_url' => $publicUrl,
                    'filename' => $filename,
                    'size' => Storage::size($pdfPath),
                    'generated_at' => now()->toISOString(),
                ]
            ];

        } catch (\Exception $e) {
            Log::error('PDF Generation Failed', [
                'record_id' => $recordId,
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
     * Generate HTML content with RTL support
     */
    private function generateHTMLContent(Template $template, array $data, array $schema, array $options): string
    {
        $variant = $options['variant'] ?? 'default';
        $includeQR = $options['include_qr'] ?? true;
        $includeImages = $options['include_images'] ?? true;

        // Get template variant
        $templateVariant = null;
        if (is_object($variant)) {
            $templateVariant = $variant;
        } else {
            $templateVariant = $template->variants()
                ->where('name_en', $variant)
                ->first() ?? $template->variants()->where('is_default', true)->first();
        }

        // Build CSS for RTL and styling
        $css = $this->generateRTLCSS($templateVariant);

        // Build HTML structure
        $html = $this->buildHTMLStructure($template, $data, $schema, [
            'css' => $css,
            'variant' => $templateVariant,
            'include_qr' => $includeQR,
            'include_images' => $includeImages,
        ]);

        return $html;
    }

    /**
     * Generate RTL-optimized CSS
     */
    private function generateRTLCSS(?object $variant = null): string
    {
        $backgroundImage = $variant?->background_image ?? '';
        
        return "
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                direction: rtl;
                text-align: right;
                line-height: 1.6;
                color: #333;
                background: #fff;
                " . ($backgroundImage ? "background-image: url('{$backgroundImage}');" : "") . "
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }
            
            .container {
                max-width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 20mm;
                position: relative;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
            }
            
            .title {
                font-size: 24px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 10px;
            }
            
            .subtitle {
                font-size: 16px;
                color: #64748b;
            }
            
            .field-group {
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            
            .field-label {
                font-weight: 600;
                color: #374151;
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .field-value {
                background: rgba(255, 255, 255, 0.9);
                padding: 10px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                min-height: 40px;
                font-size: 13px;
                line-height: 1.5;
            }
            
            .field-value.textarea {
                min-height: 80px;
                white-space: pre-wrap;
            }
            
            .field-value.number {
                text-align: center;
                font-weight: 600;
                font-size: 16px;
            }
            
            .field-value.date {
                text-align: center;
                font-weight: 500;
            }
            
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .grid.single {
                grid-template-columns: 1fr;
            }
            
            .qr-section {
                position: absolute;
                bottom: 20mm;
                left: 20mm;
                text-align: center;
            }
            
            .qr-code {
                width: 80px;
                height: 80px;
                border: 2px solid #2563eb;
                border-radius: 8px;
                padding: 5px;
                background: white;
            }
            
            .qr-label {
                font-size: 10px;
                color: #64748b;
                margin-top: 5px;
            }
            
            .footer {
                position: absolute;
                bottom: 10mm;
                right: 20mm;
                left: 20mm;
                text-align: center;
                font-size: 10px;
                color: #9ca3af;
                border-top: 1px solid #e5e7eb;
                padding-top: 10px;
            }
            
            .signature-field {
                border: 2px dashed #d1d5db;
                min-height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9ca3af;
                font-style: italic;
            }
            
            .image-field {
                max-width: 100%;
                max-height: 200px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                object-fit: contain;
            }
            
            .required-field .field-label::after {
                content: ' *';
                color: #ef4444;
            }
            
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .container {
                    margin: 0;
                    padding: 15mm;
                }
            }
        </style>";
    }

    /**
     * Build complete HTML structure
     */
    private function buildHTMLStructure(Template $template, array $data, array $schema, array $options): string
    {
        $css = $options['css'];
        $includeQR = $options['include_qr'];
        $includeImages = $options['include_images'];

        // Generate QR code if needed
        $qrCode = '';
        if ($includeQR && !empty($data['record_url'])) {
            $qrCode = $this->generateQRCodeHTML($data['record_url']);
        }

        // Generate fields HTML
        $fieldsHTML = $this->generateFieldsHTML($schema['fields'] ?? [], $data, $includeImages);

        return "
        <!DOCTYPE html>
        <html lang='ar' dir='rtl'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>{$template->name_ar}</title>
            {$css}
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='title'>{$template->name_ar}</div>
                    <div class='subtitle'>{$template->description_ar}</div>
                </div>
                
                <div class='content'>
                    {$fieldsHTML}
                </div>
                
                {$qrCode}
                
                <div class='footer'>
                    تم إنشاء هذا المستند بواسطة نظام SERS - " . now()->format('Y/m/d H:i') . "
                </div>
            </div>
        </body>
        </html>";
    }

    /**
     * Generate fields HTML based on schema
     */
    private function generateFieldsHTML(array $fields, array $data, bool $includeImages): string
    {
        $html = '';
        $currentGrid = [];

        // If no fields provided, use data keys
        if (empty($fields) && !empty($data)) {
            foreach ($data as $key => $value) {
                $fields[] = [
                    'name' => $key,
                    'label_ar' => $this->translateFieldName($key),
                    'type' => $this->detectFieldType($value),
                    'is_required' => false
                ];
            }
        }

        foreach ($fields as $field) {
            $fieldName = $field['name'] ?? $field['label_ar'] ?? 'unknown';
            $fieldValue = $data[$fieldName] ?? '';
            $fieldType = $field['type'] ?? 'text';
            $isRequired = $field['is_required'] ?? false;

            // Skip empty non-required fields
            if (empty($fieldValue) && !$isRequired) {
                continue;
            }

            // Skip images if not included
            if ($fieldType === 'image' && !$includeImages) {
                continue;
            }

            $fieldHTML = $this->generateSingleFieldHTML($field, $fieldValue, $fieldType, $isRequired);

            // Group small fields in grid
            if (in_array($fieldType, ['text', 'number', 'date', 'select'])) {
                $currentGrid[] = $fieldHTML;
                
                // Output grid when we have 2 fields or reach end
                if (count($currentGrid) === 2) {
                    $html .= "<div class='grid'>" . implode('', $currentGrid) . "</div>";
                    $currentGrid = [];
                }
            } else {
                // Output any pending grid first
                if (!empty($currentGrid)) {
                    $gridClass = count($currentGrid) === 1 ? 'grid single' : 'grid';
                    $html .= "<div class='{$gridClass}'>" . implode('', $currentGrid) . "</div>";
                    $currentGrid = [];
                }
                
                // Output large field
                $html .= "<div class='field-group'>{$fieldHTML}</div>";
            }
        }

        // Output any remaining grid fields
        if (!empty($currentGrid)) {
            $gridClass = count($currentGrid) === 1 ? 'grid single' : 'grid';
            $html .= "<div class='{$gridClass}'>" . implode('', $currentGrid) . "</div>";
        }

        return $html;
    }

    /**
     * Translate field name to Arabic
     */
    private function translateFieldName(string $fieldName): string
    {
        $translations = [
            'student_name' => 'اسم الطالب',
            'grade' => 'الدرجة',
            'teacher_notes' => 'ملاحظات المعلم',
            'date' => 'التاريخ',
            'school_name' => 'اسم المدرسة',
            'subject' => 'المادة',
            'evidence_upload' => 'رفع الشاهد',
            'math_grade' => 'درجة الرياضيات',
            'science_grade' => 'درجة العلوم',
            'arabic_grade' => 'درجة اللغة العربية',
            'english_grade' => 'درجة اللغة الإنجليزية',
            'performance_score' => 'نقاط الأداء',
            'attendance_rate' => 'معدل الحضور',
            'homework_completion' => 'إنجاز الواجبات',
            'bonus_points' => 'نقاط إضافية',
        ];

        return $translations[$fieldName] ?? $fieldName;
    }

    /**
     * Detect field type from value
     */
    private function detectFieldType($value): string
    {
        if (is_numeric($value)) {
            return 'number';
        } elseif (strlen($value) > 100) {
            return 'textarea';
        } elseif (filter_var($value, FILTER_VALIDATE_URL)) {
            return 'image';
        } else {
            return 'text';
        }
    }

    /**
     * Generate single field HTML
     */
    private function generateSingleFieldHTML(array $field, $value, string $type, bool $isRequired): string
    {
        $label = $field['label_ar'] ?? $this->translateFieldName($field['name'] ?? 'unknown');
        $requiredClass = $isRequired ? 'required-field' : '';

        // Ensure Arabic text is properly encoded
        $value = is_string($value) ? $value : (string)$value;
        
        $valueHTML = match($type) {
            'textarea' => "<div class='field-value textarea'>" . nl2br(htmlspecialchars($value, ENT_QUOTES, 'UTF-8')) . "</div>",
            'number' => "<div class='field-value number'>" . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . "</div>",
            'date' => "<div class='field-value date'>" . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . "</div>",
            'image' => $value ? "<img src='{$value}' class='image-field' alt='{$label}' />" : "<div class='field-value'>لا توجد صورة</div>",
            'file' => $value ? "<div class='field-value'>📎 {$value}</div>" : "<div class='field-value'>لا يوجد ملف</div>",
            'signature' => $value ? "<img src='{$value}' class='image-field' alt='التوقيع' />" : "<div class='signature-field'>مكان التوقيع</div>",
            default => "<div class='field-value'>" . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . "</div>"
        };

        return "
        <div class='{$requiredClass}'>
            <div class='field-label'>{$label}</div>
            {$valueHTML}
        </div>";
    }

    /**
     * Generate QR code HTML
     */
    private function generateQRCodeHTML(string $url): string
    {
        // Generate QR code using a service or library
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=" . urlencode($url);
        
        return "
        <div class='qr-section'>
            <img src='{$qrCodeUrl}' class='qr-code' alt='QR Code' />
            <div class='qr-label'>رمز الاستجابة السريعة</div>
        </div>";
    }

    /**
     * Get PDF generation options
     */
    private function getPDFOptions(array $options): array
    {
        return [
            'page-size' => $options['page_size'] ?? 'A4',
            'orientation' => $options['orientation'] ?? 'Portrait',
            'margin-top' => $options['margin_top'] ?? '10mm',
            'margin-right' => $options['margin_right'] ?? '10mm',
            'margin-bottom' => $options['margin_bottom'] ?? '10mm',
            'margin-left' => $options['margin_left'] ?? '10mm',
            'encoding' => 'UTF-8',
            'enable-local-file-access' => true,
            'javascript-delay' => 1000,
            'no-stop-slow-scripts' => true,
            'debug-javascript' => false,
            'lowquality' => false,
            'print-media-type' => true,
            'disable-smart-shrinking' => true,
        ];
    }

    /**
     * Generate filename for PDF
     */
    private function generateFilename(UserTemplateData $record, array $options): string
    {
        $templateName = str_replace(' ', '_', $record->template->name_en ?? 'template');
        $timestamp = now()->format('Y-m-d_H-i-s');
        $userId = $record->user_id;
        
        return "{$templateName}_{$userId}_{$timestamp}.pdf";
    }

    /**
     * Get Firestore data
     */
    private function getFirestoreData(string $docId): array
    {
        try {
            $docRef = $this->firestore->collection('user_records')->document($docId);
            $snapshot = $docRef->snapshot();
            
            return $snapshot->exists() ? $snapshot->data() : [];
        } catch (\Exception $e) {
            Log::error('Failed to get Firestore data', [
                'doc_id' => $docId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Get template schema
     */
    private function getTemplateSchema(string $templateId): array
    {
        try {
            $docRef = $this->firestore->collection('template_schemas')->document($templateId);
            $snapshot = $docRef->snapshot();
            
            return $snapshot->exists() ? $snapshot->data() : [];
        } catch (\Exception $e) {
            Log::error('Failed to get template schema', [
                'template_id' => $templateId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Generate cross-template view (same data, different template)
     */
    public function generateCrossTemplateView(string $recordId, string $targetTemplateId, array $options = []): array
    {
        try {
            // Get original record
            $originalRecord = UserTemplateData::findOrFail($recordId);
            
            // Get target template
            $targetTemplate = Template::findOrFail($targetTemplateId);
            
            // Create temporary record object for target template
            $tempRecord = new UserTemplateData([
                'template_id' => $targetTemplateId,
                'user_id' => $originalRecord->user_id,
                'data' => $originalRecord->data,
                'firestore_doc_id' => $originalRecord->firestore_doc_id,
            ]);
            $tempRecord->template = $targetTemplate;

            // Generate PDF with target template
            return $this->generatePDF($recordId, array_merge($options, [
                'cross_template' => true,
                'target_template_id' => $targetTemplateId
            ]));

        } catch (\Exception $e) {
            Log::error('Cross-template PDF generation failed', [
                'record_id' => $recordId,
                'target_template_id' => $targetTemplateId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}