import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { DayJournal, ProblemRecord } from "../services/storage";
import { getJournals, getProblems } from "../services/storage";
import { formatMs } from "../services/analytics";
import { CheckCircle } from "lucide-react";

export default function JournalView() {
  const [journals, setJournals] = useState<DayJournal[]>([]);
  const [problems, setProblems] = useState<Record<string, ProblemRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getJournals(), getProblems()]).then(([j, p]) => {
      const sorted = Object.values(j).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setJournals(sorted);
      setProblems(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "4rem",
          gap: "1rem",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ fontSize: 48 }}>📔</span>
        <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>No entries yet</h2>
        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
          Solve your first problem on LeetCode and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Coding Journal
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          {journals.length} active days recorded
        </p>
      </div>

      {journals.map((journal, i) => {
        const d = new Date(journal.date + "T00:00:00");
        const dayProblems = journal.problemIds
          .map((id) => problems[id])
          .filter(Boolean);

        const easyCount = dayProblems.filter((p) => p.difficulty === "Easy").length;
        const mediumCount = dayProblems.filter((p) => p.difficulty === "Medium").length;
        const hardCount = dayProblems.filter((p) => p.difficulty === "Hard").length;

        return (
          <motion.div
            key={journal.date}
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {/* Date header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {format(d, "d MMM yyyy")}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {format(d, "EEEE")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  className="mono"
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}
                >
                  {formatMs(journal.totalTimeMs)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>time spent</div>
              </div>
            </div>

            {/* Problems list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {dayProblems.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0.4rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-glass)",
                  }}
                >
                  <CheckCircle size={13} color="var(--easy)" />
                  <span className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {p.id}
                  </span>
                  <span style={{ fontSize: 13, flex: 1 }}>{p.title}</span>
                  <span className={`badge badge-${p.difficulty.toLowerCase()}`}>
                    {p.difficulty}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {p.runtime}
                  </span>
                </div>
              ))}
            </div>

            {/* Day summary */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Questions:{" "}
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {dayProblems.length}
                </span>
              </div>
              {easyCount > 0 && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: "var(--easy)", fontWeight: 600 }}>Easy: {easyCount}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: "var(--medium)", fontWeight: 600 }}>Medium: {mediumCount}</span>
                </div>
              )}
              {hardCount > 0 && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: "var(--hard)", fontWeight: 600 }}>Hard: {hardCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
