import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { UserPlus, UserCheck, FlaskConical } from "lucide-react";
import { NewPatientTab } from "../../features/patients/NewPatientTab";
import { ExistingPatientTab } from "../../features/patients/ExistingPatientTab";
import { AddOnTestTab } from "../../features/patients/AddOnTestTab";

type Tab = "new-patient" | "existing-patient" | "add-on-test";

export function DashboardAlpha() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const getNormalizedTab = (tab: string | null): Tab => {
    if (tab === "new" || tab === "new-patient") return "new-patient";
    if (tab === "existing" || tab === "existing-patient") return "existing-patient";
    if (tab === "addon" || tab === "add-on-test") return "add-on-test";
    return "new-patient";
  };

  const [activeTab, setActiveTab] = useState<Tab>(getNormalizedTab(tabParam));

  useEffect(() => {
    if (tabParam) {
      setActiveTab(getNormalizedTab(tabParam));
    }
  }, [tabParam]);

  const tabs = [
    { id: "new-patient" as Tab, label: "New Patient", icon: UserPlus },
    { id: "existing-patient" as Tab, label: "Existing Patient", icon: UserCheck },
    { id: "add-on-test" as Tab, label: "Add-on Test", icon: FlaskConical },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col">
        {/* Premium pill sub-tabs */}
        <div className="px-6 py-4 border-b border-border/50 bg-card/45">
          <div className="border border-border/50 bg-muted/25 rounded-2xl p-1.5 inline-flex gap-1.5 shrink-0 max-w-full overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all duration-200 whitespace-nowrap rounded-xl cursor-pointer outline-none ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          {activeTab === "new-patient" && (
            <div className="max-w-7xl mx-auto">
              <NewPatientTab />
            </div>
          )}

          {activeTab === "existing-patient" && (
            <div className="max-w-7xl mx-auto">
              <ExistingPatientTab />
            </div>
          )}

          {activeTab === "add-on-test" && (
            <div className="max-w-7xl mx-auto">
              <AddOnTestTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
