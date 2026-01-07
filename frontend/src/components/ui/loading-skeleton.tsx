import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted/50", className)}
            {...props}
        />
    )
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white/40 dark:bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
            </div>
        </div>
    )
}

export { Skeleton }
