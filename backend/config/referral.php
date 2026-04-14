<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Referral System Configuration
    |--------------------------------------------------------------------------
    |
    | Controls all parameters of the SERS referral/commission system.
    | Edit here to change rates without touching service code.
    |
    */

    // Percentage of order total credited to the referrer (0.10 = 10%)
    'commission_rate' => env('REFERRAL_COMMISSION_RATE', 0.10),

    // Minimum amount (SAR) a user must accumulate before withdrawing
    'min_withdrawal_amount' => env('REFERRAL_MIN_WITHDRAWAL', 50.00),

    // Maximum single withdrawal amount (SAR)
    'max_withdrawal_amount' => env('REFERRAL_MAX_WITHDRAWAL', 10000.00),

    // [FIX S-03] Welcome/join bonus for new referred users (SAR)
    'join_bonus' => env('REFERRAL_JOIN_BONUS', 20.00),

    // Days earnings remain in 'available' status before expiry (null = never)
    'earnings_expiry_days' => null,
];
