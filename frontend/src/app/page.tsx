'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import type { Product, Category } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.getFeaturedProducts().catch(() => ({ data: [] })),
                    api.getCategories().catch(() => ({ data: [] })),
                ]);
                setFeaturedProducts(productsRes.data?.slice(0, 8) || []);
                setCategories(categoriesRes.data?.slice(0, 6) || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-300">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 dark:bg-primary-900 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-200 dark:bg-secondary-900 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-right space-y-8">
                                <div className="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                                    🎓 منصة تعليمية متكاملة
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
                                    سجلاتك التعليمية
                                    <span className="block text-primary-600 dark:text-primary-400 mt-2">بذكاء وسهولة</span>
                                </h1>

                                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0">
                                    اكتشف مئات القوالب التعليمية التفاعلية والقابلة للتحميل،
                                    مصممة خصيصاً للمعلمين والمعلمات في رياض الأطفال والمراحل الابتدائية.
                                </p>

                                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                    <Link href="/marketplace">
                                        <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg font-semibold shadow-xl">
                                            تصفح المتجر 🛍️
                                        </Button>
                                    </Link>
                                    <Link href="/about">
                                        <Button size="lg" variant="outline" className="border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 text-lg">
                                            تعرف علينا
                                        </Button>
                                    </Link>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-8 justify-center lg:justify-start pt-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">500+</div>
                                        <div className="text-gray-500 dark:text-gray-400 text-sm">قالب تعليمي</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
                                        <div className="text-gray-500 dark:text-gray-400 text-sm">معلم ومعلمة</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">4.9⭐</div>
                                        <div className="text-gray-500 dark:text-gray-400 text-sm">تقييم المستخدمين</div>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Image */}
                            <div className="hidden lg:block relative">
                                <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-gray-200 dark:border-gray-700">
                                    <div className="absolute inset-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
                                        <div className="text-center p-8">
                                            <div className="text-6xl mb-4">📚</div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">سجلات ذكية</h3>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2">تفاعلية ومدعومة بالذكاء الاصطناعي</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-16 bg-gray-50 dark:bg-gray-800/50 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">التصنيفات</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">اختر المرحلة التعليمية المناسبة</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {categories.length > 0 ? categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/marketplace?category=${category.slug}`}
                                    className="group p-6 bg-white dark:bg-gray-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-lg transition-all duration-300 text-center border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                        {category.icon === 'baby' ? '👶' :
                                            category.icon === 'book-open' ? '📖' :
                                                category.icon === 'graduation-cap' ? '🎓' : '📚'}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                        {category.name_ar}
                                    </h3>
                                </Link>
                            )) : (
                                // Placeholder categories
                                ['رياض الأطفال', 'الابتدائية', 'المتوسطة', 'الثانوية', 'التعليم الخاص', 'الأنشطة'].map((name, i) => (
                                    <Link
                                        key={i}
                                        href="/marketplace"
                                        className="group p-6 bg-white dark:bg-gray-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-lg transition-all duration-300 text-center border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                            {['👶', '📖', '🎓', '🏫', '⭐', '🎨'][i]}
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                            {name}
                                        </h3>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Featured Products */}
                <section className="py-16 bg-white dark:bg-gray-900 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">المنتجات المميزة ⭐</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">أكثر القوالب طلباً من معلمينا</p>
                            </div>
                            <Link href="/marketplace">
                                <Button variant="outline" className="hidden md:flex text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    عرض الكل ←
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {isLoading ? (
                                [1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)
                            ) : featuredProducts.length > 0 ? (
                                featuredProducts.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/marketplace/${product.slug}`}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                                            {product.thumbnail_url ? (
                                                <Image
                                                    src={product.thumbnail_url}
                                                    alt={product.name_ar}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300 dark:text-gray-600">
                                                    📄
                                                </div>
                                            )}
                                            <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${product.type === 'interactive'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-700 text-white'
                                                }`}>
                                                {product.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {product.name_ar}
                                            </h3>
                                            <div className="flex items-center gap-1 mb-3">
                                                <span className="text-yellow-400">⭐</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{product.average_rating?.toFixed(1) || '0.0'}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">({product.reviews_count || 0})</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                    {formatPrice(product.discount_price || product.price)}
                                                </span>
                                                {product.discount_price && product.discount_price < product.price && (
                                                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                // Placeholder products when empty
                                [
                                    { name: 'سجل الملاحظات الذكي', price: 49.99, type: 'interactive' },
                                    { name: 'نموذج تقييم الطالب', price: 29.99, type: 'downloadable' },
                                    { name: 'سجل الحضور والغياب', price: 39.99, type: 'interactive' },
                                    { name: 'خطة درس تفاعلية', price: 19.99, type: 'interactive' },
                                ].map((product, i) => (
                                    <Link
                                        key={i}
                                        href="/marketplace"
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                            <span className="text-6xl">📘</span>
                                            <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${product.type === 'interactive'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-700 text-white'
                                                }`}>
                                                {product.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-1 mb-3">
                                                <span className="text-yellow-400">⭐</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">4.5</span>
                                            </div>
                                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                {formatPrice(product.price)}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        <div className="text-center mt-8 md:hidden">
                            <Link href="/marketplace">
                                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                    عرض جميع المنتجات
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-gray-50 dark:bg-gray-800/50 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">لماذا SERS؟</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                                نقدم لك تجربة فريدة في إعداد السجلات التعليمية
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: '🤖',
                                    title: 'ذكاء اصطناعي',
                                    description: 'اقتراحات ذكية تساعدك في كتابة الملاحظات والتقييمات',
                                },
                                {
                                    icon: '⚡',
                                    title: 'سرعة وسهولة',
                                    description: 'واجهة بسيطة تمكنك من إنجاز عملك في دقائق',
                                },
                                {
                                    icon: '🔒',
                                    title: 'آمن وموثوق',
                                    description: 'بياناتك محمية بأعلى معايير الأمان والخصوصية',
                                },
                                {
                                    icon: '📱',
                                    title: 'متوافق مع الجميع',
                                    description: 'يعمل على الكمبيوتر والتابلت والجوال بسلاسة',
                                },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="text-center p-8 rounded-2xl bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="text-5xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-primary-50 dark:bg-gray-900 transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                            جاهز لتطوير تجربتك التعليمية؟
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            انضم لآلاف المعلمين الذين يوفرون وقتهم مع SERS
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/register">
                                <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                                    ابدأ مجاناً 🚀
                                </Button>
                            </Link>
                            <Link href="/marketplace">
                                <Button size="lg" variant="outline" className="border-2 border-primary-200 dark:border-gray-700 text-primary-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 px-8 py-4 text-lg">
                                    تصفح المنتجات
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
