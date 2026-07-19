// ============================================================
// demo-data.ts — Seeds rich demo data into localStorage so the
// Vercel deployment looks populated right away.
// Only runs when chrome.storage is NOT available.
// ============================================================

import { saveProblem, addToJournal, getProblems } from "./storage";
import { scheduleRevision } from "./revision";
import type { ProblemRecord } from "./storage";

const IS_EXTENSION =
  typeof chrome !== "undefined" &&
  typeof chrome.storage !== "undefined";

const DEMO_PROBLEMS: Omit<ProblemRecord, "notes" | "pattern" | "mistake" | "observation">[] = [
  { id: "0001", title: "Two Sum", slug: "two-sum", difficulty: "Easy", tags: ["Array", "Hash Table"], companies: ["Amazon", "Google", "Microsoft"], url: "https://leetcode.com/problems/two-sum/", language: "python3", code: "def twoSum(self, nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i", runtime: "52ms", memory: "14.1 MB", solvedAt: ts(-1), timeSpentMs: 8 * 60000 },
  { id: "0053", title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Medium", tags: ["Array", "Dynamic Programming"], companies: ["Amazon", "Apple"], url: "https://leetcode.com/problems/maximum-subarray/", language: "python3", code: "def maxSubArray(self, nums):\n    cur = best = nums[0]\n    for n in nums[1:]:\n        cur = max(n, cur + n)\n        best = max(best, cur)\n    return best", runtime: "103ms", memory: "28.6 MB", solvedAt: ts(-1), timeSpentMs: 22 * 60000 },
  { id: "0121", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy", tags: ["Array", "Dynamic Programming"], companies: ["Amazon", "Goldman Sachs"], url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", language: "java", code: "public int maxProfit(int[] prices) {\n    int min = Integer.MAX_VALUE, max = 0;\n    for (int p : prices) {\n        min = Math.min(min, p);\n        max = Math.max(max, p - min);\n    }\n    return max;\n}", runtime: "1ms", memory: "58.3 MB", solvedAt: ts(-2), timeSpentMs: 15 * 60000 },
  { id: "0200", title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium", tags: ["Array", "Depth-First Search", "Breadth-First Search", "Graph"], companies: ["Amazon", "Microsoft", "Google"], url: "https://leetcode.com/problems/number-of-islands/", language: "cpp", code: "int numIslands(vector<vector<char>>& grid) {\n    int count = 0;\n    for(int i=0;i<grid.size();i++)\n        for(int j=0;j<grid[0].size();j++)\n            if(grid[i][j]=='1'){dfs(grid,i,j);count++;}\n    return count;\n}", runtime: "8ms", memory: "13.9 MB", solvedAt: ts(-2), timeSpentMs: 35 * 60000 },
  { id: "0322", title: "Coin Change", slug: "coin-change", difficulty: "Medium", tags: ["Array", "Dynamic Programming"], companies: ["Amazon", "Google", "Facebook"], url: "https://leetcode.com/problems/coin-change/", language: "python3", code: "def coinChange(self, coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for c in coins:\n        for i in range(c, amount + 1):\n            dp[i] = min(dp[i], dp[i - c] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1", runtime: "921ms", memory: "14.4 MB", solvedAt: ts(-3), timeSpentMs: 28 * 60000 },
  { id: "0543", title: "Diameter of Binary Tree", slug: "diameter-of-binary-tree", difficulty: "Easy", tags: ["Tree", "Depth-First Search", "Binary Tree"], companies: ["Facebook", "Amazon"], url: "https://leetcode.com/problems/diameter-of-binary-tree/", language: "python3", code: "def diameterOfBinaryTree(self, root):\n    self.ans = 0\n    def depth(n):\n        if not n: return 0\n        l, r = depth(n.left), depth(n.right)\n        self.ans = max(self.ans, l + r)\n        return max(l, r) + 1\n    depth(root)\n    return self.ans", runtime: "40ms", memory: "16.3 MB", solvedAt: ts(-3), timeSpentMs: 18 * 60000 },
  { id: "0300", title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium", tags: ["Array", "Dynamic Programming", "Binary Search"], companies: ["Microsoft", "Amazon", "Adobe"], url: "https://leetcode.com/problems/longest-increasing-subsequence/", language: "python3", code: "def lengthOfLIS(self, nums):\n    tails = []\n    for n in nums:\n        l, r = 0, len(tails)\n        while l < r:\n            m = (l + r) // 2\n            if tails[m] < n: l = m + 1\n            else: r = m\n        if l == len(tails): tails.append(n)\n        else: tails[l] = n\n    return len(tails)", runtime: "56ms", memory: "16.7 MB", solvedAt: ts(-4), timeSpentMs: 41 * 60000 },
  { id: "0104", title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy", tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"], companies: ["LinkedIn", "Amazon"], url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", language: "javascript", code: "var maxDepth = function(root) {\n    if (!root) return 0;\n    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n};", runtime: "72ms", memory: "44.6 MB", solvedAt: ts(-5), timeSpentMs: 9 * 60000 },
  { id: "0739", title: "Daily Temperatures", slug: "daily-temperatures", difficulty: "Medium", tags: ["Array", "Stack", "Sliding Window"], companies: ["Amazon", "Uber"], url: "https://leetcode.com/problems/daily-temperatures/", language: "python3", code: "def dailyTemperatures(self, temperatures):\n    res = [0] * len(temperatures)\n    stack = []\n    for i, t in enumerate(temperatures):\n        while stack and temperatures[stack[-1]] < t:\n            j = stack.pop()\n            res[j] = i - j\n        stack.append(i)\n    return res", runtime: "871ms", memory: "28.3 MB", solvedAt: ts(-6), timeSpentMs: 25 * 60000 },
  { id: "0076", title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard", tags: ["Hash Table", "String", "Sliding Window"], companies: ["Facebook", "Google", "Amazon"], url: "https://leetcode.com/problems/minimum-window-substring/", language: "python3", code: "def minWindow(self, s, t):\n    need = Counter(t)\n    missing = len(t)\n    best = ''\n    i = 0\n    for j, c in enumerate(s, 1):\n        if need[c] > 0: missing -= 1\n        need[c] -= 1\n        if not missing:\n            while need[s[i]] < 0: need[s[i]] += 1; i += 1\n            if not best or j - i < len(best): best = s[i:j]\n            need[s[i]] += 1; missing += 1; i += 1\n    return best", runtime: "120ms", memory: "15.1 MB", solvedAt: ts(-7), timeSpentMs: 58 * 60000 },
  { id: "0238", title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Medium", tags: ["Array", "Prefix Sum"], companies: ["Facebook", "Amazon", "Microsoft"], url: "https://leetcode.com/problems/product-of-array-except-self/", language: "java", code: "public int[] productExceptSelf(int[] nums) {\n    int n = nums.length;\n    int[] res = new int[n];\n    res[0] = 1;\n    for (int i = 1; i < n; i++) res[i] = res[i-1] * nums[i-1];\n    int right = 1;\n    for (int i = n-1; i >= 0; i--) { res[i] *= right; right *= nums[i]; }\n    return res;\n}", runtime: "1ms", memory: "49.5 MB", solvedAt: ts(-8), timeSpentMs: 32 * 60000 },
  { id: "0417", title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow", difficulty: "Medium", tags: ["Array", "Depth-First Search", "Breadth-First Search", "Graph"], companies: ["Google", "Zenefits"], url: "https://leetcode.com/problems/pacific-atlantic-water-flow/", language: "python3", code: "# BFS from both oceans", runtime: "196ms", memory: "19.1 MB", solvedAt: ts(-9), timeSpentMs: 44 * 60000 },
  { id: "0042", title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", tags: ["Array", "Two Pointers", "Stack"], companies: ["Amazon", "Google", "Goldman Sachs", "Microsoft"], url: "https://leetcode.com/problems/trapping-rain-water/", language: "cpp", code: "int trap(vector<int>& h) {\n    int l=0,r=h.size()-1,lm=0,rm=0,res=0;\n    while(l<r){\n        if(h[l]<h[r]){lm=max(lm,h[l]);res+=lm-h[l++];}\n        else{rm=max(rm,h[r]);res+=rm-h[r--];}\n    } return res;\n}", runtime: "3ms", memory: "19.2 MB", solvedAt: ts(-10), timeSpentMs: 62 * 60000 },
  { id: "0143", title: "Reorder List", slug: "reorder-list", difficulty: "Medium", tags: ["Linked List", "Two Pointers", "Stack"], companies: ["Amazon", "Bloomberg"], url: "https://leetcode.com/problems/reorder-list/", language: "python3", code: "# Slow/fast pointer + reverse + merge", runtime: "83ms", memory: "23.8 MB", solvedAt: ts(-12), timeSpentMs: 38 * 60000 },
  { id: "0084", title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", difficulty: "Hard", tags: ["Array", "Stack", "Sliding Window"], companies: ["Amazon", "Microsoft", "Google"], url: "https://leetcode.com/problems/largest-rectangle-in-histogram/", language: "python3", code: "# Monotonic stack approach", runtime: "118ms", memory: "27.5 MB", solvedAt: ts(-14), timeSpentMs: 71 * 60000 },
];

// Generate extra problems to simulate history
const EXTRA_EASY_TITLES = ["Valid Parentheses","Climbing Stairs","Palindrome Number","Merge Sorted Array","Reverse String","Single Number","Majority Element","Move Zeroes","Contains Duplicate","Intersection of Two Arrays"];
const EXTRA_MEDIUM_TITLES = ["3Sum","Container With Most Water","Letter Combinations","Generate Parentheses","Word Search","Group Anagrams","Top K Frequent Elements","Decode Ways","Jump Game","Rotate Image"];
const EXTRA_HARD_TITLES = ["Median of Two Sorted Arrays","N-Queens","Word Ladder","Serialize and Deserialize Binary Tree"];

function ts(daysAgo: number): number {
  const d = new Date();
  d.setDate(d.getDate() + daysAgo);
  d.setHours(Math.floor(Math.random() * 8) + 10, 0, 0, 0);
  return d.getTime();
}

function makeExtra(
  id: number,
  title: string,
  difficulty: "Easy" | "Medium" | "Hard",
  daysAgo: number
): ProblemRecord {
  const tagMap: Record<string, string[]> = {
    Easy: ["Array", "Hash Table", "String"],
    Medium: ["Dynamic Programming", "Graph", "Tree"],
    Hard: ["Backtracking", "Dynamic Programming"],
  };
  return {
    id: String(id).padStart(4, "0"),
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    difficulty,
    tags: tagMap[difficulty],
    companies: ["Google", "Amazon"].slice(0, 1 + (id % 2)),
    url: `https://leetcode.com/problems/${title.toLowerCase().replace(/\s+/g, "-")}/`,
    language: ["python3", "java", "cpp"][id % 3],
    code: `// ${title} solution`,
    runtime: `${20 + (id % 100)}ms`,
    memory: `${14 + (id % 20)}.${id % 9} MB`,
    solvedAt: ts(-daysAgo),
    timeSpentMs: (10 + (id % 50)) * 60000,
    notes: "",
    pattern: "",
    mistake: "",
    observation: "",
  };
}

export async function seedDemoData(): Promise<void> {
  if (IS_EXTENSION) return; // Only seed in web mode

  const existing = await getProblems();
  if (Object.keys(existing).length > 0) return; // Already seeded

  console.log("[LeetSync] Seeding demo data…");

  // Seed main curated problems
  for (const p of DEMO_PROBLEMS) {
    await saveProblem({ ...p, notes: "", pattern: "", mistake: "", observation: "" });
    await scheduleRevision(p.id);
    const dateStr = new Date(p.solvedAt).toISOString().split("T")[0];
    await addToJournal(dateStr, p.id, p.timeSpentMs ?? 0);
  }

  // Seed extra historical problems to fill the heatmap
  let extraId = 500;
  for (let dayAgo = 15; dayAgo <= 120; dayAgo += Math.floor(Math.random() * 3) + 1) {
    const titles = [...EXTRA_EASY_TITLES, ...EXTRA_MEDIUM_TITLES];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < count; k++) {
      const title = titles[extraId % titles.length];
      const diff = extraId % 3 === 0 ? "Hard" : extraId % 2 === 0 ? "Medium" : "Easy";
      const p = makeExtra(extraId++, title + ` ${extraId}`, diff, dayAgo);
      await saveProblem(p);
      const dateStr = new Date(p.solvedAt).toISOString().split("T")[0];
      await addToJournal(dateStr, p.id, p.timeSpentMs ?? 0);
    }
  }

  console.log("[LeetSync] Demo data seeded ✓");
}
