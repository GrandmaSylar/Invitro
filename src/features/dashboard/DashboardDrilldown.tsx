import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router";
import { 
  Users, 
  FlaskConical, 
  Clock, 
  TrendingUp, 
  Search, 
  Calendar, 
  ArrowLeft, 
  RefreshCw, 
  PieChart as PieChartIcon, 
  HelpCircle, 
  Eye, 
  Printer, 
  Play,
  Activity,
  ShieldAlert,
  Phone
} from "lucide-react";
import { dashboardService } from "../../services/dashboardService";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Button } from "../../app/components/ui/button";
import { Badge } from "../../app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../app/components/ui/dialog";
import { ReceiptPreview, ReceiptData } from "../patients/ReceiptPreview";
import { usePermission } from "../../hooks/usePermission";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

// HSL theme colors consistent with MainDashboard.tsx
const COLORS = [
  'hsl(221, 83%, 53%)',   // blue
  'hsl(262, 83%, 58%)',   // purple
  'hsl(173, 80%, 40%)',   // teal
  'hsl(38, 92%, 50%)',    // amber
  'hsl(346, 77%, 50%)',   // rose
  'hsl(142, 71%, 45%)',   // green
  'hsl(199, 89%, 48%)',   // sky
  'hsl(25, 95%, 53%)',    // orange
];

type MetricType = "patients" | "tests" | "pending" | "revenue";

