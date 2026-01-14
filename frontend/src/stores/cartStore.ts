// src/stores/cartStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coupon } from '@/types';

interface CartItem {
    templateId: string;
    name: string;
    price: number;
    thumbnail: string;
    type: 'ready' | 'interactive';
}

interface CartState {
    items: CartItem[];
    appliedCoupon: Coupon | null;
    couponDiscount: number;

    // Item actions
    addItem: (item: CartItem) => void;
    removeItem: (templateId: string) => void;
    clearCart: () => void;

    // Coupon actions
    applyCoupon: (coupon: Coupon, discount: number) => void;
    removeCoupon: () => void;

    // Getters
    getSubtotal: () => number;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            appliedCoupon: null,
            couponDiscount: 0,

            // Add item to cart
            addItem: (item) => {
                const items = get().items;
                const exists = items.find((i) => i.templateId === item.templateId);
                if (!exists) {
                    set({ items: [...items, item] });
                }
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

            // Get subtotal (before discount)
            getSubtotal: () => {
                return get().items.reduce((total, item) => total + item.price, 0);
            },

            // Get total (after discount)
            getTotal: () => {
                const subtotal = get().getSubtotal();
                const discount = get().couponDiscount;
                return Math.max(subtotal - discount, 0);
            },

            // Get item count
            getItemCount: () => {
                return get().items.length;
            },
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({
                items: state.items,
                // Don't persist coupon - require re-validation
            }),
        }
    )
);
