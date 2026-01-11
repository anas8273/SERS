import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata = {
    title: 'الشروط والأحكام - SERS',
    description: 'شروط وأحكام استخدام منصة SERS',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">الشروط والأحكام ⚖️</h1>

                    <div className="prose prose-lg text-gray-600 max-w-none">
                        <p className="text-gray-500 mb-8">آخر تحديث: يناير 2026</p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. القبول بالشروط</h2>
                            <p>
                                باستخدامك لمنصة SERS، فإنك توافق على الالتزام بهذه الشروط والأحكام.
                                إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. الخدمات المقدمة</h2>
                            <p>توفر SERS:</p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>قوالب تعليمية تفاعلية وقابلة للتحميل</li>
                                <li>أدوات مدعومة بالذكاء الاصطناعي</li>
                                <li>تخزين سحابي للسجلات والملاحظات</li>
                                <li>دعم فني للمستخدمين</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. حساب المستخدم</h2>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>يجب أن تكون 18 عاماً أو أكثر لإنشاء حساب</li>
                                <li>أنت مسؤول عن الحفاظ على سرية معلومات تسجيل الدخول</li>
                                <li>يجب تقديم معلومات دقيقة وصحيحة</li>
                                <li>يحق لنا تعليق أو إنهاء الحسابات المخالفة</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. المشتريات والمدفوعات</h2>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>جميع الأسعار بالريال السعودي وتشمل الضريبة</li>
                                <li>الدفع مطلوب قبل الوصول للمنتجات المدفوعة</li>
                                <li>نقبل الدفع عبر البطاقات الائتمانية وMada</li>
                                <li>المنتجات الرقمية غير قابلة للاسترداد بعد التحميل أو الاستخدام</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. حقوق الملكية الفكرية</h2>
                            <p>
                                جميع المحتويات على SERS محمية بحقوق الملكية الفكرية:
                            </p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>يُمنح المشتري ترخيصاً شخصياً غير قابل للتحويل</li>
                                <li>لا يجوز إعادة بيع أو توزيع المنتجات المشتراة</li>
                                <li>يمكن استخدام المنتجات لأغراض تعليمية فقط</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. الاستخدام المقبول</h2>
                            <p>يُحظر:</p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li>استخدام المنصة لأغراض غير قانونية</li>
                                <li>مشاركة الحساب مع آخرين</li>
                                <li>محاولة اختراق أو تعطيل المنصة</li>
                                <li>نشر محتوى مسيء أو غير لائق</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. إخلاء المسؤولية</h2>
                            <p>
                                نقدم المنصة "كما هي" ولا نضمن خلوها من الأخطاء أو الانقطاعات.
                                لن نكون مسؤولين عن أي أضرار ناتجة عن استخدام المنصة.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. التعديلات</h2>
                            <p>
                                نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين
                                بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. القانون المطبق</h2>
                            <p>
                                تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختص محاكم
                                المملكة بالنظر في أي نزاعات.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. تواصل معنا</h2>
                            <p>
                                للاستفسارات حول الشروط والأحكام:
                            </p>
                            <p className="mt-4">
                                <strong>البريد الإلكتروني:</strong>{' '}
                                <a href="mailto:legal@sers.sa" className="text-primary-600 hover:underline">
                                    legal@sers.sa
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
