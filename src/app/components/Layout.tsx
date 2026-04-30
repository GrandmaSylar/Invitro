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
  UserCog
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Toaster } from "./ui/sonner";
import { useAuth } from "../../hooks/useAuth";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../lib/permissions";
import { MyPermissionsModal } from "./MyPermissionsModal";
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

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/", permissionKey: PERMISSIONS['dashboard.view'] },
  { name: "Patients", icon: Users, path: "/patients", permissionKey: PERMISSIONS['patients.view'] },
  { name: "Test Register", icon: TestTube, path: "/test-register", permissionKey: PERMISSIONS['test_register.view'] },
  { name: "Hospital Records", icon: Building2, path: "/hospital-records", permissionKey: PERMISSIONS['hospital_records.view'] },
  { name: "Results Entry", icon: FileText, path: "/results-entry", permissionKey: PERMISSIONS['results_entry.view'] },
  { name: "Users", icon: UserCog, path: "/rbac/users", permissionKey: PERMISSIONS['rbac.manage_users'] },
  { name: "Permissions", icon: Shield, path: "/rbac/permissions", permissionKey: PERMISSIONS['rbac.manage_roles'] },
];

function NavLink({ item, isExpanded, isActive }: { item: any; isExpanded: boolean; isActive: boolean }) {
  const hasPermission = usePermission(item.permissionKey);
  if (!hasPermission) return null;

  const Icon = item.icon;
  const linkContent = (
    <Link
      to={item.path}
      className={`flex items-center transition-all duration-200 rounded ${
        isExpanded ? "gap-3 px-4 py-2.5" : "justify-center w-10 h-10 mx-auto"
      } ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon size={20} className="shrink-0" />
      <span className={`text-sm font-semibold overflow-hidden whitespace-nowrap transition-all duration-200 ${
        isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"
      }`}>
        {item.name}
      </span>
    </Link>
  );

  return isExpanded ? (
    <div>{linkContent}</div>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        {linkContent}
      </TooltipTrigger>
      <TooltipContent side="right">
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/test-register": "Test Register",
  "/hospital-records": "Hospital Records",
  "/results-entry": "Results Entry",
  "/profile": "Profile",
  "/rbac/users": "User Management",
  "/rbac/permissions": "Permission Management",
  "/settings": "Settings"
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const { user, logout } = useAuth();
  const [showPermissions, setShowPermissions] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageLabel = PAGE_LABELS[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-200 ease-in-out ${
          isExpanded ? "w-60" : "w-14"
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 shrink-0 rounded ${!isExpanded ? "mx-auto" : ""}`}></div>
            <div className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`}>
              <div className="font-bold text-xs text-sidebar-foreground leading-tight">Laboratory Inventory</div>
              <div className="font-bold text-xs text-sidebar-foreground leading-tight">Management System</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <NavLink 
              key={item.path}
              item={item} 
              isExpanded={isExpanded} 
              isActive={location.pathname === item.path} 
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-14">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-8 py-4 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pages / {pageLabel}</p>
              <h1 className="text-xl font-bold text-foreground">{pageLabel}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Icons */}
              <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors duration-150 shrink-0">
                <Bell size={20} className="text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors duration-150 shrink-0"
              >
                <Settings size={20} className="text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors duration-150 shrink-0" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                {mounted ? (resolvedTheme === "dark" ? <Sun size={20} className="text-muted-foreground" /> : <Moon size={20} className="text-muted-foreground" />) : <div className="w-5 h-5"></div>}
              </button>
              
              {/* User Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="shrink-0 outline-none flex items-center gap-2 hover:bg-accent p-1 -mr-1 rounded-md transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {user?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[150px] hidden sm:block pr-2">
                      {user?.fullName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPermissions(true)} className="cursor-pointer">
                    My Permissions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSignOut(true)} className="text-destructive cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background transition-colors duration-200">
          <Outlet />
        </main>
      </div>
      <Toaster />
      
      <MyPermissionsModal open={showPermissions} onOpenChange={setShowPermissions} />
      
      <AlertDialog open={showSignOut} onOpenChange={setShowSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}