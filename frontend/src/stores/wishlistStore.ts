// src/stores/wishlistStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistState {
    templateIds: string[];
    isLoading: boolean;

    // Actions
    fetchWishlistIds: () => Promise<void>;
    toggleWishlist: (templateId: string) => Promise<boolean>;
    isWishlisted: (templateId: string) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            templateIds: [],
            isLoading: false,

            // Fetch wishlist IDs from server
            fetchWishlistIds: async () => {
                try {
                    set({ isLoading: true });
                    const response = await api.getWishlistIds();
                    if (response.success) {
                        set({ templateIds: response.data });
                    }
                } catch (error) {
                    console.error('Failed to fetch wishlist:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            // Toggle template in wishlist
            toggleWishlist: async (templateId: string) => {
                const currentIds = get().templateIds;
                const isCurrentlyWishlisted = currentIds.includes(templateId);

                // Optimistic update
                if (isCurrentlyWishlisted) {
                    set({ templateIds: currentIds.filter((id) => id !== templateId) });
                } else {
                    set({ templateIds: [...currentIds, templateId] });
                }

                try {
                    const response = await api.toggleWishlist(templateId);

                    if (response.success) {
                        if (response.data.action === 'added') {
                            toast.success('تمت الإضافة للمفضلة ❤️');
                        } else {
                            toast.success('تمت الإزالة من المفضلة');
                        }
                        return response.data.is_wishlisted;
                    }

                    // Revert on failure
                    set({ templateIds: currentIds });
                    return isCurrentlyWishlisted;
                } catch (error) {
                    // Revert on error
                    set({ templateIds: currentIds });
                    toast.error('حدث خطأ، حاول مرة أخرى');
                    return isCurrentlyWishlisted;
                }
            },

            // Check if template is wishlisted
            isWishlisted: (templateId: string) => {
                return get().templateIds.includes(templateId);
            },

            // Clear wishlist (local only)
            clearWishlist: () => {
                set({ templateIds: [] });
            },
        }),
        {
            name: 'wishlist-storage',
            partialize: (state) => ({
                templateIds: state.templateIds,
            }),
        }
    )
);
