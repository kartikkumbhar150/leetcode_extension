// ============================================================
// clario-api.ts — Dedicated API client for the Clario backend
// Base: https://clario-track-your-time.vercel.app/api
// All GET calls go through the stale-while-revalidate cache.
// ============================================================

import { getClarioToken } from "./storage-adapter";
import { cachedGet, invalidate, invalidatePrefix, KEY, TTL } from "./api-cache";

const BASE = "https://clario-track-your-time.vercel.app/api";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getClarioToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error((err as { message: string }).message || `HTTP ${res.status}`);
  }

  // Some endpoints return empty/null
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

// Convenience wrapper for GET with cache
function get<T>(key: string, path: string, ttl: number) {
  return cachedGet<T>(key, () => req<T>("GET", path), ttl);
}

// ─── Auth ─────────────────────────────────────────────────────
export const clarioAuth = {
  register: (name: string, email: string, password: string) =>
    req<{ _id: string; name: string; email: string; categories: string[]; token: string }>(
      "POST", "/auth/register", { name, email, password }
    ),

  login: (email: string, password: string) =>
    req<{ _id: string; name: string; email: string; categories: string[]; token: string }>(
      "POST", "/auth/login", { email, password }
    ),

  me: () =>
    req<{ _id: string; name: string; email: string; categories: string[] }>(
      "GET", "/auth/me"
    ),
};

// ─── Focus Timer ──────────────────────────────────────────────
export interface FocusSession {
  _id: string;
  userId: string;
  taskId?: string;
  subject?: string;
  startTime: string;
  endTime?: string;
  status: "running" | "paused" | "completed";
  durationSeconds: number;
  pausedSeconds: number;
  notes?: string;
  date: string;
}

export interface TodayFocusStats {
  totalSeconds: number;
  goalSeconds: number;
  sessionsCount: number;
  longestSessionSeconds: number;
  averageSessionSeconds: number;
  breakTimeSeconds: number;
  streakDays: number;
  goalProgress: number;
}

export interface WeeklyDay {
  date: string;
  day: string;
  totalSeconds: number;
  totalHours: number;
  sessionsCount: number;
  goalSeconds: number;
}

export interface FocusHeatmap {
  month: number;
  year: number;
  daysInMonth: number;
  dailyHours: Record<string, number>;
  maxHours: number;
  firstDayOfWeek: number;
}

export interface SubjectDistribution {
  totalSeconds: number;
  distribution: { subject: string; seconds: number; hours: number; percentage: number }[];
}

export const focusApi = {
  startSession: async (subject?: string, taskId?: string) => {
    const s = await req<FocusSession>("POST", "/focus/start", { subject, taskId });
    // Invalidate live data after starting a session
    invalidate(KEY.focusActive());
    invalidate(KEY.focusTodayStats());
    return s;
  },

  pauseSession: async (id: string) => {
    const s = await req<FocusSession>("POST", `/focus/pause/${id}`);
    invalidate(KEY.focusActive());
    invalidate(KEY.focusTodayStats());
    return s;
  },

  resumeSession: async (id: string) => {
    const s = await req<FocusSession>("POST", `/focus/resume/${id}`);
    invalidate(KEY.focusActive());
    return s;
  },

  stopSession: async (id: string, notes?: string) => {
    const s = await req<FocusSession>("POST", `/focus/stop/${id}`, notes ? { notes } : undefined);
    // After stopping, all focus stats change
    invalidatePrefix("focus:");
    return s;
  },

  getActiveSession: () =>
    get<FocusSession | null>(KEY.focusActive(), "/focus/active", TTL.ACTIVE),

  getSessions: (date?: string) =>
    get<FocusSession[]>(
      KEY.focusSessions(date ?? "today"),
      `/focus/sessions${date ? `?date=${date}` : ""}`,
      TTL.MEDIUM
    ),

  getTodayStats: () =>
    get<TodayFocusStats>(KEY.focusTodayStats(), "/focus/stats/today", TTL.LIVE),

  getWeeklyStats: () =>
    get<WeeklyDay[]>(KEY.focusWeekly(), "/focus/stats/weekly", TTL.SHORT),

  getHeatmap: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));
    const qs = params.toString();
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    return get<FocusHeatmap>(
      KEY.focusHeatmap(m, y),
      `/focus/stats/heatmap${qs ? `?${qs}` : ""}`,
      TTL.MEDIUM
    );
  },

  getSubjectDistribution: (days = 7) =>
    get<SubjectDistribution>(
      KEY.focusSubjects(days),
      `/focus/stats/subjects${days ? `?days=${days}` : ""}`,
      TTL.SHORT
    ),

  setGoal: async (hours: number) => {
    const r = await req<{ goalSeconds: number; goalHours: number; currentSeconds: number; progress: number }>(
      "PUT", "/focus/goal", { hours }
    );
    invalidate(KEY.focusTodayStats());
    return r;
  },

  getStreak: () =>
    get<{ currentStreak: number; todayActive: boolean }>(KEY.focusStreak(), "/focus/streak", TTL.LIVE),
};

