import React from "react";
import { motion } from "framer-motion";
import type { Stats } from "../services/analytics";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const TOPIC_COLORS: Record<string, string> = {
  "Dynamic Programming": "#8b5cf6",
  "Array": "#3b82f6",
  "String": "#06b6d4",
  "Tree": "#22c55e",
  "Graph": "#f59e0b",
  "Hash Table": "#ec4899",
  "Greedy": "#f97316",
  "Binary Search": "#14b8a6",
  "Backtracking": "#ef4444",
  "Sliding Window": "#a855f7",
  "Two Pointers": "#6366f1",
  "Linked List": "#84cc16",
  "Stack": "#eab308",
  "Heap": "#06b6d4",
  "Trie": "#d946ef",
};

function getColor(topic: string): string {
  return TOPIC_COLORS[topic] ?? "#64748b";
}

export default function TopicChart({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  const topTopics = Object.entries(stats.topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);

  const topCompanies = Object.entries(stats.companyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxCount = topTopics[0]?.[1] ?? 1;

  const radarData = topTopics.slice(0, 8).map(([name, value]) => ({
    topic: name.length > 12 ? name.slice(0, 12) + "…" : name,
    value,
    fullMark: maxCount,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Topics & Companies
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          {Object.keys(stats.topicCounts).length} topics covered
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Radar chart */}
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Topic Radar</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
              />
              <Radar
                name="Problems"
                dataKey="value"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic bars */}
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Top Topics</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
            {topTopics.map(([topic, count], i) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-primary)" }}>
                    {topic}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 12, fontWeight: 600, color: getColor(topic) }}
                  >
                    {count}
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.04 }}
                    style={{ background: getColor(topic) }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Company tags */}
      {topCompanies.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginBottom: "0.75rem" }}>Company Tags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {topCompanies.map(([company, count]) => (
              <motion.div
                key={company}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--bg-card2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.4rem 0.75rem",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{company}</span>
                <span
                  style={{
                    fontSize: 11,
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    padding: "0 5px",
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
