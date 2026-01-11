'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

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
        { label: 'المتجر', href: '/marketplace' },
        { label: 'من نحن', href: '/about' },
        { label: 'تواصل معنا', href: '/contact' },
    ];

    const cartCount = mounted ? getItemCount() : 0;

    return (
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 flex-shrink-0">
                        <span className="text-2xl">📚</span>
                        <span className="hidden sm:inline text-gray-900 dark:text-white">SERS</span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث عن قالب..."
                                className="w-full px-4 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                                🔍
                            </button>
                        </div>
                    </form>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400",
                                    pathname === item.href
                                        ? "text-primary-600 dark:text-primary-400"
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
                            <span className="text-xl">🛒</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth */}
                        {mounted && isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-sm">
                                        {user?.name?.charAt(0) || '؟'}
                                    </span>
                                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                </button>

                                {/* User Dropdown */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-20">
                                            <Link
                                                href="/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                📊 لوحة التحكم
                                            </Link>
                                            <Link
                                                href="/wishlist"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                ❤️ المفضلة
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    ⚙️ لوحة الإدارة
                                                </Link>
                                            )}
                                            <hr className="my-2 border-gray-100 dark:border-gray-700" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                🚪 تسجيل الخروج
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white hidden sm:inline-flex">
                                    تسجيل الدخول
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ابحث عن قالب..."
                                    className="w-full px-4 py-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    🔍
                                </button>
                            </div>
                        </form>

                        {/* Mobile Nav Links */}
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "block px-4 py-3 rounded-lg font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {mounted && isAuthenticated ? (
                                <>
                                    <hr className="my-2 border-gray-100 dark:border-gray-800" />
                                    <Link
                                        href="/dashboard"
                                        className="block px-4 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        📊 لوحة التحكم
                                    </Link>
                                    <Link
                                        href="/wishlist"
                                        className="block px-4 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        ❤️ المفضلة
                                    </Link>
                                    {user?.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            className="block px-4 py-3 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            ⚙️ لوحة الإدارة
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-right px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        🚪 تسجيل الخروج
                                    </button>
                                </>
                            ) : (
                                <>
                                    <hr className="my-2 border-gray-100 dark:border-gray-800" />
                                    <Link
                                        href="/login"
                                        className="block px-4 py-3 rounded-lg font-medium bg-primary-600 text-white text-center hover:bg-primary-700"
                                    >
                                        تسجيل الدخول
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block px-4 py-3 rounded-lg font-medium text-primary-600 dark:text-primary-400 text-center border border-primary-600 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                    >
                                        إنشاء حساب
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
