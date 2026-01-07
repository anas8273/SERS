"use client";
import Link from 'next/link'
import { LayoutTemplate, Github, Twitter, Linkedin, Heart } from 'lucide-react'

export function Footer() {
    return (
        <footer className="w-full border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-xl mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                            <LayoutTemplate className="w-6 h-6" />
                            <span>SERS.</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Empowering educators and developers with next-generation template management tools.
                            Built for speed, designed for beauty.
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
                        <h4 className="font-semibold text-foreground">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
                            <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Stay Updated</h4>
                        <p className="text-sm text-muted-foreground">Subscribe to our newsletter for the latest updates and offers.</p>
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-3 py-2 bg-background/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} SERS Inc. All rights reserved.</p>
                    <div className="flex items-center gap-1">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
                        <span>by SERS Team</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
