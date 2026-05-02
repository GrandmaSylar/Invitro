import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '../../app/components/ui/button';

export interface ReceiptData {
  labNumber: string;
  patientName: string;
  tests: { testName: string; testCost: number }[];
  totalCost: number;
  amountPaid: number;
  arrears: number;
  recordDate: string;
}

interface ReceiptPreviewProps {
  recordData: ReceiptData;
  onClose?: () => void;
}

export function ReceiptPreview({ recordData, onClose }: ReceiptPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-end w-full max-w-md mb-4 print:hidden gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} className="mr-2" />
          Print Receipt
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Back
          </Button>
        )}
      </div>

      <div id="printable-receipt" className="w-full max-w-md p-6 bg-white border rounded-lg shadow-sm text-black">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Bloo LIMS Clinic</h2>
          <p className="text-sm text-gray-500">123 Health Ave, Medical City</p>
          <p className="text-sm text-gray-500">Phone: +1 234 567 890</p>
        </div>

        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span className="font-medium text-gray-600">Date:</span>
            <span>{new Date(recordData.recordDate).toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-1 text-sm">
            <span className="font-medium text-gray-600">Lab Number:</span>
            <span className="font-bold">{recordData.labNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-600">Patient Name:</span>
            <span className="font-semibold">{recordData.patientName}</span>
          </div>
        </div>

        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Test Name</th>
                <th className="text-right py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {recordData.tests.map((test, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-2">{test.testName}</td>
                  <td className="py-2 text-right">₵{test.testCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Cost:</span>
            <span className="font-semibold">₵{recordData.totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold text-green-600">₵{recordData.amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-dashed">
            <span>Balance Due:</span>
            <span className={recordData.arrears > 0 ? "text-red-600" : ""}>
              ₵{recordData.arrears.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Thank you for choosing Bloo LIMS.</p>
          <p>Wishing you good health!</p>
        </div>
      </div>
    </div>
  );
}
