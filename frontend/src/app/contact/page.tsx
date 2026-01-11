'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً 📧');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero */}
                <section className="bg-primary-50 dark:bg-gray-900 transition-colors duration-300 py-16">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">تواصل معنا 💬</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            نحن هنا لمساعدتك. أرسل لنا رسالة وسنرد عليك في أقرب وقت.
                        </p>
                    </div>
                </section>

                <section className="py-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Contact Info */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات التواصل</h2>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-xl">
                                            📧
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">البريد الإلكتروني</h3>
                                            <a href="mailto:support@sers.sa" className="text-primary-600 hover:underline">
                                                support@sers.sa
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-xl">
                                            📱
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">واتساب</h3>
                                            <a href="https://wa.me/966500000000" className="text-primary-600 hover:underline">
                                                +966 50 000 0000
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-xl">
                                            🕐
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">ساعات العمل</h3>
                                            <p className="text-gray-600">الأحد - الخميس: 9 ص - 5 م</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-xl">
                                            📍
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">الموقع</h3>
                                            <p className="text-gray-600">الرياض، المملكة العربية السعودية</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="mt-8">
                                    <h3 className="font-semibold text-gray-900 mb-4">تابعنا</h3>
                                    <div className="flex gap-4">
                                        {['𝕏', 'in', 'f', '📸'].map((icon, i) => (
                                            <a
                                                key={i}
                                                href="#"
                                                className="w-10 h-10 bg-gray-100 hover:bg-primary-100 text-gray-600 hover:text-primary-600 rounded-full flex items-center justify-center transition-colors"
                                            >
                                                {icon}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">أرسل رسالة</h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            الاسم الكامل
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="أدخل اسمك"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            البريد الإلكتروني
                                        </label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="example@email.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            الموضوع
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="موضوع الرسالة"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            الرسالة
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="اكتب رسالتك هنا..."
                                            rows={5}
                                            required
                                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3"
                                    >
                                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة 📤'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
