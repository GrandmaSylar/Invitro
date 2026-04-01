import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../app/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../app/components/ui/input-otp';
import { ArrowLeft, Loader2, ShieldCheck, Smartphone, Mail, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/useAuthStore';

type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'backup';

export function TwoFactorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingTwoFactor = useAuthStore((s) => s.pendingTwoFactor);
  const completeTwoFactor = useAuthStore((s) => s.completeTwoFactor);
  const logout = useAuthStore((s) => s.logout);

  const [method, setMethod] = useState<TwoFactorMethod>('totp');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resend cooldowns for sms / email
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Guard: redirect to login if not pending 2FA
  useEffect(() => {
    if (!pendingTwoFactor) {
      navigate('/login', { replace: true });
    }
  }, [pendingTwoFactor, navigate]);

  // Cooldown timers
  useEffect(() => {
    if (smsCooldown <= 0) return;
    const t = setInterval(() => setSmsCooldown((p) => Math.max(p - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [smsCooldown]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = setInterval(() => setEmailCooldown((p) => Math.max(p - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [emailCooldown]);

  const redirectPath = searchParams.get('redirect') || '/';

  const handleVerify = async (verifyCode: string) => {
    if (!verifyCode.trim()) {
      setError('Please enter a code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.verifyTwoFactor(verifyCode);
      completeTwoFactor();
      toast.success('Two-factor verification successful');
      navigate(redirectPath, { replace: true });
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendSms = async () => {
    if (smsCooldown > 0) return;
    await authService.sendOtp('');
    setSmsCooldown(60);
    toast.success('SMS code sent');
  };

  const handleResendEmail = async () => {
    if (emailCooldown > 0) return;
    await authService.sendMagicLink('');
    setEmailCooldown(60);
    toast.success('Email code sent');
  };

  const handleBackToLogin = () => {
    logout();
    navigate('/login');
  };

  // Reset code when switching methods
  const handleMethodChange = (value: string) => {
    setMethod(value as TwoFactorMethod);
    setCode('');
    setBackupCode('');
    setError('');
  };

  // Method Cycling
  const cycleMethod = () => {
    const methods: TwoFactorMethod[] = ['totp', 'sms', 'email', 'backup'];
    const idx = methods.indexOf(method);
    const next = methods[(idx + 1) % methods.length];
    handleMethodChange(next);
  };

  if (!pendingTwoFactor) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-[460px] shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10">
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold">Two-Factor Authentication</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a verification code to continue
                </p>
              </div>
            </div>

            {/* Method Tabs */}
            <Tabs value={method} onValueChange={handleMethodChange}>
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="totp" className="text-xs gap-1">
                  <ShieldCheck className="size-3.5" />
                  App
                </TabsTrigger>
                <TabsTrigger value="sms" className="text-xs gap-1">
                  <Smartphone className="size-3.5" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="email" className="text-xs gap-1">
                  <Mail className="size-3.5" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="backup" className="text-xs gap-1">
                  <KeyRound className="size-3.5" />
                  Backup
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {/* TOTP - Authenticator App */}
                <TabsContent value="totp" key="totp">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground text-center">
                      Enter the 6-digit code from your authenticator app
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => { setCode(value); setError(''); }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <span className="text-muted-foreground mx-1">-</span>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && <p className="text-xs text-destructive text-center">{error}</p>}
                    <Button
                      className="w-full"
                      onClick={() => handleVerify(code)}
                      disabled={loading || code.length < 6}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Verify
                    </Button>
                  </motion.div>
                </TabsContent>

                {/* SMS Code */}
                <TabsContent value="sms" key="sms">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground text-center">
                      Enter the 6-digit code sent to your phone
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => { setCode(value); setError(''); }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <span className="text-muted-foreground mx-1">-</span>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && <p className="text-xs text-destructive text-center">{error}</p>}
                    <Button
                      className="w-full"
                      onClick={() => handleVerify(code)}
                      disabled={loading || code.length < 6}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Verify
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={handleResendSms}
                      disabled={smsCooldown > 0}
                    >
                      {smsCooldown > 0 ? `Resend code (${smsCooldown}s)` : 'Resend code'}
                    </Button>
                  </motion.div>
                </TabsContent>

                {/* Email Code */}
                <TabsContent value="email" key="email">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground text-center">
                      Enter the 6-digit code sent to your email
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => { setCode(value); setError(''); }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <span className="text-muted-foreground mx-1">-</span>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && <p className="text-xs text-destructive text-center">{error}</p>}
                    <Button
                      className="w-full"
                      onClick={() => handleVerify(code)}
                      disabled={loading || code.length < 6}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Verify
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={handleResendEmail}
                      disabled={emailCooldown > 0}
                    >
                      {emailCooldown > 0 ? `Resend code (${emailCooldown}s)` : 'Resend code'}
                    </Button>
                  </motion.div>
                </TabsContent>

                {/* Backup Code */}
                <TabsContent value="backup" key="backup">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground text-center">
                      Enter one of your backup recovery codes
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="backup-code">Backup Code</Label>
                      <Input
                        id="backup-code"
                        placeholder="XXXX-XXXX-XXXX"
                        value={backupCode}
                        onChange={(e) => { setBackupCode(e.target.value); setError(''); }}
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-xs text-destructive text-center">{error}</p>}
                    <Button
                      className="w-full"
                      onClick={() => handleVerify(backupCode)}
                      disabled={loading || !backupCode.trim()}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Verify
                    </Button>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* Actions */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={cycleMethod}
                className="text-sm text-primary font-medium hover:underline transition-colors"
              >
                Use a different method
              </button>
              <button
                onClick={handleBackToLogin}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
