import { Activity, Users, TestTube, TrendingUp, Calendar, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router";
import { Button } from "./ui/button";

const weeklyData = [
  { day: 'Mon', patients: 42, tests: 87, revenue: 12500 },
  { day: 'Tue', patients: 38, tests: 76, revenue: 11200 },
  { day: 'Wed', patients: 51, tests: 102, revenue: 15800 },
  { day: 'Thu', patients: 45, tests: 91, revenue: 13600 },
  { day: 'Fri', patients: 48, tests: 95, revenue: 14200 },
  { day: 'Sat', patients: 35, tests: 68, revenue: 9800 },
  { day: 'Sun', patients: 28, tests: 52, revenue: 7500 },
];

const patientsHealthStats = [
  { status: 'Critical', count: 8, percentage: 5, color: 'bg-red-500' },
  { status: 'Moderate', count: 42, percentage: 25, color: 'bg-yellow-500' },
  { status: 'Stable', count: 75, percentage: 45, color: 'bg-blue-500' },
  { status: 'Healthy', count: 42, percentage: 25, color: 'bg-green-500' },
];

export function MainDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      {/* Row 1: KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* 1. Patients Today */}
        <div className="bg-card border border-border text-card-foreground p-4" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <Users className="text-blue-600" size={16} />
            </div>
            <div className="text-xs text-muted-foreground">Patients Today</div>
          </div>
          <div className="text-2xl font-bold mb-1">287</div>
          <div className="text-xs text-green-600">↑ 8% vs yesterday</div>
        </div>

        {/* 2. Tests Run Today */}
        <div className="bg-card border border-border text-card-foreground p-4" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <TestTube className="text-purple-600" size={16} />
            </div>
            <div className="text-xs text-muted-foreground">Tests Run Today</div>
          </div>
          <div className="text-2xl font-bold mb-1">541</div>
          <div className="text-xs text-green-600">↑ 12% vs yesterday</div>
        </div>

        {/* 3. Monthly Revenue */}
        <div className="bg-card border border-border text-card-foreground p-4" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <TrendingUp className="text-green-600" size={16} />
            </div>
            <div className="text-xs text-muted-foreground">Monthly Revenue</div>
          </div>
          <div className="text-2xl font-bold mb-1">$84,600</div>
          <div className="text-xs text-green-600">↑ 12.5% vs last month</div>
        </div>

        {/* 4. Pending Results */}
        <div className="bg-card border border-border text-card-foreground p-4" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-amber-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <Activity className="text-amber-600" size={16} />
            </div>
            <div className="text-xs text-muted-foreground">Pending Results</div>
          </div>
          <div className="text-2xl font-bold mb-1">34</div>
          <div className="text-xs text-amber-500">⚠ Needs attention</div>
        </div>
      </div>

      {/* Row 2: Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Patient Traffic Chart */}
          <div className="bg-card border border-border p-4" style={{ borderRadius: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-4">Patient Traffic</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <CartesianGrid key="bar-grid" strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis key="bar-xaxis" dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis key="bar-yaxis" stroke="var(--muted-foreground)" />
                <Tooltip
                  key="bar-tooltip"
                  contentStyle={{
                    borderRadius: 0,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                />
                <Legend key="bar-legend" />
                <Bar key="patients-bar" dataKey="patients" fill="#3b82f6" name="Patients" />
                <Bar key="tests-bar" dataKey="tests" fill="#8b5cf6" name="Tests" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-card border border-border p-4" style={{ borderRadius: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyData}>
                <CartesianGrid key="line-grid" strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis key="line-xaxis" dataKey="day" stroke="var(--muted-foreground)" />
                <YAxis key="line-yaxis" stroke="var(--muted-foreground)" />
                <Tooltip
                  key="line-tooltip"
                  contentStyle={{
                    borderRadius: 0,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                />
                <Legend key="line-legend" />
                <Line
                  key="revenue-line"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Patients Health Stats */}
          <div className="bg-card border border-border p-4" style={{ borderRadius: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-6">Patients Health Stats</h3>
            
            {/* Bar visualization */}
            <div className="space-y-3 mb-6">
              {patientsHealthStats.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.status}</span>
                      <span className="text-xs text-muted-foreground">({item.count})</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted h-2" style={{ borderRadius: 0 }}>
                    <div
                      className={`h-2 ${item.color}`}
                      style={{
                        width: `${item.percentage}%`,
                        borderRadius: 0
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Total patients: {patientsHealthStats.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-card border border-border p-4" style={{ borderRadius: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-blue-600" size={16} />
              <h3 className="text-sm font-bold text-foreground">Today's Schedule</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-1 h-12 bg-orange-600" style={{ borderRadius: 0 }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground mb-1">Lunch</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>12:00 PM - 1:00 PM</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-1 h-12 bg-purple-600" style={{ borderRadius: 0 }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground mb-1">Results Review</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>3:30 PM - 4:00 PM</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-green-600" style={{ borderRadius: 0 }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground mb-1">Revenue Calculation</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>4:30 PM - 5:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Quick Actions */}
      <div className="bg-card border border-border p-4 flex items-center gap-3" style={{ borderRadius: 0 }}>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/patients?tab=new-patient")}>
          + New Patient
        </Button>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => navigate("/patients?tab=existing-patient")}>
          Existing Patients
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate("/results-entry")}>
          Test Results Entry
        </Button>
        <Button variant="outline" className="ml-auto" onClick={() => window.print()}>
          ⬇ Download Full Report
        </Button>
      </div>
    </div>
  );
}
