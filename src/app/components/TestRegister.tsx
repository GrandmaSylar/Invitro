import { useState } from "react";
import { ClipboardList, Pill, Trash2, Edit, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { LabBanner } from "./LabBanner";

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
      <div className="bg-white shadow-sm h-full flex flex-col">
        {/* Lab Header Banner */}
        <LabBanner className="border-b border-gray-300" />

        {/* Tabs Header */}
        <div className="border-b border-gray-300 px-6 pt-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? tab.color === "blue" ? "bg-blue-50 text-blue-700 border-blue-600" :
                        tab.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-600" :
                        "bg-gray-50 text-gray-700 border-gray-600"
                      : "text-gray-600 hover:bg-gray-50 border-transparent"
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
            <div className="space-y-6 bg-gray-50 p-6">
              {/* Parameter Name Section */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Saved.");
                }}
                className="bg-white border border-gray-300 p-4"
              >
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Parameter Name</h3>
                </div>
                
                {/* Parameter Input Fields */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Parameter Name</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Units</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reference Range</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="button" className="w-full px-4 py-1 border border-gray-400 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Add
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Parameter Order ID</label>
                    <input 
                      type="text"
                      value={parameterOrderId}
                      onChange={(e) => setParameterOrderId(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trimester Type</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Parameter Table */}
                <div 
                  className="border border-gray-300 max-h-48 overflow-auto outline-none"
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
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="border-r border-gray-300 px-2 py-1 text-left text-xs font-bold text-gray-700">Parameter Name</th>
                        <th className="border-r border-gray-300 px-2 py-1 text-left text-xs font-bold text-gray-700">Units</th>
                        <th className="px-2 py-1 text-left text-xs font-bold text-gray-700">Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parameterData.map((param, index) => (
                        <tr 
                          key={index} 
                          onClick={() => setSelectedParameter(index)}
                          className={`border-t border-gray-300 cursor-pointer transition-colors ${
                            selectedParameter === index 
                              ? 'bg-gray-300' 
                              : index === focusedParameterIndex 
                                ? 'bg-gray-100 ring-2 ring-inset ring-blue-500'
                                : 'hover:bg-gray-100'
                          }`}
                        >
                          <td className="border-r border-gray-300 px-2 py-1 text-xs text-gray-900">{param.parameterName}</td>
                          <td className="border-r border-gray-300 px-2 py-1 text-xs text-gray-700">{param.units}</td>
                          <td className="px-2 py-1 text-xs text-gray-700">{param.referenceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Button Row */}
                <div className="mt-4 flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => { if (selectedParameter !== null) { setSelectedParameter(null); toast("Deleted."); } }}
                    disabled={selectedParameter === null}
                    className={`px-4 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                      selectedParameter !== null 
                        ? 'text-red-700 hover:bg-red-50 border-red-400 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Delete Set Parameter
                  </button>
                  <button 
                    type="button"
                    onClick={() => toast("Deleted.")}
                    className="px-4 py-1 border border-gray-400 text-xs font-semibold text-red-700 hover:bg-red-50 border-red-400 transition-colors"
                  >
                    Delete All Parameters
                  </button>
                  <button 
                    type="button"
                    onClick={() => { if (selectedParameter !== null) toast("Edit mode."); }}
                    disabled={selectedParameter === null}
                    className={`px-4 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                      selectedParameter !== null 
                        ? 'text-blue-700 hover:bg-blue-50 border-blue-400 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Edit Parameter
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1 border border-gray-400 text-xs font-semibold text-green-700 hover:bg-green-50 border-green-400 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>

              {/* Test Name Section */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Saved.");
                }}
                className="bg-white border border-gray-300 p-4"
              >
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Test Name</h3>
                </div>
                
                {/* Test Input Fields */}
                <div className="grid grid-cols-6 gap-4 items-end mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Test ID</label>
                    <input 
                      type="text" 
                      value={testId} 
                      onChange={(e) => setTestId(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                    <select className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600">
                      <option></option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Test Name</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Result Header</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reference Range</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-4 items-end mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Test Cost</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeComprehensive}
                        onChange={(e) => setIncludeComprehensive(e.target.checked)}
                        className="w-3 h-3 border-gray-400"
                      />
                      <span className="text-xs text-gray-700">Include in Comprehensive Screening</span>
                    </label>
                  </div>
                </div>

                {/* Test Name Table */}
                <div 
                  className="border border-gray-300 max-h-48 overflow-auto mb-4 outline-none"
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
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="border-r border-gray-300 px-2 py-1 text-left text-xs font-bold text-gray-700">TestName</th>
                        <th className="border-r border-gray-300 px-2 py-1 text-left text-xs font-bold text-gray-700">Department</th>
                        <th className="px-2 py-1 text-left text-xs font-bold text-gray-700">TestCost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testNameData.map((test, index) => (
                        <tr 
                          key={index} 
                          onClick={() => setSelectedTest(index)}
                          className={`border-t border-gray-300 cursor-pointer transition-colors ${
                            selectedTest === index 
                              ? 'bg-gray-300' 
                              : index === focusedTestIndex 
                                ? 'bg-gray-100 ring-2 ring-inset ring-blue-500'
                                : 'hover:bg-gray-100'
                          }`}
                        >
                          <td className="border-r border-gray-300 px-2 py-1 text-xs text-gray-900">{test.testName}</td>
                          <td className="border-r border-gray-300 px-2 py-1 text-xs text-gray-700">{test.department}</td>
                          <td className="px-2 py-1 text-xs text-gray-700">{test.testCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Button Row */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => { if (selectedTest !== null) { setSelectedTest(null); toast("Deleted."); } }}
                    disabled={selectedTest === null}
                    className={`px-4 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                      selectedTest !== null 
                        ? 'text-red-700 hover:bg-red-50 border-red-400 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Delete Test
                  </button>
                  <button 
                    type="button"
                    onClick={() => toast("Deleted.")}
                    className="px-4 py-1 border border-gray-400 text-xs font-semibold text-red-700 hover:bg-red-50 border-red-400 transition-colors"
                  >
                    Delete All Tests
                  </button>
                  <button 
                    type="button"
                    onClick={() => { if (selectedTest !== null) toast("Edit mode."); }}
                    disabled={selectedTest === null}
                    className={`px-4 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                      selectedTest !== null 
                        ? 'text-blue-700 hover:bg-blue-50 border-blue-400 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Edit Test
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1 border border-gray-400 text-xs font-semibold text-green-700 hover:bg-green-50 border-green-400 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "antibiotics" && (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header Section */}
              <div className="bg-white border border-gray-300 p-6">
                <div className="border-l-4 border-purple-600 pl-4">
                  <h2 className="text-2xl font-bold text-gray-900">Antibiotic Registry</h2>
                  <p className="text-gray-600 mt-2">Manage antibiotic inventory and records</p>
                </div>
              </div>

              {/* Antibiotic Entry Form */}
              <div className="bg-white border border-gray-300 p-6 shadow-sm">
                <div className="border-t-2 border-purple-600 pt-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Antibiotic ID:
                      </label>
                      <input
                        type="text"
                        value={searchAntibioticId}
                        onChange={(e) => setSearchAntibioticId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-400 focus:outline-none focus:border-purple-600 font-medium"
                        placeholder="Enter Antibiotic ID"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Antibiotic Name:
                      </label>
                      <input
                        type="text"
                        value={antibioticName}
                        onChange={(e) => setAntibioticName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-400 focus:outline-none focus:border-purple-600 font-medium"
                        placeholder="Enter Antibiotic Name"
                      />
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 font-semibold transition-colors">
                      <Save size={18} />
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Entries / Duplicate Records Panel */}
              <div className="bg-white border border-gray-300 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                  Recent Entries
                </h3>
                <div className="space-y-4">
                  {recentEntries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase">Antibiotic ID:</span>
                        <p className="text-sm font-bold text-gray-900 mt-1">{entry.antibioticId}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase">Antibiotic Name:</span>
                        <p className="text-sm text-gray-500 mt-1 italic">{entry.antibioticName || "(Empty)"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer to push footer to bottom */}
              <div className="flex-1"></div>

              {/* Utility Footer */}
              <div className="bg-gray-100 border-t-2 border-gray-400 p-6 shadow-lg sticky bottom-0">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-semibold transition-colors">
                    <Trash2 size={18} />
                    Delete All Antibiotics
                  </button>
                  <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-semibold transition-colors">
                    <Trash2 size={18} />
                    Delete All Antibiotics
                  </button>
                  <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold transition-colors">
                    <Edit size={18} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}