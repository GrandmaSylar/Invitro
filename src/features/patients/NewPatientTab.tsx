import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileText, User, Calendar, Phone, Stethoscope, TestTube, Trash2, Circle, AlertCircle, Loader2 } from "lucide-react";

import { useTests } from "../../hooks/useCatalog";
import { useHospitals, useDoctors } from "../../hooks/useRegistry";
import { useAddTestsToRecord, PartialAddTestsError } from "../../hooks/useLabRecords";
import { patientService } from "../../services/patientService";
import { labRecordService, generateLabNumber } from "../../services/labRecordService";

import type { Test, TestItem } from "../../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Label } from "../../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import { Button } from "../../app/components/ui/button";
import { Checkbox } from "../../app/components/ui/checkbox";
import { Badge } from "../../app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../app/components/ui/alert";

import { PaymentPanel } from "./PaymentPanel";
import { ReceiptPreview, ReceiptData } from "./ReceiptPreview";
import { Search } from "lucide-react";

type SaveState = 'idle' | 'saving-patient' | 'saving-record' | 'saving-tests' | 'success' | 'partial-failure';

export function NewPatientTab() {
  const [patientName, setPatientName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [telephone, setTelephone] = useState("");

  const [referralExpanded, setReferralExpanded] = useState(false);
  const [referralOption, setReferralOption] = useState<'None' | 'Doctor' | 'Hospital' | 'Insurance'>('None');
  const [referralDoctorId, setReferralDoctorId] = useState<string | undefined>(undefined);
  const [referralHospitalId, setReferralHospitalId] = useState<string | undefined>(undefined);
  const [doctorNameFreeText, setDoctorNameFreeText] = useState("");
  const [hospitalNameFreeText, setHospitalNameFreeText] = useState("");
  const [insuranceName, setInsuranceName] = useState("");

  const [tests, setTests] = useState<TestItem[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);

  const [committedPatient, setCommittedPatient] = useState<{ id: string; name: string } | null>(null);
  const [committedRecord, setCommittedRecord] = useState<{ id: string; labNumber: string } | null>(null);
  const [committedTestsPrefix, setCommittedTestsPrefix] = useState<number>(0);

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedRecord, setSavedRecord] = useState<ReceiptData | null>(null);
  const [partialFailureInfo, setPartialFailureInfo] = useState<{
    step: 'record' | 'tests';
    completedCount?: number;
    total?: number;
    labRecordId?: string;
    remainingTests?: TestItem[];
    patientId?: string;
  } | null>(null);
  const [nameError, setNameError] = useState(false);
  const [labNumber, setLabNumber] = useState<string>("");
  const [labNumberExists, setLabNumberExists] = useState(false);
  const [checkingLabNumber, setCheckingLabNumber] = useState(false);

  const patientNameRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { data: allTests } = useTests();
  const { data: hospitals } = useHospitals();
  const { data: doctors } = useDoctors();

  const addTestsMutation = useAddTestsToRecord();

  const handleLabNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabNumber(val);
    if (!val.trim()) {
      setLabNumberExists(false);
      return;
    }
    setCheckingLabNumber(true);
    const exists = await labRecordService.checkLabNumberExists(val);
    setLabNumberExists(exists);
    setCheckingLabNumber(false);
  };

  // Calculate age when dob changes
  useEffect(() => {
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(Math.max(0, calculatedAge));
    } else {
      setAge("");
    }
  }, [dob]);

  useEffect(() => {
    if (nameError && patientNameRef.current) {
      patientNameRef.current.focus();
    }
  }, [nameError]);

  const toggleTestSelection = (test: Test) => {
    if (!!committedRecord || isSaving) return;
    setTests(prev => {
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
  };

  const handleClearSelection = () => {
    setTests([]);
  };

  const filteredCatalogTests = (allTests ?? []).filter(test => 
    test.testName.toLowerCase().includes(testSearchQuery.toLowerCase()) || 
    test.department.toLowerCase().includes(testSearchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (labNumberExists) {
      toast.error("Please enter a unique Lab Number or leave it blank to auto-generate.");
      return;
    }

    if (!patientName.trim()) {
      setNameError(true);
      toast.error("Patient name is required.");
      return;
    }
    setNameError(false);
    
    // Step 1: Create Patient
    setSaveState('saving-patient');
    let patientId = committedPatient?.id || "";
    
    if (!patientId) {
      try {
        const patient = await patientService.createPatient({
          patientName,
          gender: gender || undefined,
          dob: dob || undefined,
          age: typeof age === 'number' ? age : undefined,
          telephone: telephone || undefined,
        });
        patientId = patient.id;
        setCommittedPatient({ id: patientId, name: patientName });
      } catch (error) {
        setSaveState('idle');
        toast.error("Failed to create patient.");
        return;
      }
    }

    await continueSaveFromRecord(patientId);
  };

  const continueSaveFromRecord = async (patientId: string) => {
    // Step 2: Create Lab Record
    setSaveState('saving-record');
    let recordId = committedRecord?.id || "";
    let recordLabNumber = committedRecord?.labNumber || (labNumber.trim() ? labNumber.trim() : undefined);

    if (!recordId) {
      try {
        let doctorId = referralOption === 'Doctor' ? referralDoctorId : undefined;
        let hospitalId = referralOption === 'Hospital' ? referralHospitalId : undefined;
        const record = await labRecordService.createLabRecord({
          patientId,
          labNumber: recordLabNumber,
          referralOption: referralOption === 'None' ? undefined : referralOption,
          referralDoctorId: doctorId,
          referralHospitalId: hospitalId,
        });
        recordId = record.id;
        recordLabNumber = record.labNumber;
        setLabNumber(recordLabNumber);
        setCommittedRecord({ id: recordId, labNumber: recordLabNumber });
      } catch (error) {
        setPartialFailureInfo({ step: 'record', patientId });
        setSaveState('partial-failure');
        return;
      }
    }

    await continueSaveFromTests(recordId, recordLabNumber || '', tests);
  };

  const continueSaveFromTests = async (recordId: string, labNumber: string, remainingTests: TestItem[]) => {
    // Step 3: Attach Tests
    setSaveState('saving-tests');
    try {
      await addTestsMutation.mutateAsync({ labRecordId: recordId, tests: remainingTests });
      
      if (amountPaid > 0) {
        await labRecordService.updatePayment(recordId, amountPaid);
      }

      setSavedRecord({
        labNumber,
        patientName: committedPatient?.name || patientName,
        tests: tests.map(t => ({ testName: t.testName, testCost: t.testCost })),
        totalCost: tests.reduce((sum, t) => sum + t.testCost, 0),
        amountPaid: amountPaid,
        arrears: tests.reduce((sum, t) => sum + t.testCost, 0) - amountPaid,
        recordDate: new Date().toISOString()
      });
      setSaveState('success');
      toast.success("Record saved successfully!");
    } catch (error) {
      if (error instanceof PartialAddTestsError) {
        const newlyCompletedCount = error.result.completedCount;
        setCommittedTestsPrefix(prev => prev + newlyCompletedCount);
        setPartialFailureInfo({
          step: 'tests',
          completedCount: newlyCompletedCount,
          total: error.result.total,
          labRecordId: recordId,
          remainingTests: error.result.remainingTests,
        });
      } else {
        setPartialFailureInfo({
          step: 'tests',
          completedCount: 0,
          total: remainingTests.length,
          labRecordId: recordId,
          remainingTests,
        });
      }
      setSaveState('partial-failure');
    }
  };

  const handleRetry = () => {
    if (!partialFailureInfo) return;
    if (partialFailureInfo.step === 'record' && partialFailureInfo.patientId) {
      continueSaveFromRecord(partialFailureInfo.patientId);
    } else if (partialFailureInfo.step === 'tests' && partialFailureInfo.labRecordId && partialFailureInfo.remainingTests) {
      continueSaveFromTests(partialFailureInfo.labRecordId, labNumber || '', partialFailureInfo.remainingTests);
    }
  };

  const resetForm = () => {
    setPatientName("");
    setGender("");
    setDob("");
    setAge("");
    setTelephone("");
    setReferralExpanded(false);
    setReferralOption('None');
    setReferralDoctorId(undefined);
    setReferralHospitalId(undefined);
    setDoctorNameFreeText("");
    setHospitalNameFreeText("");
    setInsuranceName("");
    setTests([]);
    setTestSearchQuery("");
    setAmountPaid(0);
    setSaveState('idle');
    setSavedRecord(null);
    setPartialFailureInfo(null);
    setCommittedPatient(null);
    setCommittedRecord(null);
    setCommittedTestsPrefix(0);
    setNameError(false);
    setLabNumber("");
    setLabNumberExists(false);
  };

  if (saveState === 'success' && savedRecord) {
    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto mt-8">
        <div className="print:hidden text-center mb-8">
          <div className="size-16 bg-green-100 text-green-700 flex items-center justify-center rounded-full mb-6 mx-auto">
            <FileText size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Record Created Successfully</h2>
          <p className="text-muted-foreground mb-6">The patient registration and test selection have been saved.</p>
        </div>
        
        <ReceiptPreview recordData={savedRecord} />

        <div className="mt-8 print:hidden">
          <Button variant="default" size="lg" onClick={resetForm}>
            Register Another Patient
          </Button>
        </div>
      </div>
    );
  }

  const isSaving = saveState === 'saving-patient' || saveState === 'saving-record' || saveState === 'saving-tests';

  return (
    <div className="grid grid-cols-[1fr_260px] gap-4 items-start w-full">
      <div className="space-y-4 min-w-0">
        
        {/* LabRecordCard */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2">Lab Number</Label>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={labNumber} 
                      onChange={handleLabNumberChange}
                      placeholder="Leave blank to auto-generate"
                      className={`flex-1 font-mono text-lg font-bold ${labNumberExists ? "border-red-500 focus-visible:ring-red-500 bg-red-50 dark:bg-red-950/20 text-red-700" : "bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400"}`} 
                      disabled={!!committedRecord || isSaving}
                    />
                    <div className="px-4 py-2 border rounded-md bg-muted">
                      <Calendar className="text-muted-foreground" size={20} />
                    </div>
                  </div>
                  {checkingLabNumber && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Checking...</span>}
                  {labNumberExists && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12} /> This lab number is already assigned.</span>}
                </div>
              </div>
              <div className="flex items-end">
                <div className="w-full p-4 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Status</p>
                  <p className="text-sm font-bold text-green-700 flex items-center gap-1.5"><Circle className="h-2.5 w-2.5 fill-current" /> Active Registration</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PatientInfoForm */}
        <Card>
          <CardHeader className="pb-4 border-b mb-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              <CardTitle>Patient Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input 
                id="patientName"
                ref={patientNameRef}
                value={patientName} 
                onChange={(e) => {
                  setPatientName(e.target.value);
                  if (nameError) setNameError(false);
                }} 
                className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="Full Name"
                disabled={!!committedPatient || isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender} disabled={!!committedPatient || isSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob"
                type="date" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
                disabled={!!committedPatient || isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Age</Label>
              <Input 
                value={age} 
                readOnly 
                className="bg-muted text-muted-foreground w-24" 
                placeholder="Years"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input 
                id="telephone"
                type="tel" 
                value={telephone} 
                onChange={(e) => setTelephone(e.target.value)} 
                placeholder="Phone Number"
                disabled={!!committedPatient || isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* ReferralInfoCard */}
        {!referralExpanded ? (
          <div 
            className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setReferralExpanded(true)}
          >
            <p className="text-muted-foreground text-sm font-medium flex items-center justify-center gap-2">
              <Stethoscope size={16} />
              Referral Information — Expand (optional)
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-4 border-b mb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={20} className="text-teal-600" />
                <CardTitle>Referral Information</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReferralExpanded(false)}>Collapse</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Referral Option</Label>
                <Select 
                  value={referralOption} 
                  disabled={!!committedRecord || isSaving}
                  onValueChange={(val: any) => {
                    setReferralOption(val);
                    if (val === 'None') {
                      setReferralDoctorId(undefined);
                      setReferralHospitalId(undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select referral option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Doctor">Doctor</SelectItem>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {referralOption === 'Doctor' && (
                <div className="space-y-2">
                  <Label>Doctor Name</Label>
                  {doctors && doctors.length > 0 ? (
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={referralDoctorId || ''} 
                      onChange={e => setReferralDoctorId(e.target.value || undefined)}
                      disabled={!!committedRecord || isSaving}
                    >
                      <option value="">Select a Doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.doctorName}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      value={doctorNameFreeText} 
                      onChange={e => setDoctorNameFreeText(e.target.value)} 
                      placeholder="Enter doctor name"
                      disabled={!!committedRecord || isSaving}
                    />
                  )}
                </div>
              )}

              {referralOption === 'Hospital' && (
                <div className="space-y-2">
                  <Label>Hospital Name</Label>
                  {hospitals && hospitals.length > 0 ? (
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={referralHospitalId || ''} 
                      onChange={e => setReferralHospitalId(e.target.value || undefined)}
                      disabled={!!committedRecord || isSaving}
                    >
                      <option value="">Select a Hospital</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.hospitalName}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      value={hospitalNameFreeText} 
                      onChange={e => setHospitalNameFreeText(e.target.value)} 
                      placeholder="Enter hospital name"
                      disabled={!!committedRecord || isSaving}
                    />
                  )}
                </div>
              )}

              {referralOption === 'Insurance' && (
                <div className="space-y-2">
                  <Label>Insurance Name</Label>
                  <Input 
                    value={insuranceName} 
                    onChange={e => setInsuranceName(e.target.value)} 
                    placeholder="Enter insurance name"
                    disabled={!!committedRecord || isSaving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TestSelectionCard */}
        <Card>
          <CardHeader className="pb-4 border-b mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTube size={20} className="text-green-600" />
                <CardTitle>Test Selection</CardTitle>
              </div>
              <Badge variant="secondary">{tests.length} Selected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search catalog by name or department..."
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!!committedRecord || isSaving}
              />
            </div>

            <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-center w-12">
                      {/* Checkbox column header */}
                    </th>
                    <th className="p-2 text-left">Test Name</th>
                    <th className="p-2 text-left">Department</th>
                    <th className="p-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogTests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No tests found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalogTests.map((test) => {
                      const isSelected = tests.some(t => t.testId === test.id);
                      return (
                        <tr 
                          key={test.id} 
                          className={`border-b last:border-0 transition-colors ${isSelected ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-muted/30'}`}
                          onClick={() => toggleTestSelection(test)}
                        >
                          <td className="p-2 text-center">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleTestSelection(test)}
                              disabled={!!committedRecord || isSaving}
                            />
                          </td>
                          <td className="p-2 font-medium">{test.testName}</td>
                          <td className="p-2 text-muted-foreground">{test.department}</td>
                          <td className="p-2 text-right font-semibold text-primary">₵{test.testCost.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Partial Failure Alert */}
        {saveState === 'partial-failure' && partialFailureInfo && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Partial Save Failure</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-3 items-start">
              {partialFailureInfo.step === 'record' ? (
                <p>Patient was created successfully. Lab record creation failed. Click Retry to try again.</p>
              ) : (
                <p>Record created. {partialFailureInfo.completedCount} of {partialFailureInfo.total} tests were attached. Click Retry to attach the remaining {partialFailureInfo.remainingTests?.length} tests.</p>
              )}
              <Button size="sm" variant="outline" className="bg-white dark:bg-black text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleRetry} disabled={isSaving}>
                {isSaving ? "Retrying..." : "Retry"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearSelection} disabled={tests.length === 0 || isSaving || !!committedRecord}>
              <Trash2 size={16} />
              Clear Selection
            </Button>
          </div>
          <Button variant="default" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Record"}
          </Button>
        </div>

      </div>

      <PaymentPanel
        tests={tests}
        amountPaid={amountPaid}
        onAmountPaidChange={setAmountPaid}
        disabled={isSaving}
      />
    </div>
  );
}
