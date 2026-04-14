<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use App\Models\Template;
use App\Models\TemplateField;
use App\Services\InteractivePDFAutomationService;

class InteractivePDFTestSeeder extends Seeder
{
    private $pdfAutomationService;

    public function __construct(InteractivePDFAutomationService $pdfAutomationService)
    {
        $this->pdfAutomationService = $pdfAutomationService;
    }

    public function run(): void
    {
        // Test template schemas for different services
        $testSchemas = [
            [
                'template_id' => 'edu_student_report_001',
                'service_type' => 'education',
                'name_en' => 'Student Report Card',
                'name_ar' => 'بطاقة تقرير الطالب',
                'description_en' => 'Interactive student report card with grades and feedback',
                'description_ar' => 'بطاقة تقرير الطالب التفاعلية بالدرجات والتغذية الراجعة',
                'fields' => [
                    [
                        'name' => 'student_name',
                        'type' => 'text',
                        'label_ar' => 'اسم الطالب',
                        'label_en' => 'Student Name',
                        'required' => true
                    ],
                    [
                        'name' => 'student_id',
                        'type' => 'number',
                        'label_ar' => 'رقم الطالب',
                        'label_en' => 'Student ID',
                        'required' => true
                    ],
                    [
                        'name' => 'grade_level',
                        'type' => 'dropdown',
                        'label_ar' => 'المستوى الدراسي',
                        'label_en' => 'Grade Level',
                        'required' => true,
                        'options' => ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس']
                    ],
                    [
                        'name' => 'arabic_grade',
                        'type' => 'number',
                        'label_ar' => 'درجة اللغة العربية',
                        'label_en' => 'Arabic Grade',
                        'required' => true
                    ],
                    [
                        'name' => 'math_grade',
                        'type' => 'number',
                        'label_ar' => 'درجة الرياضيات',
                        'label_en' => 'Math Grade',
                        'required' => true
                    ],
                    [
                        'name' => 'science_grade',
                        'type' => 'number',
                        'label_ar' => 'درجة العلوم',
                        'label_en' => 'Science Grade',
                        'required' => true
                    ],
                    [
                        'name' => 'english_grade',
                        'type' => 'number',
                        'label_ar' => 'درجة اللغة الإنجليزية',
                        'label_en' => 'English Grade',
                        'required' => true
                    ],
                    [
                        'name' => 'teacher_notes',
                        'type' => 'textarea',
                        'label_ar' => 'ملاحظات المعلم',
                        'label_en' => 'Teacher Notes',
                        'required' => false
                    ],
                    [
                        'name' => 'parent_signature',
                        'type' => 'signature',
                        'label_ar' => 'توقيع ولي الأمر',
                        'label_en' => 'Parent Signature',
                        'required' => true
                    ],
                    [
                        'name' => 'report_date',
                        'type' => 'date',
                        'label_ar' => 'تاريخ التقرير',
                        'label_en' => 'Report Date',
                        'required' => true
                    ]
                ]
            ],
            [
                'template_id' => 'hr_employee_evaluation_002',
                'service_type' => 'human_resources',
                'name_en' => 'Employee Performance Evaluation',
                'name_ar' => 'تقييم أداء الموظف',
                'description_en' => 'Interactive employee performance evaluation form',
                'description_ar' => 'نموذج تقييم أداء الموظف التفاعلي',
                'fields' => [
                    [
                        'name' => 'employee_name',
                        'type' => 'text',
                        'label_ar' => 'اسم الموظف',
                        'label_en' => 'Employee Name',
                        'required' => true
                    ],
                    [
                        'name' => 'employee_id',
                        'type' => 'number',
                        'label_ar' => 'رقم الموظف',
                        'label_en' => 'Employee ID',
                        'required' => true
                    ],
                    [
                        'name' => 'department',
                        'type' => 'dropdown',
                        'label_ar' => 'القسم',
                        'label_en' => 'Department',
                        'required' => true,
                        'options' => ['الموارد البشرية', 'المالية', 'التسويق', 'تقنية المعلومات', 'المبيعات']
                    ],
                    [
                        'name' => 'job_performance',
                        'type' => 'dropdown',
                        'label_ar' => 'أداء العمل',
                        'label_en' => 'Job Performance',
                        'required' => true,
                        'options' => ['ممتاز', 'جيد جداً', 'جيد', 'متوسط', 'ضعيف']
                    ],
                    [
                        'name' => 'teamwork',
                        'type' => 'dropdown',
                        'label_ar' => 'العمل الجماعي',
                        'label_en' => 'Teamwork',
                        'required' => true,
                        'options' => ['ممتاز', 'جيد جداً', 'جيد', 'متوسط', 'ضعيف']
                    ],
                    [
                        'name' => 'communication',
                        'type' => 'dropdown',
                        'label_ar' => 'التواصل',
                        'label_en' => 'Communication',
                        'required' => true,
                        'options' => ['ممتاز', 'جيد جداً', 'جيد', 'متوسط', 'ضعيف']
                    ],
                    [
                        'name' => 'punctuality',
                        'type' => 'dropdown',
                        'label_ar' => 'الالتزام بالمواعيد',
                        'label_en' => 'Punctuality',
                        'required' => true,
                        'options' => ['ممتاز', 'جيد جداً', 'جيد', 'متوسط', 'ضعيف']
                    ],
                    [
                        'name' => 'goals_achieved',
                        'type' => 'number',
                        'label_ar' => 'الأهداف المنجزة (%)',
                        'label_en' => 'Goals Achieved (%)',
                        'required' => true
                    ],
                    [
                        'name' => 'strengths',
                        'type' => 'textarea',
                        'label_ar' => 'نقاط القوة',
                        'label_en' => 'Strengths',
                        'required' => false
                    ],
                    [
                        'name' => 'areas_for_improvement',
                        'type' => 'textarea',
                        'label_ar' => 'مجالات التحسين',
                        'label_en' => 'Areas for Improvement',
                        'required' => false
                    ],
                    [
                        'name' => 'employee_comments',
                        'type' => 'textarea',
                        'label_ar' => 'تعليقات الموظف',
                        'label_en' => 'Employee Comments',
                        'required' => false
                    ],
                    [
                        'name' => 'manager_signature',
                        'type' => 'signature',
                        'label_ar' => 'توقيع المدير',
                        'label_en' => 'Manager Signature',
                        'required' => true
                    ],
                    [
                        'name' => 'employee_signature',
                        'type' => 'signature',
                        'label_ar' => 'توقيع الموظف',
                        'label_en' => 'Employee Signature',
                        'required' => true
                    ],
                    [
                        'name' => 'evaluation_date',
                        'type' => 'date',
                        'label_ar' => 'تاريخ التقييم',
                        'label_en' => 'Evaluation Date',
                        'required' => true
                    ]
                ]
            ],
            [
                'template_id' => 'medical_patient_form_003',
                'service_type' => 'healthcare',
                'name_en' => 'Patient Registration Form',
                'name_ar' => 'نموذج تسجيل المريض',
                'description_en' => 'Interactive patient registration and medical history form',
                'description_ar' => 'نموذج تسجيل المريض والتاريخ الطبي التفاعلي',
                'fields' => [
                    [
                        'name' => 'patient_name',
                        'type' => 'text',
                        'label_ar' => 'اسم المريض',
                        'label_en' => 'Patient Name',
                        'required' => true
                    ],
                    [
                        'name' => 'national_id',
                        'type' => 'number',
                        'label_ar' => 'الرقم الوطني',
                        'label_en' => 'National ID',
                        'required' => true
                    ],
                    [
                        'name' => 'date_of_birth',
                        'type' => 'date',
                        'label_ar' => 'تاريخ الميلاد',
                        'label_en' => 'Date of Birth',
                        'required' => true
                    ],
                    [
                        'name' => 'gender',
                        'type' => 'dropdown',
                        'label_ar' => 'الجنس',
                        'label_en' => 'Gender',
                        'required' => true,
                        'options' => ['ذكر', 'أنثى']
                    ],
                    [
                        'name' => 'blood_type',
                        'type' => 'dropdown',
                        'label_ar' => 'فصيلة الدم',
                        'label_en' => 'Blood Type',
                        'required' => true,
                        'options' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
                    ],
                    [
                        'name' => 'phone_number',
                        'type' => 'number',
                        'label_ar' => 'رقم الهاتف',
                        'label_en' => 'Phone Number',
                        'required' => true
                    ],
                    [
                        'name' => 'email',
                        'type' => 'text',
                        'label_ar' => 'البريد الإلكتروني',
                        'label_en' => 'Email',
                        'required' => false
                    ],
                    [
                        'name' => 'address',
                        'type' => 'textarea',
                        'label_ar' => 'العنوان',
                        'label_en' => 'Address',
                        'required' => true
                    ],
                    [
                        'name' => 'emergency_contact',
                        'type' => 'text',
                        'label_ar' => 'جهة الاتصال في حالات الطوارئ',
                        'label_en' => 'Emergency Contact',
                        'required' => true
                    ],
                    [
                        'name' => 'emergency_phone',
                        'type' => 'number',
                        'label_ar' => 'هاتف الطوارئ',
                        'label_en' => 'Emergency Phone',
                        'required' => true
                    ],
                    [
                        'name' => 'allergies',
                        'type' => 'textarea',
                        'label_ar' => 'الحساسية',
                        'label_en' => 'Allergies',
                        'required' => false
                    ],
                    [
                        'name' => 'current_medications',
                        'type' => 'textarea',
                        'label_ar' => 'الأدوية الحالية',
                        'label_en' => 'Current Medications',
                        'required' => false
                    ],
                    [
                        'name' => 'medical_history',
                        'type' => 'textarea',
                        'label_ar' => 'التاريخ الطبي',
                        'label_en' => 'Medical History',
                        'required' => false
                    ],
                    [
                        'name' => 'insurance_card',
                        'type' => 'file',
                        'label_ar' => 'بطاقة التأمين',
                        'label_en' => 'Insurance Card',
                        'required' => false
                    ],
                    [
                        'name' => 'patient_signature',
                        'type' => 'signature',
                        'label_ar' => 'توقيع المريض',
                        'label_en' => 'Patient Signature',
                        'required' => true
                    ],
                    [
                        'name' => 'registration_date',
                        'type' => 'date',
                        'label_ar' => 'تاريخ التسجيل',
                        'label_en' => 'Registration Date',
                        'required' => true
                    ]
                ]
            ]
        ];

        // Process test schemas
        $results = $this->pdfAutomationService->automatePDFGeneration($testSchemas);

        // Log results
        Log::info('Interactive PDF Test Results', [
            'results' => $results
        ]);

        $this->command->info('Interactive PDF test completed successfully!');
        $this->command->info('Summary:');
        $this->command->info("- Total processed: {$results['summary']['total_processed']}");
        $this->command->info("- Total success: {$results['summary']['total_success']}");
        $this->command->info("- Total failed: {$results['summary']['total_failed']}");
        $this->command->info("- Success rate: {$results['summary']['success_rate']}%");
        $this->command->info("- Final status: {$results['final_status']}");
    }
}