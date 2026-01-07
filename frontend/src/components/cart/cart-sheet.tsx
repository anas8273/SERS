'use client'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { removeFromCart, setCartOpen } from '@/redux/features/cart-slice'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function CartSheet() {
    const dispatch = useDispatch()
    const cart = useSelector((state: RootState) => state.cart)
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Sheet open={cart.isOpen} onOpenChange={(open) => dispatch(setCartOpen(open))}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
                <SheetHeader className="space-y-2.5 pr-6">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Shopping Cart ({cart.items.length})
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
                    {cart.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Your cart is empty</h3>
                                <p className="text-muted-foreground text-sm">Looks like you haven't added anything yet.</p>
                            </div>
                            <Button variant="outline" onClick={() => dispatch(setCartOpen(false))}>
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.items.map((item) => (
                                <div key={item.template.id} className="flex gap-4">
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                                        {item.template.image ? (
                                            <Image
                                                src={item.template.image}
                                                alt={item.template.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
                                                <span className="text-xs text-gray-400">No img</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-medium line-clamp-2 text-sm leading-tight">
                                                {item.template.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">License: Standard</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">
                                                ${Number(item.template.price).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => dispatch(removeFromCart(item.template.id))}
                                                className="text-red-500 hover:text-red-600 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t pt-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${cart.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${cart.total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Link href="/checkout" onClick={() => dispatch(setCartOpen(false))}>
                        <Button className="w-full" size="lg" disabled={cart.items.length === 0}>
                            Proceed to Checkout
                        </Button>
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    )
}
