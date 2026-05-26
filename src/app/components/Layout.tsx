import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Users,
  TestTube,
  Building2,
  FileText,
  Bell,
  Moon,
  Sun,
  Settings,
  LayoutDashboard,
  Shield,
  UserCog,
  Search,
  HelpCircle,
  Activity,
  ChevronDown,
  FlaskConical
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Toaster } from "./ui/sonner";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../lib/permissions";
import { MyPermissionsModal } from "./MyPermissionsModal";
import { GlobalDialogs } from "./GlobalDialogs";
import { TitleBar } from "./TitleBar";
import { GlobalSearch } from "./GlobalSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "./ui/alert-dialog";

const navigationGroups = [
  {
    category: "WORKSPACE",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/", permissionKey: PERMISSIONS['dashboard.view'] },
      { name: "Patients", icon: Users, path: "/patients", permissionKey: PERMISSIONS['patients.view'] },
      { name: "Tests & Samples", icon: FlaskConical, path: "/test-register", permissionKey: PERMISSIONS['test_register.view'] },
      { name: "Results", icon: FileText, path: "/results-entry", permissionKey: PERMISSIONS['results_entry.view'] },
    ]
  },
  {
    category: "OPERATIONS",
    items: [
      { name: "Hospital Records", icon: Building2, path: "/hospital-records", permissionKey: PERMISSIONS['hospital_records.view'] },
    ]
  },
  {
    category: "ADMINISTRATION",
    items: [
      { name: "Users & Roles", icon: UserCog, path: "/rbac/users", permissionKey: PERMISSIONS['rbac.manage_users'] },
      { name: "Settings", icon: Settings, path: "/settings", permissionKey: "settings.view" },
    ]
  }
];

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/test-register": "Tests & Samples",
  "/hospital-records": "Hospital Records",
  "/results-entry": "Results",
  "/profile": "Profile",
  "/rbac/users": "Users & Roles",
  "/rbac/permissions": "Permission Management",
  "/settings": "Settings"
};

