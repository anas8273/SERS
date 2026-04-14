'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getServiceCategories } from '@/lib/firestore-service';
import toast from 'react-hot-toast';
import Image from 'next/image';

// Map Lucide icon names → emoji (so no English text shows)
const iconToEmoji: Record<string, string> = {
  'award': '🏅', 'folder': '📁', 'book': '📚', 'check-square': '☑️',
  'file-text': '📄', 'lightbulb': '💡', 'medal': '🏆', 'users': '👥',
  'play': '▶️', 'brain': '🧠', 'clipboard': '📋', 'calendar': '📅',
  'heart': '❤️', 'Heart': '❤️', 'star': '⭐', 'Star': '⭐',
  'GraduationCap': '🎓', 'graduationcap': '🎓',
  'Accessibility': '♿', 'accessibility': '♿',
  'Building2': '🏢', 'building2': '🏢', 'building': '🏢',
  'Baby': '👶', 'baby': '👶',
  'Trophy': '🏆', 'trophy': '🏆',
  'shield': '🛡️', 'Shield': '🛡️',
  'pen': '✏️', 'Pen': '✏️',
  'settings': '⚙️', 'Settings': '⚙️',
  'target': '🎯', 'Target': '🎯',
  'zap': '⚡', 'Zap': '⚡',
  'compass': '🧭', 'Compass': '🧭',
  'briefcase': '💼', 'Briefcase': '💼',
};
const getEmoji = (icon?: string) => icon ? (iconToEmoji[icon] || iconToEmoji[icon.toLowerCase()] || '📁') : '📁';

interface FirestoreCategory {
    id: string;
    name_ar: string;
    icon?: string;
    color?: string;
}

interface TemplateFormProps {
    templateId?: string;
}

