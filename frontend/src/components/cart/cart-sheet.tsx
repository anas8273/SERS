'use client'

import { useCartStore } from '@/stores/cartStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'

interface CartSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
    const { items, removeItem, getSubtotal, getItemCount } = useCartStore()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col h-full" side="right">
                <SheetHeader className="space-y-2.5 pr-6">
                    <SheetTitle className="flex items-center gap-2 text-right">
                        <ShoppingCart className="w-5 h-5" />
                        سلة المشتريات ({getItemCount()})
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">السلة فارغة</h3>
                                <p className="text-muted-foreground text-sm">يبدو أنك لم تضف أي شيء بعد.</p>
                            </div>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                متابعة التسوق
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.templateId} className="flex gap-4">
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                                        {item.thumbnail ? (
                                            <Image
                                                src={item.thumbnail}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
                                                <span className="text-xs text-gray-400">لا توجد صورة</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-medium line-clamp-2 text-sm leading-tight text-right">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground text-right">
                                                النوع: {item.type === 'interactive' ? 'تفاعلي' : 'جاهز'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between flex-row-reverse">
                                            <span className="font-bold text-sm">
                                                {formatPrice(item.price)}
                                            </span>
                                            <button
                                                onClick={() => removeItem(item.templateId)}
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
                        <div className="flex items-center justify-between text-muted-foreground flex-row-reverse">
                            <span>المجموع الفرعي</span>
                            <span>{formatPrice(getSubtotal())}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-lg flex-row-reverse">
                            <span>الإجمالي</span>
                            <span>{formatPrice(getSubtotal())}</span>
                        </div>
                    </div>
                    <Link href="/cart" onClick={() => onOpenChange(false)}>
                        <Button className="w-full" size="lg" disabled={items.length === 0}>
                            الذهاب للسلة والدفع
                        </Button>
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    )
}
