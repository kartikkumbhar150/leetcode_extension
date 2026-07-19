import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Zap, BarChart3, ExternalLink, Settings, RefreshCw } from "lucide-react";
import type { Stats } from "../services/analytics";
import { computeStats } from "../services/analytics";
import { getDueRevisions } from "../services/revision";
import "../index.css";

function Popup() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    computeStats().then(setStats);
    getDueRevisions().then((r) => setDueCount(r.length));
  }, []);

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  }

  return (
    <div
      style={{
        width: 360,
        minHeight: 420,
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={20} color="var(--accent)" fill="var(--accent)" />
          <span
            className="gradient-text"
            style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}
          >
            LeetSync
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn btn-ghost"
            onClick={openDashboard}
            style={{ padding: "0.35rem 0.6rem", fontSize: 12 }}
          >
            <BarChart3 size={13} /> Dashboard
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => chrome.runtime.openOptionsPage?.()}
            style={{ padding: "0.35rem 0.6rem" }}
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {stats ? (
          <>
            {/* Totals */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.5rem",
              }}
            >
              {[
                { label: "Total", value: stats.totalSolved, color: "var(--accent)" },
                { label: "Easy", value: stats.easy, color: "var(--easy)" },
                { label: "Med", value: stats.medium, color: "var(--medium)" },
                { label: "Hard", value: stats.hard, color: "var(--hard)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.6rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 18, color }}>{value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Streak */}
            <div
              style={{
                background: "var(--accent-glow)",
                border: "1px solid rgba(245,158,11,.2)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Current Streak</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>
                  {stats.currentStreak} <span style={{ fontSize: 14 }}>days 🔥</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Longest</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{stats.longestStreak}</div>
              </div>
            </div>

            {/* Revisions due */}
            {dueCount > 0 && (
              <div
                style={{
                  background: "rgba(239,68,68,.08)",
                  border: "1px solid rgba(239,68,68,.2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={14} color="var(--hard)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--hard)" }}>
                    {dueCount} revision{dueCount !== 1 ? "s" : ""} due today
                  </span>
                </div>
                <button
                  onClick={openDashboard}
                  className="btn"
                  style={{
                    fontSize: 11,
                    padding: "0.25rem 0.6rem",
                    background: "rgba(239,68,68,.15)",
                    color: "var(--hard)",
                    border: "1px solid rgba(239,68,68,.3)",
                  }}
                >
                  Review →
                </button>
              </div>
            )}

            {/* Recent problems */}
            {stats.recentProblems.length > 0 && (
              <div>
                <div className="section-label" style={{ marginBottom: 6 }}>Recent</div>
                {stats.recentProblems.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.4rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: 13, flex: 1 }}>{p.title}</span>
                    <span className={`badge badge-${p.difficulty.toLowerCase()}`}>
                      {p.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-muted)",
            }}
          >
            Loading stats…
          </div>
        )}

        {/* Open dashboard CTA */}
        <button
          onClick={openDashboard}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
        >
          <BarChart3 size={14} /> Open Full Dashboard
          <ExternalLink size={12} style={{ marginLeft: "auto" }} />
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
