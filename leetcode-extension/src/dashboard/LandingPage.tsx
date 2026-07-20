import React, { useState } from "react";
import { Zap } from "lucide-react";
import AuthPage from "./AuthPage";
import type { StoredUser } from "../services/storage-adapter";

interface LandingPageProps {
  onSuccess: (user: StoredUser) => void;
}

type View = "landing" | "login" | "signup";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage({ onSuccess }: LandingPageProps) {
  const [view, setView] = useState<View>("landing");

  if (view === "login" || view === "signup") {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setView("landing")}
          style={{
            position: "fixed", top: "1.25rem", left: "1.5rem", zIndex: 200,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-secondary)", borderRadius: 8,
            padding: "0.4rem 0.9rem", fontSize: 13, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(12px)",
          }}
        >
          ← Back
        </button>
        <AuthPage key={view} onSuccess={onSuccess} initialMode={view === "signup" ? "signup" : "login"} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <LandingNav onLogin={() => setView("login")} onSignup={() => setView("signup")} />
      <HeroSection onLogin={() => setView("login")} onSignup={() => setView("signup")} />
      <FeaturesSection />
      <DsaSheetSection />
      <HowItWorksSection />
      <InstallSection />
      <CtaBanner onSignup={() => setView("signup")} />
      <LandingFooter />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════════════ */
