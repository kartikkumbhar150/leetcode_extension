// ============================================================
// content.ts — Content Script injected on leetcode.com/*
// Detects accepted submissions and relays them to background
// ============================================================

import { recordProblemStart } from "../services/storage";

// Extract the problem slug from the URL: /problems/<slug>/
function getProblemSlug(): string | null {
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

// ─── Track when user lands on a problem ──────────────────────
const slug = getProblemSlug();
if (slug) {
  // Notify background to start timing
  chrome.runtime.sendMessage({ type: "PROBLEM_OPENED", slug });
}

// ─── Detect "Accepted" verdict ───────────────────────────────
// Strategy 1: Intercept LeetCode's XHR/fetch for submission check
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
  // LeetCode polls submission status at this endpoint
  if (url.includes("/submissions/detail/") && url.includes("/check/")) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data.status_msg === "Accepted") {
        handleAcceptedSubmission(data);
      }
    } catch {}
  }

  return response;
};

// Strategy 2: Also observe DOM for the Accepted result panel (fallback)
let lastVerdict = "";
const observer = new MutationObserver(() => {
  // LeetCode v2 uses a result panel with specific text content
  const verdictEl =
    document.querySelector('[data-e2e-locator="submission-result"]') ||
    document.querySelector(".text-green-s") ||
    document.querySelector("[class*='accepted']");

  if (verdictEl) {
    const text = verdictEl.textContent?.trim() ?? "";
    if (text === "Accepted" && lastVerdict !== "Accepted") {
      lastVerdict = "Accepted";
      const slugFromPage = getProblemSlug();
      if (slugFromPage) {
        chrome.runtime.sendMessage({
          type: "ACCEPTED_DOM",
          slug: slugFromPage,
        });
      }
    } else if (text !== "Accepted") {
      lastVerdict = text;
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});

// ─── Handle accepted data from fetch intercept ───────────────
function handleAcceptedSubmission(data: {
  question_id: number;
  lang: string;
  runtime: string;
  memory: string;
  submission_id?: number;
  status_msg: string;
}) {
  const slugFromPage = getProblemSlug();
  chrome.runtime.sendMessage({
    type: "ACCEPTED_FETCH",
    payload: {
      slug: slugFromPage,
      lang: data.lang,
      runtime: data.runtime,
      memory: data.memory,
      questionId: data.question_id,
    },
  });
}
