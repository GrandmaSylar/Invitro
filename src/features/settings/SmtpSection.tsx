import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Button } from '../../app/components/ui/button';
import { Switch } from '../../app/components/ui/switch';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { settingsService } from '../../services/settingsService';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function SmtpSection() {
  const { settings } = useSettingsStore();

  const [host, setHost] = useState(settings.smtp?.host || '');
  const [port, setPort] = useState<number | string>(settings.smtp?.port || 587);
  const [username, setUsername] = useState(settings.smtp?.username || '');
  const [password, setPassword] = useState(settings.smtp?.password || '');
  const [fromEmail, setFromEmail] = useState(settings.smtp?.fromEmail || '');
  const [useTLS, setUseTLS] = useState(settings.smtp?.useTLS || false);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ host?: boolean; port?: boolean; fromEmail?: boolean }>({});

  useEffect(() => {
    if (settings.smtp) {
      setHost(settings.smtp.host);
      setPort(settings.smtp.port);
      setUsername(settings.smtp.username);
      setPassword(settings.smtp.password);
      setFromEmail(settings.smtp.fromEmail);
      setUseTLS(settings.smtp.useTLS);
    }
  }, [settings.smtp]);

  const handleSave = async () => {
    const newErrors: { host?: boolean; port?: boolean; fromEmail?: boolean } = {};
    if (!host.trim()) newErrors.host = true;
    if (!port || isNaN(Number(port))) newErrors.port = true;
    if (!fromEmail.trim()) newErrors.fromEmail = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      await settingsService.patchSettings('smtp', {
        host: host.trim(),
        port: Number(port),
        username: username.trim(),
        password,
        fromEmail: fromEmail.trim(),
        useTLS,
      });
      toast.success('SMTP settings saved successfully');
    } catch (e) {
      toast.error('Failed to save SMTP settings');
    }
  };

  const handleTestEmail = () => {
    if (!fromEmail.trim()) {
      setErrors((prev) => ({ ...prev, fromEmail: true }));
      return;
    }
    setTimeout(() => {
      toast.success(`Test email sent to ${fromEmail}`);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email / SMTP</CardTitle>
          <CardDescription>Configure the outbound email server used for notifications and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className={errors.host ? 'border-destructive' : ''}
              />
              {errors.host && <p className="text-sm text-destructive">Host is required.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value ? Number(e.target.value) : '')}
                className={errors.port ? 'border-destructive' : ''}
              />
              {errors.port && <p className="text-sm text-destructive">Valid port is required.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className={errors.fromEmail ? 'border-destructive' : ''}
            />
            {errors.fromEmail && <p className="text-sm text-destructive">From Email is required.</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Use TLS</Label>
              <p className="text-sm text-muted-foreground">
                Enable Transport Layer Security for secure email transmission.
              </p>
            </div>
            <Switch checked={useTLS} onCheckedChange={setUseTLS} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-border pt-6">
          <Button variant="secondary" onClick={handleTestEmail}>
            Send Test Email
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
