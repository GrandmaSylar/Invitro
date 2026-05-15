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
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function GeneralSection() {
  const { settings } = useSettingsStore();
  const { setTheme } = useTheme();

  // Local state for Card 1 - App Identity
  const [appName, setAppName] = useState(settings.general.appName);
  const [shortName, setShortName] = useState(settings.general.shortName || '');
  const [logoUrl, setLogoUrl] = useState(settings.general.logoUrl || '');
  const [address, setAddress] = useState(settings.general.address || '');
  const [phone, setPhone] = useState(settings.general.phone || '');
  const [email, setEmail] = useState(settings.general.email || '');
  const [themeValue, setThemeValue] = useState(settings.general.theme);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Local state for Card 2 - Regional
  const [language, setLanguage] = useState(settings.general.language);
  const [timezone, setTimezone] = useState(settings.general.timezone);
  const [dateFormat, setDateFormat] = useState(settings.general.dateFormat);
  const [timeFormat, setTimeFormat] = useState(settings.general.timeFormat);

  // Local state for Card 3 - Payments
  const [paymentThresholdType, setPaymentThresholdType] = useState<'amount' | 'percentage' | 'none'>(settings.general.paymentThresholdType || 'none');
  const [paymentThresholdValue, setPaymentThresholdValue] = useState<number>(settings.general.paymentThresholdValue || 0);

  // Validation state
  const [appNameError, setAppNameError] = useState(false);

  // Sync state if store updates externally
  useEffect(() => {
    setAppName(settings.general.appName);
    setShortName(settings.general.shortName || '');
    setLogoUrl(settings.general.logoUrl || '');
    setAddress(settings.general.address || '');
    setPhone(settings.general.phone || '');
    setEmail(settings.general.email || '');
    setThemeValue(settings.general.theme);
    setLanguage(settings.general.language);
    setTimezone(settings.general.timezone);
    setDateFormat(settings.general.dateFormat);
    setTimeFormat(settings.general.timeFormat);
    setPaymentThresholdType(settings.general.paymentThresholdType || 'none');
    setPaymentThresholdValue(settings.general.paymentThresholdValue || 0);
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
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        theme: themeValue as 'system' | 'light' | 'dark',
      });
      toast.success('Identity settings saved successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }

    try {
      setUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      
      setLogoUrl(data.publicUrl);
      toast.success('Logo uploaded successfully. Remember to click "Save Changes".');
    } catch (error: any) {
      toast.error(`Error uploading logo: ${error.message}`);
    } finally {
      setUploadingLogo(false);
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

  const handleSavePayments = async () => {
    try {
      await settingsService.patchSettings('general', {
        paymentThresholdType,
        paymentThresholdValue,
      });
      toast.success('Payment settings saved successfully');
    } catch (e) {
      toast.error('Failed to save payment settings');
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Application Logo (Max 5MB)</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-muted/30 border border-border/50 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="text-muted-foreground/50" size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <Label 
                    htmlFor="logo-upload" 
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    {uploadingLogo ? <Loader2 className="animate-spin mr-2" size={16} /> : <Upload className="mr-2" size={16} />}
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">Accepted formats: JPG, PNG, GIF, SVG, WEBP.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g. 123 Health Ave, Medical City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. +1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. contact@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure payment thresholds for test registration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Threshold Type</Label>
              <Select value={paymentThresholdType} onValueChange={(val: any) => setPaymentThresholdType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="amount">Flat Amount (₵)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {paymentThresholdType !== 'none' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>{paymentThresholdType === 'percentage' ? 'Percentage (%)' : 'Amount (₵)'}</Label>
                <Input
                  type="number"
                  min="0"
                  max={paymentThresholdType === 'percentage' ? "100" : undefined}
                  value={paymentThresholdValue}
                  onChange={(e) => setPaymentThresholdValue(parseFloat(e.target.value) || 0)}
                  placeholder={paymentThresholdType === 'percentage' ? "e.g. 50" : "e.g. 100"}
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePayments}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
