'use client';

import { useState } from 'react';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ClipboardCheck, Eye, Download, RotateCcw,
    Image as ImageIcon, ChevronRight, Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

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
        id: 'initiatives',
        title: ta('مبادرات مدرسية جاهزة', 'Ready School Initiatives'),
        description: ta('مجموعة من المبادرات التعليمية الجاهزة والمعبأة مسبقاً', 'A collection of pre-filled educational initiatives'),
        gradient: 'from-blue-600 to-blue-700',
        badge: 'الأكثر استخداماً',
        forms: [
            {
                id: 'go-to-initiatives', title: ta('عرض جميع المبادرات المدرسية الجاهزة', 'View all ready school initiatives'),
                description: ta('اضغط لفتح صفحة المبادرات المدرسية الجاهزة', 'Click to open the ready school initiatives page'),
                fields: [],
            },
        ],
    },
    {
        id: 'events',
        title: ta('أيام عالمية ومناسبات', 'International Days & Occasions'),
        description: ta('تقارير جاهزة للأيام والمناسبات العالمية', 'Ready reports for international days and occasions'),
        gradient: 'from-violet-600 to-purple-700',
        forms: [
            { id: 'saudi-science-day', title: ta('تقرير يوم العلم السعودي', 'Saudi Science Day Report'), description: ta('تقرير تفعيل يوم العلم السعودي في المدرسة', 'Saudi Science Day School Activation Report'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'gulf-talent-day', title: ta('تقرير اليوم الخليجي للموهبة والإبداع', 'Gulf Talent and Creativity Day Report'), description: ta('تقرير تفعيل اليوم الخليجي للموهبة والإبداع', 'Gulf Talent and Creativity Day Activation Report'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
            { id: 'foundation-day', title: ta('تقرير يوم التأسيس', 'Founding Day Report'), description: ta('تقرير تفعيل يوم تأسيس المملكة العربية السعودية', 'Saudi Arabia Founding Day Activation Report'), gradient: 'from-green-700 to-emerald-800', fields: [] },
            { id: 'education-day', title: ta('تقرير اليوم العالمي للتعليم', 'International Education Day Report'), description: ta('تقرير تفعيل اليوم العالمي للتعليم في المدرسة', 'International Education Day School Activation Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'arabic-language-day', title: ta('تقرير اليوم العالمي للغة العربية', 'International Arabic Language Day Report'), description: ta('تقرير تفعيل اليوم العالمي للغة العربية', 'International Arabic Language Day Activation Report'), gradient: 'from-rose-600 to-pink-700', fields: [] },
            { id: 'child-day', title: ta('تقرير اليوم العالمي للطفل', "International Children's Day Report"), description: ta('تقرير تفعيل اليوم العالمي للطفل في المدرسة', "International Children's Day School Activation Report"), gradient: 'from-cyan-600 to-blue-700', fields: [] },
            { id: 'tolerance-day', title: ta('اليوم العالمي للتسامح', 'International Tolerance Day'), description: ta('تقرير تفعيل اليوم العالمي للتسامح', 'World Tolerance Day Activation Report'), gradient: 'from-purple-600 to-violet-700', fields: [] },
            { id: 'diabetes-day', title: ta('اليوم العالمي للسكري', 'World Diabetes Day'), description: ta('تقرير تفعيل اليوم العالمي للسكري في المدرسة', 'World Diabetes Day School Activation Report'), gradient: 'from-sky-600 to-blue-700', fields: [] },
            { id: 'disability-day', title: ta('اليوم العالمي للأشخاص ذوي الإعاقة', 'International Day of Persons with Disabilities'), description: ta('تقرير تفعيل اليوم العالمي للأشخاص ذوي الإعاقة', 'International Day of Persons with Disabilities Activation Report'), gradient: 'from-teal-600 to-cyan-700', fields: [] },
        ],
    },
    {
        id: 'technical',
        title: ta('برامج تقنية جاهزة', 'Ready Technology Programs'),
        description: ta('تقارير جاهزة لاستخدام البرامج والأدوات التقنية في التعليم', 'Ready reports for using technology programs and tools in education'),
        gradient: 'from-emerald-600 to-green-700',
        forms: [
            { id: 'teams-madrasati', title: ta('تقرير تفعيل درس عن بُعد باستخدام مدرستي (Madrasati) وتيمز (Teams)', 'Remote lesson activation report using Madrasati and Teams'), description: ta('تقرير توثيق تفعيل درس عن بُعد', 'Remote Lesson Activation Documentation Report'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'padlet', title: ta('تقرير استخدام برنامج تقني Padlet', 'Padlet Technology Program Usage Report'), description: ta('تقرير توثيق استخدام برنامج Padlet في التعليم', 'Padlet Educational Usage Documentation Report'), gradient: 'from-orange-500 to-red-600', fields: [] },
            { id: 'telegram', title: ta('تقرير استخدام برنامج تقني Telegram', 'Telegram Technology Program Usage Report'), description: ta('تقرير توثيق استخدام تيليجرام في التواصل التعليمي', 'Telegram Educational Communication Usage Documentation Report'), gradient: 'from-sky-500 to-blue-600', fields: [] },
            { id: 'liveworksheets', title: ta('تقرير استخدام برنامج تقني Liveworksheets', 'Liveworksheets Technology Program Usage Report'), description: ta('تقرير توثيق استخدام Liveworksheets في التعليم', 'Liveworksheets Educational Usage Documentation Report'), gradient: 'from-violet-600 to-purple-700', fields: [] },
            { id: 'projector', title: ta('تقرير استخدام البروجيكتور (Projector) في شرح الدروس', 'Projector Usage Report in Lesson Explanation'), description: ta('تقرير توثيق استخدام البروجيكتور في الفصل', 'Projector Classroom Usage Documentation Report'), gradient: 'from-slate-600 to-gray-700', fields: [] },
            { id: 'keynote', title: ta('تقرير استخدام برنامج كينوت (Keynote)', 'Keynote Program Usage Report'), description: ta('تقرير توثيق استخدام Keynote في العروض التقديمية', 'Keynote Presentation Usage Documentation Report'), gradient: 'from-pink-600 to-rose-700', fields: [] },
            { id: 'powerpoint', title: ta('تقرير استخدام برنامج الباوربوينت (PowerPoint) في شرح الدروس', 'PowerPoint Usage Report in Lesson Explanation'), description: ta('تقرير توثيق استخدام PowerPoint في التعليم', 'PowerPoint Educational Usage Documentation Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'word', title: ta('تقرير استخدام برنامج الوورد (Word) لدعم المعلم', 'Word Program Usage Report for Teacher Support'), description: ta('تقرير توثيق استخدام Word في دعم العملية التعليمية', 'Word Usage Documentation Report in Supporting the Educational Process'), gradient: 'from-blue-700 to-indigo-800', fields: [] },
            { id: 'youtube', title: ta('تقرير استخدام اليوتيوب (YouTube)', 'YouTube Usage Report'), description: ta('تقرير توثيق استخدام YouTube في التعليم', 'YouTube Educational Usage Documentation Report'), gradient: 'from-red-600 to-rose-700', fields: [] },
            { id: 'chatgpt', title: ta('تقرير استخدام شات جي بي تي (ChatGPT) لدعم المعلم', 'ChatGPT Usage Report for Teacher Support'), description: ta('تقرير توثيق استخدام ChatGPT في دعم العملية التعليمية', 'ChatGPT Usage Documentation Report in Supporting the Educational Process'), gradient: 'from-teal-600 to-emerald-700', fields: [] },
            { id: 'canva', title: ta('تقرير استخدام منصة كانفا (Canva) لدعم المعلم', 'Canva Usage Report for Teacher Support'), description: ta('تقرير توثيق استخدام Canva في التصميم التعليمي', 'Canva Educational Design Usage Documentation Report'), gradient: 'from-purple-500 to-pink-600', fields: [] },
            { id: 'madrasati', title: ta('تقرير استخدام منصة مدرستي (madrasati)', 'Madrasati Platform Usage Report'), description: ta('تقرير توثيق استخدام منصة مدرستي في التعليم', 'Madrasati Platform Educational Usage Documentation Report'), gradient: 'from-green-600 to-teal-700', fields: [] },
            { id: 'wordwall', title: ta('تقرير استخدام منصة وورد وول (Wordwall)', 'Wordwall Platform Usage Report'), description: ta('تقرير توثيق استخدام Wordwall في التعليم التفاعلي', 'Wordwall Interactive Education Usage Documentation Report'), gradient: 'from-orange-600 to-amber-700', fields: [] },
            { id: 'microsoft-teams', title: ta('تقرير استخدام منصة مايكروسوفت تيمز (Microsoft Teams)', 'Microsoft Teams Platform Usage Report'), description: ta('تقرير توثيق استخدام Microsoft Teams في التعليم', 'Microsoft Teams Educational Usage Documentation Report'), gradient: 'from-indigo-600 to-violet-700', fields: [] },
            { id: 'microsoft-excel', title: ta('تقرير استخدام برنامج مايكروسوفت إكسل (Microsoft Excel)', 'Microsoft Excel Usage Report'), description: ta('تقرير توثيق استخدام Excel في التعليم', 'Excel Educational Usage Documentation Report'), gradient: 'from-emerald-700 to-green-800', fields: [] },
            { id: 'microsoft-forms', title: ta('تقرير استخدام برنامج مايكروسوفت فورمز (Microsoft Forms)', 'Microsoft Forms Usage Report'), description: ta('تقرير توثيق استخدام Microsoft Forms في التقييم', 'Microsoft Forms Assessment Usage Documentation Report'), gradient: 'from-blue-500 to-cyan-600', fields: [] },
            { id: 'kahoot', title: ta('تقرير استخدام برنامج كاهوت (!Kahoot)', 'Kahoot! Usage Report'), description: ta('تقرير توثيق استخدام Kahoot في التعليم التفاعلي', 'Kahoot Interactive Education Usage Documentation Report'), gradient: 'from-violet-700 to-purple-800', fields: [] },
            { id: 'arloopa', title: ta('تقرير استخدام تطبيق الواقع المعزز (ARLOOPA)', 'ARLOOPA Augmented Reality App Usage Report'), description: ta('تقرير توثيق استخدام تطبيق الواقع المعزز في التعليم', 'Augmented Reality App Educational Usage Documentation Report'), gradient: 'from-cyan-700 to-blue-800', fields: [] },
        ],
    },
    {
        id: 'strategies',
        title: ta('استراتيجيات تعليمية جاهزة', 'Ready Teaching Strategies'),
        description: ta('تقارير تنفيذ استراتيجيات تعليمية جاهزة للتحميل والطباعة', 'Ready teaching strategy implementation reports for download and printing'),
        gradient: 'from-amber-600 to-orange-600',
        forms: [
            { id: 'strategy-teacher', title: ta('تنفيذ استراتيجية تعليمية (الطالب المعلم)', 'Teaching Strategy Implementation (Student as Teacher)'), description: ta('تقرير تنفيذ استراتيجية الطالب المعلم', 'Student as Teacher Strategy Implementation Report'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'strategy-small', title: ta('تنفيذ استراتيجية تعليمية (المعلم الصغير)', 'Teaching Strategy Implementation (Little Teacher)'), description: ta('تقرير تنفيذ استراتيجية المعلم الصغير', 'Little Teacher Strategy Implementation Report'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
            { id: 'strategy-single', title: ta('تنفيذ استراتيجية تعليمية (الدقيقة الواحدة)', 'Teaching Strategy Implementation (One Minute)'), description: ta('تقرير تنفيذ استراتيجية الدقيقة الواحدة', 'One Minute Strategy Implementation Report'), gradient: 'from-violet-600 to-purple-700', fields: [] },
            { id: 'strategy-cooperative', title: ta('تنفيذ استراتيجية تعليمية (التعليم التعاوني)', 'Teaching Strategy Implementation (Cooperative Learning)'), description: ta('تقرير تنفيذ استراتيجية التعليم التعاوني', 'Cooperative Learning Strategy Implementation Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'strategy-self', title: ta('تنفيذ استراتيجية تعليمية (التعليم الذاتي)', 'Teaching Strategy Implementation (Self-Learning)'), description: ta('تقرير تنفيذ استراتيجية التعليم الذاتي', 'Self-Learning Strategy Implementation Report'), gradient: 'from-rose-600 to-pink-700', fields: [] },
            { id: 'strategy-discovery', title: ta('تنفيذ استراتيجية تعليمية (التعلم بالتجربة والاكتشاف)', 'Teaching Strategy Implementation (Experiential and Discovery Learning)'), description: ta('تقرير تنفيذ استراتيجية التعلم بالتجربة والاكتشاف', 'Experiential and Discovery Learning Strategy Implementation Report'), gradient: 'from-cyan-600 to-blue-700', fields: [] },
            { id: 'strategy-jigsaw', title: ta('تنفيذ استراتيجية (نموذج فرازير)', 'Strategy Implementation (Frayer Model)'), description: ta('تقرير تنفيذ استراتيجية نموذج فرازير', 'Frayer Model Strategy Implementation Report'), gradient: 'from-teal-600 to-emerald-700', fields: [] },
            { id: 'strategy-flipped', title: ta('تنفيذ استراتيجية (الفصل المقلوب)', 'Strategy Implementation (Flipped Classroom)'), description: ta('تقرير تنفيذ استراتيجية الفصل المقلوب', 'Flipped Classroom Strategy Implementation Report'), gradient: 'from-indigo-600 to-violet-700', fields: [] },
            { id: 'strategy-wordwall', title: ta('تقرير استخدام استراتيجية الحافلة الدوارة عبر منصة Wordwall', 'Rotating Bus Strategy Usage Report via Wordwall'), description: ta('تقرير توثيق استخدام استراتيجية الحافلة الدوارة', 'Rotating Bus Strategy Usage Documentation Report'), gradient: 'from-orange-500 to-red-600', fields: [] },
            { id: 'strategy-raisin', title: ta('تنفيذ استراتيجية (الرؤوس المرقمة)', 'Strategy Implementation (Numbered Heads)'), description: ta('تقرير تنفيذ استراتيجية الرؤوس المرقمة', 'Numbered Heads Strategy Implementation Report'), gradient: 'from-slate-600 to-gray-700', fields: [] },
            { id: 'strategy-think-pair', title: ta('تنفيذ استراتيجية (فكر - زاوج - شارك)', 'Strategy Implementation (Think - Pair - Share)'), description: ta('تقرير تنفيذ استراتيجية فكر زاوج شارك', 'Think-Pair-Share Strategy Implementation Report'), gradient: 'from-green-600 to-emerald-700', fields: [] },
            { id: 'strategy-jigsawb', title: ta('تنفيذ استراتيجية (استراتيجية الجيكسو - التركيب)', 'Strategy Implementation (Jigsaw Strategy)'), description: ta('تقرير تنفيذ استراتيجية الجيكسو', 'Jigsaw Strategy Implementation Report'), gradient: 'from-purple-600 to-violet-700', fields: [] },
            { id: 'strategy-hot-seat', title: ta('تنفيذ استراتيجية تعليمية (الكرسي الساخن)', 'Teaching Strategy Implementation (Hot Seat)'), description: ta('تقرير تنفيذ استراتيجية الكرسي الساخن', 'Hot Seat Strategy Implementation Report'), gradient: 'from-red-600 to-rose-700', fields: [] },
            { id: 'strategy-kwl', title: ta('تنفيذ استراتيجية تعليمية (جدول التعلم K.W.L)', 'Teaching Strategy Implementation (K.W.L Learning Chart)'), description: ta('تقرير تنفيذ استراتيجية جدول التعلم KWL', 'K.W.L Learning Chart Strategy Implementation Report'), gradient: 'from-blue-500 to-cyan-600', fields: [] },
            { id: 'strategy-roles', title: ta('تنفيذ استراتيجية تعليمية (لعب الأدوار)', 'Teaching Strategy Implementation (Role Play)'), description: ta('تقرير تنفيذ استراتيجية لعب الأدوار', 'Role Play Strategy Implementation Report'), gradient: 'from-pink-600 to-rose-700', fields: [] },
            { id: 'strategy-mind-map', title: ta('تنفيذ استراتيجية تعليمية (المصفد الذهني)', 'Teaching Strategy Implementation (Mind Map)'), description: ta('تقرير تنفيذ استراتيجية المصفد الذهني', 'Mind Map Strategy Implementation Report'), gradient: 'from-amber-500 to-yellow-600', fields: [] },
            { id: 'strategy-gallery', title: ta('تنفيذ استراتيجية تعليمية (جولة المعرض)', 'Teaching Strategy Implementation (Gallery Walk)'), description: ta('تقرير تنفيذ استراتيجية جولة المعرض', 'Gallery Walk Strategy Implementation Report'), gradient: 'from-teal-500 to-cyan-600', fields: [] },
            { id: 'strategy-six-hats', title: ta('تنفيذ استراتيجية تعليمية (القبعات الست للتفكير)', 'Teaching Strategy Implementation (Six Thinking Hats)'), description: ta('تقرير تنفيذ استراتيجية القبعات الست للتفكير', 'Six Thinking Hats Strategy Implementation Report'), gradient: 'from-violet-500 to-purple-600', fields: [] },
            { id: 'strategy-problem', title: ta('تنفيذ استراتيجية تعليمية (حل المشكلات)', 'Teaching Strategy Implementation (Problem Solving)'), description: ta('تقرير تنفيذ استراتيجية حل المشكلات', 'Problem Solving Strategy Implementation Report'), gradient: 'from-emerald-500 to-green-600', fields: [] },
            { id: 'strategy-experiments', title: ta('تنفيذ استراتيجية تعليمية (التجارب العلمية)', 'Teaching Strategy Implementation (Scientific Experiments)'), description: ta('تقرير تنفيذ استراتيجية التجارب العلمية', 'Scientific Experiments Strategy Implementation Report'), gradient: 'from-sky-600 to-blue-700', fields: [] },
            { id: 'strategy-concepts', title: ta('تنفيذ استراتيجية تعليمية (خرائط المفاهيم)', 'Teaching Strategy Implementation (Concept Maps)'), description: ta('تقرير تنفيذ استراتيجية خرائط المفاهيم', 'Concept Maps Strategy Implementation Report'), gradient: 'from-indigo-500 to-blue-600', fields: [] },
            { id: 'strategy-gamification', title: ta('تنفيذ استراتيجية تعليمية (التعلم باللعب - التنشيب)', 'Teaching Strategy Implementation (Gamification)'), description: ta('تقرير تنفيذ استراتيجية التعلم باللعب', 'Gamification Strategy Implementation Report'), gradient: 'from-orange-600 to-amber-700', fields: [] },
            { id: 'strategy-story', title: ta('تنفيذ استراتيجية تعليمية (القصة التعليمية)', 'Teaching Strategy Implementation (Educational Story)'), description: ta('تقرير تنفيذ استراتيجية القصة التعليمية', 'Educational Story Strategy Implementation Report'), gradient: 'from-rose-500 to-pink-600', fields: [] },
        ],
    },
    {
        id: 'aids',
        title: ta('وسائل تعليمية جاهزة', 'Ready Teaching Aids'),
        description: ta('تقارير استخدام وسائل تعليمية — عنصر توظيف تقنيات ووسائل التعلم', 'Teaching aid usage reports — employing educational technologies and means element'),
        gradient: 'from-cyan-600 to-teal-700',
        forms: [
            { id: 'smart-board', title: ta('استخدام وسيلة تعليمية (السبورة الذكية)', 'Teaching Aid Usage (Smart Board)'), description: ta('تقرير توثيق استخدام السبورة الذكية في تدريس الدروس', 'Smart Board Usage Documentation Report in Teaching Lessons'), gradient: 'from-cyan-600 to-teal-700', fields: [] },
        ],
    },
    {
        id: 'classroom-management-strategies',
        title: ta('استراتيجيات الإدارة الصفية جاهزة', 'Ready Classroom Management Strategies'),
        description: ta('تقارير جاهزة لتوثيق استراتيجيات الإدارة الصفية', 'Ready reports for documenting classroom management strategies'),
        gradient: 'from-rose-600 to-pink-600',
        forms: [
            { id: 'cm-teaching-methods', title: ta('استراتيجية الإدارة الصفية (التنويع في طرق التدريس)', 'Classroom Management Strategy (Diversification in Teaching Methods)'), description: ta('تقرير توثيق استراتيجية التنويع في طرق التدريس', 'Diversification in Teaching Methods Strategy Documentation Report'), gradient: 'from-blue-600 to-indigo-700', fields: [] },
            { id: 'cm-physical-org', title: ta('استراتيجية الإدارة الصفية (التنظيم المادي للفصل)', 'Classroom Management Strategy (Physical Classroom Organization)'), description: ta('تقرير توثيق استراتيجية التنظيم المادي للفصل', 'Physical Classroom Organization Strategy Documentation Report'), gradient: 'from-emerald-600 to-teal-700', fields: [] },
            { id: 'cm-positive-reinforcement', title: ta('استراتيجية الإدارة الصفية (التعزيز الإيجابي)', 'Classroom Management Strategy (Positive Reinforcement)'), description: ta('تقرير توثيق استراتيجية التعزيز الإيجابي', 'Positive Reinforcement Strategy Documentation Report'), gradient: 'from-amber-600 to-orange-600', fields: [] },
            { id: 'cm-rules', title: ta('استراتيجية الإدارة الصفية (مشاركة بناء القواعد الصفية)', 'Classroom Management Strategy (Participatory Rule-Building)'), description: ta('تقرير توثيق استراتيجية مشاركة بناء القواعد الصفية', 'Participatory Classroom Rule-Building Strategy Documentation Report'), gradient: 'from-violet-600 to-purple-700', fields: [] },
        ],
    },
    {
        id: 'parents-communication-report',
        title: ta('تقرير التواصل مع أولياء الأمور (مدرستي)', 'Parent Communication Report (Madrasati)'),
        description: ta('توثيق التواصل مع أولياء الأمور عبر منصة مدرستي', 'Documenting parent communication via Madrasati platform'),
        gradient: 'from-indigo-600 to-blue-700',
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
        ],
    },
    {
        id: 'parents-students-meeting-report',
        title: ta('تقرير الاجتماع الأول لأولياء الأمور', 'First Parent Meeting Report'),
        description: ta('توثيق الاجتماع الأول مع أولياء الأمور في بداية العام', 'Documentation of the first meeting with parents at the beginning of the year'),
        gradient: 'from-teal-600 to-emerald-600',
        forms: [
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
];

// ===== Form Fill Component =====
function FormFill({ form, gradient, onBack }: { form: FormDef; gradient: string; onBack: () => void }) {
  const { dir } = useTranslation();
    // [C-01 FIX] Auto-save to localStorage — prevents data loss on page refresh
    const [values, setValues, clearValues] = useLocalDraft(`perf-form-${form.id}`, {} as Record<string, string>);
    const [images, setImages] = useState<Record<string, string>>({});
    const set = (k: string, v: string) => setValues((p: Record<string, string>) => ({ ...p, [k]: v }));
    const handleImage = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Go Back')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label><Textarea rows={5} value={values.objectives||''} onChange={e => set('objectives',e.target.value)} className="resize-y text-sm" /></div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</label>
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                    </label>
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
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm"><Eye className="w-4 h-4" />{ta('معاينة', 'Preview')}</Button>
                                <Button onClick={() => { clearValues(); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm"><RotateCcw className="w-4 h-4" />{ta('مسح المسودة', 'Clear Draft')}</Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${gradient} text-white border-0 text-sm`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {Object.keys(values).some(k => values[k]) || Object.keys(images).length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${gradient} p-5 text-white`}>
                                    <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — شاهد تقييم الأداء الوظيفي', 'Ministry of Education — Job Performance Assessment Evidence')}</p>
                                    <h2 className="text-lg font-black">{form.title}</h2>
                                    {values.school && <p className="text-sm opacity-90 mt-1">{values.school}</p>}
                                </div>
                                <div className="p-5 space-y-2 text-sm">
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
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">{ta('ابدأ بملء الحقول لرؤية المعاينة', 'Start filling in the fields to see preview')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`@media print { nav, footer, button { display: none !important; } }`}</style>
        </div>
    );
}

// ===== Section Page =====
function SectionPage({ section, onBack }: { section: Section; onBack: () => void }) {
  const { dir } = useTranslation();
    const router = useRouter();
    const [selectedForm, setSelectedForm] = useState<FormDef | null>(null);

    if (section.id === 'initiatives') {
        router.push('/school-initiatives');
        return null;
    }

    if (selectedForm) return <FormFill form={selectedForm} gradient={section.gradient} onBack={() => setSelectedForm(null)} />;

    // الأيام العالمية لها تصميم Hero مختلف
    const isEvents = section.id === 'events' || section.id === 'technical' || section.id === 'strategies' || section.id === 'aids' || section.id === 'classroom-management-strategies';

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                {isEvents ? (
                    <section className={`relative overflow-hidden ${section.id === 'technical' ? 'bg-gradient-to-bl from-slate-900 via-emerald-950 to-slate-900' : section.id === 'strategies' ? 'bg-gradient-to-bl from-slate-900 via-amber-950 to-slate-900' : section.id === 'aids' ? 'bg-gradient-to-bl from-slate-900 via-cyan-950 to-slate-900' : section.id === 'classroom-management-strategies' ? 'bg-gradient-to-bl from-slate-900 via-rose-950 to-slate-900' : 'bg-gradient-to-bl from-slate-900 via-violet-950 to-slate-900'} text-white`}>
                        <div className="absolute inset-0 pointer-events-none">
                            <div className={`absolute top-10 right-[15%] w-72 h-72 ${section.id === 'technical' ? 'bg-emerald-500/20' : section.id === 'strategies' ? 'bg-amber-500/20' : section.id === 'aids' ? 'bg-cyan-500/20' : section.id === 'classroom-management-strategies' ? 'bg-rose-500/20' : 'bg-violet-500/20'} rounded-full blur-[120px]`} />
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
                            <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-gray-800 overflow-hidden" onClick={() => setSelectedForm(form)}>
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
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    if (selectedSection) return <SectionPage section={selectedSection} onBack={() => setSelectedSection(null)} />;

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
                            <ClipboardCheck className="w-4 h-4 text-violet-400" /> {ta('شواهد الأداء جاهزة', 'Performance Evidence Ready')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('شواهد تقييم الأداء جاهزة', 'Performance Assessment Evidence Ready')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('تقارير ونماذج جاهزة للتحميل والطباعة لجميع عناصر تقييم الأداء الوظيفي مع محتوى جاهز ومكتمل', 'Ready reports and forms for download and printing for all job performance assessment elements with complete content')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{SECTIONS.length} أقسام</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF مجاني', 'Free PDF Download')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                {/* Sections Grid */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SECTIONS.map(section => (
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
