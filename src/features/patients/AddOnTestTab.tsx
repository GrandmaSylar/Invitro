import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  useLabRecordByNumber, 
  useLabRecordTests, 
  useAddTestsToRecord, 
  PartialAddTestsError,
  labRecordKeys
} from "../../hooks/useLabRecords";
import { useTests } from "../../hooks/useCatalog";
import { labRecordService } from "../../services/labRecordService";
import { useQueryClient } from "@tanstack/react-query";
import type { Test, TestItem } from "../../lib/types";
import { TestCombobox } from "./TestCombobox";
import { PaymentPanel } from "./PaymentPanel";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Button } from "../../app/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../app/components/ui/alert";
import { Loader2, Search, FlaskConical, AlertCircle } from "lucide-react";

export function AddOnTestTab() {
  const [labNumberQuery, setLabNumberQuery] = useState("");
  const [activeLabNumber, setActiveLabNumber] = useState("");
  const [newTests, setNewTests] = useState<TestItem[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { data: record, isLoading, isError, isFetched } = useLabRecordByNumber(activeLabNumber);
  const { data: existingTests = [] } = useLabRecordTests(record?.id ?? "");
  const { data: allTests } = useTests();
  const addTestsMutation = useAddTestsToRecord();
  const qc = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setAmountPaid(record.amountPaid || 0);
    }
  }, [record]);

  const handleFindRecord = () => {
    const trimmed = labNumberQuery.trim();
    if (!trimmed) return;
    setActiveLabNumber(trimmed);
    setNewTests([]);
    setInlineError(null);
  };

  const handleAddTest = (test: Test) => {
    const newTestItem: TestItem = {
      testId: test.id,
      testName: test.testName,
      department: test.department,
      testCost: test.testCost,
    };
    setNewTests(prev => [...prev, newTestItem]);
    setInlineError(null);
  };

  const handleSaveAddOnTests = async () => {
    if (!record) return;
    setInlineError(null);
    setIsSaving(true);
    try {
      if (newTests.length > 0) {
        await addTestsMutation.mutateAsync({ labRecordId: record.id, tests: newTests });
        setNewTests([]);
      }
      
      if (amountPaid !== record.amountPaid) {
        await labRecordService.updatePayment(record.id, amountPaid);
        qc.invalidateQueries({ queryKey: labRecordKeys.byLabNumber(record.labNumber) });
        qc.invalidateQueries({ queryKey: labRecordKeys.detail(record.id) });
      }
      
      setLabNumberQuery("");
      setActiveLabNumber("");
      setAmountPaid(0);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-green-600" />
            <CardTitle>Add-on Test Mode</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <label className="block text-sm font-semibold text-foreground mb-2">Patient Lookup</label>
          <div className="flex gap-3 mt-2">
            <Input
              value={labNumberQuery}
              onChange={(e) => setLabNumberQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFindRecord()}
              placeholder="Enter Lab Number..."
              className="flex-1"
            />
            <Button onClick={handleFindRecord} disabled={isLoading} variant="blue" className="px-6">
              {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Search size={18} className="mr-2" />}
              Find Record
            </Button>
          </div>

          {isFetched && (isError || !record) && (
            <p className="mt-3 text-sm font-medium text-destructive">
              No record found for this lab number.
            </p>
          )}
        </CardContent>
      </Card>

      {record && (
        <>
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
              {existingTests.length > 0 && (
                <Card>
                  <CardHeader className="pb-4 border-b mb-4">
                    <CardTitle>Existing Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="p-2 text-left w-12">#</th>
                            <th className="p-2 text-left">Test Name</th>
                            <th className="p-2 text-left">Department</th>
                            <th className="p-2 text-right">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {existingTests.map((test, index) => (
                            <tr key={test.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-2 text-center">{index + 1}</td>
                              <td className="p-2 font-medium">{test.testName}</td>
                              <td className="p-2 text-muted-foreground">{test.department}</td>
                              <td className="p-2 text-right">₵{test.testCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-4 border-b mb-4">
                  <CardTitle>Add New Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TestCombobox 
                    tests={allTests ?? []} 
                    alreadyAdded={[...existingTests.map(t => t.testId), ...newTests.map(t => t.testId)]} 
                    onAdd={handleAddTest} 
                    disabled={isSaving}
                  />

                  {newTests.length === 0 ? (
                    <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
                      <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No add-on tests selected yet</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="p-2 text-left w-12">#</th>
                            <th className="p-2 text-left">Test Name</th>
                            <th className="p-2 text-left">Department</th>
                            <th className="p-2 text-right">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newTests.map((test, index) => (
                            <tr key={index} className="border-b last:border-0 hover:bg-muted/30 bg-green-50/50 dark:bg-green-950/20">
                              <td className="p-2 text-center">{index + 1}</td>
                              <td className="p-2 font-medium">{test.testName}</td>
                              <td className="p-2 text-muted-foreground">{test.department}</td>
                              <td className="p-2 text-right">₵{test.testCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {inlineError && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{inlineError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end p-4 bg-muted/30 border rounded-xl">
                <Button 
                  onClick={handleSaveAddOnTests} 
                  disabled={(newTests.length === 0 && amountPaid === record.amountPaid) || isSaving}
                  size="lg"
                  className="px-10"
                >
                  {isSaving ? "Saving..." : "Save Add-on Tests"}
                </Button>
              </div>
            </div>

            <PaymentPanel
              tests={newTests}
              amountPaid={amountPaid}
              onAmountPaidChange={setAmountPaid}
              existingSubtotal={existingTests.reduce((s, t) => s + t.testCost, 0)}
              disabled={isSaving}
            />
          </div>
        </>
      )}
    </div>
  );
}
