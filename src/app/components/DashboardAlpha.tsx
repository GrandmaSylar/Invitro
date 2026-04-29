import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Users, TestTube, Building2, FileText, Plus, Trash2, Search, X, UserPlus, UserCheck, FlaskConical, Calendar, DollarSign, User, Phone, Hospital, Stethoscope, ClipboardList, Circle } from "lucide-react";
import { LabBanner } from "./LabBanner";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
type Tab = "new-patient" | "existing-patient" | "add-on-test";

interface TestItem {
  id: string;
  testName: string;
  department: string;
  testCost: number;
  totalCost: number;
  amountPaid: number;
  arrears: number;
}

interface AvailableTest {
  id: string;
  testName: string;
  department: string;
  testCost: number;
}

const availableTests: AvailableTest[] = [];

export function DashboardAlpha() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs: Tab[] = ["new-patient", "existing-patient", "add-on-test"];
  const initialTab = validTabs.includes(tabParam as Tab) ? (tabParam as Tab) : "new-patient";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [patientName, setPatientName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [telephone, setTelephone] = useState("");

  useEffect(() => {
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(Math.max(0, calculatedAge).toString());
    } else {
      setAge("");
    }
  }, [dob]);
  const [referralOption, setReferralOption] = useState("None");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAvailableTests, setSelectedAvailableTests] = useState<string[]>([]);
  const [selectedTestDropdown, setSelectedTestDropdown] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [focusedTestIndex, setFocusedTestIndex] = useState<number | null>(null);
  const patientNameRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<{ patientName?: string }>({});

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isModalOpen]);

  // Calculate summary values
  const subtotal = tests.reduce((sum, test) => sum + test.testCost, 0);
  const totalCost = tests.reduce((sum, test) => sum + test.totalCost, 0);
  const arrears = totalCost - amountPaid;

  const tabs = [
    { id: "new-patient" as Tab, label: "New Patient", icon: UserPlus, color: "blue" },
    { id: "existing-patient" as Tab, label: "Existing Patient", icon: UserCheck, color: "teal" },
    { id: "add-on-test" as Tab, label: "Add-on Test", icon: FlaskConical, color: "green" },
  ];

  const filteredAvailableTests = availableTests.filter(test =>
    test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTest = () => {
    if (!selectedTestDropdown) return;
    
    const selectedTest = availableTests.find(t => t.id === selectedTestDropdown);
    if (!selectedTest) return;

    const newTest: TestItem = {
      id: Date.now().toString() + Math.random(),
      testName: selectedTest.testName,
      department: selectedTest.department,
      testCost: selectedTest.testCost,
      totalCost: selectedTest.testCost,
      amountPaid: 0.00,
      arrears: selectedTest.testCost,
    };
    
    setTests([...tests, newTest]);
    setSelectedTestDropdown("");
  };

  const handleAddSelectedTests = () => {
    const testsToAdd = availableTests
      .filter(test => selectedAvailableTests.includes(test.id))
      .map(test => ({
        id: Date.now().toString() + Math.random(),
        testName: test.testName,
        department: test.department,
        testCost: test.testCost,
        totalCost: test.testCost,
        amountPaid: 0.00,
        arrears: test.testCost,
      }));
    
    setTests([...tests, ...testsToAdd]);
    setIsModalOpen(false);
    setSelectedAvailableTests([]);
  };

  const toggleAvailableTestSelection = (id: string) => {
    setSelectedAvailableTests(prev =>
      prev.includes(id) ? prev.filter(testId => testId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    const count = selectedTests.length;
    setTests(tests.filter(test => !selectedTests.includes(test.id)));
    setSelectedTests([]);
    toast(`${count} test(s) removed.`);
  };

  const handleDeleteAll = () => {
    toast(`${tests.length} test(s) removed.`);
    setTests([]);
    setSelectedTests([]);
  };

  const toggleTestSelection = (id: string) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(testId => testId !== id) : [...prev, id]
    );
  };

  const handleSaveRecord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientName.trim()) {
      setErrors({ patientName: "Patient name is required" });
      patientNameRef.current?.focus();
      toast.error("Please fill in all required fields.");
      return;
    }
    setErrors({});
    toast.success("Record saved successfully.");
    setPatientName("");
    setGender("");
    setDob("");
    setAge("");
    setTelephone("");
    setReferralOption("None");
    setDoctorName("");
    setHospitalName("");
    setTests([]);
    setSelectedTests([]);
    setAmountPaid(0);
  };

  return (
    <div className="p-4 sm:p-6 h-full space-y-6">
      <div className="bg-card flex flex-col rounded-2xl shadow-sm border border-border/50 overflow-hidden">

        {/* Tabs Header */}
        <div className="border-b border-border/50 px-6 pt-4 bg-muted/20">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-150 whitespace-nowrap border-b-4 ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary"
                      : "text-muted-foreground hover:bg-muted/50 border-transparent hover:border-border"
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6 bg-background">
          {activeTab === "new-patient" && (
            <form onSubmit={handleSaveRecord} className="space-y-6 max-w-7xl mx-auto">
              {/* Lab Number Card */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/15 rounded">
                    <FileText className="text-blue-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Laboratory Record</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Lab Number
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="A1726021073491"
                        readOnly
                        className="flex-1 px-4 py-3 bg-blue-500/5 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-mono text-lg font-bold focus:outline-none rounded-l-xl"
                      />
                      <div className="px-4 py-3 bg-muted border border-l-0 border-border/60 rounded-r-xl">
                        <Calendar className="text-muted-foreground" size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full p-4 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Status</p>
                      <p className="text-sm font-bold text-green-700 flex items-center gap-1.5"><Circle className="h-2.5 w-2.5 fill-current" /> Active Registration</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information Card */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-blue-500/15 rounded">
                    <User className="text-blue-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Patient Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      Patient Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      ref={patientNameRef}
                      type="text"
                      value={patientName}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        if (errors.patientName) setErrors({});
                      }}
                      className={`w-full px-4 py-3 bg-background border focus:outline-none text-foreground transition-colors rounded ${
                        errors.patientName 
                          ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
                          : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                      placeholder="Enter patient full name"
                    />
                    {errors.patientName && (
                      <p className="text-xs text-destructive mt-1">{errors.patientName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={age}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-muted/50 text-muted-foreground text-sm font-medium focus:outline-none cursor-not-allowed"
                        placeholder="Age"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground" />
                      Telephone Number
                    </label>
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Information Card */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-teal-500/15 rounded">
                    <Stethoscope className="text-teal-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Referral Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <ClipboardList size={16} className="text-muted-foreground" />
                      Referral Option
                    </label>
                    <select
                      value={referralOption}
                      onChange={(e) => setReferralOption(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                    >
                      <option value="None">None</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>

                  {(referralOption === "Doctor" || referralOption === "Hospital" || referralOption === "Insurance") && (
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Stethoscope size={16} className="text-muted-foreground" />
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                        placeholder="Enter doctor name"
                      />
                    </div>
                  )}

                  {(referralOption === "Hospital" || referralOption === "Insurance") && (
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Hospital size={16} className="text-muted-foreground" />
                        Hospital Name
                      </label>
                      <input
                        type="text"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                        placeholder="Enter hospital name"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Test Selection Card */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-green-500/15 rounded">
                    <TestTube className="text-green-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Test Selection</h2>
                </div>
                
                {/* Test Selection Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Select Laboratory Test
                    </label>
                    <select
                      value={selectedTestDropdown}
                      onChange={(e) => setSelectedTestDropdown(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-colors rounded"
                    >
                      <option value="">Choose a test from the list...</option>
                      {availableTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.testName} - {test.department} (₵{test.testCost.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="blue"
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1"
                    >
                      <Search size={20} />
                      Bulk Add
                    </Button>
                    <Button
                      type="button"
                      variant="blue"
                      onClick={handleAddTest}
                      disabled={!selectedTestDropdown}
                      className="flex-1"
                    >
                      <Plus size={20} />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Tests Display Area */}
                {tests.length > 0 ? (
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Tests List - Takes 2/3 width */}
                    <div className="lg:col-span-2">
                      <div className="border border-border/60 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 bg-gradient-to-r from-muted to-muted px-4 py-3 border-b-2 border-border">
                          <div className="col-span-6">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Test Name</p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Department</p>
                          </div>
                          <div className="col-span-3 text-right">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Cost</p>
                          </div>
                        </div>
                        
                        {/* Test Rows */}
                        <div 
                          className="max-h-96 overflow-y-auto outline-none"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setFocusedTestIndex(prev => {
                                const nextIndex = prev === null ? 0 : Math.min(prev + 1, tests.length - 1);
                                if (tests[nextIndex]) setSelectedTests([tests[nextIndex].id]);
                                return nextIndex;
                              });
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setFocusedTestIndex(prev => {
                                const nextIndex = prev === null ? tests.length - 1 : Math.max(prev - 1, 0);
                                if (tests[nextIndex]) setSelectedTests([tests[nextIndex].id]);
                                return nextIndex;
                              });
                            }
                          }}
                        >
                          {tests.map((test, index) => (
                            <div 
                              key={test.id}
                              onClick={() => toggleTestSelection(test.id)}
                              className={`grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-all border-b border-border ${
                                selectedTests.includes(test.id) 
                                  ? "bg-primary/10 border-l-4 border-l-primary" 
                                  : index === focusedTestIndex 
                                    ? "bg-muted ring-2 ring-inset ring-blue-500" 
                                    : index % 2 === 0
                                      ? "bg-background hover:bg-muted/50"
                                      : "bg-muted/30 hover:bg-muted/50"
                              }`}
                            >
                              <div className="col-span-6 flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 min-w-[28px] text-center">
                                  {index + 1}
                                </span>
                                <p className="text-sm font-semibold text-foreground">{test.testName}</p>
                              </div>
                              <div className="col-span-3 flex items-center">
                                <p className="text-sm text-muted-foreground">{test.department}</p>
                              </div>
                              <div className="col-span-3 flex items-center justify-end">
                                <p className="text-sm font-bold text-green-700">₵{test.testCost.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">Click on a test row to select it for deletion</p>
                    </div>

                    {/* Payment Summary Card - Takes 1/3 width */}
                    <div className="lg:col-span-1">
                      <div className="border-2 border-border bg-card p-6 sticky top-0 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-teal-600">
                          <DollarSign className="text-teal-700" size={20} />
                          <h3 className="text-base font-bold text-foreground uppercase tracking-wide">Payment</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-border">
                            <span className="text-sm text-muted-foreground font-medium">Subtotal</span>
                            <span className="text-base font-bold text-foreground font-mono">₵{subtotal.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center pb-3 border-b border-border">
                            <span className="text-sm text-muted-foreground font-medium">Total Cost</span>
                            <span className="text-base font-bold text-foreground font-mono">₵{totalCost.toFixed(2)}</span>
                          </div>
                          
                          <div className="pb-3 border-b border-border">
                            <label className="block text-sm text-muted-foreground font-medium mb-2">Amount Paid</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₵</span>
                              <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(Number(e.target.value))}
                                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                                className="w-full pl-8 pr-3 py-2 text-right text-base font-bold text-foreground bg-background border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono transition-colors rounded"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>
                          </div>
                          
                          <div className={`flex justify-between items-center pt-3 border-t-2 border-border px-3 py-3 ${
                            arrears > 0 ? 'bg-red-500/10 border-l-4 border-l-red-600' : 'bg-green-500/10 border-l-4 border-l-green-600'
                          }`}>
                            <span className="text-sm font-bold text-muted-foreground uppercase">Arrears</span>
                            <span className={`text-lg font-bold font-mono ${
                              arrears > 0 ? 'text-red-700' : 'text-green-700'
                            }`}>
                              ₵{arrears.toFixed(2)}
                            </span>
                          </div>

                          <div className="pt-2 text-xs text-muted-foreground space-y-1">
                            <p>• Total Tests: <span className="font-bold">{tests.length}</span></p>
                            <p>• Balance Due: <span className={`font-bold ${arrears > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {arrears > 0 ? 'Pending' : 'Cleared'}
                            </span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-border bg-muted/50">
                    <TestTube className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground font-medium">No tests added yet</p>
                    <p className="text-muted-foreground text-sm mt-1">Select a test from the dropdown above to begin</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-between items-center bg-card border-2 border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="red"
                    onClick={handleDeleteSelected}
                    disabled={selectedTests.length === 0}
                  >
                    <Trash2 size={18} />
                    Delete Selected ({selectedTests.length})
                  </Button>
                  <Button
                    type="button"
                    variant="red"
                    onClick={handleDeleteAll}
                    disabled={tests.length === 0}
                  >
                    <Trash2 size={18} />
                    Delete All Tests
                  </Button>
                </div>
                <Button
                  type="submit"
                  variant="green"
                  size="lg"
                  className="px-10 text-lg shadow-lg hover:shadow-xl"
                >
                  <FileText size={20} />
                  Save Record
                </Button>
              </div>
            </form>
          )}

          {activeTab === "existing-patient" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Info Banner */}
              <div className="bg-teal-500/10 border-l-4 border-teal-600 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserCheck className="text-teal-700" size={24} />
                  <div>
                    <h3 className="font-bold text-teal-700 dark:text-teal-400">Existing Patient View</h3>
                    <p className="text-sm text-teal-700 dark:text-teal-400">Patient information is locked. Only viewing is allowed for existing records.</p>
                  </div>
                </div>
              </div>

              {/* Lab Number Card */}
              <div className="bg-card border-2 border-border p-6 opacity-75 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/15 rounded">
                    <FileText className="text-blue-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Laboratory Record</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Lab Number
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="A1726021073491"
                        readOnly
                        className="flex-1 px-4 py-3 bg-blue-500/5 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-mono text-lg font-bold focus:outline-none rounded-l-xl"
                      />
                      <div className="px-4 py-3 bg-muted border border-l-0 border-border/60 rounded-r-xl">
                        <Calendar className="text-muted-foreground" size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Status</p>
                      <p className="text-sm font-bold text-amber-700 flex items-center gap-1.5"><Circle className="h-2.5 w-2.5 fill-current" /> View Only Mode</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information Card - Disabled */}
              <div className="bg-card border-2 border-border p-6 opacity-75 pointer-events-none rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-blue-500/15 rounded">
                    <User className="text-blue-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Patient Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      Patient Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                      placeholder="Enter patient full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      Gender
                    </label>
                    <select
                      value={gender}
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        disabled
                        className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={age}
                        disabled
                        className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                        placeholder="Age"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground" />
                      Telephone Number
                    </label>
                    <input
                      type="tel"
                      value={telephone}
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Information Card - Disabled */}
              <div className="bg-card border-2 border-border p-6 opacity-75 pointer-events-none rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-teal-500/15 rounded">
                    <Stethoscope className="text-teal-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Referral Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <ClipboardList size={16} className="text-muted-foreground" />
                      Referral Option
                    </label>
                    <select
                      value={referralOption}
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                    >
                      <option value="None">None</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                  </div>

                  {(referralOption === "Doctor" || referralOption === "Hospital" || referralOption === "Insurance") && (
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Stethoscope size={16} className="text-muted-foreground" />
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        value={doctorName}
                        disabled
                        className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                        placeholder="Enter doctor name"
                      />
                    </div>
                  )}

                  {(referralOption === "Hospital" || referralOption === "Insurance") && (
                    <div>
                      <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Hospital size={16} className="text-muted-foreground" />
                        Hospital Name
                      </label>
                      <input
                        type="text"
                        value={hospitalName}
                        disabled
                        className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                        placeholder="Enter hospital name"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Test Selection Card - Disabled */}
              <div className="bg-card border-2 border-border p-6 opacity-50 pointer-events-none rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-green-500/15 rounded">
                    <TestTube className="text-green-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Test Selection</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Select Laboratory Test
                    </label>
                    <select
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed text-sm rounded"
                    >
                      <option value="">Choose a test from the list...</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      disabled
                      variant="blue"
                      className="w-full"
                    >
                      <Plus size={20} />
                      Add Test
                    </Button>
                  </div>
                </div>

                {tests.length > 0 ? (
                  <div className="border-2 border-border bg-muted/50 rounded">
                    <div className="grid grid-cols-12 gap-4 bg-muted px-4 py-3 border-b-2 border-border">
                      <div className="col-span-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Test Name</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Department</p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Cost</p>
                      </div>
                    </div>
                    {tests.map((test, index) => (
                      <div key={test.id} className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                        <div className="col-span-6 flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 min-w-[28px] text-center">
                            {index + 1}
                          </span>
                          <p className="text-sm font-semibold text-muted-foreground">{test.testName}</p>
                        </div>
                        <div className="col-span-3 flex items-center">
                          <p className="text-sm text-muted-foreground">{test.department}</p>
                        </div>
                        <div className="col-span-3 flex items-center justify-end">
                          <p className="text-sm font-bold text-muted-foreground">₵{test.testCost.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-border bg-muted/50">
                    <TestTube className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground font-medium">No tests recorded</p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Disabled */}
              <div className="flex flex-wrap gap-4 justify-between items-center bg-card border-2 border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex gap-3">
                  <Button
                    disabled
                    variant="red"
                  >
                    <Trash2 size={18} />
                    Delete Selected (0)
                  </Button>
                  <Button
                    disabled
                    variant="red"
                  >
                    <Trash2 size={18} />
                    Delete All Tests
                  </Button>
                </div>
                <Button
                  disabled
                  variant="green"
                  size="lg"
                  className="px-10 text-lg"
                >
                  <FileText size={20} />
                  Save Record
                </Button>
              </div>
            </div>
          )}

          {activeTab === "add-on-test" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Info Banner */}
              <div className="bg-green-500/10 border-l-4 border-green-600 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <FlaskConical className="text-green-700" size={24} />
                  <div>
                    <h3 className="font-bold text-green-700 dark:text-green-400">Add-on Test Mode</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">Patient information is locked. You can only add additional tests to this existing record.</p>
                  </div>
                </div>
              </div>

              {/* Lab Number Card */}
              <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/15 rounded">
                    <FileText className="text-blue-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Laboratory Record</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Lab Number
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="A1726021073491"
                        readOnly
                        className="flex-1 px-4 py-3 bg-blue-500/5 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-mono text-lg font-bold focus:outline-none rounded-l-xl"
                      />
                      <div className="px-4 py-3 bg-muted border border-l-0 border-border/60 rounded-r-xl">
                        <Calendar className="text-muted-foreground" size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full p-3 bg-gradient-to-r from-green-500/10 to-teal-500/10 border-2 border-green-500/30">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Status</p>
                      <p className="text-sm font-bold text-green-700 flex items-center gap-1.5"><Circle className="h-2.5 w-2.5 fill-current" /> Add-on Test Mode</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information Card - Disabled */}
              <div className="bg-card border-2 border-border p-6 opacity-60 pointer-events-none rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-blue-500/15 rounded">
                    <User className="text-blue-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Patient Information</h2>
                  <span className="ml-auto text-xs bg-muted px-3 py-1 font-semibold text-muted-foreground">LOCKED</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      Patient Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                      placeholder="Enter patient full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      Gender
                    </label>
                    <select
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                    >
                      <option value="">Select gender</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      Age
                    </label>
                    <input
                      type="number"
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                      placeholder="Enter age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground" />
                      Telephone Number
                    </label>
                    <input
                      type="tel"
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Information Card - Disabled */}
              <div className="bg-card border-2 border-border p-6 opacity-60 pointer-events-none rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-teal-500/15 rounded">
                    <Stethoscope className="text-teal-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Referral Information</h2>
                  <span className="ml-auto text-xs bg-muted px-3 py-1 font-semibold text-muted-foreground">LOCKED</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <ClipboardList size={16} className="text-muted-foreground" />
                      Referral Option
                    </label>
                    <select
                      disabled
                      className="w-full px-4 py-3 border-2 border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed rounded"
                    >
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Test Selection Card - ACTIVE */}
              <div className="bg-card border-2 border-green-400 p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <div className="p-2 bg-green-500/15 rounded">
                    <TestTube className="text-green-700" size={24} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Test Selection</h2>
                  <span className="ml-auto text-xs bg-green-500/15 px-3 py-1 font-semibold text-green-700 dark:text-green-400">ACTIVE</span>
                </div>
                
                {/* Test Selection Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">
                      Select Laboratory Test
                    </label>
                    <select
                      value={selectedTestDropdown}
                      onChange={(e) => setSelectedTestDropdown(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-colors rounded"
                    >
                      <option value="">Choose a test from the list...</option>
                      {availableTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.testName} - {test.department} (₵{test.testCost.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="blue"
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1"
                    >
                      <Search size={20} />
                      Bulk Add
                    </Button>
                    <Button
                      type="button"
                      variant="blue"
                      onClick={handleAddTest}
                      disabled={!selectedTestDropdown}
                      className="flex-1"
                    >
                      <Plus size={20} />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Tests Display Area */}
                {tests.length > 0 ? (
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Tests List - Takes 2/3 width */}
                    <div className="lg:col-span-2">
                      <div className="border border-border/60 bg-card rounded-xl overflow-hidden shadow-sm hover:shadow">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 bg-gradient-to-r from-muted to-muted px-4 py-3 border-b-2 border-border">
                          <div className="col-span-6">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Test Name</p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Department</p>
                          </div>
                          <div className="col-span-3 text-right">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Cost</p>
                          </div>
                        </div>
                        
                        {/* Test Rows */}
                        <div 
                          className="max-h-96 overflow-y-auto outline-none"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setFocusedTestIndex(prev => {
                                const nextIndex = prev === null ? 0 : Math.min(prev + 1, tests.length - 1);
                                if (tests[nextIndex]) setSelectedTests([tests[nextIndex].id]);
                                return nextIndex;
                              });
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setFocusedTestIndex(prev => {
                                const nextIndex = prev === null ? tests.length - 1 : Math.max(prev - 1, 0);
                                if (tests[nextIndex]) setSelectedTests([tests[nextIndex].id]);
                                return nextIndex;
                              });
                            }
                          }}
                        >
                          {tests.map((test, index) => (
                            <div 
                              key={test.id}
                              onClick={() => toggleTestSelection(test.id)}
                              className={`grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-all border-b border-border ${
                                selectedTests.includes(test.id) 
                                  ? "bg-primary/10 border-l-4 border-l-primary" 
                                  : index === focusedTestIndex 
                                    ? "bg-muted ring-2 ring-inset ring-blue-500" 
                                    : index % 2 === 0
                                      ? "bg-background hover:bg-muted/50"
                                      : "bg-muted/30 hover:bg-muted/50"
                              }`}
                            >
                              <div className="col-span-6 flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 min-w-[28px] text-center">
                                  {index + 1}
                                </span>
                                <p className="text-sm font-semibold text-foreground">{test.testName}</p>
                              </div>
                              <div className="col-span-3 flex items-center">
                                <p className="text-sm text-muted-foreground">{test.department}</p>
                              </div>
                              <div className="col-span-3 flex items-center justify-end">
                                <p className="text-sm font-bold text-green-700">₵{test.testCost.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">Click on a test row to select it for deletion</p>
                    </div>

                    {/* Payment Summary Card - Takes 1/3 width */}
                    <div className="lg:col-span-1">
                      <div className="border-2 border-border bg-card p-6 sticky top-0 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-teal-600">
                          <DollarSign className="text-teal-700" size={20} />
                          <h3 className="text-base font-bold text-foreground uppercase tracking-wide">Payment</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-border">
                            <span className="text-sm text-muted-foreground font-medium">Subtotal</span>
                            <span className="text-base font-bold text-foreground font-mono">₵{subtotal.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center pb-3 border-b border-border">
                            <span className="text-sm text-muted-foreground font-medium">Total Cost</span>
                            <span className="text-base font-bold text-foreground font-mono">₵{totalCost.toFixed(2)}</span>
                          </div>
                          
                          <div className="pb-3 border-b border-border">
                            <label className="block text-sm text-muted-foreground font-medium mb-2">Amount Paid</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₵</span>
                              <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(Number(e.target.value))}
                                className="w-full pl-8 pr-3 py-2 text-right text-base font-bold text-foreground bg-background border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono transition-colors rounded"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>
                          </div>
                          
                          <div className={`flex justify-between items-center pt-3 border-t-2 border-border px-3 py-3 ${
                            arrears > 0 ? 'bg-red-500/10 border-l-4 border-l-red-600' : 'bg-green-500/10 border-l-4 border-l-green-600'
                          }`}>
                            <span className="text-sm font-bold text-muted-foreground uppercase">Arrears</span>
                            <span className={`text-lg font-bold font-mono ${
                              arrears > 0 ? 'text-red-700' : 'text-green-700'
                            }`}>
                              ₵{arrears.toFixed(2)}
                            </span>
                          </div>

                          <div className="pt-2 text-xs text-muted-foreground space-y-1">
                            <p>• Total Tests: <span className="font-bold">{tests.length}</span></p>
                            <p>• Balance Due: <span className={`font-bold ${arrears > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {arrears > 0 ? 'Pending' : 'Cleared'}
                            </span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-border bg-muted/50">
                    <TestTube className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground font-medium">No tests added yet</p>
                    <p className="text-muted-foreground text-sm mt-1">Select a test from the dropdown above to begin</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-between items-center bg-card border-2 border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="red"
                    onClick={handleDeleteSelected}
                    disabled={selectedTests.length === 0}
                  >
                    <Trash2 size={18} />
                    Delete Selected ({selectedTests.length})
                  </Button>
                  <Button
                    type="button"
                    variant="red"
                    onClick={handleDeleteAll}
                    disabled={tests.length === 0}
                  >
                    <Trash2 size={18} />
                    Delete All Tests
                  </Button>
                </div>
                <Button
                  onClick={handleSaveRecord}
                  variant="green"
                  size="lg"
                  className="px-10 text-lg shadow-lg hover:shadow-xl"
                >
                  <FileText size={20} />
                  Save Record
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Test Modal */}
      <AnimatePresence mode="wait">
        {isModalOpen && (
          <motion.div 
            ref={modalRef}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: "easeOut" }}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsModalOpen(false);
            }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 outline-none rounded"
          >
            <motion.div 
              initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: "easeOut" }}
              className="bg-card border-2 border-border shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col rounded"
            >
            {/* Modal Header */}
            <div className="border-b-2 border-border p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground border-b-2 border-foreground pb-2">Select Test</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 transition-colors rounded"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 rounded"
                  placeholder="Search by test name or department..."
                />
              </div>
            </div>

            {/* Test List */}
            <div className="flex-1 overflow-auto p-6">
              <div className="border border-border rounded">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0 border-b-2 border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground border-r border-border w-12">
                        <Checkbox
                          checked={selectedAvailableTests.length === filteredAvailableTests.length && filteredAvailableTests.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAvailableTests(filteredAvailableTests.map(t => t.id));
                            } else {
                              setSelectedAvailableTests([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground border-r border-border">Test Name</th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground border-r border-border">Department</th>
                      <th className="px-4 py-3 text-right text-xs uppercase tracking-wide font-bold text-muted-foreground">Test Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAvailableTests.map((test, index) => (
                      <tr 
                        key={test.id} 
                        onClick={() => toggleAvailableTestSelection(test.id)}
                        className={`cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'}`}
                      >
                        <td className="px-4 py-3 border-b border-r border-border">
                          <Checkbox
                            checked={selectedAvailableTests.includes(test.id)}
                            onCheckedChange={() => toggleAvailableTestSelection(test.id)}
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-r border-border">
                          <span className="text-sm font-medium text-foreground">{test.testName}</span>
                        </td>
                        <td className="px-4 py-3 border-b border-r border-border">
                          <span className="text-sm text-muted-foreground">{test.department}</span>
                        </td>
                        <td className="px-4 py-3 text-right border-b border-border bg-amber-500/10">
                          <span className="text-sm font-semibold text-foreground">₵{test.testCost.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAvailableTests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded bg-muted/30 m-6">
                  <TestTube className="mx-auto text-muted-foreground mb-3" size={40} />
                  <p className="text-sm font-medium">No tests found matching your search</p>
                  <p className="text-xs mt-1">Try a different search term or check department names</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t-2 border-border p-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">{selectedAvailableTests.length}</span> test(s) selected
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  variant="green"
                  onClick={handleAddSelectedTests}
                  disabled={selectedAvailableTests.length === 0}
                  className="px-6"
                >
                  <Plus size={18} />
                  Add Selected Tests
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
}
