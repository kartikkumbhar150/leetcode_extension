// ============================================================
// revision.ts — Spaced Repetition Scheduler
// Interval sequence: 1, 3, 7, 15, 30, 60, 120 days
// ============================================================

import type { RevisionEntry, RevisionResult } from "./storage";
import { getRevisions, saveRevision, getProblemById } from "./storage";

const INTERVALS_DAYS = [1, 3, 7, 15, 30, 60, 120];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

/** Create initial revision schedule for a newly solved problem. */
export async function scheduleRevision(problemId: string): Promise<void> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const scheduledDates = INTERVALS_DAYS.map((days) =>
    addDays(now, days).getTime()
  );

  const entry: RevisionEntry = {
    problemId,
    scheduledDates,
    nextRevisionIndex: 0,
    history: [],
  };

  await saveRevision(entry);
}

/**
 * Mark a revision result.
 * - "remembered" → advance to the next slot in the schedule
 * - "forgot" → reschedule the next slot to tomorrow
 */
export async function recordRevisionResult(
  problemId: string,
  remembered: boolean
): Promise<void> {
  const revisions = await getRevisions();
  const entry = revisions[problemId];
  if (!entry) return;

  const result: RevisionResult = { date: Date.now(), remembered };
  entry.history.push(result);

  if (remembered) {
    if (entry.nextRevisionIndex < entry.scheduledDates.length - 1) {
      entry.nextRevisionIndex++;
    }
  } else {
    entry.scheduledDates[entry.nextRevisionIndex] = addDays(new Date(), 1).getTime();
  }

  await saveRevision(entry);
}

/** Get all revision entries due today (or overdue). */
export async function getDueRevisions(): Promise<
  { entry: RevisionEntry; title: string; difficulty: string }[]
> {
  const revisions = await getRevisions();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const due: { entry: RevisionEntry; title: string; difficulty: string }[] = [];

  for (const entry of Object.values(revisions)) {
    const nextDate = entry.scheduledDates[entry.nextRevisionIndex];
    if (nextDate && nextDate <= todayEnd.getTime()) {
      const problem = await getProblemById(entry.problemId);
      due.push({
        entry,
        title: problem?.title ?? entry.problemId,
        difficulty: problem?.difficulty ?? "Medium",
      });
    }
  }

  due.sort(
    (a, b) =>
      a.entry.scheduledDates[a.entry.nextRevisionIndex] -
      b.entry.scheduledDates[b.entry.nextRevisionIndex]
  );

  return due;
}

/** Also exported as alias for background worker compatibility */
export const getTodayRevisions = getDueRevisions;

/** Get the human-readable next revision date for a problem. */
export function getNextRevisionLabel(entry: RevisionEntry): string {
  const nextTs = entry.scheduledDates[entry.nextRevisionIndex];
  if (!nextTs) return "Done";
  return new Date(nextTs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Compute the full revision calendar for a problem from today. */
export function computeRevisionDates(fromDate: Date): string[] {
  return INTERVALS_DAYS.map((days) => {
    const d = addDays(fromDate, days);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}
