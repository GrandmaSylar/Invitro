import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Button } from '../../app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { settingsService } from '../../services/settingsService';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function GeneralSection() {
  const { settings } = useSettingsStore();
  const { setTheme } = useTheme();

  // Local state for Card 1 - App Identity
  const [appName, setAppName] = useState(settings.general.appName);
  const [shortName, setShortName] = useState(settings.general.shortName || '');
  const [logoUrl, setLogoUrl] = useState(settings.general.logoUrl || '');
  const [themeValue, setThemeValue] = useState(settings.general.theme);

  // Local state for Card 2 - Regional
  const [language, setLanguage] = useState(settings.general.language);
  const [timezone, setTimezone] = useState(settings.general.timezone);
  const [dateFormat, setDateFormat] = useState(settings.general.dateFormat);
  const [timeFormat, setTimeFormat] = useState(settings.general.timeFormat);

  // Validation state
  const [appNameError, setAppNameError] = useState(false);

  // Sync state if store updates externally
  useEffect(() => {
    setAppName(settings.general.appName);
    setShortName(settings.general.shortName || '');
    setLogoUrl(settings.general.logoUrl || '');
    setThemeValue(settings.general.theme);
    setLanguage(settings.general.language);
    setTimezone(settings.general.timezone);
    setDateFormat(settings.general.dateFormat);
    setTimeFormat(settings.general.timeFormat);
  }, [settings.general]);

  const handleThemeChange = (val: 'system' | 'light' | 'dark') => {
    setThemeValue(val);
    setTheme(val); // apply immediately for preview
  };

  const handleSaveIdentity = async () => {
    if (!appName.trim()) {
      setAppNameError(true);
      return;
    }
    setAppNameError(false);

    try {
      await settingsService.patchSettings('general', {
        appName: appName.trim(),
        shortName: shortName.trim(),
        logoUrl: logoUrl.trim(),
        theme: themeValue as 'system' | 'light' | 'dark',
      });
      toast.success('Identity settings saved successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleSaveRegional = async () => {
    try {
      await settingsService.patchSettings('general', {
        language,
        timezone,
        dateFormat,
        timeFormat,
      });
      toast.success('Regional preferences saved successfully');
    } catch (e) {
      toast.error('Failed to save regional preferences');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Identity</CardTitle>
          <CardDescription>Configure branding and core appearance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className={appNameError ? 'border-destructive' : ''}
              />
              {appNameError && <p className="text-sm text-destructive">App name cannot be empty.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input
                id="shortName"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              placeholder="Upload logo or paste URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={themeValue} onValueChange={(v: 'system' | 'light' | 'dark') => handleThemeChange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveIdentity}>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Preferences</CardTitle>
          <CardDescription>Configure localization settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Africa/Accra">Accra (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HH:mm">24-hour (HH:mm)</SelectItem>
                  <SelectItem value="hh:mm a">12-hour (hh:mm a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveRegional}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
