import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { toast } from 'sonner';

export interface ReceiptData {
  labNumber: string;
  patientName: string;
  tests: { testName: string; testCost: number; testCode?: string }[];
  totalCost: number;
  amountPaid: number;
  arrears: number;
  recordDate: string;
  receiptNumber?: string;
  paymentAmount?: number;
  paymentDate?: string;
}

interface ReceiptPreviewProps {
  recordData: ReceiptData;
  onClose?: () => void;
  // Optional overrides for settings page live preview:
  overrideSettings?: {
    paperSize: 'A4' | 'A5' | 'pos80mm' | 'pos50mm';
    scale: number;
    showLogo: boolean;
    showWatermark: boolean;
    footerText?: string;
  };
}

export function ReceiptPreview({ recordData, onClose, overrideSettings }: ReceiptPreviewProps) {
  const isPaymentReceipt = !!recordData.receiptNumber;
  const { settings } = useSettingsStore();
  
  // Use overrides if provided (for live preview in settings), otherwise use saved settings
  const receiptConfig = overrideSettings || settings.receipt || {
    paperSize: 'A4',
    scale: 1.0,
    showLogo: true,
    showWatermark: true,
    footerText: 'This is an official receipt. Please retain for your records.',
  };

  const { appName, address, phone, email, logoUrl } = settings.general;
  const { paperSize, scale, showLogo, showWatermark, footerText } = receiptConfig;

  // Determine if it is fully paid
  const isFullyPaid = recordData.arrears <= 0;

  // Format currency helper
  const formatGHS = (amount: number) => `GH₵ ${amount.toFixed(2)}`;

  // Formatting date helper
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Inline styling for scaling
  const scaledStyle: React.CSSProperties = {
    zoom: scale,
    fontSize: paperSize === 'pos50mm' ? '10px' : paperSize === 'pos80mm' ? '12px' : '14px',
  };

  // Sizing utility values
  const isPos = paperSize === 'pos80mm' || paperSize === 'pos50mm';
  const isPos50 = paperSize === 'pos50mm';

  // Sub-render method to guarantee screen preview and print portal layout are identical
  const renderReceiptContent = (isPrintVersion: boolean) => (
    <div 
      id={isPrintVersion ? "printable-receipt" : undefined}
      className={`receipt-container receipt-size-${paperSize} bg-white text-black ${
        isPrintVersion 
          ? 'print-only' 
          : 'shadow-md border border-gray-200 rounded-lg'
      }`}
      style={scaledStyle}
    >
      {/* Diagonal Watermark (PAID / PENDING) */}
      {showWatermark && (
        <div className="receipt-watermark-container">
          <span 
            className="receipt-watermark-text"
            style={{
              fontSize: isPos50 ? '3rem' : isPos ? '4.5rem' : '8rem',
              opacity: 0.06
            }}
          >
            {isFullyPaid ? 'PAID' : 'DUE'}
          </span>
        </div>
      )}

      <div className="relative z-10">
        {/* Header Banner Block - matching PDF template style */}
        {!isPos50 ? (
          <div className="bg-[#0d4d5c] text-white -mx-6 -mt-6 p-6 rounded-t-lg mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2a8a9a]/40 pb-4 mb-4">
              <div>
                {showLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 mb-2 object-contain filter invert brightness-200" />
                ) : (
                  <h1 className="text-3xl font-extrabold tracking-wide text-white">{appName || 'INVITRO'}</h1>
                )}
                <p className="text-[10px] uppercase tracking-widest text-[#a0d8e0] font-semibold mt-1">
                  DIAGNOSTIC LABORATORY SERVICES
                </p>
              </div>
              <div className="bg-[#00b4cc] text-white px-3 py-1.5 rounded text-xs font-extrabold uppercase tracking-wider shadow-sm">
                OFFICIAL RECEIPT
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-[#cce4ec]">
              <div className="space-y-1">
                <p>{address || 'Ashongman Estates, Accra, Ghana'}</p>
                <p>Tel: {phone || '+233 204 906 780'}</p>
                {email && <p>Email: {email}</p>}
              </div>
              <div className="sm:text-right space-y-1">
                {isPaymentReceipt && (
                  <p className="font-semibold text-white">
                    Receipt No: <span className="font-mono text-sm tracking-wider">{recordData.receiptNumber}</span>
                  </p>
                )}
                <p>Date: {formatDate(isPaymentReceipt ? recordData.paymentDate! : recordData.recordDate)}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Tiny POS 50mm Header (Minimalist) */
          <div className="text-center border-b pb-2 mb-3">
            <h1 className="text-sm font-bold uppercase tracking-wider">{appName || 'INVITRO'}</h1>
            <p className="text-[7px] text-gray-500 uppercase tracking-tight">Diag Lab Services</p>
            <p className="text-[8px] text-gray-600 font-mono mt-1">
              {isPaymentReceipt ? `Rcpt: ${recordData.receiptNumber}` : 'LAB RECEIPT'}
            </p>
            <p className="text-[7px] text-gray-400">{formatDate(isPaymentReceipt ? recordData.paymentDate! : recordData.recordDate)}</p>
          </div>
        )}

        {/* Patient Details Section */}
        <div className={`${isPos50 ? 'mb-3' : 'bg-[#e8f5f7] border border-[#a0d8e0]/20 rounded-lg p-4 mb-6'}`}>
          {!isPos50 && (
            <h2 className="text-[#1a7a8a] text-xs font-bold uppercase tracking-wider border-b border-[#1a7a8a]/20 pb-1 mb-3">
              PATIENT INFORMATION
            </h2>
          )}
          <div className={`grid ${isPos ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-x-4 gap-y-2'} text-xs`}>
            <div>
              <span className="block text-[10px] text-[#718096] uppercase font-medium">PATIENT NAME</span>
              <span className="font-bold text-[#1a1a2e]">{recordData.patientName}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#718096] uppercase font-medium">LAB NUMBER</span>
              <span className="font-mono font-bold text-[#1a1a2e]">{recordData.labNumber}</span>
            </div>
            {!isPos50 && (
              <>
                <div>
                  <span className="block text-[10px] text-[#718096] uppercase font-medium">PAYMENT DATE</span>
                  <span className="font-semibold text-[#1a1a2e]">
                    {recordData.paymentDate 
                      ? new Date(recordData.paymentDate).toLocaleDateString() 
                      : new Date(recordData.recordDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#718096] uppercase font-medium">STATUS</span>
                  <span className={`font-bold ${isFullyPaid ? 'text-[#027a48]' : 'text-amber-600'}`}>
                    {isFullyPaid ? 'FULLY PAID' : 'PARTIAL / DUE'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Test Items Table - PDF Template Style */}
        <div className="mb-6">
          {!isPos50 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0d4d5c] text-white text-[10px] uppercase font-bold tracking-wider border-none">
                  <th className="text-left py-2 px-3 rounded-l">TEST DESCRIPTION</th>
                  <th className="text-right py-2 px-3 rounded-r">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {recordData.tests.map((test, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-[#a0d8e0]/20 relative bg-[#f0fafb]/40"
                  >
                    {/* Left vertical border element mimic */}
                    <td className="py-2.5 px-3 font-semibold text-sm">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00b4cc]" />
                      <div>{test.testName}</div>
                      {test.testCode && (
                        <div className="text-[10px] font-normal text-[#718096] mt-0.5">Code: {test.testCode}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-[#1a1a2e]">
                      {formatGHS(test.testCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* POS 50mm Minimal Table */
            <div className="space-y-1.5 border-t border-b py-2 my-2 text-[10px]">
              {recordData.tests.map((test, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="pr-2">
                    <div className="font-semibold">{test.testName}</div>
                  </div>
                  <div className="font-mono whitespace-nowrap">{formatGHS(test.testCost)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals Summary */}
        <div className={`space-y-2 ${isPos50 ? 'text-[10px]' : 'w-full ml-auto max-w-xs pt-4 border-t border-gray-100'}`}>
          <div className="flex justify-between text-xs text-[#718096]">
            <span>Sub Total</span>
            <span className="font-mono font-semibold text-[#1a1a2e]">{formatGHS(recordData.totalCost)}</span>
          </div>
          
          {isPaymentReceipt && recordData.paymentAmount !== undefined ? (
            <>
              <div className="flex justify-between text-xs text-[#027a48] bg-green-50 p-1 rounded">
                <span className="font-medium">Payment Received</span>
                <span className="font-mono font-bold">{formatGHS(recordData.paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#718096]">
                <span>Cumulative Paid</span>
                <span className="font-mono font-semibold text-[#1a1a2e]">{formatGHS(recordData.amountPaid)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-xs text-[#027a48] bg-green-50 p-1 rounded">
              <span className="font-medium">Amount Paid</span>
              <span className="font-mono font-bold">{formatGHS(recordData.amountPaid)}</span>
            </div>
          )}

          {/* BALANCE DUE Box */}
          <div className={`flex justify-between items-center rounded p-2 ${isFullyPaid ? 'bg-[#0d4d5c] text-white' : 'bg-red-50 text-red-900 border border-red-100'}`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider">BALANCE DUE</span>
            <span className="font-mono font-extrabold text-sm">
              {formatGHS(recordData.arrears)}
            </span>
          </div>
        </div>

        {/* Footer Text */}
        <div className={`mt-8 text-center text-[#718096] ${isPos50 ? 'text-[8px] space-y-0.5' : 'text-xs border-t border-[#a0d8e0]/40 pt-4 space-y-1'}`}>
          {footerText && <p>{footerText}</p>}
          <p className="font-medium">Thank you for choosing {appName || 'Invitro'}. Wishing you good health!</p>
          {!isPos50 && (
            <div className="flex justify-between text-[9px] text-[#718096]/60 pt-4">
              <span>Generated: {new Date().toLocaleDateString()}</span>
              <span>Page 1 of 1</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {/* Dynamic @page media override style block for printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${
              paperSize === 'A4' ? 'A4 portrait' :
              paperSize === 'A5' ? 'A5 portrait' :
              paperSize === 'pos80mm' ? '80mm 297mm' :
              '50mm 297mm'
            };
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}} />

      {/* Action Buttons (Hidden when printing) */}
      <ActionButtons
        recordData={recordData}
        paperSize={paperSize}
        onClose={onClose}
      />

      {/* On-screen Preview (Rendered inside the React App root layout) */}
      {renderReceiptContent(false)}

      {/* Print-only Portal (Rendered directly under document.body outside of #root layout) */}
      {createPortal(
        renderReceiptContent(true),
        document.body
      )}
    </div>
  );
}

/** Builds the sanitized default filename from receipt data */
function buildFileName(recordData: ReceiptData): string {
  const patientNameClean = recordData.patientName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
  const receiptNoClean = (recordData.receiptNumber || recordData.labNumber).replace(/[^a-zA-Z0-9-]/g, '');
  return `Receipt_${patientNameClean}_${receiptNoClean}`;
}

/** Action buttons extracted to a sub-component for state isolation */
function ActionButtons({
  recordData,
  paperSize,
  onClose,
}: {
  recordData: ReceiptData;
  paperSize: string;
  onClose?: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const isElectron = !!window.electronAPI;

  const handleExportPDF = async () => {
    const fileTitle = buildFileName(recordData);

    if (isElectron) {
      setExporting(true);
      try {
        const result = await window.electronAPI!.exportPDF({ title: fileTitle, paperSize });
        if (result.success) {
          toast.success('Receipt saved successfully', { description: result.filePath });
        } else if (result.error !== 'Cancelled') {
          toast.error(`Failed to save: ${result.error}`);
        }
      } catch (err: any) {
        toast.error(`Export error: ${err.message}`);
      } finally {
        setExporting(false);
      }
    } else {
      // Browser fallback: trigger print with title
      const oldTitle = document.title;
      document.title = fileTitle;
      window.print();
      setTimeout(() => { document.title = oldTitle; }, 1000);
    }
  };

  const handlePreviewPDF = async () => {
    const fileTitle = buildFileName(recordData);

    if (isElectron) {
      setPreviewing(true);
      try {
        const result = await window.electronAPI!.previewPDF({ title: fileTitle, paperSize });
        if (!result.success) {
          toast.error(`Preview failed: ${result.error}`);
        }
      } catch (err: any) {
        toast.error(`Preview error: ${err.message}`);
      } finally {
        setPreviewing(false);
      }
    } else {
      // Browser fallback
      const oldTitle = document.title;
      document.title = fileTitle;
      window.print();
      setTimeout(() => { document.title = oldTitle; }, 1000);
    }
  };

  return (
    <div className="flex justify-between w-full max-w-md mb-4 print:hidden gap-2">
      {onClose && (
        <Button variant="outline" onClick={onClose} className="flex items-center gap-1">
          <ArrowLeft size={16} />
          Back
        </Button>
      )}
      <div className="flex-1" />
      <Button
        variant="outline"
        onClick={handlePreviewPDF}
        disabled={previewing}
        className="flex items-center gap-1.5"
      >
        {previewing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
        {previewing ? 'Opening...' : 'Print / Preview'}
      </Button>
      <Button
        variant="default"
        onClick={handleExportPDF}
        disabled={exporting}
        className="bg-[#0d4d5c] hover:bg-[#08343e] text-white flex items-center gap-1.5"
      >
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {exporting ? 'Saving...' : 'Download PDF'}
      </Button>
    </div>
  );
}
