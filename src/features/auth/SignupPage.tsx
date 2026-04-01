import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Eye, EyeOff, Loader2, UserPlus, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

type Step = 'form' | 'verify';

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validateField = useCallback((field: string, value: string) => {
    let err = '';
    if (field === 'fullName' && !value.trim()) err = 'Full name is required';
    if (field === 'email') {
      if (!value.trim()) err = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) err = 'Invalid email format';
    }
    if (field === 'password') {
      if (!value) err = 'Password is required';
      else if (value.length < 6) err = 'Password must be at least 6 characters';
    }
    if (field === 'confirmPassword') {
      if (!value) err = 'Please confirm your password';
      else if (password !== value) err = 'Passwords do not match';
    }

    setErrors((prev) => {
      if (err) return { ...prev, [field]: err };
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [password]);

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  // Immediate mismatch validation when typing password or confirmPassword
  useEffect(() => {
    if (touched.confirmPassword) {
      validateField('confirmPassword', confirmPassword);
    }
  }, [password, confirmPassword, touched.confirmPassword, validateField]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fullName, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.sendMagicLink(email);
      setStep('verify');
      setResendCooldown(60);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authService.sendMagicLink(email);
      setResendCooldown(60);
      toast.success('Verification email resent');
    } catch {
      toast.error('Failed to resend email');
    }
  };

  const handleSimulateVerify = () => {
    toast.success('Email verified. Please sign in.');
    navigate('/login');
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[420px] shadow-2xl">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10">
                    <UserPlus className="size-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-xl font-bold">Create Account</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Join Invitro AIDMED Diagnostics
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input
                      id="signup-fullname"
                      placeholder="Dr. Jane Doe"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                      onBlur={(e) => handleBlur('fullName', e.target.value)}
                      autoFocus
                    />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  {/* Username (optional) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-username">
                      Username <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="signup-username"
                      placeholder="jdoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                        onBlur={(e) => handleBlur('password', e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    <PasswordStrengthMeter password={password} />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                        onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  {/* Phone (optional) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone">
                      Phone <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full !mt-5" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating Account…
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Verify State */}
                <div className="flex flex-col items-center gap-3 mb-8">
                  <div className="flex items-center justify-center size-12 rounded-xl bg-green-500/10">
                    <MailCheck className="size-6 text-green-500" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-xl font-bold">Check Your Inbox</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      We sent a verification link to
                    </p>
                    <p className="text-sm font-medium mt-0.5">{email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" onClick={handleSimulateVerify}>
                    Simulate Email Verification
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Resend email (${resendCooldown}s)`
                      : 'Resend email'}
                  </Button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
