import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { LabBanner } from "./LabBanner";

interface OrderedTest {
  testName: string;
  department: string;
  referenceRange: string;
  unit: string;
}

interface PatientRecord {
  labNumber: string;
  patientName: string;
  date: string;
  orderedTests: OrderedTest[];
}

interface ResultRow {
  testName: string;
  department: string;
  referenceRange: string;
  unit: string;
  result: string;
  flag: "Normal" | "High" | "Low" | "Critical";
}

const MOCK_PATIENTS: PatientRecord[] = [
  {
    labNumber: "A1726021073491",
    patientName: "John Smith",
    date: "2023-10-25",
    orderedTests: [
      { testName: "Aspartate Aminotransferase (AST)", department: "Biochemistry", referenceRange: "0-38", unit: "U/L" },
      { testName: "Alanine Aminotransferase (ALT)", department: "Biochemistry", referenceRange: "0-40", unit: "U/L" },
      { testName: "Albumin Test", department: "Biochemistry", referenceRange: "35-53", unit: "g/L" },
    ]
  },
  {
    labNumber: "A1726021073492",
    patientName: "Emily Chen",
    date: "2023-10-26",
    orderedTests: [
      { testName: "Complete Blood Count (CBC)", department: "Hematology", referenceRange: "4.5-5.9", unit: "x10^12/L" },
      { testName: "Glucose Fasting", department: "Biochemistry", referenceRange: "70-99", unit: "mg/dL" },
    ]
  },
  {
    labNumber: "A1726021073493",
    patientName: "Michael Johnson",
    date: "2023-10-26",
    orderedTests: [
      { testName: "Thyroid Panel (TSH, T3, T4)", department: "Endocrinology", referenceRange: "0.4-4.0", unit: "mIU/L" },
      { testName: "Lipid Panel", department: "Biochemistry", referenceRange: "<200", unit: "mg/dL" },
      { testName: "HbA1c (Glycated Hemoglobin)", department: "Biochemistry", referenceRange: "4.0-5.6", unit: "%" },
      { testName: "Vitamin D Test", department: "Biochemistry", referenceRange: "30-100", unit: "ng/mL" }
    ]
  },
  {
    labNumber: "A1726021073494",
    patientName: "Sarah Williams",
    date: "2023-10-27",
    orderedTests: [
      { testName: "Creatinine Test", department: "Biochemistry", referenceRange: "0.6-1.1", unit: "mg/dL" },
      { testName: "Blood Urea Nitrogen (BUN)", department: "Biochemistry", referenceRange: "7-20", unit: "mg/dL" },
    ]
  }
];

export function ResultsEntry() {
  const [lookupQuery, setLookupQuery] = useState("");
  const [matchedPatient, setMatchedPatient] = useState<PatientRecord | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);

  const handleFindPatient = () => {
    const query = lookupQuery.trim().toLowerCase();
    if (!query) {
      setMatchedPatient(null);
      setResultRows([]);
      setNoMatch(false);
      return;
    }

    const match = MOCK_PATIENTS.find(
      p => p.labNumber.toLowerCase() === query || p.patientName.toLowerCase().includes(query)
    );

    if (match) {
      setMatchedPatient(match);
      setResultRows(
        match.orderedTests.map(test => ({
          ...test,
          result: "",
          flag: "Normal"
        }))
      );
      setNoMatch(false);
    } else {
      setMatchedPatient(null);
      setResultRows([]);
      setNoMatch(true);
    }
  };

  const handleSubmit = () => {
    if (matchedPatient) {
      toast.success(`Results submitted for ${matchedPatient.patientName}.`);
    }
    setLookupQuery("");
    setMatchedPatient(null);
    setResultRows([]);
    setNoMatch(false);
  };

  const updateResultRow = (index: number, field: keyof ResultRow, value: string) => {
    setResultRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  return (
    <div className="p-8 h-full bg-background">
      <div className="bg-card shadow-sm h-full flex flex-col border border-border">
        <LabBanner className="border-b-2 border-border" />

        {/* Page title strip */}
        <div className="px-6 py-4 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-foreground">Results Entry</h2>
          <p className="text-sm text-muted-foreground">Look up a patient by lab number or name, then enter test results</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-6 bg-background space-y-6">

          {/* Lookup card */}
          <div className="bg-card border-2 border-border p-6 shadow-sm">
            <label className="block text-sm font-semibold text-foreground mb-2">Patient Lookup</label>
            <div className="flex gap-3 mt-2">
              <input
                data-element-id="patient-lookup-input"
                className="flex-1 px-4 py-3 border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFindPatient()}
                placeholder="Enter Lab Number or Patient Name..."
              />
              <button 
                data-element-id="find-patient-btn"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 font-semibold transition-colors"
                onClick={handleFindPatient}
              >
                <Search size={18} />
                Find Patient
              </button>
            </div>

            {/* No-match inline message */}
            {noMatch && (
              <p className="mt-3 text-sm font-medium text-red-600">
                No patient found. Check the lab number or name and try again.
              </p>
            )}
          </div>

          {/* Patient banner — only when matchedPatient !== null */}
          {matchedPatient && (
            <div className="bg-primary/10 border border-primary/20 p-5 flex flex-wrap gap-8 shadow-sm">
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Patient Name</p>
                <p className="text-base font-bold text-foreground">{matchedPatient.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Lab Number</p>
                <p className="text-base font-bold text-foreground font-mono">{matchedPatient.labNumber}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Date</p>
                <p className="text-base font-bold text-foreground">{matchedPatient.date}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Tests Ordered</p>
                <p className="text-base font-bold text-foreground">{matchedPatient.orderedTests.length}</p>
              </div>
            </div>
          )}

          {/* Results table — only when resultRows.length > 0 */}
          {resultRows.length > 0 && (
            <div className="bg-card border-2 border-border p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b-2 border-border">Enter Test Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted border-b-2 border-border">
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
                      <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
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
                            className="w-full px-3 py-2 border-2 border-border bg-background focus:outline-none focus:border-primary transition-colors font-mono font-medium text-foreground"
                            value={row.result}
                            onChange={e => updateResultRow(i, "result", e.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{row.unit}</td>
                        <td className="py-3 px-4">
                          <select
                            className={`w-full px-3 py-2 border-2 focus:outline-none transition-colors font-semibold text-sm ${
                              row.flag === "Normal" ? "border-border bg-background text-foreground focus:border-primary" :
                              row.flag === "High" ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400 focus:border-orange-500" :
                              row.flag === "Low" ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 focus:border-amber-500" :
                              "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 focus:border-red-500"
                            }`}
                            value={row.flag}
                            onChange={e => updateResultRow(i, "flag", e.target.value)}
                          >
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Low">Low</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <button 
                  data-element-id="submit-results-btn"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 font-bold text-lg transition-all shadow-md hover:shadow-lg border-b-4 border-primary/50"
                  onClick={handleSubmit}
                >
                  Submit Results
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
