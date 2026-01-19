'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Bot,
    Sparkles,
    Zap,
    Brain,
    MessageSquare,
    FileText,
    Target,
    TrendingUp,
    ArrowLeft,
} from 'lucide-react';

const aiFeatures = [
    {
        icon: MessageSquare,
        title: 'محادثة ذكية',
        description: 'تحدث مع المساعد الذكي واحصل على إجابات فورية لأسئلتك التعليمية',
    },
    {
        icon: FileText,
        title: 'إنشاء المحتوى',
        description: 'إنشاء خطط وتقارير وشهادات بضغطة زر باستخدام الذكاء الاصطناعي',
    },
    {
        icon: Target,
        title: 'تحليل ذكي',
        description: 'تحليل نتائج الطلاب واقتراح خطط علاجية مخصصة لكل طالب',
    },
    {
        icon: TrendingUp,
        title: 'توصيات مخصصة',
        description: 'اقتراحات ذكية للقوالب والخدمات بناءً على احتياجاتك',
    },
];

export function AISection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                            <Brain className="w-4 h-4" />
                            <span>مدعوم بالذكاء الاصطناعي</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                            مساعدك الذكي <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                لإنجاز المهام بسرعة
                            </span>
                        </h2>

                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                            استخدم قوة الذكاء الاصطناعي لتوفير وقتك وجهدك. من إنشاء الخطط التعليمية
                            إلى تحليل النتائج، كل شيء أصبح أسهل وأسرع.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {aiFeatures.map((feature, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center flex-shrink-0">
                                        <feature.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href="/ai-assistant">
                                <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/20">
                                    <Bot className="ml-2 w-5 h-5" />
                                    جرب المساعد الذكي
                                </Button>
                            </Link>
                            <Link href="/services">
                                <Button size="lg" variant="outline" className="rounded-full px-8 border-2">
                                    استكشف الخدمات
                                    <ArrowLeft className="mr-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="relative">
                        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                            {/* Chat Interface Preview */}
                            <div className="space-y-4">
                                {/* AI Message */}
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟
                                        </p>
                                    </div>
                                </div>

                                {/* User Message */}
                                <div className="flex gap-3 justify-end">
                                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                                        <p className="text-sm">
                                            أريد إنشاء خطة علاجية لطالب متعثر في الرياضيات
                                        </p>
                                    </div>
                                </div>

                                {/* AI Response */}
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                            سأساعدك في إنشاء خطة علاجية مخصصة. دعني أسألك بعض الأسئلة:
                                        </p>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <li className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                                ما هو الصف الدراسي؟
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                                ما هي المهارات المتعثر فيها؟
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                                كم المدة المتاحة للخطة؟
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Typing Indicator */}
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 opacity-50">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tr-none px-4 py-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Input */}
                            <div className="mt-6 flex gap-3">
                                <input
                                    type="text"
                                    placeholder="اكتب رسالتك..."
                                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled
                                />
                                <button className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                                    <Zap className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-2xl rotate-12 flex items-center justify-center shadow-xl">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-400 rounded-2xl -rotate-12 flex items-center justify-center shadow-xl">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
