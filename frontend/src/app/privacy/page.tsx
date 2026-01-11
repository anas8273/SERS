import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata = {
    title: 'سياسة الخصوصية - SERS',
    description: 'سياسة الخصوصية لمنصة SERS',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">سياسة الخصوصية 🔒</h1>

                    <div className="prose prose-lg text-gray-600 max-w-none">
                        <p className="text-gray-500 mb-8">آخر تحديث: يناير 2026</p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. مقدمة</h2>
                            <p>
                                نحن في SERS نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة
                                كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك عند استخدام منصتنا.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. المعلومات التي نجمعها</h2>
                            <p>نقوم بجمع الأنواع التالية من المعلومات:</p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف</li>
                                <li><strong>معلومات الدفع:</strong> تفاصيل البطاقة (يتم معالجتها بشكل آمن عبر Stripe)</li>
                                <li><strong>بيانات الاستخدام:</strong> كيفية تفاعلك مع المنصة</li>
                                <li><strong>المحتوى:</strong> السجلات والملاحظات التي تنشئها</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. كيف نستخدم معلوماتك</h2>
                            <p>نستخدم المعلومات المجمعة لـ:</p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>توفير خدماتنا وتحسينها</li>
                                <li>معالجة المدفوعات وإدارة الاشتراكات</li>
                                <li>إرسال إشعارات مهمة حول حسابك</li>
                                <li>تقديم دعم العملاء</li>
                                <li>تحليل الاستخدام لتحسين تجربة المستخدم</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. حماية البيانات</h2>
                            <p>
                                نتخذ إجراءات أمنية صارمة لحماية بياناتك، بما في ذلك:
                            </p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>التشفير باستخدام SSL/TLS</li>
                                <li>تخزين آمن للبيانات مع نسخ احتياطية</li>
                                <li>وصول محدود للموظفين المصرح لهم فقط</li>
                                <li>مراقبة مستمرة للأنظمة</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. مشاركة البيانات</h2>
                            <p>
                                لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك البيانات مع:
                            </p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>مزودي خدمات الدفع (Stripe)</li>
                                <li>خدمات الاستضافة والبنية التحتية</li>
                                <li>السلطات القانونية عند الضرورة</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. حقوقك</h2>
                            <p>لديك الحق في:</p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>الوصول إلى بياناتك الشخصية</li>
                                <li>تصحيح البيانات غير الدقيقة</li>
                                <li>حذف حسابك وبياناتك</li>
                                <li>إلغاء الاشتراك من الإشعارات التسويقية</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. تواصل معنا</h2>
                            <p>
                                إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر:
                            </p>
                            <p className="mt-4">
                                <strong>البريد الإلكتروني:</strong>{' '}
                                <a href="mailto:privacy@sers.sa" className="text-primary-600 hover:underline">
                                    privacy@sers.sa
                                </a>
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t">
                        <Link href="/" className="text-primary-600 hover:underline">
                            ← العودة للرئيسية
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
