import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { aiApi } from "../services/clario-api";
import type { AIInsightsData } from "../services/clario-api";

export default function AIInsightsView() {
  const [data, setData] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadInsights() {
    try {
      const result = await aiApi.getInsights();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadInsights(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadInsights();
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Analyzing your data…</div>;
  }

  if (!data) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🤖</span>
        <h2 className="empty-state-title">No insights available</h2>
        <p className="empty-state-text">Start tracking time and completing tasks to get AI-powered insights.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            <Sparkles size={20} style={{ display: "inline", marginRight: 8, color: "var(--accent)" }} />
            AI Insights
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
            Smart analysis of your last 7 days
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ opacity: refreshing ? 0.6 : 1 }}
        >
          <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: "linear" }}>
            <RefreshCw size={14} />
          </motion.div>
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="card" style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--accent)" }}>Weekly Summary</div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          {data.summary}
        </p>
      </div>

      {/* Stats overview */}
      {data.stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--accent)" }}>{data.stats.productivityRate}%</div>
            <div className="mini-stat-label">Productive</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value">{data.stats.totalSlots * 20}</div>
            <div className="mini-stat-label">Min Tracked</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value" style={{ color: "var(--easy)" }}>{data.stats.taskCompletionRate}%</div>
            <div className="mini-stat-label">Tasks Done</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-value">{data.stats.daysTracked}/7</div>
            <div className="mini-stat-label">Days Active</div>
          </div>
        </div>
      )}

      {/* Insight cards */}
      <div className="section-label">Insights</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {data.insights.map((insight, i) => (
          <motion.div
            key={i}
            className="insight-card"
            data-type={insight.type}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="insight-icon">{insight.icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                {insight.type}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                {insight.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Best & Worst hours */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {data.bestHours.length > 0 && (
          <div className="card">
            <div className="section-label" style={{ marginBottom: "0.75rem", color: "var(--easy)" }}>
              🎯 Best Hours
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.bestHours.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{h.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${h.productivityRate}%`, background: "var(--easy)" }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--easy)", fontWeight: 600, minWidth: 32, textAlign: "right" }}>
                      {h.productivityRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.worstHours.length > 0 && (
          <div className="card">
            <div className="section-label" style={{ marginBottom: "0.75rem", color: "var(--hard)" }}>
              ⚠️ Worst Hours
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.worstHours.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{h.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${h.productivityRate}%`, background: "var(--hard)" }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--hard)", fontWeight: 600, minWidth: 32, textAlign: "right" }}>
                      {h.productivityRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
