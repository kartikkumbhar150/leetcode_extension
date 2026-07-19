// ============================================================
// leetcode.ts — LeetCode GraphQL API helpers
// Uses the user's authenticated browser session (cookies)
// ============================================================

export interface LeetCodeProblemMeta {
  id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  companies: string[];
  url: string;
  content: string;
}

export interface SubmissionDetail {
  code: string;
  language: string;
  runtime: string;
  memory: string;
  timestamp: number;
}

const GQL_ENDPOINT = "https://leetcode.com/graphql/";

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode GQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Fetch problem metadata ───────────────────────────────────
export async function fetchProblemMeta(slug: string): Promise<LeetCodeProblemMeta> {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        content
        topicTags { name }
        companyTagStats
      }
    }
  `;

  const data = await gql<{
    question: {
      questionId: string;
      title: string;
      titleSlug: string;
      difficulty: string;
      content: string;
      topicTags: { name: string }[];
      companyTagStats: string | null;
    };
  }>(query, { titleSlug: slug });

  const q = data.question;

  // companyTagStats may be null, empty, or a JSON string — handle all cases
  let companies: string[] = [];
  try {
    if (q.companyTagStats) {
      const parsed = JSON.parse(q.companyTagStats);
      companies = (Object.values(parsed) as { name: string }[][])
        .flat()
        .map((c) => c.name)
        .filter(Boolean);
    }
  } catch { /* silently ignore invalid companyTagStats */ }

  return {
    id: q.questionId.padStart(4, "0"),
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty as "Easy" | "Medium" | "Hard",
    tags: q.topicTags.map((t) => t.name),
    companies,
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    content: q.content ?? "",
  };
}

// ─── Fetch latest accepted submission ─────────────────────────
export async function fetchLatestAcceptedSubmission(
  slug: string
): Promise<SubmissionDetail | null> {
  const query = `
    query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) {
      questionSubmissionList(
        offset: $offset
        limit: $limit
        questionSlug: $questionSlug
      ) {
        submissions {
          id
          statusDisplay
          lang
          runtime
          memory
          timestamp
        }
      }
    }
  `;

  let data: {
    questionSubmissionList: {
      submissions: {
        id: string;
        statusDisplay: string;
        lang: string;
        runtime: string;
        memory: string;
        timestamp: string;
      }[];
    };
  };

  try {
    data = await gql(query, { offset: 0, limit: 20, questionSlug: slug });
  } catch (err) {
    console.error("[LeetSync] Failed to fetch submission list:", err);
    return null;
  }

  const submissions = data.questionSubmissionList?.submissions ?? [];
  const accepted = submissions.find(
    (s) => s.statusDisplay === "Accepted"
  );
  if (!accepted) {
    console.warn("[LeetSync] No accepted submission found for:", slug);
    return null;
  }

  // Fetch full code for the accepted submission
  let code = "";
  try {
    code = await fetchSubmissionCode(accepted.id);
  } catch (err) {
    console.error("[LeetSync] Failed to fetch submission code:", err);
    return null;
  }

  return {
    code,
    language: accepted.lang,
    runtime: accepted.runtime,
    memory: accepted.memory,
    timestamp: parseInt(accepted.timestamp) * 1000,
  };
}

// ─── Fetch full code for a submission ID ─────────────────────
export async function fetchSubmissionCode(submissionId: string): Promise<string> {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
      }
    }
  `;
  const data = await gql<{
    submissionDetails: { code: string };
  }>(query, { submissionId: parseInt(submissionId) });
  return data.submissionDetails?.code ?? "";
}

// ─── Map language to file extension ──────────────────────────
export function langToExtension(lang: string): string {
  const map: Record<string, string> = {
    python: "py",
    python3: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    javascript: "js",
    typescript: "ts",
    go: "go",
    rust: "rs",
    kotlin: "kt",
    swift: "swift",
    scala: "scala",
    ruby: "rb",
    csharp: "cs",
    dart: "dart",
    php: "php",
    r: "r",
    mysql: "sql",
    bash: "sh",
  };
  return map[lang.toLowerCase()] ?? "txt";
}

// ─── Map tag to folder name ───────────────────────────────────
const TAG_FOLDER_MAP: Record<string, string> = {
  "Dynamic Programming": "DP",
  "Depth-First Search": "Graphs",
  "Breadth-First Search": "Graphs",
  Graph: "Graphs",
  Tree: "Trees",
  "Binary Tree": "Trees",
  "Binary Search Tree": "Trees",
  Array: "Arrays",
  "Hash Table": "HashMaps",
  String: "Strings",
  "Linked List": "LinkedList",
  Backtracking: "Backtracking",
  Greedy: "Greedy",
  "Sliding Window": "SlidingWindow",
  "Two Pointers": "TwoPointers",
  "Binary Search": "BinarySearch",
  Stack: "Stack",
  Queue: "Queue",
  Heap: "Heap",
  Trie: "Trie",
  Math: "Math",
  "Bit Manipulation": "BitManipulation",
};

export function tagToFolder(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_FOLDER_MAP[tag]) return TAG_FOLDER_MAP[tag];
  }
  return "Misc";
}