function LandingNav({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(13,17,23,0.85)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: 60, display: "flex", alignItems: "center", gap: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Zap size={20} color="var(--accent)" fill="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>LeetSync</span>
        </div>

        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {["Features", "DSA Sheet", "How It Works", "Install"].map((label) => (
            <button
              key={label}
              onClick={() => scrollTo(label.toLowerCase().replace(/ /g, "-"))}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 500, padding: "0.4rem 0.75rem", borderRadius: 6, cursor: "pointer" }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            id="nav-login-btn"
            onClick={onLogin}
            style={{ background: "transparent", border: "1px solid var(--border-hover)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, padding: "0.45rem 1rem", borderRadius: 6, cursor: "pointer" }}
          >
            Sign In
          </button>
          <button
            id="nav-signup-btn"
            onClick={onSignup}
            style={{ background: "var(--accent)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, padding: "0.45rem 1rem", borderRadius: 6, cursor: "pointer" }}
          >
            Get Started Free
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   HERO
════════════════════════════════════════════════════════════ */
function HeroSection({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", position: "relative", overflow: "hidden",
      padding: "7rem 1.5rem 4rem", textAlign: "center",
    }}>
      {/* Subtle background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
      }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 740 }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12,
          fontWeight: 600, color: "var(--text-secondary)",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
          padding: "5px 14px", borderRadius: 99, marginBottom: "1.5rem", letterSpacing: "0.02em",
        }}>
          <span style={{ width: 6, height: 6, background: "var(--easy)", borderRadius: "50%", display: "inline-block" }} />
          Chrome Extension · Manifest V3 · Free
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>
          Auto-commit your{" "}
          <GradText>LeetCode Solutions</GradText>{" "}
          + full productivity suite ⚡
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 580, margin: "0 auto 2.5rem" }}>
          LeetSync auto-pushes your code to GitHub the moment you get accepted,
          schedules Anki-style revisions, tracks your time, and now includes a
          <strong style={{ color: "var(--text-primary)" }}> curated DSA Pattern Sheet</strong> — all in one Chrome extension.
        </p>

        <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
          <button
            id="hero-signup-btn"
            onClick={onSignup}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--accent)", color: "#000",
              fontWeight: 700, fontSize: 15, padding: "0.75rem 1.75rem",
              borderRadius: 8, border: "none", cursor: "pointer",
            }}
          >
            🚀 Create Free Account
          </button>
          <button
            id="hero-login-btn"
            onClick={onLogin}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "transparent", color: "var(--text-secondary)",
              fontWeight: 600, fontSize: 15, padding: "0.75rem 1.75rem",
              borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
            }}
          >
            Sign In →
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { num: "15+", label: "Features" },
            { num: "53+", label: "DSA Problems" },
            { num: "7",   label: "Revision Stages" },
            { num: "100%", label: "Free & Open" },
          ].map(({ num, label }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div style={{ width: 1, background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />}
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{num}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Code preview card */}
      <div style={{
        position: "absolute", right: "max(2rem, calc(50% - 560px))", top: "50%", transform: "translateY(-50%)",
        background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "1rem", width: 280, display: "none",
      }}>
        {/* hidden on small screens via inline style — shown only on wide viewports via the absolute positioning  */}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FEATURES
════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: "🔄", title: "Auto GitHub Commit",        desc: "Detects accepted submissions → fetches code → pushes to GitHub automatically. Zero effort." },
  { icon: "🧠", title: "Spaced Repetition",         desc: "Anki-style 7-stage revision: 1, 3, 7, 15, 30, 60, 120 day intervals. Mark remembered or forgot." },
  { icon: "📊", title: "Rich Analytics",            desc: "Difficulty charts, topic radar, calendar heatmap, streak counters — all in one dashboard." },
  { icon: "📔", title: "Coding Journal",            desc: "Every accepted problem logged with timestamp, difficulty, time, and personal notes." },
  { icon: "📅", title: "Calendar Heatmap",          desc: "GitHub-style contribution graph showing your daily consistency over the year." },
  { icon: "⏱️", title: "Productivity Time Tracker", desc: "Log every hour of your day as Productive, Neutral or Wasted. See where your time really goes." },
  { icon: "🎯", title: "Focus Timer",               desc: "Built-in Pomodoro-style focus sessions with live stats and session history." },
  { icon: "✅", title: "Task Manager",              desc: "Daily task list integrated with your time-tracking so nothing falls through the cracks." },
  { icon: "🤖", title: "AI Insights",               desc: "Get personalized coaching tips and pattern recommendations powered by Groq AI." },
  { icon: "📋", title: "DSA Pattern Sheet",         desc: "53+ curated problems across 10 DP patterns. Check off problems as you complete them." },
];

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "6rem 1.5rem", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader
          tag="✨ Features"
          title={<>Everything you need to <GradText>master LeetCode</GradText></>}
          desc="Auto-sync, revision scheduling, productivity tracking, and AI insights — all in one Chrome extension."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.875rem" }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{icon}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.4rem" }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   DSA PATTERN SHEET HIGHLIGHT
════════════════════════════════════════════════════════════ */
const DSA_PATTERNS = [
  { pattern: "DP : Fibonacci",       count: 4,  color: "#22c55e" },
  { pattern: "DP : Climbing Stairs", count: 5,  color: "#3b82f6" },
  { pattern: "DP : Kadane",          count: 5,  color: "#f59e0b" },
  { pattern: "DP : House Robber",    count: 5,  color: "#a855f7" },
  { pattern: "DP : Grid DP",         count: 6,  color: "#ef4444" },
  { pattern: "DP : Interval DP",     count: 6,  color: "#06b6d4" },
  { pattern: "DP : Matrix DP",       count: 5,  color: "#84cc16" },
  { pattern: "DP : Partition DP",    count: 6,  color: "#f97316" },
  { pattern: "DP : Prefix DP",       count: 5,  color: "#ec4899" },
  { pattern: "DP : Linear DP",       count: 6,  color: "#14b8a6" },
];

function DsaSheetSection() {
  return (
    <section id="dsa-sheet" style={{ padding: "6rem 1.5rem", background: "var(--bg-card)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          {/* Left: text */}
          <div>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--accent)", background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)", padding: "4px 12px", borderRadius: 99, marginBottom: "1rem",
            }}>📋 DSA Pattern Sheet</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
              Track your progress on <GradText>53 curated problems</GradText>
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Grouped by DSA pattern — Dynamic Programming, Sliding Window, Two Pointers, and more.
              Check off problems as you complete them. Progress is saved per user locally.
              Admins can add new patterns and problems at any time.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                "✅ Checkbox per problem — your progress, saved locally",
                "🔍 Search and filter by difficulty",
                "📊 Per-pattern progress bars",
                "🔐 Admin can add / edit / delete problems",
                "🆕 Newly added problems highlighted for admin",
              ].map((item) => (
                <div key={item} style={{ fontSize: 13.5, color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: pattern grid preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {DSA_PATTERNS.map(({ pattern, count, color }) => (
              <div
                key={pattern}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  background: "var(--bg-base)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "0.65rem 0.875rem",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{pattern}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {count} problems
                </span>
                <div style={{ width: 60, height: 4, background: "var(--bg-glass)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / 6) * 100}%`, background: color, borderRadius: 99, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   HOW IT WORKS
════════════════════════════════════════════════════════════ */
const HOW_STEPS = [
  { num: "01", title: "Solve on LeetCode",     desc: "LeetSync's content script monitors your tab for an accepted submission event." },
  { num: "02", title: "Code Fetched via API",  desc: "The service worker calls LeetCode GraphQL to get your code, difficulty, and topic tags." },
  { num: "03", title: "Pushed to GitHub",      desc: "Committed under LeetCode/[Topic]/[problem]/Solution.[lang] automatically." },
  { num: "04", title: "Revision Scheduled",   desc: "LeetSync schedules 7 smart revision reminders so you never forget a problem." },
  { num: "05", title: "Track Everything",      desc: "Your time, focus sessions, tasks, and analytics are all synced to your dashboard." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: "6rem 1.5rem", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader tag="🔍 How It Works" title={<>From solve to <GradText>GitHub commit</GradText> in seconds</>} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.875rem" }}>
          {HOW_STEPS.map(({ num, title, desc }) => (
            <div
              key={num}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)", opacity: 0.35, lineHeight: 1, marginBottom: "0.75rem" }}>{num}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.4rem" }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   INSTALL
════════════════════════════════════════════════════════════ */
const INSTALL_STEPS = [
  {
    num: 1,
    title: "Download Extension Files",
    desc: "Get the pre-built dist/ folder from Google Drive.",
    substeps: [
      <><a href="https://drive.google.com/drive/folders/1782kGZje5-djm6OoCpGxnYJ0Q4UklPac?usp=sharing" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>Open the Google Drive folder</a></>,
      <>Right-click → <strong style={{ color: "var(--text-primary)" }}>Download</strong> as ZIP</>,
      <>Extract to a permanent folder e.g. <code style={{ fontFamily: "monospace", fontSize: 12, background: "var(--bg-base)", padding: "1px 6px", borderRadius: 4, color: "var(--accent)" }}>Documents/LeetSync/</code></>,
    ],
  },
  {
    num: 2,
    title: "Load into Chrome",
    desc: "Enable Developer Mode and load the unpacked folder.",
    substeps: [
      <>Go to <code style={{ fontFamily: "monospace", fontSize: 12, background: "var(--bg-base)", padding: "1px 6px", borderRadius: 4, color: "var(--accent)" }}>chrome://extensions</code></>,
      <>Toggle <strong style={{ color: "var(--text-primary)" }}>Developer mode</strong> ON (top-right)</>,
      <>Click <strong style={{ color: "var(--text-primary)" }}>Load unpacked</strong> → select extracted folder</>,
      <>⚡ LeetSync icon appears in your Chrome toolbar</>,
    ],
  },
  {
    num: 3,
    title: "Connect GitHub",
    desc: "Generate a Personal Access Token and save it in Settings.",
    substeps: [
      <><a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>github.com/settings/tokens</a> → Generate classic token</>,
      <>Check the <strong style={{ color: "var(--text-primary)" }}>✅ repo</strong> scope → Generate &amp; copy</>,
      <>Click ⚡ LeetSync icon → <strong style={{ color: "var(--text-primary)" }}>Settings</strong> → paste token</>,
      <>Enter your GitHub username &amp; repo name → <strong style={{ color: "var(--text-primary)" }}>Save</strong> 🎉</>,
    ],
  },
];

function InstallSection() {
  return (
    <section id="install" style={{ padding: "6rem 1.5rem", background: "var(--bg-card)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <SectionHeader tag="🚀 Installation" title={<>Get started in <GradText>3 simple steps</GradText></>} desc="No Chrome Web Store required. Load it directly — takes under 2 minutes." />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {INSTALL_STEPS.map(({ num, title, desc, substeps }, idx) => (
            <div
              key={num}
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.5rem 1.75rem" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: "var(--accent)", color: "#000", fontWeight: 800, fontSize: "1rem",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{num}</div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {substeps.map((step, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 10, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {String.fromCharCode(97 + si)}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   CTA BANNER
════════════════════════════════════════════════════════════ */
function CtaBanner({ onSignup }: { onSignup: () => void }) {
  return (
    <section id="cta" style={{ padding: "5rem 1.5rem", background: "var(--bg-base)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
          Ready to build your <GradText>LeetCode portfolio</GradText>?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
          Create a free account. No credit card. Auto-commit, revision scheduling, productivity tracking, and DSA sheet — all free.
        </p>
        <button
          id="cta-signup-btn"
          onClick={onSignup}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--accent)", color: "#000", fontWeight: 700, fontSize: 15,
            padding: "0.8rem 2rem", borderRadius: 8, border: "none", cursor: "pointer",
          }}
        >
          🚀 Create Free Account
        </button>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════════════════════ */
function LandingFooter() {
  return (
    <footer style={{ padding: "2rem 1.5rem", background: "var(--bg-card)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "0.4rem" }}>
        <Zap size={16} color="var(--accent)" fill="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>LeetSync</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Auto-commit · Spaced Repetition · Time Tracking · DSA Pattern Sheet
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
        MIT License © 2026 · Built with ❤️ for the DSA community
      </p>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   SHARED HELPERS
════════════════════════════════════════════════════════════ */
function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 60%, #fde68a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

function SectionHeader({ tag, title, desc }: { tag: string; title: React.ReactNode; desc?: string }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <span style={{
        display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--accent)", background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)", padding: "4px 12px", borderRadius: 99, marginBottom: "0.875rem",
      }}>{tag}</span>
      <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: desc ? "0.65rem" : 0 }}>{title}</h2>
      {desc && <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 500, lineHeight: 1.6 }}>{desc}</p>}
    </div>
  );
}
