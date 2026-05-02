import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Loader2, ArrowLeft, ArrowDownAz, ArrowUpZa } from "lucide-react";
import { LabBanner } from "./LabBanner";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLabRecord, useLabRecordTests } from "../../hooks/useLabRecords";
import { usePatientsList } from "../../hooks/usePatients";
import { PatientSearchBar, PatientResultsList } from "../../features/patients/ExistingPatientTab";
import { useBulkEnterResults } from "../../hooks/useResults";
import type { ResultFlag, LabRecord } from "../../lib/types";

interface ResultRow {
  labRecordTestId: string;
  parentTestName: string;
  testName: string;
  department: string;
  referenceRange: string;
  unit: string;
  result: string;
  flag: ResultFlag;
}

function computeFlag(result: string, refRange: string): ResultFlag {
  if (!result || !refRange) return "Normal";
  const numResult = parseFloat(result);
  if (isNaN(numResult)) return "Normal";

  const parts = refRange.split("-").map(s => s.trim());
  if (parts.length === 2) {
    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    if (!isNaN(min) && !isNaN(max)) {
      if (numResult < min || numResult > max) return "Abnormal";
    }
  }
  if (refRange.startsWith("<")) {
    const max = parseFloat(refRange.substring(1));
    if (!isNaN(max) && numResult >= max) return "Abnormal";
  }
  if (refRange.startsWith(">")) {
    const min = parseFloat(refRange.substring(1));
    if (!isNaN(min) && numResult <= min) return "Abnormal";
  }

  return "Normal";
}

export function ResultsEntry() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [showAllRecordsFor, setShowAllRecordsFor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'patient_name' | 'dob' | 'age'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  
  // Queries
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { patients, isLoading: patientsLoading, isError: patientsError, error: pError } = usePatientsList({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    sortBy,
    sortDirection,
    limit: 50
  });

  const { data: matchedRecord, isLoading: recordLoading } = useLabRecord(activeRecordId || "");
  const { data: recordTests = [], isLoading: testsLoading } = useLabRecordTests(activeRecordId || "");
  
  // Mutations
  const bulkEnterResults = useBulkEnterResults();

  const [resultRows, setResultRows] = useState<ResultRow[]>([]);

  // Update rows when record tests are loaded
  useEffect(() => {
    if (recordTests.length > 0) {
      const rows: ResultRow[] = [];
      recordTests.forEach(test => {
        if (test.parameters && test.parameters.length > 0) {
          test.parameters.forEach(param => {
            rows.push({
              labRecordTestId: test.id,
              parentTestName: test.testName,
              testName: param.parameterName,
              department: test.department,
              referenceRange: param.referenceRange || "",
              unit: param.units || "",
              result: "",
              flag: "Normal",
            });
          });
        } else {
          rows.push({
            labRecordTestId: test.id,
            parentTestName: test.testName,
            testName: test.testName,
            department: test.department,
            referenceRange: "",
            unit: "",
            result: "",
            flag: "Normal",
          });
        }
      });
      setResultRows(rows);
    }
  }, [recordTests]);

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
      setActiveRecordId(null);
      setResultRows([]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateResultRow = (index: number, field: keyof ResultRow, value: string) => {
    setResultRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      
      // Auto-flagging logic
      if (field === "result") {
        newRows[index].flag = computeFlag(value, newRows[index].referenceRange);
      }
      
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

          {/* Patient Lookup / Selection */}
          {!activeRecordId ? (
            <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <PatientSearchBar 
                    searchQuery={searchQuery} 
                    setSearchQuery={(val) => {
                      setSearchQuery(val);
                      if (expandedPatientId) setExpandedPatientId(null);
                    }} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                    <SelectTrigger className="w-[160px] h-12">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date Added</SelectItem>
                      <SelectItem value="patient_name">Name</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="dob">Date of Birth</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="h-12 w-12 px-0 shrink-0"
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={sortDirection === 'asc' ? "Ascending" : "Descending"}
                  >
                    {sortDirection === 'asc' ? <ArrowDownAz size={20} /> : <ArrowUpZa size={20} />}
                  </Button>
                </div>
              </div>
              <PatientResultsList
                patients={patients}
                isLoading={patientsLoading}
                isError={patientsError}
                error={pError}
                searchQuery={searchQuery}
                expandedPatientId={expandedPatientId}
                setExpandedPatientId={setExpandedPatientId}
                showAllRecordsFor={showAllRecordsFor}
                setShowAllRecordsFor={setShowAllRecordsFor}
                setOpenRecordId={setActiveRecordId}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setActiveRecordId(null);
                  setResultRows([]);
                }} 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft size={16} />
                Back to Patient List
              </Button>

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
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">Test Group</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">Parameter / Test</th>
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
                        <td className="py-3 px-4 text-sm font-bold text-foreground bg-muted/10">{row.parentTestName}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground pl-6 border-l-2 border-primary/20">{row.testName}</td>
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
          
          {(recordLoading || testsLoading) && (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin mb-4" />
              Loading lab record...
            </div>
          )}
          
          {!recordLoading && !testsLoading && resultRows.length === 0 && (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
              No tests found for this lab record.
            </div>
          )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
