import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'من نحن - SERS',
    description: 'تعرف على منصة SERS للسجلات التعليمية الذكية',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero */}
                <section className="bg-primary-50 dark:bg-gray-900 transition-colors duration-300 py-20">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">من نحن 🎓</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            منصة رقمية متكاملة تهدف لتسهيل حياة المعلمين والمعلمات
                        </p>
                    </div>
                </section>

                {/* Story */}
                <section className="py-16 bg-white">
                    <div className="max-w-4xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">قصتنا</h2>
                        <div className="prose prose-lg text-gray-600">
                            <p>
                                بدأت فكرة SERS من إيماننا العميق بأن المعلمين والمعلمات يستحقون أدوات
                                تساعدهم على التركيز في مهمتهم الأساسية: التعليم.
                            </p>
                            <p>
                                نحن فريق من المطورين والمعلمين الذين اجتمعوا لإنشاء منصة تجمع بين
                                التقنية الحديثة والفهم العميق لاحتياجات قطاع التعليم في المملكة العربية السعودية.
                            </p>
                            <p>
                                نقدم قوالب تعليمية تفاعلية وقابلة للتحميل، مدعومة بالذكاء الاصطناعي
                                لمساعدتك في إعداد السجلات والتقارير والملاحظات بسرعة ودقة.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">قيمنا</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: '💡',
                                    title: 'الابتكار',
                                    description: 'نستخدم أحدث التقنيات لتقديم حلول ذكية وعملية',
                                },
                                {
                                    icon: '🤝',
                                    title: 'الشراكة',
                                    description: 'نعمل جنباً إلى جنب مع المعلمين لفهم احتياجاتهم',
                                },
                                {
                                    icon: '⭐',
                                    title: 'الجودة',
                                    description: 'نلتزم بأعلى معايير الجودة في كل ما نقدمه',
                                },
                            ].map((value, i) => (
                                <div key={i} className="bg-white rounded-2xl p-8 text-center shadow-sm">
                                    <div className="text-5xl mb-4">{value.icon}</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                                    <p className="text-gray-600">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">فريقنا</h2>
                        <div className="grid md:grid-cols-4 gap-6">
                            {[
                                { name: 'محمد أحمد', role: 'المؤسس والمدير التنفيذي', emoji: '👨‍💼' },
                                { name: 'سارة علي', role: 'مديرة المنتج', emoji: '👩‍💻' },
                                { name: 'خالد محمد', role: 'مطور رئيسي', emoji: '👨‍💻' },
                                { name: 'نورة سعيد', role: 'مستشارة تعليمية', emoji: '👩‍🏫' },
                            ].map((member, i) => (
                                <div key={i} className="text-center">
                                    <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center text-4xl mb-4">
                                        {member.emoji}
                                    </div>
                                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                                    <p className="text-sm text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 bg-primary-50 dark:bg-gray-900 transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">انضم إلينا اليوم</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            ابدأ رحلتك مع SERS واكتشف كيف يمكننا مساعدتك
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/register">
                                <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg">
                                    ابدأ مجاناً
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button size="lg" variant="outline" className="border-2 border-primary-200 dark:border-gray-700 text-primary-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800">
                                    تواصل معنا
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
