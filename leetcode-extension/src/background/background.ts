// ============================================================
// background.ts — Service Worker
// Orchestrates: problem timing, submission processing,
// GitHub sync, revision scheduling, and alarm notifications.
// ============================================================

import {
  saveProblem,
  saveSettings,
  getSettings,
  addToJournal,
  recordProblemStart,
  getProblemElapsed,
} from "../services/storage";
import { getToken } from "../services/storage-adapter";
import { fetchProblemMeta, fetchLatestAcceptedSubmission } from "../services/leetcode";
import { pushSolutionToGitHub } from "../services/github";
import { scheduleRevision, getDueRevisions } from "../services/revision";

// ─── Message handler from content script ────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "PROBLEM_OPENED":
          await recordProblemStart(message.slug);
          sendResponse({ ok: true });
          break;

        case "ACCEPTED_FETCH":
        case "ACCEPTED_DOM":
          await handleAccepted(message.payload ?? { slug: message.slug });
          sendResponse({ ok: true });
          break;

        case "GET_SETTINGS":
          sendResponse(await getSettings());
          break;

        case "SAVE_SETTINGS":
          await saveSettings(message.settings);
          sendResponse({ ok: true });
          break;
      }
    } catch (err) {
      console.error("[uCode] Background error:", err);
      sendResponse({ error: String(err) });
    }
  })();
  return true; // Keep message channel open for async response
});

// ─── Core: process an accepted submission ────────────────────
async function handleAccepted(payload: {
  slug?: string;
  lang?: string;
  runtime?: string;
  memory?: string;
  questionId?: number;
}): Promise<void> {
  const { slug } = payload;
  if (!slug) {
    console.warn("[uCode] handleAccepted called with no slug");
    return;
  }

  // Debounce: avoid processing same problem twice within 15 seconds
  const debounceKey = `ucode_last_accepted_${slug}`;
  const debounceData = await chrome.storage.local.get([debounceKey]);
  const last = debounceData[debounceKey] as number | undefined;
  if (last && Date.now() - last < 15_000) {
    console.log("[uCode] Debounced duplicate acceptance for:", slug);
    return;
  }
  await chrome.storage.local.set({ [debounceKey]: Date.now() });

  // Check auth — user must be logged in to save to Neon DB
  const token = await getToken();
  if (!token) {
    console.warn("[uCode] No auth token found. Please sign in via the uCode popup.");
    showNotification(
      "⚠️ Sign in to uCode to save your solutions to the cloud.",
      slug
    );
    return;
  }

  console.log("[uCode] Processing accepted submission for:", slug);

  try {
    // 1. Fetch problem metadata from LeetCode GraphQL
    showNotification("🔍 Fetching problem data…", slug);
    const meta = await fetchProblemMeta(slug);
    console.log("[uCode] Fetched meta:", meta.title, meta.difficulty);

    // 2. Fetch full submission code
    const submission = await fetchLatestAcceptedSubmission(slug);
    if (!submission) {
      showNotification("⚠️ Could not retrieve submission code from LeetCode.", slug);
      console.error("[uCode] No accepted submission returned for:", slug);
      return;
    }
    console.log("[uCode] Fetched submission:", submission.language, submission.runtime);

    // 3. Calculate time spent on the problem
    const timeSpentMs = await getProblemElapsed(slug);

    // 4. Save problem to Neon DB
    await saveProblem({
      id: meta.id,
      title: meta.title,
      slug: meta.slug,
      difficulty: meta.difficulty,
      tags: meta.tags,
      companies: meta.companies,
      url: meta.url,
      language: submission.language,
      code: submission.code,
      runtime: submission.runtime,
      memory: submission.memory,
      solvedAt: submission.timestamp,
      timeSpentMs,
      notes: "",
      pattern: "",
      mistake: "",
      observation: "",
    });
    console.log("[uCode] Problem saved to Neon DB:", meta.id);

    // 5. Add to today's journal in Neon DB
    const dateStr = new Date().toISOString().split("T")[0];
    await addToJournal(dateStr, meta.id, timeSpentMs);
    console.log("[uCode] Journal updated for date:", dateStr);

    // 6. Schedule spaced repetition revision in Neon DB
    await scheduleRevision(meta.id);
    console.log("[uCode] Revision scheduled for:", meta.id);

    // 7. Push to GitHub (non-blocking)
    const settings = await getSettings();
    if (!settings.githubToken || !settings.githubUsername) {
      showNotification(
        `✅ Solved ${meta.title}! Saved to cloud. Configure GitHub in Settings to auto-commit.`,
        slug
      );
      return;
    }

    pushSolutionToGitHub(meta, submission)
      .then((githubUrl) => {
        console.log("[uCode] Pushed to GitHub:", githubUrl);
        showNotification(
          `✅ Solved ${meta.title}! Committed to GitHub.`,
          slug,
          githubUrl
        );
      })
      .catch((err) => {
        console.error("[uCode] GitHub push failed:", err);
        showNotification(
          `✅ Saved to cloud! GitHub push failed: ${err.message}`,
          slug
        );
      });

  } catch (err) {
    console.error("[uCode] Error processing acceptance:", err);
    showNotification(
      `❌ uCode error: ${err instanceof Error ? err.message : String(err)}`,
      slug
    );
  }
}

// ─── Notifications ───────────────────────────────────────────
function showNotification(message: string, context: string, url?: string) {
  chrome.notifications.create(`ucode-${context}-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "uCode",
    message,
    buttons: url ? [{ title: "View on GitHub" }] : [],
  });
}

// ─── Chrome Alarms: Daily revision reminder ───────────────────
chrome.alarms.create("daily-revision-check", {
  periodInMinutes: 60 * 24,
  when: getNextMorning(),
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "daily-revision-check") {
    const token = await getToken();
    if (!token) return; // Not logged in, skip
    const due = await getDueRevisions();
    if (due.length > 0) {
      chrome.notifications.create("ucode-revision", {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: `📚 uCode — ${due.length} Revision${due.length > 1 ? "s" : ""} Due`,
        message:
          due
            .slice(0, 3)
            .map((r) => `• ${r.title}`)
            .join("\n") + (due.length > 3 ? `\n…and ${due.length - 3} more` : ""),
      });
    }
  }
});

function getNextMorning(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0); // 8 AM daily
  return d.getTime();
}
