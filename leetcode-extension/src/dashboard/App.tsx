import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, BarChart3,
  Calendar, Settings, Zap,
  RefreshCw, LogOut, User,
  Timer, ListTodo, Clock, TrendingUp, Sparkles, FileText, ChevronDown
} from "lucide-react";
import type { Stats } from "../services/analytics";
import { computeStats, formatMs } from "../services/analytics";
import { getDueRevisions } from "../services/revision";
import HeatmapView from "./HeatmapView";
import DifficultyChart from "./DifficultyChart";
import TopicChart from "./TopicChart";
import JournalView from "./JournalView";
import RevisionView from "./RevisionView";
import SettingsView from "./SettingsView";
import DSASheetView from "./DSASheetView";
import FocusTimerView from "./FocusTimerView";
import TasksView from "./TasksView";
import TimeTrackingView from "./TimeTrackingView";
import AnalyticsView from "./AnalyticsView";
import AIInsightsView from "./AIInsightsView";
import ReportsView from "./ReportsView";
import AuthPage from "./AuthPage";
import LandingPage from "./LandingPage";
import { getToken, getStoredUser, logout } from "../services/storage-adapter";
import type { StoredUser } from "../services/storage-adapter";
import { focusApi, clarioTasksApi, analyticsApi } from "../services/clario-api";



type Tab =
  | "overview"
  | "journal"
  | "revision"
  | "topics"
  | "heatmap"
  | "dsa"
  | "focus"
  | "tasks"
  | "timetrack"
  | "analytics"
  | "ai"
  | "reports"
  | "settings";

const NAV_LEETCODE = [
  { id: "overview",  label: "Overview",       icon: LayoutDashboard },
  { id: "journal",   label: "Journal",        icon: BookOpen },
  { id: "revision",  label: "Revisions",      icon: RefreshCw },
  { id: "topics",    label: "Topics",         icon: BarChart3 },
  { id: "heatmap",   label: "Heatmap",        icon: Calendar },
  { id: "dsa",       label: "DSA Sheet",      icon: Zap },
] as const;

const NAV_CLARIO = [
  { id: "focus",     label: "Focus Timer",   icon: Timer },
  { id: "tasks",     label: "Tasks",         icon: ListTodo },
  { id: "timetrack", label: "Time Tracker",  icon: Clock },
  { id: "analytics", label: "Analytics",     icon: TrendingUp },
  { id: "ai",        label: "AI Insights",   icon: Sparkles },
  { id: "reports",   label: "Reports",       icon: FileText },
] as const;

