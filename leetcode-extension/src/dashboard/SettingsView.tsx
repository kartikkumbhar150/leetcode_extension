import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AppSettings } from "../services/storage";
import { getSettings, saveSettings } from "../services/storage";
import { GitBranch, Key, Save, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>({
    githubToken: "",
    githubUsername: "",
    githubRepo: "leetcode-solutions",
    openaiKey: "",
    groqKey: "",
    aiProvider: "none",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 600 }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
          Configure GitHub sync and AI integration
        </p>
      </div>

      {/* GitHub Section */}
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "1rem",
          }}
        >
          <GitBranch size={18} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>GitHub Configuration</span>
        </div>

        <div
          style={{
            background: "var(--bg-glass)",
            borderRadius: "var(--radius-sm)",
            padding: "0.75rem",
            marginBottom: "1rem",
            fontSize: 12,
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>How to get a token: </span>
          Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic). 
          Check the <code>repo</code> scope.{" "}
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >
            Open GitHub ↗
          </a>
        </div>

        <Field
          label="Personal Access Token"
          type="password"
          value={settings.githubToken}
          onChange={(v) => setSettings({ ...settings, githubToken: v })}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          icon={<Key size={13} />}
        />
        <Field
          label="GitHub Username"
          value={settings.githubUsername}
          onChange={(v) => setSettings({ ...settings, githubUsername: v })}
          placeholder="your-username"
          icon={<GitBranch size={13} />}
        />
        <Field
          label="Repository Name"
          value={settings.githubRepo}
          onChange={(v) => setSettings({ ...settings, githubRepo: v })}
          placeholder="leetcode-solutions"
          icon={<ExternalLink size={13} />}
        />

        {settings.githubUsername && settings.githubRepo && (
          <div style={{ marginTop: "0.5rem" }}>
            <a
              href={`https://github.com/${settings.githubUsername}/${settings.githubRepo}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                color: "var(--accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ExternalLink size={12} />
              github.com/{settings.githubUsername}/{settings.githubRepo}
            </a>
          </div>
        )}
      </div>

      {/* AI Section */}
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "1rem",
          }}
        >
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>AI Revision Assistant</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              background: "var(--accent-glow)",
              color: "var(--accent)",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            Optional
          </span>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: 6,
            }}
          >
            AI Provider
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {(["none", "groq", "openai"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSettings({ ...settings, aiProvider: p })}
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background:
                    settings.aiProvider === p
                      ? "var(--accent-glow)"
                      : "var(--bg-glass)",
                  border: `1px solid ${settings.aiProvider === p ? "rgba(245,158,11,.3)" : "var(--border)"}`,
                  color:
                    settings.aiProvider === p
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                }}
              >
                {p === "none" ? "Disabled" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {settings.aiProvider === "groq" && (
          <Field
            label="Groq API Key"
            type="password"
            value={settings.groqKey}
            onChange={(v) => setSettings({ ...settings, groqKey: v })}
            placeholder="gsk_xxxxxxxxxxxxxxxxxx"
          />
        )}
        {settings.aiProvider === "openai" && (
          <Field
            label="OpenAI API Key"
            type="password"
            value={settings.openaiKey}
            onChange={(v) => setSettings({ ...settings, openaiKey: v })}
            placeholder="sk-xxxxxxxxxxxxxxxxxx"
          />
        )}
      </div>

      {/* Save button */}
      <button onClick={handleSave} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {saved ? (
          <>
            <CheckCircle size={14} /> Saved!
          </>
        ) : (
          <>
            <Save size={14} /> Save Settings
          </>
        )}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          display: "block",
          marginBottom: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          >
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            background: "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: `0.45rem 0.75rem 0.45rem ${icon ? "2rem" : "0.75rem"}`,
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
            fontFamily: "var(--font-mono, monospace)",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "var(--accent)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--border)")
          }
        />
      </div>
    </div>
  );
}
