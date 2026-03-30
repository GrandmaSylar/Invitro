import { useState } from "react";
import { ClipboardList, Pill, Trash2, Edit, Save, Plus, FlaskConical } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { LabBanner } from "./LabBanner";
import { Button } from "./ui/button";

type Tab = "test-list" | "antibiotics";

interface AntibioticEntry {
  id: string;
  antibioticId: string;
  antibioticName: string;
}

export function TestRegister() {
  const [activeTab, setActiveTab] = useState<Tab>("test-list");
  const [searchAntibioticId, setSearchAntibioticId] = useState("F0045");
  const [antibioticName, setAntibioticName] = useState("");
  const [includeComprehensive, setIncludeComprehensive] = useState(false);
  const [parameterOrderId, setParameterOrderId] = useState("10");
  const [testId, setTestId] = useState("Id_262");
  const [selectedParameter, setSelectedParameter] = useState<number | null>(null);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [focusedParameterIndex, setFocusedParameterIndex] = useState<number | null>(null);
  const [focusedTestIndex, setFocusedTestIndex] = useState<number | null>(null);
  const [recentEntries] = useState<AntibioticEntry[]>([
    { id: "1", antibioticId: "F0045", antibioticName: "" },
    { id: "2", antibioticId: "F0045", antibioticName: "" },
  ]);

  const parameterData = [
    { parameterName: "AST", units: "U/L", referenceRange: "0.0 - 38.0" },
    { parameterName: "ALT", units: "U/L", referenceRange: "0.0 - 40.0" },
    { parameterName: "ALP", units: "U/L", referenceRange: "<270" },
    { parameterName: "ALBUMIN", units: "g/L", referenceRange: "35.0 - 53.0" },
    { parameterName: "TOTAL PROTEIN", units: "g/L", referenceRange: "66.0 - 83.0" },
    { parameterName: "TOTAL BILIRUBIN", units: "umol/L", referenceRange: "3.4 - 20.0" },
    { parameterName: "DIRECT BILIRUBIN", units: "umol/L", referenceRange: "0.0 - 6.8" },
  ];

  const testNameData = [
    { testName: "24HR URINE CREATININE", department: "BIOCHEMISTRY", testCost: "0.0000" },
    { testName: "24HR URINE PROTEIN", department: "BIOCHEMISTRY", testCost: "50.0000" },
    { testName: "ANA (Anti-Nuclear Antibody)", department: "IMMUNOSEROLOGY", testCost: "50.0000" },
    { testName: "ANF", department: "IMMUNOSEROLOGY", testCost: "0.0000" },
  ];

  const tabs = [
    { id: "test-list" as Tab, label: "Test List", icon: ClipboardList, color: "blue" },
    { id: "antibiotics" as Tab, label: "Antibiotics", icon: Pill, color: "purple" },
  ];

  return (
    <div className="p-8 h-full">
      <div className="bg-card h-full flex flex-col rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Lab Header Banner */}
        <LabBanner className="border-b border-border" />

        {/* Tabs Header */}
        <div className="border-b border-border px-6 pt-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-150 whitespace-nowrap border-b-2 ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary"
                      : "text-muted-foreground hover:bg-muted/50 border-transparent"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col">
          {activeTab === "test-list" && (
            <div className="space-y-6 bg-background p-6">
              {/* Parameter Name Section */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Saved.");
                }}
                className="bg-card border border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="border-b border-border pb-2 mb-4">
                  <h3 className="text-base font-semibold text-foreground">Parameter Name</h3>
                </div>
                
                {/* Parameter Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Parameter Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Units</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reference Range</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="blue" className="w-full">
                      Add
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Parameter Order ID</label>
                    <input 
                      type="text"
                      value={parameterOrderId}
                      onChange={(e) => setParameterOrderId(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Trimester Type</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                </div>

                {/* Parameter Table */}
                {parameterData.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30 mb-4">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No parameters registered yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Fill in the form above and click Add to create a parameter</p>
                  </div>
                ) : (
                <div 
                  className="border border-border max-h-48 overflow-auto outline-none rounded"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setFocusedParameterIndex(prev => {
                        const nextIndex = prev === null ? 0 : Math.min(prev + 1, parameterData.length - 1);
                        setSelectedParameter(nextIndex);
                        return nextIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setFocusedParameterIndex(prev => {
                        const nextIndex = prev === null ? parameterData.length - 1 : Math.max(prev - 1, 0);
                        setSelectedParameter(nextIndex);
                        return nextIndex;
                      });
                    }
                  }}
                >
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0 border-b-2 border-border">
                      <tr>
                        <th className="border-r border-border px-2 py-1 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Parameter Name</th>
                        <th className="border-r border-border px-2 py-1 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Units</th>
                        <th className="px-2 py-1 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parameterData.map((param, index) => (
                        <tr 
                          key={index} 
                          onClick={() => setSelectedParameter(index)}
                          className={`border-t border-border cursor-pointer transition-colors ${
                            selectedParameter === index 
                              ? 'bg-primary/10 border-l-4 border-l-primary' 
                              : index === focusedParameterIndex 
                                ? 'bg-muted ring-2 ring-inset ring-blue-500'
                                : index % 2 === 0
                                  ? 'bg-background hover:bg-muted/50'
                                  : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <td className="border-r border-border px-2 py-1 text-xs text-foreground">{param.parameterName}</td>
                          <td className="border-r border-border px-2 py-1 text-xs text-muted-foreground">{param.units}</td>
                          <td className="px-2 py-1 text-xs text-muted-foreground">{param.referenceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}

                {/* Button Row */}
                <div className="mt-4 flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="red"
                    size="sm"
                    onClick={() => { if (selectedParameter !== null) { setSelectedParameter(null); toast("Deleted."); } }}
                    disabled={selectedParameter === null}
                  >
                    Delete Set Parameter
                  </Button>
                  <Button 
                    type="button"
                    variant="red"
                    size="sm"
                    onClick={() => toast("Deleted.")}
                  >
                    Delete All Parameters
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { if (selectedParameter !== null) toast("Edit mode."); }}
                    disabled={selectedParameter === null}
                  >
                    Edit Parameter
                  </Button>
                  <Button 
                    type="submit"
                    variant="green"
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </form>

              {/* Test Name Section */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Saved.");
                }}
                className="bg-card border border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="border-b border-border pb-2 mb-4">
                  <h3 className="text-base font-semibold text-foreground">Test Name</h3>
                </div>
                
                {/* Test Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test ID</label>
                    <input 
                      type="text" 
                      value={testId} 
                      onChange={(e) => setTestId(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Department</label>
                    <select className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded">
                      <option></option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Result Header</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reference Range</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test Cost</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={includeComprehensive}
                        onCheckedChange={(checked) => setIncludeComprehensive(checked === true)}
                      />
                      <span className="text-xs text-muted-foreground">Include in Comprehensive Screening</span>
                    </label>
                  </div>
                </div>

                {/* Test Name Table */}
                {testNameData.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30 mb-4">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No tests registered yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Fill in the form above and click Add to create a test</p>
                  </div>
                ) : (
                <div 
                  className="border border-border max-h-48 overflow-auto mb-4 outline-none rounded"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setFocusedTestIndex(prev => {
                        const nextIndex = prev === null ? 0 : Math.min(prev + 1, testNameData.length - 1);
                        setSelectedTest(nextIndex);
                        return nextIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setFocusedTestIndex(prev => {
                        const nextIndex = prev === null ? testNameData.length - 1 : Math.max(prev - 1, 0);
                        setSelectedTest(nextIndex);
                        return nextIndex;
                      });
                    }
                  }}
                >
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0 border-b-2 border-border">
                      <tr>
                        <th className="border-r border-border px-2 py-1 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">TestName</th>
                        <th className="border-r border-border px-2 py-1 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Department</th>
                        <th className="px-2 py-1 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">TestCost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testNameData.map((test, index) => (
                        <tr 
                          key={index} 
                          onClick={() => setSelectedTest(index)}
                          className={`border-t border-border cursor-pointer transition-colors ${
                            selectedTest === index 
                              ? 'bg-primary/10 border-l-4 border-l-primary' 
                              : index === focusedTestIndex 
                                ? 'bg-muted ring-2 ring-inset ring-blue-500'
                                : index % 2 === 0
                                  ? 'bg-background hover:bg-muted/50'
                                  : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <td className="border-r border-border px-2 py-1 text-xs text-foreground">{test.testName}</td>
                          <td className="border-r border-border px-2 py-1 text-xs text-muted-foreground">{test.department}</td>
                          <td className="px-2 py-1 text-xs text-muted-foreground">{test.testCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}

                {/* Button Row */}
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="red"
                    size="sm"
                    onClick={() => { if (selectedTest !== null) { setSelectedTest(null); toast("Deleted."); } }}
                    disabled={selectedTest === null}
                  >
                    Delete Test
                  </Button>
                  <Button 
                    type="button"
                    variant="red"
                    size="sm"
                    onClick={() => toast("Deleted.")}
                  >
                    Delete All Tests
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { if (selectedTest !== null) toast("Edit mode."); }}
                    disabled={selectedTest === null}
                  >
                    Edit Test
                  </Button>
                  <Button 
                    type="submit"
                    variant="green"
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "antibiotics" && (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header Section */}
              <div className="bg-card border border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="border-l-4 border-purple-600 pl-4">
                  <h2 className="text-2xl font-bold text-foreground">Antibiotic Registry</h2>
                  <p className="text-muted-foreground mt-2">Manage antibiotic inventory and records</p>
                </div>
              </div>

              {/* Antibiotic Entry Form */}
              <div className="bg-card border border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="border-t-2 border-purple-600 pt-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-muted-foreground mb-2">
                        Antibiotic ID:
                      </label>
                      <input
                        type="text"
                        value={searchAntibioticId}
                        onChange={(e) => setSearchAntibioticId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium rounded"
                        placeholder="Enter Antibiotic ID"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-muted-foreground mb-2">
                        Antibiotic Name:
                      </label>
                      <input
                        type="text"
                        value={antibioticName}
                        onChange={(e) => setAntibioticName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium rounded"
                        placeholder="Enter Antibiotic Name"
                      />
                    </div>
                    <Button variant="green" className="px-8 flex-shrink-0">
                      <Save size={18} />
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent Entries / Duplicate Records Panel */}
              <div className="bg-card border border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-base font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
                  Recent Entries
                </h3>
                <div className="space-y-4">
                  {recentEntries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Antibiotic ID:</span>
                        <p className="text-sm font-bold text-foreground mt-1">{entry.antibioticId}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Antibiotic Name:</span>
                        <p className="text-sm text-muted-foreground mt-1 italic">{entry.antibioticName || "(Empty)"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer to push footer to bottom */}
              <div className="flex-1"></div>

              {/* Utility Footer */}
              <div className="bg-muted border-t-2 border-border p-6 shadow-lg sticky bottom-0">
                <div className="flex items-center gap-4">
                  <Button variant="red">
                    <Trash2 size={18} />
                    Delete All Antibiotics
                  </Button>
                  <Button variant="outline">
                    <Edit size={18} />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}