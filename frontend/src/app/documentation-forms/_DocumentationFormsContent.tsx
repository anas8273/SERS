'use client';
import { ta } from '@/i18n/auto-translations';

import { useState } from 'react';
import { useFirestoreForms } from '@/hooks/useFirestoreForms';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n/useTranslation';
import {
    FileText, ClipboardList, BookOpen, Layers, Layout,
    ChevronLeft, ChevronRight, Download, Eye, RotateCcw,
    Image as ImageIcon, Link as LinkIcon, QrCode,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ===== Form Definitions =====
interface FormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'url' | 'date' | 'number' | 'select' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    rows?: number;
    group?: string;
    groupLabel?: string;
    options?: string[];
}

interface FormTemplate {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    gradient: string;
    fields: FormField[];
    badge?: string;
}

const FORMS: FormTemplate[] = [
    {
        id: 'program-activity-advanced',
        title: ta('نموذج توثيق برنامج أو نشاط (المطور)', 'Program Documentation Form (Advanced)'),
        description: ta('نموذج توثيق يقبل رفع شاهد واحد كحد أدنى وشاهدين كحد أقصى مع إمكانية وضع رابط للشواهد يتحول لباركود تلقائياً', 'Documentation form (1-2 evidence uploads, evidence link auto-converts to QR code)'),
        icon: ClipboardList,
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600',
        badge: 'الأكثر استخداماً',
        fields: [
            { key: 'education_dept', label: ta('إدارة التعليم', 'Education Department'), type: 'text', placeholder: ta('الإدارة العامة للتعليم بالمنطقة', 'General Education Authority - Region'), required: true, group: 'edu_school', groupLabel: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name') },
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('مدرسة', 'School'), required: true, group: 'edu_school' },
            { key: 'program_name', label: ta('اسم البرنامج / المبادرة', 'Program/Initiative Name'), type: 'text', placeholder: ta('تقرير الاحتفاء باليوم الوطني ٩٥', 'National Day 95 Celebration Report'), required: true },
            { key: 'implementors', label: ta('المنفذ/ون', 'Implementer(s)'), type: 'text', placeholder: ta('جميع منسوبي المدرسة', 'All School Staff'), group: 'impl_part', groupLabel: ta('المنفذ/ون والمشاركـ/ون', 'Implementers & Participants') },
            { key: 'participants', label: ta('المشاركـ/ون', 'Participant(s)'), type: 'text', placeholder: ta('أولياء الأمور', 'Parents / Guardians'), group: 'impl_part' },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('فناء المدرسة', 'School Courtyard'), group: 'loc_dur_date', groupLabel: ta('مكان ومدة وتاريخ التنفيذ', 'Location, Duration & Date') },
            { key: 'duration', label: ta('مدة التنفيذ', 'Duration'), type: 'text', placeholder: ta('يوم واحد', 'One Day'), group: 'loc_dur_date' },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١/٤/١٤٤٧هـ', '1/4/1447H'), group: 'loc_dur_date' },
            { key: 'beneficiaries', label: ta('المستفيدون / عددهم', 'Beneficiaries / Count'), type: 'text', placeholder: ta('منسوبي المدرسة / أولياء الأمور', 'School Staff / Parents'), group: 'benef_domain', groupLabel: ta('المستفيدون والمجال', 'Beneficiaries & Domain') },
            { key: 'domain', label: ta('المجال', 'Domain'), type: 'text', placeholder: ta('المواطنة', 'Citizenship'), group: 'benef_domain' },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: ta('تعزيز الهوية الوطنية والانتماء والولاء للوطن...', 'Strengthening national identity and belonging...'), rows: 5, group: 'obj_steps', groupLabel: ta('الأهداف وخطوات التنفيذ', 'Objectives & Implementation Steps') },
            { key: 'steps', label: ta('خطوات التنفيذ / الوصف', 'Implementation Steps / Description'), type: 'textarea', placeholder: ta('١. إذاعة صباحية متنوعة عن اليوم الوطني.\n٢. عمل مسابقات متنوعة...', '١. إذاعة صباحية متنوعة عن اليوم الوطني.\\n٢. عمل مسابقات متنوعة...'), rows: 5, group: 'obj_steps' },
            { key: 'right_signature_title', label: ta('وظيفة التوقيع الأيمن', 'Right Signature Title'), type: 'text', placeholder: ta('رائد النشاط', 'Activity Leader'), group: 'sig_right', groupLabel: ta('التوقيعات', 'Signatures') },
            { key: 'right_signature_name', label: ta('الاسم', 'Name'), type: 'text', placeholder: ta('الاسم', 'Name'), group: 'sig_right' },
            { key: 'left_signature_title', label: ta('وظيفة التوقيع الأيسر', 'Left Signature Title'), type: 'text', placeholder: ta('مدير المدرسة', 'School Principal'), group: 'sig_left' },
            { key: 'left_signature_name', label: ta('الاسم', 'Name'), type: 'text', placeholder: ta('الاسم', 'Name'), group: 'sig_left' },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image', required: true, group: 'images', groupLabel: ta('الشواهد', 'Evidence') },
            { key: 'image2', label: ta('صورة الشاهد الثاني (اختياري)', 'Second Evidence Image (Optional)'), type: 'image', group: 'images' },
            { key: 'evidence_url', label: ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج', 'Add evidence link to generate QR code'), type: 'url', placeholder: ta('سيتم إنشاء باركود تلقائياً / حقل غير إلزامي تجاهله إذا كنت لاتريد باركود', 'QR code auto-generated / Optional field - skip if not needed') },
        ],
    },
    {
        id: 'strategy-brief',
        title: ta('نموذج تنفيذ استراتيجية مختصرة', 'Brief Strategy Implementation Form'),
        description: ta('نموذج مختصر لتوثيق تنفيذ استراتيجية تعليمية', 'Brief form for documenting an educational strategy implementation'),
        icon: BookOpen,
        color: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-green-600',
        fields: [
            { key: 'education_dept', label: ta('إدارة التعليم/المنطقة/مكتب التعليم', 'Education Dept / Region / Office'), type: 'textarea', placeholder: ta('الإدارة الهامة للتعليم\nبالمنطقة الشمالية\nمكتب التعليم', 'الإدارة الهامة للتعليم\\nبالمنطقة الشمالية\\nمكتب التعليم'), rows: 3 },
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('مدرسة أسامة بن زيد', 'Osama Bin Zaid School'), required: true },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١٤٤٥/١٢/٢٢هـ', '22/12/1445H') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('مادة الرياضيات', 'Mathematics Subject') },
            { key: 'strategy', label: ta('استراتيجية التعلم', 'Learning Strategy'), type: 'text', placeholder: ta('التعلم المبني على حل المشكلات', 'Problem-Based Learning'), required: true },
            { key: 'students_count', label: ta('عدد المستفيدين', 'Number of Beneficiaries'), type: 'text', placeholder: ta('٣٠ طالب', '30 students') },
            { key: 'grade', label: ta('الفرحة الدراسية', 'Academic Joy'), type: 'text', placeholder: ta('الأول متوسط', 'First Intermediate') },
            { key: 'class', label: ta('الفصل', 'Class'), type: 'text', placeholder: ta('جميع الفصول', 'All Classes') },
            { key: 'lesson', label: ta('اسم الدرس', 'Lesson Name'), type: 'text', placeholder: ta('المهارات القضية', 'Key Skills') },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.\n٥. الهدف الخامس.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.\\n٥. الهدف الخامس.'), rows: 5 },
            { key: 'teacher_name', label: ta('اسم المعلم', 'Teacher Name'), type: 'textarea', placeholder: ta('اسم المعلم\nتركي محمد خالد', 'اسم المعلم\\nتركي محمد خالد'), rows: 2 },
            { key: 'other_name', label: ta('اسم آخر', 'Last Name'), type: 'textarea', placeholder: ta('مدير المدرسة\nسلطان الفيصل', 'مدير المدرسة\\nسلطان الفيصل'), rows: 2 },
            { key: 'twitter', label: ta('حساب تويتر', 'Twitter Account'), type: 'text', placeholder: '@' },
            { key: 'image1', label: ta('الشاهد الأول', 'First Evidence'), type: 'image' },
            { key: 'image2', label: ta('الشاهد الثاني', 'Second Evidence'), type: 'image' },
        ],
    },
    {
        id: 'program-coverage',
        title: ta('تقرير تنفيذ برنامج (تغطية)', 'Program Implementation Report (Coverage)'),
        description: ta('تقرير تغطية لتنفيذ برنامج مع شاهد واحد', 'Program coverage report with one evidence'),
        icon: FileText,
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-purple-600',
        fields: [
            { key: 'education_dept', label: ta('إدارة التعليم', 'Education Department'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nالمنطقة\nبمنطقة', 'الإدارة العامة للتعليم\\nالمنطقة\\nبمنطقة'), rows: 3 },
            { key: 'edu_office', label: ta('مكتب التعليم', 'Education Office'), type: 'text', placeholder: ta('مكتب التعليم', 'Education Office') },
            { key: 'program_name', label: ta('اسم البرنامج', 'Program Name'), type: 'text', placeholder: ta('برنامج التعليم المستمر', 'Continuing Education Program'), required: true },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١٤٤٦/١٢/١٢م', '12/12/1446H') },
            { key: 'targets', label: ta('المستهدفون', 'Target Group'), type: 'text', placeholder: ta('الطلاب', 'Students') },
            { key: 'domain', label: ta('المجال', 'Domain'), type: 'text', placeholder: ta('المجال التقني', 'Technical Domain') },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.\n٥. الهدف الخامس.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.\\n٥. الهدف الخامس.'), rows: 5 },
            { key: 'steps', label: ta('خطوات التنفيذ', 'Implementation Steps'), type: 'textarea', placeholder: ta('١. الخطوة الأولى.\n٢. الخطوة الثانية.\n٣. الخطوة الثالثة.\n٤. الخطوة الرابعة.\n٥. الخطوة الخامسة.', '١. الخطوة الأولى.\\n٢. الخطوة الثانية.\\n٣. الخطوة الثالثة.\\n٤. الخطوة الرابعة.\\n٥. الخطوة الخامسة.'), rows: 5 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'image3', label: ta('صورة الشاهد الثالث', 'Third Evidence Image'), type: 'image' },
            { key: 'teacher_name', label: ta('اسم المعلم/ة', 'Teacher Name (M/F)'), type: 'textarea', placeholder: ta('الأستاذ\nمحمد الفيصل\nالمرشد الطلابي\nعبدالله الخالد', 'الأستاذ\\nمحمد الفيصل\\nالمرشد الطلابي\\nعبدالله الخالد'), rows: 4 },
        ],
    },
    {
        id: 'program-coverage-2',
        title: ta('تقرير تنفيذ برنامج (تغطية) شاهدين', 'Program Implementation Report (Coverage) - 2 Evidence'),
        description: ta('تقرير تغطية لتنفيذ برنامج مع شاهدين', 'Program coverage report with two pieces of evidence'),
        icon: FileText,
        color: 'bg-pink-500',
        gradient: 'from-pink-500 to-rose-600',
        fields: [
            { key: 'edu_header', label: ta('إدارة التعليم المنطقة مكتب التعليم', 'Education Department Regional Office'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم ب....', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم ب....'), rows: 3 },
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('مدرسة أسامة بن زيد', 'Osama Bin Zaid School'), required: true },
            { key: 'program_name', label: ta('اسم البرنامج', 'Program Name'), type: 'text', placeholder: ta('اسم البرنامج', 'Program Name'), required: true },
            { key: 'implementors', label: ta('اسم منفذ البرنامج أو المنفذين', 'Program Implementer(s) Name'), type: 'text', placeholder: ta('الأستاذ/ محمد بن خالد والأستاذ/ عبدالله بن سلطان', 'Mr. Mohammed bin Khaled & Mr. Abdullah bin Sultan') },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('الفصول الدراسية', 'Classrooms') },
            { key: 'targets', label: ta('المستهدفون', 'Target Group'), type: 'text', placeholder: ta('الطلاب', 'Students') },
            { key: 'targets_count', label: ta('عدد المستهدفين', 'Number of Targets'), type: 'text', placeholder: ta('أكثر من ٧٠ طالب', 'More than 70 students') },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١٤٤٦/١٢/١٢هـ', '12/12/1446H') },
            { key: 'twitter', label: ta('حساب تويتر (اختياري)', 'Twitter Account (Optional)'), type: 'text', placeholder: ta('حساب تويتر (اختياري)', 'Twitter Account (Optional)') },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.'), rows: 4 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
        ],
    },
    {
        id: 'program-coverage-4a',
        title: ta('تقرير تنفيذ برنامج (4 شواهد) - تصميم أ', 'Program Report (4 Evidence) - Design A'),
        description: ta('تقرير تغطية لتنفيذ برنامج مع 4 شواهد - التصميم الأول', 'Program coverage report with 4 evidence - Design 1'),
        icon: FileText,
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-600',
        fields: [
            { key: 'edu_header', label: ta('إدارة التعليم المنطقة مكتب التعليم', 'Education Department Regional Office'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم'), rows: 3 },
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('مدرسة أسامة بن زيد', 'Osama Bin Zaid School'), required: true },
            { key: 'program_name', label: ta('اسم البرنامج', 'Program Name'), type: 'text', placeholder: ta('اسم البرنامج', 'Program Name'), required: true },
            { key: 'implementors', label: ta('اسم منفذ البرنامج أو المنفذين', 'Program Implementer(s) Name'), type: 'text', placeholder: ta('المعلم/ خالد التركي والمعلم/ سلطان الشهد', 'Teacher Khalid Al-Turki & Teacher Sultan Al-Shahd') },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('الفصول الدراسية', 'Classrooms') },
            { key: 'targets', label: ta('المستهدفون', 'Target Group'), type: 'text', placeholder: ta('الطلاب', 'Students') },
            { key: 'targets_count', label: ta('عدد المستهدفين', 'Number of Targets'), type: 'text', placeholder: ta('أكثر من ٧٠ طالب', 'More than 70 students') },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١٤٤٦/١٢/١٢هـ', '12/12/1446H') },
            { key: 'twitter', label: ta('حساب تويتر (اختياري)', 'Twitter Account (Optional)'), type: 'text', placeholder: ta('حساب تويتر (اختياري)', 'Twitter Account (Optional)') },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.'), rows: 4 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'image3', label: ta('صورة الشاهد الثالث', 'Third Evidence Image'), type: 'image' },
            { key: 'image4', label: ta('صورة الشاهد الرابع', 'Fourth Evidence Image'), type: 'image' },
        ],
    },
    {
        id: 'program-coverage-4b',
        title: ta('تقرير تنفيذ برنامج (4 شواهد) - تصميم ب', 'Program Report (4 Evidence) - Design B'),
        description: ta('تقرير تغطية لتنفيذ برنامج مع 4 شواهد - التصميم الثاني', 'Program coverage report with 4 evidence - Design 2'),
        icon: FileText,
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-cyan-600',
        fields: [
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
            { key: 'program_name', label: ta('اسم البرنامج', 'Program Name'), type: 'text', placeholder: ta('اسم البرنامج', 'Program Name'), required: true },
            { key: 'date', label: ta('التاريخ', 'History'), type: 'text', placeholder: ta('التاريخ', 'History') },
            { key: 'description', label: ta('وصف البرنامج', 'Program Description'), type: 'textarea', placeholder: ta('وصف تفصيلي...', 'Detailed description...'), rows: 3 },
            { key: 'image1', label: ta('الشاهد الأول', 'First Evidence'), type: 'image', required: true },
            { key: 'image2', label: ta('الشاهد الثاني', 'Second Evidence'), type: 'image', required: true },
            { key: 'image3', label: ta('الشاهد الثالث', 'Third Evidence'), type: 'image', required: true },
            { key: 'image4', label: ta('الشاهد الرابع', 'Fourth Evidence'), type: 'image', required: true },
        ],
    },
    {
        id: 'evidence-appendix',
        title: ta('ملحق شواهد (شواهد إضافية لأي تقرير)', 'Evidence Appendix (Extra Evidence for Any Report)'),
        description: ta('إضافة شواهد إضافية لأي تقرير أو ملف', 'Add extra evidence to any report or file'),
        icon: Layers,
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-blue-600',
        fields: [
            { key: 'edu_header', label: ta('إدارة التعليم المنطقة مكتب التعليم', 'Education Department Regional Office'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم'), rows: 3 },
            { key: 'title', label: ta('العنوان', 'Address'), type: 'text', placeholder: ta('ملحق شواهد برنامج', 'Program Evidence Appendix') },
            { key: 'twitter', label: ta('حساب تويتر', 'Twitter Account'), type: 'text', placeholder: '' },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'image3', label: ta('صورة الشاهد الثالث', 'Third Evidence Image'), type: 'image' },
            { key: 'image4', label: ta('صورة الشاهد الرابع', 'Fourth Evidence Image'), type: 'image' },
            { key: 'image5', label: ta('صورة الشاهد الخامس', 'Fifth Evidence Image'), type: 'image' },
            { key: 'image6', label: ta('صورة الشاهد السادس', 'Sixth Evidence Image'), type: 'image' },
        ],
    },
    {
        id: 'report-cover',
        title: ta('غلاف لأي تقرير أو ملف', 'Cover Page for Any Report or File'),
        description: ta('إنشاء وتخصيص غلاف احترافي لأي تقرير أو ملف', 'Create and customize a professional cover for any report'),
        icon: Layout,
        color: 'bg-slate-600',
        gradient: 'from-slate-600 to-gray-700',
        fields: [
            { key: 'title', label: ta('العنوان', 'Address'), type: 'textarea', placeholder: ta('عنوان الملف\nيتكون من سطرين', 'عنوان الملف\\nيتكون من سطرين'), rows: 2 },
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'textarea', placeholder: ta('اسم المدرسة\nيتكون من سطرين', 'اسم المدرسة\\nيتكون من سطرين'), rows: 2 },
            { key: 'author', label: ta('اسم معد الملف', 'File Preparer Name'), type: 'textarea', placeholder: ta('إعداد المعلم\naسم المعلم', 'إعداد المعلم\\naسم المعلم'), rows: 2 },
            { key: 'year', label: ta('التاريخ', 'History'), type: 'text', placeholder: ta('عام ١٤٤٦هـ', 'Year 1446H') },
        ],
    },
    {
        id: 'report-cover-landscape',
        title: ta('غلاف لأي تقرير أو ملف (أفقي)', 'Landscape Cover for Any Report or File'),
        description: ta('غلاف بالعرض الأفقي لأي تقرير أو ملف', 'Landscape orientation cover for any report'),
        icon: Layout,
        color: 'bg-cyan-600',
        gradient: 'from-cyan-600 to-teal-700',
        fields: [
            { key: 'title', label: ta('العنوان', 'Address'), type: 'textarea', placeholder: ta('عنوان الملف\nيتكون من سطرين', 'عنوان الملف\\nيتكون من سطرين'), rows: 2 },
            { key: 'school_name', label: ta('اسم المدرسة', 'School Name'), type: 'textarea', placeholder: ta('اسم المدرسة\nيتكون من سطرين', 'اسم المدرسة\\nيتكون من سطرين'), rows: 2 },
            { key: 'author', label: ta('اسم معد الملف', 'File Preparer Name'), type: 'textarea', placeholder: ta('إعداد المعلم\nاسم المعلم', 'إعداد المعلم\\nاسم المعلم'), rows: 2 },
            { key: 'year', label: ta('التاريخ', 'History'), type: 'text', placeholder: ta('عام ١٤٤٦هـ', 'Year 1446H') },
        ],
    },
    {
        id: 'report-sub-cover',
        title: ta('غلاف فرعي داخلي لأي تقرير أو ملف', 'Internal Section Cover for Any Report'),
        description: ta('غلاف فرعي داخلي للفصل بين أقسام التقرير', 'Inner section cover to separate report sections'),
        icon: Layout,
        color: 'bg-rose-600',
        gradient: 'from-rose-600 to-pink-700',
        fields: [
            { key: 'title', label: ta('العنوان', 'Address'), type: 'textarea', placeholder: ta('القسم الأول\nغاية التعليم وأهدافه العامة:', 'القسم الأول\\nغاية التعليم وأهدافه العامة:'), rows: 2 },
            { key: 'content', label: ta('المحتوى', 'Content'), type: 'textarea', placeholder: 'تعزيز مشاركة الأسرة في التحضير لمستقبل أبنائهم. بناء رحلة تعليمية متكاملة. تحسين تكافؤ فرص الحصول على التعليم. تحسين مخرجات التعليم الأساسية. ضمان المواءمة بين مخرجات التعليم واحتياجات سوق العمل.', rows: 6 },
        ],
    },
    {
        id: 'report-index',
        title: ta('فهرس تفاعلي لأي تقرير أو ملف', 'Interactive Table of Contents for Any Report'),
        description: ta('إنشاء فهرس تفاعلي منظم لأي تقرير أو ملف', 'Create an organized interactive table of contents'),
        icon: ClipboardList,
        color: 'bg-green-600',
        gradient: 'from-green-600 to-emerald-700',
        fields: [
            { key: 'item1', label: ta('البند الأول', 'First Item'), type: 'text', placeholder: ta('اسم البند', 'Item Name') },
            { key: 'page1', label: ta('رقم الصفحة', 'Page Number'), type: 'text', placeholder: ta('رقم الصفحة', 'Page Number') },
            { key: 'item2', label: ta('البند الثاني', 'Second Item'), type: 'text', placeholder: ta('اسم البند', 'Item Name') },
            { key: 'page2', label: ta('رقم الصفحة', 'Page Number'), type: 'text', placeholder: ta('رقم الصفحة', 'Page Number') },
            { key: 'item3', label: ta('البند الثالث', 'Third Item'), type: 'text', placeholder: ta('اسم البند', 'Item Name') },
            { key: 'page3', label: ta('رقم الصفحة', 'Page Number'), type: 'text', placeholder: ta('رقم الصفحة', 'Page Number') },
            { key: 'item4', label: ta('البند الرابع', 'Fourth Item'), type: 'text', placeholder: ta('اسم البند', 'Item Name') },
            { key: 'page4', label: ta('رقم الصفحة', 'Page Number'), type: 'text', placeholder: ta('رقم الصفحة', 'Page Number') },
            { key: 'item5', label: ta('البند الخامس', 'Fifth Item'), type: 'text', placeholder: ta('اسم البند', 'Item Name') },
            { key: 'page5', label: ta('رقم الصفحة', 'Page Number'), type: 'text', placeholder: ta('رقم الصفحة', 'Page Number') },
        ],
    },
    {
        id: 'report-divider',
        title: ta('فواصل لأي تقرير أو ملف', 'Dividers for Any Report or File'),
        description: ta('إنشاء فواصل جميلة للفصل بين أقسام التقرير', 'Create beautiful dividers to separate report sections'),
        icon: Layers,
        color: 'bg-purple-600',
        gradient: 'from-purple-600 to-violet-700',
        fields: [
            { key: 'dividers', label: ta('عنوان الفاصل. ضع كل عنوان في سطر، كل مرة تضغط إنتر سيتم إنشاء فاصل جديد:', 'Divider title. Put each title on a line, each Enter creates a new divider:'), type: 'textarea', placeholder: ta('العنصر الأول: أداء الواجبات الوظيفية\nعنوان الفاصل الثاني\nعنوان الفاصل الثالث\nفواصل أخرى', 'العنصر الأول: أداء الواجبات الوظيفية\\nعنوان الفاصل الثاني\\nعنوان الفاصل الثالث\\nفواصل أخرى'), rows: 12 },
        ],
    },
    {
        id: 'teacher-visit-exchange',
        title: ta('استمارة وتقرير تبادل الزيارات بين المعلمين', 'Teacher Peer Visit Exchange Form'),
        description: ta('نموذج لإنشاء استمارة وتقرير تبادل الزيارات بين المعلمين من جوالك مباشرة', 'Form to create a peer visit exchange report directly from your phone'),
        icon: BookOpen,
        color: 'bg-teal-600',
        gradient: 'from-teal-600 to-emerald-700',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'visiting_teachers', label: ta('أسماء المعلمين الزائرين', 'Visiting Teachers Names'), type: 'textarea', placeholder: ta('اسم المعلم الأول\nاسم المعلم الثاني\nاسم المعلم الثالث', 'اسم المعلم الأول\\nاسم المعلم الثاني\\nاسم المعلم الثالث'), rows: 3 },
            { key: 'visited_teacher', label: ta('اسم المعلم/ة المُقَرَّر/ة', 'Assigned Teacher Name (M/F)'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('مادة', 'Subject') },
            { key: 'visit_date', label: ta('اليوم والتاريخ', 'Day & Date'), type: 'text', placeholder: ta('الأحد - 1447/12/3هـ', 'Sunday - 3/12/1447H') },
            { key: 'class_grade', label: ta('الصف / الفصل', 'Grade / Section'), type: 'text', placeholder: ta('الصف', 'Grade') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الأول', 'First') },
            { key: 'unit_lesson', label: ta('الوحدة وعنوان الدرس', 'Unit and Lesson Title'), type: 'textarea', placeholder: ta('عنوان الدرس', 'Lesson Title'), rows: 2 },
            { key: 'visit_goals', label: ta('أهداف الزيارة', 'Visit Objectives'), type: 'textarea', placeholder: 'أ. تبادل الخبرات التربوية بين المعلمين.\nب. الاطلاع على أساليب واستراتيجيات التدريس المختلفة.\nج. تحسين الأداء التدريسي من خلال الاستفادة من الممارسات الناجحة.\nد. تعزيز التعاون والتواصل بين المعلمين في بيئة العمل.\nهـ. متابعة طرق تفاعل الطلاب مع الدروس واستراتيجيات التقييم.', rows: 5 },
            { key: 'principal_name', label: ta('اسم المدير/ة', 'Principal Name (M/F)'), type: 'textarea', placeholder: ta('مدير المدرسة\nاسم المدير', 'مدير المدرسة\\nاسم المدير'), rows: 2 },
        ],
    },
    {
        id: 'medical-physics-day',
        title: ta('تقرير اليوم العالمي للفيزياء الطبية', 'World Medical Physics Day Report'),
        description: ta('نموذج تقرير جاهز لليوم العالمي للفيزياء الطبية (International Day of Medical Physics)', 'Ready report template for World Medical Physics Day'),
        icon: BookOpen,
        color: 'bg-blue-700',
        gradient: 'from-blue-700 to-indigo-800',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'program_name', label: ta('اسم البرنامج / المبادرة', 'Program/Initiative Name'), type: 'text', placeholder: ta('اليوم العالمي للفيزياء الطبية ودور ماري كوري', 'World Medical Physics Day and Role of Marie Curie') },
            { key: 'implementors', label: ta('المنفذ/ون', 'Implementer(s)'), type: 'text', placeholder: ta('معلمي الفيزياء', 'Physics Teachers') },
            { key: 'participants', label: ta('المشاركـ/ون', 'Participant(s)'), type: 'text', placeholder: ta('طلاب المرحلة الثانوية', 'Secondary Stage Students') },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('معمل الفيزياء', 'Physics Lab') },
            { key: 'duration', label: ta('مدة التنفيذ', 'Duration'), type: 'text', placeholder: ta('يوم واحد', 'One Day') },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('السابع من نوفمبر', 'Seventh of November') },
            { key: 'beneficiaries', label: ta('المستفيدون / عددهم', 'Beneficiaries / Count'), type: 'text', placeholder: ta('الطلاب والمعلمين', 'Students and Teachers') },
            { key: 'domain', label: ta('المجال', 'Domain'), type: 'text', placeholder: ta('العلوم - الفيزياء', 'Science - Physics') },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: '١. التعرف على أهمية الفيزياء في حياتنا اليومية.\n٢. توضيح دور الفيزياء الطبية في التشخيص والعلاج.\n٣. إبراز إسهامات العالمة ماري كوري في مجال الأشعة.\n٤. تعزيز فهم الطلاب لأهمية الاحتفال باليوم العالمي للفيزياء الطبية.\n٥. تشجيع التفكير العلمي والبحث في مجالات الفيزياء.', rows: 5 },
            { key: 'steps', label: ta('خطوات التنفيذ / الوصف', 'Implementation Steps / Description'), type: 'textarea', placeholder: '١. بدأ النشاط بتعريف الطلاب بأهمية الفيزياء الطبية لليوم العالمي للفيزياء الطبية وأسباب اختيار السابع من نوفمبر وهو يوم ميلاد ماري كوري.\n٢. تقديم شرح مبسط عن مفهوم الفيزياء ودورها.\n٣. الانتقال إلى شرح الفيزياء الطبية وكيف تستخدم في الأجهزة التشخيصية مثل الأشعة السينية، الرنين المغناطيسي.', rows: 5 },
            { key: 'right_signature', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('رائد النشاط\nالاسم', 'رائد النشاط\\nالاسم'), rows: 2 },
            { key: 'left_signature', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'evidence_url', label: ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج', 'Add evidence link to generate QR code'), type: 'url', placeholder: ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج', 'Add evidence link to generate QR code') },
        ],
    },
];

