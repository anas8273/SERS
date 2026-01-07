import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import * as Icons from 'lucide-react'

// Map icon string names to Lucide components
const IconMap = (iconName: string | null) => {
    if (!iconName) return Icons.Circle;
    // @ts-ignore - Dynamic access to icons
    return Icons[iconName] || Icons.Circle;
}

export async function FilterSidebar() {
    const categories = await prisma.category.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
    })

    return (
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            {/* Categories Section */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Icons.LayoutGrid className="w-4 h-4" />
                    Categories
                </h3>
                <nav className="space-y-2">
                    <Link
                        href="/marketplace"
                        className="flex items-center justify-between p-2 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                    >
                        <span className="flex items-center gap-2">
                            <Icons.Layers className="w-4 h-4" />
                            All Templates
                        </span>
                    </Link>

                    {categories.map((category) => {
                        const Icon = IconMap(category.icon);
                        return (
                            <Link
                                key={category.id}
                                href={`/marketplace?category=${category.slug}`}
                                className="flex items-center justify-between p-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                                    {category.name_en}
                                </span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Price Range Section (UI Only) */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Icons.Tag className="w-4 h-4" />
                    Price Range
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>$0</span>
                        <span>$100</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-blue-600"
                    />
                    <div className="flex gap-2">
                        <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-center">
                            $0
                        </div>
                        <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-center">
                            $100+
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
