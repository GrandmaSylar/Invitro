import { Activity, Users, TestTube, TrendingUp, FlaskConical, Clock, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStats, useDashboardCharts } from "../../hooks/useDashboardStats";
import { Button } from "./ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

// ── Color Palettes ─────────────────────────────────────────────

const DEPT_COLORS = [
  'hsl(221, 83%, 53%)',   // blue
  'hsl(262, 83%, 58%)',   // purple
  'hsl(173, 80%, 40%)',   // teal
  'hsl(38, 92%, 50%)',    // amber
  'hsl(346, 77%, 50%)',   // rose
  'hsl(142, 71%, 45%)',   // green
  'hsl(199, 89%, 48%)',   // sky
  'hsl(25, 95%, 53%)',    // orange
];

const FLAG_COLORS: Record<string, string> = {
  Normal: 'hsl(142, 71%, 45%)',
  Abnormal: 'hsl(38, 92%, 50%)',
  Critical: 'hsl(0, 84%, 60%)',
};

// ── Custom Tooltip ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-semibold text-foreground ml-auto">
            {entry.name === 'revenue' ? `₵${Number(entry.value).toLocaleString()}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────────

function StatCard({ title, value, icon: Icon, gradient, iconBg }: {
  title: string;
  value: string | number;
  icon: any;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className={`relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300`}>
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative">
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Chart Card Wrapper ─────────────────────────────────────────

function ChartCard({ title, subtitle, icon: Icon, children, className = "" }: {
  title: string;
  subtitle?: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden ${className}`}>
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2.5 mb-1">
          <Icon size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground ml-[30px]">{subtitle}</p>
        )}
      </div>
      <div className="px-4 pb-6 pt-2">
        {children}
      </div>
    </div>
  );
}

// ── Empty State for Charts ─────────────────────────────────────

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
      <div className="text-center space-y-2">
        <BarChart3 size={32} className="mx-auto opacity-30" />
        <p>{message}</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────

export function MainDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  return (
    <div className="p-6 sm:p-8 max-w-[1440px] mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || "User"}!
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Here's what's happening in your laboratory today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/patients?tab=existing-patient")}
          >
            <Activity size={16} />
            Existing Patients
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate("/patients?tab=new-patient")}
          >
            <Users size={16} />
            Register Patient
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Patients Today"
          value={statsLoading ? "…" : stats?.patientsToday ?? 0}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Tests Ordered Today"
          value={statsLoading ? "…" : stats?.testsToday ?? 0}
          icon={FlaskConical}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Pending Results"
          value={statsLoading ? "…" : stats?.pendingResults ?? 0}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Revenue (Month)"
          value={statsLoading ? "…" : `₵${(stats?.revenueThisMonth ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Chart Row 1: Activity Trend + Tests by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 7-Day Activity Trend (area chart — spans 2 columns) */}
        <ChartCard
          title="Activity Trend"
          subtitle="Patients registered & tests ordered — last 7 days"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          {chartsLoading ? (
            <div className="h-[280px] animate-pulse bg-muted/30 rounded-xl" />
          ) : !charts?.dailyTrend?.length ? (
            <ChartEmptyState message="No activity data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={charts.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2.5}
                  fill="url(#gradPatients)"
                  name="patients"
                />
                <Line
                  type="monotone"
                  dataKey="tests"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(262, 83%, 58%)' }}
                  activeDot={{ r: 6 }}
                  name="tests"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Tests by Department (pie chart) */}
        <ChartCard
          title="Tests by Department"
          subtitle="All-time distribution"
          icon={PieChartIcon}
        >
          {chartsLoading ? (
            <div className="h-[280px] animate-pulse bg-muted/30 rounded-xl" />
          ) : !charts?.departmentBreakdown?.length ? (
            <ChartEmptyState message="No test data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts.departmentBreakdown}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="department"
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {charts.departmentBreakdown.map((_entry, index) => (
                    <Cell key={index} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  formatter={(value: string) => (
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {value.length > 14 ? value.slice(0, 14) + '…' : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Chart Row 2: Revenue Trend + Result Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 30-Day Revenue Trend (bar chart — spans 2 columns) */}
        <ChartCard
          title="Revenue Trend"
          subtitle="Daily payments collected — last 30 days"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          {chartsLoading ? (
            <div className="h-[280px] animate-pulse bg-muted/30 rounded-xl" />
          ) : !charts?.revenueTrend?.length ? (
            <ChartEmptyState message="No revenue data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₵${val}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="url(#gradRevenue)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                  name="revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Result Flags Distribution (donut) */}
        <ChartCard
          title="Result Flags"
          subtitle="Distribution of test outcomes"
          icon={TestTube}
        >
          {chartsLoading ? (
            <div className="h-[280px] animate-pulse bg-muted/30 rounded-xl" />
          ) : !charts?.resultFlags?.length ? (
            <ChartEmptyState message="No results entered yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts.resultFlags}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="flag"
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {charts.resultFlags.map((entry) => (
                    <Cell
                      key={entry.flag}
                      fill={FLAG_COLORS[entry.flag] ?? 'hsl(var(--muted-foreground))'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                  formatter={(value: string) => (
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Quick Actions Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-3 text-base hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl"
          onClick={() => navigate("/patients?tab=new-patient")}
        >
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          Register New Patient
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-3 text-base hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl"
          onClick={() => navigate("/patients?tab=existing-patient")}
        >
          <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-full">
            <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          Existing Patients
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-3 text-base hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl"
          onClick={() => navigate("/results-entry")}
        >
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <TestTube className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          Test Results Entry
        </Button>
      </div>
    </div>
  );
}
