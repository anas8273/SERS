'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutTemplate, ShoppingCart } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setCartOpen } from '@/redux/features/cart-slice'
import { CartSheet } from '@/components/cart/cart-sheet'
import { useEffect, useState } from 'react'

export function Navbar() {
    const pathname = usePathname()
    const dispatch = useDispatch()
    const cart = useSelector((state: RootState) => state.cart)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        { label: 'Marketplace', href: '/marketplace' },
        { label: 'Dashboard', href: '/dashboard' },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <LayoutTemplate className="w-6 h-6" />
                    <span>SERS.</span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === item.href
                                    ? "text-primary dark:text-white"
                                    : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        onClick={() => dispatch(setCartOpen(true))}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {mounted && cart.items.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                                {cart.items.length}
                            </span>
                        )}
                    </Button>

                    <Link href="/login">
                        <Button variant="default" size="sm" className="hidden sm:inline-flex">
                            Sign In
                        </Button>
                    </Link>
                </div>

                <CartSheet />
            </div>
        </header>
    )
}
