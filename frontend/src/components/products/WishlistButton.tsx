'use client';

import { useState } from 'react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WishlistButtonProps {
    templateId: string | number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'icon' | 'button';
}

/**
 * WishlistButton
 * 
 * Heart icon button for adding/removing templates from wishlist.
 * Shows filled heart when template is in wishlist.
 * Requires authentication - redirects to login if not authenticated.
 */
export function WishlistButton({
    templateId,
    className,
    size = 'md',
    variant = 'icon',
}: WishlistButtonProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { isWishlisted, toggleWishlist } = useWishlistStore();
    const [isLoading, setIsLoading] = useState(false);

    const wishlisted = isWishlisted(String(templateId));

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        try {
            await toggleWishlist(String(templateId));
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === 'button') {
        const buttonSize = size === 'md' ? 'default' : size;
        return (
            <Button
                variant="outline"
                size={buttonSize as any}
                onClick={handleClick}
                disabled={isLoading}
                className={cn(
                    'rounded-full font-bold gap-2 border-2 transition-all duration-300',
                    wishlisted
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className={cn('animate-spin', iconSizes[size])} />
                ) : (
                    <Heart 
                        className={cn(
                            'transition-all duration-300',
                            iconSizes[size],
                            wishlisted && 'fill-current scale-110'
                        )} 
                    />
                )}
                <span>
                    {wishlisted ? 'في المفضلة' : 'أضف للمفضلة'}
                </span>
            </Button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
                'flex items-center justify-center rounded-full transition-all duration-300 group',
                'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg hover:shadow-xl',
                'hover:scale-110 active:scale-95 border border-white/20 dark:border-gray-700',
                sizeClasses[size],
                wishlisted && 'bg-red-50 dark:bg-red-900/20',
                isLoading && 'opacity-50 cursor-not-allowed',
                className
            )}
            aria-label={wishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
            {isLoading ? (
                <Loader2 className={cn('animate-spin text-primary', iconSizes[size])} />
            ) : (
                <Heart
                    className={cn(
                        'transition-all duration-500',
                        iconSizes[size],
                        wishlisted 
                            ? 'fill-red-500 text-red-500 animate-[heartbeat_0.5s_ease-in-out]' 
                            : 'text-gray-400 group-hover:text-red-400'
                    )}
                />
            )}
            
            {/* Heartbeat Animation Style */}
            <style jsx>{`
                @keyframes heartbeat {
                    0% { transform: scale(1); }
                    25% { transform: scale(1.3); }
                    50% { transform: scale(1); }
                    75% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </button>
    );
}

export default WishlistButton;
