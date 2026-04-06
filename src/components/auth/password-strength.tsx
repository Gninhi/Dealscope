'use client';

import { cn } from '@/lib/utils';

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Moyen', color: 'bg-amber-500' };
  if (score <= 4) return { score, label: 'Bon', color: 'bg-emerald-500' };
  return { score, label: 'Excellent', color: 'bg-emerald-400' };
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= strength.score ? strength.color : 'bg-white/10'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Force : <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
      </p>
    </div>
  );
}