// ===== Form Preview Component =====
function FormPreview({ form, values, images }: { form: FormTemplate; values: Record<string, string>; images: Record<string, string> }) {
  const { dir } = useTranslation();
    const v = (key: string) => values[key] || '';
    const img = (key: string) => images[key] || '';

    // Advanced program form - professional design
    if (form.id === 'program-activity-advanced') {
        const eduSchool = v('education_school') || v('education_dept');
        const schoolLines = eduSchool.split('\n').filter(l => l.trim());
        const fieldBox = (label: string, val: string, minH = '28px') => (
            <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '6px 10px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', color: '#2a7a7a', fontWeight: 'bold' }}>{label}:</div>
                <div style={{ minHeight: minH, fontSize: '11px', paddingTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                        {/* Col 1: empty */}
                        <div />
                        {/* Col 2: MOE logo - always centered */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                {Array.from({length: 20}).map((_,i) => (
                                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                            <div style={{ lineHeight: '1.5' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                            </div>
                        </div>
                        {/* Col 3: school info - right aligned */}
                        <div style={{ textAlign: 'right', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {schoolLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                        </div>
                    </div>
                </div>

                {/* Title bar */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold' }}>
                    {v('program_name') || form.title}
                </div>

                {/* Fields */}
                <div style={{ padding: '16px 12px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Row 1: المنفذ + المشارك */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {fieldBox('المنفذ/ون', v('implementors'))}
                        {fieldBox('المشاركـ/ون', v('participants'))}
                    </div>
                    {/* Row 2: مكان + مدة + تاريخ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fieldBox('مكان التنفيذ', v('location'))}
                        {fieldBox('مدة التنفيذ', v('duration'))}
                        {fieldBox('تاريخ التنفيذ', v('date'))}
                    </div>
                    {/* Row 3: المستفيدون + المجال */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {fieldBox('المستفيدون / العدد', v('beneficiaries'))}
                        {fieldBox('المجال', v('domain'))}
                    </div>
                    {/* Row 4: خطوات + أهداف */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {fieldBox('خطوات التنفيذ / الوصف', v('steps'), '80px')}
                        {fieldBox('الأهـداف', v('objectives'), '80px')}
                    </div>
                </div>

                {/* Shawahid section */}
                {(img('image1') || img('image2')) && (
                    <div style={{ padding: '8px 12px' }}>
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', color: '#2a7a7a', fontWeight: 'bold' }}>{ta('الشـواهد', 'Evidence')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: img('image1') && img('image2') ? '1fr 1fr' : '1fr', gap: '8px', marginTop: '4px' }}>
                                {['image1','image2'].map(k => img(k) ? (
                                    <div key={k} style={{ borderRadius: '4px', overflow: 'hidden' }}>
                                        <img src={img(k)} alt="" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Signatures - below images */}
                {(v('right_signature') || v('left_signature')) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px 8px' }}>
                        {[v('right_signature'), v('left_signature')].map((sig, i) => sig ? (
                            <div key={i} style={{ textAlign: 'center', fontSize: '11px' }}>
                                <div style={{ whiteSpace: 'pre-line', fontWeight: 'bold', lineHeight: '1.7' }}>{sig}</div>
                                <div style={{ borderBottom: '1px solid #555', width: '90px', margin: '8px auto 3px' }} />
                                <div style={{ color: '#888', fontSize: '10px' }}>{ta('التوقيع', 'Signature')}</div>
                            </div>
                        ) : null)}
                    </div>
                )}

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold', marginTop: '8px' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    if (form.id === 'program-coverage-4a') {
        const eduLines = v('edu_header').split('\n').filter(l => l.trim());        const fieldBox = (label: string, val: string, minH = '32px') => (
            <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '6px 10px', position: 'relative', marginBottom: '8px' }}>
                <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e' }}>{label}:</div>
                <div style={{ minHeight: minH, fontSize: '11px', paddingTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.7', textAlign: 'center' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                        <div />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                {Array.from({length: 20}).map((_,i) => (
                                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                            <div style={{ lineHeight: '1.5' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {eduLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                        </div>
                    </div>
                </div>
                {/* Teal line */}
                <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />

                {/* School name */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold', margin: '10px 12px 6px', borderRadius: '6px' }}>
                    {v('school_name') || 'اسم المدرسة'}
                </div>
                {/* Program name */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '12px', fontWeight: 'bold', margin: '0 12px 10px', borderRadius: '6px' }}>
                    {v('program_name') || 'اسم البرنامج'}
                </div>

                {/* Fields - two columns */}
                <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                    {/* Right col */}
                    <div>
                        {fieldBox('المنفـــــذ', v('implementors'))}
                        {fieldBox('المستهدفـون', v('targets'))}
                        {/* Objectives */}
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative', minHeight: '120px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('الأهـــداف:', 'Objectives:')}</div>
                            <div style={{ fontSize: '11px', paddingTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{v('objectives')}</div>
                        </div>
                    </div>
                    {/* Left col */}
                    <div>
                        {fieldBox('مكان التنفيـذ', v('location'))}
                        {fieldBox('عدد المستفيدين', v('targets_count'))}
                        {fieldBox('تاريخ التنفيـذ', v('date'))}
                    </div>
                </div>

                {/* Shawahid - 4 images 2x2 */}
                <div style={{ padding: '12px 12px 8px' }}>
                    <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap' }}>{ta('الشـواهـد', 'Evidence')}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                            {['image1','image2','image3','image4'].map(k => (
                                <div key={k} style={{ borderRadius: '6px', overflow: 'hidden', background: '#f5f5f5', minHeight: '100px' }}>
                                    {img(k) ? <img src={img(k)} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} /> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    // Program coverage form
    if (form.id === 'program-coverage-2') {
        const eduLines = v('edu_header').split('\n').filter(l => l.trim());
        const infoRow = (label: string, val: string) => (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', marginBottom: '6px', border: '1px solid #5bc4c0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ padding: '7px 12px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', background: 'linear-gradient(to bottom, #1a7abf, #1a9e6e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', borderLeft: '1px solid #5bc4c0' }}>{label}</div>
                <div style={{ padding: '7px 10px', fontSize: '11px', textAlign: 'center' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                        <div style={{ textAlign: 'left', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {eduLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                {Array.from({length: 20}).map((_,i) => (
                                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                            <div style={{ lineHeight: '1.5' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                            </div>
                        </div>
                        <div />
                    </div>
                </div>
                {/* Teal line */}
                <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />

                {/* School name */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold', margin: '10px 12px', borderRadius: '6px' }}>
                    {v('school_name') || 'اسم المدرسة'}
                </div>

                {/* Program name bar */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '12px', fontWeight: 'bold', margin: '0 12px 10px', borderRadius: '6px' }}>
                    {v('program_name') || 'اسم البرنامج'}
                </div>

                {/* Info rows */}
                <div style={{ padding: '0 12px' }}>
                    {infoRow('المنفـــذ:', v('implementors'))}
                    {infoRow('مكان التنفيـذ:', v('location'))}
                    {infoRow('المستهدفـون:', v('targets'))}
                    {infoRow('عدد المستفيدين:', v('targets_count'))}
                    {infoRow('تاريخ التنفيـذ:', v('date'))}

                    {/* Objectives */}
                    <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', marginTop: '8px', marginBottom: '10px' }}>
                        <div style={{ textAlign: 'center', color: '#1a9e6e', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>{ta('الأهداف', 'Objectives')}</div>
                        <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{v('objectives')}</div>
                    </div>

                    {/* Shawahid */}
                    {(img('image1') || img('image2')) && (
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                            <div style={{ textAlign: 'center', color: '#1a9e6e', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>{ta('الشواهد', 'Evidence')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {['image1','image2'].map(k => img(k) ? (
                                    <div key={k} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                        <img src={img(k)} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    if (form.id === 'program-coverage') {
        const eduLines = v('education_dept').split('\n').filter(l => l.trim());
        const sectionHeader = (title: string, color = '#3ab5b0') => (
            <div style={{ background: `linear-gradient(to left, ${color}, #2a9d8f)`, color: 'white', textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', marginBottom: '8px' }}>{title}</div>
        );
        const infoRow = (label: string, val: string) => (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', marginBottom: '6px' }}>
                <div style={{ background: 'linear-gradient(to left, #3ab5b0, #2a9d8f)', color: 'white', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px 0 0 4px', whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ border: '1px solid #ccc', borderRight: 'none', padding: '6px 10px', fontSize: '11px', borderRadius: '0 4px 4px 0' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                        <div style={{ textAlign: 'left', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {eduLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                {Array.from({length: 20}).map((_,i) => (
                                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                            <div style={{ lineHeight: '1.5' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                            </div>
                        </div>
                        <div />
                    </div>
                </div>
                {/* Teal line */}
                <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />

                {/* Body: two columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px' }}>
                    {/* Right column: program info */}
                    <div>
                        {sectionHeader('تقرير عن برنامج إرشادي')}
                        {infoRow('أسم البرنامج', v('program_name'))}
                        {infoRow('تاريخ التنفيذ', v('date'))}
                        {infoRow('المستفيدون', v('targets'))}
                        {infoRow('المجال', v('domain'))}
                        {/* أهداف */}
                        <div style={{ marginTop: '10px' }}>
                            {sectionHeader('أهداف البرنامج')}
                            <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px', minHeight: '80px', fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                                {v('objectives')}
                            </div>
                        </div>
                        {/* خطوات */}
                        <div style={{ marginTop: '10px' }}>
                            {sectionHeader('آلية تنفيذ البرنامج')}
                            <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px', minHeight: '80px', fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                                {v('steps')}
                            </div>
                        </div>
                    </div>
                    {/* Left column: shawahid + teacher */}
                    <div>
                        {sectionHeader('شواهد البرنامج')}
                        <div style={{ border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                            {['image1','image2','image3'].map(k => img(k) ? (
                                <img key={k} src={img(k)} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block', borderBottom: '1px solid #eee' }} />
                            ) : null)}
                        </div>
                        {/* Teacher name - always shown */}
                        <div style={{ marginTop: '10px' }}>
                            {sectionHeader('اسم المعلم/ـة')}
                            <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px', minHeight: '60px', fontSize: '11px', whiteSpace: 'pre-line', lineHeight: '1.8', textAlign: 'center' }}>
                                {v('teacher_name')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    // Strategy brief form
    if (form.id === 'strategy-brief') {
        const eduLines = (v('education_dept')).split('\n').filter(l => l.trim());
        const tools = ['جهاز عرض','جهاز حاسب','صورة توضيحية','أدوات رياضية','كتاب','أوراق عمل','بطاقات تعليمية','سبورة ذكية','سبورة تقليدية','عرض تقديمي'];
        const fieldBox = (label: string, val: string, minH = '28px') => (
            <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '6px 10px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', color: '#2a7a7a', fontWeight: 'bold' }}>{label}:</div>
                <div style={{ minHeight: minH, fontSize: '11px', paddingTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                        {/* Col 1: empty */}
                        <div />
                        {/* Col 2: MOE logo - always centered */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                {Array.from({length: 20}).map((_,i) => (
                                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
                                ))}
                            </div>
                            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                            <div style={{ lineHeight: '1.5' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                            </div>
                        </div>
                        {/* Col 3: school info - right aligned */}
                        <div style={{ textAlign: 'right', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {eduLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                        </div>
                    </div>
                </div>

                {/* School name bar */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold' }}>
                    {v('school_name') || 'اسم المدرسة'}
                </div>

                {/* Fields */}
                <div style={{ padding: '16px 12px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Row 1: استراتيجية + مادة + تاريخ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fieldBox('الاستراتيجية', v('strategy'))}
                        {fieldBox('المادة', v('subject'))}
                        {fieldBox('تاريخ التنفيذ', v('date'))}
                    </div>
                    {/* Row 2: مرحلة + فصل + عدد */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fieldBox('المرحلة الدراسية', v('grade'))}
                        {fieldBox('الفصل', v('class'))}
                        {fieldBox('عدد الطلاب', v('students_count'))}
                    </div>
                    {/* Row 3: الدرس */}
                    {fieldBox('الدرس', v('lesson'))}
                    {/* Row 4: أدوات + أهداف */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Tools checkboxes */}
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', color: '#2a7a7a', fontWeight: 'bold' }}>{ta('الأدوات والوسائل التعليمية:', 'Educational Tools & Resources:')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingTop: '4px' }}>
                                {tools.map(tool => (
                                    <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
                                        <div style={{ width: '12px', height: '12px', border: '1px solid #5bc4c0', borderRadius: '2px', flexShrink: 0, background: v(`tool_${tool}`) === '1' ? '#5bc4c0' : 'white' }} />
                                        <span>{tool}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {fieldBox('الأهـداف', v('objectives'), '80px')}
                    </div>
                    {/* Shawahid */}
                    <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative', minHeight: '120px' }}>
                        <div style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '10px', color: '#2a7a7a', fontWeight: 'bold' }}>{ta('الشـواهـد', 'Evidence')}</div>
                        {(img('image1') || img('image2')) && (
                            <div style={{ display: 'grid', gridTemplateColumns: img('image1') && img('image2') ? '1fr 1fr' : '1fr', gap: '8px', marginTop: '8px' }}>
                                {['image1','image2'].map(k => img(k) ? (
                                    <div key={k} style={{ borderRadius: '4px', overflow: 'hidden' }}>
                                        <img src={img(k)} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ) : null)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Signatures */}
                {(v('teacher_name') || v('other_name')) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px 12px' }}>
                        {[v('teacher_name'), v('other_name')].map((sig, i) => sig ? (
                            <div key={i} style={{ textAlign: 'center', fontSize: '11px' }}>
                                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>{sig}</div>
                            </div>
                        ) : null)}
                    </div>
                )}

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    // Default preview for other forms

    // Helper shared across custom previews
    const moeHeader = (eduLines: string[]) => (
        <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                <div style={{ textAlign: 'left', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    {eduLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                        {Array.from({length: 20}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                    </div>
                    <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                    <div style={{ lineHeight: '1.5' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                        <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                    </div>
                </div>
                <div />
            </div>
        </div>
    );

    const moeFooter = () => (
        <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
            {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
        </div>
    );

    const tealLine = () => <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />;

    const fBox = (label: string, val: string, minH = '28px') => (
        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '6px 10px', position: 'relative', marginBottom: '8px' }}>
            <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e' }}>{label}:</div>
            <div style={{ minHeight: minH, fontSize: '11px', paddingTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
        </div>
    );

    // program-coverage-4b
    if (form.id === 'program-coverage-4b') {
        const fB = (label: string, val: string, minH = '28px') => (
            <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px' }}>
                <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{label}:</span>
                    <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
                </div>
                <div style={{ minHeight: minH, fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header - MOE logo only, no school text since no edu_header field */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                            {Array.from({length: 20}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                        </div>
                        <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                        <div style={{ lineHeight: '1.5' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                            <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                        </div>
                    </div>
                </div>
                <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />

                {/* School name */}
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold', margin: '10px 12px 10px', borderRadius: '6px' }}>
                    {v('school_name') || 'اسم المدرسة'}
                </div>

                {/* Fields grid */}
                <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Row 1: اسم البرنامج + مجال */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {fB('اسم البرنامج', v('program_name'))}
                        {fB('مجـال البرنامج', v('domain'))}
                    </div>
                    {/* Row 2: المنفذين + تاريخ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {fB('المنفـــذ/ين', v('implementors'))}
                        {fB('تاريخ التنفيـذ', v('date'))}
                    </div>
                    {/* Row 3: المستفيدون + عدد */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {fB('المستفيـدون', v('targets'))}
                        {fB('عدد المستفيدين', v('targets_count'))}
                    </div>
                    {/* Row 4: خطوات + أهداف */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px', minHeight: '80px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{ta('خطوات التنفيذ:', 'Implementation Steps:')}</span>
                                <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
                            </div>
                            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{v('steps')}</div>
                        </div>
                        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px', minHeight: '80px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{ta('الأهـداف:', 'Objectives:')}</span>
                                <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
                            </div>
                            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{v('objectives')}</div>
                        </div>
                    </div>

                    {/* Shawahid 2x2 */}
                    <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative', marginBottom: '8px' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap' }}>{ta('الشـواهـد', 'Evidence')}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                            {['image1','image2','image3','image4'].map(k => (
                                <div key={k} style={{ borderRadius: '6px', overflow: 'hidden', background: '#f0f0f0', minHeight: '100px' }}>
                                    {img(k) ? <img src={img(k)} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} /> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    // evidence-appendix
    if (form.id === 'evidence-appendix') {
        const eduLines = v('edu_header').split('\n').filter(l => l.trim());
        const imgs = ['image1','image2','image3','image4','image5','image6'].filter(k => img(k));
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {moeHeader(eduLines)}
                {tealLine()}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold', borderRadius: '6px' }}>
                        {v('title') || 'ملحق شواهد'}
                    </div>
                    {imgs.length > 0 && (
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap' }}>{ta('الشـواهـد', 'Evidence')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                {imgs.map(k => (
                                    <div key={k} style={{ borderRadius: '6px', overflow: 'hidden' }}>
                                        <img src={img(k)} alt="" style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {v('twitter') && <div style={{ textAlign: 'left', fontSize: '11px', color: '#1a9e6e', fontWeight: 'bold' }}>𝕏 {v('twitter')}</div>}
                </div>
                {moeFooter()}
            </div>
        );
    }

    // report-cover
    if (form.id === 'report-cover') {
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Top row: gray bar + logo + green circles */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: '16px', minHeight: '100px', background: '#e0e0e0', borderRadius: '0 10px 10px 0', marginTop: '30px', opacity: 0.7 }} />
                    <div style={{ textAlign: 'center', flex: 1, padding: '20px 0 10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,5px)', gap: '3px', margin: '0 auto 6px', width: 'fit-content' }}>
                            {Array.from({length: 32}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1a9e6e' }} />)}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a9e6e', letterSpacing: '2px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                        <div style={{ fontSize: '10px', color: '#1a9e6e', opacity: 0.8 }}>Ministry of Education</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '0' }}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#1a9e6e' }} />
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1a9e6e', opacity: 0.5, marginRight: '10px' }} />
                    </div>
                </div>

                {/* Main content */}
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#1a9e6e', borderRadius: '10px', padding: '16px 24px', width: '90%', textAlign: 'center' }}>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', lineHeight: '2', whiteSpace: 'pre-line' }}>{v('title') || 'عنوان الملف\nيتكون من سطرين'}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '12px 24px', width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', lineHeight: '2', whiteSpace: 'pre-line', color: '#333' }}>{v('school_name') || 'اسم المدرسة\nيتكون من سطرين'}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '12px 24px', width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', lineHeight: '2', whiteSpace: 'pre-line', color: '#333' }}>{v('author') || 'إعداد المعلم\nاسم المعلم'}</div>
                    </div>
                    <div style={{ width: '90%', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ background: '#1a9e6e', color: 'white', borderRadius: '6px', padding: '5px 14px', fontSize: '11px', fontWeight: 'bold' }}>
                            {v('year') || 'عام ١٤٤٦هـ'}
                        </div>
                    </div>
                </div>

                {/* Bottom row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 20px 10px' }}>
                    <svg width="45" height="45" viewBox="0 0 45 45" fill="none">
                        <rect x="3" y="2" width="26" height="32" rx="4" stroke="#1a9e6e" strokeWidth="2" fill="white"/>
                        <line x1="8" y1="12" x2="24" y2="12" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <line x1="8" y1="17" x2="24" y2="17" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <line x1="8" y1="22" x2="18" y2="22" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <path d="M20 26 L26 20 L30 24 L24 30 Z" fill="#1a9e6e"/>
                    </svg>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px' }}>
                        {[4,6,9,13, 3,5,7,11, 2,4,5,9, 1,2,4,7].map((s,i) => (
                            <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', background: '#1a9e6e', opacity: 0.5 }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // report-cover-landscape
    if (form.id === 'report-cover-landscape') {
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {/* Left gray shape */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '20px' }}>
                        <div style={{ width: '14px', height: '80px', background: '#e0e0e0', borderRadius: '0 8px 8px 0', opacity: 0.7 }} />
                        <div style={{ width: '60px', height: '1px', background: '#5bc4c0', opacity: 0.4, marginTop: '4px' }} />
                        <div style={{ width: '40px', height: '1px', background: '#5bc4c0', opacity: 0.3 }} />
                        <div style={{ width: '50px', height: '1px', background: '#5bc4c0', opacity: 0.2 }} />
                    </div>
                    {/* Center: MOE logo */}
                    <div style={{ textAlign: 'center', flex: 1, padding: '16px 0 8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,5px)', gap: '3px', margin: '0 auto 6px', width: 'fit-content' }}>
                            {Array.from({length: 32}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1a9e6e' }} />)}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1a9e6e', letterSpacing: '2px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                        <div style={{ fontSize: '10px', color: '#1a9e6e', opacity: 0.8 }}>Ministry of Education</div>
                    </div>
                    {/* Right green rounded shape */}
                    <div style={{ width: '60px', height: '80px', background: '#1a9e6e', borderRadius: '0 0 0 40px', marginTop: '0' }} />
                </div>

                {/* Dotted line separator */}
                <div style={{ borderTop: '1px dashed #ccc', margin: '4px 20px 12px' }} />

                {/* Main content */}
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#1a9e6e', borderRadius: '10px', padding: '14px 24px', width: '75%', textAlign: 'center' }}>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', lineHeight: '2', whiteSpace: 'pre-line' }}>{v('title') || 'عنوان الملف\nيتكون من سطرين'}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '10px 24px', width: '75%', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', lineHeight: '2', whiteSpace: 'pre-line', color: '#333' }}>{v('school_name') || 'اسم المدرسة\nيتكون من سطرين'}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '10px 24px', width: '75%', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', lineHeight: '2', whiteSpace: 'pre-line', color: '#333' }}>{v('author') || 'إعداد المعلم\nاسم المعلم'}</div>
                    </div>
                    <div style={{ width: '75%', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ background: '#1a9e6e', color: 'white', borderRadius: '6px', padding: '5px 14px', fontSize: '11px', fontWeight: 'bold' }}>
                            {v('year') || 'عام ١٤٤٦هـ'}
                        </div>
                    </div>
                </div>

                {/* Bottom row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '12px 20px 8px' }}>
                    <svg width="45" height="45" viewBox="0 0 45 45" fill="none">
                        <rect x="3" y="2" width="26" height="32" rx="4" stroke="#1a9e6e" strokeWidth="2" fill="white"/>
                        <line x1="8" y1="12" x2="24" y2="12" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <line x1="8" y1="17" x2="24" y2="17" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <line x1="8" y1="22" x2="18" y2="22" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <path d="M20 26 L26 20 L30 24 L24 30 Z" fill="#1a9e6e"/>
                    </svg>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px' }}>
                        {[4,6,9,13, 3,5,7,11, 2,4,5,9, 1,2,4,7].map((s,i) => (
                            <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', background: '#1a9e6e', opacity: 0.5 }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // report-sub-cover
    if (form.id === 'report-sub-cover') {
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left: gray bar */}
                    <div style={{ width: '14px', height: '80px', background: '#e0e0e0', borderRadius: '0 8px 8px 0', marginTop: '20px', opacity: 0.7 }} />
                    {/* Right: two green circles stacked */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ width: '65px', height: '65px', background: '#1a9e6e', borderRadius: '0 0 0 50%' }} />
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1a9e6e', opacity: 0.5, marginRight: '14px', marginTop: '4px' }} />
                    </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', padding: '8px 24px 4px', color: '#1a9e6e', fontSize: '16px', fontWeight: 'bold', lineHeight: '2', whiteSpace: 'pre-line' }}>
                    {v('title') || 'القسم الأول\nغاية التعليم وأهدافه العامة:'}
                </div>

                {/* Dotted separator */}
                <div style={{ borderTop: '1px dashed #ccc', margin: '4px 20px 12px' }} />

                {/* Content box */}
                <div style={{ margin: '0 20px 16px', border: '1px solid #5bc4c0', borderRadius: '10px', padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', lineHeight: '2.2', whiteSpace: 'pre-wrap', color: '#333', textAlign: 'center' }}>
                        {v('content') || 'تعزيز مشاركة الأسرة في التحضير لمستقبل أبنائهم...'}
                    </div>
                </div>

                {/* Bottom: file icon left + dots center + gray bar right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '8px 0 12px' }}>
                    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" style={{ marginRight: '16px' }}>
                        <rect x="3" y="2" width="26" height="32" rx="4" stroke="#1a9e6e" strokeWidth="2" fill="white"/>
                        <line x1="8" y1="12" x2="24" y2="12" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <line x1="8" y1="17" x2="24" y2="17" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <line x1="8" y1="22" x2="18" y2="22" stroke="#1a9e6e" strokeWidth="1.5"/>
                        <path d="M20 26 L26 20 L30 24 L24 30 Z" fill="#1a9e6e"/>
                    </svg>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', alignItems: 'end' }}>
                        {[5,8,12,16, 4,6,9,13, 3,5,7,10, 2,3,5,8].map((s,i) => (
                            <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', background: '#1a9e6e', opacity: 0.45 }} />
                        ))}
                    </div>
                    <div style={{ width: '14px', height: '60px', background: '#e0e0e0', borderRadius: '8px 0 0 8px', opacity: 0.6 }} />
                </div>
            </div>
        );
    }

    // report-index
    if (form.id === 'report-index') {
        const items = Array.from({length: 20}, (_, i) => i + 1)
            .filter(n => v(`item${n}`))
            .map(n => ({ item: v(`item${n}`), page: v(`page${n}`) }));
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e0e0', opacity: 0.6, margin: '10px 0 0 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ width: '65px', height: '65px', background: '#1a9e6e', borderRadius: '0 0 0 50%' }} />
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1a9e6e', opacity: 0.5, marginRight: '14px', marginTop: '4px' }} />
                    </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', color: '#1a9e6e', fontSize: '22px', fontWeight: 'bold', padding: '4px 0 8px' }}>{ta('الفهرس', 'Table of Contents')}</div>

                {/* Dotted line */}
                <div style={{ borderTop: '1px dashed #ccc', margin: '0 20px 12px' }} />

                {/* Table */}
                <div style={{ margin: '0 20px' }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', background: '#f5f5f5', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: '#333', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>{ta('العنوان', 'Address')}</div>
                        <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: '#333', textAlign: 'center' }}>{ta('الصفحة', 'Page')}</div>
                    </div>
                    {/* Rows */}
                    {items.length > 0 ? items.map((row, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                            <div style={{ padding: '8px 12px', fontSize: '11px', color: '#333', borderRight: '1px solid #eee' }}>{row.item}</div>
                            <div style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'center', color: '#555' }}>{row.page}</div>
                        </div>
                    )) : (
                        [['المقدمة','من 1 إلى 4'],['الفصل الأول: الإطار النظري','من 5 إلى 14'],['الفصل الثاني: الدراسة التطبيقية','من 15 إلى 24'],['الفصل الثالث: النتائج والتوصيات','من 25 إلى 34'],['الخاتمة','من 35 إلى 39'],['المراجع','من 40 إلى 44'],['الملاحق','45']].map(([ttl, pg], i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                <div style={{ padding: '8px 12px', fontSize: '11px', color: '#aaa', borderRight: '1px solid #eee' }}>{ttl}</div>
                                <div style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'center', color: '#aaa' }}>{pg}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom dotted line */}
                <div style={{ borderTop: '1px dashed #ccc', margin: '16px 20px 8px' }} />
            </div>
        );
    }

    // report-divider
    if (form.id === 'report-divider') {
        const dividers = (v('dividers') || '').split('\n').filter(l => l.trim()).slice(0, 20);

        const handleDividerDownload = (title: string, idx: number) => {
            const printWindow = window.open('', '_blank', 'width=600,height=850');
            if (!printWindow) return;
            const html = `<!DOCTYPE html><html dir={dir} lang="ar"><head><meta charset="UTF-8"><title>فاصل ${idx+1}</title><style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
body{background:white;font-family:'Cairo','Segoe UI',sans-serif;direction:rtl;width:210mm;min-height:297mm;position:relative;overflow:hidden;}
@page{margin:0;size:A4;}
</style></head><body>
<div style="width:100%;min-height:297mm;background:white;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <!-- Top-right teal curve -->
  <div style="position:absolute;top:-20px;left:-20px;width:120px;height:120px;border:3px solid #5bc4c0;border-radius:50%;clip-path:inset(50% 0 0 50%);"></div>
  <div style="position:absolute;top:0;left:0;width:80px;height:80px;border:3px solid #5bc4c0;border-radius:50%;clip-path:inset(50% 0 0 50%);"></div>
  <!-- Top-left teal curve -->
  <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border:3px solid #5bc4c0;border-radius:50%;clip-path:inset(50% 50% 0 0);"></div>
  <div style="position:absolute;top:0;right:0;width:80px;height:80px;border:3px solid #5bc4c0;border-radius:50%;clip-path:inset(50% 50% 0 0);"></div>
  <!-- Top-left gray dots -->
  <div style="position:absolute;top:30px;right:30px;display:grid;grid-template-columns:repeat(5,8px);gap:4px;">
    ${Array.from({length:15}).map(()=>`<div style="width:6px;height:6px;border-radius:50%;background:#ddd;"></div>`).join('')}
  </div>
  <!-- Dotted line -->
  <div style="position:absolute;top:90px;left:60px;right:60px;border-top:1px dashed #5bc4c0;"></div>
  <!-- Center box -->
  <div style="border:1.5px solid #5bc4c0;border-radius:12px;padding:40px 50px;text-align:center;width:70%;margin:0 auto;">
    <div style="font-size:22px;font-weight:bold;color:#444;line-height:2;">${title}</div>
  </div>
  <!-- Bottom-right dots graduated -->
  <div style="position:absolute;bottom:120px;left:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
    ${[6,9,12,16,20, 5,7,10,14,18, 4,6,8,11,15, 3,4,6,9,12].map(s=>`<div style="width:${s}px;height:${s}px;border-radius:50%;background:#5bc4c0;opacity:0.5;"></div>`).join('')}
  </div>
  <!-- Bottom-left gray shape -->
  <div style="position:absolute;bottom:0;right:0;width:180px;height:140px;background:#e8e8e8;border-radius:60px 0 0 0;opacity:0.6;"></div>
  <!-- Bottom-left gray dots -->
  <div style="position:absolute;bottom:20px;right:20px;display:grid;grid-template-columns:repeat(5,8px);gap:4px;">
    ${Array.from({length:15}).map(()=>`<div style="width:6px;height:6px;border-radius:50%;background:#ddd;"></div>`).join('')}
  </div>
  <!-- Bottom curves -->
  <div style="position:absolute;bottom:-20px;right:-20px;width:120px;height:120px;border:3px solid #5bc4c0;border-radius:50%;clip-path:inset(0 50% 50% 0);"></div>
  <div style="position:absolute;bottom:-20px;left:-20px;width:120px;height:120px;border:3px solid #5bc4c0;border-radius:50%;clip-path:inset(0 0 50% 50%);"></div>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
</body></html>`;
            printWindow.document.write(html);
            printWindow.document.close();
        };

        const DividerCard = ({ title, idx }: { title: string; idx: number }) => (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: 'white', marginBottom: '12px', display: 'flex', flexDirection: 'column' }}>
                <div id={`divider-card-${idx}`}>
                    {/* Top decorations */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,6px)', gap: '3px', padding: '8px' }}>
                            {Array.from({length: 9}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e0e0e0' }} />)}
                        </div>
                        <div style={{ width: '0', height: '0', borderTop: '40px solid #5bc4c0', borderLeft: '40px solid transparent' }} />
                    </div>
                    <div style={{ borderTop: '1px dashed #5bc4c0', margin: '0 12px 8px' }} />
                    <div style={{ display: 'flex', minHeight: '100px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0 8px' }}>
                            <div style={{ width: '2px', height: '20px', background: '#5bc4c0' }} />
                            <div style={{ width: '12px', height: '2px', background: '#5bc4c0' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.8' }}>{title}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px', padding: '8px', alignSelf: 'center' }}>
                            {[8,10,12, 6,8,10, 4,6,8, 2,4,6].map((s,i) => (
                                <div key={i} style={{ width: `${s}px`, height: `${s}px`, borderRadius: '50%', background: '#5bc4c0', opacity: 0.5 }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 8px 0' }}>
                        <div style={{ width: '60px', height: '40px', background: '#e8e8e8', clipPath: 'polygon(0 100%, 100% 100%, 0 0)', opacity: 0.7 }} />
                    </div>
                    <div style={{ borderTop: '1px dashed #ccc', margin: '4px 12px' }} />
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', padding: '4px 0' }}>صفحة {idx + 1}</div>
                </div>
                {/* Download button */}
                <button
                    onClick={() => handleDividerDownload(title, idx)}
                    style={{ background: '#1a7abf', color: 'white', border: 'none', padding: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'Cairo, sans-serif' }}
                >
                    {ta('تحميل الصورة', 'Upload Image')}
                </button>
            </div>
        );

        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: '#f5f5f5', display: 'block', padding: '12px' }}>
                {dividers.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {dividers.map((title, i) => <DividerCard key={i} title={title} idx={i} />)}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {['العنصر الأول: أداء الواجبات الوظيفية','عنوان الفاصل الثاني','عنوان الفاصل الثالث','فواصل أخرى'].map((title, i) => (
                            <DividerCard key={i} title={title} idx={i} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // medical-physics-day
    if (form.id === 'medical-physics-day') {
        const eduLines = (v('edu_school')).split('\n').filter(l => l.trim());
        const fBox = (label: string, val: string, minH = '28px') => (
            <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px' }}>
                <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{label}:</span>
                    <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
                </div>
                <div style={{ minHeight: minH, fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
            </div>
        );
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', display: 'block' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                        <div style={{ textAlign: 'left', lineHeight: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {eduLines.map((l, i) => <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                {Array.from({length: 20}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                            </div>
                            <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                            <div style={{ lineHeight: '1.5' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                            </div>
                        </div>
                        <div />
                    </div>
                </div>
                <div style={{ background: '#1a3a5c', color: 'white', textAlign: 'center', padding: '9px', fontSize: '13px', fontWeight: 'bold' }}>
                    {v('program_name') || 'اليوم العالمي للفيزياء الطبية ودور ماري كوري'}
                </div>
                <div style={{ padding: '16px 12px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {fBox('المنفذ/ون', v('implementors'))}
                        {fBox('المشاركـ/ون', v('participants'))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fBox('مكان التنفيذ', v('location'))}
                        {fBox('مدة التنفيذ', v('duration'))}
                        {fBox('تاريخ التنفيذ', v('date'))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {fBox('المستفيدون / العدد', v('beneficiaries'))}
                        {fBox('المجال', v('domain'))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px', minHeight: '80px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', background: 'white', padding: '0 4px' }}>{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</span>
                                <span style={{ flex: 1, height: '1px', background: '#5bc4c0' }} />
                            </div>
                            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{v('steps')}</div>
                        </div>
                        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px', minHeight: '80px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', background: 'white', padding: '0 4px' }}>{ta('الأهـداف:', 'Objectives:')}</span>
                                <span style={{ flex: 1, height: '1px', background: '#5bc4c0' }} />
                            </div>
                            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{v('objectives')}</div>
                        </div>
                    </div>
                    {(img('image1') || img('image2')) && (
                        <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap' }}>{ta('الشـواهـد', 'Evidence')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                {['image1','image2'].map(k => img(k) ? (
                                    <div key={k} style={{ borderRadius: '6px', overflow: 'hidden' }}>
                                        <img src={img(k)} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    )}
                    {(v('right_signature') || v('left_signature')) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px' }}>
                            {[v('right_signature'), v('left_signature')].map((sig, i) => sig ? (
                                <div key={i} style={{ textAlign: 'center', fontSize: '11px' }}>
                                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>{sig}</div>
                                </div>
                            ) : null)}
                        </div>
                    )}
                </div>
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    }

    // teacher-visit-exchange preview
    if (form.id === 'teacher-visit-exchange') {
        const eduLines = (v('edu_school') || '').split('\n').filter(l => l.trim());
        const visitingTeachers = (v('visiting_teachers') || '').split('\n').filter(l => l.trim());
        const principalLines = (v('principal_name') || '').split('\n').filter(l => l.trim());
        const page = v('_page');       // '0' = تقرير, '1+' = استمارة
        const teacher = v('_teacher'); // اسم المعلم الزائر للصفحة
        const cell = (label: string, val: string) => (
            <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 10px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{label}:</div>
                <div style={{ minHeight: '20px', fontSize: '11px', paddingTop: '3px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
            </div>
        );
        const evalItems = [
            { title: ta('التخطيط للحصة:', 'Lesson Planning:'), items: ['الأهداف واضحة ومحددة ومعلنة للطلاب.', 'المحتوى مناسب للمرحلة ومرتبط بخبرات الطلاب.'] },
            { title: ta('أساليب التدريس:', 'Teaching Methods:'), items: ['تنوع الاستراتيجيات المستخدمة.', 'إشراك جميع الطلاب وتوزيع الفرص.'] },
            { title: ta('إدارة الصف:', 'Classroom Management:'), items: ['الانضباط الصفي والتحفيز الإيجابي.', 'استخدام الوسائل التعليمية بفعالية.'] },
            { title: ta('التقويم:', 'Assessment:'), items: ['وجود تقويم قبلي / بنائي / ختامي.', 'توظيف نتائج التقويم الفوري خلال الدرس.'] },
            { title: ta('أثر التعلّم:', 'Learning Impact:'), items: ['تقبل المعلم لمشاركات الطلاب.', 'وضوح أثر التعلم على الطلاب.'] },
        ];

        // صفحة الاستمارة (لكل معلم زائر)
        if (page !== '0') {
            const teacherName = teacher || visitingTeachers[0] || 'اسم المعلم الزائر';
            return (
                <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white' }}>
                    {moeHeader(eduLines)}
                    {tealLine()}
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ background: '#1e3a4a', color: 'white', textAlign: 'center', padding: '7px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{ta('استمارة الزيارات التبادلية', 'Peer Visit Exchange Form')}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {cell('اسم المعلم/ة الزائر/ة', teacherName)}
                            {cell('اسم المعلم/ة المُقَرَّر/ة', v('visited_teacher'))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            {cell('اليوم / التاريخ', v('visit_date'))}
                            {cell('الصف / الفصل', v('class_grade'))}
                            {cell('الفصل الدراسي', v('semester'))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {cell('المادة', v('subject'))}
                            {cell('الوحدة / عنوان الدرس', v('unit_lesson'))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1a5e6e' }}>{ta('عناصر التقويم', 'Assessment Elements')}</div>
                            <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                        </div>
                        <div style={{ border: '1px solid #3ab5b0', borderRadius: '6px', overflow: 'hidden' }}>
                            {evalItems.map((sec, si) => (
                                <div key={si} style={{ display: 'grid', gridTemplateColumns: '1fr auto', borderBottom: si < evalItems.length - 1 ? '1px solid #e0f5f3' : 'none' }}>
                                    <div style={{ padding: '5px 10px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#1a5e6e', fontSize: '10px', marginBottom: '2px' }}>{sec.title}</div>
                                        {sec.items.map((item, ii) => <div key={ii} style={{ fontSize: '10px', lineHeight: '1.7', color: '#333' }}>{item}</div>)}
                                    </div>
                                    <div style={{ padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '3px', justifyContent: 'center', borderRight: '1px solid #e0f5f3' }}>
                                        {sec.items.map((_, ii) => (
                                            <div key={ii} style={{ display: 'flex', gap: '5px', fontSize: '9px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                <span>{ta('□ متحقق', '□ Achieved')}</span><span>{ta('□ متحقق جزئياً', '□ Partially Achieved')}</span><span>{ta('□ غير متحقق', '□ Not Achieved')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 10px', position: 'relative', minHeight: '55px' }}>
                                <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('نقاط تميز أداء المعلم/ـة المُقَرَّر/ة:', 'Strengths of the assigned teacher:')}</div>
                            </div>
                            <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 10px', position: 'relative', minHeight: '55px' }}>
                                <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('التوصيات:', 'Recommendations:')}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderTop: '1px solid #eee', marginTop: '2px' }}>
                            {[['المعلم/ة المُقَرَّر/ة', v('visited_teacher')], ['المعلم/ة الزائر/ة', teacherName], ['مدير المدرسة', principalLines[1] || '']].map(([title, name], i) => (
                                <div key={i} style={{ textAlign: 'center', fontSize: '10px' }}>
                                    <div style={{ lineHeight: '1.7' }}>{title}</div>
                                    <div style={{ lineHeight: '1.7' }}>{name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {moeFooter()}
                </div>
            );
        }

        // صفحة 0: تقرير الزيارات التبادلية
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white' }}>
                {moeHeader(eduLines)}
                {tealLine()}
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#1e3a4a', color: 'white', textAlign: 'center', padding: '7px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{ta('تقرير الزيارات التبادلية', 'Peer Visit Exchange Report')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {cell('اسم المعلم/ـة المُقَرَّر/ة', v('visited_teacher'))}
                        {cell('اليوم والتاريخ', v('visit_date'))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {cell('المادة', v('subject'))}
                        {cell('الصف / الفصل', v('class_grade'))}
                        {cell('الفصل الدراسي', v('semester'))}
                    </div>
                    {cell('الوحدة / عنوان الدرس', v('unit_lesson'))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1a5e6e' }}>{ta('أهداف الزيارة:', 'Visit Objectives:')}</div>
                        <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', minHeight: '70px', whiteSpace: 'pre-wrap', lineHeight: '1.9', fontSize: '11px' }}>{v('visit_goals')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                        <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '8px 12px', position: 'relative', minHeight: '70px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('المعلمون الزائرون:', 'Visiting Teachers:')}</div>
                            <div style={{ paddingTop: '4px' }}>
                                {visitingTeachers.map((t, i) => <div key={i} style={{ lineHeight: '1.8' }}>{t}</div>)}
                            </div>
                        </div>
                        <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '8px 12px', position: 'relative', minWidth: '90px', minHeight: '70px' }}>
                            <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('التوقيع', 'Signature')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 8px', borderTop: '1px solid #eee', marginTop: '2px' }}>
                        <div style={{ textAlign: 'center', fontSize: '10px' }}>
                            {principalLines.map((l, i) => <div key={i} style={{ lineHeight: '1.7' }}>{l}</div>)}
                        </div>
                    </div>
                </div>
                {moeFooter()}
            </div>
        );
    }

    // Default preview for other forms
    return (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 print:shadow-none" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
            {/* Header */}
            <div className={`bg-gradient-to-l ${form.gradient} p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs opacity-80">{ta('المملكة العربية السعودية', 'Saudi Arabia')}</div>
                    <div className="text-xs opacity-80">{ta('وزارة التعليم', 'Ministry of Education')}</div>
                </div>
                <h2 className="text-xl font-black text-center">{form.title}</h2>
                {v('school_name') && <p className="text-center text-sm opacity-90 mt-1">{v('school_name')}</p>}
            </div>

            {/* Body */}
            <div className="p-6 space-y-3 text-sm">
                {form.fields.filter(f => f.type !== 'image' && f.type !== 'url').map(field => (
                    v(field.key) ? (
                        <div key={field.key} className="flex gap-2 border-b border-gray-100 pb-2">
                            <span className="font-bold text-gray-700 min-w-[140px] shrink-0">{field.label}:</span>
                            <span className="text-gray-900 whitespace-pre-wrap">{v(field.key)}</span>
                        </div>
                    ) : null
                ))}
                {form.fields.filter(f => f.type === 'image').some(f => img(f.key)) && (
                    <div className="mt-4">
                        <p className="font-bold text-gray-700 mb-3">{ta('الشواهد:', 'Evidence:')}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {form.fields.filter(f => f.type === 'image').map(field =>
                                img(field.key) ? (
                                    <div key={field.key} className="rounded-xl overflow-hidden border border-gray-200">
                                        <img src={img(field.key)} alt={field.label} className="w-full h-40 object-cover" />
                                        <p className="text-xs text-center text-gray-500 py-1">{field.label}</p>
                                    </div>
                                ) : null
                            )}
                        </div>
                    </div>
                )}
                {v('evidence_url') && (
                    <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-700">{ta('رابط الشواهد', 'Evidence Links')}</p>
                            <p className="text-xs text-blue-600 break-all">{v('evidence_url')}</p>
                        </div>
                    </div>
                )}
                {(v('right_signature_title') || v('left_signature_title')) && (
                    <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                        {v('right_signature_title') && (
                            <div className="text-center">
                                <p className="font-bold text-gray-700">{v('right_signature_title')}</p>
                                <p className="text-gray-500 text-xs mt-1">{v('right_signature_name')}</p>
                                <div className="mt-4 border-b border-gray-400 w-24 mx-auto" />
                                <p className="text-xs text-gray-400 mt-1">{ta('التوقيع', 'Signature')}</p>
                            </div>
                        )}
                        {v('left_signature_title') && (
                            <div className="text-center">
                                <p className="font-bold text-gray-700">{v('left_signature_title')}</p>
                                <p className="text-gray-500 text-xs mt-1">{v('left_signature_name')}</p>
                                <div className="mt-4 border-b border-gray-400 w-24 mx-auto" />
                                <p className="text-xs text-gray-400 mt-1">{ta('التوقيع', 'Signature')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== Report Index Dynamic Form =====
function ReportIndexForm({ values, setValue }: { values: Record<string, string>; setValue: (k: string, v: string) => void }) {
    const [count, setCount] = useState(() => {
        // Count existing items
        let c = 1;
        for (let i = 2; i <= 20; i++) { if (values[`item${i}`] !== undefined) c = i; }
        return Math.max(c, 7);
    });

    return (
        <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{ta('ملاحظة', 'Note')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{ta('لا يهم ترتيب العناصر هنا. قم بترقيم الصفحات بالشكل الصحيح وسيتم إعادة ترتيبها بالنموذج', 'Order does not matter here. Number pages correctly and they will be reordered in the form.')}</p>
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{ta('عناصر الفهرس', 'Table of Contents Items')}</p>
            {Array.from({ length: count }, (_, i) => i + 1).map(n => (
                <div key={n} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">العنصر#{n}</span>
                        {n > 1 && (
                            <button onClick={() => { setValue(`item${n}`, ''); setValue(`page${n}`, ''); setCount(c => Math.max(c - 1, 1)); }} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-lg hover:bg-red-600">{ta('حذف', 'Delete')}</button>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">{ta('العنوان:', 'Title:')}</label>
                            <Input placeholder={['المقدمة','الفصل الأول: الإطار النظري','الفصل الثاني: الدراسة التطبيقية','الفصل الثالث: النتائج والتوصيات','الخاتمة','المراجع','الملاحق'][n-1] || `العنصر ${n}`} value={values[`item${n}`] || ''} onChange={e => setValue(`item${n}`, e.target.value)} className="text-sm h-9" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">{ta('رقم الصفحة:', 'Page Number:')}</label>
                            <Input placeholder={['١','٥','١٥','٢٥','٣٥','٤٠','٤٥'][n-1] || ''} value={values[`page${n}`] || ''} onChange={e => setValue(`page${n}`, e.target.value)} className="text-sm h-9" />
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => setCount(c => c + 1)} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                {ta('+ إضافة عنصر جديد', '+ Add New Item')}
            </button>
        </div>
    );
}

// ===== Field Renderer =====
function FieldInput({ field, value, image, onChange, onImage, onRemoveImage }: {
    field: FormField; value: string; image?: string;
    onChange: (v: string) => void; onImage: (f: File) => void; onRemoveImage: () => void;
}) {
    if (field.type === 'textarea') return (
        <Textarea placeholder={field.placeholder} rows={field.rows || 3} value={value}
            onChange={e => onChange(e.target.value)} className="resize-none text-sm" />
    );
    if (field.type === 'image') return (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-primary/50 transition-colors">
            {image ? (
                <div className="relative">
                    <img src={image} alt={field.label} className="w-full h-28 object-cover rounded-lg" />
                    <button onClick={onRemoveImage} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                </div>
            ) : (
                <label className="cursor-pointer">
                    <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{ta('اضغط لرفع صورة', 'Click to Upload Image')}</p>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onImage(e.target.files[0])} />
                </label>
            )}
        </div>
    );
    if (field.type === 'url') return (
        <div className="relative">
            <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input type="url" placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} className="pr-10 text-sm" />
        </div>
    );
    return <Input placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} className="text-sm" />;
}

// ===== Single Form Page =====
function FormPage({ form, onBack }: { form: FormTemplate; onBack: () => void }) {
  const { dir } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);

    const setValue = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));
    const handleImage = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImages(prev => ({ ...prev, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };
    const handleReset = () => { setValues({}); setImages({}); setShowPreview(false); };
    const handleDownload = () => {
        setShowPreview(true);
        toast.success(ta('جاري تحضير الملف للتحميل...', 'Preparing file for download...'));
        setTimeout(() => {
            const previewEl = document.getElementById('form-preview-print');
            if (!previewEl) { window.print(); return; }
            const printWindow = window.open('', '_blank', 'width=800,height=1000');
            if (!printWindow) { window.print(); return; }
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir={dir} lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>${form.title}</title>
                    <style>
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: 'Cairo', 'Segoe UI', sans-serif; direction: rtl; background: white; padding: 0; }
                        @page { margin: 8mm; size: A4; }
                        img { max-width: 100%; display: block; }
                        div { position: static !important; }
                        .sticky { position: static !important; }
                    </style>
                </head>
                <body>
                    ${previewEl.innerHTML}
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }, 600);
    };

    // Group fields for side-by-side layout
    const isAdvanced = form.id === 'program-activity-advanced';

    const renderField = (field: FormField) => (
        <div key={field.key}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
            </label>
            <FieldInput field={field} value={values[field.key] || ''} image={images[field.key]}
                onChange={v => setValue(field.key, v)}
                onImage={f => handleImage(field.key, f)}
                onRemoveImage={() => setImages(p => { const n = {...p}; delete n[field.key]; return n; })} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                {/* Back */}
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-sm">{ta('العودة للنماذج', 'Back to Forms')}</span>
                </button>

                <div className={form.id === 'teacher-visit-exchange' ? 'flex flex-col gap-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}>
                    {/* Form */}
                    <div className="print:hidden">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className={`bg-gradient-to-l ${form.gradient} text-white rounded-t-xl`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <form.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{form.title}</CardTitle>
                                        <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                {form.id === 'program-activity-advanced' ? (
                                    <>
                                        {/* Row 1: إدارة التعليم + اسم المدرسة - textarea واحد */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                            <Textarea
                                                placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')}
                                                rows={3}
                                                value={values.education_school || ''}
                                                onChange={e => setValue('education_school', e.target.value)}
                                                className="resize-y text-sm"
                                            />
                                        </div>
                                        {/* Row 2: اسم البرنامج */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم البرنامج / المبادرة:', 'Program/Initiative Name:')}</label>
                                            <Input placeholder={ta('تقرير الاحتفاء باليوم الوطني ٩٥', 'National Day 95 Celebration Report')} value={values.program_name || ''} onChange={e => setValue('program_name', e.target.value)} className="text-sm" />
                                        </div>
                                        {/* Row 3: المنفذ + المشارك */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المنفذ/ون:', 'Implementer(s):')}</label>
                                                <Input placeholder={ta('جميع منسوبي المدرسة', 'All School Staff')} value={values.implementors || ''} onChange={e => setValue('implementors', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المشاركـ/ون:', 'Participant(s):')}</label>
                                                <Input placeholder={ta('أولياء الأمور', 'Parents / Guardians')} value={values.participants || ''} onChange={e => setValue('participants', e.target.value)} className="text-sm" />
                                            </div>
                                        </div>
                                        {/* Row 4: مكان + مدة + تاريخ */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكان التنفيذ:', 'Location:')}</label>
                                                <Input placeholder={ta('فناء المدرسة', 'School Courtyard')} value={values.location || ''} onChange={e => setValue('location', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مدة التنفيذ:', 'Duration:')}</label>
                                                <Input placeholder={ta('يوم واحد', 'One Day')} value={values.duration || ''} onChange={e => setValue('duration', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('تاريخ التنفيذ:', 'Date:')}</label>
                                                <Input placeholder={ta('١/٤/١٤٤٧هـ', '1/4/1447H')} value={values.date || ''} onChange={e => setValue('date', e.target.value)} className="text-sm" />
                                            </div>
                                        </div>
                                        {/* Row 5: المستفيدون + المجال */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المستفيدون / عددهم:', 'Beneficiaries / Count:')}</label>
                                                <Input placeholder={ta('منسوبي المدرسة / أولياء الأمور', 'School Staff / Parents')} value={values.beneficiaries || ''} onChange={e => setValue('beneficiaries', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المجال:', 'Domain:')}</label>
                                                <Input placeholder={ta('المواطنة', 'Citizenship')} value={values.domain || ''} onChange={e => setValue('domain', e.target.value)} className="text-sm" />
                                            </div>
                                        </div>
                                        {/* Row 6: الأهداف + خطوات التنفيذ جنباً لجنب */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                                <div className="relative">
                                                    <Textarea placeholder={ta('تعزيز الهوية الوطنية والانتماء...', 'Strengthening national identity and belonging...')} rows={5} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm min-h-[120px] ps-8" />
                                                    <div className="absolute left-1 top-2 flex flex-col gap-0.5">
                                                        <button className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] hover:bg-gray-300">▲</button>
                                                        <button className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] hover:bg-gray-300">—</button>
                                                        <button className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] hover:bg-gray-300">▼</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</label>
                                                <Textarea placeholder={ta('١. إذاعة صباحية متنوعة...', '1. Diverse morning broadcast...')} rows={5} value={values.steps || ''} onChange={e => setValue('steps', e.target.value)} className="resize-y text-sm min-h-[120px]" />
                                            </div>
                                        </div>
                                        {/* Row 7: التوقيع الأيمن + الأيسر */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label>
                                                <Textarea
                                                    placeholder={ta('رائد النشاط\nالاسم', 'رائد النشاط\\nالاسم')}
                                                    rows={2}
                                                    value={values.right_signature || ''}
                                                    onChange={e => setValue('right_signature', e.target.value)}
                                                    className="resize-y text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label>
                                                <Textarea
                                                    placeholder={ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title')}
                                                    rows={2}
                                                    value={values.left_signature || ''}
                                                    onChange={e => setValue('left_signature', e.target.value)}
                                                    className="resize-y text-sm"
                                                />
                                            </div>
                                        </div>
                                        {/* Row 8: الصور جنباً لجنب */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {['image1','image2'].map((key, i) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {i === 0 ? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                                    {images[key] ? (
                                                        <div className="relative">
                                                            <img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                                                            <button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0 whitespace-nowrap">{ta('اختيار الملف', 'Choose File')}</span>
                                                            <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Row 9: رابط الشواهد */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج :', 'Add evidence link to generate QR code:')}</label>
                                            <Input
                                                type="url"
                                                placeholder=""
                                                value={values.evidence_url || ''}
                                                onChange={e => setValue('evidence_url', e.target.value)}
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-gray-400 mt-1 text-start">{ta('سيتم إنشاء باركود تلقائياً / حقل غير إلزامي تجاهله إذا كنت لاتريد باركود', 'QR code auto-generated / Optional field - skip if not needed')}</p>
                                        </div>
                                    </>
                                ) : form.id === 'strategy-brief' ? (
                                    <>
                                        {/* إدارة التعليم */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم/المنطقة/مكتب التعليم:', 'Education Dept / Region / Office:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة الشمالية\nمكتب التعليم', 'الإدارة العامة للتعليم\\nبالمنطقة الشمالية\\nمكتب التعليم')} rows={3} value={values.education_dept || ''} onChange={e => setValue('education_dept', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* اسم المدرسة + تاريخ + المادة */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[['school_name','اسم المدرسة:','مدرسة أسامة بن زيد'],['date','تاريخ التنفيذ:','١٤٤٥/١٢/٢٢هـ'],['subject','المادة:','مادة الرياضيات']].map(([k,l,ph]) => (
                                                <div key={k}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label>
                                                    <Input placeholder={ph} value={values[k] || ''} onChange={e => setValue(k, e.target.value)} className="text-sm" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* استراتيجية + عدد المستفيدين + الفرحة */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[['strategy','استراتيجية التعلم:','التعلم المبني على حل المشكلات'],['students_count','عدد المستفيدين:','٣٠ طالب'],['grade','الفرحة الدراسية:','الأول متوسط']].map(([k,l,ph]) => (
                                                <div key={k}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label>
                                                    <Input placeholder={ph} value={values[k] || ''} onChange={e => setValue(k, e.target.value)} className="text-sm" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* الفصل + اسم الدرس */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {[['class','الفصل:','جميع الفصول'],['lesson','اسم الدرس:','المعادلات الخطية']].map(([k,l,ph]) => (
                                                <div key={k}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label>
                                                    <Input placeholder={ph} value={values[k] || ''} onChange={e => setValue(k, e.target.value)} className="text-sm" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* الأهداف */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                            <Textarea placeholder={ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.\n٥. الهدف الخامس.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.\\n٥. الهدف الخامس.')} rows={5} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* اسم المعلم */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المعلم:', 'Teacher Name:')}</label>
                                            <Textarea placeholder={ta('اسم المعلم\nتركي محمد خالد', 'اسم المعلم\\nتركي محمد خالد')} rows={2} value={values.teacher_name || ''} onChange={e => setValue('teacher_name', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* اسم آخر */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم آخر:', 'Last Name:')}</label>
                                            <Textarea placeholder={ta('مدير المدرسة\nسلطان الفيصل', 'مدير المدرسة\\nسلطان الفيصل')} rows={2} value={values.other_name || ''} onChange={e => setValue('other_name', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* حساب تويتر */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('حساب تويتر:', 'Twitter Account:')}</label>
                                            <Input placeholder="@" value={values.twitter || ''} onChange={e => setValue('twitter', e.target.value)} className="text-sm" />
                                        </div>
                                        {/* الوسائل التعليمية */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{ta('الوسائل التعليمية المستخدمة:', 'Teaching Resources Used:')}</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['جهاز عرض','جهاز حاسب','صورة توضيحية','أدوات رياضية','كتاب','أوراق عمل','بطاقات تعليمية','سبورة ذكية','سبورة تقليدية','عرض تقديمي'].map(tool => (
                                                    <label key={tool} className="flex items-center gap-1.5 cursor-pointer">
                                                        <input type="checkbox" checked={values[`tool_${tool}`] === '1'} onChange={e => setValue(`tool_${tool}`, e.target.checked ? '1' : '')} className="accent-emerald-600 w-3.5 h-3.5" />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">{tool}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        {/* الشواهد */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {['image1','image2'].map((key, i) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">الشاهد {i === 0 ? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                                    {images[key] ? (
                                                        <div className="relative">
                                                            <img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                                                            <button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                                                            <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : form.id === 'program-coverage' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم:', 'Education Dept:')}</label>
                                            <Input placeholder={ta('الإدارة العامة للتعليم', 'General Education Department')} value={values.education_dept || ''} onChange={e => setValue('education_dept', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المنطقة:', 'Region:')}</label>
                                            <Input placeholder={ta('بمنطقة', 'in Region')} value={values.region || ''} onChange={e => setValue('region', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكتب التعليم:', 'Education Office:')}</label>
                                            <Input placeholder={ta('مكتب التعليم', 'Education Office')} value={values.edu_office || ''} onChange={e => setValue('edu_office', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم البرنامج:', 'Program Name:')}</label>
                                            <Input placeholder={ta('برنامج التعليم المستمر', 'Continuing Education Program')} value={values.program_name || ''} onChange={e => setValue('program_name', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('تاريخ التنفيذ:', 'Date:')}</label>
                                            <Input placeholder={ta('١٤٤٦/١٢/١٢م', '12/12/1446H')} value={values.date || ''} onChange={e => setValue('date', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المستهدفون:', 'Target Audience:')}</label>
                                            <Input placeholder={ta('الطلاب', 'Students')} value={values.targets || ''} onChange={e => setValue('targets', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المجال:', 'Domain:')}</label>
                                            <Input placeholder={ta('المجال التقني', 'Technical Domain')} value={values.domain || ''} onChange={e => setValue('domain', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                            <Textarea placeholder={ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.\n٥. الهدف الخامس.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.\\n٥. الهدف الخامس.')} rows={5} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ:', 'Implementation Steps:')}</label>
                                            <Textarea placeholder={ta('١. الخطوة الأولى.\n٢. الخطوة الثانية.\n٣. الخطوة الثالثة.\n٤. الخطوة الرابعة.\n٥. الخطوة الخامسة.', '١. الخطوة الأولى.\\n٢. الخطوة الثانية.\\n٣. الخطوة الثالثة.\\n٤. الخطوة الرابعة.\\n٥. الخطوة الخامسة.')} rows={5} value={values.steps || ''} onChange={e => setValue('steps', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {['image1','image2','image3'].map((key, i) => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {['الأول','الثاني','الثالث'][i]}:</label>
                                                {images[key] ? (
                                                    <div className="relative">
                                                        <img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                                                        <button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                                                        <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المعلم/ة:', 'Teacher Name (M/F):')}</label>
                                            <Textarea placeholder={ta('الأستاذ\nمحمد الفيصل\nالمرشد الطلابي\nعبدالله الخالد', 'الأستاذ\\nمحمد الفيصل\\nالمرشد الطلابي\\nعبدالله الخالد')} rows={4} value={values.teacher_name || ''} onChange={e => setValue('teacher_name', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                    </>
                                ) : form.id === 'program-coverage-2' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم المنطقة مكتب التعليم:', 'Education Dept Regional Office:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم ب....', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم ب....')} rows={3} value={values.edu_header || ''} onChange={e => setValue('edu_header', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {[
                                            ['school_name','اسم المدرسة:','مدرسة أسامة بن زيد'],
                                            ['program_name','اسم البرنامج:','اسم البرنامج'],
                                            ['implementors','اسم منفذ البرنامج أو المنفذين:','الأستاذ/ محمد بن خالد والأستاذ/ عبدالله بن سلطان'],
                                            ['location','مكان التنفيذ:','الفصول الدراسية'],
                                            ['targets','المستهدفون:','الطلاب'],
                                            ['targets_count','عدد المستهدفين:','أكثر من ٧٠ طالب'],
                                            ['date','تاريخ التنفيذ:','١٤٤٦/١٢/١٢هـ'],
                                            ['twitter','حساب تويتر (اختياري):','حساب تويتر (اختياري)'],
                                        ].map(([k,l,ph]) => (
                                            <div key={k}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label>
                                                <Input placeholder={ph} value={values[k] || ''} onChange={e => setValue(k, e.target.value)} className="text-sm" />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                            <Textarea placeholder={ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.')} rows={4} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {['image1','image2'].map((key, i) => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {i === 0 ? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                                {images[key] ? (
                                                    <div className="relative">
                                                        <img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                                                        <button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                                                        <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                ) : form.id === 'medical-physics-day' ? (
                                    <>
                                        {/* إدارة التعليم + اسم المدرسة */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={values.edu_school || ''} onChange={e => setValue('edu_school', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* اسم البرنامج */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم البرنامج / المبادرة:', 'Program/Initiative Name:')}</label>
                                            <Input placeholder={ta('اليوم العالمي للفيزياء الطبية ودور ماري كوري', 'World Medical Physics Day and Role of Marie Curie')} value={values.program_name || ''} onChange={e => setValue('program_name', e.target.value)} className="text-sm" />
                                        </div>
                                        {/* المنفذ + المشارك */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المنفذ/ون:', 'Implementer(s):')}</label><Input placeholder={ta('معلمي الفيزياء', 'Physics Teachers')} value={values.implementors || ''} onChange={e => setValue('implementors', e.target.value)} className="text-sm" /></div>
                                        </div>
                                        {/* الأهداف + خطوات التنفيذ */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                                <Textarea placeholder={ta('١. التعرف على أهمية الفيزياء في حياتنا اليومية.\n٢. توضيح دور الفيزياء الطبية في التشخيص والعلاج.', '١. التعرف على أهمية الفيزياء في حياتنا اليومية.\\n٢. توضيح دور الفيزياء الطبية في التشخيص والعلاج.')} rows={5} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</label>
                                                <div className="relative">
                                                    <Textarea placeholder={ta('١. بدأ النشاط بتعريف الطلاب بأهمية الفيزياء الطبية...', '1. The activity began by introducing students to the importance of medical physics...')} rows={5} value={values.steps || ''} onChange={e => setValue('steps', e.target.value)} className="resize-y text-sm ps-8" />
                                                    <div className="absolute left-1 top-2 flex flex-col gap-0.5">
                                                        <button type="button" onClick={() => {
                                                            const lines = (values.steps || '').split('\n');
                                                            if (lines.length < 2) return;
                                                            const last = lines.pop()!;
                                                            lines.splice(lines.length - 1, 0, last);
                                                            setValue('steps', lines.join('\n'));
                                                        }} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▲</button>
                                                        <button type="button" onClick={() => {
                                                            const lines = (values.steps || '').split('\n');
                                                            if (lines.length < 2) return;
                                                            const last = lines.shift()!;
                                                            lines.push(last);
                                                            setValue('steps', lines.join('\n'));
                                                        }} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▼</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* التوقيعات */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label><Textarea placeholder={ta('رائد النشاط\nالاسم', 'رائد النشاط\\nالاسم')} rows={2} value={values.right_signature || ''} onChange={e => setValue('right_signature', e.target.value)} className="resize-y text-sm" /></div>
                                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label><Textarea placeholder={ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم')} rows={2} value={values.left_signature || ''} onChange={e => setValue('left_signature', e.target.value)} className="resize-y text-sm" /></div>
                                        </div>
                                        {/* الصور */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {['image1','image2'].map((key, i) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {i === 0 ? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                                    {images[key] ? (<div className="relative"><img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" /><button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button></div>
                                                    ) : (<label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer"><span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span><span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span><input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} /></label>)}
                                                </div>
                                            ))}
                                        </div>
                                        {/* رابط الشواهد */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج :', 'Add evidence link to generate QR code:')}</label>
                                            <Input type="url" placeholder={ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج', 'Add evidence link to generate QR code')} value={values.evidence_url || ''} onChange={e => setValue('evidence_url', e.target.value)} className="text-sm" />
                                            <p className="text-xs text-gray-400 mt-1 text-start">{ta('سيتم إنشاء باركود تلقائياً / حقل غير إلزامي تجاهله إذا كنت لاتريد باركود', 'QR code auto-generated / Optional field - skip if not needed')}</p>
                                        </div>
                                    </>
                                ) : form.id === 'report-index' ? (
                                    <ReportIndexForm values={values} setValue={setValue} />
                                ) : form.id === 'report-divider' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                {ta('عنوان الفاصل. ضع كل عنوان في سطر، كل مرة تضغط إنتر سيتم إنشاء فاصل جديد:', 'Divider title. Put each title on a line, each Enter creates a new divider:')}
                                            </label>
                                            <Textarea
                                                placeholder={ta('العنصر الأول: أداء الواجبات الوظيفية\nعنوان الفاصل الثاني\nعنوان الفاصل الثالث\nفواصل أخرى', 'العنصر الأول: أداء الواجبات الوظيفية\\nعنوان الفاصل الثاني\\nعنوان الفاصل الثالث\\nفواصل أخرى')}
                                                rows={12}
                                                value={values.dividers || ''}
                                                onChange={e => setValue('dividers', e.target.value)}
                                                className="resize-y text-sm"
                                            />
                                            <p className="text-xs text-gray-400 mt-1 text-start">{ta('يقبل من 1 إلى 20 عنوان دفعة واحدة فقط ضع كل عنوان في سطر', 'Accepts 1 to 20 titles at once. Put each title on a separate line.')}</p>
                                        </div>
                                    </>
                                ) : form.id === 'report-cover' || form.id === 'report-cover-landscape' ? (
                                    <>
                                        {[
                                            ['title','العنوان:','عنوان الملف\nيتكون من سطرين',2],
                                            ['school_name','اسم المدرسة:','اسم المدرسة\nيتكون من سطرين',2],
                                            ['author','اسم معد الملف:','إعداد المعلم\nاسم المعلم',2],
                                        ].map(([k,l,ph,rows]) => (
                                            <div key={k as string}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l as string}</label>
                                                <Textarea placeholder={ph as string} rows={rows as number} value={values[k as string] || ''} onChange={e => setValue(k as string, e.target.value)} className="resize-y text-sm" />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('التاريخ:', 'Date:')}</label>
                                            <Input placeholder={ta('عام ١٤٤٦هـ', 'Year 1446H')} value={values.year || ''} onChange={e => setValue('year', e.target.value)} className="text-sm" />
                                        </div>
                                    </>
                                ) : form.id === 'report-sub-cover' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('العنوان:', 'Title:')}</label>
                                            <Textarea placeholder={ta('القسم الأول\nغاية التعليم وأهدافه العامة:', 'القسم الأول\\nغاية التعليم وأهدافه العامة:')} rows={2} value={values.title || ''} onChange={e => setValue('title', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المحتوى:', 'Content:')}</label>
                                            <Textarea placeholder={ta('تعزيز مشاركة الأسرة في التحضير لمستقبل أبنائهم. بناء رحلة تعليمية متكاملة...', "Strengthening family participation in preparing for their children's future...")} rows={6} value={values.content || ''} onChange={e => setValue('content', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                    </>
                                ) : form.id === 'evidence-appendix' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم المنطقة مكتب التعليم:', 'Education Dept Regional Office:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم')} rows={3} value={values.edu_header || ''} onChange={e => setValue('edu_header', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('العنوان:', 'Title:')}</label>
                                            <Input placeholder={ta('ملحق شواهد برنامج', 'Program Evidence Appendix')} value={values.title || ''} onChange={e => setValue('title', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('حساب تويتر:', 'Twitter Account:')}</label>
                                            <Input placeholder="" value={values.twitter || ''} onChange={e => setValue('twitter', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{ta('صور الشواهد:', 'Evidence Images:')}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['image1','image2','image3','image4','image5','image6'].map((key, i) => (
                                                    <div key={key}>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {['الأول','الثاني','الثالث','الرابع','الخامس','السادس'][i]}:</label>
                                                        {images[key] ? (
                                                            <div className="relative">
                                                                <img src={images[key]} alt="" className="w-full h-24 object-cover rounded-lg border" />
                                                                <button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                                            </div>
                                                        ) : (
                                                            <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                                                                <span className="text-xs text-gray-400 px-2 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                                                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} />
                                                            </label>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : form.id === 'program-coverage-4a' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم المنطقة مكتب التعليم:', 'Education Dept Regional Office:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم')} rows={3} value={values.edu_header || ''} onChange={e => setValue('edu_header', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {[['school_name','اسم المدرسة:','مدرسة أسامة بن زيد'],['program_name','اسم البرنامج:','اسم البرنامج'],['implementors','اسم منفذ البرنامج أو المنفذين:','المعلم/ خالد التركي والمعلم/ سلطان الشهد'],['location','مكان التنفيذ:','الفصول الدراسية'],['targets','المستهدفون:','الطلاب'],['targets_count','عدد المستهدفين:','أكثر من ٧٠ طالب'],['date','تاريخ التنفيذ:','١٤٤٦/١٢/١٢هـ'],['twitter','حساب تويتر (اختياري):','حساب تويتر (اختياري)']].map(([k,l,ph]) => (
                                            <div key={k}><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label><Input placeholder={ph} value={values[k] || ''} onChange={e => setValue(k, e.target.value)} className="text-sm" /></div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                            <div className="relative">
                                                <Textarea placeholder={ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.')} rows={4} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm ps-8" />
                                                <div className="absolute left-1 top-2 flex flex-col gap-0.5">
                                                    <button className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▲</button>
                                                    <button className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▼</button>
                                                </div>
                                            </div>
                                        </div>
                                        {['image1','image2','image3','image4'].map((key, i) => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {['الأول','الثاني','الثالث','الرابع'][i]}:</label>
                                                {images[key] ? (<div className="relative"><img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" /><button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button></div>
                                                ) : (<label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer"><span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span><span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span><input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} /></label>)}
                                            </div>
                                        ))}
                                    </>
                                ) : form.id === 'program-coverage-4b' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم المنطقة مكتب التعليم:', 'Education Dept Regional Office:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبمنطقة\nمكتب التعليم', 'الإدارة العامة للتعليم\\nبمنطقة\\nمكتب التعليم')} rows={3} value={values.edu_header || ''} onChange={e => setValue('edu_header', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {[['school_name','اسم المدرسة:','مدرسة أسامة بن زيد'],['program_name','اسم البرنامج:','اسم البرنامج'],['domain','مجال البرنامج:','النشاط الثقافي'],['implementors','اسم منفذ البرنامج أو المنفذين:','المعلم/ خالد التركي والمعلم/ سلطان الشهد'],['location','مكان التنفيذ:','الفصول الدراسية'],['targets','المستهدفون:','الطلاب'],['targets_count','عدد المستهدفين:','أكثر من ٧٠ طالب'],['date','تاريخ التنفيذ:','١٤٤٦/١٢/١٢هـ'],['twitter','حساب تويتر (اختياري):','حساب تويتر (اختياري)']].map(([k,l,ph]) => (
                                            <div key={k}><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label><Input placeholder={ph} value={values[k] || ''} onChange={e => setValue(k, e.target.value)} className="text-sm" /></div>
                                        ))}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ:', 'Implementation Steps:')}</label>
                                            <Textarea placeholder={ta('١. عمل اجتماعات للتحضير للبرنامج.\n٢. تسليم جوائز المسابقة.\n٣. عرض مرئي وإذاعي.\n٤. عقد ورشة عمل.', '١. عمل اجتماعات للتحضير للبرنامج.\\n٢. تسليم جوائز المسابقة.\\n٣. عرض مرئي وإذاعي.\\n٤. عقد ورشة عمل.')} rows={4} value={values.steps || ''} onChange={e => setValue('steps', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                            <Textarea placeholder={ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.')} rows={4} value={values.objectives || ''} onChange={e => setValue('objectives', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {['image1','image2','image3','image4'].map((key, i) => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {['الأول','الثاني','الثالث','الرابع'][i]}:</label>
                                                {images[key] ? (<div className="relative"><img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" /><button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button></div>
                                                ) : (<label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer"><span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span><span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span><input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} /></label>)}
                                            </div>
                                        ))}
                                    </>
                                ) : form.id === 'teacher-visit-exchange' ? (
                                    <>
                                        {/* إدارة التعليم */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                            <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={values.edu_school || ''} onChange={e => setValue('edu_school', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* أسماء المعلمين الزائرين */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أسماء المعلمين الزائرين:', 'Visiting Teachers:')}</label>
                                            <Textarea placeholder={ta('اسم المعلم الأول\nاسم المعلم الثاني\nاسم المعلم الثالث', 'اسم المعلم الأول\\nاسم المعلم الثاني\\nاسم المعلم الثالث')} rows={3} value={values.visiting_teachers || ''} onChange={e => setValue('visiting_teachers', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* اسم المعلم + المادة + اليوم والتاريخ */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المعلم/ة المُقَرَّر/ة:', 'Assigned Teacher Name (M/F):')}</label>
                                                <Input placeholder={ta('اسم المعلم', 'Teacher Name')} value={values.visited_teacher || ''} onChange={e => setValue('visited_teacher', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المادة:', 'Subject:')}</label>
                                                <Input placeholder={ta('مادة', 'Subject')} value={values.subject || ''} onChange={e => setValue('subject', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اليوم والتاريخ:', 'Day and Date:')}</label>
                                                <Input placeholder={ta('الأحد - 1447/12/3هـ', 'Sunday - 3/12/1447H')} value={values.visit_date || ''} onChange={e => setValue('visit_date', e.target.value)} className="text-sm" />
                                            </div>
                                        </div>
                                        {/* الصف + الفصل الدراسي */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الصف / الفصل:', 'Grade / Class:')}</label>
                                                <Input placeholder={ta('الصف', 'Grade')} value={values.class_grade || ''} onChange={e => setValue('class_grade', e.target.value)} className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الفصل الدراسي:', 'Semester:')}</label>
                                                <Input placeholder={ta('الأول', 'First')} value={values.semester || ''} onChange={e => setValue('semester', e.target.value)} className="text-sm" />
                                            </div>
                                        </div>
                                        {/* الوحدة وعنوان الدرس */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الوحدة وعنوان الدرس:', 'Unit & Lesson Title:')}</label>
                                            <Textarea placeholder={ta('عنوان الدرس', 'Lesson Title')} rows={2} value={values.unit_lesson || ''} onChange={e => setValue('unit_lesson', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* أهداف الزيارة */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أهداف الزيارة:', 'Visit Objectives:')}</label>
                                            <Textarea placeholder={ta('أ. تبادل الخبرات التربوية بين المعلمين.\nب. الاطلاع على أساليب واستراتيجيات التدريس المختلفة.\nج. تحسين الأداء التدريسي من خلال الاستفادة من الممارسات الناجحة.\nد. تعزيز التعاون والتواصل بين المعلمين في بيئة العمل.\nهـ. متابعة طرق تفاعل الطلاب مع الدروس واستراتيجيات التقييم.', 'أ. تبادل الخبرات التربوية بين المعلمين.\\nب. الاطلاع على أساليب واستراتيجيات التدريس المختلفة.\\nج. تحسين الأداء التدريسي من خلال الاستفادة من الممارسات الناجحة.\\nد. تعزيز التعاون والتواصل بين المعلمين في بيئة العمل.\\nهـ. متابعة طرق تفاعل الطلاب مع الدروس واستراتيجيات التقييم.')} rows={5} value={values.visit_goals || ''} onChange={e => setValue('visit_goals', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        {/* اسم المدير */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المدير/ة:', 'Principal Name (M/F):')}</label>
                                            <Textarea placeholder={ta('مدير المدرسة\nاسم المدير', 'مدير المدرسة\\nاسم المدير')} rows={2} value={values.principal_name || ''} onChange={e => setValue('principal_name', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                    </>
                                ) : (
                                    // Default layout for other forms
                                    form.fields.map(field => renderField(field))
                                )}

                                {/* Actions */}
                                <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex gap-2">
                                        <Button onClick={() => setShowPreview(true)} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                            <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                        </Button>
                                        <Button onClick={handleReset} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                            <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                        </Button>
                                    </div>
                                    <Button onClick={handleDownload} className={`w-full gap-2 bg-gradient-to-l ${form.gradient} text-white border-0 text-sm`}>
                                        <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview */}
                    <div className="print:block">
                        <div className={form.id === 'teacher-visit-exchange' ? '' : 'sticky top-24'}>
                            {form.id === 'teacher-visit-exchange' && (showPreview || Object.keys(values).length > 0) ? (() => {
                                const visitingTeachers = (values.visiting_teachers || '').split('\n').filter(l => l.trim());
                                const pageCount = 1 + (visitingTeachers.length || 1);
                                const downloadImg = async (id: string, name: string) => {
                                    const el = document.getElementById(id);
                                    if (!el) return;
                                    const tid = toast.loading(ta('جاري التحضير...', 'Preparing...'));
                                    const { default: html2canvas } = await import('html2canvas');
                                    const canvas = await html2canvas(el, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
                                    const link = document.createElement('a');
                                    link.download = `${name}.png`;
                                    link.href = canvas.toDataURL('image/png');
                                    link.click();
                                    toast.dismiss(tid);
                                    toast.success(ta('تم التحميل', 'Loaded'));
                                };
                                const downloadAll = async () => {
                                    const tid = toast.loading(ta('جاري تحضير الصفحات...', 'Preparing pages...'));
                                    const { default: html2canvas } = await import('html2canvas');
                                    const { default: jsPDF } = await import('jspdf');
                                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                                    const pdfW = pdf.internal.pageSize.getWidth();
                                    const pdfH = pdf.internal.pageSize.getHeight();
                                    const ids = [`vx-page-0`, ...Array.from({ length: visitingTeachers.length || 1 }, (_, i) => `vx-page-${i + 1}`)];
                                    for (let i = 0; i < ids.length; i++) {
                                        const el = document.getElementById(ids[i]);
                                        if (!el) continue;
                                        if (i > 0) pdf.addPage();
                                        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                        const imgH = (canvas.height * pdfW) / canvas.width;
                                        const fH = imgH > pdfH ? pdfH : imgH;
                                        const fW = imgH > pdfH ? (canvas.width * pdfH) / canvas.height : pdfW;
                                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imgH > pdfH ? (pdfW - fW) / 2 : 0, 0, fW, fH);
                                    }
                                    pdf.save('استمارة-تبادل-الزيارات.pdf');
                                    toast.dismiss(tid);
                                    toast.success(ta('تم التحميل', 'Loaded'));
                                };
                                return (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> عدد الصفحات: {pageCount}
                                            </p>
                                            <Button onClick={downloadAll} className="gap-2 text-white text-xs h-8 px-3" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                                <Download className="w-3 h-3" /> {ta('تحميل الكل PDF', 'Download All PDF')}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* صفحة 1: تقرير الزيارات */}
                                            <div className="flex flex-col gap-2">
                                                <div id="vx-page-0" className="rounded overflow-hidden shadow">
                                                    <FormPreview form={form} values={{ ...values, _page: '0' }} images={images} />
                                                </div>
                                                <p className="text-center text-xs font-bold text-gray-600">{ta('صفحة 1', 'Page 1')}</p>
                                                <Button onClick={() => downloadImg('vx-page-0', 'تقرير-الزيارات-التبادلية')} className="w-full gap-1 text-white text-xs h-8" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                                    <Download className="w-3 h-3" /> {ta('تحميل الصورة', 'Upload Image')}
                                                </Button>
                                            </div>
                                            {/* صفحة لكل معلم زائر */}
                                            {(visitingTeachers.length > 0 ? visitingTeachers : ['']).map((teacher, i) => (
                                                <div key={i} className="flex flex-col gap-2">
                                                    <div id={`vx-page-${i + 1}`} className="rounded overflow-hidden shadow">
                                                        <FormPreview form={form} values={{ ...values, _page: String(i + 1), _teacher: teacher }} images={images} />
                                                    </div>
                                                    <p className="text-center text-xs font-bold text-gray-600">صفحة {i + 2}</p>
                                                    <Button onClick={() => downloadImg(`vx-page-${i + 1}`, `استمارة-${teacher || 'معلم'}`)} className="w-full gap-1 text-white text-xs h-8" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                                        <Download className="w-3 h-3" /> {ta('تحميل الصورة', 'Upload Image')}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })() : (
                            <div>
                            <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {ta('معاينة مباشرة', 'Live Preview')}
                            </p>
                            {showPreview || Object.keys(values).length > 0 || Object.keys(images).length > 0 ? (
                                <div id="form-preview-print">
                                    <FormPreview form={form} values={values} images={images} />
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">{ta('ابدأ بملء الحقول لرؤية المعاينة', 'Start filling in the fields to see preview')}</p>
                                </div>
                            )}
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

// ===== Main Page =====
export default function DocumentationFormsPage() {
    const { dir } = useTranslation();
    const { forms: dynamicForms } = useFirestoreForms('documentation-forms', FORMS);
    const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);

    if (selectedForm) {
        return <FormPage form={selectedForm} onBack={() => setSelectedForm(null)} />;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
            <Navbar />
            <main>
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-blue-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-blue-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-indigo-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                                <ClipboardList className="w-4 h-4 text-blue-400" />
                                {ta('نماذج وتقارير التوثيق', 'Documentation Forms & Reports')}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                                {ta('نماذج وتقارير التوثيق', 'Documentation Forms & Reports')}
                            </h1>
                            <p className="text-lg text-white/70 mb-6">
                                {ta('مجموعة شاملة من النماذج والتقارير الجاهزة لتوثيق الفعاليات والبرامج والدروس التعليمية', 'A comprehensive collection of ready-made forms and reports for documenting events, programs, and lessons')}
                            </p>
                            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{dynamicForms.length} نموذج جاهز</span>
                                <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF مجاني', 'Free PDF Download')}</span>
                                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Forms Grid */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dynamicForms.map(form => (
                            <Card
                                key={form.id}
                                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800"
                                onClick={() => setSelectedForm(form)}
                            >
                                <div className={`h-2 bg-gradient-to-l ${form.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <form.icon className="w-6 h-6" />
                                        </div>
                                        {form.badge && (
                                            <Badge className="bg-amber-500 text-white text-xs">{form.badge}</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                        {form.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1">
                                        {form.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{form.fields.filter(f => f.type !== 'image').length} حقل نصي</span>
                                        {form.fields.some(f => f.type === 'image') && (
                                            <>
                                                <span>•</span>
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                <span>{form.fields.filter(f => f.type === 'image').length} صورة</span>
                                            </>
                                        )}
                                    </div>
                                    <Button className={`w-full bg-gradient-to-l ${form.gradient} text-white border-0 hover:opacity-90 gap-2`}>
                                        <Eye className="w-4 h-4" />
                                        {ta('ابدأ التصميم', 'Start Design')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />

            {/* Print styles */}
            <style>{`
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    body > *:not(#print-root) { display: none !important; }
                    nav, footer, button, [role="status"], .Toaster, .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .sticky { position: static !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .print-preview-only { display: block !important; }
                    #print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; background: white; }
                }
            `}</style>
        </div>
    );
}
