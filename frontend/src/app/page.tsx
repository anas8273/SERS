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
  Baby,
  Bot,
  BarChart3,
  Layers,
  FileText,
  Check,
  ArrowRight,
  Play,
  Upload,
  MousePointer,
  Download,
  Rocket,
  Crown,
  Globe,
  Clock,
  Award,
  ChevronLeft,
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

        {/* ===== HERO SECTION ===== */}
        <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-48">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-[30%] right-[20%] w-[20%] h-[20%] bg-purple-500/5 rounded-full blur-[80px]" />
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold animate-fade-in">
                <Sparkles className="w-4 h-4" />
                <span>منصة السجلات التعليمية الذكية</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1] animate-slide-up">
                صمم سجلاتك التعليمية <br />
                <span className="bg-gradient-to-l from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">بذكاء اصطناعي</span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                محرك قوالب تفاعلي يدعم التوليد الجماعي وتحليل البيانات والذكاء الاصطناعي.
                أنشئ مئات الشهادات والسجلات في دقائق معدودة.
              </p>

              <div className="flex flex-wrap gap-4 justify-center pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-10 py-7 text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-transform gap-2">
                    <Rocket className="w-5 h-5" />
                    ابدأ مجاناً
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-7 text-lg font-bold border-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all gap-2">
                    <Play className="w-5 h-5" />
                    استكشف الخدمات
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-12 flex flex-wrap justify-center items-center gap-8 text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  <span>+10,000 مستخدم</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span>4.9 تقييم</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>موثوق تعليمياً</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span>يدعم العربية بالكامل</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-sm font-bold">
                <Zap className="w-4 h-4" />
                كيف يعمل
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">ثلاث خطوات فقط</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">من اختيار القالب إلى تصدير PDF في أقل من دقيقة</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <StepCard
                step={1}
                icon={<MousePointer className="w-8 h-8" />}
                title="اختر القالب"
                description="تصفح مكتبة القوالب التفاعلية واختر القالب المناسب لاحتياجك. شهادات، سجلات، خطط، وأكثر."
                color="from-blue-500 to-blue-600"
              />
              <StepCard
                step={2}
                icon={<Bot className="w-8 h-8" />}
                title="املأ البيانات"
                description="استخدم المحرر التفاعلي لملء البيانات يدوياً أو دع الذكاء الاصطناعي يساعدك في التعبئة التلقائية."
                color="from-purple-500 to-purple-600"
              />
              <StepCard
                step={3}
                icon={<Download className="w-8 h-8" />}
                title="صدّر وشارك"
                description="صدّر مستندك كـ PDF بجودة عالية أو استخدم التوليد الجماعي لإنشاء مئات النسخ دفعة واحدة."
                color="from-emerald-500 to-emerald-600"
              />
            </div>
          </div>
        </section>

        {/* ===== CORE FEATURES GRID ===== */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                المميزات
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">كل ما تحتاجه في منصة واحدة</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">أدوات متكاملة مصممة خصيصاً للعملية التعليمية</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={<Layers className="w-7 h-7" />}
                title="محرك قوالب ديناميكي"
                description="محرر تفاعلي بمعاينة حية. القوالب تُبنى من قاعدة البيانات بدون أي كود ثابت."
                color="bg-blue-500"
              />
              <FeatureCard
                icon={<Bot className="w-7 h-7" />}
                title="مساعد ذكاء اصطناعي"
                description="مساعد AI يملأ النماذج تلقائياً ويقترح المحتوى المناسب لكل حقل بناءً على السياق."
                color="bg-purple-500"
              />
              <FeatureCard
                icon={<Zap className="w-7 h-7" />}
                title="توليد جماعي"
                description="ارفع ملف Excel وولّد مئات الشهادات والسجلات دفعة واحدة بضغطة زر."
                color="bg-amber-500"
              />
              <FeatureCard
                icon={<BarChart3 className="w-7 h-7" />}
                title="تحليل البيانات"
                description="حلّل نتائج الطلاب برسوم بيانية تفاعلية واحصل على تقارير AI شاملة."
                color="bg-emerald-500"
              />
              <FeatureCard
                icon={<FileText className="w-7 h-7" />}
                title="تصدير PDF احترافي"
                description="تصدير بجودة عالية مع دعم كامل للغة العربية والخطوط المتنوعة."
                color="bg-rose-500"
              />
              <FeatureCard
                icon={<ShieldCheck className="w-7 h-7" />}
                title="أمان وخصوصية"
                description="بياناتك محمية بتشفير متقدم مع نظام أدوار وصلاحيات شامل."
                color="bg-cyan-500"
              />
            </div>
          </div>
        </section>

        {/* ===== Categories Section ===== */}
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
                [
                  { name: 'رياض الأطفال', icon: <Baby className="w-8 h-8" /> },
                  { name: 'الابتدائية', icon: <BookOpen className="w-8 h-8" /> },
                  { name: 'المتوسطة', icon: <GraduationCap className="w-8 h-8" /> },
                  { name: 'الثانوية', icon: <Layout className="w-8 h-8" /> },
                  { name: 'الأنشطة', icon: <Palette className="w-8 h-8" /> },
                  { name: 'الشهادات', icon: <Award className="w-8 h-8" /> }
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

        {/* ===== Featured Templates ===== */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">القوالب الأكثر تميزاً</h2>
                <p className="text-gray-500 dark:text-gray-400">مجموعة مختارة من أفضل القوالب التي نالت إعجاب المستخدمين</p>
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

        {/* ===== Services Section ===== */}
        <ServicesSection />

        {/* ===== AI Section ===== */}
        <AISection />

        {/* ===== PRICING SECTION ===== */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-sm font-bold">
                <Crown className="w-4 h-4" />
                الأسعار والاشتراكات
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">خطط تناسب الجميع</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">ابدأ مجاناً وترقّ حسب احتياجك</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-100 dark:border-gray-700 p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">مجاني</h3>
                  <p className="text-gray-500 text-sm">للتجربة والاستكشاف</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">0</span>
                  <span className="text-gray-500 mr-1">ر.س / شهرياً</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['5 مستندات شهرياً', 'قوالب مجانية محدودة', 'تصدير PDF', 'معاينة حية'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full rounded-full font-bold border-2">
                    ابدأ مجاناً
                  </Button>
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-b from-primary to-purple-600 rounded-[2rem] p-8 flex flex-col text-white relative overflow-hidden shadow-2xl shadow-primary/20 scale-105">
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">الأكثر شعبية</span>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-2">احترافي</h3>
                  <p className="text-white/70 text-sm">للمستخدم النشط</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black">49</span>
                  <span className="text-white/70 mr-1">ر.س / شهرياً</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['مستندات غير محدودة', 'جميع القوالب المميزة', 'التوليد الجماعي', 'تحليل البيانات + AI', 'مساعد ذكاء اصطناعي', 'دعم فني أولوية'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/90">
                      <Check className="w-4 h-4 text-white shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full rounded-full font-bold bg-white text-primary hover:bg-white/90">
                    اشترك الآن
                  </Button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-100 dark:border-gray-700 p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">مؤسسي</h3>
                  <p className="text-gray-500 text-sm">للمدارس والمؤسسات</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">199</span>
                  <span className="text-gray-500 mr-1">ر.س / شهرياً</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['كل مميزات الاحترافي', 'حسابات متعددة (10 مستخدمين)', 'لوحة تحكم إدارية', 'قوالب مخصصة', 'API مفتوح', 'مدير حساب مخصص'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/contact">
                  <Button variant="outline" className="w-full rounded-full font-bold border-2">
                    تواصل معنا
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS SECTION ===== */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <StatCounter value="+10,000" label="مستخدم نشط" icon={<Users className="w-6 h-6" />} />
              <StatCounter value="+50,000" label="مستند مُولَّد" icon={<FileText className="w-6 h-6" />} />
              <StatCounter value="+200" label="قالب تفاعلي" icon={<Layers className="w-6 h-6" />} />
              <StatCounter value="4.9/5" label="تقييم المستخدمين" icon={<Star className="w-6 h-6" />} />
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-[3rem] p-12 md:p-16 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl md:text-5xl font-black leading-tight">
                  جاهز لتحويل عملك التعليمي؟
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto">
                  انضم إلى آلاف المستخدمين الذين يوفرون ساعات من العمل اليدوي كل أسبوع باستخدام SERS
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Link href="/register">
                    <Button size="lg" className="rounded-full px-10 py-7 text-lg font-bold bg-white text-primary hover:bg-white/90 shadow-2xl">
                      ابدأ مجاناً الآن
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ===== Step Card =====
function StepCard({ step, icon, title, description, color }: {
  step: number; icon: React.ReactNode; title: string; description: string; color: string;
}) {
  return (
    <div className="relative text-center group">
      <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center font-black text-sm text-primary shadow-lg">
        {step}
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ===== Feature Card =====
function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode; title: string; description: string; color: string;
}) {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
      <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ===== Stat Counter =====
function StatCounter({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center space-y-2">
      <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
}
