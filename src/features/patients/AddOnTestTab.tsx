import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  useLabRecord, 
  useLabRecordTests, 
  useAddTestsToRecord, 
  PartialAddTestsError,
  labRecordKeys
} from "../../hooks/useLabRecords";
import { usePatientsList } from "../../hooks/usePatients";
import { useTests } from "../../hooks/useCatalog";
import { labRecordService } from "../../services/labRecordService";
import { useQueryClient } from "@tanstack/react-query";
import type { Test, TestItem } from "../../lib/types";
import { PaymentPanel } from "./PaymentPanel";
import { TestCombobox } from "./TestCombobox";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Button } from "../../app/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../app/components/ui/alert";
import { Badge } from "../../app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import { Checkbox } from "../../app/components/ui/checkbox";
import { Search, FlaskConical, AlertCircle, User, ArrowDownAz, ArrowUpZa, ArrowLeft, Trash2 } from "lucide-react";
import { PatientSearchBar, PatientResultsList } from "./ExistingPatientTab";
import { ReceiptPreview, ReceiptData } from "./ReceiptPreview";
import { cn } from "../../app/components/ui/utils";

export function AddOnTestTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [showAllRecordsFor, setShowAllRecordsFor] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'created_at' | 'patient_name' | 'dob' | 'age'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { patients, isLoading: patientsLoading, isError: patientsError, error: patientsErrorObj } = usePatientsList({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    sortBy,
    sortDirection,
    limit: 50
  });

  const [newTests, setNewTests] = useState<TestItem[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState(0);
  const [isPaymentValid, setIsPaymentValid] = useState(true);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: record, isLoading: recordLoading, isError: recordError } = useLabRecord(activeRecordId ?? "");
  const { data: existingTests = [] } = useLabRecordTests(activeRecordId ?? "");
  const { data: allTests } = useTests();
  const [savedReceiptData, setSavedReceiptData] = useState<ReceiptData | null>(null);
  const addTestsMutation = useAddTestsToRecord();
  const qc = useQueryClient();

  useEffect(() => {
    if (record) {
      setNewPaymentAmount(0);
    }
  }, [record]);

  const toggleTestSelection = (test: Test) => {
    if (isSaving) return;
    const isExisting = existingTests.some(t => t.testId === test.id);
    if (isExisting) return; // Cannot modify existing tests here

    setNewTests(prev => {
      const exists = prev.some(t => t.testId === test.id);
      if (exists) {
        return prev.filter(t => t.testId !== test.id);
      } else {
        return [...prev, {
          testId: test.id,
          testName: test.testName,
          department: test.department,
          testCost: test.testCost,
        }];
      }
    });
    setInlineError(null);
  };

  const handleClearSelection = () => {
    setNewTests([]);
    setSelectedRowIds(new Set());
  };

  const handleDeleteSelected = () => {
    setNewTests(prev => prev.filter(t => !selectedRowIds.has(t.testId)));
    setSelectedRowIds(new Set());
  };

  const toggleRowSelection = (testId: string) => {
    if (isSaving) return;
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const handleSaveAddOnTests = async () => {
    if (!record) return;
    setInlineError(null);
    setIsSaving(true);
    try {
      let paymentData: any = null;
      if (newTests.length > 0) {
        await addTestsMutation.mutateAsync({ labRecordId: record.id, tests: newTests });
        setNewTests([]);
        setSelectedRowIds(new Set());
      }
      
      if (newPaymentAmount > 0) {
        paymentData = await labRecordService.recordPayment(record.id, newPaymentAmount);
        qc.invalidateQueries({ queryKey: labRecordKeys.all });
        qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
        qc.invalidateQueries({ queryKey: ['dashboard-charts'] });
      }
      
      const existingTestsSubtotal = existingTests.reduce((s, t) => s + t.testCost, 0);
      const newTestsSubtotal = newTests.reduce((s, t) => s + t.testCost, 0);
      const totalCost = existingTestsSubtotal + newTestsSubtotal;
      const totalAmountPaid = (record.amountPaid || 0) + newPaymentAmount;

      setSavedReceiptData({
        labNumber: record.labNumber,
        patientName: record.patient?.patientName || "Unknown Patient",
        tests: [...existingTests, ...newTests].map(t => ({ testName: t.testName, testCost: t.testCost })),
        totalCost,
        amountPaid: totalAmountPaid,
        arrears: totalCost - totalAmountPaid,
        recordDate: new Date().toISOString(),
        ...(paymentData ? {
          receiptNumber: paymentData.receiptNumber,
          paymentAmount: paymentData.amount,
          paymentDate: paymentData.paymentDate
        } : {})
      });
      
      toast.success("Add-on tests saved successfully!");
    } catch (error) {
      if (error instanceof PartialAddTestsError) {
        setInlineError(`Failed to save all tests. Only ${error.result.completedCount} tests were attached. Please try again.`);
      } else {
        setInlineError("An unexpected error occurred while saving. If tests were added, you may only need to retry the payment.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalogTests = (allTests ?? []).filter(test => 
    test.testName.toLowerCase().includes(testSearchQuery.toLowerCase()) || 
    test.department.toLowerCase().includes(testSearchQuery.toLowerCase())
  );

  if (savedReceiptData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => {
          setSavedReceiptData(null);
          setActiveRecordId(null);
          setNewPaymentAmount(0);
        }} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Search
        </Button>
        <ReceiptPreview 
          recordData={savedReceiptData} 
          onClose={() => {
            setSavedReceiptData(null);
            setActiveRecordId(null);
            setNewPaymentAmount(0);
          }} 
        />
      </div>
    );
  }

  if (activeRecordId) {
    if (recordLoading) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setActiveRecordId(null)} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back to Search
          </Button>
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading record details…</div>
        </div>
      );
    }

    if (recordError || !record) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setActiveRecordId(null)} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back to Search
          </Button>
          <div className="p-8 text-center text-destructive">
            Failed to load record details. Please try again.
          </div>
        </div>
      );
    }

    const existingTestsSubtotal = existingTests.reduce((s, t) => s + t.testCost, 0);
    const existingArrears = Math.max(0, existingTestsSubtotal - (record.amountPaid || 0));

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setActiveRecordId(null)} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Search
        </Button>

        <div className="bg-primary/5 border border-primary/20 p-5 sm:p-6 rounded-2xl flex flex-wrap gap-8 shadow-sm">
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Patient Name</p>
            <p className="text-base font-bold text-foreground">{record.patient?.patientName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Lab Number</p>
            <p className="text-base font-bold text-foreground font-mono">{record.labNumber}</p>
          </div>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Date</p>
            <p className="text-base font-bold text-foreground">{new Date(record.recordDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Tests Ordered</p>
            <p className="text-base font-bold text-foreground">{existingTests.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-4 items-start w-full">
          <div className="space-y-4 min-w-0">
            <Card>
              <CardHeader className="pb-4 border-b mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={20} className="text-green-600" />
                    <CardTitle>Add New Tests</CardTitle>
                  </div>
                  <Badge variant="secondary">{newTests.length} New Selected</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <TestCombobox
                  tests={allTests ?? []}
                  onAdd={(test) => toggleTestSelection(test)}
                  alreadyAdded={[...existingTests.map(t => t.testId), ...newTests.map(t => t.testId)]}
                  disabled={isSaving}
                />

                <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="p-2 text-center w-12">
                          <Checkbox 
                            checked={newTests.length > 0 && selectedRowIds.size === newTests.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRowIds(new Set(newTests.map(t => t.testId)));
                              } else {
                                setSelectedRowIds(new Set());
                              }
                            }}
                            disabled={isSaving || newTests.length === 0}
                          />
                        </th>
                        <th className="p-2 text-left">Test Name</th>
                        <th className="p-2 text-left">Department</th>
                        <th className="p-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newTests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            No new tests selected. Search and add tests above.
                          </td>
                        </tr>
                      ) : (
                        newTests.map((testItem) => {
                          const isSelected = selectedRowIds.has(testItem.testId);
                          return (
                            <tr 
                              key={testItem.testId} 
                              className={cn(
                                "border-b last:border-0 transition-colors cursor-pointer active:scale-[0.99]",
                                isSelected 
                                  ? "bg-primary/10 dark:bg-primary/20 border-primary/20" 
                                  : "hover:bg-muted/50"
                              )}
                              onClick={() => toggleRowSelection(testItem.testId)}
                            >
                              <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleRowSelection(testItem.testId)}
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="p-2 font-medium flex items-center gap-2">
                                {testItem.testName}
                                <Badge variant="outline" className="text-[10px] h-4 px-1 text-green-600 border-green-200 bg-green-50">New Add-on</Badge>
                              </td>
                              <td className="p-2 text-muted-foreground">{testItem.department}</td>
                              <td className="p-2 text-right font-semibold text-primary">₵{testItem.testCost.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {inlineError && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{inlineError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearSelection} disabled={newTests.length === 0 || isSaving}>
                  <Trash2 size={16} className="text-red-500" />
                  <span className="text-red-500 font-medium">Delete all tests</span>
                </Button>
                {selectedRowIds.size > 0 && (
                  <Button variant="outline" onClick={handleDeleteSelected} disabled={isSaving}>
                    <Trash2 size={16} />
                    Delete selected test{selectedRowIds.size > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
              <Button 
                variant="default" 
                onClick={handleSaveAddOnTests} 
                disabled={(newTests.length === 0 && newPaymentAmount === 0) || isSaving || !isPaymentValid}
              >
                {isSaving ? "Saving..." : "Save Add-on Tests"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 sticky top-4">
            <Card className="bg-muted/20 border-primary/10 shadow-sm">
              <div className="px-4 py-2 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <span className="font-semibold text-sm">Previous Summary</span>
                <span className="text-xs text-muted-foreground">{existingTests.length} tests</span>
              </div>
              <div className="p-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Cost</span>
                  <span className="font-medium text-foreground">₵{existingTestsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span className="font-medium text-foreground">₵{(record.amountPaid || 0).toFixed(2)}</span>
                </div>
                {existingArrears > 0 ? (
                  <div className="flex justify-between text-amber-600 dark:text-amber-500 font-semibold pt-1 mt-1 border-t border-border/50">
                    <span>Arrears</span>
                    <span>₵{existingArrears.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-green-600 dark:text-green-500 font-semibold pt-1 mt-1 border-t border-border/50">
                    <span>Status</span>
                    <span>Fully Paid</span>
                  </div>
                )}
              </div>
            </Card>
            <PaymentPanel
              title="New Payment"
              tests={newTests}
              amountPaid={newPaymentAmount}
              onAmountPaidChange={setNewPaymentAmount}
              existingSubtotal={existingArrears}
              disabled={isSaving}
              onValidationChange={setIsPaymentValid}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-500/10 border-l-4 border-green-600 p-5 shadow-sm rounded">
        <div className="flex items-center gap-3">
          <FlaskConical className="text-green-700" size={24} />
          <div>
            <h3 className="font-bold text-green-700 dark:text-green-400">Add-on Test Mode</h3>
            <p className="text-sm text-green-700 dark:text-green-400">Search for a patient to add tests to an existing lab record.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Patient Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
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
                className="h-12 w-12 px-0"
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
            error={patientsErrorObj}
            searchQuery={searchQuery}
            expandedPatientId={expandedPatientId}
            setExpandedPatientId={setExpandedPatientId}
            showAllRecordsFor={showAllRecordsFor}
            setShowAllRecordsFor={setShowAllRecordsFor}
            setOpenRecordId={setActiveRecordId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
