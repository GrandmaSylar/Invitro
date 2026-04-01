import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Button } from '../../app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Switch } from '../../app/components/ui/switch';
import { Checkbox } from '../../app/components/ui/checkbox';
import { Slider } from '../../app/components/ui/slider';
import { Badge } from '../../app/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../app/components/ui/alert-dialog';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useRbacStore } from '../../stores/useRbacStore';
import { settingsService } from '../../services/settingsService';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function SecuritySection() {
  const { settings } = useSettingsStore();
  const { roles } = useRbacStore();
  const security = settings.security;

  // Card 1: Password Policy
  const [passwordMinLength, setPasswordMinLength] = useState(security.passwordMinLength);
  const [requireUppercase, setRequireUppercase] = useState(!!security.requireUppercase);
  const [requireNumbers, setRequireNumbers] = useState(!!security.requireNumbers);
  const [requireSymbols, setRequireSymbols] = useState(!!security.requireSymbols);

  // Card 2: Session
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(String(security.sessionTimeoutMinutes));

  // Card 3: Two-Factor Authentication
  const [twoFactorGlobal, setTwoFactorGlobal] = useState(security.twoFactorGlobal);
  const [show2FAConfirm, setShow2FAConfirm] = useState(false);
  const [pending2FAToggle, setPending2FAToggle] = useState(security.twoFactorGlobal);
  const [twoFactorRolePolicy, setTwoFactorRolePolicy] = useState<Record<string, 'optional' | 'required'>>(security.twoFactorRolePolicy || {});

  // Card 4: IP Whitelist
  const [ipWhitelist, setIpWhitelist] = useState<string[]>(security.ipWhitelist || []);
  const [newIp, setNewIp] = useState('');
  const [ipError, setIpError] = useState(false);

  // Card 5: Login Attempts
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<number | ''>(security.maxLoginAttempts);
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState(String(security.lockoutDurationMinutes || 15));

  useEffect(() => {
    setPasswordMinLength(security.passwordMinLength);
    setRequireUppercase(!!security.requireUppercase);
    setRequireNumbers(!!security.requireNumbers);
    setRequireSymbols(!!security.requireSymbols);
    setSessionTimeoutMinutes(String(security.sessionTimeoutMinutes));
    setTwoFactorGlobal(security.twoFactorGlobal);
    setTwoFactorRolePolicy(security.twoFactorRolePolicy || {});
    setIpWhitelist(security.ipWhitelist || []);
    setMaxLoginAttempts(security.maxLoginAttempts);
    setLockoutDurationMinutes(String(security.lockoutDurationMinutes || 15));
  }, [security]);

  const savePasswordPolicy = async () => {
    try {
      await settingsService.patchSettings('security', {
        passwordMinLength,
        requireUppercase,
        requireNumbers,
        requireSymbols,
      });
      toast.success('Password policy saved');
    } catch (e) {
      toast.error('Failed to save password policy');
    }
  };

  const saveSession = async () => {
    try {
      await settingsService.patchSettings('security', {
        sessionTimeoutMinutes: parseInt(sessionTimeoutMinutes, 10) || 30,
      });
      toast.success('Session settings saved');
    } catch (e) {
      toast.error('Failed to save session settings');
    }
  };

  const saveTwoFactor = async () => {
    try {
      await settingsService.patchSettings('security', {
        twoFactorGlobal,
        twoFactorRolePolicy,
      });
      toast.success('2FA settings saved');
    } catch (e) {
      toast.error('Failed to save 2FA settings');
    }
  };

  const confirm2FAToggle = () => {
    setTwoFactorGlobal(pending2FAToggle);
    setShow2FAConfirm(false);
  };

  const handle2FAToggleClick = (checked: boolean) => {
    setPending2FAToggle(checked);
    setShow2FAConfirm(true);
  };

  const handleRolePolicyChange = (roleId: string, value: 'optional' | 'required') => {
    setTwoFactorRolePolicy(prev => ({ ...prev, [roleId]: value }));
  };

  // Basic IP Validation: either IPv4 or IPv6 simplistic check
  const validateIp = (ip: string) => {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
    const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/; // extremely basic
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'localhost';
  };

  const addIp = () => {
    if (!validateIp(newIp)) {
      setIpError(true);
      return;
    }
    setIpError(false);
    if (!ipWhitelist.includes(newIp)) {
      setIpWhitelist(prev => [...prev, newIp]);
    }
    setNewIp('');
  };

  const removeIp = (ipToRemove: string) => {
    setIpWhitelist(prev => prev.filter(ip => ip !== ipToRemove));
  };

  const saveIpWhitelist = async () => {
    try {
      await settingsService.patchSettings('security', {
        ipWhitelist,
      });
      toast.success('IP Whitelist saved');
    } catch (e) {
      toast.error('Failed to save IP Whitelist');
    }
  };

  const saveLoginAttempts = async () => {
    let finalAttempts = typeof maxLoginAttempts === 'number' ? maxLoginAttempts : 5;
    if (isNaN(finalAttempts) || finalAttempts < 1) finalAttempts = 1;
    if (finalAttempts > 20) finalAttempts = 20;

    try {
      await settingsService.patchSettings('security', {
        maxLoginAttempts: finalAttempts,
        lockoutDurationMinutes: parseInt(lockoutDurationMinutes, 10) || 15,
      });
      setMaxLoginAttempts(finalAttempts);
      toast.success('Login attempts settings saved');
    } catch (e) {
      toast.error('Failed to save login attempts settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <CardDescription>Configure password requirements for all users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Minimum Password Length</Label>
              <span className="font-medium text-sm w-8 text-right">{passwordMinLength}</span>
            </div>
            <Slider
              value={[passwordMinLength]}
              onValueChange={(val) => setPasswordMinLength(val[0])}
              min={6}
              max={32}
              step={1}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="requireUppercase" checked={requireUppercase} onCheckedChange={(v) => setRequireUppercase(!!v)} />
              <Label htmlFor="requireUppercase" className="font-normal">Require Uppercase Letters</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="requireNumbers" checked={requireNumbers} onCheckedChange={(v) => setRequireNumbers(!!v)} />
              <Label htmlFor="requireNumbers" className="font-normal">Require Numbers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="requireSymbols" checked={requireSymbols} onCheckedChange={(v) => setRequireSymbols(!!v)} />
              <Label htmlFor="requireSymbols" className="font-normal">Require Symbols</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={savePasswordPolicy}>Save Requirements</Button>
        </CardFooter>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Control user session expiration and limits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-sm">
            <Label>Idle Timeout</Label>
            <Select value={sessionTimeoutMinutes} onValueChange={setSessionTimeoutMinutes}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveSession}>Save Session Rules</Button>
        </CardFooter>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>Manage multi-factor authentication requirements globally and per-role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Require 2FA Globally</Label>
              <p className="text-sm text-muted-foreground">Enforces 2FA for every user regardless of role.</p>
            </div>
            <Switch checked={twoFactorGlobal} onCheckedChange={handle2FAToggleClick} />
          </div>

          <div className={`space-y-4 ${twoFactorGlobal ? 'opacity-50 pointer-events-none' : ''}`}>
            <Label className="text-base">Per-Role 2FA Policy</Label>
            <p className="text-sm text-muted-foreground mb-4">Set 2FA requirements for specific roles. Global requirement overrides these settings.</p>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {roles.map(role => (
                <div key={role.id} className="space-y-2">
                  <Label className="text-sm">{role.name}</Label>
                  <Select 
                    value={twoFactorRolePolicy[role.id] || 'optional'} 
                    onValueChange={(val: 'optional' | 'required') => handleRolePolicyChange(role.id, val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="optional">Optional</SelectItem>
                      <SelectItem value="required">Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveTwoFactor}>Save 2FA Policy</Button>
        </CardFooter>
      </Card>

      <AlertDialog open={show2FAConfirm} onOpenChange={setShow2FAConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Global 2FA Change</AlertDialogTitle>
            <AlertDialogDescription>
              Changing global 2FA will affect all users. {pending2FAToggle ? 'All users will be required to configure 2FA on their next login if they haven\'t already.' : 'Users will no longer be forced to use 2FA unless their role requires it.'} Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm2FAToggle}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle>IP Whitelisting</CardTitle>
          <CardDescription>Restrict access to the application to specific IP addresses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input 
                placeholder="e.g. 192.168.1.100" 
                value={newIp} 
                onChange={e => setNewIp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addIp()}
                className={ipError ? 'border-destructive' : ''}
              />
              {ipError && <p className="text-xs text-destructive">Please enter a valid IPv4 or IPv6 address.</p>}
            </div>
            <Button variant="secondary" onClick={addIp}>Add IP</Button>
          </div>

          {ipWhitelist.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4">
              {ipWhitelist.map(ip => (
                <Badge key={ip} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1 text-sm bg-muted">
                  {ip}
                  <button onClick={() => removeIp(ip)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No IP addresses whitelisted. Access is allowed from any IP.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={saveIpWhitelist}>Save Whitelist</Button>
        </CardFooter>
      </Card>

      {/* Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Login Protection</CardTitle>
          <CardDescription>Protect against brute-force attacks by limiting login attempts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-2">
              <Label>Max Failed Attempts</Label>
              <Input 
                type="number" 
                min={1} 
                max={20} 
                value={maxLoginAttempts} 
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setMaxLoginAttempts(isNaN(val) ? '' : val);
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label>Lockout Duration</Label>
              <Select value={lockoutDurationMinutes} onValueChange={setLockoutDurationMinutes}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="0">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveLoginAttempts}>Save Protection Rules</Button>
        </CardFooter>
      </Card>

    </div>
  );
}
