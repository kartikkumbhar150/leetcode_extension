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
  chrome.runtime.sendMessage({ type: "PROBLEM_OPENED", slug });
}

// ─── Debounce: avoid firing twice for the same acceptance ────
let lastFiredSlug = "";
let lastFiredTime = 0;

function fireAccepted(slug: string, data?: Record<string, unknown>) {
  const now = Date.now();
  if (slug === lastFiredSlug && now - lastFiredTime < 15_000) return;
  lastFiredSlug = slug;
  lastFiredTime = now;

  chrome.runtime.sendMessage({
    type: "ACCEPTED_FETCH",
    payload: {
      slug,
      lang: data?.lang,
      runtime: data?.runtime,
      memory: data?.memory,
      questionId: data?.question_id,
    },
  });
}

// ─── Strategy 1: Intercept XHR/fetch submission check ────────
// LeetCode uses two known patterns for polling:
//   - /submissions/detail/<id>/check/   (legacy)
//   - /check/    in body (GraphQL v2)
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);
  const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;

  const isCheckEndpoint =
    (url.includes("/submissions/detail/") && url.includes("/check/")) ||
    url.includes("checkSubmission");

  if (isCheckEndpoint) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      // Both old ("Accepted") and new ("accepted") status formats
      const status: string = data.status_msg ?? data.state ?? "";
      if (status.toLowerCase() === "accepted") {
        const currentSlug = getProblemSlug();
        if (currentSlug) fireAccepted(currentSlug, data);
      }
    } catch { /* non-JSON response, ignore */ }
  }

  return response;
};

// ─── Strategy 2: DOM observer (fallback / GraphQL v2) ────────
// LeetCode v2 / v3 result panel selectors (multiple fallbacks)
const ACCEPTED_SELECTORS = [
  '[data-e2e-locator="submission-result"]',
  ".text-green-s",
  "[class*='accepted']",
  "[class*='Accepted']",
  "[class*='success']",
];

let domObserverLastText = "";

const observer = new MutationObserver(() => {
  for (const selector of ACCEPTED_SELECTORS) {
    const el = document.querySelector(selector);
    if (!el) continue;
    const text = el.textContent?.trim() ?? "";
    if (
      (text === "Accepted" || text === "accepted") &&
      text !== domObserverLastText
    ) {
      domObserverLastText = text;
      const currentSlug = getProblemSlug();
      if (currentSlug) fireAccepted(currentSlug);
      break;
    }
    if (text !== "Accepted") domObserverLastText = text;
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});
