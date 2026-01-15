"use client";
import Link from 'next/link'
import { LayoutTemplate, Github, Twitter, Linkedin, Heart } from 'lucide-react'

export function Footer() {
    return (
        <footer className="w-full border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-xl mt-auto" dir="rtl">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                            <LayoutTemplate className="w-6 h-6" />
                            <span>سيرز.</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            تمكين المعلمين والمطورين بأدوات إدارة القوالب من الجيل القادم.
                            بنيت للسرعة، وصممت للجمال.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Github className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">المنصة</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/marketplace" className="hover:text-primary transition-colors">سوق القوالب</Link></li>
                            <li><Link href="/features" className="hover:text-primary transition-colors">المميزات</Link></li>
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">الأسعار</Link></li>
                            <li><Link href="/docs" className="hover:text-primary transition-colors">التوثيق</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">الشركة</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">من نحن</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">المدونة</Link></li>
                            <li><Link href="/careers" className="hover:text-primary transition-colors">الوظائف</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">اتصل بنا</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">ابقَ على اطلاع</h4>
                        <p className="text-sm text-muted-foreground">اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات والعروض.</p>
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="البريد الإلكتروني"
                                className="flex-1 px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                                انضمام
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} سيرز. جميع الحقوق محفوظة.</p>
                    <div className="flex items-center gap-1">
                        <span>صنع بكل</span>
                        <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
                        <span>بواسطة فريق سيرز</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
