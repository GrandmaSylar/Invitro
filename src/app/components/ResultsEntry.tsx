import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { LabBanner } from "./LabBanner";
import { Button } from "./ui/button";
import { useLabRecordByNumber, useLabRecordTests } from "../../hooks/useLabRecords";
import { useBulkEnterResults } from "../../hooks/useResults";
import type { ResultFlag, LabRecord } from "../../lib/types";

interface ResultRow {
  labRecordTestId: string;
  testName: string;
  department: string;
  referenceRange: string;
  unit: string;
  result: string;
  flag: ResultFlag;
}

export function ResultsEntry() {
  const [lookupQuery, setLookupQuery] = useState("");
  const [activeLabNumber, setActiveLabNumber] = useState("");
  
  // Queries
  const { data: matchedRecord, isLoading: recordLoading, isError: recordError, isFetched: recordFetched } = useLabRecordByNumber(activeLabNumber);
  const { data: recordTests = [], isLoading: testsLoading } = useLabRecordTests(matchedRecord?.id || "");
  
  // Mutations
  const bulkEnterResults = useBulkEnterResults();

  const [noMatch, setNoMatch] = useState(false);
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);

  // Update rows when record tests are loaded
  useEffect(() => {
    if (recordTests.length > 0) {
      setResultRows(
        recordTests.map(test => ({
          labRecordTestId: test.id,
          testName: test.testName,
          department: test.department,
          referenceRange: "", // To get actual ref ranges, we would need to join with test catalog. Assuming empty or added later.
          unit: "",
          result: "",
          flag: "Normal",
        }))
      );
    }
  }, [recordTests]);

  useEffect(() => {
    if (recordFetched) {
      setNoMatch(!!recordError || !matchedRecord);
    }
  }, [recordFetched, recordError, matchedRecord]);

  const handleFindPatient = () => {
    const query = lookupQuery.trim();
    if (!query) {
      setActiveLabNumber("");
      setResultRows([]);
      setNoMatch(false);
      return;
    }
    setActiveLabNumber(query);
  };

  const handleSubmit = async () => {
    if (!matchedRecord) return;
    
    try {
      await bulkEnterResults.mutateAsync(
        resultRows.map(row => ({
          labRecordTestId: row.labRecordTestId,
          testName: row.testName,
          department: row.department,
          referenceRange: row.referenceRange,
          unit: row.unit,
          result: row.result,
          flag: row.flag,
        }))
      );
      toast.success(`Results submitted for ${matchedRecord.patient?.patientName || "Patient"}.`);
      setLookupQuery("");
      setActiveLabNumber("");
      setResultRows([]);
      setNoMatch(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateResultRow = (index: number, field: keyof ResultRow, value: string) => {
    setResultRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  return (
    <div className="p-4 sm:p-6 h-full space-y-6">
      <div className="bg-card flex flex-col rounded-2xl shadow-sm border border-border/50 overflow-hidden">

        {/* Page title strip */}
        <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
          <h2 className="text-xl font-bold text-foreground">Results Entry</h2>
          <p className="text-sm text-muted-foreground">Look up a patient by lab number or name, then enter test results</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-6 bg-background space-y-6">

          {/* Lookup card */}
          <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <label className="block text-sm font-semibold text-foreground mb-2">Patient Lookup</label>
            <div className="flex gap-3 mt-2">
              <input
                data-element-id="patient-lookup-input"
                className="flex-1 px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFindPatient()}
                placeholder="Enter Lab Number or Patient Name..."
              />
              <Button 
                variant="blue"
                data-element-id="find-patient-btn"
                onClick={handleFindPatient}
                className="px-6"
                disabled={recordLoading || testsLoading}
              >
                {recordLoading || testsLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Search size={18} className="mr-2" />}
                Find Patient
              </Button>
            </div>

            {/* No-match inline message */}
            {noMatch && (
              <p className="mt-3 text-sm font-medium text-destructive">
                No patient found. Check the lab number or name and try again.
              </p>
            )}
          </div>

          {/* Patient banner — only when matchedRecord !== null */}
          {matchedRecord && (
            <div className="bg-primary/5 border border-primary/20 p-5 sm:p-6 rounded-2xl flex flex-wrap gap-8 shadow-sm">
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Patient Name</p>
                <p className="text-base font-bold text-foreground">{matchedRecord.patient?.patientName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Lab Number</p>
                <p className="text-base font-bold text-foreground font-mono">{matchedRecord.labNumber}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Date</p>
                <p className="text-base font-bold text-foreground">{new Date(matchedRecord.recordDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Tests Ordered</p>
                <p className="text-base font-bold text-foreground">{recordTests.length}</p>
              </div>
            </div>
          )}

          {/* Results table — only when resultRows.length > 0 */}
          {resultRows.length > 0 && (
            <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border/60">Enter Test Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border/60">
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide w-12">#</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">Test Name</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide w-32">Department</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide w-32">Ref Range</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide w-40">Result</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide w-24">Unit</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide w-32">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row, i) => (
                      <tr key={i} className="border-b border-border odd:bg-background even:bg-muted/30 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 min-w-[28px] text-center inline-block">
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground">{row.testName}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{row.department}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{row.referenceRange}</td>
                        <td className="py-3 px-4">
                          <input
                            data-element-id={`result-${i + 1}`}
                            className="w-full px-3 py-2 rounded border border-border/60 bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono font-medium text-foreground"
                            value={row.result}
                            onChange={e => updateResultRow(i, "result", e.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{row.unit}</td>
                        <td className="py-3 px-4">
                          <select
                            className={`w-full px-3 py-2 border rounded focus:outline-none transition-all font-semibold text-sm ${
                              row.flag === "Normal" ? "border-border/60 bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10" :
                              row.flag === "Abnormal" ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" :
                              "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            }`}
                            value={row.flag}
                            onChange={e => updateResultRow(i, "flag", e.target.value as ResultFlag)}
                          >
                            <option value="Normal">Normal</option>
                            <option value="Abnormal">Abnormal</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <Button 
                  variant="green"
                  size="lg"
                  data-element-id="submit-results-btn"
                  onClick={handleSubmit}
                  disabled={bulkEnterResults.isPending}
                  className="px-8 text-lg shadow-md hover:shadow-lg"
                >
                  {bulkEnterResults.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Submit Results
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
