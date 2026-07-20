import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { slotsApi, userApi, clarioTasksApi } from "../services/clario-api";
import type { TimeSlot, ClarioTask } from "../services/clario-api";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// Generate 72 time ranges (20-min blocks from 00:00 to 23:40)
function generateTimeRanges(): string[] {
  const ranges: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 20) {
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endM = m + 20;
      const endH = endM >= 60 ? h + 1 : h;
      const endMin = endM % 60;
      const end = `${String(endH).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
      ranges.push(`${start}-${end}`);
    }
  }
  return ranges;
}

const TIME_RANGES = generateTimeRanges();

const PROD_TYPES = [
  { value: "productive", label: "Productive", color: "var(--easy)" },
  { value: "neutral", label: "Neutral", color: "var(--medium)" },
  { value: "wasted", label: "Wasted", color: "var(--hard)" },
] as const;

export default function TimeTrackingView() {
  const [date, setDate] = useState(todayKey());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tasks, setTasks] = useState<ClarioTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formProd, setFormProd] = useState<"productive" | "neutral" | "wasted">("productive");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, t] = await Promise.all([
        slotsApi.getByDate(date),
        userApi.getCategories(),
        clarioTasksApi.getByDate(date).catch(() => []),
      ]);
      setSlots(s);
      setCategories(c);
      setTasks(t);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  function changeDate(delta: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  }

  async function handleSaveSlot(timeRange: string) {
    if (!formCategory) return;
    try {
      await slotsApi.create({
        date,
        timeRange,
        taskSelected: formTask || undefined,
        category: formCategory,
        productivityType: formProd,
      });
      setSelectedSlot(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save slot");
    }
  }

  // Build lookup map
  const slotMap = new Map<string, TimeSlot>();
  slots.forEach((s) => slotMap.set(s.timeRange, s));

  // Stats
  const totalTracked = slots.length;
  const productive = slots.filter((s) => s.productivityType === "productive").length;
  const wasted = slots.filter((s) => s.productivityType === "wasted").length;
  const neutral = slots.filter((s) => s.productivityType === "neutral").length;

  const isToday = date === todayKey();
  const displayDate = new Date(date + "T00:00:00");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Time Tracker</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          Track 20-minute time blocks
        </p>
      </div>

      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => changeDate(-1)}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {isToday ? "Today" : displayDate.toLocaleDateString("en-US", { weekday: "long" })}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {displayDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => changeDate(1)}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary */}
      {totalTracked > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          <div className="mini-stat">
            <div className="mini-stat-value">{totalTracked * 20}</div>
            <div className="mini-stat-label">Min Tracked</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--easy)" }}>{productive * 20}</div>
            <div className="mini-stat-label">Productive</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--medium)" }}>{neutral * 20}</div>
            <div className="mini-stat-label">Neutral</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--hard)" }}>{wasted * 20}</div>
            <div className="mini-stat-label">Wasted</div>
          </div>
        </div>
      )}

      {/* Time grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading…</div>
      ) : (
        <div className="card" style={{ padding: "1rem", maxHeight: 500, overflow: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TIME_RANGES.map((range) => {
              const slot = slotMap.get(range);
              const isSelected = selectedSlot === range;
              const startTime = range.split("-")[0];

              return (
                <div key={range}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr auto",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedSlot(isSelected ? null : range)}
                  >
                    <span className="slot-label">{startTime}</span>
                    <div
                      className={`slot-cell ${slot ? slot.productivityType : "empty"}`}
                      style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-start", paddingLeft: 12 }}
                    >
                      {slot ? (
                        <>
                          <span style={{ fontWeight: 600, fontSize: 11 }}>{slot.category}</span>
                          {slot.taskSelected && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>· {slot.taskSelected}</span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                      )}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: slot ? (slot.productivityType === "productive" ? "var(--easy)" : slot.productivityType === "wasted" ? "var(--hard)" : "var(--medium)") : "transparent" }} />
                  </div>

                  {/* Inline form */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      style={{
                        background: "var(--bg-card2)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.75rem",
                        margin: "4px 0 4px 68px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Category</label>
                          <select className="select-input" style={{ width: "100%" }} value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                            <option value="">Select…</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Task</label>
                          <select className="select-input" style={{ width: "100%" }} value={formTask} onChange={(e) => setFormTask(e.target.value)}>
                            <option value="">None</option>
                            {tasks.map((t) => <option key={t._id} value={t.taskName}>{t.taskName}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Type</label>
                          <div style={{ display: "flex", gap: 4 }}>
                            {PROD_TYPES.map((pt) => (
                              <button
                                key={pt.value}
                                className="tab-btn"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 10,
                                  ...(formProd === pt.value ? { background: pt.color, color: "#000", borderColor: pt.color } : {}),
                                }}
                                onClick={() => setFormProd(pt.value)}
                              >
                                {pt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                          onClick={() => handleSaveSlot(range)}
                          disabled={!formCategory}
                        >
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
