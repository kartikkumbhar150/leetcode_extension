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
      console.error("[LeetSync] Background error:", err);
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
  if (!slug) return;

  // Debounce: avoid processing same problem twice within 10 seconds
  const key = `leetsync_last_accepted_${slug}`;
  const last = (await chrome.storage.local.get([key]))[key] as number | undefined;
  if (last && Date.now() - last < 10_000) return;
  await chrome.storage.local.set({ [key]: Date.now() });

  try {
    // 1. Fetch metadata from LeetCode GraphQL
    showNotification("🔍 Fetching problem data…", slug);
    const meta = await fetchProblemMeta(slug);

    // 2. Fetch full submission code
    const submission = await fetchLatestAcceptedSubmission(slug);
    if (!submission) {
      showNotification("⚠️ Could not retrieve submission code.", slug);
      return;
    }

    // 3. Calculate time spent on the problem
    const timeSpentMs = await getProblemElapsed(slug);

    // 4. Save problem to local storage
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

    // 5. Add to today's journal
    const dateStr = new Date().toISOString().split("T")[0];
    await addToJournal(dateStr, meta.id, timeSpentMs);

    // 6. Schedule revision (spaced repetition)
    await scheduleRevision(meta.id);

    // 7. Push to GitHub (non-blocking, shows notification on result)
    pushSolutionToGitHub(meta, submission)
      .then((githubUrl) => {
        showNotification(
          `✅ Solved ${meta.title}! Committed to GitHub.`,
          slug,
          githubUrl
        );
      })
      .catch((err) => {
        showNotification(
          `✅ Saved locally! GitHub sync failed: ${err.message}`,
          slug
        );
      });

  } catch (err) {
    console.error("[LeetSync] Error processing acceptance:", err);
    showNotification("❌ LeetSync: Failed to process submission.", slug);
  }
}

// ─── Notifications ───────────────────────────────────────────
function showNotification(message: string, context: string, url?: string) {
  chrome.notifications.create(`leetsync-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "LeetSync",
    message,
    buttons: url ? [{ title: "View on GitHub" }] : [],
  });
}

// ─── Chrome Alarms: Daily revision reminder ───────────────────
chrome.alarms.create("daily-revision-check", {
  periodInMinutes: 60 * 24, // Once per day
  when: getNextMidnight(),
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "daily-revision-check") {
    const due = await getDueRevisions();
    if (due.length > 0) {
      chrome.notifications.create("leetsync-revision", {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: `📚 LeetSync — ${due.length} Revision${due.length > 1 ? "s" : ""} Due`,
        message: due
          .slice(0, 3)
          .map((r) => `• ${r.title}`)
          .join("\n") + (due.length > 3 ? `\n…and ${due.length - 3} more` : ""),
      });
    }
  }
});

function getNextMidnight(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0); // 8 AM daily
  return d.getTime();
}
