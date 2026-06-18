import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  BookOpen, 
  ClipboardPen, 
  User, 
  Settings, 
  Activity, 
  UserPlus, 
  Clock, 
  TrendingUp, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  Terminal, 
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Play
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../lib/permissions";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Button } from "../../app/components/ui/button";
import { Badge } from "../../app/components/ui/badge";

interface HelpSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: { title: string; text: string; tip?: string }[];
  requiredPermissions: string[];
}

export function RbacHelpPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Tab control: guides vs role profiles vs simulator
  const [activeTab, setActiveTab] = useState<"guides" | "roles" | "simulator">("guides");

  // Simulator State
  const [simRole, setSimRole] = useState<string>("receptionist");
  const [simPermission, setSimPermission] = useState<string>("patients.create");
  const [simOverride, setSimOverride] = useState<"none" | "grant" | "deny">("none");
  const [simResult, setSimResult] = useState<{
    allowed: boolean;
    reason: string;
  } | null>(null);

  // Check current user's permissions
  const canCreatePatients = usePermission("patients.create");
  const canViewPatients = usePermission("patients.view");
  const canEditResults = usePermission("results_entry.edit");
  const canViewResults = usePermission("results_entry.view");
  const canManageRbac = usePermission("rbac.manage_users");
  const canViewSettings = usePermission("settings.view");
  const canViewAudit = usePermission("rbac.view_audit");

  // Dynamic help sections definition
  const helpSections: HelpSection[] = [
    {
      title: "Patient Registry & Demographics Workflows",
      description: "How to register patients, record billing, and print receipts.",
      icon: <UserPlus className="h-5 w-5 text-emerald-500" />,
      requiredPermissions: ["patients.create", "patients.view"],
      steps: [
        {
          title: "Step 1: Patient Registration",
          text: "Navigate to the Patients workspace and click 'Register Patient'. Input full name, age, phone number, and gender. These fields are parsed for reference ranges.",
          tip: "Arrears are computed as Subtotal - Amount Paid. Always enter the deposit accurately."
        },
        {
          title: "Step 2: Catalog Selection",
          text: "Select parameters from the searchable test dropdown. Subtotals are dynamically calculated based on seeded prices.",
          tip: "Outstanding bills prevent lab records from being closed, even after results are recorded."
        },
        {
          title: "Step 3: Receipt Printing",
          text: "After registering, click the print icon to launch the receipt preview modal. You can toggle between full A4 layout or thermal 80mm roll printer templates.",
        }
      ]
    },
    {
      title: "Results Entry & Clinical Validation Workflows",
      description: "How to enter test values, examine reference limits, and validation flags.",
      icon: <ClipboardPen className="h-5 w-5 text-purple-500" />,
      requiredPermissions: ["results_entry.edit", "results_entry.view"],
      steps: [
        {
          title: "Step 1: Locate Pending Worklist",
          text: "Open Results Entry. Filter by department or search the patient's name/lab number to isolate pending entries.",
        },
        {
          title: "Step 2: Record Measured Metrics",
          text: "Input observed lab values into the parameter table. The LIMS dynamically flags abnormal outputs as High (red) or Low (blue) relative to reference ranges.",
          tip: "Abnormal flags trigger alert banners in the print preview automatically."
        },
        {
          title: "Step 3: Validate & Release Reports",
          text: "Save results to close the file. Authorized roles can instantly preview the formal print layouts and export signed PDFs.",
        }
      ]
    },
    {
      title: "Administration & User Access Management",
      description: "Managing employee credentials, role permissions, and individual overrides.",
      icon: <ShieldCheck className="h-5 w-5 text-amber-500" />,
      requiredPermissions: ["rbac.manage_users", "rbac.manage_roles"],
      steps: [
        {
          title: "Step 1: Creating User Accounts",
          text: "Navigate to Users & Roles. Set names, login usernames, and default roles.",
          tip: "User deactivation immediately locks out local cached databases to protect offline client stores."
        },
        {
          title: "Step 2: Assigning Permission Overrides",
          text: "Select a user to review their individual profile card. If a technician needs temporary settings access, toggle an individual override grant without changing their base role.",
        },
        {
          title: "Step 3: Setting the Permission Matrix",
          text: "Open Permission Matrix to modify default roles globally. Changes take effect on the next reload of the navigation drawer.",
        }
      ]
    },
    {
      title: "System Config, SMTP Settings & Backup Architectures",
      description: "Managing headers, email triggers, offline databases, and backups.",
      icon: <Settings className="h-5 w-5 text-rose-500" />,
      requiredPermissions: ["settings.view"],
      steps: [
        {
          title: "Step 1: System Header Customization",
          text: "Navigate to Settings. Modify contact phones, logo icons, and report layouts.",
        },
        {
          title: "Step 2: SMTP Mail Delivery Settings",
          text: "Configure SMTP server addresses, host ports, and SSL credentials to dispatch email alerts when results are finalized.",
          tip: "Use the 'Test SMTP' feature to test email relay configurations."
        },
        {
          title: "Step 3: Encrypted Database Backups",
          text: "LIMS saves local data in `lims.db`. Automated exit scripts generate AES-256-GCM encrypted backup archives (`lims.db.enc`) for secure recovery.",
        }
      ]
    },
    {
      title: "Immutable Security Audits & Tracking",
      description: "Analyzing the global audit logs to track sensitive operations.",
      icon: <Terminal className="h-5 w-5 text-blue-500" />,
      requiredPermissions: ["settings.audit_log", "rbac.view_audit"],
      steps: [
        {
          title: "Step 1: Review Security Events",
          text: "Security audit logs capture sensitive transactions, value overrides, technician logins, and patient deletions.",
        },
        {
          title: "Step 2: Analyzing Incident Records",
          text: "Logs store timestamps, active account usernames, client IP address, action types, and raw payload diffs.",
          tip: "Audit trails are stored locally in SQLite and synchronized to Supabase securely."
        }
      ]
    }
  ];

  // Filter sections that the current user has permission to see
  const authorizedSections = helpSections.filter(sec => 
    sec.requiredPermissions.some(perm => {
      // Check if user has this permission key
      if (perm === "patients.create") return canCreatePatients;
      if (perm === "patients.view") return canViewPatients;
      if (perm === "results_entry.edit") return canEditResults;
      if (perm === "results_entry.view") return canViewResults;
      if (perm === "rbac.manage_users") return canManageRbac;
      if (perm === "rbac.manage_roles") return canManageRbac; // check admin
      if (perm === "settings.view") return canViewSettings;
      if (perm === "settings.audit_log") return canViewSettings; // check settings
      if (perm === "rbac.view_audit") return canViewAudit;
      return false;
    })
  );

  // Role permissions mapping for simulator
  const rolePermissions: Record<string, string[]> = {
    admin: Object.keys(PERMISSIONS),
    developer: Object.keys(PERMISSIONS),
    receptionist: [
      "dashboard.view",
      "dashboard.view_patients_today",
      "dashboard.view_revenue_month",
      "patients.view",
      "patients.create",
      "patients.edit",
      "profile.view",
      "notifications.view"
    ],
    lab_technician: [
      "dashboard.view",
      "dashboard.view_tests_today",
      "dashboard.view_pending_results",
      "patients.view",
      "test_register.view",
      "results_entry.view",
      "results_entry.edit",
      "profile.view",
      "notifications.view"
    ],
    viewer: [
      "dashboard.view",
      "patients.view",
      "profile.view",
      "notifications.view"
    ]
  };

  const runSimulation = () => {
    let allowed = false;
    let reason = "";

    if (simOverride === "grant") {
      allowed = true;
      reason = `Access GRANTED. User is assigned the '${simRole}' role, but an INDIVIDUAL GRANT OVERRIDE was explicitly set on their account profile for '${simPermission}', bypassing the role's default limits.`;
    } else if (simOverride === "deny") {
      allowed = false;
      reason = `Access DENIED. Although the user has the '${simRole}' role, an INDIVIDUAL DENY OVERRIDE was explicitly placed on their account for '${simPermission}', blocking access.`;
    } else {
      // Check role permissions
      const permissionsList = rolePermissions[simRole] || [];
      if (permissionsList.includes(simPermission)) {
        allowed = true;
        reason = `Access GRANTED. The '${simRole}' role contains the '${simPermission}' permission key by default.`;
      } else {
        allowed = false;
        reason = `Access DENIED. The '${simRole}' role does not have the '${simPermission}' permission key, and no individual grant overrides exist for this account.`;
      }
    }

    setSimResult({ allowed, reason });
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1280px] mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Shield className="text-primary h-8 w-8 stroke-[2.5]" />
            RBAC Guide & Workflow Tutorials
          </h1>
          <p className="text-sm text-muted-foreground">
            Learn how the LIMS permission system works and browse dynamic guides based on your access level.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50 bg-card/40 p-1.5 rounded-2xl border flex inline-flex gap-1.5 shrink-0">
        <button
          onClick={() => setActiveTab("guides")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all duration-200 whitespace-nowrap rounded-xl cursor-pointer outline-none border-none ${
            activeTab === "guides"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <BookOpen size={14} />
          Your Tailored Guides
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all duration-200 whitespace-nowrap rounded-xl cursor-pointer outline-none border-none ${
            activeTab === "roles"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ShieldCheck size={14} />
          Role Definitions & Glossary
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition-all duration-200 whitespace-nowrap rounded-xl cursor-pointer outline-none border-none ${
            activeTab === "simulator"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Activity size={14} />
          Interactive RBAC Simulator
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === "guides" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs font-bold text-primary/90 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 stroke-[2.2] shrink-0" />
              <span>
                Hello, {user?.fullName || "Staff member"}! We've dynamically customized this guidance list to match the active permissions of your current role ({user?.roleId || "viewer"}).
              </span>
            </div>

            {authorizedSections.length === 0 ? (
              <Card className="border-border/60 bg-card/60 backdrop-blur-md p-10 text-center">
                <Lock className="mx-auto h-12 w-12 text-rose-500 opacity-40 mb-3" />
                <h3 className="font-extrabold text-foreground text-base uppercase tracking-tight">Minimum View Only Access</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
                  Your active account is configured as a basic Viewer. You do not carry permissions to manage registry forms, process clinical parameters, or administer database logs.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {authorizedSections.map((section, idx) => (
                  <Card key={idx} className="border-border/60 bg-card/60 backdrop-blur-md flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/80 border border-border/40 rounded-xl shrink-0">
                          {section.icon}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-extrabold text-foreground">{section.title}</CardTitle>
                          <CardDescription className="text-[11px] mt-0.5">{section.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {section.steps.map((step, sidx) => (
                          <div key={sidx} className="text-xs">
                            <span className="font-extrabold block text-foreground mb-1">{step.title}</span>
                            <span className="text-muted-foreground block leading-relaxed">{step.text}</span>
                            {step.tip && (
                              <span className="text-[10px] text-amber-500/80 font-bold block mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={10} className="shrink-0" />
                                Tip: {step.tip}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "roles" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base font-black text-foreground uppercase tracking-tight">System Role Glossary</CardTitle>
                  <CardDescription>Default built-in staff hierarchies in Invitro LIMS</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 divide-y divide-border/20">
                    <div className="pt-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-rose-500/10 text-rose-400 font-extrabold border-rose-500/25">Developer</Badge>
                        <span className="text-xs text-muted-foreground font-bold">— Complete administrative scope</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-1 pt-1">
                        Carries full bypass capabilities including direct database triggers, offline sync diagnostics, raw schema updates, and SMTP test channels.
                      </p>
                    </div>

                    <div className="pt-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/10 text-amber-400 font-extrabold border-amber-500/25">Administrator</Badge>
                        <span className="text-xs text-muted-foreground font-bold">— Laboratory Owner / General Manager</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-1 pt-1">
                        Authorized to edit user profiles, assign overrides, update laboratory settings, generate API keys, view audit logging, and modify the permission matrix.
                      </p>
                    </div>

                    <div className="pt-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/10 text-purple-400 font-extrabold border-purple-500/25">Lab Technician</Badge>
                        <span className="text-xs text-muted-foreground font-bold">— Clinical Analyst</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-1 pt-1">
                        Focuses on clinical workflows. Authorized to view test logs, sample queues, key in result values, evaluate ranges, and validate finished reports. Omitted from editing costs, settings, or user records.
                      </p>
                    </div>

                    <div className="pt-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-400 font-extrabold border-emerald-500/25">Receptionist</Badge>
                        <span className="text-xs text-muted-foreground font-bold">— Billing & Reception desk</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-1 pt-1">
                        Handles front-desk operations. Authorized to enter patient registration data, assign tests from the catalog, record financial payments, track arrears, and print POS receipt rolls. Restricted from results logging or system settings.
                      </p>
                    </div>

                    <div className="pt-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/10 text-blue-400 font-extrabold border-blue-500/25">Viewer</Badge>
                        <span className="text-xs text-muted-foreground font-bold">— Read-only Auditor</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-1 pt-1">
                        Can search patients and view clinical reports, but cannot modify records, log deposits, alter results, or access settings panels.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base font-black text-foreground uppercase tracking-tight">Permissions Matrix Guide</CardTitle>
                  <CardDescription>Security key scopes glossary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <span className="font-extrabold block text-foreground">What is an Override?</span>
                    <p className="text-muted-foreground leading-relaxed">
                      In Invitro LIMS, you can assign individual permissions to override global role settings. If a receptionist requires settings access, you don't need to make them an Admin—simply add a grant override for `settings.view` in their user profile card.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <span className="font-extrabold block text-foreground">Offline Security Vaults</span>
                    <p className="text-muted-foreground leading-relaxed font-semibold">
                      When working offline, permissions are cached locally in SQLite. The Electron client enforces this cached matrix to protect clinical workflows even when disconnected from Supabase.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Simulation configuration */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-md lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black text-foreground uppercase tracking-tight">Access Control Simulator</CardTitle>
                <CardDescription>Test LIMS security check outputs with mock credentials & overrides</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Simulator Forms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5 text-xs">
                    <span className="font-extrabold text-foreground block">1. Select Mock Role</span>
                    <select
                      value={simRole}
                      onChange={(e) => { setSimRole(e.target.value); setSimResult(null); }}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-sm"
                    >
                      <option value="developer">Developer</option>
                      <option value="admin">Administrator</option>
                      <option value="lab_technician">Lab Technician</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-extrabold text-foreground block">2. Select Target Action</span>
                    <select
                      value={simPermission}
                      onChange={(e) => { setSimPermission(e.target.value); setSimResult(null); }}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-sm"
                    >
                      <option value="dashboard.view">dashboard.view (Open Main Dashboard)</option>
                      <option value="dashboard.view_revenue_month">dashboard.view_revenue_month (Revenue Tab)</option>
                      <option value="patients.create">patients.create (Register Patient)</option>
                      <option value="patients.delete">patients.delete (Delete Patient File)</option>
                      <option value="results_entry.edit">results_entry.edit (Record Lab Results)</option>
                      <option value="rbac.manage_users">rbac.manage_users (User Account Management)</option>
                      <option value="settings.view">settings.view (Access System Settings)</option>
                      <option value="settings.audit_log">settings.audit_log (Review Audit Logs)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-extrabold text-foreground block">3. Individual Profile Override</span>
                    <select
                      value={simOverride}
                      onChange={(e) => { setSimOverride(e.target.value as any); setSimResult(null); }}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-sm"
                    >
                      <option value="none">No Override (Inherit Role Default)</option>
                      <option value="grant">Force Grant (Override Profile Key)</option>
                      <option value="deny">Force Deny (Block Profile Key)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/20">
                  <Button 
                    onClick={runSimulation} 
                    className="gap-2 font-bold px-6 rounded-xl shrink-0"
                  >
                    <Play size={13} className="fill-current" />
                    Simulate Access Check
                  </Button>
                </div>

                {/* Simulation Result */}
                {simResult && (
                  <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    simResult.allowed 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                  }`}>
                    <div className="flex items-start gap-3 text-xs leading-relaxed">
                      {simResult.allowed ? (
                        <ShieldCheck className="h-6 w-6 text-emerald-500 stroke-[2.2] shrink-0" />
                      ) : (
                        <ShieldAlert className="h-6 w-6 text-rose-500 stroke-[2.2] shrink-0" />
                      )}
                      <div>
                        <span className="font-extrabold text-sm block mb-1 text-foreground">
                          {simResult.allowed ? "ACCESS GRANTED" : "ACCESS DENIED / LOCKED"}
                        </span>
                        <span className="text-muted-foreground block">{simResult.reason}</span>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Matrix Glossary card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black text-foreground uppercase tracking-tight">Security Sandbox Info</CardTitle>
                <CardDescription>Understanding the RBAC hierarchy decision path</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Invitro LIMS resolves user requests sequentially using the following precedence tree:
                </p>
                <div className="space-y-1.5 p-3.5 bg-muted/50 border border-border/20 rounded-xl font-semibold">
                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <span>1.</span>
                    <Unlock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Check Overrides first:</span>
                  </div>
                  <p className="pl-5 text-[11px] mb-2">
                    If an override matches the query target, the request immediately exits carrying the override's rule.
                  </p>

                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                    <span>2.</span>
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Inherit default:</span>
                  </div>
                  <p className="pl-5 text-[11px]">
                    If no user-level profile overrides are present, we look up the user's role profile permissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
