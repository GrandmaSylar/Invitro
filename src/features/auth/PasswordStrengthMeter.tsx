import { useMemo } from 'react';
import { cn } from '../../app/components/ui/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; color: string }> = {
  0: { label: '', color: '' },
  1: { label: 'Weak', color: 'bg-red-500' },
  2: { label: 'Fair', color: 'bg-orange-500' },
  3: { label: 'Strong', color: 'bg-yellow-500' },
  4: { label: 'Very Strong', color: 'bg-green-500' },
};

function getStrength(password: string): StrengthLevel {
  if (!password) return 0;
  if (password.length < 6) return 1;

  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  if (hasMixedCase && hasNumbers && hasSpecial) return 4;
  if (hasMixedCase && hasNumbers) return 3;
  return 2;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getStrength(password), [password]);
  const config = STRENGTH_CONFIG[strength];

  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              level <= strength ? config.color : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs font-medium transition-colors duration-300',
          strength <= 1 && 'text-red-500',
          strength === 2 && 'text-orange-500',
          strength === 3 && 'text-yellow-600 dark:text-yellow-400',
          strength === 4 && 'text-green-500',
        )}
      >
        {config.label}
      </p>
    </div>
  );
}
