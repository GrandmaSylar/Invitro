/**
 * ResultPreview — Professional lab test result report with selective print.
 *
 * Displays submitted/historical test results in a clean, print-ready format.
 * Results are grouped by parent test. Users can toggle individual tests
 * on/off for selective printing.
 */
import React, { useState, useMemo, useRef } from "react";
import {
  Printer,
  ArrowLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Checkbox } from "../../app/components/ui/checkbox";
import { Badge } from "../../app/components/ui/badge";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { TestResult, Patient, LabRecord } from "../../lib/types";

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
        parentTestName: r.department ? r.testName : r.testName,
        department: r.department,
        rows: [],
      });
    }
    map.get(key)!.rows.push(r);
  }

  // If a group has multiple rows, the group name becomes the first row's department context
  // and individual rows are the parameters
  return Array.from(map.values());
}

function getFlagColor(flag: string) {
  switch (flag) {
    case "Abnormal":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/30",
        icon: AlertTriangle,
        label: "Abnormal",
      };
    case "Critical":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/30",
        icon: AlertCircle,
        label: "Critical",
      };
    default:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/30",
        icon: Check,
        label: "Normal",
      };
  }
}

// ── Print Styles ───────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #result-preview-printable,
  #result-preview-printable * { visibility: visible !important; }
  #result-preview-printable {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
    background: white !important;
    color: black !important;
  }
  .no-print { display: none !important; }
  .print-break { page-break-after: always; }

  /* Force colours in print */
  .flag-normal { color: #059669 !important; }
  .flag-abnormal { color: #d97706 !important; }
  .flag-critical { color: #dc2626 !important; }
}
`;

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
  const { appName, address, phone } = settings.general;

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

  const handlePrint = () => {
    window.print();
  };

  const selectedGroups = grouped.filter((_, i) => selectedTests.has(i));
  const hasAnyAbnormal = results.some(
    (r) => r.flag === "Abnormal" || r.flag === "Critical"
  );

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

  return (
    <>
      {/* Inject print styles */}
      <style>{PRINT_STYLES}</style>

      <div className={inline ? "space-y-4" : "space-y-6"}>
        {/* Toolbar — hidden during print */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-2"
            >
              {showSelector ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
              {showSelector ? "Hide Selection" : "Select Tests"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-primary text-primary-foreground shadow-md hover:shadow-lg"
            >
              <Printer size={16} />
              Print{" "}
              {selectedTests.size < allTestIds.length
                ? `(${selectedTests.size}/${allTestIds.length})`
                : "All"}
            </Button>
          </div>
        </div>

        {/* Test Selector Panel — hidden during print */}
        {showSelector && (
          <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm no-print">
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
                    <p className="text-sm font-medium truncate">
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

        {/* ── Printable Report ──────────────────────────────────── */}
        <div
          id="result-preview-printable"
          className="bg-white dark:bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Report Header */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 px-6 py-5 border-b border-border/40">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                LABORATORY TEST REPORT
              </h1>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                {appName || 'Bloo LIMS Clinic'} {address ? `· ${address}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/30">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                  Patient Name
                </p>
                <p className="text-sm font-bold text-foreground">
                  {patient?.patientName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                  Lab Number
                </p>
                <p className="text-sm font-bold text-foreground font-mono">
                  {record.labNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                  Date
                </p>
                <p className="text-sm font-bold text-foreground">
                  {new Date(record.recordDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                  Gender / Age
                </p>
                <p className="text-sm font-bold text-foreground">
                  {patient?.gender || "—"}{" "}
                  {patient?.age ? `/ ${patient.age} yrs` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Results Body */}
          <div className="p-6 space-y-6">
            {selectedGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tests selected for preview. Use the selector above to choose
                tests.
              </div>
            ) : (
              selectedGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="border border-border/50 rounded-xl overflow-hidden"
                >
                  {/* Test Group Header */}
                  <div className="bg-muted/40 dark:bg-muted/20 px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {group.parentTestName}
                      </h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {group.department}
                    </Badge>
                  </div>

                  {/* Results Table */}
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/20 dark:bg-muted/10 border-b border-border/30">
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[35%]">
                          Parameter
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[20%]">
                          Result
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[10%]">
                          Unit
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[20%]">
                          Reference Range
                        </th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[15%] no-print">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, ri) => {
                        const flagStyle = getFlagColor(row.flag);
                        const FlagIcon = flagStyle.icon;
                        return (
                          <tr
                            key={row.id || ri}
                            className={`border-b border-border/20 last:border-b-0 transition-colors ${
                              ri % 2 === 0
                                ? "bg-background"
                                : "bg-muted/10 dark:bg-muted/5"
                            }`}
                          >
                            <td className="py-2.5 px-4 text-sm font-semibold text-foreground">
                              {row.testName}
                            </td>
                            <td
                              className={`py-2.5 px-4 text-sm font-bold font-mono ${
                                row.flag === "Normal"
                                  ? "text-foreground flag-normal"
                                  : row.flag === "Abnormal"
                                  ? "text-amber-600 dark:text-amber-400 flag-abnormal"
                                  : "text-red-600 dark:text-red-400 flag-critical"
                              }`}
                            >
                              {row.result || "—"}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-muted-foreground">
                              {row.unit || "—"}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">
                              {row.referenceRange || "—"}
                            </td>
                            <td className="py-2.5 px-4 no-print">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${flagStyle.bg} ${flagStyle.text} ${flagStyle.border} border`}
                              >
                                <FlagIcon size={10} />
                                {flagStyle.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            {/* Summary Footer */}
            {hasAnyAbnormal && selectedGroups.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <AlertTriangle
                  size={18}
                  className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Abnormal / Critical values detected
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                    One or more test results fall outside the normal reference
                    range. Please consult with the attending physician.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Report Footer */}
          <div className="px-6 py-4 bg-muted/20 dark:bg-muted/10 border-t border-border/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-[10px] text-muted-foreground">
                <p>
                  Report generated on{" "}
                  {new Date().toLocaleString()}
                </p>
                <p className="mt-0.5">
                  This is a computer-generated report. Please correlate
                  clinically.
                </p>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <p className="font-semibold">{appName || 'Bloo LIMS'}</p>
                {(phone || !appName) && <p>Phone: {phone || '+1 234 567 890'}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
