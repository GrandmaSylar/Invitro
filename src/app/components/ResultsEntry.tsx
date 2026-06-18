import { useState, useEffect, useRef } from "react";
import { showConfirm, showSuccess } from "../../stores/useDialogStore";
import { toast } from "sonner";
import { 
  Search, 
  Loader2, 
  ArrowLeft, 
  ArrowDownAz, 
  ArrowUpZa, 
  User, 
  Hash, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Save, 
  Printer,
  FileText
} from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLabRecord, useLabRecordTests } from "../../hooks/useLabRecords";
import { usePatientsList } from "../../hooks/usePatients";
import { PatientSearchBar, PatientResultsList } from "../../features/patients/ExistingPatientTab";
import { useBulkEnterResults, useResultsByRecord, useUpdateResult } from "../../hooks/useResults";
import { ResultPreview } from "../../features/patients/ResultPreview";
import { useDoctors, useHospitals } from "../../hooks/useRegistry";
import type { ResultFlag, LabRecord } from "../../lib/types";

interface ResultRow {
  id?: string;
  labRecordTestId: string;
  parentTestName: string;
  testName: string;
  department: string;
  referenceRange: string;
  unit: string;
  result: string;
  flag: ResultFlag;
  isSaved?: boolean;
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
  const [previewRecordId, setPreviewRecordId] = useState<string | null>(null);
  
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
  
  // Existing saved results query to prevent vanishing values & edit locking
  const { data: existingResults = [], isLoading: existingResultsLoading } = useResultsByRecord(activeRecordId || "");
  
  // Registry queries for doctor & hospital referral names
  const { data: doctors = [] } = useDoctors();
  const { data: hospitals = [] } = useHospitals();

  const [panelSearchQuery, setPanelSearchQuery] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Mutations
  const bulkEnterResults = useBulkEnterResults();
  const updateResult = useUpdateResult();

  const [resultRows, setResultRows] = useState<ResultRow[]>([]);
  const loadedRecordIdRef = useRef<string | null>(null);
  const isDataReady = !recordLoading && !testsLoading && !existingResultsLoading;

  // Update rows only once when record tests & existing results have finished loading
  useEffect(() => {
    if (activeRecordId && isDataReady && recordTests.length > 0 && loadedRecordIdRef.current !== activeRecordId) {
      const rows: ResultRow[] = [];
      recordTests.forEach(test => {
        if (test.parameters && test.parameters.length > 0) {
          test.parameters.forEach(param => {
            const saved = existingResults.find(r => 
              r.labRecordTestId === test.id && 
              r.testName === param.parameterName
            );
            
            rows.push({
              id: saved?.id,
              labRecordTestId: test.id,
              parentTestName: test.testName,
              testName: param.parameterName,
              department: test.department,
              referenceRange: param.referenceRange || "",
              unit: param.units || "",
              result: saved ? (saved.result || "") : "",
              flag: saved ? saved.flag : "Normal",
              isSaved: !!saved && saved.result !== undefined && saved.result !== "",
            });
          });
        } else {
          const saved = existingResults.find(r => 
            r.labRecordTestId === test.id && 
            r.testName === test.testName
          );
          
          rows.push({
            id: saved?.id,
            labRecordTestId: test.id,
            parentTestName: test.testName,
            testName: test.testName,
            department: test.department,
            referenceRange: "",
            unit: "",
            result: saved ? (saved.result || "") : "",
            flag: saved ? saved.flag : "Normal",
            isSaved: !!saved && saved.result !== undefined && saved.result !== "",
          });
        }
      });
      setResultRows(rows);
      loadedRecordIdRef.current = activeRecordId;
    }
  }, [activeRecordId, isDataReady, recordTests, existingResults]);

  // Auto-select the first test panel when loaded
  useEffect(() => {
    if (recordTests.length > 0 && !selectedTestId) {
      setSelectedTestId(recordTests[0].id);
    }
  }, [recordTests, selectedTestId]);

  const getReferralText = () => {
    if (!matchedRecord) return "None";
    if (matchedRecord.referralOption === "Doctor" && matchedRecord.referralDoctorId) {
      const doc = doctors.find(d => d.id === matchedRecord.referralDoctorId);
      return doc ? `Dr. ${doc.doctorName}${doc.speciality ? ` - ${doc.speciality}` : ""}` : "Loading Doctor...";
    }
    if (matchedRecord.referralOption === "Hospital" && matchedRecord.referralHospitalId) {
      const hosp = hospitals.find(h => h.id === matchedRecord.referralHospitalId);
      return hosp ? hosp.hospitalName : "Loading Hospital...";
    }
    return matchedRecord.referralOption || "None";
  };