// ─── Daily Journal ────────────────────────────────────────────
export interface ClarioJournal {
  _id: string;
  userId: string;
  date: string;
  summary?: string | null;
  mood?: number | null;
  energy?: number | null;
  focus?: number | null;
  wins: string[];
  mistakes: string[];
  notes?: string | null;
  tags: string[];
  subjects?: { _id: string; subject: string; hoursSpent: number }[];
  problems?: { _id: string; platform: string; problemId?: string; problemTitle: string }[];
}

export const clarioJournalApi = {
  createOrUpdate: async (data: {
    date?: string; summary?: string; mood?: number; energy?: number; focus?: number;
    wins?: string[]; mistakes?: string[]; notes?: string; tags?: string[];
  }) => {
    const r = await req<ClarioJournal>("POST", "/journal", data);
    invalidate(KEY.journalToday());
    if (data.date) invalidate(KEY.journalDate(data.date));
    invalidatePrefix("journal:history");
    return r;
  },

  getToday: () =>
    get<ClarioJournal | null>(KEY.journalToday(), "/journal/today", TTL.MEDIUM),

  getByDate: (date: string) =>
    get<ClarioJournal | null>(KEY.journalDate(date), `/journal/date/${date}`, TTL.MEDIUM),

  getHistory: (limit = 30, offset = 0) =>
    get<ClarioJournal[]>(
      KEY.journalHistory(limit, offset),
      `/journal/history?limit=${limit}&offset=${offset}`,
      TTL.SHORT
    ),

  update: async (id: string, data: Partial<ClarioJournal>) => {
    const r = await req<ClarioJournal>("PUT", `/journal/${id}`, data);
    invalidatePrefix("journal:");
    return r;
  },

  addSubjects: async (id: string, subjects: { subject: string; hoursSpent: number }[]) => {
    const r = await req<unknown>("POST", `/journal/${id}/subjects`, { subjects });
    invalidate(KEY.journalToday());
    invalidatePrefix(`journal:date:`);
    return r;
  },

  getSubjects: (id: string) =>
    cachedGet(
      `journal:subjects:${id}`,
      () => req<{ _id: string; subject: string; hoursSpent: number }[]>("GET", `/journal/${id}/subjects`),
      TTL.MEDIUM
    ),

  addProblems: async (id: string, problems: { platform: string; problemId?: string; problemTitle: string }[]) => {
    const r = await req<unknown>("POST", `/journal/${id}/problems`, { problems });
    invalidate(KEY.journalToday());
    return r;
  },

  getProblems: (id: string) =>
    cachedGet(
      `journal:problems:${id}`,
      () => req<{ _id: string; platform: string; problemId?: string; problemTitle: string }[]>("GET", `/journal/${id}/problems`),
      TTL.MEDIUM
    ),
};

