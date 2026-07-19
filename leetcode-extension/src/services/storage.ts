// ============================================================
// storage.ts — Chrome Storage wrapper
// All data is stored in chrome.storage.local (extension) or
// localStorage (web/Vercel build) via the storage adapter.
// ============================================================
import { adapterGet, adapterSet } from "./storage-adapter";

export interface ProblemRecord {
  id: string;             // e.g. "0001"
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  companies: string[];
  url: string;
  language: string;
  code: string;
  runtime: string;
  memory: string;
  solvedAt: number;       // Unix timestamp
  timeSpentMs?: number;   // Time on page in ms
  notes: string;
  pattern: string;
  mistake: string;
  observation: string;
}

export interface RevisionEntry {
  problemId: string;
  scheduledDates: number[]; // Array of Unix timestamps
  nextRevisionIndex: number;
  history: RevisionResult[];
}

export interface RevisionResult {
  date: number;
  remembered: boolean;
}

export interface DayJournal {
  date: string;           // "YYYY-MM-DD"
  problemIds: string[];
  totalTimeMs: number;
}

export interface AppSettings {
  githubToken: string;
  githubUsername: string;
  githubRepo: string;
  openaiKey: string;
  groqKey: string;
  aiProvider: "openai" | "groq" | "none";
}

export interface ContestEntry {
  contestTitle: string;
  rank: number;
  rating: number;
  ratingChange: number;
  solved: number;
  total: number;
  date: number;
}

// ─── Keys ────────────────────────────────────────────────────
const KEYS = {
  PROBLEMS: "leetsync_problems",
  REVISIONS: "leetsync_revisions",
  JOURNALS: "leetsync_journals",
  SETTINGS: "leetsync_settings",
  CONTESTS: "leetsync_contests",
  START_TIME: "leetsync_problem_start_time",
};

// ─── Generic helpers ─────────────────────────────────────────
async function get<T>(key: string, fallback: T): Promise<T> {
  return adapterGet(key, fallback);
}

async function set<T>(key: string, value: T): Promise<void> {
  return adapterSet(key, value);
}

// ─── Problems ────────────────────────────────────────────────
export async function getProblems(): Promise<Record<string, ProblemRecord>> {
  return get<Record<string, ProblemRecord>>(KEYS.PROBLEMS, {});
}

export async function saveProblem(problem: ProblemRecord): Promise<void> {
  const problems = await getProblems();
  problems[problem.id] = problem;
  await set(KEYS.PROBLEMS, problems);
}

export async function getProblemById(id: string): Promise<ProblemRecord | null> {
  const problems = await getProblems();
  return problems[id] ?? null;
}

// ─── Revisions ───────────────────────────────────────────────
export async function getRevisions(): Promise<Record<string, RevisionEntry>> {
  return get<Record<string, RevisionEntry>>(KEYS.REVISIONS, {});
}

export async function saveRevision(entry: RevisionEntry): Promise<void> {
  const revisions = await getRevisions();
  revisions[entry.problemId] = entry;
  await set(KEYS.REVISIONS, revisions);
}

export async function getTodayRevisions(): Promise<RevisionEntry[]> {
  const revisions = await getRevisions();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return Object.values(revisions).filter((entry) => {
    const nextDate = entry.scheduledDates[entry.nextRevisionIndex];
    return nextDate >= todayStart.getTime() && nextDate <= todayEnd.getTime();
  });
}

// ─── Journals ────────────────────────────────────────────────
export async function getJournals(): Promise<Record<string, DayJournal>> {
  return get<Record<string, DayJournal>>(KEYS.JOURNALS, {});
}

export async function addToJournal(
  dateStr: string,
  problemId: string,
  timeSpentMs: number
): Promise<void> {
  const journals = await getJournals();
  if (!journals[dateStr]) {
    journals[dateStr] = { date: dateStr, problemIds: [], totalTimeMs: 0 };
  }
  if (!journals[dateStr].problemIds.includes(problemId)) {
    journals[dateStr].problemIds.push(problemId);
  }
  journals[dateStr].totalTimeMs += timeSpentMs;
  await set(KEYS.JOURNALS, journals);
}

// ─── Settings ─────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  return get<AppSettings>(KEYS.SETTINGS, {
    githubToken: "",
    githubUsername: "",
    githubRepo: "leetcode-solutions",
    openaiKey: "",
    groqKey: "",
    aiProvider: "none",
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(KEYS.SETTINGS, settings);
}

// ─── Contests ─────────────────────────────────────────────────
export async function getContests(): Promise<ContestEntry[]> {
  return get<ContestEntry[]>(KEYS.CONTESTS, []);
}

export async function addContest(entry: ContestEntry): Promise<void> {
  const contests = await getContests();
  contests.push(entry);
  await set(KEYS.CONTESTS, contests);
}

// ─── Problem Timer ────────────────────────────────────────────
export async function recordProblemStart(slug: string): Promise<void> {
  await set(KEYS.START_TIME, { slug, startTime: Date.now() });
}

export async function getProblemElapsed(slug: string): Promise<number> {
  const data = await get<{ slug: string; startTime: number } | null>(
    KEYS.START_TIME,
    null
  );
  if (!data || data.slug !== slug) return 0;
  return Date.now() - data.startTime;
}
