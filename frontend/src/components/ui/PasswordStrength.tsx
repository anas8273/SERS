'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

function calculateStrength(password: string): { score: number; label: string; color: string; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score += 1;
  else tips.push('8 أحرف على الأقل');

  if (password.length >= 12) score += 1;

  if (/[A-Z]/.test(password)) score += 1;
  else tips.push('حرف كبير واحد على الأقل');

  if (/[a-z]/.test(password)) score += 1;
  else tips.push('حرف صغير واحد على الأقل');

  if (/\d/.test(password)) score += 1;
  else tips.push('رقم واحد على الأقل');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else tips.push('رمز خاص واحد (!@#$)');

  if (score <= 2) return { score, label: 'ضعيفة', color: 'bg-red-500', tips };
  if (score <= 4) return { score, label: 'متوسطة', color: 'bg-amber-500', tips };
  return { score, label: 'قوية', color: 'bg-emerald-500', tips };
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const { score, label, color, tips } = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  const percentage = Math.min((score / 6) * 100, 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn(
          'text-[10px] font-bold whitespace-nowrap',
          score <= 2 ? 'text-red-500' : score <= 4 ? 'text-amber-500' : 'text-emerald-500'
        )}>
          {label}
        </span>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tips.map((tip, i) => (
            <span key={i} className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">
              {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
