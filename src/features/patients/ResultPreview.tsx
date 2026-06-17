/**
 * ResultPreview — Professional lab test result report with selective print.
 *
 * Displays submitted/historical test results in a clean, print-ready format.
 * Results are grouped by parent test. Users can toggle individual tests
 * on/off for selective printing.
 */
import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  ArrowLeft,
  Download,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Checkbox } from "../../app/components/ui/checkbox";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { toast } from "sonner";
import type { TestResult, LabRecord } from "../../lib/types";

// ── Types ──────────────────────────────────────────────────────

export interface ResultPreviewProps {
  /** The lab record being previewed */
  record: LabRecord;
  /** All test results for this record */
  results: TestResult[];
  /** Called when user wants to leave the preview */
  onClose: () => void;
  /** Label for the back button (defaults to "Back") */
  backLabel?: string;
  /** If true, show a compact inline version (no full-page wrapper) */
  inline?: boolean;
}

interface GroupedTest {
  parentTestName: string;
  department: string;
  rows: TestResult[];
}

// ── Helpers ────────────────────────────────────────────────────

function groupResultsByTest(results: TestResult[]): GroupedTest[] {
  const map = new Map<string, GroupedTest>();

  for (const r of results) {
    // Group by labRecordTestId to keep results from the same ordered test together
    const key = r.labRecordTestId;
    if (!map.has(key)) {
      map.set(key, {
        parentTestName: r.parentTestName || r.testName,
        department: r.department,
        rows: [],
      });
    }
    map.get(key)!.rows.push(r);
  }

  return Array.from(map.values());
}

function buildFileName(record: LabRecord): string {
  const patientNameClean = (record.patient?.patientName || "Patient").replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
  const labNoClean = record.labNumber.replace(/[^a-zA-Z0-9-]/g, '');
  return `Results_${patientNameClean}_${labNoClean}`;
}

// ── Component ──────────────────────────────────────────────────