export function DashboardDrilldown() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMetric = (searchParams.get("metric") || "patients") as MetricType;
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  
  // RBAC Permission checks
  const canViewPatients = usePermission("dashboard.view_patients_today");
  const canViewTests = usePermission("dashboard.view_tests_today");
  const canViewPending = usePermission("dashboard.view_pending_results");
  const canViewRevenue = usePermission("dashboard.view_revenue_month");

  // Determine allowed metrics
  const allowedMetrics: MetricType[] = [];
  if (canViewPatients) allowedMetrics.push("patients");
  if (canViewTests) allowedMetrics.push("tests");
  if (canViewPending) allowedMetrics.push("pending");
  if (canViewRevenue) allowedMetrics.push("revenue");

  // Date constants
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = (() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  // Date filters state
  const [startDate, setStartDate] = useState(activeMetric === "revenue" ? firstDayOfMonthStr : todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Sync date selection when activeMetric changes
  useEffect(() => {
    if (activeMetric === "revenue") {
      setStartDate(firstDayOfMonthStr);
      setEndDate(todayStr);
    } else {
      setStartDate(todayStr);
      setEndDate(todayStr);
    }
  }, [activeMetric]);

  // Adjust activeMetric if not allowed
  useEffect(() => {
    if (allowedMetrics.length > 0 && !allowedMetrics.includes(activeMetric)) {
      setSearchParams({ metric: allowedMetrics[0] });
    }
  }, [activeMetric, allowedMetrics, setSearchParams]);

  // Modals for receipt view
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Revenue Sub-tab selection state (Collections vs Outstanding Arrears)
  const [revenueSubTab, setRevenueSubTab] = useState<"collections" | "arrears">("collections");

  // Queries for the four drilldowns (reactive to startDate and endDate)
  const { data: patients, isLoading: patientsLoading, refetch: refetchPatients } = useQuery({
    queryKey: ["dashboard-patients-today", startDate, endDate],
    queryFn: () => dashboardService.getPatientsToday(startDate, endDate),
    enabled: canViewPatients,
    staleTime: 1000 * 10,
  });

  const { data: tests, isLoading: testsLoading, refetch: refetchTests } = useQuery({
    queryKey: ["dashboard-tests-today", startDate, endDate],
    queryFn: () => dashboardService.getTestsToday(startDate, endDate),
    enabled: canViewTests,
    staleTime: 1000 * 10,
  });

  const { data: pending, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["dashboard-pending-results-list", startDate, endDate],
    queryFn: () => dashboardService.getPendingResults(startDate, endDate),
    enabled: canViewPending,
    staleTime: 1000 * 10,
  });

  const { data: revenue, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ["dashboard-revenue-month-list", startDate, endDate],
    queryFn: () => dashboardService.getRevenueThisMonth(startDate, endDate),
    enabled: canViewRevenue,
    staleTime: 1000 * 10,
  });

  const { data: arrears, isLoading: arrearsLoading, refetch: refetchArrears } = useQuery({
    queryKey: ["dashboard-arrears-breakdown", startDate, endDate],
    queryFn: () => dashboardService.getArrearsBreakdown(startDate, endDate),
    enabled: canViewRevenue,
    staleTime: 1000 * 10,
  });

  const handleMetricChange = (metric: MetricType) => {
    setSearchParams({ metric });
    setSearchQuery("");
    setDeptFilter("all");
    if (metric === "revenue") {
      setRevenueSubTab("collections");
    }
  };

  const getActiveDataAndLoading = () => {
    switch (activeMetric) {
      case "patients": return { data: patients || [], loading: patientsLoading, refetch: refetchPatients };
      case "tests": return { data: tests || [], loading: testsLoading, refetch: refetchTests };
      case "pending": return { data: pending || [], loading: pendingLoading, refetch: refetchPending };
      case "revenue": return { 
        data: revenue || [], 
        loading: revenueLoading || arrearsLoading, 
        refetch: () => { 
          refetchRevenue(); 
          refetchArrears(); 
        } 
      };
    }
  };

  // If no permissions at all
  if (allowedMetrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <ShieldAlert size={32} className="stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Access Denied</h2>
        <p className="text-xs text-muted-foreground">
          You do not have the required permissions to view dashboard analytics drilldowns. Please contact your system administrator.
        </p>
        <Button onClick={() => navigate("/")} className="rounded-xl font-bold px-6 h-11">
          Go Back to Dashboard
        </Button>
      </div>
    );
  }

  const { data: activeData, loading, refetch } = getActiveDataAndLoading();

  // Helper date formatter
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "";
    }
  };

  // Compute analytics depending on the metric
  const renderAnalyticsBreakdown = () => {
    if (loading || !activeData || activeData.length === 0) return null;

    if (activeMetric === "patients") {
      const pList = activeData as any[];
      // 1. Gender breakdown
      const maleCount = pList.filter(p => p.gender?.toLowerCase() === "male" || p.gender?.toLowerCase() === "m").length;
      const femaleCount = pList.filter(p => p.gender?.toLowerCase() === "female" || p.gender?.toLowerCase() === "f").length;

      const genderData = [
        { name: "Male", value: maleCount },
        { name: "Female", value: femaleCount }
      ].filter(d => d.value > 0);

      // 2. Age group breakdown (Pediatric < 18, Adult 18-59, Geriatric >= 60)
      let pediatric = 0, adult = 0, geriatric = 0;
      pList.forEach(p => {
        const age = Number(p.age);
        if (!isNaN(age)) {
          if (age < 18) pediatric++;
          else if (age < 60) adult++;
          else geriatric++;
        } else {
          adult++; // Default fallback
        }
      });

      const ageData = [
        { name: "Pediatric (<18)", count: pediatric },
        { name: "Adult (18-59)", count: adult },
        { name: "Geriatric (60+)", count: geriatric }
      ];

      // 3. Hourly peak registration analysis
      const hourlyCounts: Record<number, number> = {};
      pList.forEach(p => {
        if (p.createdAt) {
          const hour = new Date(p.createdAt).getHours();
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        }
      });

      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const displayHour = i === 0 ? "12 AM" : i === 12 ? "12 PM" : i > 12 ? `${i - 12} PM` : `${i} AM`;
        return {
          hour: displayHour,
          count: hourlyCounts[i] || 0
        };
      }).filter(h => h.count > 0 || (h.count === 0 && (pList.length === 0))); // Only show hours with active counts

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Gender Demographics</CardTitle>
              <CardDescription>Gender distribution for date range</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[200px]">
              {genderData.length === 0 ? (
                <p className="text-xs text-muted-foreground">No gender data recorded</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genderData.map((_entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Age Segments</CardTitle>
              <CardDescription>Distribution across age brackets</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" strokeOpacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="hsl(262, 83%, 58%)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Registration Flow</CardTitle>
              <CardDescription>Timeline of patient entries</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ left: -25, right: 5, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="hsl(173, 80%, 40%)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeMetric === "tests") {
      const tList = activeData as any[];
      
      // 1. Department Breakdown
      const deptCounts: Record<string, number> = {};
      tList.forEach(t => {
        const dept = t.department || "General";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      const deptBreakdown = Object.entries(deptCounts).map(([name, value]) => ({ name, value }));

      // 2. Financial potential value
      let totalValue = 0;
      tList.forEach(t => {
        totalValue += Number(t.testCost || 0);
      });

      // 3. Popular tests ordered
      const testCounts: Record<string, number> = {};
      tList.forEach(t => {
        const name = t.testName || "Unknown Test";
        testCounts[name] = (testCounts[name] || 0) + 1;
      });
      const popularTests = Object.entries(testCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Department breakdown</CardTitle>
              <CardDescription>Departmental share of orders</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[200px]">
              {deptBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">No test data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deptBreakdown.map((_entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Revenue Stream Analysis</CardTitle>
              <CardDescription>Financial volume of orders</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center space-y-4">
              <div className="text-center p-3 rounded-2xl bg-muted/60 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Total Order Potential</span>
                <span className="text-3xl font-black text-emerald-500 tracking-tight">GH₵{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-center">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/20">
                  <span className="text-muted-foreground block text-[9px] uppercase">Average Order Value</span>
                  <span className="text-sm font-bold text-foreground">
                    GH₵{tList.length > 0 ? (totalValue / tList.length).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/20">
                  <span className="text-muted-foreground block text-[9px] uppercase">Total Test Count</span>
                  <span className="text-sm font-bold text-foreground">{tList.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Top Ordered Tests</CardTitle>
              <CardDescription>Most requested parameters</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              {popularTests.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No test popularity data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularTests} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" strokeOpacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                    <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeMetric === "pending") {
      const pList = activeData as any[];

      // 1. Pending by Department
      const deptCounts: Record<string, number> = {};
      pList.forEach(t => {
        const dept = t.department || "General";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      const deptData = Object.entries(deptCounts).map(([name, count]) => ({ name, count }));

      // 2. Aging Analysis (wait times since order)
      let under1h = 0, under3h = 0, under6h = 0, over6h = 0;
      const now = new Date();
      pList.forEach(t => {
        if (t.recordDate) {
          const orderTime = new Date(t.recordDate);
          const diffMs = now.getTime() - orderTime.getTime();
          const diffHrs = diffMs / (1000 * 60 * 60);
          if (diffHrs < 1) under1h++;
          else if (diffHrs < 3) under3h++;
          else if (diffHrs < 6) under6h++;
          else over6h++;
        } else {
          under1h++; // Fallback
        }
      });

      const agingData = [
        { name: "< 1 Hr", count: under1h },
        { name: "1 - 3 Hrs", count: under3h },
        { name: "3 - 6 Hrs", count: under6h },
        { name: "6+ Hrs", count: over6h }
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Departmental Backlog</CardTitle>
              <CardDescription>Bottlenecks by laboratory section</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              {deptData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No backlog data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} margin={{ left: -25, right: 5, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                    <Bar dataKey="count" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Aging Analysis (Queue Wait Times)</CardTitle>
              <CardDescription>Time elapsed since tests were ordered</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} margin={{ left: -25, right: 5, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeMetric === "revenue") {
      const rList = activeData as any[];
      // 1. Daily collection trend
      const dailyMap = new Map<string, number>();
      rList.forEach(r => {
        if (r.paymentDate) {
          const dateStr = r.paymentDate.slice(0, 10);
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Number(r.amount));
        }
      });
      const dailyTrend = Array.from(dailyMap.entries()).map(([date, amount]) => ({
        date: formatDate(date).split(",")[0], // E.g. "Jun 14"
        amount
      })).slice(0, 15).reverse();

      // 2. Collector Breakdown
      const collectorCounts: Record<string, number> = {};
      rList.forEach(r => {
        const name = r.receivedByName || "System";
        collectorCounts[name] = (collectorCounts[name] || 0) + Number(r.amount);
      });
      const collectorData = Object.entries(collectorCounts).map(([name, amount]) => ({ name, amount }));

      // 3. Financial overview stats & Arrears indicators
      let monthlyTotal = 0;
      rList.forEach(r => monthlyTotal += Number(r.amount));

      const arrearsList = (arrears || []) as any[];
      const totalOutstanding = arrearsList.reduce((sum, item) => sum + Number(item.arrears || 0), 0);
      const recoveryRate = (monthlyTotal + totalOutstanding) > 0 
        ? (monthlyTotal / (monthlyTotal + totalOutstanding)) * 100 
        : 100;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Monthly Payment Trend</CardTitle>
              <CardDescription>Daily payment collections</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              {dailyTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No collections in this date range</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTrend} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => `GH₵${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                    <Bar dataKey="amount" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Revenue by Collector</CardTitle>
              <CardDescription>Processed volume per staff member</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] pt-4">
              {collectorData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No collector details</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={collectorData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" strokeOpacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip formatter={(value) => `GH₵${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: "#0b0f19", borderColor: "var(--border)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                    <Bar dataKey="amount" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur-md flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Financial Health & Arrears</CardTitle>
              <CardDescription>Performance indicators for selected range</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between py-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider block mb-0.5">Collections</span>
                  <span className="text-lg font-black text-emerald-500 tracking-tight">₵{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center">
                  <span className="text-[9px] uppercase font-bold text-rose-500 tracking-wider block mb-0.5">Arrears</span>
                  <span className="text-lg font-black text-rose-500 tracking-tight">₵{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                  <span>Arrears Recovery Rate</span>
                  <span className="text-emerald-500 font-extrabold">{recoveryRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border/10">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${recoveryRate}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-center">
                <div className="p-2 rounded-xl bg-muted/40 border border-border/20">
                  <span className="text-muted-foreground block text-[8px] uppercase">Collections (Tx)</span>
                  <span className="text-xs font-extrabold text-foreground">{rList.length} payments</span>
                </div>
                <div className="p-2 rounded-xl bg-muted/40 border border-border/20">
                  <span className="text-muted-foreground block text-[8px] uppercase">Unpaid Invoices</span>
                  <span className="text-xs font-extrabold text-rose-500">{arrearsList.length} owe balance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  // Perform search / department filtering on active list
  const getFilteredData = () => {
    let items = (activeMetric === "revenue" && revenueSubTab === "arrears")
      ? (arrears || [])
      : (activeData || []) as any[];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      if (activeMetric === "patients") {
        items = items.filter(
          p => p.patientName?.toLowerCase().includes(q) || p.telephone?.toLowerCase().includes(q)
        );
      } else if (activeMetric === "tests" || activeMetric === "pending") {
        items = items.filter(
          t => t.patientName?.toLowerCase().includes(q) || 
               t.testName?.toLowerCase().includes(q) || 
               t.labNumber?.toLowerCase().includes(q)
        );
      } else if (activeMetric === "revenue") {
        if (revenueSubTab === "arrears") {
          items = items.filter(
            r => r.patientName?.toLowerCase().includes(q) || 
                 r.labNumber?.toLowerCase().includes(q) || 
                 (r.telephone && r.telephone.toLowerCase().includes(q))
          );
        } else {
          items = items.filter(
            r => r.patientName?.toLowerCase().includes(q) || 
                 r.labNumber?.toLowerCase().includes(q) || 
                 r.receiptNumber?.toLowerCase().includes(q)
          );
        }
      }
    }

    if (deptFilter !== "all" && (activeMetric === "tests" || activeMetric === "pending")) {
      items = items.filter(t => t.department === deptFilter);
    }

    return items;
  };

  const filteredItems = getFilteredData();

  // Get department unique list for filter dropdown
  const getUniqueDepartments = () => {
    if (activeMetric !== "tests" && activeMetric !== "pending") return [];
    const rawList = (activeData || []) as any[];
    const depts = new Set<string>();
    rawList.forEach(t => { if (t.department) depts.add(t.department); });
    return Array.from(depts);
  };

  const departments = getUniqueDepartments();

  // Trigger preview receipt click
  const handlePrintReceipt = (row: any) => {
    const recData: ReceiptData = {
      labNumber: row.labNumber,
      patientName: row.patientName,
      tests: [{ testName: "Laboratory Transaction Payment", testCost: row.amount }],
      totalCost: row.amount,
      amountPaid: row.amount,
      arrears: 0,
      recordDate: row.paymentDate,
      receiptNumber: row.receiptNumber,
      paymentAmount: row.amount,
      paymentDate: row.paymentDate
    };
    setSelectedReceipt(recData);
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Activity className="text-primary h-8 w-8 stroke-[2.5]" />
            Real-Time Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore live breakdowns, performance metrics, and clinical volumes.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={loading}
          className="gap-2 shrink-0 rounded-xl font-bold bg-white/5 border-white/10 hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </Button>
      </div>

      {/* Date Filter Bar */}
      <Card className="p-4 border-border/60 bg-card/45 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 text-primary font-extrabold uppercase tracking-wider text-[10px]">
            <Calendar size={14} className="stroke-[2.2]" />
            <span>Select Date Range</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold">Start:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-bold shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold">End:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-bold shadow-sm"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (activeMetric === "revenue") {
                setStartDate(firstDayOfMonthStr);
                setEndDate(todayStr);
              } else {
                setStartDate(todayStr);
                setEndDate(todayStr);
              }
            }}
            className="text-muted-foreground hover:text-foreground text-[10px] font-extrabold uppercase tracking-wider ml-auto rounded-lg"
          >
            Reset Range
          </Button>
        </div>
      </Card>

      {/* Pill tabs selector */}
      <div className="border border-border/50 bg-muted/20 rounded-2xl p-1.5 inline-flex gap-1.5 max-w-full overflow-x-auto">
        {canViewPatients && (
          <button
            onClick={() => handleMetricChange("patients")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold transition-all duration-200 rounded-xl cursor-pointer outline-none border-none ${
              activeMetric === "patients"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users size={15} />
            <span>Patients Today</span>
          </button>
        )}

        {canViewTests && (
          <button
            onClick={() => handleMetricChange("tests")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold transition-all duration-200 rounded-xl cursor-pointer outline-none border-none ${
              activeMetric === "tests"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FlaskConical size={15} />
            <span>Tests Ordered Today</span>
          </button>
        )}

        {canViewPending && (
          <button
            onClick={() => handleMetricChange("pending")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold transition-all duration-200 rounded-xl cursor-pointer outline-none border-none ${
              activeMetric === "pending"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock size={15} />
            <span>Pending Results</span>
          </button>
        )}

        {canViewRevenue && (
          <button
            onClick={() => handleMetricChange("revenue")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold transition-all duration-200 rounded-xl cursor-pointer outline-none border-none ${
              activeMetric === "revenue"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <TrendingUp size={15} />
            <span>Revenue (Month)</span>
          </button>
        )}
      </div>

      {/* Analytical Breakdown Charts */}
      {renderAnalyticsBreakdown()}

      {/* Main List Table Card */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-foreground uppercase flex flex-wrap items-center gap-3">
                {activeMetric === "patients" && "Patient Registrations List"}
                {activeMetric === "tests" && "Tests Ordered Log"}
                {activeMetric === "pending" && "Pending Lab Queue"}
                {activeMetric === "revenue" && (
                  revenueSubTab === "collections" ? "Payment Collections Ledger" : "Outstanding Arrears Ledger"
                )}

                {activeMetric === "revenue" && (
                  <div className="flex items-center gap-1 bg-muted/50 border border-border/40 p-0.5 rounded-lg ml-2">
                    <button
                      onClick={() => { setRevenueSubTab("collections"); setSearchQuery(""); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-extrabold transition-all border-none cursor-pointer ${
                        revenueSubTab === "collections" 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "bg-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Payments ({(revenue || []).length})
                    </button>
                    <button
                      onClick={() => { setRevenueSubTab("arrears"); setSearchQuery(""); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-extrabold transition-all border-none cursor-pointer ${
                        revenueSubTab === "arrears" 
                          ? "bg-rose-600 text-white shadow-sm" 
                          : "bg-transparent text-rose-500/80 hover:text-rose-500"
                      }`}
                    >
                      Arrears ({(arrears || []).length})
                    </button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {activeMetric === "patients" && `Browse details of patients registered from ${formatDate(startDate)} to ${formatDate(endDate)}`}
                {activeMetric === "tests" && `Log of individual test requests placed from ${formatDate(startDate)} to ${formatDate(endDate)}`}
                {activeMetric === "pending" && `Lab tests awaiting parameter results ordered from ${formatDate(startDate)} to ${formatDate(endDate)}`}
                {activeMetric === "revenue" && (
                  revenueSubTab === "collections" 
                    ? `Collections recorded from ${formatDate(startDate)} to ${formatDate(endDate)}`
                    : `Active outstanding arrears for lab records created from ${formatDate(startDate)} to ${formatDate(endDate)}`
                )}
              </CardDescription>
            </div>

            {/* Filtering tools */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={
                    activeMetric === "revenue" && revenueSubTab === "arrears"
                      ? "Search name, lab number..."
                      : "Search ledger..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              {(activeMetric === "tests" || activeMetric === "pending") && departments.length > 0 && (
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[140px] h-10 rounded-xl text-xs font-semibold">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                <div className="h-8 bg-muted/20 animate-pulse rounded-lg" />
                <div className="h-8 bg-muted/20 animate-pulse rounded-lg" />
                <div className="h-8 bg-muted/20 animate-pulse rounded-lg" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center p-12 text-sm text-muted-foreground">
                <HelpCircle size={36} className="mx-auto opacity-30 mb-3" />
                No matching records found for date range.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    {activeMetric === "patients" && (
                      <>
                        <th className="py-4 px-6">Patient Name</th>
                        <th className="py-4 px-6">Gender</th>
                        <th className="py-4 px-6">Age / DOB</th>
                        <th className="py-4 px-6">Telephone</th>
                        <th className="py-4 px-6">Registered Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </>
                    )}
                    {activeMetric === "tests" && (
                      <>
                        <th className="py-4 px-6">Lab Number</th>
                        <th className="py-4 px-6">Patient</th>
                        <th className="py-4 px-6">Test Name</th>
                        <th className="py-4 px-6">Department</th>
                        <th className="py-4 px-6">Cost</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </>
                    )}
                    {activeMetric === "pending" && (
                      <>
                        <th className="py-4 px-6">Lab Number</th>
                        <th className="py-4 px-6">Patient</th>
                        <th className="py-4 px-6">Test Requested</th>
                        <th className="py-4 px-6">Department</th>
                        <th className="py-4 px-6">Ordered Time</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </>
                    )}
                    {activeMetric === "revenue" && (
                      revenueSubTab === "collections" ? (
                        <>
                          <th className="py-4 px-6">Receipt Number</th>
                          <th className="py-4 px-6">Patient</th>
                          <th className="py-4 px-6">Lab Number</th>
                          <th className="py-4 px-6">Amount</th>
                          <th className="py-4 px-6">Collected At</th>
                          <th className="py-4 px-6">Received By</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </>
                      ) : (
                        <>
                          <th className="py-4 px-6">Patient Name</th>
                          <th className="py-4 px-6">Lab Number</th>
                          <th className="py-4 px-6">Telephone</th>
                          <th className="py-4 px-6">Date Ordered</th>
                          <th className="py-4 px-6">Total Cost</th>
                          <th className="py-4 px-6">Amount Paid</th>
                          <th className="py-4 px-6">Outstanding Arrears</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs font-semibold">
                  {filteredItems.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-muted/5 transition-colors">
                      {activeMetric === "patients" && (
                        <>
                          <td className="py-4 px-6 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {row.patientName?.charAt(0) || "P"}
                            </div>
                            <span className="font-extrabold text-foreground">{row.patientName}</span>
                          </td>
                          <td className="py-4 px-6 capitalize">{row.gender || "—"}</td>
                          <td className="py-4 px-6">
                            {row.age !== undefined && row.age !== null ? `${row.age} yrs` : ""}
                            {row.dob ? ` (${formatDate(row.dob)})` : ""}
                            {!row.age && !row.dob ? "—" : ""}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">{row.telephone || "—"}</td>
                          <td className="py-4 px-6">
                            <span className="text-muted-foreground block text-[10px]">{formatDate(row.createdAt)}</span>
                            <span className="font-extrabold block text-xs">{row.createdAt ? formatTime(row.createdAt) : ""}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/patients?tab=existing-patient`)}
                              className="h-8 text-[11px] font-bold text-primary hover:text-primary-foreground rounded-lg"
                            >
                              <Eye size={12} className="mr-1" />
                              View History
                            </Button>
                          </td>
                        </>
                      )}

                      {activeMetric === "tests" && (
                        <>
                          <td className="py-4 px-6 font-bold text-primary">{row.labNumber}</td>
                          <td className="py-4 px-6 font-extrabold text-foreground">{row.patientName}</td>
                          <td className="py-4 px-6 font-extrabold">{row.testName}</td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="font-bold text-[9px] px-2 py-0.5 rounded-md uppercase">
                              {row.department}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-emerald-500 font-bold">GH₵{row.testCost?.toFixed(2)}</td>
                          <td className="py-4 px-6 text-right flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/results-entry`)}
                              className="h-8 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg"
                            >
                              <Play size={12} className="mr-1" />
                              Enter Results
                            </Button>
                          </td>
                        </>
                      )}

                      {activeMetric === "pending" && (
                        <>
                          <td className="py-4 px-6 font-bold text-amber-500">{row.labNumber}</td>
                          <td className="py-4 px-6 font-extrabold text-foreground">{row.patientName}</td>
                          <td className="py-4 px-6 font-extrabold">{row.testName}</td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="border-amber-500/30 text-amber-500 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase">
                              {row.department}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-muted-foreground block text-[10px]">{formatDate(row.recordDate)}</span>
                            <span className="font-extrabold block text-xs">{row.recordDate ? formatTime(row.recordDate) : ""}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/results-entry`)}
                              className="h-8 border-amber-500/20 hover:border-amber-500/40 text-amber-500 hover:bg-amber-500/5 text-[11px] font-bold rounded-lg"
                            >
                              <Play size={12} className="mr-1" />
                              Record results
                            </Button>
                          </td>
                        </>
                      )}

                      {activeMetric === "revenue" && (
                        revenueSubTab === "collections" ? (
                          <>
                            <td className="py-4 px-6 font-bold text-primary">{row.receiptNumber || "—"}</td>
                            <td className="py-4 px-6 font-extrabold text-foreground">{row.patientName}</td>
                            <td className="py-4 px-6 font-bold">{row.labNumber}</td>
                            <td className="py-4 px-6 text-emerald-500 font-extrabold">GH₵{row.amount?.toFixed(2)}</td>
                            <td className="py-4 px-6">
                              <span className="text-muted-foreground block text-[10px]">{formatDate(row.paymentDate)}</span>
                              <span className="font-extrabold block text-xs">{row.paymentDate ? formatTime(row.paymentDate) : ""}</span>
                            </td>
                            <td className="py-4 px-6 text-muted-foreground">{row.receivedByName}</td>
                            <td className="py-4 px-6 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handlePrintReceipt(row)}
                                className="h-8 text-[11px] font-bold text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-lg"
                              >
                                <Printer size={12} className="mr-1" />
                                Print Receipt
                              </Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-6 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                                {row.patientName?.charAt(0) || "P"}
                              </div>
                              <span className="font-extrabold text-foreground">{row.patientName}</span>
                            </td>
                            <td className="py-4 px-6 font-bold text-primary">{row.labNumber}</td>
                            <td className="py-4 px-6 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Phone size={11} className="text-muted-foreground/50 shrink-0" />
                                {row.telephone && row.telephone !== "—" ? (
                                  <a 
                                    href={`tel:${row.telephone}`}
                                    className="hover:underline hover:text-primary transition-all font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {row.telephone}
                                  </a>
                                ) : "—"}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-muted-foreground block text-[10px]">{formatDate(row.recordDate)}</span>
                              <span className="font-extrabold block text-xs">{row.recordDate ? formatTime(row.recordDate) : ""}</span>
                            </td>
                            <td className="py-4 px-6 text-muted-foreground">GH₵{row.totalCost?.toFixed(2)}</td>
                            <td className="py-4 px-6 text-emerald-500">GH₵{row.amountPaid?.toFixed(2)}</td>
                            <td className="py-4 px-6 text-rose-500 font-extrabold">GH₵{row.arrears?.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/patients?tab=existing-patient&search=${encodeURIComponent(row.patientName)}`)}
                                className="h-8 border-rose-500/20 hover:border-rose-500/40 text-rose-500 hover:bg-rose-500/5 text-[11px] font-bold rounded-lg"
                              >
                                Clear Arrears
                              </Button>
                            </td>
                          </>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Printable Receipt Modal portal */}
      <AnimatePresence>
        {selectedReceipt && (
          <Dialog open={!!selectedReceipt} onOpenChange={(open) => { if (!open) setSelectedReceipt(null); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border-border/80 text-foreground">
              <DialogHeader>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">Receipt Print Preview</DialogTitle>
                <DialogDescription>Verify the details below before issuing or printing the transaction receipt.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ReceiptPreview recordData={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
