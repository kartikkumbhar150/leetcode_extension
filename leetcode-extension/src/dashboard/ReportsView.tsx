import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader } from "lucide-react";
import { reportsApi } from "../services/clario-api";
import type { ReportData } from "../services/clario-api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

function formatMin(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

function formatSec(s: number): string {
  const h = (s / 3600).toFixed(1);
  return `${h}h`;
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function weekAgoKey() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
}

export default function ReportsView() {
  const [startDate, setStartDate] = useState(weekAgoKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReport() {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError("");
    try {
      const data = await reportsApi.getReport(startDate, endDate);
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          <FileText size={20} style={{ display: "inline", marginRight: 8 }} />
          Reports
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          Custom date-range productivity reports
        </p>
      </div>

      {/* Date picker */}
      <div className="card" style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Start Date</label>
            <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>End Date</label>
            <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <Loader size={14} />
                </motion.div>
                Generating…
              </>
            ) : (
              <>
                <Download size={14} /> Generate Report
              </>
            )}
          </button>
          {/* Quick presets */}
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {[
              { label: "7D", days: 7 },
              { label: "14D", days: 14 },
              { label: "30D", days: 30 },
            ].map(({ label, days }) => (
              <button
                key={label}
                className="tab-btn"
                style={{ fontSize: 10, padding: "4px 10px" }}
                onClick={() => {
                  const end = todayKey();
                  const start = new Date();
                  start.setDate(start.getDate() - (days - 1));
                  setStartDate(start.toISOString().split("T")[0]);
                  setEndDate(end);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--hard)", fontSize: 13, padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {!report && !loading && (
        <div className="empty-state">
          <span className="empty-state-icon">📊</span>
          <h2 className="empty-state-title">Select a date range</h2>
          <p className="empty-state-text">Choose start and end dates, then click Generate Report.</p>
        </div>
      )}

      {report && (
        <>
          {/* Overview stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
            <div className="mini-stat">
              <div className="mini-stat-value" style={{ color: "var(--accent)" }}>{report.productivityIndex}</div>
              <div className="mini-stat-label">Productivity</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-value" style={{ color: "var(--easy)" }}>{formatMin(report.productiveMinutes)}</div>
              <div className="mini-stat-label">Productive</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-value" style={{ color: "var(--hard)" }}>{formatMin(report.wastedMinutes)}</div>
              <div className="mini-stat-label">Wasted</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-value">{report.completedTasks}/{report.totalTasks}</div>
              <div className="mini-stat-label">Tasks</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-value">{report.totalDays}</div>
              <div className="mini-stat-label">Days</div>
            </div>
          </div>

          {/* Daily breakdown chart */}
          {report.dailyBreakdown.length > 0 && (
            <div className="card">
              <div className="section-label" style={{ marginBottom: "1rem" }}>Daily Breakdown</div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.dailyBreakdown} barSize={16}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} unit="m" />
                    <Tooltip
                      contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(v: any) => new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    />
                    <Legend formatter={(v: string) => <span style={{ fontSize: 11, color: "#94a3b8" }}>{v}</span>} />
                    <Bar dataKey="productive" stackId="a" fill="#22c55e" name="Productive" />
                    <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" />
                    <Bar dataKey="wasted" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Wasted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Focus timer report */}
          <div className="card">
            <div className="section-label" style={{ marginBottom: "1rem" }}>⏱️ Focus Timer</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
              <div className="mini-stat">
                <div className="mini-stat-value" style={{ color: "var(--accent)" }}>{report.focus.totalFocusHours}h</div>
                <div className="mini-stat-label">Total Focus</div>
              </div>
              <div className="mini-stat">
                <div className="mini-stat-value">{report.focus.sessionCount}</div>
                <div className="mini-stat-label">Sessions</div>
              </div>
              <div className="mini-stat">
                <div className="mini-stat-value" style={{ color: "var(--easy)" }}>{formatSec(report.focus.longestSessionSeconds)}</div>
                <div className="mini-stat-label">Longest</div>
              </div>
              <div className="mini-stat">
                <div className="mini-stat-value">{report.focus.focusStreak}</div>
                <div className="mini-stat-label">Streak Days</div>
              </div>
            </div>
          </div>

          {/* Journal mood trend */}
          {report.journal.moodTrend.length > 0 && (
            <div className="card">
              <div className="section-label" style={{ marginBottom: "1rem" }}>📔 Mood & Energy Trend</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="mini-stat">
                  <div className="mini-stat-value" style={{ color: "var(--accent)" }}>{report.journal.avgMood?.toFixed(1) ?? "—"}</div>
                  <div className="mini-stat-label">Avg Mood</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-value">{report.journal.avgEnergy?.toFixed(1) ?? "—"}</div>
                  <div className="mini-stat-label">Avg Energy</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-value">{report.journal.entriesCount}</div>
                  <div className="mini-stat-label">Entries</div>
                </div>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.journal.moodTrend}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} domain={[0, 5]} />
                    <Tooltip
                      contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend formatter={(v: string) => <span style={{ fontSize: 11, color: "#94a3b8" }}>{v}</span>} />
                    <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Mood" connectNulls />
                    <Line type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Energy" connectNulls />
                    <Line type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Focus" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Revision summary */}
          <div className="card">
            <div className="section-label" style={{ marginBottom: "1rem" }}>🧠 Revision Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="mini-stat">
                <div className="mini-stat-value">{report.revision.totalTopics}</div>
                <div className="mini-stat-label">Topics</div>
              </div>
              <div className="mini-stat">
                <div className="mini-stat-value" style={{ color: "var(--easy)" }}>{report.revision.masteredTopics}</div>
                <div className="mini-stat-label">Mastered</div>
              </div>
              <div className="mini-stat">
                <div className="mini-stat-value">{report.revision.totalReviewsInRange}</div>
                <div className="mini-stat-label">Reviews</div>
              </div>
              <div className="mini-stat">
                <div className="mini-stat-value" style={{ color: "var(--accent)" }}>{report.revision.avgReviewConfidence}</div>
                <div className="mini-stat-label">Avg Confidence</div>
              </div>
            </div>

            {/* Subject stats table */}
            {report.revision.subjectStats.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Topics</th>
                      <th>Mastered</th>
                      <th>Avg Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.revision.subjectStats.map((s) => (
                      <tr key={s.subject}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.subject}</td>
                        <td>{s.total}</td>
                        <td style={{ color: "var(--easy)" }}>{s.mastered}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div className="progress-bar" style={{ width: 60 }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${(s.avgConf / 5) * 100}%`, background: s.avgConf >= 4 ? "var(--easy)" : s.avgConf >= 2.5 ? "var(--medium)" : "var(--hard)" }}
                              />
                            </div>
                            <span>{s.avgConf}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Weekday breakdown */}
          {report.weekdayBreakdown.length > 0 && (
            <div className="card">
              <div className="section-label" style={{ marginBottom: "1rem" }}>📅 Weekday Averages</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.weekdayBreakdown} barSize={24}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} unit="m" />
                    <Tooltip
                      contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="avgProductive" stackId="a" fill="#22c55e" name="Productive" />
                    <Bar dataKey="avgNeutral" stackId="a" fill="#f59e0b" name="Neutral" />
                    <Bar dataKey="avgWasted" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Wasted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
