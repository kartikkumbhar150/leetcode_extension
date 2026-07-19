import React from "react";
import type { Stats } from "../services/analytics";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

export default function DifficultyChart({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const data = [
    { name: "Easy", value: stats.easy, color: "#22c55e" },
    { name: "Medium", value: stats.medium, color: "#f59e0b" },
    { name: "Hard", value: stats.hard, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#141823",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            color: "#f1f5f9",
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
