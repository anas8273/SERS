// src/stores/cartStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coupon } from '@/types';

/**
 * CartStore — Digital templates store.
 * Each template can only appear once in the cart (quantity is always 1).
 * The backend creates one order_item per template_id, so allowing
 * quantity > 1 would charge the user more without delivering extra value.
 */

interface CartItem {
    templateId: string;
    name: string;
    price: number;
    thumbnail: string;
    // [QUALITY-01 FIX] Was literal 'ready' — blocked interactive templates at compile time
    type: 'ready' | 'interactive';
}

interface CartState {
    items: CartItem[];
    appliedCoupon: Coupon | null;
    couponDiscount: number;
    _hasHydrated: boolean;

    // Item actions — addItem returns status for toast feedback
    addItem: (item: CartItem) => 'added' | 'already_in_cart';
    removeItem: (templateId: string) => void;
    clearCart: () => void;

    // Coupon actions
    applyCoupon: (coupon: Coupon, discount: number) => void;
    removeCoupon: () => void;

    // Getters
    getSubtotal: () => number;
    getTotal: () => number;
    getItemCount: () => number;
    isInCart: (templateId: string) => boolean;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            appliedCoupon: null,
            couponDiscount: 0,
            _hasHydrated: false,

            // Add item — digital templates: 1 per item, no duplicates
            addItem: (item) => {
                const items = get().items;
                const exists = items.find((i) => i.templateId === item.templateId);
                if (exists) {
                    return 'already_in_cart';
                }
                set({ items: [...items, item] });
                return 'added';
            },

            // Remove item from cart
            removeItem: (templateId) => {
                const newItems = get().items.filter((i) => i.templateId !== templateId);
                set({ items: newItems });

                // If cart becomes empty, remove coupon
                if (newItems.length === 0) {
                    set({ appliedCoupon: null, couponDiscount: 0 });
                }
            },

            // Clear entire cart
            clearCart: () => {
                set({ items: [], appliedCoupon: null, couponDiscount: 0 });
            },

            // Apply coupon
            applyCoupon: (coupon, discount) => {
                set({ appliedCoupon: coupon, couponDiscount: discount });
            },

            // Remove coupon
            removeCoupon: () => {
                set({ appliedCoupon: null, couponDiscount: 0 });
            },

            // Get subtotal (each item is 1 unit)
            getSubtotal: () => {
                return get().items.reduce((total, item) => total + item.price, 0);
            },

            // Get total (after discount)
            getTotal: () => {
                const subtotal = get().getSubtotal();
                const discount = get().couponDiscount;
                return Math.max(subtotal - discount, 0);
            },

            // Get total item count
            getItemCount: () => {
                if (!get()._hasHydrated) return 0;
                return get().items.length;
            },

            // Check if a template is already in cart
            isInCart: (templateId) => {
                return get().items.some((i) => i.templateId === templateId);
            },
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({
                items: state.items,
                // Don't persist coupon - require re-validation
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state._hasHydrated = true;
                }
            },
        }
    )
);