// ─── Revision / Spaced Repetition ─────────────────────────────
export interface LearningTopic {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  importance?: "low" | "medium" | "high";
  status: "active" | "mastered" | "archived";
  confidence: number;
  reviewCount: number;
  currentIntervalDays: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export interface TopicReview {
  _id: string;
  topicId: string;
  userId: string;
  confidence: number;
  notes?: string;
  reviewedAt: string;
  nextReviewAt: string;
}

export interface RevisionStats {
  totalTopics: number;
  mastered: number;
  active: number;
  archived: number;
  totalReviews: number;
  avgConfidence: number;
  subjectsBreakdown: Record<string, number>;
  queue: { dueToday: number; dueTomorrow: number; dueThisWeek: number };
}

export const clarioRevisionApi = {
  createTopic: async (data: { title: string; subject: string; difficulty: string; description?: string; importance?: string }) => {
    const r = await req<LearningTopic>("POST", "/revision/topics", data);
    invalidatePrefix("revision:");
    return r;
  },

  getTopics: () =>
    get<LearningTopic[]>(KEY.revisionTopics(), "/revision/topics", TTL.SHORT),

  getTopic: (id: string) =>
    get<LearningTopic & { reviews: TopicReview[] }>(
      KEY.revisionTopic(id), `/revision/topics/${id}`, TTL.SHORT
    ),

  updateTopic: async (id: string, data: Partial<LearningTopic>) => {
    const r = await req<LearningTopic>("PUT", `/revision/topics/${id}`, data);
    invalidate(KEY.revisionTopic(id));
    invalidate(KEY.revisionTopics());
    return r;
  },

  deleteTopic: async (id: string) => {
    const r = await req<{ message: string }>("DELETE", `/revision/topics/${id}`);
    invalidatePrefix("revision:");
    return r;
  },

  getDueTopics: () =>
    get<LearningTopic[]>(KEY.revisionDue(), "/revision/due", TTL.SHORT),

  submitReview: async (topicId: string, confidence: number, notes?: string) => {
    const r = await req<{ topic: LearningTopic; review: TopicReview; nextReviewAt: string; nextIntervalDays: number }>(
      "POST", `/revision/review/${topicId}`, { confidence, notes }
    );
    invalidatePrefix("revision:");
    return r;
  },

  getReviewHistory: (limit = 50) =>
    get<TopicReview[]>(`revision:history:${limit}`, `/revision/history?limit=${limit}`, TTL.SHORT),

  getQueue: () =>
    get<{ dueToday: number; dueTomorrow: number; dueThisWeek: number }>(
      KEY.revisionQueue(), "/revision/queue", TTL.SHORT
    ),

  getKnowledgeTree: () =>
    get<Record<string, { total: number; mastered: number; active: number; topics: { _id: string; title: string; status: string; confidence: number; nextReviewAt?: string }[] }>>(
      KEY.revisionTree(), "/revision/tree", TTL.SHORT
    ),

  getRevisionStats: () =>
    get<RevisionStats>(KEY.revisionStats(), "/revision/stats", TTL.SHORT),

  searchTopics: (q: string) =>
    req<LearningTopic[]>("GET", `/revision/search?q=${encodeURIComponent(q)}`),
};

// ─── Tasks ────────────────────────────────────────────────────
export interface ClarioTask {
  _id: string;
  userId: string;
  taskName: string;
  date: string;
  isCompleted: boolean;
}

export const clarioTasksApi = {
  create: async (taskName: string, date: string) => {
    const r = await req<ClarioTask>("POST", "/tasks", { taskName, date });
    invalidate(KEY.tasks(date));
    return r;
  },

  getByDate: (date: string) =>
    get<ClarioTask[]>(KEY.tasks(date), `/tasks?date=${date}`, TTL.MEDIUM),

  markCompleted: async (id: string) => {
    const r = await req<ClarioTask>("PUT", `/tasks/${id}/complete`);
    // Invalidate all task caches since we don't know the date from ID alone
    invalidatePrefix("tasks:");
    return r;
  },
};

// ─── Time Slots ───────────────────────────────────────────────
export interface TimeSlot {
  _id: string;
  userId: string;
  date: string;
  timeRange: string;
  taskSelected?: string;
  category: string;
  productivityType: "productive" | "neutral" | "wasted";
}

export const slotsApi = {
  create: async (data: { date: string; timeRange: string; taskSelected?: string; category: string; productivityType: string }) => {
    const r = await req<TimeSlot>("POST", "/slots", data);
    invalidate(KEY.slots(data.date));
    invalidatePrefix("analytics:");
    return r;
  },

  getByDate: (date: string) =>
    get<TimeSlot[]>(KEY.slots(date), `/slots?date=${date}`, TTL.MEDIUM),

  update: async (id: string, data: Partial<TimeSlot>) => {
    const r = await req<TimeSlot>("PUT", `/slots/${id}`, data);
    if (data.date) invalidate(KEY.slots(data.date));
    invalidatePrefix("analytics:");
    return r;
  },

  delete: async (id: string) => {
    const r = await req<{ message: string }>("DELETE", `/slots/${id}`);
    invalidatePrefix("slots:");
    invalidatePrefix("analytics:");
    return r;
  },

  batchUpdate: async (data: { date: string; timeRanges: string[]; taskSelected?: string; category: string; productivityType: string }) => {
    const r = await req<TimeSlot[]>("PATCH", "/slots/batch", data);
    invalidate(KEY.slots(data.date));
    invalidatePrefix("analytics:");
    return r;
  },
};

// ─── Analytics ────────────────────────────────────────────────
export interface AnalyticsData {
  totalMinutes: number;
  productiveMinutes: number;
  wastedMinutes: number;
  neutralMinutes: number;
  productivityPercentage: number;
  productivityIndex: number;
  categoryBreakdown: Record<string, number>;
  taskBreakdown: Record<string, number>;
  productivityByCategory: Record<string, { productive: number; neutral: number; wasted: number }>;
  totalTasks: number;
  completedTasks: number;
  insights: string;
}

export interface WeeklyTrend {
  trend: {
    date: string;
    productiveMin: number;
    wastedMin: number;
    neutralMin: number;
    totalMin: number;
    tasksCompleted: number;
    tasksMissed: number;
    productivityIndex: number;
  }[];
  cumulativeFocus: { date: string; cumulativeMinutes: number }[];
}

export interface AnalyticsHeatmap {
  month: number;
  year: number;
  daysInMonth: number;
  dailyMinutes: Record<string, number>;
  maxMinutes: number;
  hourlyMap: Record<string, Record<number, number>>;
  firstDayOfWeek: number;
}

export const analyticsApi = {
  getAnalytics: (period: "day" | "week", date?: string) => {
    const qs = date ? `?date=${date}` : "";
    const key = period === "day" ? KEY.analyticsDay(date ?? "today") : KEY.analyticsWeek(date ?? "today");
    return get<AnalyticsData>(key, `/analytics/${period}${qs}`, TTL.SHORT);
  },

  getWeeklyTrend: (date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return get<WeeklyTrend>(KEY.weeklyTrend(date ?? "today"), `/analytics/weekly-trend${qs}`, TTL.SHORT);
  },

  getHeatmapData: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));
    const qs = params.toString();
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    return get<AnalyticsHeatmap>(KEY.heatmap(m, y), `/analytics/heatmap${qs ? `?${qs}` : ""}`, TTL.MEDIUM);
  },
};

