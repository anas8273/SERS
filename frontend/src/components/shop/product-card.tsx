'use client'

import { Template, Category } from '@prisma/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import Image from 'next/image'

interface ProductCardProps {
    template: Template & { category: Category }
}

import { useDispatch } from 'react-redux'
import { addToCart } from '@/redux/features/cart-slice'
import { toast } from 'sonner'

export function ProductCard({ template }: ProductCardProps) {
    const dispatch = useDispatch()

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart(template))
        toast.success('Added to cart')
    }

    return (

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.02 }}
            className="group relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
        >
            <Link href={`/template/${template.id}`} className="block relative aspect-[4/3] overflow-hidden">
                {template.image ? (
                    <Image
                        src={template.image}
                        alt={template.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                    </div>
                )}

                <div className="absolute top-3 right-3 p-1.5 bg-white/80 dark:bg-black/60 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-red-500 cursor-pointer" />
                </div>

                {template.is_featured && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                        Featured
                    </div>
                )}
            </Link>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <Link href={`/template/${template.id}`}>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {template.title}
                            </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.category.name_en}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{Number(template.rating).toFixed(1)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ${Number(template.price).toFixed(2)}
                    </span>

                    <button
                        onClick={handleAddToCart}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 z-10 relative"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
