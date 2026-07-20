import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Zap, GitCommit, BarChart2, Brain, BookOpen, Clock, CheckSquare, Cpu, FileText, Layout } from "lucide-react";
import AuthPage from "./AuthPage";
import type { StoredUser } from "../services/storage-adapter";

interface LandingPageProps {
  onSuccess: (user: StoredUser) => void;
}

type View = "landing" | "login" | "signup";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Animated counter hook ─────────────────────────────────── */
function useCounter(end: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return { count, ref };
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
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text-secondary)", borderRadius: 8, padding: "0.4rem 0.9rem",
            fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6, backdropFilter: "blur(12px)",
          }}
        >
          ← Back
        </button>
        <AuthPage key={view} onSuccess={onSuccess} initialMode={view === "signup" ? "signup" : "login"} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080d14", color: "#e6edf3", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <LandingNav onLogin={() => setView("login")} onSignup={() => setView("signup")} />
      <HeroSection onLogin={() => setView("login")} onSignup={() => setView("signup")} />
      <StatsBar />
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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(8,13,20,0.9)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem", height: 64, display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Zap size={22} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", background: "linear-gradient(135deg,#f59e0b,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LeetSync</span>
        </div>

        {/* Desktop links */}
        <div className="landing-nav-links" style={{ display: "flex", gap: 2, flex: 1 }}>
          {["Features", "DSA Sheet", "How It Works", "Install"].map((label) => (
            <button key={label} onClick={() => scrollTo(label.toLowerCase().replace(/ /g, "-"))}
              style={{ background: "none", border: "none", color: "rgba(230,237,243,0.65)", fontSize: 13.5, fontWeight: 500, padding: "0.4rem 0.7rem", borderRadius: 6, cursor: "pointer", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e6edf3")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(230,237,243,0.65)")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="landing-nav-auth" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onLogin} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(230,237,243,0.8)", fontWeight: 600, fontSize: 13, padding: "0.45rem 1rem", borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(230,237,243,0.8)"; }}
          >Sign In</button>
          <button onClick={onSignup} style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, padding: "0.45rem 1rem", borderRadius: 7, cursor: "pointer", boxShadow: "0 0 20px rgba(245,158,11,0.35)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 32px rgba(245,158,11,0.6)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(245,158,11,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >Get Started Free</button>
        </div>

        {/* Mobile hamburger */}
        <button className="landing-hamburger" onClick={() => setMenuOpen(v => !v)}
          style={{ display: "none", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#e6edf3", padding: "0.4rem 0.6rem", borderRadius: 7, cursor: "pointer", fontSize: 18, flexShrink: 0 }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: "rgba(8,13,20,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", padding: "0 1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.75rem 0" }}>
              {["Features", "DSA Sheet", "How It Works", "Install"].map((label) => (
                <button key={label} onClick={() => { scrollTo(label.toLowerCase().replace(/ /g, "-")); setMenuOpen(false); }}
                  style={{ background: "none", border: "none", color: "rgba(230,237,243,0.7)", fontSize: 14, fontWeight: 500, padding: "0.65rem 0", textAlign: "left", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {label}
                </button>
              ))}
              <div style={{ display: "flex", gap: 8, paddingTop: "0.75rem" }}>
                <button onClick={() => { onLogin(); setMenuOpen(false); }} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#e6edf3", fontWeight: 600, fontSize: 13, padding: "0.6rem", borderRadius: 7, cursor: "pointer" }}>Sign In</button>
                <button onClick={() => { onSignup(); setMenuOpen(false); }} style={{ flex: 1, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, padding: "0.6rem", borderRadius: 7, cursor: "pointer" }}>Get Started</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   HERO
════════════════════════════════════════════════════════════ */
function HeroSection({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const fn = (e: MouseEvent) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "7rem 1.5rem 4rem", textAlign: "center" }}>
      {/* Animated background orbs that follow mouse */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", transition: "transform 0.8s ease", }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", top: `${mousePos.y * 80}%`, left: `${mousePos.x * 80}%`, transform: "translate(-50%, -50%)", transition: "top 1.2s ease, left 1.2s ease", }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", top: `${100 - mousePos.y * 60}%`, left: `${100 - mousePos.x * 60}%`, transform: "translate(-50%, -50%)", transition: "top 1.5s ease, left 1.5s ease", }} />
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 0%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 0%, transparent 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, width: "100%" }}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "rgba(230,237,243,0.65)", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", padding: "5px 14px", borderRadius: 99, marginBottom: "1.5rem", letterSpacing: "0.03em" }}>
          <span style={{ width: 7, height: 7, background: "#22c55e", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
          Chrome Extension · Manifest V3 · 100% Free
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          style={{ fontSize: "clamp(2.2rem, 6vw, 4.2rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>
          Auto-commit your{" "}
          <span style={{ background: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 50%,#fde68a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            LeetCode Solutions
          </span>
          <br />+ full productivity suite ⚡
        </motion.h1>

        {/* Description */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ color: "rgba(139,148,158,1)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2.5rem", maxWidth: 600, margin: "0 auto 2.5rem" }}>
          LeetSync auto-pushes your code to GitHub the moment you're accepted,
          schedules Anki-style revisions, tracks your time, and includes a curated
          <strong style={{ color: "#e6edf3" }}> DSA Pattern Sheet</strong> — all free.
        </motion.p>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "4rem" }}>
          <button onClick={onSignup} id="hero-signup-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#000", fontWeight: 800, fontSize: 16, padding: "0.85rem 2rem", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: "0 0 32px rgba(245,158,11,0.45), 0 4px 20px rgba(0,0,0,0.4)", transition: "all 0.2s", letterSpacing: "-0.01em" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(245,158,11,0.65), 0 8px 32px rgba(0,0,0,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(245,158,11,0.45), 0 4px 20px rgba(0,0,0,0.4)"; }}
          >
            🚀 Create Free Account
          </button>
          <button onClick={onLogin} id="hero-login-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", color: "rgba(230,237,243,0.8)", fontWeight: 600, fontSize: 16, padding: "0.85rem 1.75rem", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#e6edf3"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(230,237,243,0.8)"; }}
          >
            Sign In →
          </button>
        </motion.div>

        {/* Floating 3D code card */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ perspective: 1000, maxWidth: 560, margin: "0 auto" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(135deg, rgba(22,27,34,0.9) 0%, rgba(13,17,23,0.95) 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 16,
              padding: "1.25rem",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(16px)",
              textAlign: "left",
            }}
          >
            {/* Terminal header */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
              <span style={{ fontSize: 11, color: "rgba(139,148,158,0.7)", marginLeft: 8, fontFamily: "monospace" }}>✅ Accepted — Two Sum (#1)</span>
            </div>
            {/* Code */}
            <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.8, color: "#cbd5e1", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "0.875rem", overflow: "hidden", margin: 0, border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#c084fc" }}>def</span>{" "}
              <span style={{ color: "#60a5fa" }}>twoSum</span>
              <span style={{ color: "#e2e8f0" }}>(nums, target):</span>{"\n"}
              {"    "}<span style={{ color: "#e2e8f0" }}>seen = </span><span style={{ color: "#fbbf24" }}>{"{}"}</span>{"\n"}
              {"    "}<span style={{ color: "#c084fc" }}>for</span>{" "}i, n{" "}<span style={{ color: "#c084fc" }}>in</span>{" "}
              <span style={{ color: "#60a5fa" }}>enumerate</span>(nums):{"\n"}
              {"        "}diff = target - n{"\n"}
              {"        "}<span style={{ color: "#c084fc" }}>if</span>{" "}diff{" "}<span style={{ color: "#c084fc" }}>in</span>{" "}seen:{"\n"}
              {"            "}<span style={{ color: "#c084fc" }}>return</span>{" "}[seen[diff], i]{"\n"}
              {"        "}seen[n] = i
            </pre>
            {/* Status tags */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: 11, fontWeight: 700, background: "rgba(34,197,94,0.12)", color: "#22c55e", padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Pushed to GitHub
              </motion.span>
              <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.2)" }}>📅 Revision: Day 1 of 7</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,0.1)", color: "#a78bfa", padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.2)" }}>🧠 Array · Hash Map</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   STATS BAR
════════════════════════════════════════════════════════════ */
function StatItem({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(end);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f59e0b,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 12, color: "rgba(139,148,158,0.8)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StatsBar() {
  return (
    <div style={{ background: "rgba(22,27,34,0.6)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem" }} className="stats-grid">
        <StatItem end={15} suffix="+" label="Features" />
        <StatItem end={53} suffix="+" label="DSA Problems" />
        <StatItem end={7} suffix="" label="Revision Stages" />
        <StatItem end={100} suffix="%" label="Free & Open" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   FEATURES
════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: GitCommit,    color: "#8b949e", title: "Auto GitHub Commit",        desc: "Detects accepted submissions → fetches code via GraphQL → commits to GitHub instantly. Zero effort." },
  { icon: Brain,        color: "#a78bfa", title: "Spaced Repetition",         desc: "7-stage Anki-style intervals: 1, 3, 7, 15, 30, 60, 120 days. Mark remembered or forgot." },
  { icon: BarChart2,    color: "#60a5fa", title: "Rich Analytics",            desc: "Difficulty charts, topic radar, heatmap, streak counters — all in one dashboard." },
  { icon: BookOpen,     color: "#34d399", title: "Coding Journal",            desc: "Every accepted problem logged with timestamp, difficulty, time, and personal notes." },
  { icon: Clock,        color: "#fb923c", title: "Productivity Time Tracker", desc: "Log every hour as Productive, Neutral, or Wasted. See exactly where your time goes." },
  { icon: Cpu,          color: "#f472b6", title: "Focus Timer",               desc: "Built-in Pomodoro-style focus sessions with live stats and session history." },
  { icon: CheckSquare,  color: "#4ade80", title: "Task Manager",              desc: "Daily task list tightly integrated with your time-tracking and focus sessions." },
  { icon: Layout,       color: "#f59e0b", title: "DSA Pattern Sheet",         desc: "53+ curated problems across 10 patterns. Check off your progress. Admin-managed." },
  { icon: FileText,     color: "#38bdf8", title: "AI Insights",               desc: "Groq-powered coaching tips, pattern recognition, and weakness identification." },
];

function FeatureCard({ icon: Icon, color, title, desc, index }: { icon: any; color: string; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(28,35,51,0.9)" : "rgba(22,27,34,0.7)",
        border: `1px solid ${hovered ? color + "40" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        padding: "1.5rem",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${color}15` : "none",
        cursor: "default",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.875rem" }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.45rem", color: "#e6edf3" }}>{title}</div>
      <div style={{ fontSize: 13, color: "rgba(139,148,158,0.9)", lineHeight: 1.65 }}>{desc}</div>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader tag="✨ Features" title={<>Everything you need to <GradText>master LeetCode</GradText></>} desc="Auto-sync, revision scheduling, productivity tracking, and AI insights — all in one Chrome extension." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   DSA SHEET SECTION
════════════════════════════════════════════════════════════ */
const DSA_PATTERNS = [
  { pattern: "DP : Fibonacci",       count: 4, max: 6, color: "#22c55e" },
  { pattern: "DP : Climbing Stairs", count: 5, max: 6, color: "#3b82f6" },
  { pattern: "DP : Kadane",          count: 5, max: 6, color: "#f59e0b" },
  { pattern: "DP : House Robber",    count: 5, max: 6, color: "#a855f7" },
  { pattern: "DP : Grid DP",         count: 6, max: 6, color: "#ef4444" },
  { pattern: "DP : Interval DP",     count: 6, max: 6, color: "#06b6d4" },
  { pattern: "DP : Partition DP",    count: 6, max: 6, color: "#f97316" },
];

function DsaSheetSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="dsa-sheet" style={{ padding: "6rem 1.5rem", background: "rgba(13,17,23,0.6)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="dsa-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", padding: "4px 12px", borderRadius: 99, marginBottom: "1rem" }}>
              📋 NEW — DSA Pattern Sheet
            </span>
            <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: "1rem", color: "#e6edf3" }}>
              Track <GradText>53 curated problems</GradText> grouped by pattern
            </h2>
            <p style={{ color: "rgba(139,148,158,0.9)", lineHeight: 1.75, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Dynamic Programming, Two Pointers, Sliding Window, and more.
              Check off problems as you complete them — progress saved locally per user.
              Only admin can add or edit problems.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                { icon: "✅", text: "Checkbox per problem — your progress saved locally" },
                { icon: "🔍", text: "Search and filter by difficulty" },
                { icon: "📊", text: "Per-pattern and overall progress bars" },
                { icon: "🔐", text: "Admin-only add / edit / delete" },
                { icon: "🆕", text: "\"Newly Created\" section for admins" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "rgba(230,237,243,0.75)" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — animated pattern list */}
          <motion.div ref={ref} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {DSA_PATTERNS.map(({ pattern, count, max, color }, i) => (
              <motion.div key={pattern} initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{ display: "flex", alignItems: "center", gap: "0.875rem", background: "rgba(22,27,34,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.75rem 1rem", backdropFilter: "blur(8px)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}80` }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#e6edf3" }}>{pattern}</span>
                <span style={{ fontSize: 12, color: "rgba(139,148,158,0.7)", fontFamily: "monospace", minWidth: 60 }}>{count} probs</span>
                <div style={{ width: 70, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={inView ? { width: `${(count / max) * 100}%` } : {}} transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                    style={{ height: "100%", background: color, borderRadius: 99 }} />
                </div>
              </motion.div>
            ))}
            <div style={{ padding: "0.875rem 1rem", background: "rgba(245,158,11,0.06)", border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 8, fontSize: 12, color: "rgba(245,158,11,0.8)", textAlign: "center" }}>
              + 3 more patterns including Linear DP, Matrix DP, Prefix DP
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   HOW IT WORKS
════════════════════════════════════════════════════════════ */
const HOW_STEPS = [
  { num: "01", icon: "🎯", title: "Solve on LeetCode",    desc: "Content script monitors your tab for an accepted submission event in real time." },
  { num: "02", icon: "⚡", title: "Code Fetched via API", desc: "Service worker calls LeetCode GraphQL to get your code, difficulty, and topic tags." },
  { num: "03", icon: "🐙", title: "Pushed to GitHub",     desc: "Committed under LeetCode/[Topic]/[problem]/Solution.[lang] automatically." },
  { num: "04", icon: "🧠", title: "Revision Scheduled",  desc: "LeetSync schedules 7 smart revision reminders so you never forget a problem." },
  { num: "05", icon: "📊", title: "Track Everything",     desc: "Your time, focus sessions, tasks, and full analytics are synced to your dashboard." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader tag="🔍 How It Works" title={<>From solve to <GradText>GitHub commit</GradText> in seconds</>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem", position: "relative" }}>
          {HOW_STEPS.map(({ num, icon, title, desc }, i) => (
            <motion.div key={num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ background: "rgba(22,27,34,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.5rem", backdropFilter: "blur(8px)", position: "relative" }}>
              <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>{icon}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b", opacity: 0.3, lineHeight: 1, position: "absolute", top: "1rem", right: "1rem" }}>{num}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.45rem", color: "#e6edf3" }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(139,148,158,0.9)", lineHeight: 1.65 }}>{desc}</div>
            </motion.div>
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
    num: 1, emoji: "📁", title: "Download Extension Files", desc: "Get the pre-built dist/ folder from Google Drive.",
    substeps: [
      <><a href="https://drive.google.com/drive/folders/1782kGZje5-djm6OoCpGxnYJ0Q4UklPac?usp=sharing" target="_blank" rel="noopener noreferrer" style={{ color: "#f59e0b", textDecoration: "none" }}>Open the Google Drive folder</a></>,
      <>Right-click → <strong style={{ color: "#e6edf3" }}>Download</strong> as ZIP</>,
      <>Extract to a permanent folder e.g. <code style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(0,0,0,0.4)", padding: "2px 7px", borderRadius: 4, color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Documents/LeetSync/</code></>,
    ],
  },
  {
    num: 2, emoji: "🔧", title: "Load into Chrome", desc: "Enable Developer Mode and load the unpacked folder.",
    substeps: [
      <>Go to <code style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(0,0,0,0.4)", padding: "2px 7px", borderRadius: 4, color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>chrome://extensions</code></>,
      <>Toggle <strong style={{ color: "#e6edf3" }}>Developer mode</strong> ON (top-right)</>,
      <>Click <strong style={{ color: "#e6edf3" }}>Load unpacked</strong> → select extracted folder</>,
      <>⚡ LeetSync icon appears in your Chrome toolbar!</>,
    ],
  },
  {
    num: 3, emoji: "🔑", title: "Connect GitHub", desc: "Generate a Personal Access Token and save it in Settings.",
    substeps: [
      <><a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: "#f59e0b", textDecoration: "none" }}>github.com/settings/tokens</a> → Generate classic token</>,
      <>Check the <strong style={{ color: "#e6edf3" }}>✅ repo</strong> scope → Generate &amp; copy</>,
      <>Click ⚡ LeetSync icon → <strong style={{ color: "#e6edf3" }}>Settings</strong> → paste token</>,
      <>Enter your GitHub username &amp; repo name → <strong style={{ color: "#e6edf3" }}>Save</strong> 🎉</>,
    ],
  },
];

function InstallSection() {
  return (
    <section id="install" style={{ padding: "6rem 1.5rem", background: "rgba(13,17,23,0.7)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <SectionHeader tag="🚀 Installation" title={<>Get started in <GradText>3 simple steps</GradText></>} desc="No Chrome Web Store required. Load it directly — takes under 2 minutes." />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {INSTALL_STEPS.map(({ num, emoji, title, desc, substeps }, idx) => (
            <motion.div key={num} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: idx * 0.12 }}
              style={{ background: "rgba(22,27,34,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.5rem 1.75rem", backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#000", fontWeight: 800, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}>
                  {emoji}
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 3, color: "#e6edf3" }}>{title}</div>
                  <div style={{ fontSize: 13, color: "rgba(139,148,158,0.8)" }}>{desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {substeps.map((step, si) => (
                  <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", fontSize: 13.5, color: "rgba(230,237,243,0.7)", lineHeight: 1.6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", fontSize: 10, fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {String.fromCharCode(97 + si)}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
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
    <section id="cta" style={{ padding: "6rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(245,158,11,0.1), transparent 70%)", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: "relative", maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "0.875rem", color: "#e6edf3" }}>
          Ready to build your <GradText>LeetCode portfolio</GradText>?
        </h2>
        <p style={{ color: "rgba(139,148,158,0.9)", marginBottom: "2.5rem", fontSize: "1rem", lineHeight: 1.7 }}>
          Create a free account. No credit card. Auto-commit, revision scheduling,
          productivity tracking, and DSA sheet — all free.
        </p>
        <button id="cta-signup-btn" onClick={onSignup}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#000", fontWeight: 800, fontSize: 17, padding: "0.9rem 2.5rem", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 0 40px rgba(245,158,11,0.45)", transition: "all 0.2s", letterSpacing: "-0.01em" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(245,158,11,0.65)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(245,158,11,0.45)"; }}
        >
          🚀 Create Free Account
        </button>
      </motion.div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════════════════════ */
function LandingFooter() {
  return (
    <footer style={{ padding: "2rem 1.5rem", background: "rgba(13,17,23,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "0.5rem" }}>
        <Zap size={18} color="#f59e0b" fill="#f59e0b" />
        <span style={{ fontWeight: 800, fontSize: "1rem", background: "linear-gradient(135deg,#f59e0b,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LeetSync</span>
      </div>
      <p style={{ fontSize: 13, color: "rgba(72,79,88,1)" }}>Auto-commit · Spaced Repetition · Time Tracking · DSA Pattern Sheet</p>
      <p style={{ fontSize: 12, color: "rgba(72,79,88,0.8)", marginTop: 4 }}>MIT License © 2026 · Built with ❤️ for the DSA community</p>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   SHARED HELPERS
════════════════════════════════════════════════════════════ */
function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 60%,#fde68a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

function SectionHeader({ tag, title, desc }: { tag: string; title: React.ReactNode; desc?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}
      style={{ marginBottom: "3rem", textAlign: "center" }}>
      <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", padding: "4px 14px", borderRadius: 99, marginBottom: "1rem" }}>{tag}</span>
      <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: desc ? "0.75rem" : 0, color: "#e6edf3" }}>{title}</h2>
      {desc && <p style={{ color: "rgba(139,148,158,0.9)", fontSize: "0.95rem", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>{desc}</p>}
    </motion.div>
  );
}
