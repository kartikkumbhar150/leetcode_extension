import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { analyticsApi } from "../services/clario-api";
import type { AnalyticsData, WeeklyTrend } from "../services/clario-api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6", "#6366f1"];

function ProductivityGauge({ value }: { value: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = value >= 70 ? "var(--easy)" : value >= 40 ? "var(--medium)" : "var(--hard)";

  return (
    <div className="gauge-ring">
      <svg width="140" height="140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--bg-glass)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="gauge-value">
        <span className="gauge-number" style={{ color }}>{value}</span>
        <span className="gauge-label">Index</span>
      </div>
    </div>
  );
}

export default function AnalyticsView() {
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [trend, setTrend] = useState<WeeklyTrend | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, weeklyTrend] = await Promise.all([
        analyticsApi.getAnalytics(period),
        analyticsApi.getWeeklyTrend(),
      ]);
      setData(analytics);
      setTrend(weeklyTrend);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading analytics…</div>;
  }

  if (!data || data.totalMinutes === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📊</span>
        <h2 className="empty-state-title">No data yet</h2>
        <p className="empty-state-text">Start tracking time slots to see your productivity analytics.</p>
      </div>
    );
  }

  // Category breakdown for pie chart
  const categoryData = Object.entries(data.categoryBreakdown).map(([name, value], i) => ({
    name,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Productivity breakdown for pie
  const prodBreakdown = [
    { name: "Productive", value: data.productiveMinutes, color: "#22c55e" },
    { name: "Neutral", value: data.neutralMinutes, color: "#f59e0b" },
    { name: "Wasted", value: data.wastedMinutes, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Analytics</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
            Productivity insights & trends
          </p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["day", "week"] as const).map((p) => (
            <button
              key={p}
              className={`tab-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "day" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      {/* Top row: Gauge + stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.25rem", alignItems: "start" }}>
        {/* Gauge */}
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem" }}>
          <ProductivityGauge value={data.productivityIndex} />
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Productivity Index
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--easy)" }}>{data.productiveMinutes}</div>
            <div className="mini-stat-label">Productive Min</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--hard)" }}>{data.wastedMinutes}</div>
            <div className="mini-stat-label">Wasted Min</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value">{data.totalMinutes}</div>
            <div className="mini-stat-label">Total Tracked</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--accent)" }}>
              {data.completedTasks}/{data.totalTasks}
            </div>
            <div className="mini-stat-label">Tasks Done</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Productivity breakdown */}
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Time Breakdown</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prodBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {prodBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value} min`, ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: any) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>By Category</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value} min`, ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: any) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly trend */}
      {trend && trend.trend.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginBottom: "1rem" }}>
            <TrendingUp size={12} style={{ display: "inline", marginRight: 4 }} />
            7-Day Trend
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend.trend} barSize={20}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => new Date(v + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#f1f5f9" }}
                  labelFormatter={(v: any) => new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                />
                <Bar dataKey="productiveMin" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="Productive" />
                <Bar dataKey="neutralMin" stackId="a" fill="#f59e0b" name="Neutral" />
                <Bar dataKey="wastedMin" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Wasted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cumulative focus */}
      {trend && trend.cumulativeFocus.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginBottom: "1rem" }}>Cumulative Productive Time</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.cumulativeFocus}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => new Date(v + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value} min`, "Cumulative"]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeMinutes"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--accent)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Insights preview */}
      {data.insights && data.insights !== "No time tracked for this period." && (
        <div className="card" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
          <div className="section-label" style={{ marginBottom: 8 }}>💡 AI Insight</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {data.insights}
          </p>
        </div>
      )}
    </div>
  );
}