const NAV_BOTTOM = [
  { id: "settings",  label: "Settings",      icon: Settings },
] as const;

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [openGroup, setOpenGroup] = useState<"leetcode" | "productivity">("leetcode");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([getToken(), getStoredUser()]);
      if (token && storedUser) setUser(storedUser);
      setAuthChecked(true);
    })();
  }, []);

  // Load stats once authenticated
  useEffect(() => {
    if (!user) return;
    computeStats().then(setStats);
    getDueRevisions().then((r) => setDueCount(r.length));

    // Warm-up: pre-fetch common Clario endpoints in background
    // so they're cached before the user navigates to those tabs
    const today = new Date().toISOString().split("T")[0];
    Promise.allSettled([
      focusApi.getTodayStats(),
      focusApi.getActiveSession(),
      clarioTasksApi.getByDate(today),
      analyticsApi.getAnalytics("day"),
    ]).catch(() => {}); // fire-and-forget; errors are silently ignored
  }, [user]);

  async function handleLogout() {
    await logout();
    setUser(null);
    setStats(null);
    setDueCount(0);
  }

  // ── Auth gate ──────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <Zap size={28} color="var(--accent)" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* ── Mobile Sidebar Overlay ─────────────────────────── */}
      <div 
        className={`app-sidebar-overlay ${isMobileOpen ? "open" : ""}`} 
        onClick={() => setIsMobileOpen(false)} 
      />

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={`app-sidebar ${isMobileOpen ? "open" : ""}`}
        style={{
          width: 220,
          minWidth: 220,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "1rem 0.75rem",
          gap: 4,
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0.75rem 0.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap size={18} color="var(--accent)" fill="var(--accent)" />
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: 15 }}>uCode</span>
          </div>
          {/* Mobile close button inside sidebar */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 18 }}
            className="mobile-close-btn"
          >
            ✕
          </button>
        </div>

        {/* LeetCode group */}
        <button
          className={`nav-group-header ${openGroup === "leetcode" ? "open" : ""}`}
          onClick={() => setOpenGroup(openGroup === "leetcode" ? "productivity" : "leetcode")}
        >
          <ChevronDown size={12} style={{ transform: openGroup === "leetcode" ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s", flexShrink: 0 }} />
          LeetCode
        </button>
        {openGroup === "leetcode" && NAV_LEETCODE.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id as Tab); setIsMobileOpen(false); }}
            className={`nav-item ${tab === id ? "active" : ""}`}
          >
            <Icon size={14} />
            {label}
            {id === "revision" && dueCount > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--hard)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                {dueCount}
              </span>
            )}
          </button>
        ))}

        <div className="divider" style={{ margin: "0.35rem 0" }} />

        {/* Productivity group */}
        <button
          className={`nav-group-header ${openGroup === "productivity" ? "open" : ""}`}
          onClick={() => setOpenGroup(openGroup === "productivity" ? "leetcode" : "productivity")}
        >
          <ChevronDown size={12} style={{ transform: openGroup === "productivity" ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s", flexShrink: 0 }} />
          Productivity
        </button>
        {openGroup === "productivity" && NAV_CLARIO.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id as Tab); setIsMobileOpen(false); }}
            className={`nav-item ${tab === id ? "active" : ""}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}

        {/* Settings standalone */}
        <div className="divider" style={{ margin: "0.35rem 0" }} />
        {NAV_BOTTOM.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id as Tab); setIsMobileOpen(false); }}
            className={`nav-item ${tab === id ? "active" : ""}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}

        {/* Bottom streak */}
        {stats && (
          <div
            style={{
              marginTop: "auto",
              background: "var(--accent-glow)",
              border: "1px solid rgba(245,158,11,.2)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem",
            }}
          >
            <div className="section-label" style={{ marginBottom: 4 }}>
              Current Streak
            </div>
            <div
              style={{ display: "flex", alignItems: "baseline", gap: 4 }}
            >
              <span className="stat-number" style={{ fontSize: "1.5rem", color: "var(--accent)" }}>
                {stats.currentStreak}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                days 🔥
              </span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
              Best: {stats.longestStreak} days
            </div>
          </div>
        )}

        {/* User row */}
        <div
          style={{
            marginTop: stats ? "0.5rem" : "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0.5rem 0.6rem",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--accent-glow)",
              border: "1px solid rgba(245,158,11,.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={12} color="var(--accent)" />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.username || user.email.split("@")[0]}
          </span>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              padding: 2,
              borderRadius: 4,
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </aside>


      {/* ── Main content area ────────────────────────────── */}
      <main
        className="app-main"
        style={{
          flex: 1,
          overflow: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          position: "relative",
        }}
      >
        {/* Mobile Header (Hamburger + Tab Name) */}
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setIsMobileOpen(true)}>
            ☰
          </button>
          <span style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-primary)", textTransform: "capitalize" }}>
            {tab === "dsa" ? "DSA Pattern Sheet" : tab}
          </span>
        </div>

        <div>
            {tab === "overview"  && <OverviewView stats={stats} />}
            {tab === "journal"   && <JournalView />}
            {tab === "revision"  && <RevisionView onCountChange={setDueCount} />}
            {tab === "topics"    && <TopicChart stats={stats} />}
            {tab === "heatmap"   && <HeatmapView stats={stats} />}
            {tab === "dsa"       && <DSASheetView />}
            {tab === "focus"     && <FocusTimerView />}
            {tab === "tasks"     && <TasksView />}
            {tab === "timetrack" && <TimeTrackingView />}
            {tab === "analytics" && <AnalyticsView />}
            {tab === "ai"        && <AIInsightsView />}
            {tab === "reports"   && <ReportsView />}
            {tab === "settings"  && <SettingsView />}
          </div>
      </main>
      </div>  {/* end inner flex row */}
    </div>
  );
}

// ─── Overview View ────────────────────────────────────────────
function OverviewView({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  const totalMax = Math.max(stats.totalSolved, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Overview
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        <StatCard label="Total Solved" value={stats.totalSolved} color="var(--accent)" icon="🎯" />
        <StatCard label="Easy" value={stats.easy} color="var(--easy)" icon="🟢" />
        <StatCard label="Medium" value={stats.medium} color="var(--medium)" icon="🟡" />
        <StatCard label="Hard" value={stats.hard} color="var(--hard)" icon="🔴" />
      </div>

      {/* Difficulty progress */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: "1rem" }}>Difficulty Progress</div>
        {[
          { label: "Easy", value: stats.easy, color: "var(--easy)" },
          { label: "Medium", value: stats.medium, color: "var(--medium)" },
          { label: "Hard", value: stats.hard, color: "var(--hard)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {value}
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(value / totalMax) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Time analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Avg Solve Time</div>
          {(["Easy", "Medium", "Hard"] as const).map((d) => (
            <div key={d}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
            >
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{d}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                {stats.avgTimeByDifficulty[d] > 0
                  ? formatMs(stats.avgTimeByDifficulty[d])
                  : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Streak</div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-number gradient-text">{stats.currentStreak}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>Current (days)</div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{stats.longestStreak}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Longest</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent problems */}
      {stats.recentProblems.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Recent Submissions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stats.recentProblems.slice(0, 5).map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-glass)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {p.id}
                  </span>
                  <span style={{ fontSize: 13 }}>{p.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className={`badge badge-${p.difficulty.toLowerCase()}`}>
                    {p.difficulty}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {p.language}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, color, icon,
}: {
  label: string; value: number; color: string; icon: string;
}) {
  return (
    <motion.div
      className="card"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div className="stat-number" style={{ color }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>{label}</div>
    </motion.div>
  );
}

// ── Collapsible nav group ───────────────────────────────────────
function NavGroup({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Group header — clickable toggle */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
          background: isOpen ? "var(--accent-glow)" : "transparent",
          border: `1px solid ${isOpen ? "rgba(245,158,11,.2)" : "transparent"}`,
          borderRadius: "var(--radius-sm)",
          padding: "0.55rem 0.75rem",
          cursor: "pointer",
          color: isOpen ? "var(--accent)" : "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 700,
          textAlign: "left",
          transition: "all 0.2s",
        }}
      >
        <span style={{ flex: 1 }}>{label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      {/* Animated children panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
