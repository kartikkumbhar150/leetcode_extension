import React from "react";
import { motion } from "framer-motion";
import type { Stats } from "../services/analytics";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["Mon","","Wed","","Fri","","Sun"];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  if (count <= 6) return 4;
  return 5;
}

export default function HeatmapView({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  // Build 52 weeks × 7 days grid (last 364 days)
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from 52 weeks ago, on the Monday of that week
  const start = new Date(today);
  start.setDate(today.getDate() - 364);
  // Align to Monday
  const dayOfWeek = (start.getDay() + 6) % 7; // Mon=0
  start.setDate(start.getDate() - dayOfWeek);

  let cursor = new Date(start);
  let week: { date: string; count: number }[] = [];

  while (cursor <= today) {
    const key = cursor.toISOString().split("T")[0];
    week.push({ date: key, count: stats.heatmap[key] ?? 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const d = new Date(w[0].date);
    if (d.getMonth() !== lastMonth) {
      monthLabels.push({ label: MONTH_LABELS[d.getMonth()], col: i });
      lastMonth = d.getMonth();
    }
  });

  const totalSolvedYear = Object.values(stats.heatmap).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Activity Heatmap
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          {totalSolvedYear} problems solved in the last year
        </p>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {/* Month labels */}
        <div style={{ display: "flex", marginLeft: 28, marginBottom: 4, gap: 2 }}>
          {weeks.map((_, i) => {
            const ml = monthLabels.find((m) => m.col === i);
            return (
              <div key={i} style={{ width: 14, flexShrink: 0 }}>
                {ml && (
                  <span
                    style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}
                  >
                    {ml.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {/* Day labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginRight: 4,
              justifyContent: "space-between",
            }}
          >
            {DAY_LABELS.map((d, i) => (
              <div
                key={i}
                style={{
                  height: 14,
                  fontSize: 9,
                  color: "var(--text-muted)",
                  lineHeight: "14px",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div style={{ display: "flex", gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {week.map((cell, di) => (
                  <motion.div
                    key={di}
                    className={`heatmap-cell heatmap-${getIntensity(cell.count)}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: wi * 0.005 }}
                    style={{ position: "relative" }}
                    title={`${cell.date}: ${cell.count} problem${cell.count !== 1 ? "s" : ""}`}
                  >
                    <span className="tooltip">
                      {cell.date}: {cell.count} solved
                    </span>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 12,
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Less</span>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <div key={l} className={`heatmap-cell heatmap-${l}`} style={{ cursor: "default" }} />
          ))}
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>More</span>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: "0.75rem" }}>Monthly Breakdown</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "0.5rem",
          }}
        >
          {MONTH_LABELS.map((month, i) => {
            const count = Object.entries(stats.heatmap)
              .filter(([d]) => new Date(d).getMonth() === i)
              .reduce((acc, [, v]) => acc + v, 0);
            return (
              <div
                key={month}
                style={{
                  textAlign: "center",
                  background: "var(--bg-glass)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.5rem",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{month}</div>
                <div style={{ fontWeight: 700, color: count > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