export default function TemplateForm({ templateId }: TemplateFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<FirestoreCategory[]>([]);
    const [sections, setSections] = useState<{id: string; name_ar: string; icon?: string}[]>([]);
    const isEditMode = !!templateId;

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [dragActiveFile, setDragActiveFile] = useState(false);
    const [aiGenerating, setAiGenerating] = useState<'description' | 'tags' | 'price' | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
    const [savedDraft, setSavedDraft] = useState(false);
    const [thumbnailMeta, setThumbnailMeta] = useState<{size: number; width: number; height: number; type: string} | null>(null);
    const [fileMeta, setFileMeta] = useState<{size: number; name: string; ext: string} | null>(null);

    const [formData, setFormData] = useState({
        name_ar: '',
        description_ar: '',
        price: '',
        discount_price: '',
        section_id: '',
        category_id: '',
        type: 'ready',
        format: 'pdf',
        is_active: true,
        is_featured: false,
        tags: '',
        external_link: '',
        sort_order: '0',
    });

    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [templateFile, setTemplateFile] = useState<File | null>(null);

    // ── Smart format detection from file extension ──
    const FORMAT_MAP: Record<string, { label: string; emoji: string; color: string }> = {
        'pdf': { label: 'PDF', emoji: '📕', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        'doc': { label: 'Word', emoji: '📘', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        'docx': { label: 'Word', emoji: '📘', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        'ppt': { label: 'PowerPoint', emoji: '📙', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
        'pptx': { label: 'PowerPoint', emoji: '📙', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
        'xls': { label: 'Excel', emoji: '📗', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        'xlsx': { label: 'Excel', emoji: '📗', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        'zip': { label: 'ZIP', emoji: '📦', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
        'rar': { label: 'RAR', emoji: '📦', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    };

    const detectFormatFromFile = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        setDetectedFormat(ext);
        // Auto-set format field based on extension
        const formatMap: Record<string, string> = { pdf: 'pdf', doc: 'word', docx: 'word', ppt: 'powerpoint', pptx: 'powerpoint', xls: 'excel', xlsx: 'excel', zip: 'archive', rar: 'archive' };
        setFormData(prev => ({ ...prev, format: formatMap[ext] || 'digital' }));
    };

    // ── Unsaved changes guard ──
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    // ── Auto-draft save to localStorage (every 30s) ──
    const DRAFT_KEY = `template_draft_${templateId || 'new'}`;
    useEffect(() => {
        if (!isDirty) return;
        const timer = setInterval(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            setSavedDraft(true);
            setTimeout(() => setSavedDraft(false), 2000);
        }, 30000);
        return () => clearInterval(timer);
    }, [isDirty, formData, DRAFT_KEY]);

    // ── Restore draft on mount (only for new templates) ──
    useEffect(() => {
        if (!isEditMode) {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed.name_ar) {
                        setFormData(prev => ({ ...prev, ...parsed }));
                        toast.success(ta('💾 تم استعادة المسودة المحفوظة', '💾 Saved draft restored'), { duration: 3000 });
                    }
                } catch { /* ignore parse errors */ }
            }
        }
    // eslint-disable-next-line
    }, []);

    // ── Mark form as dirty on changes ──
    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    // ===== Load Categories from Firestore + Edit Data =====
    useEffect(() => {
        const initData = async () => {
            try {
                // Load Firestore categories + backend sections
                const [cats, sectionsRes] = await Promise.all([
                    getServiceCategories().catch(() => []),
                    api.getSections().catch(() => ({ data: [] })),
                ]);
                if (cats && cats.length > 0) {
                    setCategories(cats.map(c => ({
                        id: c.id,
                        name_ar: c.name_ar,
                        icon: c.icon,
                        color: c.color,
                    })));
                }
                const sd = sectionsRes.data || sectionsRes || [];
                if (Array.isArray(sd)) setSections(sd);

                // If editing, load template data
                if (isEditMode && templateId) {
                    const templateRes = await api.getAdminTemplate(templateId);
                    const template = templateRes.data;

                    setFormData({
                        name_ar: template.name_ar || '',
                        description_ar: template.description_ar || '',
                        price: template.price?.toString() || '',
                        discount_price: template.discount_price?.toString() || '',
                        section_id: template.section_id || '',
                        category_id: template.category?.id || template.category_id || '',
                        type: template.type || 'ready',
                        format: template.format || 'pdf',
                        is_active: template.is_active ?? true,
                        is_featured: template.is_featured ?? false,
                        tags: template.tags || '',
                        external_link: template.external_link || '',
                        sort_order: template.sort_order?.toString() || '0',
                    });

                    if (template.thumbnail_url) {
                        setImagePreview(template.thumbnail_url);
                    } else if (template.thumbnail) {
                        setImagePreview(`/storage/${template.thumbnail}`);
                    }
                }
            } catch (error) {
                logger.error(error);
                toast.error(ta('فشل تحميل البيانات', 'Failed to load data'));
            }
        };

        initData();
    }, [isEditMode, templateId]);


    // ===== Handlers =====
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImage(file);
        }
    };

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    const processImage = (file: File) => {
        // 1. Type validation — must be an actual image
        if (!file.type.startsWith('image/')) {
            toast.error(ta('⚠️ الملف المحدد ليس صورة! يرجى اختيار صورة (JPG, PNG, WEBP)', '⚠️ Selected file is not an image! Please choose an image (JPG, PNG, WEBP)'), { duration: 4000 });
            return;
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast.error(ta(`⚠️ صيغة الصورة غير مدعومة (${file.type.split('/')[1]?.toUpperCase()})`, `⚠️ Unsupported image format (${file.type.split('/')[1]?.toUpperCase()})`), { duration: 4000 });
            return;
        }
        // 2. Size validation — reject if > 10MB (don't upload)
        if (file.size > 10 * 1024 * 1024) {
            toast.error(ta('⚠️ صورة الغلاف كبيرة جداً! الحد الأقصى 10MB', '⚠️ Cover image too large! Max 10MB'), { duration: 4000 });
            return;
        }
        setThumbnail(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        setIsDirty(true);
        // Get image dimensions
        const img = new window.Image();
        img.onload = () => {
            setThumbnailMeta({ size: file.size, width: img.width, height: img.height, type: file.type });
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            const ext = file.type.split('/')[1]?.toUpperCase() || 'IMG';
            toast.success(ta(`✅ تم رفع الصورة (${ext} — ${sizeMB} MB — ${img.width}×${img.height})`, `✅ Image uploaded (${ext} — ${sizeMB} MB — ${img.width}×${img.height})`), { duration: 3000 });
            // Warn if dimensions are too small
            if (img.width < 400 || img.height < 300) {
                toast(ta('💡 الصورة صغيرة — يُنصح بأبعاد 800×600 على الأقل', '💡 Image is small — recommended 800×600 minimum'), { icon: '📐', duration: 4000 });
            }
            // Warn if too large dimensions (performance)
            if (img.width > 4000 || img.height > 4000) {
                toast(ta('💡 الصورة كبيرة الأبعاد — قد يُبطئ تحميل الصفحة', '💡 Image has very large dimensions — may slow page loading'), { icon: '📐', duration: 4000 });
            }
        };
        img.src = url;
    };

    const processTemplateFile = (file: File) => {
        // Instant size validation
        if (file.size > 20 * 1024 * 1024) {
            toast.error(ta('⚠️ ملف القالب كبير جداً! الحد الأقصى 20MB', '⚠️ Template file too large! Max 20MB'), { duration: 4000 });
            return;
        }
        setTemplateFile(file);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        setFileMeta({ size: file.size, name: file.name, ext });
        detectFormatFromFile(file);
        setIsDirty(true);
        // Success feedback
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        toast.success(ta(`✅ تم رفع الملف (${sizeMB} MB)`, `✅ File uploaded (${sizeMB} MB)`), { duration: 2000 });
    };

    const handleDrag = (e: React.DragEvent, active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(active);
    };

    const handleDropThumbnail = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        }
    };

    const handleDragFile = (e: React.DragEvent, active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveFile(active);
    };

    const handleDropFile = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processTemplateFile(file);
        }
    };

    // ===== AI Assistant (Smart + Context-Aware + Bilingual) =====
    const isArabicSite = typeof window !== 'undefined' && document.documentElement.lang !== 'en';

    // ── Synonym dictionary for tag enrichment ──
    const SYNONYM_MAP: Record<string, string[]> = {
        'خطة': ['تخطيط', 'برنامج', 'جدول'],
        'سجل': ['توثيق', 'متابعة', 'تدوين'],
        'شهادة': ['تقدير', 'شكر', 'تكريم'],
        'تحليل': ['إحصائيات', 'تقييم', 'قياس'],
        'ملف': ['حقيبة', 'ملف إنجاز', 'بورتفوليو'],
        'اختبار': ['امتحان', 'تقييم', 'قياس'],
        'درجات': ['نتائج', 'علامات', 'تقييم'],
        'تحضير': ['إعداد', 'تجهيز', 'خطة درس'],
        'توزيع': ['منهج', 'مقرر', 'فصلي'],
        'نموذج': ['استمارة', 'قالب', 'صيغة'],
    };

    // ── Complexity scoring for price ──
    const COMPLEXITY_WEIGHTS: Record<string, number> = {
        'ملف إنجاز': 55, 'حقيبة تدريبية': 65, 'دليل شامل': 60,
        'سجل متابعة': 35, 'سجل': 30, 'متابعة': 28,
        'خطة علاجية': 25, 'خطة': 22, 'تحضير': 20, 'خطة درس': 20,
        'شهادة': 15, 'بطاقة': 12, 'استمارة': 12, 'نموذج': 10,
        'توزيع': 18, 'منهج': 22, 'اختبار': 18,
        'تقرير': 20, 'تحليل': 25, 'إحصائيات': 22,
    };

    const generateDescription = async () => {
        if (!formData.name_ar.trim()) {
            toast.error(isArabicSite ? 'أدخل اسم القالب أولاً لتوليد الوصف' : 'Enter template name first to generate description');
            return;
        }
        setAiGenerating('description');
        const name = formData.name_ar.trim();
        const categoryName = categories.find(c => c.id === formData.category_id)?.name_ar || '';
        const sectionName = sections.find(s => s.id === formData.section_id)?.name_ar || '';
        const templateType = formData.type === 'interactive' ? (isArabicSite ? 'تفاعلي' : 'interactive') : (isArabicSite ? 'جاهز' : 'ready-made');
        const format = formData.format?.toUpperCase() || 'PDF';

        await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

        // ── Build intelligent description based on context ──
        let desc = '';
        if (isArabicSite) {
            // Arabic description
            const intro = `قالب "${name}" — أداة تعليمية احترافية بصيغة ${format} ${templateType === 'تفاعلي' ? 'تفاعلية قابلة للتعديل المباشر' : 'جاهزة للطباعة والاستخدام الفوري'}`;
            const audience = sectionName ? `مصمم خصيصاً لقسم "${sectionName}"` : 'مصمم للعاملين في القطاع التعليمي';
            const category = categoryName ? `ضمن تصنيف "${categoryName}"` : '';

            // Smart features based on template name analysis
            const features: string[] = [];
            if (name.includes('ملف') || name.includes('حقيبة')) features.push('يحتوي على أقسام منظمة وفهرس شامل');
            if (name.includes('سجل') || name.includes('متابعة')) features.push('جداول متابعة يومية/أسبوعية جاهزة للتعبئة');
            if (name.includes('شهادة') || name.includes('تقدير')) features.push('تصاميم متعددة احترافية قابلة للتخصيص');
            if (name.includes('خطة') || name.includes('تحضير')) features.push('هيكلة واضحة مع أهداف ومخرجات محددة');
            if (name.includes('تحليل') || name.includes('نتائج')) features.push('رسوم بيانية وإحصائيات تفصيلية');
            if (name.includes('توزيع') || name.includes('منهج')) features.push('تقسيم زمني مرن حسب الأسابيع والفصول');
            if (name.includes('اختبار')) features.push('نماذج أسئلة متنوعة مع مفاتيح التصحيح');
            if (features.length === 0) features.push('محتوى شامل ومتكامل يغطي جميع الجوانب المطلوبة');
            features.push('يوفر عليك ساعات من العمل اليدوي');

            desc = `${intro}.\n\n${audience}${category ? ` ${category}` : ''}.\n\n✅ المميزات:\n${features.map(f => `• ${f}`).join('\n')}\n\n🎯 مناسب للمعلمين والمعلمات والإداريين التربويين.`;
        } else {
            // English description
            const intro = `"${name}" — A professional educational template in ${format} format, ${templateType === 'interactive' ? 'fully interactive and editable' : 'ready to print and use immediately'}`;
            const audience = sectionName ? `Specifically designed for the "${sectionName}" department` : 'Designed for education professionals';
            const category = categoryName ? `in the "${categoryName}" category` : '';

            const features: string[] = [];
            features.push('Comprehensive content covering all required aspects');
            features.push('Professional design following latest educational standards');
            features.push('Saves you hours of manual work');

            desc = `${intro}.\n\n${audience}${category ? ` ${category}` : ''}.\n\n✅ Features:\n${features.map(f => `• ${f}`).join('\n')}\n\n🎯 Suitable for teachers, administrators, and education professionals.`;
        }

        setFormData(prev => ({ ...prev, description_ar: desc }));
        setAiGenerating(null);
        toast.success(isArabicSite ? '✨ تم توليد الوصف بنجاح' : '✨ Description generated successfully');
    };

    const generateTags = async () => {
        if (!formData.name_ar.trim()) {
            toast.error(isArabicSite ? 'أدخل اسم القالب أولاً' : 'Enter template name first');
            return;
        }
        setAiGenerating('tags');
        const name = formData.name_ar.trim();
        const desc = formData.description_ar;
        const text = `${name} ${desc}`;

        // ── Stop-words filter ──
        const STOP_WORDS = new Set([
            'في', 'من', 'إلى', 'على', 'عن', 'هذا', 'هذه', 'التي', 'الذي', 'مع',
            'بعد', 'قبل', 'غير', 'أو', 'كل', 'بين', 'عند', 'حتى', 'لكن', 'ذلك',
            'هو', 'هي', 'ثم', 'أن', 'إن', 'لا', 'ما', 'قد', 'وهو', 'وهي', 'أي',
            'يمكن', 'يتم', 'عبر', 'خلال', 'حسب', 'دون', 'يكون', 'تكون', 'كان',
            'المطلوبة', 'الفوري', 'الجهد', 'الوقت', 'عليك', 'ساعات', 'التي', 'أداة',
        ]);

        // ── Extract meaningful words with frequency scoring (TF-IDF like) ──
        const words = text
            .replace(/[،,.!؟?:;"""()[\]{}\-_=+\\|/~`@#$%^&*✅🎯•\n]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w));

        const freq = new Map<string, number>();
        words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));

        // Sort by frequency descending
        const ranked = [...freq.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([word]) => word)
            .slice(0, 6);

        // ── Expand with synonyms ──
        const expanded = new Set(ranked);
        for (const word of ranked) {
            for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
                if (word.includes(key)) {
                    synonyms.forEach(s => expanded.add(s));
                }
            }
        }

        // ── Add contextual tags ──
        const categoryName = categories.find(c => c.id === formData.category_id)?.name_ar;
        const sectionName = sections.find(s => s.id === formData.section_id)?.name_ar;
        if (categoryName) expanded.add(categoryName);
        if (sectionName) expanded.add(sectionName);
        expanded.add('تعليم');
        expanded.add('قوالب');

        await new Promise(r => setTimeout(r, 500 + Math.random() * 300));

        setFormData(prev => ({ ...prev, tags: [...expanded].slice(0, 12).join('، ') }));
        setAiGenerating(null);
        toast.success(isArabicSite ? '✨ تم توليد الكلمات المفتاحية' : '✨ Tags generated successfully');
    };

    const suggestPrice = async () => {
        if (!formData.name_ar.trim()) {
            toast.error(isArabicSite ? 'أدخل اسم القالب أولاً' : 'Enter template name first');
            return;
        }
        setAiGenerating('price');

        const name = formData.name_ar.toLowerCase();
        let score = 20; // Base SAR

        // ── Multi-factor analysis ──
        // Factor 1: Template name complexity
        for (const [keyword, weight] of Object.entries(COMPLEXITY_WEIGHTS)) {
            if (name.includes(keyword)) {
                score = Math.max(score, weight);
                break;
            }
        }

        // Factor 2: Format premium
        if (formData.format === 'pptx' || formData.format === 'docx') score += 5;
        if (formData.type === 'interactive') score += 10;

        // Factor 3: Featured premium
        if (formData.is_featured) score += 8;

        // Factor 4: Complexity keywords boost
        const boostWords = ['شامل', 'كامل', 'متكامل', 'احترافي', 'متقدم', 'ذكي', 'تفاعلي'];
        const matchedBoosts = boostWords.filter(w => name.includes(w)).length;
        score += matchedBoosts * 10;

        // Factor 5: Section-based adjustment
        const sectionName = sections.find(s => s.id === formData.section_id)?.name_ar?.toLowerCase() || '';
        if (sectionName.includes('رياض') || sectionName.includes('أطفال')) score -= 5;
        if (sectionName.includes('إداري') || sectionName.includes('قياد')) score += 10;

        // ── Suggest range ──
        const min = Math.max(5, score - 5);
        const max = score + 10;
        const suggested = Math.round(score);

        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

        setFormData(prev => ({ ...prev, price: suggested.toString() }));
        setAiGenerating(null);
        toast.success(
            isArabicSite
                ? `💰 السعر المقترح: ${suggested} ر.س (النطاق: ${min}-${max} ر.س)`
                : `💰 Suggested price: ${suggested} SAR (Range: ${min}-${max} SAR)`
        );
    };

    // ===== Computed =====
    const discountPercent = formData.price && formData.discount_price
        ? Math.round(((parseFloat(formData.price) - parseFloat(formData.discount_price)) / parseFloat(formData.price)) * 100)
        : 0;

    // ===== Submit =====
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ── Comprehensive Client-side Validation ──
        if (!formData.name_ar.trim()) {
            toast.error(ta('⚠️ اسم القالب مطلوب — أدخل اسماً واضحاً يصف القالب', '⚠️ Template name is required'), { duration: 4000 });
            return;
        }
        if (formData.name_ar.length > 255) {
            toast.error(ta('⚠️ اسم القالب طويل جداً (الحد الأقصى 255 حرف)', '⚠️ Template name is too long (max 255 characters)'), { duration: 4000 });
            return;
        }
        if (!formData.description_ar.trim()) {
            toast.error(ta('⚠️ وصف القالب مطلوب — أضف وصفاً يوضح محتوى القالب', '⚠️ Template description is required'), { duration: 4000 });
            return;
        }
        if (!formData.price && formData.price !== '0') {
            toast.error(ta('⚠️ السعر مطلوب — ضع 0 إذا كان القالب مجانياً', '⚠️ Price is required — set 0 for free templates'), { duration: 4000 });
            return;
        }
        if (parseFloat(formData.price) < 0) {
            toast.error(ta('⚠️ السعر لا يمكن أن يكون سالباً', '⚠️ Price cannot be negative'), { duration: 4000 });
            return;
        }
        if (formData.discount_price && parseFloat(formData.discount_price) >= parseFloat(formData.price)) {
            toast.error(ta('⚠️ سعر الخصم يجب أن يكون أقل من السعر الأصلي', '⚠️ Discount price must be less than original price'), { duration: 4000 });
            return;
        }
        if (!formData.category_id) {
            toast.error(ta('⚠️ يرجى اختيار تصنيف للقالب', '⚠️ Please select a category'), { duration: 4000 });
            return;
        }
        // File validation for new templates only
        if (!isEditMode && !thumbnail) {
            toast.error(ta('⚠️ صورة الغلاف مطلوبة — اضغط على منطقة الرفع لاختيار صورة', '⚠️ Cover image is required — click the upload area'), { duration: 5000 });
            return;
        }
        if (!isEditMode && !templateFile) {
            toast.error(ta('⚠️ ملف القالب مطلوب — ارفع ملف PDF أو Word أو ZIP', '⚠️ Template file is required — upload PDF, Word, or ZIP'), { duration: 5000 });
            return;
        }
        // File size validation (before uploading)
        if (thumbnail && thumbnail.size > 10 * 1024 * 1024) {
            toast.error(ta('⚠️ حجم صورة الغلاف كبير جداً (الحد الأقصى 10MB)', '⚠️ Cover image is too large (max 10MB)'), { duration: 4000 });
            return;
        }
        if (templateFile && templateFile.size > 20 * 1024 * 1024) {
            toast.error(ta('⚠️ حجم ملف القالب كبير جداً (الحد الأقصى 20MB)', '⚠️ Template file is too large (max 20MB)'), { duration: 4000 });
            return;
        }

        setIsLoading(true);

        try {
            const data = new FormData();

            data.append('name_ar', formData.name_ar);
            data.append('description_ar', formData.description_ar);
            data.append('price', formData.price);
            // category_id stores Firestore service_categories document ID
            if (formData.category_id) {
                data.append('category_id', formData.category_id);
            }
            // section_id stores MySQL section UUID
            if (formData.section_id) {
                data.append('section_id', formData.section_id);
            }
            data.append('type', formData.type);
            data.append('format', formData.format);
            data.append('is_active', formData.is_active ? '1' : '0');
            data.append('is_featured', formData.is_featured ? '1' : '0');
            data.append('sort_order', formData.sort_order || '0');

            if (formData.discount_price) {
                data.append('discount_price', formData.discount_price);
            }

            if (formData.tags) {
                data.append('tags', formData.tags);
            }

            if (formData.external_link) {
                data.append('external_link', formData.external_link);
            }

            if (thumbnail) {
                data.append('thumbnail', thumbnail);
            }

            if (templateFile) {
                data.append('ready_file', templateFile);
            }

            if (isEditMode && templateId) {
                await api.updateTemplate(templateId, data);
                toast.success(ta('تم تحديث القالب بنجاح ✅', 'Template updated successfully ✅'), { duration: 3000 });
            } else {
                await api.createTemplate(data);
                toast.success(ta('تم إضافة القالب بنجاح 🚀', 'Template added successfully 🚀'), {
                    duration: 4000,
                    icon: '🎉',
                });
            }

            // Clear draft and dirty flag on success
            setIsDirty(false);
            localStorage.removeItem(DRAFT_KEY);
            router.push('/admin/templates');
            router.refresh();
        } catch (error: any) {
            logger.error(error);
            const status = error.response?.status;
            const serverMsg = error.response?.data?.message;
            const errors = error.response?.data?.errors;

            // ── Map specific HTTP errors to clear user-friendly messages ──
            if (errors && typeof errors === 'object') {
                // Laravel validation errors — show each field error
                const fieldLabels: Record<string, string> = {
                    name_ar: ta('اسم القالب', 'Template name'),
                    description_ar: ta('الوصف', 'Description'),
                    price: ta('السعر', 'Price'),
                    discount_price: ta('سعر الخصم', 'Discount price'),
                    category_id: ta('التصنيف', 'Category'),
                    section_id: ta('القسم', 'Section'),
                    thumbnail: ta('صورة الغلاف', 'Cover image'),
                    ready_file: ta('ملف القالب', 'Template file'),
                    type: ta('نوع القالب', 'Template type'),
                    format: ta('صيغة الملف', 'File format'),
                };
                Object.entries(errors).forEach(([field, errArr]: [string, any]) => {
                    const label = fieldLabels[field] || field;
                    if (Array.isArray(errArr)) {
                        errArr.forEach((e: string) => {
                            toast.error(`❌ ${label}: ${e}`, { duration: 6000 });
                        });
                    }
                });
            } else if (status === 413) {
                toast.error(ta(
                    '❌ فشل الرفع — حجم الملف أكبر من المسموح. تأكد أن حجم الملف لا يتجاوز 20MB والصورة لا تتجاوز 10MB',
                    '❌ Upload failed — file too large. Ensure file is under 20MB and image under 10MB'
                ), { duration: 7000 });
            } else if (status === 422) {
                toast.error(`❌ ${serverMsg || ta('خطأ في البيانات المدخلة — تحقق من جميع الحقول', 'Validation error — check all fields')}`, { duration: 5000 });
            } else if (status === 401) {
                toast.error(ta(
                    '🔒 انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى',
                    '🔒 Session expired — please log in again'
                ), { duration: 5000 });
            } else if (status === 403) {
                toast.error(ta(
                    '🚫 ليس لديك صلاحية لتنفيذ هذا الإجراء',
                    '🚫 You do not have permission for this action'
                ), { duration: 5000 });
            } else if (status === 500) {
                toast.error(ta(
                    '❌ خطأ في الخادم — يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم الفني',
                    '❌ Server error — please try again later or contact support'
                ), { duration: 6000 });
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error(ta(
                    '⏳ انتهت مهلة الرفع — الاتصال بطيء أو حجم الملف كبير. حاول مرة أخرى',
                    '⏳ Upload timed out — slow connection or large file. Try again'
                ), { duration: 6000 });
            } else if (error.message?.includes('Network Error') || !navigator.onLine) {
                toast.error(ta(
                    '🌐 لا يوجد اتصال بالإنترنت — تحقق من الاتصال وحاول مرة أخرى',
                    '🌐 No internet connection — check your connection and try again'
                ), { duration: 6000 });
            } else {
                toast.error(`❌ ${serverMsg || ta('حدث خطأ غير متوقع أثناء الحفظ. يرجى المحاولة مرة أخرى', 'An unexpected error occurred. Please try again')}`, { duration: 5000 });
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* ═══════════════ Section 1: المعلومات الأساسية ═══════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">📋</span>
                        {ta('المعلومات الأساسية', 'Basic Information')}
                    </h2>
                </div>
                <div className="p-6 space-y-5">
                    {/* اسم القالب */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {ta('اسم القالب', 'Template Name')}<span className="text-red-500">*</span>
                        </label>
                        <input
                            
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all text-base"
                            placeholder={ta('مثال: سجل متابعة الطلاب', 'Example: Student Follow-up Log')}
                            value={formData.name_ar}
                            onChange={(e) => updateFormData({ name_ar: e.target.value })}
                        />
                        <div className="flex justify-between mt-1.5">
                            <p className="text-xs text-gray-400">{ta('اسم واضح يصف القالب', 'A clear name describing the template')}</p>
                            <span className={`text-xs ${formData.name_ar.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                                {formData.name_ar.length}/60
                            </span>
                        </div>
                    </div>

                    {/* الوصف */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                            <span>{ta('وصف القالب', 'Template Description')}<span className="text-red-500">*</span></span>
                            <button
                                type="button"
                                onClick={generateDescription}
                                disabled={aiGenerating === 'description'}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-l from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-200 dark:border-violet-800 transition-all hover:scale-[1.02] disabled:opacity-50"
                            >
                                {aiGenerating === 'description' ? (
                                    <><span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> {ta('جاري التوليد...', 'Generating...')}</>
                                ) : (
                                    <>{ta('✨ توليد بالذكاء الاصطناعي', '✨ Generate with AI')}</>
                                )}
                            </button>
                        </label>
                        <textarea
                            
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all resize-none"
                            placeholder={ta('وصف مفصل للقالب ومحتوياته وفوائده...', 'Detailed description of the template, its contents, and benefits...')}
                            value={formData.description_ar}
                            onChange={(e) => updateFormData({ description_ar: e.target.value })}
                        />
                        <div className="flex justify-between mt-1.5">
                            <p className="text-xs text-gray-400">{ta('وصف شامل يساعد المستخدم على فهم القالب', 'A comprehensive description to help the user understand the template')}</p>
                            <span className={`text-xs ${formData.description_ar.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                {formData.description_ar.length}/500
                            </span>
                        </div>
                    </div>

                    {/* الكلمات المفتاحية */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                            <span>
                                {ta('الكلمات المفتاحية', 'Keywords')}
                                <span className="text-xs text-gray-400 font-normal me-1">{ta('(تساعد في تحسين نتائج البحث)', '(Helps improve search results)')}</span>
                            </span>
                            <button
                                type="button"
                                onClick={generateTags}
                                disabled={aiGenerating === 'tags'}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-l from-teal-500/10 to-emerald-500/10 text-teal-600 dark:text-teal-400 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-200 dark:border-teal-800 transition-all hover:scale-[1.02] disabled:opacity-50"
                            >
                                {aiGenerating === 'tags' ? (
                                    <><span className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> {ta('جاري...', 'Processing...')}</>
                                ) : (
                                    <>{ta('✨ توليد كلمات مفتاحية', '✨ Generate Keywords')}</>
                                )}
                            </button>
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="سجل، متابعة، أداء، طلاب — افصل بفاصلة"
                            value={formData.tags}
                            onChange={(e) => updateFormData({ tags: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* ═══════════════ Section 2: القسم والتصنيف ═══════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center text-white text-sm">📂</span>
                        {ta('القسم والتصنيف', 'Section and Category')}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ta('اختر القسم أولاً ثم التصنيف المناسب', 'Select the section first then the appropriate category')}</p>
                </div>
                {/* Section Selector */}
                <div className="px-6 pt-6 pb-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {ta('القسم', 'Section')}
                    </label>
                    <select
                        value={formData.section_id}
                        onChange={(e) => updateFormData({ section_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all bg-white appearance-none"
                    >
                        <option value="">{ta('— اختر القسم —', '— Select Section —')}</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>{getEmoji(s.icon)} {s.name_ar}</option>
                        ))}
                    </select>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        {ta('التصنيف', 'Classification')}<span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => updateFormData({ category_id: cat.id })}
                                className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-[1.02] ${
                                    formData.category_id === cat.id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                            >
                                <span className="text-2xl block mb-1">{getEmoji(cat.icon)}</span>
                                <span className={`text-xs font-bold block ${
                                    formData.category_id === cat.id
                                        ? 'text-primary'
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                    {cat.name_ar}
                                </span>
                            </button>
                        ))}
                    </div>
                    {categories.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                            {ta('⚠️ لا توجد تصنيفات — أضف تصنيفات أولاً', '⚠️ No categories — Add categories first')}
                        </p>
                    )}
                    {formData.category_id && (
                        <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                            <span className="text-lg">📍</span>
                            <div className="text-sm flex items-center gap-1.5">
                                <span className="text-gray-500">{ta('التصنيف المختار:', 'Selected Category:')}</span>
                                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                    {categories.find(c => c.id === formData.category_id)?.icon || '📁'} {categories.find(c => c.id === formData.category_id)?.name_ar}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>



            {/* ═══════════════ Section 3: التسعير ═══════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-l from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">💰</span>
                        {ta('التسعير', 'Pricing')}
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                            <span>{ta('السعر (ر.س)', 'Price (SAR)')}<span className="text-red-500">*</span></span>
                            <button
                                type="button"
                                onClick={suggestPrice}
                                disabled={aiGenerating === 'price'}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-l from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200 dark:border-amber-800 transition-all hover:scale-[1.02] disabled:opacity-50"
                            >
                                {aiGenerating === 'price' ? (
                                    <><span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> {ta('جاري...', 'Processing...')}</>
                                ) : (
                                    <>{ta('💰 اقتراح سعر', '💰 Suggest Price')}</>
                                )}
                            </button>
                        </label>
                            <div className="relative">
                                <input
                                    
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 ps-16 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all text-lg font-bold"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={(e) => updateFormData({ price: e.target.value })}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">{ta('ر.س', 'SAR')}</span>
                            </div>
                            {(!formData.price || formData.price === '0') && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">{ta('⚠️ يجب تحديد سعر — جميع القوالب مدفوعة', '⚠️ Price must be set — all templates are paid')}</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                {ta('سعر الخصم', 'Discount Price')}
                                <span className="text-xs text-gray-400 font-normal me-1">{ta('(اختياري)', '(Optional)')}</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 ps-16 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all text-lg font-bold"
                                    placeholder="—"
                                    value={formData.discount_price}
                                            onChange={(e) => updateFormData({ discount_price: e.target.value })}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">{ta('ر.س', 'SAR')}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black rounded-full">
                                        {ta(`خصم ${discountPercent}%`, `${discountPercent}% OFF`)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {ta(`يوفر ${(parseFloat(formData.price) - parseFloat(formData.discount_price)).toFixed(2)} ر.س`, `Saves ${(parseFloat(formData.price) - parseFloat(formData.discount_price)).toFixed(2)} SAR`)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>




            {/* ═══════════════ Section 5: الملفات ═══════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm">📎</span>
                        {ta('الملفات', 'Files')}
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                {ta('صورة الغلاف', 'Cover Image')} {!isEditMode && <span className="text-red-500">*</span>}
                            </label>
                            <div
                                className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                                    dragActive
                                        ? 'border-primary bg-primary/5 scale-[1.01]'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                }`}
                                onDragEnter={(e) => handleDrag(e, true)}
                                onDragOver={(e) => handleDrag(e, true)}
                                onDragLeave={(e) => handleDrag(e, false)}
                                onDrop={handleDropThumbnail}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="thumbnail-upload"
                                />
                                <label htmlFor="thumbnail-upload" className="cursor-pointer block">
                                    {imagePreview ? (
                                        <div className="relative w-full h-52">
                                            <Image src={imagePreview} alt="Preview" fill sizes="200px" className="object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group">
                                                <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-4 py-2 rounded-xl text-sm">
                                                    {ta('🔄 تغيير الصورة', '🔄 Change Image')}
                                                </span>
                                            </div>
                                            {/* Smart file info badge */}
                                            {thumbnailMeta && (
                                                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${thumbnailMeta.size > 5 * 1024 * 1024 ? 'bg-red-500/90 text-white' : thumbnailMeta.size > 2 * 1024 * 1024 ? 'bg-amber-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
                                                        📦 {(thumbnailMeta.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${thumbnailMeta.width < 400 ? 'bg-amber-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
                                                        📐 {thumbnailMeta.width}×{thumbnailMeta.height}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-800/80 text-white backdrop-blur-sm">
                                                        {thumbnailMeta.type.split('/')[1]?.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <div className="text-5xl mb-3 opacity-50">🖼️</div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{ta('اسحب الصورة أو اضغط للرفع', 'Drag image or click to upload')}</p>
                                            <p className="text-xs text-gray-400 mt-1">{ta('PNG, JPG, WebP — حتى 2MB', 'PNG, JPG, WebP — up to 2MB')}</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Template File Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                {ta('ملف القالب', 'Template File')} {!isEditMode && <span className="text-red-500">*</span>}
                                {isEditMode && <span className="text-xs text-gray-400 font-normal me-1">{ta('(اختياري — للاحتفاظ بالملف الحالي)', '(Optional — to keep the current file)')}</span>}
                            </label>
                            <div
                                className={`border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                                    dragActiveFile
                                        ? 'border-primary bg-primary/5 scale-[1.01]'
                                        : templateFile
                                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                }`}
                                onDragEnter={(e) => handleDragFile(e, true)}
                                onDragOver={(e) => handleDragFile(e, true)}
                                onDragLeave={(e) => handleDragFile(e, false)}
                                onDrop={handleDropFile}
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.zip,.docx,.doc,.pptx,.xlsx,.rar,.7z"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        if (f) { processTemplateFile(f); }
                                    }}
                                    className="hidden"
                                    id="template-file-upload"
                                />
                                <label htmlFor="template-file-upload" className="cursor-pointer block">
                                    {templateFile ? (
                                        <div className="py-10 text-center">
                                            <div className="text-5xl mb-3">✅</div>
                                            <p className="text-green-700 dark:text-green-400 font-bold text-sm">{templateFile.name}</p>
                                            {/* Smart file info badges */}
                                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${fileMeta && fileMeta.size > 15 * 1024 * 1024 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : fileMeta && fileMeta.size > 8 * 1024 * 1024 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                    📦 {(templateFile.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                                {detectedFormat && FORMAT_MAP[detectedFormat] && (
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${FORMAT_MAP[detectedFormat].color}`}>
                                                        {FORMAT_MAP[detectedFormat].emoji} {FORMAT_MAP[detectedFormat].label}
                                                    </span>
                                                )}
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {templateFile.size > 1024 * 1024 ? ta('ملف كبير', 'Large file') : ta('ملف خفيف', 'Light file')} ✓
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">{ta('اضغط لتغيير الملف', 'Click to change file')}</p>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <div className="text-5xl mb-3 opacity-50">📎</div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{ta('اسحب الملف أو اضغط للرفع', 'Drag file or click to upload')}</p>
                                            <p className="text-xs text-gray-400 mt-1">{ta('PDF, ZIP, DOCX — حتى 10MB', 'PDF, ZIP, DOCX — up to 10MB')}</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* صيغة الملف — اكتشاف تلقائي ذكي (تظهر بعد رفع الملف) */}
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {ta('صيغة الملف', 'File Format')}
                            <span className="text-xs text-gray-400 font-normal me-2">{ta('(تُكتشف تلقائياً من الملف)', '(Auto-detected from file)')}</span>
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            {detectedFormat || formData.format !== 'pdf' ? (
                                <>
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${FORMAT_MAP[detectedFormat || '']?.color || 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
                                        {FORMAT_MAP[detectedFormat || '']?.emoji || '📄'} {FORMAT_MAP[detectedFormat || '']?.label || formData.format?.toUpperCase() || 'PDF'}
                                    </span>
                                    <span className="text-xs text-gray-400">{ta('تم اكتشاف الصيغة تلقائياً', 'Format auto-detected')}</span>
                                </>
                            ) : (
                                <span className="text-sm text-gray-400">{ta('📎 ارفع ملف القالب لاكتشاف الصيغة تلقائياً', '📎 Upload template file to auto-detect format')}</span>
                            )}
                        </div>
                    </div>

                    {/* ── رابط إلكتروني (بديل أو مكمّل للملف) ── */}
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {ta('🔗 رابط إلكتروني (اختياري)', '🔗 External Link (Optional)')}
                            <span className="text-xs text-gray-400 font-normal me-2">{ta('— بديل عن رفع الملف أو مكمّل له', '— Alternative to file upload or complementary')}</span>
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={formData.external_link}
                                onChange={(e) => updateFormData({ external_link: e.target.value })}
                                className="w-full px-4 py-3 ps-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all text-sm"
                                placeholder="https://drive.google.com/..."
                                dir="ltr"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🌐</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">{ta('رابط Google Drive أو Dropbox أو أي رابط خارجي للقالب الرقمي', 'Google Drive, Dropbox, or any external link for the digital template')}</p>
                    </div>
                </div>
            </div>

            {/* ═══════════════ Section 6: خيارات العرض ═══════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-l from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center text-white text-sm">⚙️</span>
                        {ta('خيارات العرض والترتيب', 'Display and Order Options')}
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* نشط */}
                        <button
                            type="button"
                            onClick={() => updateFormData({ is_active: !formData.is_active })}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${
                                formData.is_active
                                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                formData.is_active ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                            }`}>
                                {formData.is_active ? '✅' : '🚫'}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                    {formData.is_active ? ta('نشط — مرئي في المتجر', 'Active — Visible in Store') : ta('مخفي — غير ظاهر', 'Hidden — Not Visible')}
                                </p>
                                <p className="text-xs text-gray-400">{ta(`القالب ${formData.is_active ? 'سيظهر' : 'لن يظهر'} للمستخدمين`, `Template ${formData.is_active ? 'will be visible' : 'will not be visible'} to users`)}</p>
                            </div>
                        </button>

                        {/* مميز */}
                        <button
                            type="button"
                            onClick={() => updateFormData({ is_featured: !formData.is_featured })}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${
                                formData.is_featured
                                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                formData.is_featured ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                            }`}>
                                {formData.is_featured ? '⭐' : '☆'}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                    {formData.is_featured ? ta('مميز — يظهر في الرئيسية', 'Featured — Shown on Homepage') : ta('عادي', 'Normal')}
                                </p>
                                <p className="text-xs text-gray-400">{ta('القوالب المميزة تظهر في بداية المتجر', 'Featured templates appear at the start of the store')}</p>
                            </div>
                        </button>
                    </div>

                    {/* ترتيب العرض */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {ta('ترتيب العرض', 'Display Order')}
                            <span className="text-xs text-gray-400 font-normal me-1">{ta('(رقم أصغر = يظهر أولاً)', '(Smaller number = appears first)')}</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="w-full max-w-xs px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:bg-gray-700 dark:text-white transition-all"
                            value={formData.sort_order}
                            onChange={(e) => updateFormData({ sort_order: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* ═══════════════ زر الحفظ ═══════════════ */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                {savedDraft && (
                    <span className="text-xs text-green-500 font-medium animate-pulse">{ta('💾 تم حفظ المسودة', '💾 Draft saved')}</span>
                )}
                <button
                    type="button"
                    onClick={() => {
                        if (isDirty) {
                            if (window.confirm(ta('⚠️ لديك تغييرات غير محفوظة. هل تريد المغادرة بدون حفظ؟', '⚠️ You have unsaved changes. Leave without saving?'))) {
                                localStorage.removeItem(DRAFT_KEY);
                                router.push('/admin/templates');
                            }
                        } else {
                            router.push('/admin/templates');
                        }
                    }}
                    className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    {ta('← العودة للقوالب', '← Back to Templates')}
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-xl text-white font-black shadow-lg transition-all text-base ${
                        isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-l from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 hover:shadow-xl hover:-translate-y-0.5 shadow-primary/20'
                    }`}
                >
                    {isLoading ? ta('⏳ جاري الحفظ...', '⏳ Saving...') : (isEditMode ? ta('✅ تحديث القالب', '✅ Update Template') : ta('🚀 حفظ ونشر القالب', '🚀 Save & Publish'))}
                </button>
            </div>
        </form>
    );
}
