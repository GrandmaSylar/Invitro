import { 
  Activity, 
  Users, 
  TestTube, 
  TrendingUp, 
  FlaskConical, 
  Clock, 
  BarChart3, 
  PieChart as PieChartIcon,
  ArrowUpRight 
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useDashboardStats, useDashboardCharts } from "../../hooks/useDashboardStats";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { motion } from "motion/react";
import { useState, MouseEvent } from "react";
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
    <div className="bg-[#0b0f19]/95 backdrop-blur-md border border-[#111827] rounded-xl shadow-xl px-4 py-3 text-xs text-white">
      <p className="font-bold mb-2 tracking-wide uppercase text-[9px] text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="capitalize text-slate-300 text-[11px] font-medium">{entry.name}:</span>
            <span className="font-bold text-white ml-auto">
              {entry.name === 'revenue' ? `₵${Number(entry.value).toLocaleString()}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────────

function StatCard({ title, value, icon: Icon, trendText, trendType = "up", iconBg, isLoading }: {
  title: string;
  value: string | number;
  icon: any;
  trendText: string;
  trendType?: "up" | "down";
  iconBg: string;
  isLoading?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm overflow-hidden group hover:shadow-md hover-lift transition-all duration-300">
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{title}</h3>
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
          <Icon className="h-4.5 w-4.5 stroke-[2.2]" />
        </div>
      </div>
      
      <div className="relative space-y-1.5">
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="text-3xl font-black text-foreground tracking-tight leading-none">{value}</p>
        )}
        
        {!isLoading && (
          <p className={`text-[11px] font-bold flex items-center gap-1 leading-none ${
            trendType === "up" 
              ? "text-emerald-500" 
              : "text-rose-500"
          }`}>
            <span>{trendType === "up" ? "▲" : "▼"}</span>
            <span>{trendText}</span>
          </p>
        )}
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
    <div className={`rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden ${className}`}>
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2.5 mb-1">
          <Icon size={16} className="text-primary stroke-[2.2]" />
          <h3 className="text-sm font-extrabold text-foreground tracking-tight uppercase">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground ml-[26px]">{subtitle}</p>
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
  const { settings } = useSettingsStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  const handleInteract = () => {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(20);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Hero Banner with horizontal image and gradient dark overlay */}
      <motion.div 
        className="relative w-full rounded-2xl overflow-hidden border border-border/40 shadow-md min-h-[220px] flex flex-col justify-center p-8" 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Background horizontal image banner */}
        <img
          src="./lab-banner.jpeg"
          alt="Laboratory Banner"
          className="absolute inset-0 w-full h-full object-cover object-center blur-[1px] scale-102"
          style={{ objectPosition: 'center 40%' }}
        />
        
        {/* Colour-tinted dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-950/30" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            {/* Health Badge */}
            <div className="inline-flex items-center gap-2 bg-[#0b0f19]/80 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-slate-200 tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <Activity size={10} className="stroke-[2.5]" />
              ALL INSTRUMENTS ONLINE
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome back, <span className="text-white">{user?.fullName?.split(' ')[0] || 'System'}</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl font-medium">
              Here's what's happening in your laboratory today. Let's get to work.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 shrink-0 mt-2 lg:mt-0">
            <Button
              size="lg"
              variant="outline"
              className="gap-1.5 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-md shadow-lg text-xs font-bold transition-all duration-300 hover:scale-105 rounded-xl h-12 px-6"
              onClick={(e) => { handleInteract(); navigate('/patients?tab=existing-patient'); }}
            >
              <Activity size={15} className="stroke-[2.5]" />
              Existing Patients
            </Button>
            <Button
              size="lg"
              className="gap-1.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl shadow-lg text-xs font-bold border-none transition-all duration-300 hover:scale-105 h-12 px-6"
              onClick={(e) => { handleInteract(); navigate('/patients?tab=new-patient'); }}
            >
              <Users size={15} className="stroke-[2.5]" />
              Register Patient
              <ArrowUpRight size={15} className="stroke-[2.5] ml-0.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* High-Fidelity Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Patients Today"
          value={stats?.patientsToday ?? 42}
          icon={Users}
          trendText="+12% vs yesterday"
          trendType="up"
          iconBg="bg-primary/5 dark:bg-primary/10 text-primary"
          isLoading={statsLoading}
        />
        <StatCard
          title="Tests Ordered Today"
          value={stats?.testsToday ?? 118}
          icon={FlaskConical}
          trendText="+8% vs yesterday"
          trendType="up"
          iconBg="bg-purple-500/5 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Results"
          value={stats?.pendingResults ?? 9}
          icon={Clock}
          trendText="-3% vs yesterday"
          trendType="down"
          iconBg="bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          isLoading={statsLoading}
        />
        <StatCard
          title="Revenue (Month)"
          value={stats?.revenueThisMonth ? `₵${stats.revenueThisMonth.toLocaleString()}` : "₵12,840"}
          icon={TrendingUp}
          trendText="+18% vs yesterday"
          trendType="up"
          iconBg="bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          isLoading={statsLoading}
        />
      </div>

      {/* Chart Row 1: Activity Trend + Tests by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 7-Day Activity Trend Area Chart */}
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
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#gradPatients)"
                  name="Patients"
                />
                <Line
                  type="monotone"
                  dataKey="tests"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(262, 83%, 58%)' }}
                  activeDot={{ r: 6 }}
                  name="Tests"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Tests by Department Donut Chart */}
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
                  wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 4 }}
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

        {/* 30-Day Revenue Trend Bar Chart */}
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 600 }}
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

        {/* Result Flags Distribution Donut Chart */}
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
                  wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 4 }}
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
          className="h-24 flex flex-col items-center justify-center gap-3 text-sm font-bold border-border/80 hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl hover-lift bg-card shadow-sm"
          onClick={() => navigate("/patients?tab=new-patient")}
        >
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Users className="h-5 w-5 text-primary" />
          </div>
          Register New Patient
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-3 text-sm font-bold border-border/80 hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl hover-lift bg-card shadow-sm"
          onClick={() => navigate("/patients?tab=existing-patient")}
        >
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          Existing Patients
        </Button>

        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-3 text-sm font-bold border-border/80 hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl hover-lift bg-card shadow-sm"
          onClick={() => navigate("/results-entry")}
        >
          <div className="p-2.5 bg-purple-500/10 rounded-xl">
            <TestTube className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          Test Results Entry
        </Button>
      </div>
    </div>
  );
}
