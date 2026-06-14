import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../app/components/ui/card';
import { Label } from '../../app/components/ui/label';
import { Button } from '../../app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Input } from '../../app/components/ui/input';
import { Switch } from '../../app/components/ui/switch';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { settingsService } from '../../services/settingsService';
import { toast } from 'sonner';
import { ReceiptPreview } from '../patients/ReceiptPreview';
import { Slider } from '../../app/components/ui/slider';

const mockPreviewData = {
  labNumber: 'L-2026-9041',
  patientName: 'Benjamin Asare',
  tests: [
    { testName: 'Liver Function Test', testCost: 80.00, testCode: 'LFT-001' },
    { testName: 'Full Blood Count', testCost: 120.00, testCode: 'FBC-001' }
  ],
  totalCost: 200.00,
  amountPaid: 200.00,
  arrears: 0.00,
  recordDate: new Date().toISOString(),
  receiptNumber: 'RCPT-20260614-0003',
  paymentAmount: 200.00,
  paymentDate: new Date().toISOString()
};

export default function ReceiptSection() {
  const { settings } = useSettingsStore();

  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'pos80mm' | 'pos50mm'>(
    settings.receipt?.paperSize || 'A4'
  );
  const [scale, setScale] = useState<number>(settings.receipt?.scale || 1.0);
  const [showLogo, setShowLogo] = useState<boolean>(
    settings.receipt?.showLogo !== undefined ? settings.receipt.showLogo : true
  );
  const [showWatermark, setShowWatermark] = useState<boolean>(
    settings.receipt?.showWatermark !== undefined ? settings.receipt.showWatermark : true
  );
  const [footerText, setFooterText] = useState<string>(
    settings.receipt?.footerText || 'This is an official receipt. Please retain for your records.'
  );

  const [isSaving, setIsSaving] = useState(false);

  // Sync state if store updates externally
  useEffect(() => {
    if (settings.receipt) {
      setPaperSize(settings.receipt.paperSize || 'A4');
      setScale(settings.receipt.scale || 1.0);
      setShowLogo(settings.receipt.showLogo !== undefined ? settings.receipt.showLogo : true);
      setShowWatermark(settings.receipt.showWatermark !== undefined ? settings.receipt.showWatermark : true);
      setFooterText(settings.receipt.footerText || 'This is an official receipt. Please retain for your records.');
    }
  }, [settings.receipt]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await settingsService.updateSettings('receipt', {
        paperSize,
        scale,
        showLogo,
        showWatermark,
        footerText,
      });
      toast.success('Receipt settings saved successfully');
    } catch (e: any) {
      toast.error(`Failed to save settings: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Settings Form Column */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">Receipt Paper & Format</CardTitle>
            <CardDescription>Configure receipt template styling and physical paper format sizes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paper Size selector */}
            <div className="space-y-2">
              <Label htmlFor="paper-size" className="font-semibold text-foreground/90">Paper Template Size</Label>
              <Select 
                value={paperSize} 
                onValueChange={(val: 'A4' | 'A5' | 'pos80mm' | 'pos50mm') => setPaperSize(val)}
              >
                <SelectTrigger id="paper-size" className="w-full">
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 Desktop (210mm x 297mm)</SelectItem>
                  <SelectItem value="A5">A5 Medium (148mm x 210mm)</SelectItem>
                  <SelectItem value="pos80mm">POS Thermal 80mm Printer</SelectItem>
                  <SelectItem value="pos50mm">POS Thermal 50mm Printer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Select A4/A5 for regular document printers, or POS sizes for thermal receipt rolls.</p>
            </div>

            {/* Template Scale */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="scale-factor" className="font-semibold text-foreground/90">Template Scale Percentage</Label>
                <span className="text-sm font-mono font-bold bg-[#0d4d5c]/10 text-[#0d4d5c] px-2 py-0.5 rounded">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="scale-factor"
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  value={[scale]}
                  onValueChange={(val) => setScale(val[0])}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Adjust scale if receipt content needs to shrink or enlarge to fit perfectly.</p>
            </div>

            {/* Layout Options */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="show-logo" className="font-semibold text-foreground/90">Include Brand Logo</Label>
                  <p className="text-xs text-muted-foreground">Include the clinic branding logo in the receipt header block.</p>
                </div>
                <Switch
                  id="show-logo"
                  checked={showLogo}
                  onCheckedChange={setShowLogo}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="show-watermark" className="font-semibold text-foreground/90">Show Status Watermark</Label>
                  <p className="text-xs text-muted-foreground">Draw a faint diagonal "PAID" background watermark across the receipt.</p>
                </div>
                <Switch
                  id="show-watermark"
                  checked={showWatermark}
                  onCheckedChange={setShowWatermark}
                />
              </div>
            </div>

            {/* Custom Footer */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              <Label htmlFor="footer-text" className="font-semibold text-foreground/90">Custom Footer Disclaimer</Label>
              <Input
                id="footer-text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g., Thank you for your payment."
              />
              <p className="text-xs text-muted-foreground">This line is displayed at the bottom of all generated receipts.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-border/30 pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-[#0d4d5c] hover:bg-[#08343e] text-white"
            >
              {isSaving ? 'Saving Changes...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="w-full text-left mb-2 pl-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live Template Preview
          </h3>
          <p className="text-xs text-muted-foreground">This simulates how the receipt renders under your active config.</p>
        </div>
        <div className="w-full max-w-full overflow-auto bg-slate-100 dark:bg-slate-950/40 border border-dashed border-border p-8 rounded-lg flex items-start justify-center h-[650px] relative shadow-inner">
          <div className="shrink-0 origin-top">
            <ReceiptPreview
              recordData={mockPreviewData}
              overrideSettings={{
                paperSize,
                scale,
                showLogo,
                showWatermark,
                footerText
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