// ─── AI Insights ──────────────────────────────────────────────
export interface AIInsightsData {
  insights: { type: string; icon: string; text: string }[];
  bestHours: { hour: number; label: string; productivityRate: number }[];
  worstHours: { hour: number; label: string; productivityRate: number }[];
  summary: string;
  stats?: {
    totalSlots: number;
    productiveSlots: number;
    wastedSlots: number;
    neutralSlots: number;
    productivityRate: number;
    taskCompletionRate: number;
    daysTracked: number;
    avgSlotsPerDay: number;
  };
}

export const aiApi = {
  // AI insights are expensive — cache for 5 minutes
  getInsights: () =>
    get<AIInsightsData>(KEY.aiInsights(), "/ai/insights", TTL.LONG),

  // Force-refresh bypasses cache
  refreshInsights: () => {
    invalidate(KEY.aiInsights());
    return get<AIInsightsData>(KEY.aiInsights(), "/ai/insights", TTL.LONG);
  },
};

// ─── Reports ──────────────────────────────────────────────────
export interface ReportData {
  startDate: string;
  endDate: string;
  totalDays: number;
  totalMinutes: number;
  productiveMinutes: number;
  wastedMinutes: number;
  neutralMinutes: number;
  productivityPercentage: number;
  productivityIndex: number;
  categoryBreakdown: Record<string, number>;
  taskBreakdown: Record<string, number>;
  totalTasks: number;
  completedTasks: number;
  dailyBreakdown: {
    date: string; productive: number; wasted: number; neutral: number; total: number;
    productivityPercentage: number; tasksCompleted: number; tasksMissed: number;
    focusSeconds: number; reviewsDone: number;
  }[];
  hourlyProductivity: { hour: number; productive: number; neutral: number; wasted: number; total: number }[];
  weekdayBreakdown: { day: string; dayIndex: number; avgProductive: number; avgWasted: number; avgNeutral: number; avgTotal: number }[];
  focus: {
    totalFocusSeconds: number; totalFocusHours: number; sessionCount: number;
    longestSessionSeconds: number; avgSessionSeconds: number;
    subjectDistribution: { subject: string; seconds: number; hours: number; percentage: number }[];
    dailyFocus: { date: string; seconds: number; hours: number }[];
    focusStreak: number; daysWithFocus: number; daysMeetingGoal: number;
  };
  journal: {
    entriesCount: number; avgMood: number | null; avgEnergy: number | null; avgFocus: number | null;
    totalWins: number; totalMistakes: number;
    moodTrend: { date: string; mood: number | null; energy: number | null; focus: number | null }[];
  };
  revision: {
    totalTopics: number; activeTopics: number; masteredTopics: number; masteredInRange: number;
    totalReviewsInRange: number; avgReviewConfidence: number;
    dailyReviews: { date: string; count: number }[];
    subjectStats: { subject: string; total: number; mastered: number; avgConf: number }[];
  };
}

export const reportsApi = {
  // Reports are expensive — cache for 5 minutes
  getReport: (startDate: string, endDate: string) =>
    get<ReportData>(KEY.report(startDate, endDate), `/reports?startDate=${startDate}&endDate=${endDate}`, TTL.LONG),
};

// ─── User ─────────────────────────────────────────────────────
export const userApi = {
  getCategories: () =>
    get<string[]>(KEY.userCategories(), "/users/categories", TTL.LONG),

  updateCategories: async (categories: string[]) => {
    const r = await req<string[]>("PUT", "/users/categories", { categories });
    invalidate(KEY.userCategories());
    return r;
  },

  getProfile: () =>
    get<{ _id: string; name: string; email: string; profilePhoto: string; categories: string[] }>(
      KEY.userProfile(), "/users/profile", TTL.LONG
    ),

  updateProfile: async (data: { name?: string; profilePhoto?: string }) => {
    const r = await req<{ _id: string; name: string; email: string; profilePhoto: string; categories: string[] }>(
      "PUT", "/users/profile", data
    );
    invalidate(KEY.userProfile());
    return r;
  },
};
