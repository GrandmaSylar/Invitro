import React, { useState, useEffect } from "react";
import { showConfirm, showSuccess } from "../../stores/useDialogStore";
import { Search, ChevronDown, ChevronUp, ArrowLeft, User, Phone, Calendar, FileText, ArrowDownAz, ArrowUpZa, ClipboardCheck, Loader2, Edit } from "lucide-react";
import { usePatientsList, useUpdatePatient } from "../../hooks/usePatients";
import { useLabRecords, useLabRecord, useLabRecordTests, useUpdateLabRecord, usePayments, useRecordPayment } from "../../hooks/useLabRecords";
import { useResultsByRecord } from "../../hooks/useResults";
import { usePermission } from "../../hooks/usePermission";
import { labRecordService } from "../../services/labRecordService";
import type { Patient, LabRecord, LabRecordTest } from "../../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Button } from "../../app/components/ui/button";
import { Badge } from "../../app/components/ui/badge";
import { Label } from "../../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../app/components/ui/dialog";
import { ReceiptPreview, ReceiptData } from "./ReceiptPreview";
import { ResultPreview } from "./ResultPreview";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function ExistingPatientTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [showAllRecordsFor, setShowAllRecordsFor] = useState<string | null>(null);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'created_at' | 'patient_name' | 'dob' | 'age'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const canEdit = usePermission('patients.edit');
  const canDelete = usePermission('patients.delete');

  const { patients, isLoading, isError, error } = usePatientsList({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    sortBy,
    sortDirection,
    limit: 50
  });

  if (openRecordId) {
    return (
      <RecordDetailView
        recordId={openRecordId}
        canEdit={canEdit}
        canDelete={canDelete}
        onBack={() => setOpenRecordId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 dark:bg-primary/20 border-l-4 border-primary p-5 shadow-sm rounded-md">
        <div className="flex items-center gap-3">
          <User className="text-primary dark:text-white" size={24} />
          <div>
            <h3 className="font-bold text-primary dark:text-white">Existing Patient Search</h3>
            <p className="text-sm text-primary/80 dark:text-white/80">Search for patients to view their laboratory history.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Patient</CardTitle>
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
            isLoading={isLoading}
            isError={isError}
            error={error}
            searchQuery={searchQuery}
            expandedPatientId={expandedPatientId}
            setExpandedPatientId={setExpandedPatientId}
            showAllRecordsFor={showAllRecordsFor}
            setShowAllRecordsFor={setShowAllRecordsFor}
            setOpenRecordId={setOpenRecordId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function PatientSearchBar({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (val: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
      <Input
        type="text"
        placeholder="Type patient name or phone number…"
        className="pl-10 h-12 text-lg"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}

export function PatientResultsList({ 
  patients, isLoading, isError, error, searchQuery, expandedPatientId, setExpandedPatientId, 
  showAllRecordsFor, setShowAllRecordsFor, setOpenRecordId 
}: { 
  patients: Patient[], isLoading: boolean, isError: boolean, error: unknown, searchQuery: string, 
  expandedPatientId: string | null, setExpandedPatientId: (id: string | null) => void,
  showAllRecordsFor: string | null, setShowAllRecordsFor: (id: string | null) => void,
  setOpenRecordId: (id: string | null) => void
}) {
  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to search patients. {error instanceof Error ? error.message : ''}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground animate-pulse">
        Searching…
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No patients found matching your search.
      </div>
    );
  }

  return (
    <div className="border rounded-md divide-y">
      {patients.map(patient => (
        <PatientRow
          key={patient.id}
          patient={patient}
          isExpanded={expandedPatientId === patient.id}
          onToggle={() => {
            if (expandedPatientId === patient.id) {
              setExpandedPatientId(null);
            } else {
              setExpandedPatientId(patient.id);
              setShowAllRecordsFor(null);
            }
          }}
          showAll={showAllRecordsFor === patient.id}
          onShowAll={() => setShowAllRecordsFor(patient.id)}
          onOpenRecord={setOpenRecordId}
        />
      ))}
    </div>
  );
}

export function PatientRow({ 
  patient, isExpanded, onToggle, showAll, onShowAll, onOpenRecord 
}: { 
  patient: Patient, isExpanded: boolean, onToggle: () => void, 
  showAll: boolean, onShowAll: () => void, onOpenRecord: (id: string) => void 
}) {
  return (
    <div className="bg-card">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-base">{patient.patientName}</div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {patient.gender && <span className="flex items-center gap-1"><User size={14} /> {patient.gender}</span>}
            {patient.dob && <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(patient.dob).toLocaleDateString()}</span>}
            {patient.telephone && <span className="flex items-center gap-1"><Phone size={14} /> {patient.telephone}</span>}
          </div>
        </div>
        <div>
          {isExpanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 bg-muted/20 border-t border-border/50">
          <RecordHistory 
            patientId={patient.id} 
            showAll={showAll} 
            onShowAll={onShowAll} 
            onOpen={onOpenRecord} 
          />
        </div>
      )}
    </div>
  );
}

export function RecordHistory({ 
  patientId, showAll, onShowAll, onOpen 
}: { 
  patientId: string, showAll: boolean, onShowAll: () => void, onOpen: (id: string) => void 
}) {
  const { data: records, isLoading, isError } = useLabRecords({ patientId });

  if (isLoading) return <div className="py-4 text-sm text-muted-foreground">Loading history…</div>;
  if (isError) return <div className="py-4 text-sm text-destructive">Failed to load laboratory records.</div>;
  if (!records || records.length === 0) return <div className="py-4 text-sm text-muted-foreground">No laboratory records found for this patient.</div>;

  const displayRecords = showAll ? records : records.slice(0, 1);
  const hasMore = records.length > 1;

  return (
    <div className="mt-2 pt-2">
      <div className="space-y-3">
        {displayRecords.map(record => (
          <RecordItem key={record.id} record={record} onOpen={() => onOpen(record.id)} />
        ))}
      </div>
      {!showAll && hasMore && (
        <button
          onClick={onShowAll}
          className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1"
        >
          View all history ({records.length} records) ›
        </button>
      )}
    </div>
  );
}

export function RecordItem({ record, onOpen }: { record: LabRecord, onOpen: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-background border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded">
          <FileText className="text-primary dark:text-primary-foreground" size={20} />
        </div>
        <div>
          <div className="font-mono text-sm font-semibold text-foreground">{record.labNumber}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <span>{new Date(record.recordDate).toLocaleString()}</span>
            <span>•</span>
            <span>{record.testCount ?? 0} {(record.testCount === 1) ? 'test' : 'tests'}</span>
            <span>•</span>
            <span className="font-medium text-foreground">₵{record.totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={
          record.status === 'Closed' ? 'default' :
          record.status === 'Active' ? 'secondary' :
          'destructive'
        }>
          {record.status}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onOpen} className="text-primary hover:text-primary hover:bg-primary/10">
          Open →
        </Button>
      </div>
    </div>
  );
}

function RecordDetailView({ 
  recordId, canEdit, canDelete, onBack 
}: { 
  recordId: string, canEdit: boolean, canDelete: boolean, onBack: () => void 
}) {
  const { data: record, isLoading: recordLoading, isError: recordError } = useLabRecord(recordId);
  const { data: tests, isLoading: testsLoading, isError: testsError } = useLabRecordTests(recordId);
  const { data: savedResults = [], isLoading: resultsLoading } = useResultsByRecord(recordId);
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(recordId);
  const updateRecord = useUpdateLabRecord();
  const updatePatient = useUpdatePatient();
  const recordPayment = useRecordPayment();
  const qc = useQueryClient();
  const [showReceipt, setShowReceipt] = useState<ReceiptData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showReceiptsView, setShowReceiptsView] = useState(false);

  // ── Edit Patient Info Dialog State ──
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // ── Edit Payment Dialog State ──
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editAmountPaid, setEditAmountPaid] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  if (recordLoading || testsLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Search
        </Button>
        <div className="p-8 text-center text-muted-foreground animate-pulse">Loading record details…</div>
      </div>
    );
  }

  if (recordError || testsError || !record) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Search
        </Button>
        <div className="p-8 text-center text-destructive">
          Failed to load record details. Please try again.
        </div>
      </div>
    );
  }

  const patient = record.patient;

  if (showReceipt) {
    return <ReceiptPreview recordData={showReceipt} onClose={() => setShowReceipt(null)} />;
  }

  if (showReceiptsView) {
    return (
      <ReceiptsListView
        record={record}
        tests={tests || []}
        payments={payments}
        onBack={() => setShowReceiptsView(false)}
        onViewReceipt={(receipt) => setShowReceipt(receipt)}
      />
    );
  }

  if (showResults) {
    return (
      <ResultPreview
        record={record}
        results={savedResults}
        onClose={() => setShowResults(false)}
        backLabel="Back to Record Details"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Search
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowResults(true)} className="flex items-center gap-2" disabled={resultsLoading}>
            <ClipboardCheck size={16} />
            View Results{savedResults.length > 0 ? ` (${savedResults.length})` : ''}
          </Button>
          <Button variant="outline" onClick={() => setShowReceiptsView(true)} className="flex items-center gap-2">
            <Printer size={16} />
            View Receipts
          </Button>
        </div>
      </div>

      {/* Patient Banner */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {patient?.patientName?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient?.patientName || 'Unknown Patient'}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><User size={14} /> {patient?.gender || '—'}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {patient?.dob ? new Date(patient?.dob).toLocaleDateString() : '—'}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {patient?.telephone || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Lab Number</p>
              <p className="font-mono text-lg">{record.labNumber}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Status</p>
              <Select 
                value={record.status} 
                onValueChange={async (val) => {
                  const confirmed = await showConfirm({
                    title: "Change Status",
                    description: `Change record status to "${val}"?`,
                    confirmText: "Change"
                  });
                  if (confirmed) {
                    updateRecord.mutate({ id: record.id, updates: { status: val } });
                  }
                }}
                disabled={updateRecord.isPending}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-muted-foreground">Date</p>
              <p>{new Date(record.recordDate).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests Ordered */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Tests Ordered</span>
            <Badge>{tests?.length || 0} tests</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 gap-4 bg-muted/50 px-4 py-3 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wide">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Test Name</div>
            <div className="col-span-3">Department</div>
            <div className="col-span-2 text-right">Cost</div>
          </div>
          {tests?.map((test, idx) => (
            <div key={test.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border text-sm hover:bg-muted/20 transition-colors">
              <div className="col-span-1 text-center text-muted-foreground font-semibold">{idx + 1}</div>
              <div className="col-span-6 font-medium">{test.testName}</div>
              <div className="col-span-3 text-muted-foreground">{test.department}</div>
              <div className="col-span-2 text-right font-semibold">₵{test.testCost.toFixed(2)}</div>
            </div>
          ))}
          {(!tests || tests.length === 0) && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No tests found for this record.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex justify-between items-center">
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-muted/20 border-b">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Subtotal</p>
              <p className="text-lg font-semibold">₵{record.subtotal.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Total Cost</p>
              <p className="text-lg font-bold text-primary">₵{record.totalCost.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Amount Paid</p>
              <p className="text-lg font-bold text-green-600">₵{record.amountPaid.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Arrears</p>
              <p className={`text-lg font-bold ${record.arrears > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                ₵{record.arrears.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Payment Transactions</h3>
            {paymentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading payments...</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center border rounded-lg p-3 hover:bg-muted/10 transition-colors">
                    <div>
                      <div className="font-mono text-sm font-semibold">{payment.receiptNumber}</div>
                      <div className="text-xs text-muted-foreground">{new Date(payment.paymentDate).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-green-600">₵{payment.amount.toFixed(2)}</div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setShowReceipt({
                          labNumber: record.labNumber,
                          patientName: patient?.patientName || 'Unknown',
                          tests: tests?.map(t => ({ testName: t.testName, testCost: t.testCost })) || [],
                          totalCost: record.totalCost,
                          amountPaid: record.amountPaid, // Need to handle cumulative correctly if printing historical
                          arrears: record.arrears,
                          recordDate: record.recordDate,
                          receiptNumber: payment.receiptNumber,
                          paymentAmount: payment.amount,
                          paymentDate: payment.paymentDate
                        });
                      }}>
                        <Printer size={14} className="mr-1" /> Print
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(canEdit || canDelete) && (
        <div className="flex gap-4 pt-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setEditName(patient?.patientName || '');
                  setEditGender(patient?.gender || '');
                  setEditDob(patient?.dob || '');
                  setEditPhone(patient?.telephone || '');
                  setEditPatientOpen(true);
                }}
              >
                <Edit size={14} />
                Edit Patient Info
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setEditAmountPaid(String(record.arrears));
                  setEditPaymentOpen(true);
                }}
              >
                <Edit size={14} />
                Record Payment
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="destructive" className="ml-auto" onClick={async () => {
              const confirmed = await showConfirm({
                title: "Delete Record",
                description: "Are you sure you want to delete this entire lab record? This action is permanent and will delete all associated tests and results.",
                confirmText: "Delete",
                variant: "destructive"
              });
              if (confirmed) {
                // Placeholder for delete logic if not implemented, or just toast for now
                toast.error("Delete record logic is pending implementation.");
              }
            }}>Delete Record</Button>
          )}
        </div>
      )}

      {/* ── Edit Patient Info Dialog ── */}
      <Dialog open={editPatientOpen} onOpenChange={setEditPatientOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Information</DialogTitle>
            <DialogDescription>Update the patient's personal details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Patient name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <Select value={editGender} onValueChange={setEditGender}>
                <SelectTrigger id="edit-gender">
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
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editDob}
                onChange={(e) => setEditDob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="0XX XXX XXXX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPatientOpen(false)}>Cancel</Button>
            <Button
              disabled={updatePatient.isPending || !editName.trim()}
              onClick={async () => {
                if (!patient) return;
                const confirmed = await showConfirm({
                  title: "Update Patient",
                  description: `Update details for patient "${patient.patientName}"?`,
                  confirmText: "Update"
                });
                if (!confirmed) return;
                updatePatient.mutate(
                  {
                    id: patient.id,
                    updates: {
                      patientName: editName.trim(),
                      gender: editGender || undefined,
                      dob: editDob || undefined,
                      telephone: editPhone || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      showSuccess({ title: "Patient Updated", description: 'Patient info updated successfully.' });
                      qc.invalidateQueries({ queryKey: ['labRecords'] });
                      qc.invalidateQueries({ queryKey: ['patients'] });
                      setEditPatientOpen(false);
                    },
                    onError: (err: any) => {
                      toast.error(err.message || 'Failed to update patient info.');
                    },
                  }
                );
              }}
            >
              {updatePatient.isPending && <Loader2 className="animate-spin mr-2" size={14} />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Record Payment Dialog ── */}
      <Dialog open={editPaymentOpen} onOpenChange={setEditPaymentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter the payment amount. Total cost: ₵{record.totalCost.toFixed(2)}, Current Arrears: ₵{record.arrears.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Payment Amount (₵)</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={editAmountPaid}
                onChange={(e) => setEditAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              New Arrears will be: <span className="font-semibold">₵{Math.max(0, record.arrears - (parseFloat(editAmountPaid) || 0)).toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPaymentOpen(false)}>Cancel</Button>
            <Button
              disabled={recordPayment.isPending}
              onClick={async () => {
                const amount = parseFloat(editAmountPaid);
                if (isNaN(amount) || amount <= 0) {
                  toast.error('Please enter a valid positive amount.');
                  return;
                }
                if (amount > record.arrears) {
                  toast.error('Amount exceeds current arrears.');
                  return;
                }

                const confirmed = await showConfirm({
                  title: "Record Payment",
                  description: `Record payment of ₵${amount.toFixed(2)} for ${patient?.patientName}?`,
                  confirmText: "Record Payment"
                });
                if (!confirmed) return;

                recordPayment.mutate(
                  { labRecordId: record.id, amount },
                  {
                    onSuccess: (paymentData) => {
                      showSuccess({ title: "Payment Recorded", description: 'Payment recorded successfully.' });
                      setEditPaymentOpen(false);
                      setEditAmountPaid('');
                      setShowReceipt({
                        labNumber: record.labNumber,
                        patientName: patient?.patientName || 'Unknown',
                        tests: tests?.map(t => ({ testName: t.testName, testCost: t.testCost })) || [],
                        totalCost: record.totalCost,
                        amountPaid: record.amountPaid + amount,
                        arrears: Math.max(0, record.arrears - amount),
                        recordDate: record.recordDate,
                        receiptNumber: paymentData.receiptNumber,
                        paymentAmount: paymentData.amount,
                        paymentDate: paymentData.paymentDate
                      });
                    },
                    onError: (err: any) => {
                      toast.error(err.message || 'Failed to record payment.');
                    }
                  }
                );
              }}
            >
              {recordPayment.isPending && <Loader2 className="animate-spin mr-2" size={14} />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Receipts List View ──
function ReceiptsListView({
  record,
  tests,
  payments,
  onBack,
  onViewReceipt
}: {
  record: LabRecord,
  tests: LabRecordTest[],
  payments: any[],
  onBack: () => void,
  onViewReceipt: (receiptData: ReceiptData) => void
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredPayments = payments.filter(p => {
    const pDate = new Date(p.paymentDate).getTime();
    if (fromDate && pDate < new Date(fromDate).getTime()) return false;
    // For "toDate", include the entire day
    if (toDate && pDate > new Date(toDate).getTime() + 86400000) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to Record
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle>All Receipts / Payments</CardTitle>
          <div className="flex gap-4 mt-4 text-sm items-center">
            <div className="flex items-center gap-2">
              <Label>From:</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-auto h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label>To:</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-auto h-8" />
            </div>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate(''); }}>Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No receipts found for the selected date range.</div>
          ) : (
            <div className="divide-y">
              {filteredPayments.map(payment => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div>
                    <div className="font-semibold">{payment.receiptNumber}</div>
                    <div className="text-sm text-muted-foreground">{new Date(payment.paymentDate).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-green-600">₵{payment.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Payment</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      onViewReceipt({
                        labNumber: record.labNumber,
                        patientName: record.patient?.patientName || 'Unknown',
                        tests: tests.map(t => ({ testName: t.testName, testCost: t.testCost })),
                        totalCost: record.totalCost,
                        amountPaid: record.amountPaid, // Use current aggregate
                        arrears: record.arrears,
                        recordDate: record.recordDate,
                        receiptNumber: payment.receiptNumber,
                        paymentAmount: payment.amount,
                        paymentDate: payment.paymentDate
                      });
                    }}>
                      <Printer size={14} className="mr-2" />
                      Preview Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
