'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { LanguageSwitcherCompact } from '@/components/language/LanguageSwitcher';
import { useTranslation } from '@/i18n/useTranslation';
import { toast } from 'react-hot-toast';
import { 
    ShoppingCart, 
    User, 
    LayoutDashboard, 
    Heart, 
    Settings, 
    LogOut, 
    Menu, 
    X,
    LayoutTemplate,
    Briefcase,
    FolderOpen,
} from 'lucide-react';

/**
 * Premium Navbar — Advanced scroll behavior:
 * - Transparent on top (hero pages)
 * - Solid backdrop-blur on scroll
 * - Hides on scroll down, shows on scroll up
 * - Smooth transitions throughout
 */
export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { getItemCount } = useCartStore();
    const { t, dir } = useTranslation();

    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Advanced scroll state
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const lastScrollYRef = useRef(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
    }, [pathname]);

    // Determine if on a hero page (marketplace, home) — ONLY hero pages get hide-on-scroll
    const isHeroPage = pathname === '/' || pathname === '/marketplace';

    // Advanced scroll detection — hides navbar ONLY on hero pages
    const handleScroll = useCallback(() => {
        const currentY = window.scrollY;
        setScrolled(currentY > 20);
        
        // ONLY hide/show on hero pages — on all other pages, navbar is always visible
        if (isHeroPage && currentY > 100) {
            if (currentY > lastScrollYRef.current + 8) {
                setHidden(true); // scrolling down on hero
            } else if (currentY < lastScrollYRef.current - 5) {
                setHidden(false); // scrolling up on hero
            }
        } else {
            setHidden(false); // always visible on non-hero pages
        }
        lastScrollYRef.current = currentY;
    }, [isHeroPage]);


    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);


    // FIX: await the logout promise properly — was called synchronously before
    const handleLogout = async () => {
        await logout();
        toast.success(t('nav.logout') + ' ✓');
        router.push('/');
    };

    const navItems = [
        { label: t('nav.home'), href: '/', icon: null },
        { label: t('nav.marketplace'), href: '/marketplace', icon: FolderOpen },
        { label: t('nav.services'), href: '/services', icon: Briefcase },
        { label: t('nav.about'), href: '/about', icon: null },
    ];

    const cartCount = mounted && isAuthenticated ? getItemCount() : 0;

    // ── Cart bounce micro-interaction ──
    const cartIconRef = useRef<HTMLAnchorElement>(null);
    const prevCartCount = useRef(cartCount);
    useEffect(() => {
        if (cartCount > prevCartCount.current && cartIconRef.current) {
            cartIconRef.current.classList.add('cart-bounce');
            const timer = setTimeout(() => {
                cartIconRef.current?.classList.remove('cart-bounce');
            }, 500);
            return () => clearTimeout(timer);
        }
        prevCartCount.current = cartCount;
    }, [cartCount]);

    return (
        <header 
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
                scrolled || !isHeroPage
                    ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800/80 shadow-sm'
                    : 'bg-transparent border-b border-transparent',
            )} 
            dir={dir}
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                // Use translateY for hide/show + translateZ for GPU layer in a single transform
                // This avoids Tailwind class conflict with inline GPU compositing
                transform: (hidden && !mobileMenuOpen)
                    ? 'translateY(-100%) translateZ(0)'
                    : 'translateY(0) translateZ(0)',
                WebkitTransform: (hidden && !mobileMenuOpen)
                    ? 'translateY(-100%) translateZ(0)'
                    : 'translateY(0) translateZ(0)',
            }}
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 font-bold text-xl flex-shrink-0 group">
                        <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110',
                            scrolled || !isHeroPage
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'bg-white/15 text-white backdrop-blur-sm'
                        )}>
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            'hidden sm:inline tracking-tight font-black transition-colors duration-300',
                            scrolled || !isHeroPage
                                ? 'text-gray-900 dark:text-white'
                                : 'text-white'
                        )}>{t('nav.brand')}</span>
                    </Link>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all duration-200",
                                    pathname === item.href
                                        ? (scrolled || !isHeroPage
                                            ? 'text-primary bg-primary/5'
                                            : 'text-white bg-white/15')
                                        : (scrolled || !isHeroPage
                                            ? 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                                            : 'text-white/80 hover:text-white hover:bg-white/10')
                                )}
                            >
                                {item.icon && <item.icon className="w-4 h-4" />}
                                {item.label}
                                {/* Animated active indicator — FIX RTL: inset-x-2 is RTL-safe */}
                                {pathname === item.href && (
                                    <div
                                        className={cn(
                                            "absolute bottom-0 inset-x-2 h-0.5 rounded-full transition-all duration-300",
                                            scrolled || !isHeroPage
                                                ? 'bg-primary'
                                                : 'bg-white'
                                        )}
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 sm:gap-1.5">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Language Toggle — icon+label on md+, icon-only on sm */}
                        <LanguageSwitcherCompact />

                        {/* Notification Bell — only for logged-in users */}
                        {mounted && isAuthenticated && <NotificationBell />}

                        {/* Cart — requires auth; guests redirected to login */}
                        {mounted && (
                            <Link
                                ref={cartIconRef}
                                href={isAuthenticated ? '/cart' : '/login?returnUrl=/cart'}
                                className={cn(
                                "relative p-2.5 rounded-xl transition-all duration-200",
                                scrolled || !isHeroPage
                                    ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    : 'hover:bg-white/10 text-white'
                            )}>
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    // FIX RTL: `-end-0.5` is the logical equivalent of `-right-0.5` — works correctly in both RTL and LTR
                                    <span className="absolute -top-0.5 -end-0.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Auth */}
                        {mounted && isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className={cn(
                                        "flex items-center gap-2 p-1 pe-3 rounded-full transition-all duration-200 border",
                                        scrolled || !isHeroPage
                                            ? 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                            : 'hover:bg-white/10 border-white/10'
                                    )}
                                >
                                    <span className={cn(
                                        "hidden sm:inline text-sm font-semibold",
                                        scrolled || !isHeroPage
                                            ? 'text-gray-700 dark:text-gray-300'
                                            : 'text-white/90'
                                    )}>
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm border-2 border-primary/20">
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
                                        {/* FIX RTL: `start-0` is the logical equivalent of `left-0` in RTL, `right-0` in LTR */}
                                        <div className="absolute start-0 top-full mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 py-2 z-20 overflow-hidden"
                                            style={{ animation: 'fadeInScale 0.2s ease-out forwards' }}
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1 bg-gray-50/50 dark:bg-gray-900/50">
                                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                            <LayoutDashboard className="w-4 h-4 text-gray-400" />
                                                {t('nav.dashboard')}
                                            </Link>
                                            <Link
                                                href="/wishlist"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Heart className="w-4 h-4 text-gray-400" />
                                                {t('nav.wishlist')}
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    {t('nav.admin')}
                                                </Link>
                                            )}
                                            <hr className="my-1 border-gray-100 dark:border-gray-700" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t('nav.logout')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button size="sm" className={cn(
                                    "rounded-full px-6 hidden sm:inline-flex font-bold transition-all duration-200",
                                    scrolled || !isHeroPage
                                        ? ''
                                        : 'bg-white text-gray-900 hover:bg-white/90 shadow-lg'
                                )}>
                                    {t('nav.login')}
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        {/* a11y: Added aria-label and aria-expanded for screen readers */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? t('common.close') : 'فتح القائمة'}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-menu"
                            className={cn(
                                "lg:hidden p-2 rounded-xl transition-all duration-200",
                                scrolled || !isHeroPage
                                    ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    : 'hover:bg-white/10 text-white'
                            )}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {/* a11y: role=dialog with aria-modal for accessibility */}
            <div 
                id="mobile-menu"
                role="dialog" 
                aria-modal={mobileMenuOpen}
                aria-label="القائمة الرئيسية"
                className={cn(
                'lg:hidden overflow-hidden transition-all duration-500 ease-in-out',
                mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            )}>
                <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
                    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
                        {/* Search is available on the Store page and Services page */}

                        {/* Mobile Nav Links */}
                        <nav className="grid grid-cols-1 gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98]"
                                    )}
                                >
                                    {item.icon && <item.icon className="w-5 h-5" />}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {!isAuthenticated && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Link href="/login" className="block">
                                    <Button className="w-full rounded-2xl py-6 font-bold text-base">{t('nav.login')}</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
