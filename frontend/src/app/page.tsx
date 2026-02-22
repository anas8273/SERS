'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { TemplateCardSkeleton } from '@/components/ui/skeletons';
import { ServicesSection, AISection } from '@/components/services';
import {
    Star,
    ArrowLeft,
    Zap,
    ShieldCheck,
    Layout,
    Users,
    Sparkles,
    BookOpen,
    GraduationCap,
    Palette,
    Baby
} from 'lucide-react';
import type { Template, Category } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function HomePage() {
    const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, categoriesRes] = await Promise.all([
                    api.getFeaturedTemplates().catch(() => ({ data: [] })),
                    api.getCategories().catch(() => ({ data: [] })),
                ]);
                // Handle both paginated {data: [...]} and direct array responses
                const templatesData = templatesRes.data?.data || templatesRes.data || [];
                const categoriesData = categoriesRes.data?.data || categoriesRes.data || [];
                setFeaturedTemplates(Array.isArray(templatesData) ? templatesData.slice(0, 8) : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData.slice(0, 6) : []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-500" dir="rtl">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-48">
                    {/* Background Elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                    </div>

                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-fade-in">
                                <Sparkles className="w-4 h-4" />
                                <span>الجيل القادم من السجلات التعليمية</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1] animate-slide-up">
                                صمم سجلاتك التعليمية <br />
                                <span className="text-primary">بلمسة إبداعية</span>
                            </h1>

                            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                اكتشف مئات القوالب التعليمية التفاعلية المدعومة بالذكاء الاصطناعي.
                                صممت خصيصاً لتوفير وقتك وإبهار طلابك.
                            </p>

                            <div className="flex flex-wrap gap-4 justify-center pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <Link href="/marketplace">
                                    <Button size="lg" className="rounded-full px-10 py-7 text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                                        ابدأ التصميم الآن
                                    </Button>
                                </Link>
                                <Link href="/templates">
                                    <Button size="lg" variant="outline" className="rounded-full px-10 py-7 text-lg font-bold border-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
                                        تصفح القوالب
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-12 flex flex-wrap justify-center items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                <div className="flex items-center gap-2 font-bold text-xl">
                                    <Users className="w-6 h-6" />
                                    <span>+10,000 معلم</span>
                                </div>
                                <div className="flex items-center gap-2 font-bold text-xl">
                                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                    <span>4.9 تقييم</span>
                                </div>
                                <div className="flex items-center gap-2 font-bold text-xl">
                                    <ShieldCheck className="w-6 h-6" />
                                    <span>موثوق تعليمياً</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">تصفح حسب التصنيف</h2>
                                <p className="text-gray-500 dark:text-gray-400">اختر المرحلة التعليمية أو نوع المحتوى الذي تبحث عنه</p>
                            </div>
                            <Link href="/marketplace">
                                <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5">
                                    عرض جميع التصنيفات <ArrowLeft className="mr-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {categories.length > 0 ? categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/marketplace?category=${category.slug}`}
                                    className="group p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 text-center"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                        {category.slug.includes('baby') || category.slug.includes('kindergarten') ? <Baby className="w-8 h-8" /> :
                                            category.slug.includes('school') || category.slug.includes('primary') ? <BookOpen className="w-8 h-8" /> :
                                                category.slug.includes('high') || category.slug.includes('grad') ? <GraduationCap className="w-8 h-8" /> :
                                                    <Palette className="w-8 h-8" />}
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                        {category.name_ar}
                                    </h3>
                                </Link>
                            )) : (
                                // Placeholder categories with icons
                                [
                                    { name: 'رياض الأطفال', icon: <Baby className="w-8 h-8" /> },
                                    { name: 'الابتدائية', icon: <BookOpen className="w-8 h-8" /> },
                                    { name: 'المتوسطة', icon: <GraduationCap className="w-8 h-8" /> },
                                    { name: 'الثانوية', icon: <Layout className="w-8 h-8" /> },
                                    { name: 'الأنشطة', icon: <Palette className="w-8 h-8" /> },
                                    { name: 'الشهادات', icon: <Zap className="w-8 h-8" /> }
                                ].map((cat, i) => (
                                    <Link
                                        key={i}
                                        href="/marketplace"
                                        className="group p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 text-center"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                            {cat.icon}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                            {cat.name}
                                        </h3>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Featured Templates */}
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">القوالب الأكثر تميزاً</h2>
                                <p className="text-gray-500 dark:text-gray-400">مجموعة مختارة من أفضل القوالب التي نالت إعجاب المعلمين</p>
                            </div>
                            <Link href="/marketplace">
                                <Button variant="outline" className="rounded-full px-6 border-2 font-bold">
                                    استكشف المتجر بالكامل
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {isLoading ? (
                                [1, 2, 3, 4].map((i) => <TemplateCardSkeleton key={i} />)
                            ) : featuredTemplates.length > 0 ? (
                                featuredTemplates.map((template) => (
                                    <Link
                                        key={template.id}
                                        href={`/marketplace/${template.slug}`}
                                        className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full"
                                    >
                                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                                            {template.thumbnail_url ? (
                                                <Image
                                                    src={template.thumbnail_url}
                                                    alt={template.name_ar}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Layout className="w-12 h-12" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4">
                                                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 text-amber-500 shadow-lg">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-xs font-black">{template.average_rating || '5.0'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex-1 space-y-2">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                                                    {template.category?.name_ar || 'قالب تعليمي'}
                                                </span>
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                                    {template.name_ar}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                    {template.description_ar}
                                                </p>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    {template.discount_price ? (
                                                        <>
                                                            <span className="text-xs text-gray-400 line-through">{formatPrice(template.price)}</span>
                                                            <span className="text-lg font-black text-primary">{formatPrice(template.discount_price)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-lg font-black text-gray-900 dark:text-white">
                                                            {template.is_free ? 'مجاني' : formatPrice(template.price)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                    <ArrowLeft className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-gray-500 font-bold">لا توجد قوالب مميزة حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <ServicesSection />

                {/* AI Section */}
                <AISection />

                {/* Features Grid */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white">لماذا يختار المعلمون SERS؟</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">نحن نوفر لك الأدوات التي تجعل عملك التعليمي أكثر سهولة وإبداعاً</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Zap className="w-8 h-8" />}
                                title="سرعة فائقة"
                                description="صمم سجلاتك في دقائق معدودة بدلاً من ساعات العمل الطويلة."
                            />
                            <FeatureCard
                                icon={<Sparkles className="w-8 h-8" />}
                                title="ذكاء اصطناعي"
                                description="استخدم مساعدنا الذكي لتوليد المحتوى واقتراح الأفكار الإبداعية."
                            />
                            <FeatureCard
                                icon={<ShieldCheck className="w-8 h-8" />}
                                title="جودة مضمونة"
                                description="جميع القوالب مراجعة من قبل خبراء تربويين لضمان فعاليتها."
                            />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-10 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">{description}</p>
        </div>
    );
}