function NavLink({ item, isExpanded, isActive }: { item: any; isExpanded: boolean; isActive: boolean }) {
  const hasPermission = usePermission(item.permissionKey);
  
  if (!hasPermission && item.permissionKey && item.permissionKey !== "settings.view") {
    return null;
  }

  const Icon = item.icon;
  const linkContent = (
    <Link
      to={item.path}
      className={`flex items-center transition-all duration-200 rounded-xl ${
        isExpanded ? "gap-3 px-4 py-2.5" : "justify-center w-10 h-10 mx-auto"
      } ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-sm font-extrabold"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground font-bold"
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span className={`text-[12px] overflow-hidden whitespace-nowrap transition-all duration-200 ${
        isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"
      }`}>
        {item.name}
      </span>
      {isActive && isExpanded && (
        <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary ml-auto shrink-0 shadow-lg shadow-sidebar-primary/50 animate-pulse" />
      )}
    </Link>
  );

  return isExpanded ? (
    <div>{linkContent}</div>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        {linkContent}
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-sidebar border border-sidebar-border text-sidebar-foreground font-bold text-xs py-1.5 px-3 shadow-lg">
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { settings } = useSettingsStore();
  const isElectron = !!window.electronAPI;
  const initializeSettings = useSettingsStore(state => state.initialize);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);


  useEffect(() => {
    setMounted(true);
    initializeSettings();
  }, [initializeSettings]);

  useEffect(() => {
    if (user?.themePreset) {
      if (user.themePreset === 'default') {
        document.documentElement.removeAttribute('data-preset');
      } else {
        document.documentElement.setAttribute('data-preset', user.themePreset);
      }
    } else {
      document.documentElement.removeAttribute('data-preset');
    }
  }, [user?.themePreset]);

  const pageLabel = PAGE_LABELS[location.pathname] || "Dashboard";



  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-200">
      {/* Custom Titlebar (Electron only) */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — styled to adapt dynamically based on active theme preset */}
        <aside 
          className={`fixed left-0 bottom-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out ${
            isExpanded ? "w-60 shadow-[4px_0_24px_rgba(0,0,0,0.15)]" : "w-16 shadow-none"
          } ${isElectron ? "top-9" : "top-0"}`}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-sidebar-border h-[68px] flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shrink-0 shadow-lg shadow-sidebar-primary/20">
                <FlaskConical size={18} className="stroke-[2.5]" />
              </div>
              <div className={`flex flex-col transition-all duration-300 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`}>
                <span className="font-extrabold text-sm tracking-widest text-sidebar-foreground leading-none">INVITRO</span>
                <span className="text-[9px] font-bold text-sidebar-foreground/70 uppercase tracking-widest leading-none mt-1">LIMS Console</span>
              </div>
            </div>
          </div>



          {/* Categorized Navigation List */}
          <nav className="flex-1 py-4 flex flex-col gap-5 px-3 overflow-y-auto overflow-x-hidden">
            {navigationGroups.map((group) => {
              return (
                <div key={group.category} className="space-y-1.5">
                  {isExpanded ? (
                    <p className="text-[9px] font-bold text-sidebar-foreground/50 tracking-widest uppercase pl-3 mb-1">
                      {group.category}
                    </p>
                  ) : (
                    <div className="h-2" />
                  )}
                  
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink 
                        key={item.name}
                        item={item} 
                        isExpanded={isExpanded} 
                        isActive={location.pathname === item.path} 
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Glowing Status Footer Card */}
          {isExpanded && (
            <div className="p-3 border-t border-sidebar-border shrink-0 animate-in fade-in duration-300">
              <div className="bg-sidebar-accent/30 border border-sidebar-border/80 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-sidebar-foreground">System online</span>
                </div>
                <p className="text-[9px] text-sidebar-foreground/60 leading-tight">
                  All instruments responding · v2.4.1
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col overflow-hidden ml-16">
          {/* Header Bar */}
          <header className="relative z-40 bg-card/95 backdrop-blur-md border-b border-border/80 px-8 py-4 transition-colors duration-200 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                  PAGES &gt; {pageLabel.toUpperCase()}
                </p>
                <h1 className="text-xl font-extrabold text-foreground tracking-tight">{pageLabel}</h1>
              </div>

              {/* Center Functional Global Search */}
              <GlobalSearch />


              
              <div className="flex items-center gap-4 shrink-0">
                {/* Utilities */}
                <button 
                  onClick={() => navigate('/help')}
                  className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors shrink-0 outline-none" 
                  title="Help"
                >
                  <HelpCircle size={18} className="text-muted-foreground" />
                </button>
                
                <button 
                  onClick={() => navigate('/notifications')}
                  className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors shrink-0 outline-none relative" 
                  title="Notifications"
                >
                  <Bell size={18} className="text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border border-card shadow-sm animate-pulse" />
                  )}
                </button>

                <button 
                  onClick={() => navigate('/settings')}
                  className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors shrink-0 outline-none"
                  title="Settings"
                >
                  <Settings size={18} className="text-muted-foreground" />
                </button>

                <button 
                  className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors shrink-0 outline-none" 
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  title="Toggle Theme"
                >
                  {mounted ? (resolvedTheme === "dark" ? <Sun size={18} className="text-muted-foreground" /> : <Moon size={18} className="text-muted-foreground" />) : <div className="w-[18px] h-[18px]"></div>}
                </button>
                
                {/* Profile Badge Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="shrink-0 outline-none flex items-center gap-2.5 hover:bg-accent/60 p-1.5 rounded-xl transition-all border border-transparent hover:border-border/80">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary to-[#1a447c] rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border border-primary/20">
                        {user?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'SA'}
                      </div>
                      <div className="text-left hidden lg:block leading-none shrink-0 pr-1">
                        <p className="text-xs font-extrabold text-foreground">
                          {user?.fullName || "System Administrator"}
                        </p>
                        <p className="text-[9px] text-muted-foreground/80 mt-1 font-bold">
                          {user?.email || "admin@invitro.lab"}
                        </p>
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1 border-border/80 shadow-md rounded-xl">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user?.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer font-bold text-xs">
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPermissions(true)} className="cursor-pointer font-bold text-xs">
                      My Permissions
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowSignOut(true)} className="text-destructive cursor-pointer font-bold text-xs">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Container */}
          <main className="flex-1 overflow-auto bg-background transition-colors duration-200">
            <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
      
      <MyPermissionsModal open={showPermissions} onOpenChange={setShowPermissions} />
      
      <AlertDialog open={showSignOut} onOpenChange={setShowSignOut}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              You will be signed out. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <GlobalDialogs />
    </div>
  );
}