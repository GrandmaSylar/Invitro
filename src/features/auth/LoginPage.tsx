import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../../app/components/ui/button';
import { Checkbox } from '../../app/components/ui/checkbox';
import { Eye, EyeOff, Loader2, Mail, User, Lock, Power, ShieldCheck, Zap, RefreshCw, FlaskConical, Layers } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSyncStore } from '../../stores/useSyncStore';
import { showConfirm } from '../../stores/useDialogStore';
import { GlobalDialogs } from '../../app/components/GlobalDialogs';

type LoginMethod = 'email' | 'username';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginToStore = useAuthStore((s) => s.login);

  const handleClose = async () => {
    const confirmed = await showConfirm({
      title: "Exit Application",
      description: "Are you sure you want to close Invitro LIMS? Any unsaved changes may be lost.",
      confirmText: "Exit",
      cancelText: "Cancel",
      variant: "destructive"
    });
    if (confirmed) {
      window.electronAPI?.closeWindow?.();
    }
  };

  // Active tab
  const [activeTab, setActiveTab] = useState<LoginMethod>('username');

  // Email/Password & Username/Password form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Sync / Offline states
  const isOffline = useSyncStore((s) => s.isOffline);
  const setOffline = useSyncStore((s) => s.setOffline);

  const [canWorkOffline, setCanWorkOffline] = useState(false);
  const [workOffline, setWorkOffline] = useState(false);

  useEffect(() => {
    const checkCachedUsers = async () => {
      if (window.electronAPI?.hasCachedUsers) {
        try {
          const hasCached = await window.electronAPI.hasCachedUsers();
          setCanWorkOffline(hasCached);
          if (hasCached) {
            setWorkOffline(isOffline);
          } else {
            setWorkOffline(false);
            if (isOffline) {
              await setOffline(false);
            }
          }
        } catch (err) {
          console.error('Failed to check for cached users:', err);
        }
      }
    };
    checkCachedUsers();
  }, [isOffline, setOffline]);

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

  // Handle Login
  const handleCredentialLogin = async (identifier: 'email' | 'username') => {
    if (lockoutSeconds > 0) return;
    setError('');
    setLoading(true);

    const credentials =
      identifier === 'email'
        ? { login: email, password }
        : { login: username, password };

    try {
      const { user, permissions } = await authService.authenticate(credentials, workOffline);
      
      // If offline login succeeded, ensure the sync store knows they chose to work offline
      await setOffline(workOffline);
      
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

  const handleTabChange = (method: LoginMethod) => {
    setActiveTab(method);
    setError('');
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d233a] overflow-hidden p-6 md:p-12">
      
      {/* Subtle background glow blobs to match premium styling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      </div>

      {/* Top Right Power Icon to Shutdown System (Electron App Exit) */}
      <button
        type="button"
        className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors outline-none cursor-pointer z-20"
        onClick={handleClose}
        title="Close Application"
      >
        <Power className="size-5" />
      </button>

      {/* Main Layout Grid */}
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10">
        
        {/* Left Side: System branding & Features grid */}
        <div className="lg:col-span-7 text-white space-y-8">
          
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center size-13 rounded-xl bg-white/10 text-white border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
              <FlaskConical className="size-6.5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Invitro LIMS</h1>
          </div>

          <h2 className="text-lg md:text-xl text-white/95 font-medium tracking-wide border-b border-white/15 pb-6">
            Modern Laboratory Information Management System
          </h2>

          {/* 2x2 Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-3">
              <Layers className="size-5 text-white/80 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Multi-Lab Support</h3>
                <p className="text-xs text-white/70 mt-1 leading-normal">
                  Manage multiple laboratory sites with real-time data consolidation
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-white/80 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Secure & Compliant</h3>
                <p className="text-xs text-white/70 mt-1 leading-normal">
                  Role-based access control with comprehensive immutable audit trails
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3">
              <Zap className="size-5 text-white/80 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Real-time Processing</h3>
                <p className="text-xs text-white/70 mt-1 leading-normal">
                  Instant sample processing, auto-flagging, and rapid result dispatch
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-3">
              <RefreshCw className="size-5 text-white/80 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Automated Backups</h3>
                <p className="text-xs text-white/70 mt-1 leading-normal">
                  Seamless scheduled backups with zero system downtime
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] bg-white rounded-2xl border border-gray-100 shadow-[0_15px_30px_rgba(0,0,0,0.15)] p-8">
            
            {/* Card Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
              <p className="text-xs text-gray-500 mt-1.5">
                Sign in to access your laboratory system
              </p>
            </div>
 
            {/* Work Offline Toggle */}
            <div className="mb-5 p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="work-offline"
                    checked={workOffline}
                    disabled={!canWorkOffline}
                    onCheckedChange={(c) => setWorkOffline(c === true)}
                    className="border-[#ccd3dc] data-[state=checked]:bg-[#0c2e5a] data-[state=checked]:border-[#0c2e5a] disabled:opacity-50"
                  />
                  <label 
                    htmlFor="work-offline" 
                    className={`text-xs font-bold select-none cursor-pointer ${
                      !canWorkOffline ? 'text-[#8c9ba5] cursor-not-allowed' : 'text-gray-900'
                    }`}
                  >
                    Work Offline
                  </label>
                </div>
                {canWorkOffline && (
                  <span className={`h-2 w-2 rounded-full ${workOffline ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                )}
              </div>
              {!canWorkOffline && (
                <p className="text-[10px] text-amber-600 font-medium leading-tight mt-0.5">
                  Online login required for first-time setup on this device.
                </p>
              )}
            </div>

            {/* Custom Sleek Tab Selector */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all duration-200 cursor-pointer ${
                  activeTab === 'username'
                    ? 'border-[#0c2e5a] text-[#0c2e5a]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => handleTabChange('username')}
              >
                Username Login
              </button>
              <button
                type="button"
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all duration-200 cursor-pointer ${
                  activeTab === 'email'
                    ? 'border-[#0c2e5a] text-[#0c2e5a]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => handleTabChange('email')}
              >
                Email Login
              </button>
            </div>

            {/* Lockout Banner */}
            {isLocked && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                <p className="text-xs font-bold text-red-600">
                  Account locked. Try again in {lockoutSeconds}s
                </p>
              </div>
            )}

            {/* Login Forms */}
            {activeTab === 'username' ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleCredentialLogin('username'); }}
                className="space-y-5"
              >
                {/* Username Input with Custom Outline Floating Label */}
                <div className="relative mt-4">
                  <label
                    htmlFor="login-username"
                    className="absolute -top-2 left-3 bg-white px-1 text-xs font-bold text-[#5f748d] transition-all pointer-events-none z-10"
                  >
                    Username *
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 size-4 text-[#5f748d]" />
                    <input
                      id="login-username"
                      type="text"
                      className="w-full h-11 pl-10 pr-3 border border-[#ccd3dc] rounded-md bg-white focus:outline-none focus:border-[#0f2d59] focus:ring-1 focus:ring-[#0f2d59] text-sm text-gray-900"
                      placeholder="e.g. kmensah"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      disabled={isLocked}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input with Custom Outline Floating Label */}
                <div className="relative mt-4">
                  <label
                    htmlFor="login-password-user"
                    className="absolute -top-2 left-3 bg-white px-1 text-xs font-bold text-[#5f748d] transition-all pointer-events-none z-10"
                  >
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-4 text-[#5f748d]" />
                    <input
                      id="login-password-user"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-11 pl-10 pr-10 border border-[#ccd3dc] rounded-md bg-white focus:outline-none focus:border-[#0f2d59] focus:ring-1 focus:ring-[#0f2d59] text-sm text-gray-900"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-user"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(c === true)}
                      className="border-[#ccd3dc] data-[state=checked]:bg-[#0c2e5a] data-[state=checked]:border-[#0c2e5a]"
                    />
                    <label htmlFor="remember-user" className="text-xs font-bold text-[#5f748d] cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-xs font-bold text-[#0c2e5a] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-xs text-red-600 font-bold pt-1">{error}</p>}

                {/* Action Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0c2e5a] hover:bg-[#092244] text-white font-bold rounded-md shadow-md mt-6 flex items-center justify-center transition-colors border-none cursor-pointer"
                  disabled={loading || isLocked}
                >
                  {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); handleCredentialLogin('email'); }}
                className="space-y-5"
              >
                {/* Email Input with Custom Outline Floating Label */}
                <div className="relative mt-4">
                  <label
                    htmlFor="login-email"
                    className="absolute -top-2 left-3 bg-white px-1 text-xs font-bold text-[#5f748d] transition-all pointer-events-none z-10"
                  >
                    Email Address *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 size-4 text-[#5f748d]" />
                    <input
                      id="login-email"
                      type="email"
                      className="w-full h-11 pl-10 pr-3 border border-[#ccd3dc] rounded-md bg-white focus:outline-none focus:border-[#0f2d59] focus:ring-1 focus:ring-[#0f2d59] text-sm text-gray-900"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      disabled={isLocked}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input with Custom Outline Floating Label */}
                <div className="relative mt-4">
                  <label
                    htmlFor="login-password-email"
                    className="absolute -top-2 left-3 bg-white px-1 text-xs font-bold text-[#5f748d] transition-all pointer-events-none z-10"
                  >
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-4 text-[#5f748d]" />
                    <input
                      id="login-password-email"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-11 pl-10 pr-10 border border-[#ccd3dc] rounded-md bg-white focus:outline-none focus:border-[#0f2d59] focus:ring-1 focus:ring-[#0f2d59] text-sm text-gray-900"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-email"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(c === true)}
                      className="border-[#ccd3dc] data-[state=checked]:bg-[#0c2e5a] data-[state=checked]:border-[#0c2e5a]"
                    />
                    <label htmlFor="remember-email" className="text-xs font-bold text-[#5f748d] cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-xs font-bold text-[#0c2e5a] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-xs text-red-600 font-bold pt-1">{error}</p>}

                {/* Action Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0c2e5a] hover:bg-[#092244] text-white font-bold rounded-md shadow-md mt-6 flex items-center justify-center transition-colors border-none cursor-pointer"
                  disabled={loading || isLocked}
                >
                  {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            )}

            {/* Card Footer matching QSS Version Printout */}
            <div className="text-center space-y-1.5 mt-8">
              <p className="text-[10px] text-[#8c9ba5] font-bold tracking-wider leading-none">
                Invitro LIMS v1.1.10
              </p>
              <p className="text-[8px] text-[#a0adb8] font-bold tracking-widest uppercase leading-none">
                Developed by PhiNova
              </p>
            </div>

          </div>
        </div>

      </div>
      <GlobalDialogs />
    </div>
  );
}
