import React from 'react';
import { TestItem } from '../../lib/types';
import { Card } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { Separator } from '../../app/components/ui/separator';

interface PaymentPanelProps {
  tests: TestItem[];
  amountPaid: number;
  onAmountPaidChange: (n: number) => void;
  existingSubtotal?: number;
  disabled?: boolean;
}

export function PaymentPanel({
  tests,
  amountPaid,
  onAmountPaidChange,
  existingSubtotal = 0,
  disabled = false,
}: PaymentPanelProps) {
  const subtotal = tests.reduce((sum, t) => sum + (t.testCost || 0), 0);
  const totalCost = existingSubtotal + subtotal;
  const arrears = Math.max(0, totalCost - amountPaid);

  return (
    <Card className="p-4 sticky top-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₵{subtotal.toFixed(2)}</span>
        </div>
        
        {existingSubtotal > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Existing Subtotal</span>
            <span>₵{existingSubtotal.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center font-medium">
          <span>Total Cost</span>
          <span>₵{totalCost.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Amount Paid</span>
          <div className="w-32">
            <Input
              type="number"
              min="0"
              value={amountPaid}
              onChange={(e) => onAmountPaidChange(parseFloat(e.target.value) || 0)}
              className="text-right"
              disabled={disabled}
            />
          </div>
        </div>

        <div
          className={`flex justify-between items-center p-2 rounded-md font-medium ${
            arrears > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}
        >
          <span>Arrears</span>
          <span>
            ₵{arrears.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}
