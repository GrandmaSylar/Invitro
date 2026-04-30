import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, ArrowLeft, User, Phone, Calendar, FileText } from "lucide-react";
import { usePatientSearch } from "../../hooks/usePatients";
import { useLabRecords, useLabRecord, useLabRecordTests } from "../../hooks/useLabRecords";
import { usePermission } from "../../hooks/usePermission";
import type { Patient, LabRecord, LabRecordTest } from "../../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Button } from "../../app/components/ui/button";
import { Badge } from "../../app/components/ui/badge";

export function ExistingPatientTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [showAllRecordsFor, setShowAllRecordsFor] = useState<string | null>(null);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  const canEdit = usePermission('patients.edit');
  const canDelete = usePermission('patients.delete');

  const { patients, isLoading, isError, error } = usePatientSearch(searchQuery);

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
      <div className="bg-teal-500/10 border-l-4 border-teal-600 p-5 shadow-sm rounded">
        <div className="flex items-center gap-3">
          <User className="text-teal-700" size={24} />
          <div>
            <h3 className="font-bold text-teal-700 dark:text-teal-400">Existing Patient Search</h3>
            <p className="text-sm text-teal-700 dark:text-teal-400">Search for patients to view their laboratory history.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PatientSearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={(val) => {
              setSearchQuery(val);
              if (expandedPatientId) setExpandedPatientId(null);
            }} 
          />
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

function PatientSearchBar({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (val: string) => void }) {
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

function PatientResultsList({ 
  patients, isLoading, isError, error, searchQuery, expandedPatientId, setExpandedPatientId, 
  showAllRecordsFor, setShowAllRecordsFor, setOpenRecordId 
}: { 
  patients: Patient[], isLoading: boolean, isError: boolean, error: unknown, searchQuery: string, 
  expandedPatientId: string | null, setExpandedPatientId: (id: string | null) => void,
  showAllRecordsFor: string | null, setShowAllRecordsFor: (id: string | null) => void,
  setOpenRecordId: (id: string | null) => void
}) {
  if (searchQuery.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please enter at least 2 characters to search.
      </div>
    );
  }

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

function PatientRow({ 
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

function RecordHistory({ 
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

function RecordItem({ record, onOpen }: { record: LabRecord, onOpen: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-background border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-500/10 rounded">
          <FileText className="text-blue-600" size={20} />
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
        <Badge variant={record.status === 'Completed' ? 'default' : 'secondary'}>
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} />
        Back to Search
      </Button>

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
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(canEdit || canDelete) && (
        <div className="flex gap-4 pt-2">
          {canEdit && (
            <>
              <Button variant="outline">Edit Patient Info</Button>
              <Button variant="outline">Edit Payment</Button>
            </>
          )}
          {canDelete && (
            <Button variant="destructive" className="ml-auto">Delete Record</Button>
          )}
        </div>
      )}
    </div>
  );
}
