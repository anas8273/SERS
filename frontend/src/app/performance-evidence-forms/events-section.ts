// Helper to generate common event fields
export const eventFields = (eventName: string, objectives: string, steps: string) => [
    { key: 'edu_school', label: 'إدارة التعليم، اسم المدرسة:', type: 'textarea' as const, placeholder: 'الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', rows: 3 },
    { key: 'program_name', label: 'اسم البرنامج / المبادرة:', type: 'text' as const, placeholder: eventName },
    { key: 'implementors', label: 'المنفذ/ون:', type: 'text' as const, placeholder: 'المنفذون' },
    { key: 'participants', label: 'المشاركـ/ون:', type: 'text' as const, placeholder: 'المشاركون' },
    { key: 'location', label: 'مكان التنفيذ:', type: 'text' as const, placeholder: 'مكان التنفيذ' },
    { key: 'duration', label: 'مدة التنفيذ:', type: 'text' as const, placeholder: 'مدة التنفيذ' },
    { key: 'date', label: 'تاريخ التنفيذ:', type: 'text' as const, placeholder: 'التاريخ' },
    { key: 'beneficiaries', label: 'المستفيدون / عددهم:', type: 'text' as const, placeholder: 'المستفيدون' },
    { key: 'domain', label: 'المجال:', type: 'text' as const, placeholder: 'المجال' },
    { key: 'objectives', label: 'الأهداف:', type: 'textarea' as const, placeholder: objectives, rows: 5 },
    { key: 'steps', label: 'خطوات التنفيذ / الوصف:', type: 'textarea' as const, placeholder: steps, rows: 5 },
    { key: 'right_signature', label: 'وظيفة واسم التوقيع الأيمن:', type: 'textarea' as const, placeholder: 'رائد النشاط\nالاسم', rows: 2 },
    { key: 'left_signature', label: 'وظيفة واسم التوقيع الأيسر:', type: 'textarea' as const, placeholder: 'مدير المدرسة\nالاسم', rows: 2 },
    { key: 'image1', label: 'صورة الشاهد الأول:', type: 'image' as const },
    { key: 'image2', label: 'صورة الشاهد الثاني:', type: 'image' as const },
    { key: 'evidence_url', label: 'ضع رابط الشواهد إن وجد لإنشاء باركود:', type: 'url' as const, placeholder: '' },
];
