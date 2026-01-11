// src/stores/wishlistStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistState {
    productIds: string[];
    isLoading: boolean;

    // Actions
    fetchWishlistIds: () => Promise<void>;
    toggleWishlist: (productId: string) => Promise<boolean>;
    isWishlisted: (productId: string) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            productIds: [],
            isLoading: false,

            // Fetch wishlist IDs from server
            fetchWishlistIds: async () => {
                try {
                    set({ isLoading: true });
                    const response = await api.getWishlistIds();
                    if (response.success) {
                        set({ productIds: response.data });
                    }
                } catch (error) {
                    console.error('Failed to fetch wishlist:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            // Toggle product in wishlist
            toggleWishlist: async (productId: string) => {
                const currentIds = get().productIds;
                const isCurrentlyWishlisted = currentIds.includes(productId);

                // Optimistic update
                if (isCurrentlyWishlisted) {
                    set({ productIds: currentIds.filter((id) => id !== productId) });
                } else {
                    set({ productIds: [...currentIds, productId] });
                }

                try {
                    const response = await api.toggleWishlist(productId);

                    if (response.success) {
                        if (response.data.action === 'added') {
                            toast.success('تمت الإضافة للمفضلة ❤️');
                        } else {
                            toast.success('تمت الإزالة من المفضلة');
                        }
                        return response.data.is_wishlisted;
                    }

                    // Revert on failure
                    set({ productIds: currentIds });
                    return isCurrentlyWishlisted;
                } catch (error) {
                    // Revert on error
                    set({ productIds: currentIds });
                    toast.error('حدث خطأ، حاول مرة أخرى');
                    return isCurrentlyWishlisted;
                }
            },

            // Check if product is wishlisted
            isWishlisted: (productId: string) => {
                return get().productIds.includes(productId);
            },

            // Clear wishlist (local only)
            clearWishlist: () => {
                set({ productIds: [] });
            },
        }),
        {
            name: 'wishlist-storage',
            partialize: (state) => ({
                productIds: state.productIds,
            }),
        }
    )
);
