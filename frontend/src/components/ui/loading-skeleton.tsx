import { cn } from "@/lib/utils"

/**
 * Base Skeleton Component
 * 
 * A reusable skeleton component for loading states
 */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
                className
            )}
            {...props}
        />
    )
}

/**
 * TemplateCardSkeleton
 * 
 * Skeleton loading state for template/product cards
 */
export function TemplateCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
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

// Alias for backward compatibility
export const ProductCardSkeleton = TemplateCardSkeleton;

/**
 * TextSkeleton
 * 
 * Skeleton for text content
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton 
                    key={i} 
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-2/3" : "w-full"
                    )} 
                />
            ))}
        </div>
    )
}

/**
 * AvatarSkeleton
 * 
 * Skeleton for avatar/profile images
 */
export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    }
    
    return <Skeleton className={cn("rounded-full", sizeClasses[size])} />
}

export { Skeleton }
