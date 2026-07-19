import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ProblemRecord } from "../services/storage";
import { getProblemById } from "../services/storage";
import { CheckCircle, XCircle, ChevronRight, Brain } from "lucide-react";
import { computeRevisionDates, getDueRevisions, recordRevisionResult } from "../services/revision";

interface DueItem {
  problemId: string;
  title: string;
  difficulty: string;
  status: "pending" | "remembered" | "forgot";
  nextRevisionLabel: string;
  problem: ProblemRecord | null;
}

export default function RevisionView({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [items, setItems] = useState<DueItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDueRevisions().then((due) => {
      setItems(
        due.map((d) => ({
          problemId: d.entry.problemId,
          title: d.title,
          difficulty: d.difficulty,
          status: "pending",
          nextRevisionLabel: "",
          problem: null,
        }))
      );
      setLoading(false);
    });
  }, []);

  async function markResult(problemId: string, remembered: boolean) {
    await recordRevisionResult(problemId, remembered);
    setItems((prev) =>
      prev.map((item) =>
        item.problemId === problemId
          ? { ...item, status: remembered ? "remembered" : "forgot" }
          : item
      )
    );
    const remaining = items.filter(
      (i) => i.problemId !== problemId && i.status === "pending"
    ).length;
    onCountChange(remaining);
  }

  const pending = items.filter((i) => i.status === "pending");
  const done = items.filter((i) => i.status !== "pending");

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        Loading revisions…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem",
          gap: "1rem",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ fontSize: 48 }}>🎉</span>
        <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>All caught up!</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          No revisions due today. Keep solving to build your schedule.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Today's Revisions
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          {pending.length} pending · {done.length} completed
        </p>
      </div>

      {/* Pending */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {pending.map((item) => (
          <RevisionCard
            key={item.problemId}
            item={item}
            isExpanded={expanded === item.problemId}
            onToggle={() =>
              setExpanded(expanded === item.problemId ? null : item.problemId)
            }
            onRemembered={() => markResult(item.problemId, true)}
            onForgot={() => markResult(item.problemId, false)}
          />
        ))}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <>
          <div className="section-label">Completed</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {done.map((item) => (
              <div
                key={item.problemId}
                className={`revision-card ${item.status}`}
                style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}
              >
                {item.status === "remembered" ? (
                  <CheckCircle size={16} color="var(--easy)" />
                ) : (
                  <XCircle size={16} color="var(--hard)" />
                )}
                <span style={{ fontSize: 13 }}>{item.title}</span>
                <span
                  className={`badge badge-${item.difficulty.toLowerCase()}`}
                  style={{ marginLeft: "auto" }}
                >
                  {item.difficulty}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RevisionCard({
  item,
  isExpanded,
  onToggle,
  onRemembered,
  onForgot,
}: {
  item: DueItem;
  isExpanded: boolean;
  onToggle: () => void;
  onRemembered: () => void;
  onForgot: () => void;
}) {
  const revDates = computeRevisionDates(new Date());

  return (
    <motion.div
      layout
      className="revision-card"
      style={{ cursor: "pointer" }}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        <Brain size={16} color="var(--accent)" />
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{item.title}</span>
        <span className={`badge badge-${item.difficulty.toLowerCase()}`}>
          {item.difficulty}
        </span>
        <ChevronRight
          size={14}
          color="var(--text-muted)"
          style={{
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>

      {/* Expanded: spaced repetition schedule */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{ marginTop: "1rem" }}
        >
          <div
            style={{
              background: "var(--bg-base)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div className="section-label" style={{ marginBottom: 8 }}>
              Revision Schedule
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {revDates.map((d, i) => (
                <span
                  key={i}
                  style={{
                    background: "var(--bg-card2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 11,
                    padding: "2px 8px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn"
              onClick={onForgot}
              style={{
                flex: 1,
                background: "rgba(239,68,68,0.12)",
                color: "var(--hard)",
                border: "1px solid rgba(239,68,68,0.25)",
                justifyContent: "center",
              }}
            >
              <XCircle size={14} /> Forgot
            </button>
            <button
              className="btn"
              onClick={onRemembered}
              style={{
                flex: 1,
                background: "rgba(34,197,94,0.12)",
                color: "var(--easy)",
                border: "1px solid rgba(34,197,94,0.25)",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={14} /> Remembered
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
