import { Outlet, Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import {
  Users,
  TestTube,
  Building2,
  FileText,
  Search,
  Bell,
  Moon,
  Sun,
  Settings,
  LayoutDashboard
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Toaster } from "./ui/sonner";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Patients", icon: Users, path: "/patients" },
  { name: "Test Register", icon: TestTube, path: "/test-register" },
  { name: "Hospital Records", icon: Building2, path: "/hospital-records" },
  { name: "Results Entry", icon: FileText, path: "/results-entry" },
];

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/test-register": "Test Register",
  "/hospital-records": "Hospital Records",
  "/results-entry": "Results Entry",
  "/profile": "Profile"
};

export function Layout() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
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
              <div key={item.path}>{linkContent}</div>
            ) : (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
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
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-10 pr-4 py-2 bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background w-64 rounded transition-colors"
                />
              </div>
              
              {/* Icons */}
              <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors duration-150 shrink-0">
                <Bell size={20} className="text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors duration-150 shrink-0">
                <Settings size={20} className="text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors duration-150 shrink-0" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                {mounted ? (resolvedTheme === "dark" ? <Sun size={20} className="text-muted-foreground" /> : <Moon size={20} className="text-muted-foreground" />) : <div className="w-5 h-5"></div>}
              </button>
              
              {/* User Avatar */}
              <Link to="/profile" className="shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background transition-colors duration-200">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}