'use client';

import { useState } from 'react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
    templateId: string;
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

    const wishlisted = isWishlisted(templateId);

    const sizeClasses = {
        sm: 'w-8 h-8 text-lg',
        md: 'w-10 h-10 text-xl',
        lg: 'w-12 h-12 text-2xl',
    };

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        await toggleWishlist(templateId);
        setIsLoading(false);
    };

    if (variant === 'button') {
        return (
            <button
                onClick={handleClick}
                disabled={isLoading}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
                    wishlisted
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
                    isLoading && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                <span className={cn('transition-transform', isLoading && 'animate-pulse')}>
                    {wishlisted ? '❤️' : '🤍'}
                </span>
                <span className="text-sm font-medium">
                    {wishlisted ? 'في المفضلة' : 'أضف للمفضلة'}
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
                'flex items-center justify-center rounded-full transition-all duration-200',
                'bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg',
                'hover:scale-110 active:scale-95',
                sizeClasses[size],
                wishlisted && 'bg-red-50',
                isLoading && 'opacity-50 cursor-not-allowed',
                className
            )}
            aria-label={wishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
            <span
                className={cn(
                    'transition-all duration-300',
                    isLoading && 'animate-pulse',
                    wishlisted && 'animate-[heartbeat_0.3s_ease-in-out]'
                )}
            >
                {wishlisted ? '❤️' : '🤍'}
            </span>
        </button>
    );
}

export default WishlistButton;
