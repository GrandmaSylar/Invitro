import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Checkbox } from '../../app/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../app/components/ui/tabs';
import { Eye, EyeOff, Loader2, Mail, User, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRbacStore } from '../../stores/useRbacStore';

type LoginMethod = 'email' | 'username';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginToStore = useAuthStore((s) => s.login);
  const rbacUsers = useRbacStore((s) => s.users);
  const rbacRoles = useRbacStore((s) => s.roles);

  // Active tab
  const [activeTab, setActiveTab] = useState<LoginMethod>('username');

  // Email/Password & Username/Password form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  const handleCredentialLogin = async (identifier: 'email' | 'username') => {
    if (lockoutSeconds > 0) return;
    setError('');
    setLoading(true);

    const credentials =
      identifier === 'email'
        ? { login: email, password }
        : { login: username, password };

    try {
      const { user, permissions } = await authService.authenticate(credentials);
      
      // Merge base role permissions with any user-specific overrides
      const finalPerms = { ...permissions, ...(user.permissionOverrides || {}) };
      
      setFailCount(0);
      loginToStore(user, finalPerms, identifier === 'email' ? 'email_password' : 'username_password');
      navigate(redirectPath, { replace: true });
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

  // Reset form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as LoginMethod);
    setError('');
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
                  Sign in to your account
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
              <TabsList className="w-full grid grid-cols-2 gap-1 h-auto py-1 mb-2">
                <TabsTrigger value="username" className="text-xs gap-1 py-1.5">
                  <User className="size-3.5" />
                  Username
                </TabsTrigger>
                <TabsTrigger value="email" className="text-xs gap-1 py-1.5">
                  <Mail className="size-3.5" />
                  Email
                </TabsTrigger>
              </TabsList>


                {/* ── Username / Password ───────────────────────── */}
                <TabsContent value="username" key="username-tab">
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

                {/* ── Email / Password ──────────────────────────── */}
                <TabsContent value="email" key="email-tab">
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

            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
