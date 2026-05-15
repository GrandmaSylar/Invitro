import React, { useEffect, useMemo } from 'react';
import { TestItem } from '../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Separator } from '../../app/components/ui/separator';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { CheckCircle2, AlertCircle, CreditCard, Receipt } from 'lucide-react';
import { cn } from '../../app/components/ui/utils';
import { Badge } from '../../app/components/ui/badge';

interface PaymentPanelProps {
  tests: TestItem[];
  amountPaid: number;
  onAmountPaidChange: (n: number) => void;
  existingSubtotal?: number;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  title?: string;
  className?: string;
}

export function PaymentPanel({
  tests,
  amountPaid,
  onAmountPaidChange,
  existingSubtotal = 0,
  disabled = false,
  onValidationChange,
  title = "Payment Summary",
  className,
}: PaymentPanelProps) {
  const { settings } = useSettingsStore();
  
  const subtotal = tests.reduce((sum, t) => sum + (t.testCost || 0), 0);
  const totalCost = existingSubtotal + subtotal;
  const arrears = Math.max(0, totalCost - amountPaid);

  const thresholdType = settings.general.paymentThresholdType || 'none';
  const thresholdValue = settings.general.paymentThresholdValue || 0;

  const requiredAmount = useMemo(() => {
    if (thresholdType === 'percentage') {
      return (totalCost * thresholdValue) / 100;
    } else if (thresholdType === 'amount') {
      return Math.min(thresholdValue, totalCost); // Can't require more than total
    }
    return 0;
  }, [thresholdType, thresholdValue, totalCost]);

  const isValid = amountPaid >= requiredAmount || totalCost === 0;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  return (
    <Card className={cn("shadow-md border-primary/10 overflow-hidden group", className)}>
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-teal-400" />
      <CardHeader className="pb-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Receipt className="text-primary h-5 w-5" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        
        {/* Breakdown Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Tests Subtotal</span>
            <span className="font-medium text-foreground">₵{subtotal.toFixed(2)}</span>
          </div>
          
          {existingSubtotal > 0 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Existing Balance</span>
              <span className="font-medium text-foreground">₵{existingSubtotal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold">Total Cost</span>
            <span className="text-xl font-bold tracking-tight text-primary">₵{totalCost.toFixed(2)}</span>
          </div>
        </div>

        <Separator className="bg-primary/10" />

        {/* Input Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-muted-foreground" /> 
                Amount Paid
              </span>
              {requiredAmount > 0 && (
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Min. required: ₵{requiredAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="relative w-36 group-focus-within:scale-[1.02] transition-transform duration-200">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₵</span>
              <Input
                type="number"
                min="0"
                value={amountPaid === 0 && totalCost === 0 ? '' : amountPaid}
                onChange={(e) => onAmountPaidChange(parseFloat(e.target.value) || 0)}
                className="pl-7 text-right font-semibold text-lg h-12 shadow-sm border-primary/20 focus-visible:ring-primary/30"
                disabled={disabled || totalCost === 0}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Threshold Status & Arrears */}
        <div className="space-y-3 pt-2">
          <div
            className={cn(
              "flex justify-between items-center p-3 rounded-xl transition-all duration-300",
              arrears > 0 
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50' 
                : 'bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50'
            )}
          >
            <span className={cn("text-sm font-semibold", arrears > 0 ? "text-amber-700 dark:text-amber-500" : "text-green-700 dark:text-green-500")}>
              Remaining Arrears
            </span>
            <span className={cn("font-bold text-lg", arrears > 0 ? "text-amber-700 dark:text-amber-500" : "text-green-700 dark:text-green-500")}>
              ₵{arrears.toFixed(2)}
            </span>
          </div>

          {/* Validation Feedback */}
          {totalCost > 0 && requiredAmount > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {isValid ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-medium bg-green-50 dark:bg-green-500/10 p-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Payment threshold met</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/10 p-2 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>Please pay at least ₵{requiredAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
