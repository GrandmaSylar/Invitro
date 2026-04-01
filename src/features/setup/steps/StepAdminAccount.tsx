import { useMemo } from 'react';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { cn } from '../../../app/components/ui/utils';

interface AdminFields {
  adminFullName: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
  adminConfirmPassword: string;
}

interface StepAdminAccountProps {
  fields: AdminFields;
  errors: Record<string, string>;
  onChange: (updates: Partial<AdminFields>) => void;
}

type StrengthLevel = 'Weak' | 'Fair' | 'Strong' | 'Very Strong';

function computePasswordStrength(password: string): { level: StrengthLevel; score: number } {
  if (!password) return { level: 'Weak', score: 0 };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'Weak', score: 25 };
  if (score <= 2) return { level: 'Fair', score: 50 };
  if (score <= 3) return { level: 'Strong', score: 75 };
  return { level: 'Very Strong', score: 100 };
}

const strengthColors: Record<StrengthLevel, string> = {
  Weak: 'bg-red-500',
  Fair: 'bg-orange-500',
  Strong: 'bg-yellow-500',
  'Very Strong': 'bg-green-500',
};

const strengthTextColors: Record<StrengthLevel, string> = {
  Weak: 'text-red-500',
  Fair: 'text-orange-500',
  Strong: 'text-yellow-600',
  'Very Strong': 'text-green-500',
};

export function StepAdminAccount({ fields, errors, onChange }: StepAdminAccountProps) {
  const strength = useMemo(
    () => computePasswordStrength(fields.adminPassword),
    [fields.adminPassword],
  );

  const showMismatch =
    fields.adminConfirmPassword.length > 0 &&
    fields.adminPassword !== fields.adminConfirmPassword;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Create Admin Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set up the initial administrator account for your application.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="adminFullName">Full Name</Label>
          <Input
            id="adminFullName"
            placeholder="Goonmaster Grandma"
            value={fields.adminFullName}
            onChange={(e) => onChange({ adminFullName: e.target.value })}
          />
          {errors.adminFullName && (
            <p className="text-destructive text-xs">{errors.adminFullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email</Label>
          <Input
            id="adminEmail"
            type="email"
            placeholder="admin@example.com"
            value={fields.adminEmail}
            onChange={(e) => onChange({ adminEmail: e.target.value })}
          />
          {errors.adminEmail && (
            <p className="text-destructive text-xs">{errors.adminEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminUsername">Username</Label>
          <Input
            id="adminUsername"
            placeholder="admin"
            value={fields.adminUsername}
            onChange={(e) => onChange({ adminUsername: e.target.value })}
          />
          {errors.adminUsername && (
            <p className="text-destructive text-xs">{errors.adminUsername}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPassword">Password</Label>
          <Input
            id="adminPassword"
            type="password"
            placeholder="••••••••"
            value={fields.adminPassword}
            onChange={(e) => onChange({ adminPassword: e.target.value })}
          />
          {errors.adminPassword && (
            <p className="text-destructive text-xs">{errors.adminPassword}</p>
          )}

          {/* Password strength indicator */}
          {fields.adminPassword.length > 0 && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    strengthColors[strength.level],
                  )}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
              <p
                className={cn(
                  'text-xs font-medium',
                  strengthTextColors[strength.level],
                )}
              >
                {strength.level}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
          <Input
            id="adminConfirmPassword"
            type="password"
            placeholder="••••••••"
            value={fields.adminConfirmPassword}
            onChange={(e) => onChange({ adminConfirmPassword: e.target.value })}
          />
          {showMismatch && (
            <p className="text-destructive text-xs">Passwords do not match</p>
          )}
          {errors.adminConfirmPassword && !showMismatch && (
            <p className="text-destructive text-xs">{errors.adminConfirmPassword}</p>
          )}
        </div>
      </div>
    </div>
  );
}