export function ResultPreview({
  record,
  results,
  onClose,
  backLabel = "Back",
  inline = false,
}: ResultPreviewProps) {
  const grouped = useMemo(() => groupResultsByTest(results), [results]);
  const allTestIds = useMemo(
    () => grouped.map((_, i) => i),
    [grouped]
  );

  // Track which tests are selected for printing
  const [selectedTests, setSelectedTests] = useState<Set<number>>(
    () => new Set(allTestIds)
  );
  const [showSelector, setShowSelector] = useState(false);
  const { settings } = useSettingsStore();

  const receiptConfig = settings.receipt || {
    paperSize: 'A4',
    scale: 1.0,
    showLogo: true,
    showWatermark: true,
    footerText: '',
  };

  const { appName, address, phone, logoUrl } = settings.general;
  const { paperSize, scale, showLogo, showWatermark } = receiptConfig;

  // Lab reports are not printed on POS rolls; fallback to A4
  const reportPaperSize = (paperSize === 'pos80mm' || paperSize === 'pos50mm') ? 'A4' : paperSize;

  const patient = record.patient;

  const toggleTest = (index: number) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTests.size === allTestIds.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(allTestIds));
    }
  };

  const selectedGroups = grouped.filter((_, i) => selectedTests.has(i));
  const hasAnyAbnormal = results.some(
    (r) => r.flag === "Abnormal" || r.flag === "Critical"
  );

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

  const scaledStyle: React.CSSProperties = {
    zoom: scale,
    fontSize: reportPaperSize === 'A5' ? '12px' : '14px',
  };

  if (results.length === 0) {
    return (
      <div className={inline ? "" : "space-y-6"}>
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground no-print"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Button>
        <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
          <FileText
            className="mx-auto mb-3 text-muted-foreground/60"
            size={40}
          />
          <p className="text-sm font-medium">No results available yet</p>
          <p className="text-xs mt-1">
            Results will appear here after they have been entered in the Results
            Entry tab.
          </p>
        </div>
      </div>
    );
  }

  const renderResultsContent = (isPrintVersion: boolean) => (
    <div
      id={isPrintVersion ? "printable-results" : undefined}
      className={`receipt-container receipt-size-${reportPaperSize} bg-white text-[#1a1a2e] ${
        isPrintVersion
          ? 'print-only'
          : 'shadow-md border border-gray-200 rounded-lg p-6 max-w-[800px] w-full'
      }`}
      style={scaledStyle}
    >
      {/* Diagonal Watermark (OFFICIAL) */}
      {showWatermark && (
        <div className="receipt-watermark-container">
          <span
            className="receipt-watermark-text"
            style={{
              fontSize: reportPaperSize === 'A5' ? '4.5rem' : '8rem',
              opacity: 0.05
            }}
          >
            OFFICIAL
          </span>
        </div>
      )}

      <div className="relative z-10">
        {/* Header Banner Block - matching PDF template style */}
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
              LABORATORY REPORT
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-[#cce4ec]">
            <div className="space-y-1">
              <p>{address || 'Ashongman Estates, Accra, Ghana'}</p>
              <p>Tel: {phone || '+233 204 906 780'}</p>
            </div>
            <div className="sm:text-right space-y-1">
              <p className="font-semibold text-white">
                Lab Number: <span className="font-mono text-sm tracking-wider">{record.labNumber}</span>
              </p>
              <p>Report Date: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Patient Details Section */}
        <div className="bg-[#e8f5f7] border border-[#a0d8e0]/20 rounded-lg p-4 mb-6">
          <h2 className="text-[#1a7a8a] text-xs font-bold uppercase tracking-wider border-b border-[#1a7a8a]/20 pb-1 mb-3">
            PATIENT INFORMATION
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <span className="block text-[10px] text-[#718096] uppercase font-medium">PATIENT NAME</span>
              <span className="font-bold text-[#1a1a2e]">{patient?.patientName || "Unknown"}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#718096] uppercase font-medium">LAB NUMBER</span>
              <span className="font-mono font-bold text-[#1a1a2e]">{record.labNumber}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#718096] uppercase font-medium">GENDER / AGE</span>
              <span className="font-semibold text-[#1a1a2e]">
                {patient?.gender || "—"}{" "}
                {patient?.age ? `/ ${patient.age} yrs` : ""}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#718096] uppercase font-medium">RECORD DATE</span>
              <span className="font-semibold text-[#1a1a2e]">
                {new Date(record.recordDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="space-y-6">
          {selectedGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tests selected for preview. Use the selector above to choose tests.
            </div>
          ) : (
            selectedGroups.map((group, gi) => (
              <div
                key={gi}
                className="border border-[#a0d8e0]/30 rounded-xl overflow-hidden mb-6"
              >
                {/* Test Group Header */}
                <div className="bg-[#0d4d5c] text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    {group.parentTestName}
                  </h3>
                  <span className="text-[10px] font-bold tracking-widest text-[#a0d8e0] uppercase">
                    {group.department}
                  </span>
                </div>

                {/* Results Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#e8f5f7] text-[#1a7a8a] text-[10px] uppercase font-bold tracking-wider border-b border-[#a0d8e0]/40">
                      <th className="text-left py-2.5 px-3">PARAMETER</th>
                      <th className="text-left py-2.5 px-3">RESULT</th>
                      <th className="text-left py-2.5 px-3">UNIT</th>
                      <th className="text-left py-2.5 px-3">REFERENCE RANGE</th>
                      <th className="text-left py-2.5 px-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, ri) => (
                      <tr
                        key={row.id || ri}
                        className="border-b border-[#a0d8e0]/20 relative bg-[#f0fafb]/40 last:border-b-0"
                      >
                        <td className="py-2.5 px-3 font-semibold text-sm relative">
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00b4cc]" />
                          {row.testName}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-sm font-bold font-mono ${
                            row.flag === "Normal"
                              ? "text-emerald-700"
                              : row.flag === "Abnormal"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {row.result || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500">
                          {row.unit || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 font-mono">
                          {row.referenceRange || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              row.flag === "Normal"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : row.flag === "Abnormal"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {row.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}

          {/* Alert for Abnormal/Critical Values */}
          {hasAnyAbnormal && selectedGroups.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
              <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Abnormal / Critical values detected
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  One or more test results fall outside the normal reference range. Please correlate clinically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Report Footer */}
        <div className="mt-8 text-center text-gray-500 text-xs border-t border-[#a0d8e0]/40 pt-4 space-y-1">
          <p>This is a computer-generated diagnostic report. Please correlate clinically.</p>
          <div className="flex justify-between text-[9px] text-gray-400 pt-4">
            <span>Generated: {new Date().toLocaleString()}</span>
            <span>Page 1 of 1</span>
          </div>
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
              reportPaperSize === 'A4' ? 'A4 portrait' : 'A5 portrait'
            };
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}} />

      {/* Action Buttons (Hidden when printing) */}
      {!inline && (
        <ActionButtons
          record={record}
          reportPaperSize={reportPaperSize}
          selectedCount={selectedTests.size}
          totalCount={allTestIds.length}
          onClose={onClose}
          backLabel={backLabel}
          showSelector={showSelector}
          setShowSelector={setShowSelector}
          toggleAll={toggleAll}
          selectedTests={selectedTests}
          allTestIds={allTestIds}
        />
      )}

      {/* Test Selector Panel — hidden during print */}
      {showSelector && !inline && (
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm w-full max-w-[800px] mb-4 print:hidden">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
            <h4 className="text-sm font-semibold text-foreground">
              Select tests for preview / print
            </h4>
            <button
              onClick={toggleAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              {selectedTests.size === allTestIds.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {grouped.map((group, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTests.has(i)
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/30 border border-transparent hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={selectedTests.has(i)}
                  onCheckedChange={() => toggleTest(i)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {group.parentTestName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.department} · {group.rows.length}{" "}
                    {group.rows.length === 1 ? "parameter" : "parameters"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* On-screen Preview */}
      {renderResultsContent(false)}

      {/* Print-only Portal */}
      {createPortal(
        renderResultsContent(true),
        document.body
      )}
    </div>
  );
}

/** Action buttons extracted to a sub-component for state isolation */
function ActionButtons({
  record,
  reportPaperSize,
  selectedCount,
  totalCount,
  onClose,
  backLabel,
  showSelector,
  setShowSelector,
  toggleAll,
  selectedTests,
  allTestIds
}: {
  record: LabRecord;
  reportPaperSize: string;
  selectedCount: number;
  totalCount: number;
  onClose: () => void;
  backLabel: string;
  showSelector: boolean;
  setShowSelector: (val: boolean) => void;
  toggleAll: () => void;
  selectedTests: Set<number>;
  allTestIds: number[];
}) {
  const [exporting, setExporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const isElectron = !!window.electronAPI;

  const handleExportPDF = async () => {
    const fileTitle = buildFileName(record);

    if (isElectron) {
      setExporting(true);
      try {
        const result = await window.electronAPI!.exportPDF({ title: fileTitle, paperSize: reportPaperSize });
        if (result.success) {
          toast.success('Report saved successfully', { description: result.filePath });
        } else if (result.error !== 'Cancelled') {
          toast.error(`Failed to save: ${result.error}`);
        }
      } catch (err: any) {
        toast.error(`Export error: ${err.message}`);
      } finally {
        setExporting(false);
      }
    } else {
      const oldTitle = document.title;
      document.title = fileTitle;
      window.print();
      setTimeout(() => { document.title = oldTitle; }, 1000);
    }
  };

  const handlePreviewPDF = async () => {
    const fileTitle = buildFileName(record);

    if (isElectron) {
      setPreviewing(true);
      try {
        const result = await window.electronAPI!.previewPDF({ title: fileTitle, paperSize: reportPaperSize });
        if (!result.success) {
          toast.error(`Preview failed: ${result.error}`);
        }
      } catch (err: any) {
        toast.error(`Preview error: ${err.message}`);
      } finally {
        setPreviewing(false);
      }
    } else {
      const oldTitle = document.title;
      document.title = fileTitle;
      window.print();
      setTimeout(() => { document.title = oldTitle; }, 1000);
    }
  };

  return (
    <div className="flex justify-between w-full max-w-[800px] mb-4 print:hidden gap-2">
      {onClose && (
        <Button variant="outline" onClick={onClose} className="flex items-center gap-1">
          <ArrowLeft size={16} />
          {backLabel}
        </Button>
      )}
      <div className="flex-1" />
      <Button
        variant="outline"
        onClick={() => setShowSelector(!showSelector)}
        className="flex items-center gap-1.5"
      >
        {showSelector ? <EyeOff size={16} /> : <Eye size={16} />}
        {showSelector ? "Hide Selector" : "Select Tests"}
      </Button>
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
