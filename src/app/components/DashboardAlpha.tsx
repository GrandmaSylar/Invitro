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
    <div className="p-4 sm:p-6 h-full space-y-6">
      <div className="bg-card flex flex-col rounded-2xl shadow-sm border border-border/50 overflow-hidden h-full">
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

        <div className="flex-1 overflow-auto p-6 bg-background">
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
