import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Button } from '../../app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Switch } from '../../app/components/ui/switch';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { settingsService } from '../../services/settingsService';
import { toast } from 'sonner';
import { cn } from '../../app/components/ui/utils';

export default function NotificationsSection() {
  const { settings } = useSettingsStore();

  const [emailEnabled, setEmailEnabled] = useState(settings.notifications.emailEnabled);
  const [emailAddress, setEmailAddress] = useState(settings.notifications.emailAddress || '');
  const [emailFrequency, setEmailFrequency] = useState(settings.notifications.emailFrequency || 'realtime');

  const [smsEnabled, setSmsEnabled] = useState(settings.notifications.smsEnabled);
  const [smsPhone, setSmsPhone] = useState(settings.notifications.smsPhone || '');
  const [smsFrequency, setSmsFrequency] = useState(settings.notifications.smsFrequency || 'realtime');

  const [inAppEnabled, setInAppEnabled] = useState(settings.notifications.inAppEnabled);

  useEffect(() => {
    setEmailEnabled(settings.notifications.emailEnabled);
    setEmailAddress(settings.notifications.emailAddress || '');
    setEmailFrequency(settings.notifications.emailFrequency || 'realtime');

    setSmsEnabled(settings.notifications.smsEnabled);
    setSmsPhone(settings.notifications.smsPhone || '');
    setSmsFrequency(settings.notifications.smsFrequency || 'realtime');

    setInAppEnabled(settings.notifications.inAppEnabled);
  }, [settings.notifications]);

  const handleSave = async () => {
    try {
      await settingsService.updateSettings('notifications', {
        emailEnabled,
        emailAddress,
        emailFrequency: emailFrequency as 'realtime' | 'digest',
        smsEnabled,
        smsPhone,
        smsFrequency: smsFrequency as 'realtime' | 'digest',
        inAppEnabled,
      });
      toast.success('Notification preferences saved successfully');
    } catch (e) {
      toast.error('Failed to save notification preferences');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure how you receive updates and alerts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Email Notifications */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts via email.</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          
          <div className={cn("grid gap-4 overflow-hidden transition-all", emailEnabled ? "mt-4 opacity-100 max-h-[500px]" : "mt-0 opacity-0 max-h-0")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input placeholder="admin@example.com" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={emailFrequency} onValueChange={(val: 'realtime' | 'digest') => setEmailFrequency(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="digest">Daily Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive critical alerts via text message.</p>
            </div>
            <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          </div>
          
          <div className={cn("grid gap-4 overflow-hidden transition-all", smsEnabled ? "mt-4 opacity-100 max-h-[500px]" : "mt-0 opacity-0 max-h-0")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+1 234 567 8900" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={smsFrequency} onValueChange={(val: 'realtime' | 'digest') => setSmsFrequency(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="digest">Daily Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">Show popup notifications within the application.</p>
            </div>
            <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
          </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
