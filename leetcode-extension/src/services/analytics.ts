// ============================================================
// analytics.ts — Compute derived statistics from storage
// ============================================================

import type { ProblemRecord, DayJournal } from "./storage";
import { getProblems, getJournals } from "./storage";

export interface Stats {
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  currentStreak: number;
  longestStreak: number;
  topicCounts: Record<string, number>;
  companyCounts: Record<string, number>;
  patternCounts: Record<string, number>;
  avgTimeByDifficulty: { Easy: number; Medium: number; Hard: number };
  heatmap: Record<string, number>; // "YYYY-MM-DD" → count
  dailyTimes: Record<string, number>; // "YYYY-MM-DD" → totalMs
  recentProblems: ProblemRecord[];
}

export async function computeStats(): Promise<Stats> {
  const problems = await getProblems();
  const journals = await getJournals();
  const list = Object.values(problems);

  const easy = list.filter((p) => p.difficulty === "Easy").length;
  const medium = list.filter((p) => p.difficulty === "Medium").length;
  const hard = list.filter((p) => p.difficulty === "Hard").length;

  // Topic counts
  const topicCounts: Record<string, number> = {};
  for (const p of list) {
    for (const tag of p.tags) {
      topicCounts[tag] = (topicCounts[tag] ?? 0) + 1;
    }
  }

  // Company counts
  const companyCounts: Record<string, number> = {};
  for (const p of list) {
    for (const c of p.companies) {
      companyCounts[c] = (companyCounts[c] ?? 0) + 1;
    }
  }

  // Pattern counts
  const patternCounts: Record<string, number> = {};
  for (const p of list) {
    if (p.pattern) {
      patternCounts[p.pattern] = (patternCounts[p.pattern] ?? 0) + 1;
    }
  }

  // Avg time by difficulty
  const timeSums = { Easy: 0, Medium: 0, Hard: 0 };
  const timeCounts = { Easy: 0, Medium: 0, Hard: 0 };
  for (const p of list) {
    if (p.timeSpentMs && p.timeSpentMs > 0) {
      timeSums[p.difficulty] += p.timeSpentMs;
      timeCounts[p.difficulty]++;
    }
  }
  const avgTimeByDifficulty = {
    Easy: timeCounts.Easy ? timeSums.Easy / timeCounts.Easy : 0,
    Medium: timeCounts.Medium ? timeSums.Medium / timeCounts.Medium : 0,
    Hard: timeCounts.Hard ? timeSums.Hard / timeCounts.Hard : 0,
  };

  // Heatmap & streaks from journals
  const heatmap: Record<string, number> = {};
  const dailyTimes: Record<string, number> = {};
  for (const j of Object.values(journals)) {
    heatmap[j.date] = j.problemIds.length;
    dailyTimes[j.date] = j.totalTimeMs;
  }

  const { currentStreak, longestStreak } = computeStreaks(heatmap);

  // Recent 10 problems sorted by solve time
  const recentProblems = [...list]
    .sort((a, b) => b.solvedAt - a.solvedAt)
    .slice(0, 10);

  return {
    totalSolved: list.length,
    easy,
    medium,
    hard,
    currentStreak,
    longestStreak,
    topicCounts,
    companyCounts,
    patternCounts,
    avgTimeByDifficulty,
    heatmap,
    dailyTimes,
    recentProblems,
  };
}

function computeStreaks(heatmap: Record<string, number>): {
  currentStreak: number;
  longestStreak: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  
  // Walk backwards from today
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().split("T")[0];
    if (heatmap[key] && heatmap[key] > 0) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      if (currentStreak === 0 && streak === 0) {
        // Haven't started yet — check if today is a rest day
      } else if (currentStreak === 0) {
        currentStreak = streak;
      }
      if (currentStreak !== 0) break;
      streak = 0;
    }
    cursor.setDate(cursor.getDate() - 1);
    // Limit scan to 2 years
    if (today.getTime() - cursor.getTime() > 365 * 2 * 86400000) break;
  }

  if (currentStreak === 0) currentStreak = streak;

  return { currentStreak, longestStreak };
}

export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Blind 75 problem IDs (subset)
export const BLIND75_IDS = [
  "0001","0011","0015","0033","0121","0125","0153","0217","0238",
  "0242","0268","0347","0424","0448","0485","0543","0572","0606",
  "0647","0704","0724","0739","0763","0792","0820","0853","0875",
  "0904","0973","1011","1143","0056","0057","0073","0079","0098",
  "0102","0104","0105","0128","0133","0141","0143","0155","0191",
  "0198","0200","0206","0207","0208","0213","0226","0230","0235",
  "0236","0261","0269","0271","0283","0297","0300","0322","0338",
  "0416","0417","0435","0438","0494","0509","0547","0560","0567",
  "0647","0695","0647","0743","0784"
];

export const NEETCODE150_COUNT = 150;