  const handleSubmit = async () => {
    if (!matchedRecord) return;
    
    // Identify new rows (no id, and non-empty result)
    const newRows = resultRows.filter(row => !row.id && row.result.trim() !== "");
    
    // Identify updated rows (has id, and changed result or flag)
    const updatedRows = resultRows.filter(row => {
      if (!row.id) return false;
      const original = existingResults.find(r => r.id === row.id);
      if (!original) return false;
      return row.result !== (original.result || "") || row.flag !== original.flag;
    });

    if (newRows.length === 0 && updatedRows.length === 0) {
      toast.info("No new or modified results to save.");
      return;
    }
    
    const totalChanges = newRows.length + updatedRows.length;
    const confirmed = await showConfirm({
      title: "Save Results",
      description: `Save ${totalChanges} result change(s) for ${matchedRecord.patient?.patientName || "this patient"}?`,
      confirmText: "Save"
    });
    if (!confirmed) return;
    
    try {
      const savePromises: Promise<any>[] = [];
      
      if (newRows.length > 0) {
        savePromises.push(
          bulkEnterResults.mutateAsync(
            newRows.map(row => ({
              labRecordTestId: row.labRecordTestId,
              testName: row.testName,
              department: row.department,
              referenceRange: row.referenceRange,
              unit: row.unit,
              result: row.result,
              flag: row.flag,
            }))
          )
        );
      }
      
      if (updatedRows.length > 0) {
        updatedRows.forEach(row => {
          savePromises.push(
            updateResult.mutateAsync({
              id: row.id!,
              updates: {
                result: row.result,
                flag: row.flag,
              }
            })
          );
        });
      }
      
      await Promise.all(savePromises);
      
      showSuccess({ title: "Results Saved", description: `Successfully saved results for ${matchedRecord.patient?.patientName || "Patient"}.` });
      // Transition to preview instead of clearing
      setPreviewRecordId(activeRecordId);
      setActiveRecordId(null);
      setResultRows([]);
      setSelectedTestId(null);
      setPanelSearchQuery("");
      loadedRecordIdRef.current = null;
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

  // ── Preview Mode (after submission or viewing old results) ───
  const previewRecord = useLabRecord(previewRecordId || "");
  const { data: previewResults = [], isLoading: previewResultsLoading } = useResultsByRecord(previewRecordId || "");

  if (previewRecordId) {
    if (previewRecord.isLoading || previewResultsLoading) {
      return (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
              <h2 className="text-xl font-bold text-foreground">Test Results Preview</h2>
            </div>
            <div className="pt-6 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                Loading results…
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
            <h2 className="text-xl font-bold text-foreground">Test Results Preview</h2>
            <p className="text-sm text-muted-foreground">Review, select, and print test results</p>
          </div>
          <div className="pt-6">
            <ResultPreview
              record={previewRecord.data!}
              results={previewResults}
              onClose={() => setPreviewRecordId(null)}
              backLabel="Back to Patient List"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col">

        {/* Page title strip */}
        <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
          <h2 className="text-xl font-bold text-foreground">Results Entry</h2>
          <p className="text-sm text-muted-foreground">Look up a patient by lab number or name, then enter test results</p>
        </div>

        {/* Scrollable content */}
        <div className="pt-6 space-y-6">

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
                  setSelectedTestId(null);
                  setPanelSearchQuery("");
                  loadedRecordIdRef.current = null;
                }} 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2 shrink-0"
              >
                <ArrowLeft size={16} />
                Back to Patient List
              </Button>

              {/* Patient summary strip — only when matchedRecord !== null */}
              {matchedRecord && (
                <div className="bg-card border border-border/60 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        Patient
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {matchedRecord.patient?.patientName || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 min-w-[180px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        Lab Number
                      </p>
                      <p className="text-sm font-bold text-foreground font-mono">
                        {matchedRecord.labNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Age
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {matchedRecord.patient?.age ? `${matchedRecord.patient.age} years` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Total Tests
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {recordTests.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User size={18} className="rotate-45" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Referral
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {getReferralText()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Two-column dashboard structure */}
              {resultRows.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Left Column (Sidebar) */}
                  <div className="lg:col-span-1 bg-card border border-border/60 rounded-2xl p-4 flex flex-col gap-4 h-fit">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search tests..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border/80 bg-background focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-foreground"
                        value={panelSearchQuery}
                        onChange={e => setPanelSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {recordTests
                        .filter(test => 
                          test.testName.toLowerCase().includes(panelSearchQuery.toLowerCase()) ||
                          test.department.toLowerCase().includes(panelSearchQuery.toLowerCase())
                        )
                        .map(test => {
                          const isSelected = selectedTestId === test.id;
                          const panelParams = resultRows.filter(r => r.labRecordTestId === test.id);
                          const totalCount = panelParams.length;
                          const enteredCount = panelParams.filter(r => r.result.trim() !== "").length;
                          const isCompleted = totalCount > 0 && enteredCount === totalCount;
                          
                          return (
                            <button
                              key={test.id}
                              onClick={() => setSelectedTestId(test.id)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2 relative ${
                                isSelected 
                                  ? "bg-primary/5 border-primary text-foreground shadow-sm ring-1 ring-primary/20" 
                                  : "bg-card hover:bg-muted/30 border-border/60 text-foreground"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-xs leading-tight">{test.testName}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{test.department}</p>
                                </div>
                                {isSelected && (
                                  <span className="text-primary mt-0.5 shrink-0">
                                    <ChevronRight size={14} className="animate-pulse" />
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-1 text-[10px]">
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border ${
                                  isCompleted 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                    : "bg-muted border-border/80 text-muted-foreground"
                                }`}>
                                  {isCompleted ? "Completed" : "Pending"}
                                </span>
                                <span className="font-mono text-muted-foreground">
                                  {enteredCount}/{totalCount}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      {recordTests.filter(test => 
                        test.testName.toLowerCase().includes(panelSearchQuery.toLowerCase()) ||
                        test.department.toLowerCase().includes(panelSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          No test panels match.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (Parameters list for selected test panel) */}
                  <div className="lg:col-span-3 space-y-6">
                    {(() => {
                      const activeTest = recordTests.find(t => t.id === selectedTestId);
                      if (!activeTest) {
                        return (
                          <div className="bg-card border border-border/60 rounded-2xl p-12 text-center text-muted-foreground">
                            Please select a test panel from the list.
                          </div>
                        );
                      }
                      
                      const activeParams = resultRows
                        .map((row, globalIdx) => ({ row, globalIdx }))
                        .filter(item => item.row.labRecordTestId === activeTest.id);
                      
                      const totalCount = activeParams.length;
                      const enteredCount = activeParams.filter(item => item.row.result.trim() !== "").length;
                      const isCompleted = totalCount > 0 && enteredCount === totalCount;
                      
                      return (
                        <div className="space-y-4">
                          {/* Active test panel header strip */}
                          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-base text-foreground tracking-tight">{activeTest.testName}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{activeTest.department}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] border ${
                                isCompleted 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                  : "bg-muted border-border/80 text-muted-foreground"
                              }`}>
                                {isCompleted ? "Completed" : "Pending"}
                              </span>
                              
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (activeRecordId) setPreviewRecordId(activeRecordId);
                                }}
                                className="flex items-center gap-1.5 h-9"
                                title="Print / Preview results"
                              >
                                <Printer size={15} />
                              </Button>

                              <Button 
                                variant="default"
                                size="sm"
                                onClick={handleSubmit}
                                disabled={bulkEnterResults.isPending || updateResult.isPending}
                                className="flex items-center gap-1.5 bg-primary text-primary-foreground h-9 px-4 font-semibold shadow-sm hover:shadow"
                              >
                                {bulkEnterResults.isPending || updateResult.isPending ? <Loader2 className="animate-spin mr-1" size={15} /> : <Save size={15} />}
                                Save Results
                              </Button>
                            </div>
                          </div>
                          
                          {/* Active parameter card */}
                          {activeParams.length > 0 ? (
                            <div className="bg-card border border-border/60 rounded-2xl shadow-sm divide-y divide-border/40 overflow-hidden">
                              {activeParams.map(({ row, globalIdx }, index) => (
                                <div 
                                  key={globalIdx} 
                                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors duration-150"
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Index Circle */}
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 border border-border/40">
                                      {index + 1}
                                    </div>
                                    
                                    {/* Details */}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-foreground">{row.testName}</p>
                                        {row.isSaved && (
                                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Saved
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {row.referenceRange ? `Reference: ${row.referenceRange}` : "No reference range"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 self-end sm:self-auto">
                                    {/* Inside-unit Input Container */}
                                    <div className="relative flex items-center w-48">
                                      <input
                                        type="text"
                                        placeholder="Enter value"
                                        className="w-full pl-3 pr-14 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-mono text-foreground font-semibold transition-all border-border/80"
                                        value={row.result}
                                        onChange={e => updateResultRow(globalIdx, "result", e.target.value)}
                                      />
                                      {row.unit && (
                                        <span className="absolute right-3 text-xs text-muted-foreground font-mono truncate max-w-[44px]" title={row.unit}>
                                          {row.unit}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Badge Select flag selector */}
                                    <div className="relative shrink-0 w-24">
                                      <select
                                        className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wider focus:outline-none transition-all text-center cursor-pointer ${
                                          row.flag === "Normal" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" :
                                          row.flag === "Abnormal" ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400" :
                                          "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400"
                                        }`}
                                        value={row.flag}
                                        onChange={e => updateResultRow(globalIdx, "flag", e.target.value as ResultFlag)}
                                      >
                                        <option value="Normal" className="bg-background text-foreground font-semibold">Normal</option>
                                        <option value="Abnormal" className="bg-background text-foreground font-semibold">Abnormal</option>
                                        <option value="Critical" className="bg-background text-foreground font-semibold">Critical</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                              No parameters found for this test.
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
