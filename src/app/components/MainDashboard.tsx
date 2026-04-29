import { Activity, Users, TestTube, TrendingUp, FlaskConical, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStats } from "../../hooks/useDashboardStats";

export function MainDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.fullName || "User"}!</h1>
        <p className="text-muted-foreground mt-2">What would you like to do today?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Button 
          variant="outline" 
          className="h-32 flex flex-col items-center justify-center gap-4 text-lg hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => navigate("/patients?tab=new-patient")}
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          Register New Patient
        </Button>

        <Button 
          variant="outline" 
          className="h-32 flex flex-col items-center justify-center gap-4 text-lg hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => navigate("/patients?tab=existing-patient")}
        >
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
            <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          Existing Patients
        </Button>

        <Button 
          variant="outline" 
          className="h-32 flex flex-col items-center justify-center gap-4 text-lg hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => navigate("/results-entry")}
        >
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <TestTube className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          Test Results Entry
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Patients Today</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? "..." : stats?.patientsToday ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Tests Ordered Today</h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? "..." : stats?.testsToday ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Results</h3>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? "..." : stats?.pendingResults ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Revenue (Month)</h3>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? "..." : `GH₵ ${(stats?.revenueThisMonth ?? 0).toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
