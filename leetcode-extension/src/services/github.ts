// ============================================================
// github.ts — GitHub REST API service for pushing solutions
// ============================================================

import type { LeetCodeProblemMeta, SubmissionDetail } from "./leetcode";
import { tagToFolder, langToExtension } from "./leetcode";
import { getSettings } from "./storage";

interface GitHubFile {
  path: string;
  content: string;
  message: string;
}

async function githubRequest(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const res = await githubRequest(token, "GET", `/repos/${owner}/${repo}/contents/${path}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha ?? null;
}

async function upsertFile(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<void> {
  const sha = await getFileSha(token, owner, repo, filePath);
  const body: Record<string, unknown> = {
    message: commitMessage,
    content: btoa(unescape(encodeURIComponent(content))),
  };
  if (sha) body.sha = sha;

  const res = await githubRequest(
    token,
    "PUT",
    `/repos/${owner}/${repo}/contents/${filePath}`,
    body
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`GitHub API error: ${JSON.stringify(err)}`);
  }
}

// ─── Generate README for a problem ───────────────────────────
function generateReadme(
  meta: LeetCodeProblemMeta,
  submission: SubmissionDetail
): string {
  const diffBadge = {
    Easy: "![Easy](https://img.shields.io/badge/Difficulty-Easy-brightgreen)",
    Medium: "![Medium](https://img.shields.io/badge/Difficulty-Medium-yellow)",
    Hard: "![Hard](https://img.shields.io/badge/Difficulty-Hard-red)",
  }[meta.difficulty];

  const tagsStr = meta.tags.map((t) => `\`${t}\``).join(" · ");

  return `# ${meta.id}. ${meta.title}

${diffBadge}

**Problem:** [${meta.url}](${meta.url})

**Difficulty:** ${meta.difficulty}  
**Tags:** ${tagsStr}  
**Language:** ${submission.language}  
**Runtime:** ${submission.runtime}  
**Memory:** ${submission.memory}  

---

## Solution

\`\`\`${langToExtension(submission.language)}
${submission.code}
\`\`\`

---

*Auto-committed by [LeetSync](https://github.com/topics/leetsync) on ${new Date(submission.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}*
`;
}

// ─── Main push function ───────────────────────────────────────
export async function pushSolutionToGitHub(
  meta: LeetCodeProblemMeta,
  submission: SubmissionDetail
): Promise<string> {
  const settings = await getSettings();
  const { githubToken, githubUsername, githubRepo } = settings;

  if (!githubToken || !githubUsername) {
    throw new Error("GitHub credentials not configured. Open Settings to connect GitHub.");
  }

  const folder = tagToFolder(meta.tags);
  const ext = langToExtension(submission.language);
  const problemDir = `LeetCode/${folder}/${meta.id}-${meta.slug}`;
  const solutionPath = `${problemDir}/Solution.${ext}`;
  const readmePath = `${problemDir}/README.md`;
  const commitMsg = `Solved ${parseInt(meta.id)}. ${meta.title}`;

  // Push solution file
  await upsertFile(
    githubToken,
    githubUsername,
    githubRepo,
    solutionPath,
    submission.code,
    commitMsg
  );

  // Push README
  await upsertFile(
    githubToken,
    githubUsername,
    githubRepo,
    readmePath,
    generateReadme(meta, submission),
    `docs: Add README for ${meta.title}`
  );

  // Update root README stats
  await updateRootReadme(githubToken, githubUsername, githubRepo);

  return `https://github.com/${githubUsername}/${githubRepo}/tree/main/${problemDir}`;
}

// ─── Update root README.md with stats ─────────────────────────
async function updateRootReadme(
  token: string,
  owner: string,
  repo: string
): Promise<void> {
  // We'll generate a minimal stats block; full stats come from storage
  const statsContent = `# 🚀 LeetCode Solutions

Auto-synced by **LeetSync** Chrome Extension.

> *Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}*
`;

  try {
    await upsertFile(
      token,
      owner,
      repo,
      "README.md",
      statsContent,
      "chore: Update root README"
    );
  } catch {
    // Non-fatal — don't block the main push
  }
}

// ─── OAuth: Get GitHub token via chrome.identity ──────────────
export async function authenticateWithGitHub(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = "YOUR_GITHUB_OAUTH_APP_CLIENT_ID";
    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
      `&scope=repo,user:email`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          reject(new Error("GitHub OAuth failed"));
          return;
        }
        const url = new URL(responseUrl);
        const code = url.searchParams.get("code");
        if (!code) {
          reject(new Error("No OAuth code received"));
          return;
        }
        // Exchange code for token via your backend or a proxy
        // For MVP, user pastes their Personal Access Token in Settings
        resolve(code);
      }
    );
  });
}
