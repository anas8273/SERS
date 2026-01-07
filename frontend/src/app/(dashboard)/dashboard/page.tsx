import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, DollarSign, ExternalLink, Package } from 'lucide-react'
import Image from 'next/image'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Fetch User's Purchased Templates (via OrderItems)
    // For demo: verify if user id is stored as string or int in your db. 
    // Schema said Int for user_id in Order, but session.user.id is usually string.
    // Assuming session.user.id can be parsed to Int or your auth adapter handles it.
    // Fallback to "1" for seed user if session id is complex string (e.g. auth0 stuff) and you used int in DB.

    const userId = session.user.id ? parseInt(session.user.id) : 1

    const orderItems = await prisma.orderItem.findMany({
        where: {
            order: {
                user_id: isNaN(userId) ? 1 : userId, // Safety check
                status: 'completed', // Only show paid items
            }
        },
        include: {
            template: true
        },
        orderBy: {
            created_at: 'desc'
        }
    })

    // Calculate Stats
    const totalTemplates = orderItems.length
    const totalSpent = orderItems.reduce((acc, item) => acc + Number(item.price), 0)

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-black/50">
            <div className="container mx-auto px-4 max-w-7xl space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Welcome back, {session.user.name || 'User'} 👋</p>
                    </div>
                    <Link href="/marketplace">
                        <Button>
                            Browse Marketplace <ExternalLink className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">My Templates</p>
                            <h3 className="text-2xl font-bold">{totalTemplates}</h3>
                        </div>
                    </div>

                    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Total Invested</p>
                            <h3 className="text-2xl font-bold">${totalSpent.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Purchased Templates</h2>

                    {orderItems.length === 0 ? (
                        <div className="bg-white/40 dark:bg-zinc-900/40 border border-dashed border-gray-300 dark:border-zinc-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold">You don't have any templates yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Start building your career by choosing a professional template from our marketplace.
                                </p>
                            </div>
                            <Link href="/marketplace">
                                <Button variant="outline">Browse Templates</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {orderItems.map((item) => (
                                <div key={item.id} className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <div className="relative aspect-[4/3] bg-gray-100 dark:bg-zinc-800">
                                        {item.template.image ? (
                                            <Image
                                                src={item.template.image}
                                                alt={item.template.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <h3 className="font-semibold line-clamp-1">{item.template.title}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Purchased on {new Date(item.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/editor/${item.template.id}`} className="flex-1">
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                    Open Editor 📝
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="icon" title="View Invoice">
                                                <FileText className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
