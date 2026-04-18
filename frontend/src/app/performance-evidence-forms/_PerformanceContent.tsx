'use client';

import { useState, useEffect } from 'react';
import { useFirestoreSections } from '@/hooks/useFirestoreSections';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ClipboardCheck, Eye, Download, RotateCcw,
    Image as ImageIcon, ChevronRight, Layers, Sparkles, Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { useAIFieldFill } from '@/hooks/useAIFieldFill';

// ===== الأقسام الثمانية من الصورة =====
interface Section {
    id: string;
    title: string;
    description: string;
    gradient: string;
    badge?: string;
    forms: FormDef[];
}

interface FormDef {
    id: string;
    title: string;
    description?: string;
    gradient?: string;
    href?: string;
    fields: FieldDef[];
}

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image';
    placeholder?: string;
    rows?: number;
    required?: boolean;
}

const SECTIONS: Section[] = [
    {
        id: 'job-duties',
        title: ta('١. أداء الواجبات الوظيفية', '1. Job Duties Performance'),
        description: ta('نماذج الإذاعة المدرسية والأنشطة والمهام الوظيفية والمبادرات والبيئة المدرسية والأيام العالمية', 'School broadcast, activities, job duties, initiatives, environment & international days'),
        gradient: 'from-blue-600 to-blue-700',
        badge: ta('بند ١', 'Item 1'),
        forms: [
            // — نماذج المهام الوظيفية —
            { id: 'go-to-job-duties', title: ta('📋 نماذج المهام الوظيفية', '📋 Job Duties Forms'), description: ta('الإذاعة المدرسية والأنشطة اللاصفية وحصص الانتظار', 'School broadcast, extracurricular activities, substitute lessons'), gradient: 'from-blue-600 to-blue-700', href: '/job-duties-forms', fields: [] },
            // — المبادرات المدرسية —
            { id: 'go-to-initiatives', title: ta('✨ المبادرات المدرسية', '✨ School Initiatives'), description: ta('نماذج توثيق المبادرات المدرسية والبرامج التعليمية', 'School initiatives documentation'), gradient: 'from-pink-600 to-rose-700', href: '/school-initiatives', fields: [] },
            // — البيئة المدرسية —
            { id: 'go-to-environment', title: ta('🏫 البيئة المدرسية', '🏫 School Environment'), description: ta('نماذج تهيئة البيئة المدرسية للبرامج والأنشطة', 'School environment preparation'), gradient: 'from-lime-600 to-green-700', href: '/school-environment', fields: [] },
            // — الأيام العالمية والمناسبات —
            { id: 'saudi-science-day', title: ta('تقرير يوم العلم السعودي', 'Saudi Science Day Report'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'gulf-talent-day', title: ta('تقرير اليوم الخليجي للموهبة والإبداع', 'Gulf Talent Day Report'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
            { id: 'foundation-day', title: ta('تقرير يوم التأسيس', 'Founding Day Report'), gradient: 'from-green-700 to-emerald-800', fields: [] },
            { id: 'education-day', title: ta('تقرير اليوم العالمي للتعليم', 'International Education Day Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'arabic-language-day', title: ta('تقرير اليوم العالمي للغة العربية', 'Arabic Language Day Report'), gradient: 'from-rose-600 to-pink-700', fields: [] },
            { id: 'child-day', title: ta('تقرير اليوم العالمي للطفل', "Children's Day Report"), gradient: 'from-cyan-600 to-blue-700', fields: [] },
            { id: 'tolerance-day', title: ta('اليوم العالمي للتسامح', 'Tolerance Day'), gradient: 'from-purple-600 to-violet-700', fields: [] },
            { id: 'diabetes-day', title: ta('اليوم العالمي للسكري', 'World Diabetes Day'), gradient: 'from-sky-600 to-blue-700', fields: [] },
            { id: 'disability-day', title: ta('اليوم العالمي لذوي الإعاقة', 'Disability Day'), gradient: 'from-teal-600 to-cyan-700', fields: [] },
        ],
    },
    {
        id: 'professional-community',
        title: ta('٢. التفاعل مع المجتمع المهني', '2. Professional Community Interaction'),
        description: ta('استمارات وتقارير مجتمعات التعلم المهنية وتبادل الزيارات والاجتماعات المهنية', 'Professional learning community forms, reports, and peer visit exchanges'),
        gradient: 'from-indigo-600 to-blue-700',
        badge: ta('بند ٢', 'Item 2'),
        forms: [
            {
                id: 'plc-meeting-report', title: ta('تقرير اجتماع مجتمع التعلم المهني', 'PLC Meeting Report'),
                description: ta('توثيق اجتماعات مجتمعات التعلم المهنية', 'Document professional learning community meetings'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
                    { key: 'meeting_date', label: ta('تاريخ الاجتماع', 'Meeting Date'), type: 'text', placeholder: ta('تاريخ الاجتماع', 'Meeting Date') },
                    { key: 'meeting_number', label: ta('رقم الاجتماع', 'Meeting Number'), type: 'text', placeholder: ta('١', '1') },
                    { key: 'attendees', label: ta('الحاضرون', 'Attendees'), type: 'textarea', rows: 3, placeholder: ta('أسماء الحاضرين...', 'Attendees names...') },
                    { key: 'agenda', label: ta('محاور الاجتماع', 'Agenda'), type: 'textarea', rows: 4, placeholder: ta('محاور النقاش في الاجتماع...', 'Discussion agenda...') },
                    { key: 'decisions', label: ta('القرارات والتوصيات', 'Decisions & Recommendations'), type: 'textarea', rows: 3, placeholder: ta('القرارات المتخذة...', 'Decisions taken...') },
                    { key: 'image1', label: ta('صورة الشاهد', 'Evidence Image'), type: 'image', required: true },
                ],
            },
            {
                id: 'peer-visit-report', title: ta('تقرير تبادل الزيارات الصفية', 'Peer Classroom Visit Report'),
                description: ta('توثيق تبادل الزيارات بين المعلمين', 'Document peer classroom visits between teachers'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'visitor', label: ta('المعلم الزائر', 'Visiting Teacher'), type: 'text', placeholder: ta('اسم المعلم الزائر', 'Visiting Teacher Name'), required: true },
                    { key: 'visited', label: ta('المعلم المُزار', 'Visited Teacher'), type: 'text', placeholder: ta('اسم المعلم المُزار', 'Visited Teacher Name'), required: true },
                    { key: 'date', label: ta('تاريخ الزيارة', 'Visit Date'), type: 'text', placeholder: ta('تاريخ الزيارة', 'Visit Date') },
                    { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
                    { key: 'strengths', label: ta('نقاط القوة', 'Strengths'), type: 'textarea', rows: 3, placeholder: ta('نقاط القوة الملاحظة...', 'Observed strengths...') },
                    { key: 'improvements', label: ta('نقاط التحسين', 'Areas for Improvement'), type: 'textarea', rows: 3, placeholder: ta('نقاط التحسين المقترحة...', 'Suggested improvements...') },
                    { key: 'image1', label: ta('صورة الشاهد', 'Evidence Image'), type: 'image', required: true },
                ],
            },
        ],
    },
    {
        id: 'parents-interaction',
        title: ta('٣. التفاعل مع أولياء الأمور', '3. Parents Interaction'),
        description: ta('توثيق التواصل مع أولياء الأمور — تقارير الاجتماعات والرسائل والمتابعة', 'Documenting parent communication — meetings, messages, and follow-up reports'),
        gradient: 'from-teal-600 to-emerald-600',
        badge: ta('بند ٣', 'Item 3'),
        forms: [
            {
                id: 'parents-comm-report', title: ta('تقرير التواصل مع أولياء الأمور', 'Parent Communication Report'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
                    { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
                    { key: 'period', label: ta('الفترة الزمنية', 'Time Period'), type: 'text', placeholder: ta('الفترة الزمنية للتواصل', 'Communication Period') },
                    { key: 'communication_type', label: ta('نوع التواصل', 'Communication Type'), type: 'text', placeholder: ta('رسائل / اجتماعات / مكالمات', 'Messages / Meetings / Calls') },
                    { key: 'parents_count', label: ta('عدد أولياء الأمور', 'Number of Parents'), type: 'text', placeholder: ta('عدد أولياء الأمور المتواصل معهم', 'Number of Parents Communicated With') },
                    { key: 'topics', label: ta('موضوعات التواصل', 'Communication Topics'), type: 'textarea', rows: 3, placeholder: ta('موضوعات التواصل...', 'Communication topics...') },
                    { key: 'image1', label: ta('صورة الشاهد', 'Evidence Image'), type: 'image', required: true },
                ],
            },
            {
                id: 'first-meeting-report', title: ta('تقرير الاجتماع الأول لأولياء الأمور', 'First Parent Meeting Report'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
                    { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
                    { key: 'date', label: ta('تاريخ الاجتماع', 'Meeting Date'), type: 'text', placeholder: ta('تاريخ الاجتماع', 'Meeting Date') },
                    { key: 'attendees_count', label: ta('عدد الحاضرين', 'Number of Present'), type: 'text', placeholder: ta('عدد أولياء الأمور الحاضرين', 'Number of Parents Present') },
                    { key: 'agenda', label: ta('محاور الاجتماع', 'Meeting Themes'), type: 'textarea', rows: 4, placeholder: ta('محاور الاجتماع...', 'Meeting themes...') },
                    { key: 'decisions', label: ta('القرارات والتوصيات', 'Decisions and Recommendations'), type: 'textarea', rows: 3, placeholder: ta('القرارات والتوصيات...', 'Decisions and recommendations...') },
                    { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image', required: true },
                    { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
                ],
            },
        ],
    },
    {
        id: 'strategies',
        title: ta('٤. التنويع في استراتيجيات التدريس', '4. Teaching Strategies Diversification'),
        description: ta('تقارير تنفيذ استراتيجيات تعليمية متنوعة — فكر زاوج شارك، التعلم التعاوني، الفصل المقلوب وغيرها', 'Various teaching strategy implementation reports'),
        gradient: 'from-amber-600 to-orange-600',
        badge: ta('بند ٤', 'Item 4'),
        forms: [
            { id: 'strategy-teacher', title: ta('تنفيذ استراتيجية تعليمية (الطالب المعلم)', 'Teaching Strategy (Student as Teacher)'), description: ta('تقرير تنفيذ استراتيجية الطالب المعلم', 'Student as Teacher Strategy Report'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'strategy-small', title: ta('تنفيذ استراتيجية تعليمية (المعلم الصغير)', 'Teaching Strategy (Little Teacher)'), description: ta('تقرير تنفيذ استراتيجية المعلم الصغير', 'Little Teacher Strategy Report'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
            { id: 'strategy-single', title: ta('تنفيذ استراتيجية تعليمية (الدقيقة الواحدة)', 'Teaching Strategy (One Minute)'), description: ta('تقرير تنفيذ استراتيجية الدقيقة الواحدة', 'One Minute Strategy Report'), gradient: 'from-violet-600 to-purple-700', fields: [] },
            { id: 'strategy-cooperative', title: ta('تنفيذ استراتيجية (التعليم التعاوني)', 'Teaching Strategy (Cooperative Learning)'), description: ta('تقرير تنفيذ استراتيجية التعليم التعاوني', 'Cooperative Learning Strategy Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'strategy-self', title: ta('تنفيذ استراتيجية (التعليم الذاتي)', 'Teaching Strategy (Self-Learning)'), description: ta('تقرير تنفيذ استراتيجية التعليم الذاتي', 'Self-Learning Strategy Report'), gradient: 'from-rose-600 to-pink-700', fields: [] },
            { id: 'strategy-discovery', title: ta('تنفيذ استراتيجية (التعلم بالتجربة والاكتشاف)', 'Teaching Strategy (Discovery Learning)'), description: ta('تقرير تنفيذ استراتيجية التعلم بالتجربة والاكتشاف', 'Discovery Learning Strategy Report'), gradient: 'from-cyan-600 to-blue-700', fields: [] },
            { id: 'strategy-jigsaw', title: ta('تنفيذ استراتيجية (نموذج فرازير)', 'Strategy (Frayer Model)'), description: ta('تقرير تنفيذ استراتيجية نموذج فرازير', 'Frayer Model Strategy Report'), gradient: 'from-teal-600 to-emerald-700', fields: [] },
            { id: 'strategy-flipped', title: ta('تنفيذ استراتيجية (الفصل المقلوب)', 'Strategy (Flipped Classroom)'), description: ta('تقرير تنفيذ استراتيجية الفصل المقلوب', 'Flipped Classroom Strategy Report'), gradient: 'from-indigo-600 to-violet-700', fields: [] },
            { id: 'strategy-think-pair', title: ta('تنفيذ استراتيجية (فكر - زاوج - شارك)', 'Strategy (Think-Pair-Share)'), description: ta('تقرير تنفيذ استراتيجية فكر زاوج شارك', 'Think-Pair-Share Strategy Report'), gradient: 'from-green-600 to-emerald-700', fields: [] },
            { id: 'strategy-hot-seat', title: ta('تنفيذ استراتيجية (الكرسي الساخن)', 'Strategy (Hot Seat)'), description: ta('تقرير تنفيذ استراتيجية الكرسي الساخن', 'Hot Seat Strategy Report'), gradient: 'from-red-600 to-rose-700', fields: [] },
            { id: 'strategy-kwl', title: ta('تنفيذ استراتيجية (جدول التعلم K.W.L)', 'Strategy (K.W.L Chart)'), description: ta('تقرير تنفيذ استراتيجية جدول التعلم KWL', 'K.W.L Chart Strategy Report'), gradient: 'from-blue-500 to-cyan-600', fields: [] },
            { id: 'strategy-roles', title: ta('تنفيذ استراتيجية (لعب الأدوار)', 'Strategy (Role Play)'), description: ta('تقرير تنفيذ استراتيجية لعب الأدوار', 'Role Play Strategy Report'), gradient: 'from-pink-600 to-rose-700', fields: [] },
            { id: 'strategy-mind-map', title: ta('تنفيذ استراتيجية (المصفد الذهني)', 'Strategy (Mind Map)'), description: ta('تقرير تنفيذ استراتيجية المصفد الذهني', 'Mind Map Strategy Report'), gradient: 'from-amber-500 to-yellow-600', fields: [] },
            { id: 'strategy-gallery', title: ta('تنفيذ استراتيجية (جولة المعرض)', 'Strategy (Gallery Walk)'), description: ta('تقرير تنفيذ استراتيجية جولة المعرض', 'Gallery Walk Strategy Report'), gradient: 'from-teal-500 to-cyan-600', fields: [] },
            { id: 'strategy-six-hats', title: ta('تنفيذ استراتيجية (القبعات الست للتفكير)', 'Strategy (Six Thinking Hats)'), description: ta('تقرير تنفيذ استراتيجية القبعات الست', 'Six Thinking Hats Strategy Report'), gradient: 'from-violet-500 to-purple-600', fields: [] },
            { id: 'strategy-problem', title: ta('تنفيذ استراتيجية (حل المشكلات)', 'Strategy (Problem Solving)'), description: ta('تقرير تنفيذ استراتيجية حل المشكلات', 'Problem Solving Strategy Report'), gradient: 'from-emerald-500 to-green-600', fields: [] },
            { id: 'strategy-gamification', title: ta('تنفيذ استراتيجية (التعلم باللعب)', 'Strategy (Gamification)'), description: ta('تقرير تنفيذ استراتيجية التعلم باللعب', 'Gamification Strategy Report'), gradient: 'from-orange-600 to-amber-700', fields: [] },
            { id: 'strategy-story', title: ta('تنفيذ استراتيجية (القصة التعليمية)', 'Strategy (Educational Story)'), description: ta('تقرير تنفيذ استراتيجية القصة التعليمية', 'Educational Story Strategy Report'), gradient: 'from-rose-500 to-pink-600', fields: [] },
        ],
    },
    {
        id: 'improve-results',
        title: ta('٥. تحسين نتائج المتعلمين', '5. Improving Learner Results'),
        description: ta('أدوات وخطط لتحسين نتائج الطلاب وقياس أثر التدخلات التعليمية', 'Tools and plans for improving student results and measuring educational interventions impact'),
        gradient: 'from-green-600 to-emerald-700',
        badge: ta('بند ٥', 'Item 5'),
        forms: [
            {
                id: 'go-to-improve-results', title: ta('عرض خطط تحسين النتائج', 'View Results Improvement Plans'),
                description: ta('اضغط لفتح صفحة تحسين النتائج', 'Click to open the improve results page'),
                fields: [],
            },
        ],
    },
    {
        id: 'learning-plan',
        title: ta('٦. إعداد وتنفيذ خطة التعلم', '6. Preparing & Implementing Learning Plans'),
        description: ta('إنشاء الخطط التعليمية العلاجية والإثرائية وتوزيع المنهج', 'Create educational, remedial, and enrichment plans'),
        gradient: 'from-emerald-600 to-green-700',
        badge: ta('بند ٦', 'Item 6'),
        forms: [
            {
                id: 'go-to-plans', title: ta('عرض الخطط التعليمية', 'View Educational Plans'),
                description: ta('اضغط لفتح صفحة الخطط التعليمية', 'Click to open the educational plans page'),
                fields: [],
            },
        ],
    },
    {
        id: 'technical',
        title: ta('٧. توظيف تقنيات ووسائل التعلم المناسبة', '7. Utilizing Learning Technologies'),
        description: ta('تقارير استخدام البرامج والأدوات التقنية والوسائل التعليمية في التدريس', 'Reports on using technology programs, tools, and teaching aids'),
        gradient: 'from-cyan-600 to-teal-700',
        badge: ta('بند ٧', 'Item 7'),
        forms: [
            { id: 'teams-madrasati', title: ta('تقرير تفعيل درس عن بُعد باستخدام مدرستي وتيمز', 'Remote lesson using Madrasati & Teams'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'padlet', title: ta('تقرير استخدام Padlet', 'Padlet Usage Report'), gradient: 'from-orange-500 to-red-600', fields: [] },
            { id: 'telegram', title: ta('تقرير استخدام Telegram', 'Telegram Usage Report'), gradient: 'from-sky-500 to-blue-600', fields: [] },
            { id: 'liveworksheets', title: ta('تقرير استخدام Liveworksheets', 'Liveworksheets Usage Report'), gradient: 'from-violet-600 to-purple-700', fields: [] },
            { id: 'projector', title: ta('تقرير استخدام البروجيكتور في شرح الدروس', 'Projector Usage Report'), gradient: 'from-slate-600 to-gray-700', fields: [] },
            { id: 'keynote', title: ta('تقرير استخدام Keynote', 'Keynote Usage Report'), gradient: 'from-pink-600 to-rose-700', fields: [] },
            { id: 'powerpoint', title: ta('تقرير استخدام PowerPoint', 'PowerPoint Usage Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'word', title: ta('تقرير استخدام Word', 'Word Usage Report'), gradient: 'from-blue-700 to-indigo-800', fields: [] },
            { id: 'youtube', title: ta('تقرير استخدام YouTube', 'YouTube Usage Report'), gradient: 'from-red-600 to-rose-700', fields: [] },
            { id: 'chatgpt', title: ta('تقرير استخدام ChatGPT لدعم المعلم', 'ChatGPT Usage Report'), gradient: 'from-teal-600 to-emerald-700', fields: [] },
            { id: 'canva', title: ta('تقرير استخدام Canva', 'Canva Usage Report'), gradient: 'from-purple-500 to-pink-600', fields: [] },
            { id: 'madrasati', title: ta('تقرير استخدام مدرستي', 'Madrasati Usage Report'), gradient: 'from-green-600 to-teal-700', fields: [] },
            { id: 'wordwall', title: ta('تقرير استخدام Wordwall', 'Wordwall Usage Report'), gradient: 'from-orange-600 to-amber-700', fields: [] },
            { id: 'kahoot', title: ta('تقرير استخدام Kahoot!', 'Kahoot! Usage Report'), gradient: 'from-violet-700 to-purple-800', fields: [] },
            { id: 'smart-board', title: ta('استخدام السبورة الذكية', 'Smart Board Usage'), gradient: 'from-cyan-600 to-teal-700', fields: [] },
        ],
    },
    {
        id: 'school-environment',
        title: ta('٨. تهيئة البيئة التعليمية', '8. Educational Environment Preparation'),
        description: ta('نماذج تقييم وتوثيق البيئة المدرسية الجاذبة والمبادرات المدرسية', 'School environment assessment and school initiatives documentation'),
        gradient: 'from-lime-600 to-green-700',
        badge: ta('بند ٨', 'Item 8'),
        forms: [
            {
                id: 'env-assessment-report', title: ta('تقرير تقييم البيئة المدرسية', 'School Environment Assessment Report'),
                description: ta('توثيق حالة البيئة التعليمية الجاذبة والمحفزة', 'Document the attractive and stimulating educational environment'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
                    { key: 'date', label: ta('التاريخ', 'Date'), type: 'text', placeholder: ta('التاريخ', 'Date') },
                    { key: 'env_type', label: ta('نوع التهيئة', 'Preparation Type'), type: 'text', placeholder: ta('تهيئة الفصل / الممرات / المعمل', 'Classroom / Halls / Lab') },
                    { key: 'description', label: ta('وصف التهيئة', 'Preparation Description'), type: 'textarea', rows: 4, placeholder: ta('وصف ما تم تنفيذه لتهيئة البيئة التعليمية...', 'Description of what was done...') },
                    { key: 'impact', label: ta('الأثر على المتعلمين', 'Impact on Learners'), type: 'textarea', rows: 3, placeholder: ta('الأثر الإيجابي على تعلم الطلاب...', 'Positive impact on student learning...') },
                    { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image', required: true },
                    { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
                ],
            },
            { id: 'env-classroom-setup', title: ta('تقرير تنظيم الفصل الدراسي', 'Classroom Organization Report'), description: ta('توثيق تنظيم وتجهيز الفصل الدراسي', 'Document classroom setup and organization'), gradient: 'from-lime-600 to-green-700', fields: [] },
            { id: 'env-learning-corners', title: ta('تقرير أركان التعلم', 'Learning Corners Report'), description: ta('توثيق إنشاء وتفعيل أركان التعلم داخل الفصل', 'Document learning corners creation and activation'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
        ],
    },
    {
        id: 'classroom-management',
        title: ta('٩. الإدارة الصفية', '9. Classroom Management'),
        description: ta('تقارير جاهزة لتوثيق استراتيجيات الإدارة الصفية — التعزيز الإيجابي، التنظيم المادي، القواعد الصفية', 'Classroom management strategies — positive reinforcement, physical organization, class rules'),
        gradient: 'from-rose-600 to-pink-600',
        badge: ta('بند ٩', 'Item 9'),
        forms: [
            { id: 'cm-teaching-methods', title: ta('استراتيجية الإدارة الصفية (التنويع في طرق التدريس)', 'CM Strategy (Diversification)'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'cm-physical-org', title: ta('استراتيجية الإدارة الصفية (التنظيم المادي للفصل)', 'CM Strategy (Physical Organization)'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
            { id: 'cm-positive-reinforcement', title: ta('استراتيجية الإدارة الصفية (التعزيز الإيجابي)', 'CM Strategy (Positive Reinforcement)'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'cm-rules', title: ta('استراتيجية الإدارة الصفية (مشاركة بناء القواعد الصفية)', 'CM Strategy (Participatory Rule-Building)'), gradient: 'from-violet-600 to-purple-700', fields: [] },
        ],
    },
    {
        id: 'results-analysis',
        title: ta('١٠. تحليل نتائج المتعلمين', '10. Learner Results Analysis'),
        description: ta('تقارير تحليل وتشخيص نتائج الطلاب لجميع المراحل الدراسية', 'Student results analysis for all academic stages'),
        gradient: 'from-blue-700 to-indigo-800',
        badge: ta('بند ١٠', 'Item 10'),
        forms: [
            {
                id: 'go-to-analyze-results', title: ta('عرض أدوات تحليل النتائج', 'View Results Analysis Tools'),
                description: ta('اضغط لفتح صفحة تحليل نتائج المتعلمين', 'Click to open the results analysis page'),
                fields: [],
            },
        ],
    },
    {
        id: 'assessment-methods',
        title: ta('١١. تنوع أساليب التقويم', '11. Assessment Methods Diversification'),
        description: ta('توثيق أساليب التقويم المتنوعة — تكويني، ختامي، ذاتي، أقران، أداء', 'Document various assessment methods — formative, summative, self, peer, performance'),
        gradient: 'from-purple-600 to-violet-700',
        badge: ta('بند ١١', 'Item 11'),
        forms: [
            {
                id: 'formative-assessment', title: ta('تقرير التقويم التكويني', 'Formative Assessment Report'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
                    { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
                    { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
                    { key: 'assessment_type', label: ta('نوع التقويم', 'Assessment Type'), type: 'text', placeholder: ta('تكويني / ختامي / ذاتي / أقران', 'Formative / Summative / Self / Peer') },
                    { key: 'description', label: ta('وصف النشاط التقويمي', 'Assessment Activity Description'), type: 'textarea', rows: 4, placeholder: ta('وصف النشاط التقويمي المنفذ...', 'Assessment activity description...') },
                    { key: 'results', label: ta('النتائج', 'Results'), type: 'textarea', rows: 3, placeholder: ta('نتائج التقويم...', 'Assessment results...') },
                    { key: 'recommendations', label: ta('التوصيات', 'Recommendations'), type: 'textarea', rows: 3, placeholder: ta('التوصيات بناءً على النتائج...', 'Recommendations...') },
                    { key: 'image1', label: ta('صورة الشاهد', 'Evidence Image'), type: 'image', required: true },
                ],
            },
            {
                id: 'peer-assessment', title: ta('تقرير تقويم الأقران', 'Peer Assessment Report'),
                fields: [
                    { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
                    { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
                    { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
                    { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
                    { key: 'description', label: ta('وصف نشاط تقويم الأقران', 'Peer Assessment Description'), type: 'textarea', rows: 4, placeholder: ta('كيف تم تنفيذ تقويم الأقران...', 'How peer assessment was done...') },
                    { key: 'results', label: ta('النتائج والملاحظات', 'Results and Observations'), type: 'textarea', rows: 3, placeholder: ta('النتائج والملاحظات...', 'Results and observations...') },
                    { key: 'image1', label: ta('صورة الشاهد', 'Evidence Image'), type: 'image', required: true },
                ],
            },
        ],
    },

];

// ===== Form Fill Component =====
function FormFill({ form, gradient, onBack }: { form: FormDef; gradient: string; onBack: () => void }) {
  const { dir } = useTranslation();
    // [C-01 FIX] Auto-save to localStorage — prevents data loss on page refresh
    const [values, setValues, clearValues] = useLocalDraft(`perf-form-${form.id}`, {} as Record<string, string>);
    const [images, setImages] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const set = (k: string, v: string) => setValues((p: Record<string, string>) => ({ ...p, [k]: v }));
    const handleImage = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };

    const hasData = Object.keys(values).some(k => values[k]) || Object.keys(images).length > 0;
    const { fillField, fillAllFields, loadingField } = useAIFieldFill();

    // === Preview Content (reusable) ===
    const PreviewContent = () => {
        // For event-type forms, show structured preview
        const isEventForm = !form.fields.length || form.fields.length === 0;
        return (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                <div className={`bg-gradient-to-l ${gradient} p-5 text-white`}>
                    <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — شاهد تقييم الأداء الوظيفي', 'Ministry of Education — Job Performance Assessment Evidence')}</p>
                    <h2 className="text-lg font-black">{values.program_name || form.title}</h2>
                    {(values.school || values.edu_school) && <p className="text-sm opacity-90 mt-1 whitespace-pre-line">{values.school || values.edu_school}</p>}
                </div>
                <div className="p-5 space-y-2 text-sm">
                    {isEventForm ? (
                        // Event/strategy form preview
                        <>
                            {[['المنفذ/ون','implementors'],['المشاركـ/ون','participants'],['مكان التنفيذ','location'],['مدة التنفيذ','duration'],['تاريخ التنفيذ','date'],['المستفيدون','beneficiaries'],['المجال','domain']].map(([l,k]) => values[k] ? (
                                <div key={k} className="flex gap-2 border-b border-gray-100 pb-1">
                                    <span className="font-bold text-gray-600 min-w-[110px] shrink-0">{l}:</span>
                                    <span className="text-gray-800">{values[k]}</span>
                                </div>
                            ) : null)}
                            {values.objectives && <div className="mt-2"><p className="font-bold text-gray-600 mb-1">{ta('الأهداف:', 'Objectives:')}</p><p className="text-gray-700 text-xs whitespace-pre-line">{values.objectives}</p></div>}
                            {values.steps && <div className="mt-2"><p className="font-bold text-gray-600 mb-1">{ta('خطوات التنفيذ:', 'Steps:')}</p><p className="text-gray-700 text-xs whitespace-pre-line">{values.steps}</p></div>}
                            {(images.image1 || images.image2) && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {['image1','image2'].map(k => images[k] ? <img key={k} src={images[k]} alt="" className="w-full h-28 object-cover rounded-lg border" /> : null)}
                                </div>
                            )}
                            {(values.right_signature || values.left_signature) && (
                                <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
                                    {values.right_signature && <div className="text-center text-xs"><p className="whitespace-pre-line text-gray-700">{values.right_signature}</p><div className="mt-2 border-b border-gray-400 w-20 mx-auto" /></div>}
                                    {values.left_signature && <div className="text-center text-xs"><p className="whitespace-pre-line text-gray-700">{values.left_signature}</p><div className="mt-2 border-b border-gray-400 w-20 mx-auto" /></div>}
                                </div>
                            )}
                        </>
                    ) : (
                        // Regular form preview
                        <>
                            {form.fields.filter(f => f.type !== 'image').map(f =>
                                values[f.key] ? (
                                    <div key={f.key} className="flex gap-2 border-b border-gray-100 pb-1.5">
                                        <span className="font-bold text-gray-600 min-w-[130px] shrink-0">{f.label}:</span>
                                        <span className="text-gray-800 whitespace-pre-wrap">{values[f.key]}</span>
                                    </div>
                                ) : null
                            )}
                            {form.fields.filter(f => f.type === 'image').some(f => images[f.key]) && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {form.fields.filter(f => f.type === 'image').map(f =>
                                        images[f.key] ? <img key={f.key} src={images[f.key]} alt={f.label} className="w-full h-32 object-cover rounded-lg border" /> : null
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className={`bg-gradient-to-l ${gradient} text-white text-center py-2 text-xs font-bold`}>
                    SERS — {ta('نظام السجلات التعليمية الذكية', 'Smart Educational Records System')}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Go Back')}
                </button>
                <div className="max-w-3xl mx-auto">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{form.title}</CardTitle>
                                    {form.description && <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Event forms - special layout */}
                            {['saudi-science-day','gulf-talent-day','foundation-day','education-day','arabic-language-day','child-day','tolerance-day','diabetes-day','disability-day','teams-madrasati','padlet','telegram','liveworksheets','projector','keynote','powerpoint','word','youtube','chatgpt','canva','madrasati','wordwall','microsoft-teams','microsoft-excel','microsoft-forms','kahoot','arloopa','strategy-teacher','strategy-small','strategy-single','strategy-cooperative','strategy-self','strategy-discovery','strategy-jigsaw','strategy-flipped','strategy-wordwall','strategy-raisin','strategy-think-pair','strategy-jigsawb','strategy-hot-seat','strategy-kwl','strategy-roles','strategy-mind-map','strategy-gallery','strategy-six-hats','strategy-problem','strategy-experiments','strategy-concepts','strategy-gamification','strategy-story','smart-board','cm-teaching-methods','cm-physical-org','cm-positive-reinforcement','cm-rules'].includes(form.id) ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                        <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={values.edu_school || ''} onChange={e => set('edu_school', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم البرنامج / المبادرة:', 'Program/Initiative Name:')}</label>
                                        <Input placeholder={form.title} value={values.program_name || ''} onChange={e => set('program_name', e.target.value)} className="text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المنفذ/ون:', 'Implementer(s):')}</label><Input value={values.implementors||''} onChange={e => set('implementors',e.target.value)} className="text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المشاركـ/ون:', 'Participant(s):')}</label><Input value={values.participants||''} onChange={e => set('participants',e.target.value)} className="text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكان التنفيذ:', 'Location:')}</label><Input value={values.location||''} onChange={e => set('location',e.target.value)} className="text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مدة التنفيذ:', 'Duration:')}</label><Input value={values.duration||''} onChange={e => set('duration',e.target.value)} className="text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('تاريخ التنفيذ:', 'Date:')}</label><Input value={values.date||''} onChange={e => set('date',e.target.value)} className="text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المستفيدون / عددهم:', 'Beneficiaries / Count:')}</label><Input value={values.beneficiaries||''} onChange={e => set('beneficiaries',e.target.value)} className="text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المجال:', 'Domain:')}</label><Input value={values.domain||''} onChange={e => set('domain',e.target.value)} className="text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{ta('الأهداف:', 'Objectives:')}</label>
                                                <button type="button" disabled={!!loadingField} onClick={() => fillField('objectives', 'الأهداف', form.title, values, set)} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50">
                                                    {loadingField === 'objectives' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    {ta('تعبئة بالذكاء الاصطناعي', 'AI')}
                                                </button>
                                            </div>
                                            <Textarea rows={5} value={values.objectives||''} onChange={e => set('objectives',e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</label>
                                                <button type="button" disabled={!!loadingField} onClick={() => fillField('steps', 'خطوات التنفيذ', form.title, values, set)} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50">
                                                    {loadingField === 'steps' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    {ta('تعبئة بالذكاء الاصطناعي', 'AI')}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Textarea rows={5} value={values.steps||''} onChange={e => set('steps',e.target.value)} className="resize-y text-sm ps-8" />
                                                <div className="absolute left-1 top-2 flex flex-col gap-0.5">
                                                    <button type="button" onClick={() => { const l=(values.steps||'').split('\n'); if(l.length<2) return; const x=l.pop()!; l.splice(l.length-1,0,x); set('steps',l.join('\n')); }} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▲</button>
                                                    <button type="button" onClick={() => { const l=(values.steps||'').split('\n'); if(l.length<2) return; const x=l.shift()!; l.push(x); set('steps',l.join('\n')); }} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▼</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label><Textarea rows={2} value={values.right_signature||''} onChange={e => set('right_signature',e.target.value)} placeholder={ta('رائد النشاط\nالاسم', 'رائد النشاط\\nالاسم')} className="resize-y text-sm" /></div>
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label><Textarea rows={2} value={values.left_signature||''} onChange={e => set('left_signature',e.target.value)} placeholder={ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم')} className="resize-y text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['image1','image2'].map((k,i) => (
                                            <div key={k}>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {i===0? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                                {images[k] ? (<div className="relative"><img src={images[k]} alt="" className="w-full h-28 object-cover rounded-lg border" /><button onClick={() => setImages(p => { const n={...p}; delete n[k]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button></div>
                                                ) : (<label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer"><span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span><span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span><input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(k, e.target.files[0])} /></label>)}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج :', 'Add evidence link to generate QR code:')}</label>
                                        <Input type="url" placeholder="" value={values.evidence_url||''} onChange={e => set('evidence_url',e.target.value)} className="text-sm" />
                                        <p className="text-xs text-gray-400 mt-1 text-start">{ta('سيتم إنشاء باركود تلقائياً / حقل غير إلزامي تجاهله إذا كنت لاتريد باركود', 'QR code auto-generated / Optional field - skip if not needed')}</p>
                                    </div>
                                </>
                            ) : (
                            form.fields.map(field => (
                                <div key={field.key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                        </label>
                                        {field.type === 'textarea' && (
                                            <button type="button" disabled={!!loadingField} onClick={() => fillField(field.key, field.label, form.title, values, set)} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50">
                                                {loadingField === field.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                {ta('تعبئة بالذكاء الاصطناعي', 'Fill with AI')}
                                            </button>
                                        )}
                                    </div>
                                    {field.type === 'textarea' ? (
                                        <Textarea rows={field.rows || 3} placeholder={field.placeholder} value={values[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="resize-none" />
                                    ) : field.type === 'image' ? (
                                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                                            {images[field.key] ? (
                                                <div className="relative">
                                                    <img src={images[field.key]} alt="" className="w-full h-32 object-cover rounded-lg" />
                                                    <button onClick={() => setImages(p => { const n = { ...p }; delete n[field.key]; return n; })} className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">×</button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">{ta('اضغط لرفع صورة', 'Click to Upload Image')}</p>
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(field.key, e.target.files[0])} />
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <Input placeholder={field.placeholder} value={values[field.key] || ''} onChange={e => set(field.key, e.target.value)} />
                                    )}
                                </div>
                            ))
                            )}
                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button disabled={!!loadingField} onClick={() => { const allFields = form.fields.length > 0 ? form.fields.filter(f => f.type !== 'image') : [{key:'objectives',label:'الأهداف',type:'textarea'},{key:'steps',label:'خطوات التنفيذ',type:'textarea'}]; fillAllFields(allFields, form.title, values, set); }} className="w-full gap-2 bg-gradient-to-l from-violet-600 to-purple-700 text-white border-0 text-sm hover:opacity-90">
                                    {loadingField === '__all__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {ta('تعبئة جميع الحقول بالذكاء الاصطناعي', 'Fill All Fields with AI')}
                                </Button>
                                <div className="flex gap-2">
                                    <Button onClick={() => { if (!hasData) { toast.error(ta('يرجى ملء الحقول أولاً', 'Please fill in the fields first')); return; } setShowPreview(true); }} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm"><Eye className="w-4 h-4" />{ta('معاينة', 'Preview')}</Button>
                                    <Button onClick={() => { clearValues(); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm"><RotateCcw className="w-4 h-4" />{ta('مسح المسودة', 'Clear Draft')}</Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${gradient} text-white border-0 text-sm`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* ===== Preview Modal ===== */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Close button */}
                        <button onClick={() => setShowPreview(false)} className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-gray-800 shadow-lg rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors text-sm font-bold">✕</button>
                        {/* Actions bar */}
                        <div className="absolute top-3 right-3 z-10 flex gap-2">
                            <Button size="sm" onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`gap-1.5 bg-gradient-to-l ${gradient} text-white border-0 text-xs shadow-lg rounded-xl`}>
                                <Download className="w-3.5 h-3.5" /> {ta('تحميل PDF', 'Download PDF')}
                            </Button>
                        </div>
                        <PreviewContent />
                    </div>
                </div>
            )}

            <Footer />
            <style>{`@media print { nav, footer, button, .fixed { display: none !important; } }`}</style>
        </div>
    );
}

// ===== Section Page =====
function SectionPage({ section, onBack }: { section: Section; onBack: () => void }) {
  const { dir } = useTranslation();
    const router = useRouter();
    const [selectedForm, setSelectedForm] = useState<FormDef | null>(null);

    // Redirect sections — these link to other service pages
    const REDIRECT_MAP: Record<string, string> = {
        'improve-results': '/improve-results',
        'learning-plan': '/plans',
        'results-analysis': '/analyze-results',
    };
    if (REDIRECT_MAP[section.id]) {
        router.push(REDIRECT_MAP[section.id]);
        return null;
    }

    if (selectedForm) return <FormFill form={selectedForm} gradient={section.gradient} onBack={() => setSelectedForm(null)} />;

    // الأقسام التي لها تصميم Hero مختلف
    const isEvents = section.id === 'job-duties' || section.id === 'events' || section.id === 'technical' || section.id === 'strategies' || section.id === 'classroom-management';

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                {isEvents ? (
                    <section className={`relative overflow-hidden ${section.id === 'technical' ? 'bg-gradient-to-bl from-slate-900 via-emerald-950 to-slate-900' : section.id === 'strategies' ? 'bg-gradient-to-bl from-slate-900 via-amber-950 to-slate-900' : section.id === 'classroom-management' ? 'bg-gradient-to-bl from-slate-900 via-rose-950 to-slate-900' : 'bg-gradient-to-bl from-slate-900 via-violet-950 to-slate-900'} text-white`}>
                        <div className="absolute inset-0 pointer-events-none">
                            <div className={`absolute top-10 right-[15%] w-72 h-72 ${section.id === 'technical' ? 'bg-emerald-500/20' : section.id === 'strategies' ? 'bg-amber-500/20' : section.id === 'classroom-management' ? 'bg-rose-500/20' : 'bg-violet-500/20'} rounded-full blur-[120px]`} />
                        </div>
                        <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                            <button onClick={onBack} className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm transition-colors">
                                <ChevronRight className="w-4 h-4" /> {ta('العودة لشواهد الأداء', 'Back to Performance Evidence')}
                            </button>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                                <ClipboardCheck className="w-4 h-4 text-violet-400" /> {section.title}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black mb-4">{section.title}</h1>
                            <p className="text-lg text-white/70 mb-6">{section.description}</p>
                            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                                <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" />{section.forms.length} تقارير</span>
                                <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className="pt-28 pb-4 container mx-auto px-4">
                        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                            <ChevronRight className="w-4 h-4" /> {ta('العودة لشواهد الأداء', 'Back to Performance Evidence')}
                        </button>
                        <div className="mb-8">
                            <div className={`inline-flex items-center gap-2 bg-gradient-to-l ${section.gradient} text-white px-5 py-2.5 rounded-full text-sm font-bold mb-4`}>
                                <ClipboardCheck className="w-4 h-4" /> {section.title}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">{section.description}</p>
                        </div>
                    </div>
                )}
                <div className={`container mx-auto px-4 ${isEvents ? 'py-12' : 'pb-16'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.forms.map(form => {
                            const g = (form as any).gradient || section.gradient;
                            return (
                            <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-gray-800 overflow-hidden" onClick={() => { if ((form as any).href) { router.push((form as any).href); return; } setSelectedForm(form); }}>
                                <div className={`h-2 bg-gradient-to-l ${g}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${g} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <ClipboardCheck className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">{form.title}</CardTitle>
                                    {form.description && <CardDescription className="text-xs mt-1 line-clamp-2">{form.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className={`w-full bg-gradient-to-l ${g} text-white border-0 hover:opacity-90 gap-2 text-sm`}>
                                        <Eye className="w-4 h-4" /> {ta('ابدأ التصميم', 'Start Design')}
                                    </Button>
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

// ===== Main Page =====
export default function PerformanceEvidencePage() {
  const { dir } = useTranslation();
    const searchParams = useSearchParams();
    const sectionParam = searchParams.get('section');
    const { sections: dynamicSections } = useFirestoreSections('performance-evidence-forms', SECTIONS);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    // Auto-select section from URL param (e.g., ?section=strategies)
    useEffect(() => {
        if (sectionParam && dynamicSections.length > 0) {
            const found = dynamicSections.find(s => s.id === sectionParam);
            if (found) setSelectedSection(found);
        }
    }, [sectionParam, dynamicSections]);

    if (selectedSection) return <SectionPage section={selectedSection} onBack={() => { setSelectedSection(null); window.history.replaceState(null, '', '/performance-evidence-forms'); }} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-violet-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-violet-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-purple-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <ClipboardCheck className="w-4 h-4 text-violet-400" /> {ta('البنود الـ 11 المعتمدة', 'All 11 Approved Items')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('شواهد الأداء الوظيفي', 'Job Performance Evidence')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('جميع البنود الـ 11 المعتمدة لتقييم الأداء الوظيفي — شواهد ونماذج وتقارير جاهزة لكل بند', 'All 11 approved job performance evaluation items with ready evidence, forms, and reports for each')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{dynamicSections.length} {ta('بند وقسم', 'items')}</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF مجاني', 'Free PDF Download')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                {/* Sections Grid */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dynamicSections.map(section => (
                            <Card
                                key={section.id}
                                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800"
                                onClick={() => setSelectedSection(section)}
                            >
                                <div className={`h-2 bg-gradient-to-l ${section.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <ClipboardCheck className="w-6 h-6" />
                                        </div>
                                        {section.badge && <Badge className="bg-amber-500 text-white text-xs">{section.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                        {section.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1">
                                        {section.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <ClipboardCheck className="w-3.5 h-3.5" />
                                        <span>{section.forms.length} نموذج</span>
                                    </div>
                                    <Button className={`w-full bg-gradient-to-l ${section.gradient} text-white border-0 hover:opacity-90 gap-2`}>
                                        <Eye className="w-4 h-4" /> {ta('استعراض القسم', 'Browse Section')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
