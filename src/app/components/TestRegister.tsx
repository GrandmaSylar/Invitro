import { useState } from "react";
import { ClipboardList, Pill, Trash2, Edit, Save, Loader2, FlaskConical } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { cn } from "./ui/utils";
import { 
  useTests, useCreateTest, useDeleteTest, useDepartments,
  useParameters, useCreateParameter, useDeleteParameter,
  useAntibiotics, useCreateAntibiotic, useDeleteAntibiotic 
} from "../../hooks/useCatalog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";

type Tab = "test-list" | "antibiotics" | "departments";

export function TestRegister() {
  const [activeTab, setActiveTab] = useState<Tab>("test-list");

  // React Query Hooks
  const { data: tests = [], isLoading: testsLoading } = useTests();
  const createTest = useCreateTest();
  const deleteTest = useDeleteTest();
  
  const { data: parameters = [], isLoading: parametersLoading } = useParameters();
  const createParameter = useCreateParameter();
  const deleteParameter = useDeleteParameter();
  
  const { data: antibiotics = [], isLoading: antibioticsLoading } = useAntibiotics();
  const createAntibiotic = useCreateAntibiotic();
  const deleteAntibiotic = useDeleteAntibiotic();
  
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();

  // Parameter State
  const [parameterName, setParameterName] = useState("");
  const [units, setUnits] = useState("");
  const [parameterReferenceRange, setParameterReferenceRange] = useState("");
  const [parameterOrderId, setParameterOrderId] = useState("10");
  const [trimesterType, setTrimesterType] = useState("");
  
  // Test State
  const [testName, setTestName] = useState("");
  const [department, setDepartment] = useState("");
  const [resultHeader, setResultHeader] = useState("");
  const [testReferenceRange, setTestReferenceRange] = useState("");
  const [testCost, setTestCost] = useState("");
  const [includeComprehensive, setIncludeComprehensive] = useState(false);

  // Antibiotic State
  const [antibioticName, setAntibioticName] = useState("");


  const [selectedParameter, setSelectedParameter] = useState<number | null>(null);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [focusedParameterIndex, setFocusedParameterIndex] = useState<number | null>(null);
  const [focusedTestIndex, setFocusedTestIndex] = useState<number | null>(null);

  const tabs = [
    { id: "test-list" as Tab, label: "Test List", icon: ClipboardList, color: "blue" },
    { id: "departments" as Tab, label: "Departments", icon: FlaskConical, color: "emerald" },
    { id: "antibiotics" as Tab, label: "Antibiotics", icon: Pill, color: "purple" },
  ];

  return (
    <div className="p-4 sm:p-6 h-full space-y-6">
      <div className="bg-card flex flex-col rounded-2xl shadow-sm border border-border/50 overflow-hidden">

        {/* Tabs Header */}
        <div className="border-b border-border/50 px-6 pt-2 bg-muted/20">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-2 px-2 py-4 text-sm font-semibold transition-colors duration-200 outline-none"
                >
                  <span className={cn(
                    "relative z-10 flex items-center gap-2",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTestRegisterTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
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
                className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
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
                      value={parameterName}
                      onChange={(e) => setParameterName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Units</label>
                    <input 
                      type="text" 
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reference Range</label>
                    <input 
                      type="text" 
                      value={parameterReferenceRange}
                      onChange={(e) => setParameterReferenceRange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      variant="blue" 
                      className="w-full"
                      disabled={createParameter.isPending}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!parameterName) return toast.error("Parameter name is required");
                        try {
                          await createParameter.mutateAsync({
                            parameterName,
                            units: units || undefined,
                            referenceRange: parameterReferenceRange || undefined,
                            parameterOrderId: parseInt(parameterOrderId) || undefined,
                            trimesterType: trimesterType || undefined,
                          });
                          toast.success("Parameter added");
                          setParameterName("");
                          setUnits("");
                          setParameterReferenceRange("");
                          setTrimesterType("");
                        } catch (err: any) {
                          toast.error(err.message);
                        }
                      }}
                    >
                      {createParameter.isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : null}
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
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Trimester Type</label>
                    <input 
                      type="text" 
                      value={trimesterType}
                      onChange={(e) => setTrimesterType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                {/* Parameter Table */}
                {parametersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : parameters.length === 0 ? (
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
                        const nextIndex = prev === null ? 0 : Math.min(prev + 1, parameters.length - 1);
                        setSelectedParameter(nextIndex);
                        return nextIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setFocusedParameterIndex(prev => {
                        const nextIndex = prev === null ? parameters.length - 1 : Math.max(prev - 1, 0);
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
                      {parameters.map((param, index) => (
                        <tr 
                          key={param.id} 
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
                    onClick={async () => { 
                      if (selectedParameter !== null) { 
                        const param = parameters[selectedParameter];
                        await deleteParameter.mutateAsync(param.id);
                        setSelectedParameter(null); 
                        toast("Deleted."); 
                      } 
                    }}
                    disabled={selectedParameter === null || deleteParameter.isPending}
                  >
                    Delete Selected Parameter
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!testName) return toast.error("Test name is required");
                  try {
                    await createTest.mutateAsync({
                      testName,
                      department: department || '',
                      resultHeader: resultHeader || undefined,
                      referenceRange: testReferenceRange || undefined,
                      testCost: testCost ? parseFloat(testCost) : undefined,
                      includeComprehensive: includeComprehensive,
                    });
                    toast.success("Test added");
                    setTestName("");
                    setDepartment("");
                    setResultHeader("");
                    setTestReferenceRange("");
                    setTestCost("");
                    setIncludeComprehensive(false);
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
                className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="border-b border-border pb-2 mb-4">
                  <h3 className="text-base font-semibold text-foreground">Test Name</h3>
                </div>
                
                {/* Test Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-4">
                  <div className="hidden">
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Department</label>
                    <select 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test Name</label>
                    <input 
                      type="text" 
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Result Header</label>
                    <input 
                      type="text" 
                      value={resultHeader}
                      onChange={(e) => setResultHeader(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reference Range</label>
                    <input 
                      type="text" 
                      value={testReferenceRange}
                      onChange={(e) => setTestReferenceRange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test Cost</label>
                    <input 
                      type="number" 
                      value={testCost}
                      onChange={(e) => setTestCost(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
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
                {testsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : tests.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30 mb-4">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No tests registered yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Fill in the form above and click Add to create a test</p>
                  </div>
                ) : (
                <div 
                  className="border border-border/60 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow max-h-48"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setFocusedTestIndex(prev => {
                        const nextIndex = prev === null ? 0 : Math.min(prev + 1, tests.length - 1);
                        setSelectedTest(nextIndex);
                        return nextIndex;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setFocusedTestIndex(prev => {
                        const nextIndex = prev === null ? tests.length - 1 : Math.max(prev - 1, 0);
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
                      {tests.map((test, index) => (
                        <tr 
                          key={test.id} 
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
                    onClick={async () => { 
                      if (selectedTest !== null) { 
                        const test = tests[selectedTest];
                        await deleteTest.mutateAsync(test.id);
                        setSelectedTest(null); 
                        toast("Deleted."); 
                      } 
                    }}
                    disabled={selectedTest === null || deleteTest.isPending}
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

          {activeTab === "departments" && (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header Section */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h2 className="text-2xl font-bold text-foreground">Department Registry</h2>
                  <p className="text-muted-foreground mt-2">Departments are derived from existing tests. Add a test with a new department name to register it here.</p>
                </div>
              </div>

              {/* Departments Table Panel */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
                  Registered Departments
                </h3>
                {departmentsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No departments found</p>
                    <p className="text-xs text-muted-foreground mt-1">Create a test with a department name to see it here</p>
                  </div>
                ) : (
                  <div className="border border-border max-h-64 overflow-auto rounded">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0 border-b-2 border-border">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map((dep, index) => (
                          <tr key={dep} className={index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'}>
                            <td className="px-3 py-2 text-sm text-foreground font-medium">{dep}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "antibiotics" && (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header Section */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="border-l-4 border-purple-600 pl-4">
                  <h2 className="text-2xl font-bold text-foreground">Antibiotic Registry</h2>
                  <p className="text-muted-foreground mt-2">Manage antibiotic inventory and records</p>
                </div>
              </div>

              {/* Antibiotic Entry Form */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="border-t-2 border-purple-600 pt-6">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!antibioticName) return toast.error("Name is required");
                      try {
                        await createAntibiotic.mutateAsync(antibioticName);
                        toast.success("Antibiotic saved");
                        setAntibioticName("");
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}
                    className="flex items-end gap-4"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Antibiotic Name</label>
                      <input
                        type="text"
                        value={antibioticName}
                        onChange={(e) => setAntibioticName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border/60 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium rounded-xl transition-all"
                        placeholder="Enter Antibiotic Name"
                      />
                    </div>
                    <Button type="submit" variant="green" className="px-8 flex-shrink-0" disabled={createAntibiotic.isPending}>
                      {createAntibiotic.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                      Save
                    </Button>
                  </form>
                </div>
              </div>

              {/* Antibiotics Table Panel */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-base font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
                  Registered Antibiotics
                </h3>
                {antibioticsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : antibiotics.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                    <Pill className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No antibiotics registered yet</p>
                  </div>
                ) : (
                  <div className="border border-border max-h-64 overflow-auto rounded">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0 border-b-2 border-border">
                        <tr>
                          <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Name</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-bold text-muted-foreground w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {antibiotics.map((ab, index) => (
                          <tr key={ab.id} className={index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'}>
                            <td className="border-r border-border px-3 py-2 text-sm text-foreground font-medium">{ab.antibioticName}</td>
                            <td className="px-3 py-2 text-right">
                              <Button 
                                type="button" 
                                variant="red" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={async () => {
                                  try {
                                    await deleteAntibiotic.mutateAsync(ab.id);
                                    toast.success("Deleted antibiotic");
                                  } catch (err: any) {
                                    toast.error(err.message);
                                  }
                                }}
                                disabled={deleteAntibiotic.isPending}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}