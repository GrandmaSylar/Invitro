import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Shield, 
  FlaskConical, 
  Users, 
  Database,
  Search,
  ArrowRight,
  ArrowLeft,
  Compass,
  Play,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Info,
  Clock,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../app/components/ui/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'sync' | 'billing' | 'results' | 'admin';
}

interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
  actionText?: string;
  actionPath?: string;
}

interface RoleGuide {
  id: string;
  title: string;
  roleName: string;
  icon: React.ReactNode;
  colorClass: string;
  bgGradient: string;
  description: string;
  steps: TutorialStep[];
}

export function HelpPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Normalize developer, receptionist, etc to matching IDs
  const getInitialRole = () => {
    const roleId = user?.roleId || 'viewer';
    if (['admin', 'developer', 'receptionist', 'lab_technician'].includes(roleId)) {
      return roleId;
    }
    return 'general';
  };

  const [selectedRole, setSelectedRole] = useState<string>(getInitialRole());
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState<number>(-1); // -1 = inactive
  
  // Step tracker for each role wizard
  const [wizardSteps, setWizardSteps] = useState<Record<string, number>>({
    general: 0,
    receptionist: 0,
    lab_technician: 0,
    admin: 0,
    developer: 0,
  });

  const handleNextStep = (roleId: string, maxSteps: number) => {
    setWizardSteps(prev => ({
      ...prev,
      [roleId]: Math.min(prev[roleId] + 1, maxSteps - 1)
    }));
  };

  const handlePrevStep = (roleId: string) => {
    setWizardSteps(prev => ({
      ...prev,
      [roleId]: Math.max(prev[roleId] - 1, 0)
    }));
  };

  const resetWizard = (roleId: string) => {
    setWizardSteps(prev => ({
      ...prev,
      [roleId]: 0
    }));
  };

  // Sync selectedRole if user changes (e.g. log in / log out)
  useEffect(() => {
    setSelectedRole(getInitialRole());
  }, [user]);

  // Guides Content Configuration
  const roleGuides: RoleGuide[] = [
    {
      id: 'general',
      title: 'General User',
      roleName: 'Viewer / Staff',
      icon: <BookOpen className="h-5 w-5" />,
      colorClass: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
      bgGradient: 'from-blue-500/5 to-indigo-500/5',
      description: 'Basics on layout, sidebar workspace, theme preferences, and daily overview.',
      steps: [
        {
          title: 'System Interface Overview',
          description: 'The Invitro LIMS dashboard provides a quick birds-eye view of your lab. Check today\'s total registration, billing totals, and results status directly from the charts on the Dashboard.',
          tip: 'Click on page charts to drill down into active patient categories.',
          actionText: 'View Dashboard',
          actionPath: '/'
        },
        {
          title: 'Managing Sidebar Workspaces',
          description: 'Hovering over the left sidebar expands the navigation pane. Workspaces are grouped into categories: Workspace (Dashboard, Patients, Tests & Samples, Results), Operations (Hospitals/Doctors), and Administration (Users & Settings).',
          tip: 'The sidebar locks in mini-mode when your cursor leaves to preserve screen space.'
        },
        {
          title: 'Theme & Styling Customization',
          description: 'Invitro LIMS supports dark mode and custom theme presets (Ocean Breeze, Turquoise Harmony, Silent Waters). To configure this, click your Profile badge in the bottom-left or top-right dropdown, then scroll to Theme Settings.',
          tip: 'Preset changes apply instantly across both local and synchronized devices.',
          actionText: 'Go to Profile Page',
          actionPath: '/profile'
        }
      ]
    },
    {
      id: 'receptionist',
      title: 'Receptionist',
      roleName: 'Billing & Front Desk',
      icon: <Users className="h-5 w-5" />,
      colorClass: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
      bgGradient: 'from-emerald-500/5 to-teal-500/5',
      description: 'Demographics entry, catalog test selection, billing calculation, and receipts.',
      steps: [
        {
          title: 'Registering a Patient',
          description: 'Go to the Patients page and click "Register Patient". Complete the patient\'s name, telephone, age/dob, and gender. Accurate demographic data is critical for range calculations later.',
          tip: 'If the patient doesn\'t know their exact DOB, just input their age and the system will approximate the birth year.',
          actionText: 'Open Patients Directory',
          actionPath: '/patients'
        },
        {
          title: 'Assigning Tests & Cost Selection',
          description: 'Inside the registration modal, select tests from the interactive Lab Catalog dropdown. The system automatically fetches cost rules (e.g. G6PD, FBC, Lipase) and aggregates the subtotal in real-time.',
          tip: 'Search in the test dropdown to quickly filter from the 223+ seeded catalog items.'
        },
        {
          title: 'Entering Payments & Arrears',
          description: 'In the billing section, input the "Amount Paid". The LIMS computes arrears instantly. Records with outstanding arrears are marked with a "Pending" status and cannot be fully closed until paid in full.',
          tip: 'You can print receipts in multiple layouts (A4, A5, 80mm POS thermal) based on customer preference.'
        },
        {
          title: 'Sync Queue Tracking',
          description: 'If you are offline, registrations receive temporary identifiers (TEMP-XXXX). They save to your local database and wait in the outbound Sync Queue. They will upload automatically once connection is restored.',
          tip: 'Check the TitleBar dots: amber indicates pending records are queuing to sync.'
        }
      ]
    },
    {
      id: 'lab_technician',
      title: 'Lab Technician',
      roleName: 'Samples & Results Entry',
      icon: <FlaskConical className="h-5 w-5" />,
      colorClass: 'text-purple-500 border-purple-500/20 bg-purple-500/10',
      bgGradient: 'from-purple-500/5 to-fuchsia-500/5',
      description: 'Result logging, reference ranges, auto-flagging, and validating lab parameters.',
      steps: [
        {
          title: 'Searching Pending Records',
          description: 'Go to the Results page. Locate patient files by typing their Lab Number or Name. Patients with pending parameters will show an active "Enter Results" button.',
          tip: 'Work on records from oldest to newest to maintain optimal sample turnaround times.',
          actionText: 'Go to Results Entry',
          actionPath: '/results-entry'
        },
        {
          title: 'Entering Measured Values',
          description: 'Click into a record to load its parameter grid. Type the observed metric. The LIMS checks the value against the catalog\'s reference range and highlights abnormal flags (High/Low) dynamically.',
          tip: 'Double-check units (e.g. g/dL vs. U/L) on the parameter cards before saving.'
        },
        {
          title: 'Recording and Saving Results',
          description: 'Once all values are logged, click "Save Results". If you are offline, these values will cache locally in your SQLite database. Triggers will recalculate record completion status to "Active" or "Closed".',
          tip: 'Saved results immediately sync to the remote database once connection is active.'
        }
      ]
    },
    {
      id: 'admin',
      title: 'Administrator',
      roleName: 'Users, Roles & Logs',
      icon: <Shield className="h-5 w-5" />,
      colorClass: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
      bgGradient: 'from-amber-500/5 to-orange-500/5',
      description: 'Staff account management, custom RBAC permissions, audit events, and settings.',
      steps: [
        {
          title: 'Creating and Editing Users',
          description: 'Navigate to Settings > Users & Roles. Here you can add new staff accounts, toggle their activation status, edit credentials, or assign them roles (Admin, Lab Technician, Receptionist, Developer, Viewer).',
          tip: 'Deactivating an employee immediately revokes their offline cached database access.',
          actionText: 'Manage Users & Roles',
          actionPath: '/settings?tab=users'
        },
        {
          title: 'Role-Based Access Control (RBAC)',
          description: 'granularly manage roles and permissions via the Permission Matrix inside the Users & Roles settings tab. Toggle permissions for specific actions (e.g. "Create Patient", "Edit Results", "Delete Catalog Item") to restrict or allow features for different roles.',
          tip: 'Users can have individual permission overrides listed in their user card details.',
          actionText: 'Open Permission Matrix',
          actionPath: '/settings?tab=users'
        },
        {
          title: 'Audit Trails & System Event Logging',
          description: 'Every sensitive operation (logins, value alterations, deactivations, deletions) creates an immutable log in the audit trail. These logs include timestamp, actor profile, action type, and details.',
          tip: 'Use search filters on the settings log area to track security incidents.'
        },
        {
          title: 'General Settings & Backup Configuration',
          description: 'Navigate to the Settings page. You can customize the laboratory header, contact phone, receipt notes, logos, SMTP mail delivery rules, and auto-backup schedules.',
          tip: 'Logo image uploads automatically compress and save locally for offline rendering.',
          actionText: 'Configure Settings',
          actionPath: '/settings'
        }
      ]
    },
    {
      id: 'developer',
      title: 'Developer',
      roleName: 'Migrations & API Integrations',
      icon: <Database className="h-5 w-5" />,
      colorClass: 'text-rose-500 border-rose-500/20 bg-rose-500/10',
      bgGradient: 'from-rose-500/5 to-pink-500/5',
      description: 'Database maintenance, offline queues, schema details, and API configuration.',
      steps: [
        {
          title: 'Database Schema & Tables',
          description: 'The local database uses SQLite (`lims.db`) and mirrors the cloud Postgres tables. Encrypted backups (`lims.db.enc`) are automatically outputted using custom AES-256-GCM nodes on save closures.',
          tip: 'Schema migration SQL files are located in `/supabase/migrations/` and should be kept in sync.'
        },
        {
          title: 'Offline Sync Queue Architecture',
          description: 'Offline mutations append to `sync_queue` table with JSON payloads. The background electron syncer processes entries chronologically using Supabase RPCs like `generate_lab_number` to assign production keys.',
          tip: 'Inspect the SQLite `sync_queue` table status directly if synchronization is halted.'
        },
        {
          title: 'API Keys & Developers Panel',
          description: 'To enable external instruments or web portal integrations, generate api keys in Settings > API Keys. These keys carry custom permissions payloads.',
          tip: 'Ensure that the VITE_SUPABASE_URL is correctly populated in `.env.local`.'
        }
      ]
    }
  ];

  // FAQ Repository
  const faqDatabase: FAQItem[] = [
    {
      id: 'faq-sync-1',
      category: 'sync',
      question: 'How does the LIMS work in offline mode?',
      answer: 'Invitro LIMS uses a local-first architecture. When internet connection is lost, all operations (patient registries, test creations, result records) are saved instantly into a local SQLite database (`lims.db`) on your computer. An outbound queue (`sync_queue`) records these edits. When you go online, a background sync worker automatically processes the queue, syncing your changes to Supabase in order.'
    },
    {
      id: 'faq-sync-2',
      category: 'sync',
      question: 'What do the colored dots in the title bar represent?',
      answer: 'The status indicator in the Title Bar represents sync health: \n• Green: System is online and all local data is fully synced. \n• Amber: Offline mode is active, or there are pending items waiting to upload to the cloud. \n• Red: A database synchronization error occurred. Click the button to retry or review failed queue payloads.'
    },
    {
      id: 'faq-bill-1',
      category: 'billing',
      question: 'How do I handle arrears and patient bills?',
      answer: 'During patient registration, enter the "Amount Paid". The system computes arrears (Total Cost - Amount Paid). If arrears > 0, the record stays in "Pending" status and a warning is printed. Once a patient clears their debt, edit the record to record a new payment. The status will update to "Active" (or "Closed" if all lab parameters have values).'
    },
    {
      id: 'faq-res-1',
      category: 'results',
      question: 'Why does a test result show a "High" or "Low" flag?',
      answer: 'When a laboratory technician enters a parameter value, the system compares the number to the catalog\'s reference range. If the value falls below the minimum, it flags as "Low" (blue text). If it exceeds the maximum, it flags as "High" (red text). Normal ranges are based on standard clinical guidelines loaded from your Excel imports.'
    },
    {
      id: 'faq-admin-1',
      category: 'admin',
      question: 'How do I backup and restore local laboratory data?',
      answer: 'The system automatically writes a secure, encrypted backup (`lims.db.enc`) in your workspace on app exit. You can configure automatic scheduling or perform manual exports through Settings > General Backup. To restore on a new computer, place `lims.db.enc` in the application directory and authenticate online during startup.'
    },
    {
      id: 'faq-gen-1',
      category: 'general',
      question: 'How do I change theme presets?',
      answer: 'Click your profile badge (top right or bottom left sidebar) to navigate to your Profile page. Under "Theme Settings", select your preset (Default, Ocean Breeze, Turquoise Harmony, or Silent Waters) and click save. Presets adapt to light and dark modes dynamically.'
    }
  ];

  // Search filter implementation
  const filteredFaqs = faqDatabase.filter(faq => {
    const query = searchQuery.toLowerCase();
    return faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
  });

  const matchedGuides = roleGuides.map(guide => {
    const matchedSteps = guide.steps.filter(step => 
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      step.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...guide, steps: matchedSteps };
  }).filter(g => g.steps.length > 0 && searchQuery !== '');

  // Tour Steps definition
  const tourSteps = [
    {
      target: 'Workspace Sidebar',
      description: 'Hover over the left edge to expand the sidebar. This gives you quick access to Patients, Results, Settings, and Users.',
      icon: <Users className="h-6 w-6 text-primary" />
    },
    {
      target: 'Status & Synchronization',
      description: 'Check the colored status indicator in the custom Title Bar. Green means synced; Amber means working offline with pending uploads.',
      icon: <Clock className="h-6 w-6 text-amber-500" />
    },
    {
      target: 'Quick Navigation Search',
      description: 'Use the Global Search at the top center of the screen to search for patients or records instantly from anywhere.',
      icon: <Search className="h-6 w-6 text-blue-500" />
    },
    {
      target: 'Tailored Profile Themes',
      description: 'Click your profile dropdown in the top-right corner to toggle themes, view permissions, or sign out safely.',
      icon: <Shield className="h-6 w-6 text-purple-500" />
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-10">
      
      {/* 1. Header with Glow Gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0 shadow-inner">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Help & Interactive Tutorials</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-xl">
              Access workflow guides, search FAQs, and explore step-by-step guides tailored specifically for your laboratory access level.
            </p>
          </div>
          
          {/* Quick Actions Cards */}
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Card className="max-w-sm md:w-[250px] shrink-0 bg-accent/20 border-accent/60">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-primary">
                  <Compass className="h-4 w-4 animate-spin-slow" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">LIMS Interface Tour</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  New to Invitro LIMS? Take a quick 4-step tour to learn system navigation.
                </p>
                <Button 
                  onClick={() => setTourStep(0)} 
                  size="sm" 
                  className="w-full font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" /> Start Quick Tour
                </Button>
              </CardContent>
            </Card>

            <Card className="max-w-sm md:w-[250px] shrink-0 bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">RBAC Simulator</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Explore how roles work and test access checks in the security simulator.
                </p>
                <Button 
                  onClick={() => navigate("/rbac/help")} 
                  size="sm" 
                  variant="outline"
                  className="w-full font-bold text-xs border-primary/20 hover:bg-primary/10 text-primary rounded-lg bg-transparent"
                >
                  Open RBAC Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 2. Interactive Quick Tour overlay card */}
      {tourStep >= 0 && (
        <Card className="border-primary bg-primary/5 dark:bg-primary/10 animate-in fade-in slide-in-from-top-4 duration-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-background rounded-lg text-primary">
                  {tourSteps[tourStep].icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary tracking-widest">Navigation Tour · Step {tourStep + 1} of {tourSteps.length}</span>
                  <h3 className="text-base font-extrabold text-foreground">{tourSteps[tourStep].target}</h3>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTourStep(-1)} className="h-8 px-2 hover:bg-background/80">
                Skip
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed pl-1">
              {tourSteps[tourStep].description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-1.5">
                {tourSteps.map((_, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200", 
                      i === tourStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {tourStep > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTourStep(prev => prev - 1)}
                    className="h-8 rounded-lg font-bold text-xs"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Back
                  </Button>
                )}
                {tourStep < tourSteps.length - 1 ? (
                  <Button 
                    size="sm" 
                    onClick={() => setTourStep(prev => prev + 1)}
                    className="h-8 rounded-lg font-bold text-xs"
                  >
                    Next <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setTourStep(-1)}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Done
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Search and Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-foreground"
            placeholder="Search FAQs, guide topics, or operations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Open first FAQ if searching
              if (e.target.value.length > 2) {
                setOpenFaqId('search-results');
              }
            }}
          />
        </div>
        
        {/* Quick info tag */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-muted/60 border border-border rounded-xl text-[11px] text-muted-foreground font-medium shrink-0">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Primary Access Role: <strong className="text-foreground capitalize">{user?.roleId || 'Viewer'}</strong></span>
        </div>
      </div>

      {/* 4. Active Search Results Section */}
      {searchQuery && (
        <Card className="border-primary/40 bg-accent/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
              <Search className="h-4 w-4" /> Search Matches for "{searchQuery}"
            </CardTitle>
            <CardDescription className="text-xs">
              Found {filteredFaqs.length} FAQ(s) and {matchedGuides.reduce((sum, g) => sum + g.steps.length, 0)} Guide step(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Guide Step Matches */}
            {matchedGuides.map(guide => (
              <div key={guide.id} className="space-y-2 p-3 bg-card border border-border rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{guide.title} Guide Workflow:</span>
                <div className="space-y-3 pl-2">
                  {guide.steps.map(step => (
                    <div key={step.title} className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground pl-5 leading-normal">{step.description}</p>
                      {step.actionPath && (
                        <div className="pl-5 pt-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => navigate(step.actionPath!)}
                            className="h-auto p-0 text-xs font-bold text-primary flex items-center gap-1"
                          >
                            Execute action <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredFaqs.length === 0 && matchedGuides.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No exact matches found. Try general words like "Sync", "Arrears", "Report", or "Backup".</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. Role Selection Cards with Badges */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <span>1. Select a Workflow Manual</span>
          <span className="text-xs font-normal text-muted-foreground">(Defaults to your active role)</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {roleGuides.map((guide) => {
            const isUserRole = user?.roleId === guide.id || (guide.id === 'general' && !user?.roleId);
            const isSelected = selectedRole === guide.id;
            
            return (
              <button
                key={guide.id}
                onClick={() => setSelectedRole(guide.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 border rounded-2xl transition-all duration-200 text-center select-none cursor-pointer outline-none hover-lift",
                  isSelected 
                    ? "bg-card border-primary text-primary ring-2 ring-primary/20" 
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                {/* Active user role badge */}
                {isUserRole && (
                  <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-extrabold text-[8px] tracking-wider shadow animate-pulse">
                    YOUR ROLE
                  </span>
                )}
                
                <div className={cn("p-3 rounded-xl mb-3 shrink-0", guide.colorClass)}>
                  {guide.icon}
                </div>
                <span className="text-xs font-extrabold block text-foreground leading-tight">{guide.title}</span>
                <span className="text-[10px] text-muted-foreground mt-1 block leading-none">{guide.roleName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Wizard Steps Component */}
      {selectedRole && (
        <div className="space-y-4">
          {(() => {
            const guide = roleGuides.find(g => g.id === selectedRole)!;
            const currentStepIdx = wizardSteps[selectedRole] || 0;
            const step = guide.steps[currentStepIdx];
            
            return (
              <Card className={cn("border border-border shadow-sm overflow-hidden", guide.bgGradient)}>
                <CardHeader className="pb-3 border-b border-border bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 uppercase tracking-wider">
                          {guide.title} Manual
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Step {currentStepIdx + 1} of {guide.steps.length}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-extrabold">{step.title}</CardTitle>
                    </div>
                    
                    {/* Reset Button */}
                    {currentStepIdx > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => resetWizard(selectedRole)} 
                        className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 self-start sm:self-center"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Tutorial
                      </Button>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${((currentStepIdx + 1) / guide.steps.length) * 100}%` }}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 bg-card space-y-6">
                  {/* Step Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Tip container */}
                  {step.tip && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground font-bold">Pro-Tip:</strong> {step.tip}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Link button */}
                  {step.actionText && step.actionPath && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => navigate(step.actionPath!)}
                        className="font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg pr-4"
                      >
                        {step.actionText} <ExternalLink className="h-3.5 w-3.5 ml-2" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Navigation Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrevStep(selectedRole)}
                      disabled={currentStepIdx === 0}
                      className="rounded-lg text-xs font-bold px-3 h-9"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Previous
                    </Button>
                    
                    {currentStepIdx < guide.steps.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={() => handleNextStep(selectedRole, guide.steps.length)}
                        className="rounded-lg text-xs font-bold px-4 h-9"
                      >
                        Next Step <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold pr-2 animate-bounce">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Manual Completed!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* 7. Collapsible FAQs Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <span>2. Frequently Asked Questions</span>
          <span className="text-xs font-normal text-muted-foreground">({filteredFaqs.length} topic(s))</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <Card 
                key={faq.id} 
                className={cn(
                  "transition-all duration-200 border border-border select-none", 
                  isOpen ? "ring-1 ring-primary/40 border-primary/50 shadow-sm" : "hover:border-muted-foreground/25"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full flex items-start justify-between p-5 text-left focus:outline-none cursor-pointer"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary opacity-80 px-2 py-0.5 rounded bg-primary/5 border border-primary/10">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-bold text-foreground leading-snug pt-1.5">{faq.question}</h3>
                  </div>
                  <div className="pt-3 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 border-t border-border/60 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-muted-foreground leading-relaxed pt-4 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
