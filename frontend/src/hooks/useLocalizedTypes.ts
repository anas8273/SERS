'use client';

import { useTranslation } from '@/i18n/useTranslation';
import type {
  AchievementType, AchievementCategory,
  PlanType, PlanStatus,
  TestType, QuestionType,
  CertificateType,
  PerformanceSemester, PerformanceStatus, PerformanceGrade,
  SchoolType, SchoolGender, SchoolMemberRole,
} from '@/types';

/**
 * Hook that returns all type label maps localized based on current language.
 * Replaces hardcoded Arabic constants like ACHIEVEMENT_TYPES, CERTIFICATE_TYPES, etc.
 *
 * Usage:
 *   const { achievementTypes, certTypes } = useLocalizedTypes();
 *   <span>{achievementTypes[item.type]}</span>
 */
export function useLocalizedTypes() {
  const { locale } = useTranslation();
  const isEn = locale === 'en';

  const achievementTypes: Record<AchievementType, string> = {
    daily:    isEn ? 'Daily Achievement'    : 'إنجاز يومي',
    weekly:   isEn ? 'Weekly Achievement'   : 'إنجاز أسبوعي',
    monthly:  isEn ? 'Monthly Achievement'  : 'إنجاز شهري',
    semester: isEn ? 'Semester Achievement' : 'إنجاز فصلي',
    annual:   isEn ? 'Annual Achievement'   : 'إنجاز سنوي',
  };

  const achievementCategories: Record<AchievementCategory, string> = {
    teaching:       isEn ? 'Teaching'       : 'تعليمي',
    administrative: isEn ? 'Administrative' : 'إداري',
    professional:   isEn ? 'Professional'   : 'مهني',
    community:      isEn ? 'Community'      : 'مجتمعي',
    creative:       isEn ? 'Creative'       : 'إبداعي',
    other:          isEn ? 'Other'          : 'أخرى',
  };

  const certTypes: Record<CertificateType, string> = {
    appreciation: isEn ? 'Appreciation Certificate' : 'شهادة تقدير',
    thanks:       isEn ? 'Thank You Certificate'    : 'شهادة شكر',
    graduation:   isEn ? 'Graduation Certificate'   : 'شهادة تخرج',
    honor:        isEn ? 'Honor Board'              : 'لوحة شرف',
    participation:isEn ? 'Participation Certificate' : 'شهادة مشاركة',
    achievement:  isEn ? 'Achievement Certificate'  : 'شهادة إنجاز',
    training:     isEn ? 'Training Certificate'     : 'شهادة تدريب',
    custom:       isEn ? 'Custom'                   : 'مخصصة',
  };

  const certStyleLabels: Record<string, string> = {
    classic: isEn ? 'Classic' : 'كلاسيك',
    modern:  isEn ? 'Modern'  : 'حديث',
    elegant: isEn ? 'Elegant' : 'أنيق',
    simple:  isEn ? 'Simple'  : 'بسيط',
  };

  // Inline cert types used in certificates page
  const certTypeOptions = isEn
    ? ['Thank You', 'Appreciation', 'Attendance', 'Participation', 'Excellence', 'Graduation'] as const
    : ['شهادة شكر', 'شهادة تقدير', 'شهادة حضور', 'شهادة مشاركة', 'شهادة تفوق', 'شهادة تخرج'] as const;

  const planTypes: Record<PlanType, string> = {
    remedial:   isEn ? 'Remedial Plan'       : 'خطة علاجية',
    enrichment: isEn ? 'Enrichment Plan'     : 'خطة إثرائية',
    weekly:     isEn ? 'Weekly Plan'          : 'خطة أسبوعية',
    curriculum: isEn ? 'Curriculum Dist.'     : 'توزيع المنهج',
    daily:      isEn ? 'Daily Plan'           : 'خطة يومية',
    semester:   isEn ? 'Semester Plan'        : 'خطة فصلية',
  };

  const planStatuses: Record<PlanStatus, string> = {
    draft:     isEn ? 'Draft'     : 'مسودة',
    active:    isEn ? 'Active'    : 'نشطة',
    completed: isEn ? 'Completed' : 'مكتملة',
    archived:  isEn ? 'Archived'  : 'مؤرشفة',
  };

  const testTypes: Record<TestType, string> = {
    quiz:       isEn ? 'Quiz'            : 'اختبار قصير',
    midterm:    isEn ? 'Midterm Exam'    : 'اختبار نصفي',
    final:      isEn ? 'Final Exam'      : 'اختبار نهائي',
    diagnostic: isEn ? 'Diagnostic Test' : 'اختبار تشخيصي',
    practice:   isEn ? 'Practice'        : 'تدريب',
  };

  const questionTypes: Record<QuestionType, string> = {
    multiple_choice: isEn ? 'Multiple Choice' : 'اختيار من متعدد',
    true_false:      isEn ? 'True / False'    : 'صح أو خطأ',
    short_answer:    isEn ? 'Short Answer'    : 'إجابة قصيرة',
    essay:           isEn ? 'Essay'           : 'مقالي',
    matching:        isEn ? 'Matching'        : 'مطابقة',
    fill_blank:      isEn ? 'Fill in Blank'   : 'ملء الفراغ',
    ordering:        isEn ? 'Ordering'        : 'ترتيب',
  };

  const performanceSemesters: Record<PerformanceSemester, string> = {
    first:  isEn ? 'First Semester'  : 'الفصل الأول',
    second: isEn ? 'Second Semester' : 'الفصل الثاني',
    annual: isEn ? 'Annual'          : 'سنوي',
  };

  const performanceStatuses: Record<PerformanceStatus, string> = {
    draft:     isEn ? 'Draft'       : 'مسودة',
    submitted: isEn ? 'Submitted'   : 'مُقدم',
    reviewed:  isEn ? 'Under Review': 'قيد المراجعة',
    approved:  isEn ? 'Approved'    : 'معتمد',
    rejected:  isEn ? 'Rejected'    : 'مرفوض',
  };

  const performanceGrades: Record<PerformanceGrade, { name: string; min: number }> = {
    excellent: { name: isEn ? 'Excellent'   : 'ممتاز', min: 90 },
    very_good: { name: isEn ? 'Very Good'   : 'جيد جداً', min: 80 },
    good:      { name: isEn ? 'Good'        : 'جيد', min: 70 },
    acceptable:{ name: isEn ? 'Acceptable'  : 'مقبول', min: 60 },
    weak:      { name: isEn ? 'Weak'        : 'ضعيف', min: 0 },
  };

  const schoolTypes: Record<SchoolType, string> = {
    kindergarten: isEn ? 'Kindergarten' : 'روضة أطفال',
    primary:      isEn ? 'Primary'      : 'ابتدائي',
    intermediate: isEn ? 'Intermediate' : 'متوسط',
    secondary:    isEn ? 'Secondary'    : 'ثانوي',
    combined:     isEn ? 'Combined'     : 'مجمع تعليمي',
  };

  const schoolGenders: Record<SchoolGender, string> = {
    male:   isEn ? 'Boys'  : 'بنين',
    female: isEn ? 'Girls' : 'بنات',
    mixed:  isEn ? 'Mixed' : 'مختلط',
  };

  const schoolMemberRoles: Record<SchoolMemberRole, string> = {
    principal:      isEn ? 'Principal'      : 'مدير',
    vice_principal: isEn ? 'Vice Principal' : 'وكيل',
    teacher:        isEn ? 'Teacher'        : 'معلم',
    counselor:      isEn ? 'Counselor'      : 'مرشد',
    admin:          isEn ? 'Administrator'  : 'إداري',
    supervisor:     isEn ? 'Supervisor'     : 'مشرف',
  };

  // Day names used in distributions
  const dayNames = isEn
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    : ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  // Work evidence standards
  const workEvidenceStandards = isEn
    ? ['Teaching Standard', 'Professional Growth', 'Student Support', 'Community Partnership', 'Professional Responsibility']
    : ['معيار التدريس', 'النمو المهني', 'دعم الطلاب', 'الشراكة المجتمعية', 'المسؤولية المهنية'];

  // Knowledge production types
  const knowledgeTypes = isEn
    ? ['Research Paper', 'Book/Publication', 'Workshop/Training', 'Article', 'Innovation/Patent', 'Other']
    : ['بحث علمي', 'كتاب/نشر', 'ورشة عمل/تدريب', 'مقالة', 'ابتكار/براءة اختراع', 'أخرى'];

  // Follow-up types
  const followUpTypes = isEn
    ? { classVisit: 'Class Visit', supervisionVisit: 'Supervision Visit', meeting: 'Meeting', observation: 'Observation', studentFollowUp: 'Student Follow-Up', dailyReport: 'Daily Report' }
    : { classVisit: 'زيارة صفية', supervisionVisit: 'زيارة إشرافية', meeting: 'اجتماع', observation: 'ملاحظة', studentFollowUp: 'متابعة طالب', dailyReport: 'تقرير يومي' };

  // Bloom's taxonomy levels (question bank)
  const bloomLevels = isEn
    ? ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
    : ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'إبداع'];

  // Difficulty levels (question bank)
  const difficultyLevels = isEn
    ? { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
    : { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

  // Portfolio section titles
  const portfolioSections = {
    achievements:      isEn ? 'Achievements'         : 'الإنجازات',
    certificates:      isEn ? 'Certificates'         : 'الشهادات',
    'work-evidence':   isEn ? 'Work Evidence'        : 'شواهد الأداء',
    'knowledge':       isEn ? 'Knowledge Production' : 'الإنتاج المعرفي',
    plans:             isEn ? 'Educational Plans'    : 'الخطط التعليمية',
    distributions:     isEn ? 'Distributions'        : 'التوزيعات والتحضير',
    tests:             isEn ? 'Tests'                : 'الاختبارات',
    'question-bank':   isEn ? 'Question Bank'        : 'بنك الأسئلة',
  };

  return {
    achievementTypes, achievementCategories,
    certTypes, certTypeOptions, certStyleLabels,
    planTypes, planStatuses,
    testTypes, questionTypes,
    performanceSemesters, performanceStatuses, performanceGrades,
    schoolTypes, schoolGenders, schoolMemberRoles,
    dayNames, workEvidenceStandards, knowledgeTypes, followUpTypes,
    bloomLevels, difficultyLevels, portfolioSections,
  };
}
