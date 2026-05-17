import React, { useState } from "react";
import { showConfirm, showSuccess } from "../../stores/useDialogStore";
import { ClipboardList, Pill, Trash2, Edit, Save, Loader2, FlaskConical, Plus, Library, ChevronDown, ChevronRight, Search } from "lucide-react";
import { catalogService } from "../../services/catalogService";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { cn } from "./ui/utils";
import { 
  useTests, useCreateTest, useUpdateTest, useDeleteTest, 
  useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment,
  useParameters, useCreateParameter, useUpdateParameter, useDeleteParameter, usePreviewParameterCode,
  useAntibiotics, useCreateAntibiotic, useUpdateAntibiotic, useDeleteAntibiotic,
  useTestDetail, useLinkParameter, useUnlinkParameter
} from "../../hooks/useCatalog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import type { Parameter } from "../../lib/types";

type Tab = "tests" | "parameter-library" | "departments" | "antibiotics";

// Inline parameter type for the test builder form (not yet persisted)
type InlineParam = { tempId: string; parameterName: string; units: string; referenceRange: string; libraryId?: string };

export function TestRegister() {
  const [activeTab, setActiveTab] = useState<Tab>("tests");

  // React Query Hooks
  const { data: tests = [], isLoading: testsLoading, error: testsError } = useTests();
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();
  
  const { data: parameters = [], isLoading: parametersLoading, error: parametersError } = useParameters();
  const createParameter = useCreateParameter();
  const updateParameter = useUpdateParameter();
  const deleteParameter = useDeleteParameter();
  const { data: nextParamCode } = usePreviewParameterCode();
  

  
  const { data: antibiotics = [], isLoading: antibioticsLoading } = useAntibiotics();
  const createAntibiotic = useCreateAntibiotic();
  const updateAntibiotic = useUpdateAntibiotic();
  const deleteAntibiotic = useDeleteAntibiotic();
  
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const linkParameter = useLinkParameter();
  const unlinkParameter = useUnlinkParameter();

  // ── Unified Test Builder State ───────────────────────────────
  const [testName, setTestName] = useState("");
  const [department, setDepartment] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [resultHeader, setResultHeader] = useState("");
  const [testReferenceRange, setTestReferenceRange] = useState("");
  const [testCost, setTestCost] = useState("");
  const [includeComprehensive, setIncludeComprehensive] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // Inline parameter entry within test builder
  const [inlineParams, setInlineParams] = useState<InlineParam[]>([]);
  const [inlineParamName, setInlineParamName] = useState("");
  const [inlineParamUnits, setInlineParamUnits] = useState("");
  const [inlineParamRange, setInlineParamRange] = useState("");
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  // Expandable test list
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const { data: expandedTestDetail } = useTestDetail(expandedTestId);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Parameter Library tab state
  const [libParamName, setLibParamName] = useState("");
  const [libUnits, setLibUnits] = useState("");
  const [libRange, setLibRange] = useState("");
  const [libParamCode, setLibParamCode] = useState("");
  const [libTrimester, setLibTrimester] = useState("");
  const [editingParameterId, setEditingParameterId] = useState<string | null>(null);

  // Antibiotic State
  const [antibioticName, setAntibioticName] = useState("");
  const [editingAntibioticId, setEditingAntibioticId] = useState<string | null>(null);

  // Departments State
  const [deptName, setDeptName] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Auto-populate parameter code when adding new
  React.useEffect(() => {
    if (!editingParameterId && nextParamCode) {
      setLibParamCode(nextParamCode);
    }
  }, [editingParameterId, nextParamCode, setLibParamCode]);

  // Selection states for other tables
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [selectedAntibiotics, setSelectedAntibiotics] = useState<string[]>([]);

  const toggleTestSelection = (id: string) => setSelectedTests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleParamSelection = (id: string) => setSelectedParameters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleDeptSelection = (id: string) => setSelectedDepartments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAntibioticSelection = (id: string) => setSelectedAntibiotics(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Search states
  const [searchTests, setSearchTests] = useState("");
  const [searchParams, setSearchParams] = useState("");
  const [searchDepts, setSearchDepts] = useState("");
  const [libSortField, setLibSortField] = useState<keyof Parameter>("parameterCode");
  const [libSortOrder, setLibSortOrder] = useState<"asc" | "desc">("asc");

  // Filtered lists
  const filteredTests = tests.filter(t =>
    t.id !== editingTestId &&
    (searchTests === "" || t.testName.toLowerCase().includes(searchTests.toLowerCase()) || (t.department || "").toLowerCase().includes(searchTests.toLowerCase()))
  );
  const filteredParameters = parameters.filter(p =>
    searchParams === "" || 
    p.parameterName.toLowerCase().includes(searchParams.toLowerCase()) || 
    (p.units || "").toLowerCase().includes(searchParams.toLowerCase()) ||
    (p.parameterCode || "").toLowerCase().includes(searchParams.toLowerCase())
  );

  const sortedParameters = [...filteredParameters].sort((a, b) => {
    const field = libSortField;
    const valA = a[field]?.toString() || "";
    const valB = b[field]?.toString() || "";
    const multiplier = libSortOrder === "asc" ? 1 : -1;
    
    // Natural sort for strings that might contain numbers (like P001)
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * multiplier;
  });
  const filteredDepartments = departments.filter(d =>
    searchDepts === "" || d.departmentName.toLowerCase().includes(searchDepts.toLowerCase())
  );

  // ── Test Builder Helpers ─────────────────────────────────────
  const addInlineParam = () => {
    if (!inlineParamName.trim()) return toast.error("Parameter name is required");
    setInlineParams(prev => [...prev, {
      tempId: crypto.randomUUID(),
      parameterName: inlineParamName.trim(),
      units: inlineParamUnits.trim(),
      referenceRange: inlineParamRange.trim(),
    }]);
    setInlineParamName(""); setInlineParamUnits(""); setInlineParamRange("");
  };

  const addFromLibrary = (param: typeof parameters[0]) => {
    if (inlineParams.some(p => p.libraryId === param.id)) return toast.info("Already added");
    setInlineParams(prev => [...prev, {
      tempId: crypto.randomUUID(),
      parameterName: param.parameterName,
      units: param.units || "",
      referenceRange: param.referenceRange || "",
      libraryId: param.id,
    }]);
  };

  const removeInlineParam = (tempId: string) => {
    setInlineParams(prev => prev.filter(p => p.tempId !== tempId));
  };

  const resetTestForm = () => {
    setTestName(""); setDepartment(""); setNewDepartment(""); setResultHeader("");
    setTestReferenceRange(""); setTestCost(""); setIncludeComprehensive(false);
    setInlineParams([]); setEditingTestId(null);
  };

  const handleSaveTest = async () => {
    if (!testName.trim()) return toast.error("Test name is required");
    const dept = newDepartment.trim() || department;
    if (!dept) return toast.error("Department is required");

    const action = editingTestId ? "update this test" : "create this new test";
    const confirmed = await showConfirm({
      title: editingTestId ? "Update Test" : "Create Test",
      description: `Are you sure you want to ${action}?`,
      confirmText: editingTestId ? "Update" : "Create"
    });
    if (!confirmed) return;

    try {
      setIsSaving(true);
      const testData = {
        testName: testName.trim(),
        department: dept,
        resultHeader: resultHeader.trim() || undefined,
        referenceRange: testReferenceRange.trim() || undefined,
        testCost: testCost ? parseFloat(testCost) : undefined,
        includeComprehensive,
      };

      let savedTestId: string;

      if (editingTestId) {
        // Fetch old parameters BEFORE updating, to avoid race with cache invalidation
        let oldParams: any[] = [];
        try {
          const oldDetail = await catalogService.getTestById(editingTestId);
          oldParams = oldDetail.parameters ?? [];
        } catch { /* no existing params to unlink */ }

        // Update existing test
        const updated = await updateTest.mutateAsync({ id: editingTestId, data: testData });
        savedTestId = updated.id;

        // Remove old parameter links
        for (const p of oldParams) {
          await unlinkParameter.mutateAsync({ testId: editingTestId, parameterId: p.id });
        }
      } else {
        const created = await createTest.mutateAsync(testData);
        savedTestId = created.id;
      }

      // Create new parameters or link library ones
      for (let i = 0; i < inlineParams.length; i++) {
        const ip = inlineParams[i];
        let paramId = ip.libraryId;
        if (!paramId) {
          // Create new parameter in the library
          const created = await createParameter.mutateAsync({
            parameterName: ip.parameterName,
            units: ip.units || undefined,
            referenceRange: ip.referenceRange || undefined,
          });
          paramId = created.id;
        }
        await linkParameter.mutateAsync({ testId: savedTestId, parameterId: paramId, sortOrder: i });
      }

      showSuccess({ title: editingTestId ? "Test Updated" : "Test Created", description: `Test successfully ${editingTestId ? "updated" : "created"}.` });
      resetTestForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTest = async (test: typeof tests[0]) => {
    setEditingTestId(test.id);
    setTestName(test.testName);
    setDepartment(test.department);
    setResultHeader(test.resultHeader || "");
    setTestReferenceRange(test.referenceRange || "");
    setTestCost(test.testCost?.toString() || "");
    setIncludeComprehensive(test.includeComprehensive || false);
    // Load existing parameters into inline params
    try {
      const detail = await catalogService.getTestById(test.id);
      setInlineParams((detail.parameters ?? []).map(p => ({
        tempId: crypto.randomUUID(),
        parameterName: p.parameterName,
        units: p.units || "",
        referenceRange: p.referenceRange || "",
        libraryId: p.id,
      })));
    } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    { id: "tests" as Tab, label: "Tests", icon: ClipboardList, color: "blue" },
    { id: "parameter-library" as Tab, label: "Parameter Library", icon: FlaskConical, color: "amber" },
    { id: "departments" as Tab, label: "Departments", icon: FlaskConical, color: "emerald" },
    { id: "antibiotics" as Tab, label: "Antibiotics", icon: Pill, color: "purple" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col">

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
        <div className="pt-6 flex flex-col">
          {activeTab === "tests" && (
            <div className="space-y-6 p-6">
              {/* ── UNIFIED TEST BUILDER ── */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="border-b border-border pb-2 mb-6 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">
                    {editingTestId ? "Edit Test" : "Add New Test"}
                  </h3>
                  {editingTestId && (
                    <Button type="button" variant="outline" size="sm" onClick={resetTestForm}>Cancel Edit</Button>
                  )}
                </div>

                {/* Test Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test Name *</label>
                    <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="e.g. Full Blood Count" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Department *</label>
                    <div className="flex gap-2">
                      <select value={department} onChange={(e) => { setDepartment(e.target.value); setNewDepartment(""); }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium">
                        <option value="">Select or type new →</option>
                        {departments.map(d => <option key={d.id} value={d.departmentName}>{d.departmentName}</option>)}
                      </select>
                      <input type="text" value={newDepartment} onChange={(e) => { setNewDepartment(e.target.value); setDepartment(""); }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="New department" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Test Cost (₵)</label>
                    <input type="number" value={testCost} onChange={(e) => setTestCost(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Result Header</label>
                    <input type="text" value={resultHeader} onChange={(e) => setResultHeader(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reference Range</label>
                    <input type="text" value={testReferenceRange} onChange={(e) => setTestReferenceRange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={includeComprehensive} onCheckedChange={(c) => setIncludeComprehensive(c === true)} />
                      <span className="text-xs text-muted-foreground">Include in Comprehensive Screening</span>
                    </label>
                  </div>
                </div>

                {/* ── INLINE PARAMETER BUILDER ── */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground">Parameters ({inlineParams.length})</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowLibraryPicker(true)}>
                      <Library size={14} className="mr-1.5" /> From Library
                    </Button>
                  </div>

                  {/* Inline add row */}
                  <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-[2]">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                      <input type="text" value={inlineParamName} onChange={(e) => setInlineParamName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInlineParam(); }}}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Parameter name" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Units</label>
                      <input type="text" value={inlineParamUnits} onChange={(e) => setInlineParamUnits(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="e.g. g/dL" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Ref. Range</label>
                      <input type="text" value={inlineParamRange} onChange={(e) => setInlineParamRange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="e.g. 12-16" />
                    </div>
                    <Button type="button" variant="blue" size="sm" onClick={addInlineParam} className="shrink-0">
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </div>

                  {/* Inline params mini-table */}
                  {inlineParams.length > 0 && (
                    <div className="border border-border/60 rounded-xl overflow-hidden mb-4">
                      <table className="w-full">
                        <thead className="bg-muted"><tr>
                          <th className="px-3 py-2 text-left text-xs uppercase font-bold text-muted-foreground">Parameter</th>
                          <th className="px-3 py-2 text-left text-xs uppercase font-bold text-muted-foreground">Units</th>
                          <th className="px-3 py-2 text-left text-xs uppercase font-bold text-muted-foreground">Ref. Range</th>
                          <th className="px-3 py-2 text-right text-xs uppercase font-bold text-muted-foreground w-16"></th>
                        </tr></thead>
                        <tbody>
                          {inlineParams.map((p, i) => (
                            <tr key={p.tempId} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="px-3 py-2 text-sm font-medium">{p.parameterName} {p.libraryId && <span className="text-xs text-primary ml-1">(library)</span>}</td>
                              <td className="px-3 py-2 text-sm text-muted-foreground">{p.units || '—'}</td>
                              <td className="px-3 py-2 text-sm text-muted-foreground">{p.referenceRange || '—'}</td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => removeInlineParam(p.tempId)} className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="green" onClick={handleSaveTest} disabled={isSaving} className="px-8">
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save size={16} className="mr-2" />}
                    {editingTestId ? "Update Test" : "Save Test"}
                  </Button>
                  {editingTestId && <Button type="button" variant="outline" onClick={resetTestForm}>Cancel</Button>}
                </div>
              </div>

              {/* ── REGISTERED TESTS LIST (expandable) ── */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold text-foreground">
                      Registered Tests ({tests.length})
                    </h3>
                    {selectedTests.length > 0 && (
                      <Button 
                        type="button" 
                        variant="red" 
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Delete ${selectedTests.length} tests?`)) return;
                          try {
                            await Promise.all(selectedTests.map(id => deleteTest.mutateAsync(id)));
                            toast.success("Deleted selected tests");
                            setSelectedTests([]);
                          } catch(err: any) { toast.error(err.message); }
                        }}
                      >
                        <Trash2 size={14} className="mr-1.5" /> Delete Selected
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTests}
                      onChange={(e) => setSearchTests(e.target.value)}
                      placeholder="Search tests by name or department..."
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-lg transition-all"
                    />
                  </div>
                </div>
                {testsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : testsError ? (
                  <div className="text-center py-12 text-destructive border border-destructive/20 rounded bg-destructive/5">
                    <p className="text-sm font-medium">Error loading tests: {(testsError as Error).message}</p>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No tests registered yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the form above to create your first test</p>
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted border-b-2 border-border"><tr>
                        <th className="px-3 py-2 text-left w-10">
                          <Checkbox 
                            checked={selectedTests.length === tests.length && tests.length > 0}
                            onCheckedChange={(c) => setSelectedTests(c ? tests.map(t => t.id) : [])}
                          />
                        </th>
                        <th className="w-8"></th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Test Name</th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Department</th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Cost</th>
                        <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-bold text-muted-foreground w-24">Actions</th>
                      </tr></thead>
                      <tbody>
                        {filteredTests.map((test, index) => (
                          <React.Fragment key={test.id}>{/* Main row */}
                          <tr
                            onClick={() => toggleTestSelection(test.id)}
                            className={`border-t border-border cursor-pointer transition-colors ${
                              selectedTests.includes(test.id) ? 'bg-primary/5' : index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                            }`}>
                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                              <Checkbox 
                                checked={selectedTests.includes(test.id)}
                                onCheckedChange={() => toggleTestSelection(test.id)}
                              />
                            </td>
                            <td className="px-2 py-2 text-center text-muted-foreground" onClick={(e) => { e.stopPropagation(); setExpandedTestId(prev => prev === test.id ? null : test.id); }}>
                              {expandedTestId === test.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-foreground">{test.testName}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">{test.department}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">₵{test.testCost?.toFixed(2) ?? '0.00'}</td>
                            <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditTest(test)}>
                                <Edit size={13} />
                              </Button>
                            </td>
                          </tr>
                          {/* Expanded detail row */}
                          {expandedTestId === test.id && (
                            <tr key={test.id + '-detail'}>
                              <td colSpan={6} className="bg-muted/20 px-6 py-4 border-t border-border/40">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assigned Parameters</p>
                                {!expandedTestDetail ? (
                                  <Loader2 className="animate-spin text-muted-foreground" size={16} />
                                ) : (expandedTestDetail.parameters?.length ?? 0) === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No parameters assigned to this test</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {expandedTestDetail.parameters?.map(p => (
                                      <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background border border-border text-xs font-medium text-foreground">
                                        {p.parameterName}
                                        {p.units && <span className="text-muted-foreground">({p.units})</span>}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── FROM LIBRARY PICKER DIALOG ── */}
              <Dialog open={showLibraryPicker} onOpenChange={setShowLibraryPicker}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Select Parameters from Library</DialogTitle>
                    <DialogDescription>Click a parameter to add it to the current test.</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-64 overflow-auto border border-border rounded-lg">
                    {parametersLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : parameters.length === 0 ? (
                      <p className="text-sm text-center py-6 text-muted-foreground">No parameters in library yet. Type them inline above.</p>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0"><tr>
                          <th className="px-3 py-2 text-left text-xs uppercase font-bold text-muted-foreground">Name</th>
                          <th className="px-3 py-2 text-left text-xs uppercase font-bold text-muted-foreground">Units</th>
                          <th className="px-3 py-2 text-left text-xs uppercase font-bold text-muted-foreground">Ref. Range</th>
                        </tr></thead>
                        <tbody>
                          {parameters.map((p, i) => {
                            const alreadyAdded = inlineParams.some(ip => ip.libraryId === p.id);
                            return (
                              <tr key={p.id} onClick={() => { if (!alreadyAdded) addFromLibrary(p); }}
                                className={`border-t border-border transition-colors ${alreadyAdded ? 'bg-primary/10 opacity-60 cursor-default' : 'cursor-pointer hover:bg-muted/50'} ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                                <td className="px-3 py-2 text-sm font-medium">{p.parameterName} {alreadyAdded && <span className="text-xs text-primary">✓</span>}</td>
                                <td className="px-3 py-2 text-sm text-muted-foreground">{p.units || '—'}</td>
                                <td className="px-3 py-2 text-sm text-muted-foreground">{p.referenceRange || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowLibraryPicker(false)}>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ── PARAMETER LIBRARY TAB ── */}
          {activeTab === "parameter-library" && (
            <div className="space-y-6 p-6">
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="border-b border-border pb-2 mb-6">
                  <h3 className="text-base font-semibold text-foreground">
                    {editingParameterId ? "Edit Parameter" : "Add Parameter to Library"}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Parameter Name *</label>
                    <input type="text" value={libParamName} onChange={(e) => setLibParamName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Units</label>
                    <input type="text" value={libUnits} onChange={(e) => setLibUnits(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Reference Range</label>
                    <input type="text" value={libRange} onChange={(e) => setLibRange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Parameter ID</label>
                    <input type="text" value={libParamCode} readOnly placeholder="Auto-generated"
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-muted/30 text-muted-foreground text-sm focus:outline-none transition-all font-medium cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Trimester Type</label>
                    <input type="text" value={libTrimester} onChange={(e) => setLibTrimester(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="blue" className="flex-1"
                      disabled={createParameter.isPending || updateParameter.isPending}
                      onClick={async () => {
                        if (!libParamName.trim()) return toast.error("Parameter name is required");
                        
                        const action = editingParameterId ? "update this parameter" : "add this new parameter to the library";
                        const confirmed = await showConfirm({
                          title: editingParameterId ? "Update Parameter" : "Add Parameter",
                          description: `Are you sure you want to ${action}?`,
                          confirmText: editingParameterId ? "Update" : "Add"
                        });
                        if (!confirmed) return;

                        try {
                          const data = { parameterName: libParamName.trim(), units: libUnits.trim() || undefined, referenceRange: libRange.trim() || undefined, trimesterType: libTrimester.trim() || undefined };
                          if (editingParameterId) {
                            await updateParameter.mutateAsync({ id: editingParameterId, data });
                            toast.success("Parameter updated");
                            setEditingParameterId(null);
                          } else {
                            await createParameter.mutateAsync(data);
                            toast.success("Parameter added to library");
                          }
                          setLibParamName(""); setLibUnits(""); setLibRange(""); setLibTrimester(""); setLibParamCode("");
                        } catch (err: any) { toast.error(err.message); }
                      }}>
                      {createParameter.isPending || updateParameter.isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : null}
                      {editingParameterId ? "Update" : "Add"}
                    </Button>
                    {editingParameterId && (
                      <Button type="button" variant="outline" onClick={() => { setEditingParameterId(null); setLibParamName(""); setLibUnits(""); setLibRange(""); setLibTrimester(""); setLibParamCode(""); }}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold text-foreground">
                      Parameter Library ({parameters.length})
                    </h3>
                    {selectedParameters.length > 0 && (
                      <Button 
                        type="button" 
                        variant="red" 
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Delete ${selectedParameters.length} parameters?`)) return;
                          try {
                            await Promise.all(selectedParameters.map(id => deleteParameter.mutateAsync(id)));
                            toast.success("Deleted selected parameters");
                            setSelectedParameters([]);
                          } catch(err: any) { toast.error(err.message); }
                        }}
                      >
                        <Trash2 size={14} className="mr-1.5" /> Delete Selected
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchParams}
                      onChange={(e) => setSearchParams(e.target.value)}
                      placeholder="Search parameters by name or units..."
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-lg transition-all"
                    />
                  </div>
                </div>
                {parametersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : parametersError ? (
                  <div className="text-center py-12 text-destructive border border-destructive/20 rounded bg-destructive/5">
                    <p className="text-sm font-medium">Error loading parameters: {(parametersError as Error).message}</p>
                  </div>
                ) : parameters.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No parameters in library yet</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted border-b-2 border-border"><tr>
                        <th className="px-3 py-2 text-left w-10">
                          <Checkbox 
                            checked={selectedParameters.length === parameters.length && parameters.length > 0}
                            onCheckedChange={(c) => setSelectedParameters(c ? parameters.map(p => p.id) : [])}
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (libSortField === 'parameterCode') setLibSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                            else { setLibSortField('parameterCode'); setLibSortOrder('asc'); }
                          }}>
                          ID {libSortField === 'parameterCode' && (libSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (libSortField === 'parameterName') setLibSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                            else { setLibSortField('parameterName'); setLibSortOrder('asc'); }
                          }}>
                          Name {libSortField === 'parameterName' && (libSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Units</th>
                        <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Ref. Range</th>
                        <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-bold text-muted-foreground w-24">Actions</th>
                      </tr></thead>
                      <tbody>
                        {sortedParameters.map((param, index) => (
                          <tr 
                            key={param.id} 
                            onClick={() => toggleParamSelection(param.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedParameters.includes(param.id) ? 'bg-primary/5' : index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                            }`}>
                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                              <Checkbox 
                                checked={selectedParameters.includes(param.id)}
                                onCheckedChange={() => toggleParamSelection(param.id)}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm font-mono text-primary font-medium">{param.parameterCode}</td>
                            <td className="px-3 py-2 text-sm font-medium text-foreground">{param.parameterName}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">{param.units || '—'}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">{param.referenceRange || '—'}</td>
                            <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                                onClick={() => { setEditingParameterId(param.id); setLibParamName(param.parameterName); setLibUnits(param.units || ""); setLibRange(param.referenceRange || ""); setLibParamCode(param.parameterCode || ""); setLibTrimester(param.trimesterType || ""); }}>
                                <Edit size={13} />
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



          {activeTab === "departments" && (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header Section */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h2 className="text-2xl font-bold text-foreground">Department Registry</h2>
                  <p className="text-muted-foreground mt-2">Manage laboratory departments and categories.</p>
                </div>
              </div>

              {/* Department Entry Form */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="border-t-2 border-emerald-500 pt-6">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!deptName) return toast.error("Name is required");

                      const action = editingDeptId ? "update this department" : "create this new department";
                      const confirmed = await showConfirm({
                        title: editingDeptId ? "Update Department" : "Add Department",
                        description: `Are you sure you want to ${action}?`,
                        confirmText: editingDeptId ? "Update" : "Add"
                      });
                      if (!confirmed) return;

                      try {
                        if (editingDeptId) {
                          await updateDepartment.mutateAsync({ id: editingDeptId, name: deptName });
                          showSuccess({ title: "Department Updated", description: "Department updated successfully" });
                          setEditingDeptId(null);
                        } else {
                          await createDepartment.mutateAsync(deptName);
                          showSuccess({ title: "Department Created", description: "Department saved successfully" });
                        }
                        setDeptName("");
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}
                    className="flex items-end gap-4"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Department Name</label>
                      <input
                        type="text"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-background border border-border/60 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium rounded-xl transition-all"
                        placeholder="Enter Department Name"
                      />
                    </div>
                    {editingDeptId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingDeptId(null);
                          setDeptName("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="green" className="px-8 flex-shrink-0" disabled={createDepartment.isPending || updateDepartment.isPending}>
                      {createDepartment.isPending || updateDepartment.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                      {editingDeptId ? "Update" : "Save"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Departments Table Panel */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3 mb-4 pb-2 border-b-2 border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-foreground">
                      Registered Departments ({departments.length})
                    </h3>
                    {departments.length > 0 && (
                      <div className="flex items-center gap-2">
                        {selectedDepartments.length > 0 && (
                          <Button 
                            type="button" 
                            variant="red" 
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Delete ${selectedDepartments.length} department(s)?`)) return;
                              try {
                                await Promise.all(selectedDepartments.map(id => deleteDepartment.mutateAsync(id)));
                                toast.success("Deleted selected departments");
                                setSelectedDepartments([]);
                              } catch(err: any) { toast.error(err.message); }
                            }}
                          >
                            <Trash2 size={14} className="mr-1.5" /> Delete Selected
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="red" 
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Delete ALL departments? This cannot be undone.")) return;
                            try {
                              await Promise.all(departments.map(d => deleteDepartment.mutateAsync(d.id)));
                              toast.success("Deleted all departments");
                              setSelectedDepartments([]);
                            } catch(err: any) { toast.error(err.message); }
                          }}
                        >
                          <Trash2 size={14} className="mr-1.5" /> Delete All
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchDepts}
                      onChange={(e) => setSearchDepts(e.target.value)}
                      placeholder="Search departments..."
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-lg transition-all"
                    />
                  </div>
                </div>

                {departmentsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                    <FlaskConical className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No departments found</p>
                    <p className="text-xs text-muted-foreground mt-1">Departments added to the database will appear here</p>
                  </div>
                ) : (
                  <div className="border border-border rounded">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0 border-b-2 border-border">
                        <tr>
                          <th className="px-3 py-2 text-left w-10">
                            <Checkbox 
                              checked={selectedDepartments.length === departments.length && departments.length > 0}
                              onCheckedChange={(c) => setSelectedDepartments(c ? departments.map(d => d.id) : [])}
                            />
                          </th>
                          <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Name</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-bold text-muted-foreground w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map((dep, index) => (
                          <tr 
                            key={dep.id} 
                            onClick={() => toggleDeptSelection(dep.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedDepartments.includes(dep.id) ? 'bg-primary/5' : index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                            }`}>
                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                              <Checkbox 
                                checked={selectedDepartments.includes(dep.id)}
                                onCheckedChange={() => toggleDeptSelection(dep.id)}
                              />
                            </td>
                            <td className="border-r border-border px-3 py-2 text-sm text-foreground font-medium">{dep.departmentName}</td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDeptId(dep.id);
                                  setDeptName(dep.departmentName);
                                  toast.info("Edit mode active.");
                                }}
                              >
                                <Edit size={12} />
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

                      const action = editingAntibioticId ? "update this antibiotic" : "add this new antibiotic";
                      const confirmed = await showConfirm({
                        title: editingAntibioticId ? "Update Antibiotic" : "Add Antibiotic",
                        description: `Are you sure you want to ${action}?`,
                        confirmText: editingAntibioticId ? "Update" : "Add"
                      });
                      if (!confirmed) return;

                      try {
                        if (editingAntibioticId) {
                          await updateAntibiotic.mutateAsync({ id: editingAntibioticId, name: antibioticName });
                          showSuccess({ title: "Antibiotic Updated", description: "Antibiotic updated successfully" });
                          setEditingAntibioticId(null);
                        } else {
                          await createAntibiotic.mutateAsync(antibioticName);
                          showSuccess({ title: "Antibiotic Created", description: "Antibiotic saved successfully" });
                        }
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
                    {editingAntibioticId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingAntibioticId(null);
                          setAntibioticName("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="green" className="px-8 flex-shrink-0" disabled={createAntibiotic.isPending || updateAntibiotic.isPending}>
                      {createAntibiotic.isPending || updateAntibiotic.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                      {editingAntibioticId ? "Update" : "Save"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Antibiotics Table Panel */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-end mb-4 pb-2 border-b-2 border-border">
                  <h3 className="text-base font-semibold text-foreground">
                    Registered Antibiotics ({antibiotics.length})
                  </h3>
                  {selectedAntibiotics.length > 0 && (
                    <Button 
                      type="button" 
                      variant="red" 
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete ${selectedAntibiotics.length} antibiotics?`)) return;
                        try {
                          await Promise.all(selectedAntibiotics.map(id => deleteAntibiotic.mutateAsync(id)));
                          toast.success("Deleted selected antibiotics");
                          setSelectedAntibiotics([]);
                        } catch(err: any) { toast.error(err.message); }
                      }}
                    >
                      <Trash2 size={14} className="mr-1.5" /> Delete Selected
                    </Button>
                  )}
                </div>
                {antibioticsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : antibiotics.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                    <Pill className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-sm font-medium text-muted-foreground">No antibiotics registered yet</p>
                  </div>
                ) : (
                  <div className="border border-border rounded">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0 border-b-2 border-border">
                        <tr>
                          <th className="px-3 py-2 text-left w-10">
                            <Checkbox 
                              checked={selectedAntibiotics.length === antibiotics.length && antibiotics.length > 0}
                              onCheckedChange={(c) => setSelectedAntibiotics(c ? antibiotics.map(a => a.id) : [])}
                            />
                          </th>
                          <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Name</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-bold text-muted-foreground w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {antibiotics.map((ab, index) => (
                          <tr 
                            key={ab.id} 
                            onClick={() => toggleAntibioticSelection(ab.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedAntibiotics.includes(ab.id) ? 'bg-primary/5' : index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                            }`}>
                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                              <Checkbox 
                                checked={selectedAntibiotics.includes(ab.id)}
                                onCheckedChange={() => toggleAntibioticSelection(ab.id)}
                              />
                            </td>
                            <td className="border-r border-border px-3 py-2 text-sm text-foreground font-medium">{ab.antibioticName}</td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAntibioticId(ab.id);
                                  setAntibioticName(ab.antibioticName);
                                  toast.info("Edit mode active.");
                                }}
                              >
                                <Edit size={12} />
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