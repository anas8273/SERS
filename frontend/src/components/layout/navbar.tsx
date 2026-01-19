'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { 
    Search, 
    ShoppingCart, 
    User, 
    LayoutDashboard, 
    Heart, 
    Settings, 
    LogOut, 
    Menu, 
    X,
    LayoutTemplate
} from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { getItemCount } = useCartStore();

    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
    }, [pathname]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = [
        { label: 'الرئيسية', href: '/' },
        { label: 'سوق القوالب', href: '/marketplace' },
        { label: 'الخدمات', href: '/services' },
        { label: 'من نحن', href: '/about' },
        { label: 'تواصل معنا', href: '/contact' },
    ];

    const cartCount = mounted ? getItemCount() : 0;

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary flex-shrink-0">
                        <LayoutTemplate className="w-8 h-8" />
                        <span className="hidden sm:inline text-gray-900 dark:text-white tracking-tight">سيرز</span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث عن قالب..."
                                className="w-full px-4 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname === item.href
                                        ? "text-primary"
                                        : "text-gray-600 dark:text-gray-300"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-700 dark:text-gray-300">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth */}
                        {mounted && isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm border border-primary/20">
                                        {user?.name?.charAt(0) || <User className="w-4 h-4" />}
                                    </div>
                                </button>

                                {/* User Dropdown */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-20 animate-fade-in overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <LayoutDashboard className="w-4 h-4 text-gray-400" />
                                                لوحة التحكم
                                            </Link>
                                            <Link
                                                href="/wishlist"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Heart className="w-4 h-4 text-gray-400" />
                                                المفضلة
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-primary font-medium hover:bg-primary/5 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    لوحة الإدارة
                                                </Link>
                                            )}
                                            <hr className="my-1 border-gray-100 dark:border-gray-700" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                تسجيل الخروج
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button size="sm" className="rounded-full px-6 hidden sm:inline-flex">
                                    تسجيل الدخول
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg animate-fade-in">
                    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن قالب..."
                                    className="w-full px-4 py-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>
                        </form>

                        {/* Mobile Nav Links */}
                        <nav className="grid grid-cols-1 gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-4 py-3 rounded-xl font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {!isAuthenticated && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Link href="/login" className="block">
                                    <Button className="w-full rounded-xl py-6">تسجيل الدخول</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
