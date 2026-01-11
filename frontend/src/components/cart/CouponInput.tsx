'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { Coupon } from '@/types';

interface CouponInputProps {
    orderTotal: number;
    onCouponApplied: (coupon: Coupon, discount: number) => void;
    onCouponRemoved: () => void;
    appliedCoupon?: Coupon | null;
    className?: string;
}

/**
 * CouponInput
 * 
 * Input field for applying discount coupons to orders.
 * Validates coupon and shows discount preview.
 */
export function CouponInput({
    orderTotal,
    onCouponApplied,
    onCouponRemoved,
    appliedCoupon,
    className,
}: CouponInputProps) {
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApply = async () => {
        if (!code.trim()) {
            setError('أدخل كود الخصم');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const response = await api.validateCoupon(code.toUpperCase(), orderTotal);

            if (response.success && response.data.valid) {
                const coupon = response.data.coupon;
                const discount = response.data.calculated_discount;

                onCouponApplied(coupon, discount);
                toast.success(`تم تطبيق الخصم: ${coupon.formatted_discount} 🎉`);
                setCode('');
            } else {
                setError(response.message || 'كود الخصم غير صالح');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ، حاول مرة أخرى');
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemove = () => {
        onCouponRemoved();
        setCode('');
        setError(null);
        toast.success('تم إزالة كود الخصم');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    // If coupon is applied, show applied state
    if (appliedCoupon) {
        return (
            <div className={cn('space-y-2', className)}>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎟️</span>
                        <div>
                            <div className="font-semibold text-green-800">
                                {appliedCoupon.code}
                            </div>
                            <div className="text-sm text-green-600">
                                {appliedCoupon.description || `خصم ${appliedCoupon.formatted_discount}`}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                        إزالة ❌
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            <label className="block text-sm font-medium text-gray-700">
                كود الخصم
            </label>

            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="أدخل كود الخصم"
                        className={cn(
                            'uppercase tracking-wider',
                            error && 'border-red-500 focus:ring-red-500'
                        )}
                        disabled={isValidating}
                    />
                    {code && (
                        <button
                            type="button"
                            onClick={() => {
                                setCode('');
                                setError(null);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <Button
                    type="button"
                    onClick={handleApply}
                    disabled={isValidating || !code.trim()}
                    className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
                >
                    {isValidating ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            جاري التحقق
                        </span>
                    ) : (
                        'تطبيق'
                    )}
                </Button>
            </div>

            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}

            {/* Hint */}
            <p className="text-xs text-gray-500">
                💡 جرب: WELCOME10, SAVE20, HALFPRICE
            </p>
        </div>
    );
}

export default CouponInput;
