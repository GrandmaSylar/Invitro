import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Checkbox } from '../../app/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../app/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../app/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../app/components/ui/dialog';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
  Smartphone,
  Wand2,
  Building2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRbacStore } from '../../stores/useRbacStore';

type LoginMethod = 'email' | 'username' | 'phone' | 'magic' | 'google' | 'microsoft' | 'apple' | 'sso';

// SVG brand icons for social buttons
const GoogleIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
);

const AppleIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className + " fill-current"} aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginToStore = useAuthStore((s) => s.login);
  const rbacUsers = useRbacStore((s) => s.users);
  const rbacRoles = useRbacStore((s) => s.roles);

  // Active tab
  const [activeTab, setActiveTab] = useState<LoginMethod>('email');

  // Email/Password & Username/Password form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Phone OTP
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Magic Link
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  // SSO Form
  const [ssoDomain, setSsoDomain] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);

  // Social overlay
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Loading & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Failed login tracking
  const [failCount, setFailCount] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const redirectPath = searchParams.get('redirect') || '/';

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setFailCount(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // ── Helpers ──────────────────────────────────────────────────

  const resolvePermissions = useCallback(
    (roleId: string, overrides: Record<string, boolean>) => {
      const role = rbacRoles.find((r) => r.id === roleId);
      if (!role) return {};
      return { ...role.permissions, ...overrides };
    },
    [rbacRoles],
  );

  const doLogin = useCallback(
    (userId: string, method: string) => {
      const user = rbacUsers.find((u) => u.id === userId);
      if (!user) return;
      const perms = resolvePermissions(user.roleId, user.permissionOverrides);
      loginToStore(user, perms, method);

      if (user.twoFactorEnabled) {
        navigate('/2fa?redirect=' + encodeURIComponent(redirectPath));
      } else {
        navigate(redirectPath, { replace: true });
      }
    },
    [rbacUsers, resolvePermissions, loginToStore, navigate, redirectPath],
  );

  const handleCredentialLogin = async (identifier: 'email' | 'username') => {
    if (lockoutSeconds > 0) return;
    setError('');
    setLoading(true);

    const credentials =
      identifier === 'email'
        ? { email, password }
        : { username, password };

    try {
      const { user } = await authService.authenticate(credentials);
      setFailCount(0);
      doLogin(user.id, identifier === 'email' ? 'email_password' : 'username_password');
    } catch (err: unknown) {
      const nextFail = failCount + 1;
      setFailCount(nextFail);
      if (nextFail >= 5) {
        setLockoutSeconds(30);
        setError('Too many failed attempts. Account locked for 30 seconds.');
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) { setError('Phone number is required'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent to ' + phone);
    } catch {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) { setError('Enter the full 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.verifyTwoFactor(otpCode);
      // Log in as first user that matches phone or fallback to first user
      const user = rbacUsers.find((u) => u.phone === phone) || rbacUsers[0];
      doLogin(user.id, 'phone_otp');
    } catch {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!magicEmail.trim()) { setError('Email is required'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.sendMagicLink(magicEmail);
      setMagicSent(true);
      toast.success('Magic link sent to ' + magicEmail);
    } catch {
      setError('Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMagicLink = () => {
    const user = rbacUsers.find((u) => u.email === magicEmail) || rbacUsers[0];
    doLogin(user.id, 'magic_link');
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    setTimeout(() => {
      const user = rbacUsers[0]; // Default to first seed user
      doLogin(user.id, provider.toLowerCase());
      setSocialLoading(null);
    }, 1500);
  };

  const handleSsoSubmit = () => {
    if (!ssoDomain.trim()) return;
    setSsoLoading(true);
    setTimeout(() => {
      const user = rbacUsers[0];
      doLogin(user.id, 'sso');
      setSsoLoading(false);
    }, 1500);
  };

  // Reset form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as LoginMethod);
    setError('');
    setOtpSent(false);
    setOtpCode('');
    setMagicSent(false);
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Social login overlay */}
      <AnimatePresence>
        {socialLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-lg font-medium">
                Authenticating with {socialLoading}…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-[460px] shadow-2xl">
          <CardContent className="p-8">
            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10">
                <Lock className="size-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
                  Invitro AIDMED Diagnostics
                </p>
                <h1 className="text-xl font-bold">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Choose a method to sign in
                </p>
              </div>
            </div>

            {/* ── Lockout Banner ──────────────────────────────── */}
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center"
              >
                <p className="text-sm font-medium text-destructive">
                  Account locked. Try again in {lockoutSeconds}s
                </p>
              </motion.div>
            )}

            {/* ── Tabs ────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full grid grid-cols-4 gap-1 h-auto py-1 mb-2">
                <TabsTrigger value="email" className="text-xs gap-1 py-1.5">
                  <Mail className="size-3.5" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="username" className="text-xs gap-1 py-1.5">
                  <User className="size-3.5" />
                  User
                </TabsTrigger>
                <TabsTrigger value="phone" className="text-xs gap-1 py-1.5">
                  <Smartphone className="size-3.5" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="magic" className="text-xs gap-1 py-1.5">
                  <Wand2 className="size-3.5" />
                  Magic
                </TabsTrigger>
                <TabsTrigger value="google" className="text-xs gap-1 py-1.5">
                  <GoogleIcon className="size-3.5" />
                  Google
                </TabsTrigger>
                <TabsTrigger value="microsoft" className="text-xs gap-1 py-1.5">
                  <MicrosoftIcon className="size-3.5" />
                  MS
                </TabsTrigger>
                <TabsTrigger value="apple" className="text-xs gap-1 py-1.5">
                  <AppleIcon className="size-3.5" />
                  Apple
                </TabsTrigger>
                <TabsTrigger value="sso" className="text-xs gap-1 py-1.5">
                  <Building2 className="size-3.5" />
                  SSO
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {/* ── Email / Password ──────────────────────────── */}
                <TabsContent value="email">
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleCredentialLogin('email'); }}
                      className="space-y-3 pt-2"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(''); }}
                          disabled={isLocked}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="login-password-email">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password-email"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            disabled={isLocked}
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
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="remember-email"
                            checked={rememberMe}
                            onCheckedChange={(c) => setRememberMe(c === true)}
                          />
                          <label htmlFor="remember-email" className="text-xs text-muted-foreground cursor-pointer">
                            Remember me
                          </label>
                        </div>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      {error && <p className="text-xs text-destructive">{error}</p>}
                      <Button type="submit" className="w-full" disabled={loading || isLocked}>
                        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                        Sign In
                      </Button>
                    </form>
                  </motion.div>
                </TabsContent>

                {/* ── Username / Password ───────────────────────── */}
                <TabsContent value="username">
                  <motion.div
                    key="username"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleCredentialLogin('username'); }}
                      className="space-y-3 pt-2"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          placeholder="kmensah"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); setError(''); }}
                          disabled={isLocked}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="login-password-user">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password-user"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            disabled={isLocked}
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
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="remember-user"
                            checked={rememberMe}
                            onCheckedChange={(c) => setRememberMe(c === true)}
                          />
                          <label htmlFor="remember-user" className="text-xs text-muted-foreground cursor-pointer">
                            Remember me
                          </label>
                        </div>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      {error && <p className="text-xs text-destructive">{error}</p>}
                      <Button type="submit" className="w-full" disabled={loading || isLocked}>
                        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                        Sign In
                      </Button>
                    </form>
                  </motion.div>
                </TabsContent>

                {/* ── Phone OTP ─────────────────────────────────── */}
                <TabsContent value="phone">
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 pt-2"
                  >
                    {!otpSent ? (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="login-phone">Phone Number</Label>
                          <Input
                            id="login-phone"
                            type="tel"
                            placeholder="+233 XX XXX XXXX"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setError(''); }}
                            disabled={isLocked}
                            autoFocus
                          />
                        </div>
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <Button
                          className="w-full"
                          onClick={handleSendOtp}
                          disabled={loading || isLocked}
                        >
                          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                          Send OTP
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground text-center">
                          Enter the 6-digit code sent to <strong className="text-foreground">{phone}</strong>
                        </p>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={otpCode}
                            onChange={(value) => { setOtpCode(value); setError(''); }}
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
                          onClick={handleVerifyOtp}
                          disabled={loading || otpCode.length < 6}
                        >
                          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                          Verify
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-xs"
                          onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        >
                          Change phone number
                        </Button>
                      </>
                    )}
                  </motion.div>
                </TabsContent>

                {/* ── Magic Link ────────────────────────────────── */}
                <TabsContent value="magic">
                  <motion.div
                    key="magic"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 pt-2"
                  >
                    {!magicSent ? (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="login-magic-email">Email</Label>
                          <Input
                            id="login-magic-email"
                            type="email"
                            placeholder="you@example.com"
                            value={magicEmail}
                            onChange={(e) => { setMagicEmail(e.target.value); setError(''); }}
                            disabled={isLocked}
                            autoFocus
                          />
                        </div>
                        {error && <p className="text-xs text-destructive">{error}</p>}
                        <Button
                          className="w-full"
                          onClick={handleSendMagicLink}
                          disabled={loading || isLocked}
                        >
                          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                          Send Magic Link
                        </Button>
                      </>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center size-10 rounded-full bg-green-500/10 mx-auto">
                          <Mail className="size-5 text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Magic link sent to <strong className="text-foreground">{magicEmail}</strong>
                        </p>
                        <Button className="w-full" onClick={handleSimulateMagicLink}>
                          Simulate Magic Link Click
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-xs"
                          onClick={() => { setMagicSent(false); }}
                        >
                          Try a different email
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
                {/* ── Social Logins ───────────────────────────────── */}
                <TabsContent value="google">
                  <motion.div
                    key="google"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-center space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">Sign in with your Google account</p>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleSocialLogin('Google')}
                      disabled={isLocked || socialLoading !== null}
                    >
                      <GoogleIcon />
                      Continue with Google
                    </Button>
                  </motion.div>
                </TabsContent>

                <TabsContent value="microsoft">
                  <motion.div
                    key="microsoft"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-center space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">Sign in with your Microsoft account</p>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleSocialLogin('Microsoft')}
                      disabled={isLocked || socialLoading !== null}
                    >
                      <MicrosoftIcon />
                      Continue with Microsoft
                    </Button>
                  </motion.div>
                </TabsContent>

                <TabsContent value="apple">
                  <motion.div
                    key="apple"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-center space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">Sign in with your Apple account</p>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleSocialLogin('Apple')}
                      disabled={isLocked || socialLoading !== null}
                    >
                      <AppleIcon />
                      Continue with Apple
                    </Button>
                  </motion.div>
                </TabsContent>

                {/* ── SSO Login ──────────────────────────────────── */}
                <TabsContent value="sso">
                  <motion.div
                    key="sso"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="pt-2 space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="sso-domain">Organization Domain / Email</Label>
                      <Input
                        id="sso-domain"
                        placeholder="company.com or you@company.com"
                        value={ssoDomain}
                        onChange={(e) => setSsoDomain(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSsoSubmit}
                      disabled={ssoLoading || !ssoDomain.trim()}
                    >
                      {ssoLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        'Continue with SSO'
                      )}
                    </Button>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* ── Footer Link ─────────────────────────────────── */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
