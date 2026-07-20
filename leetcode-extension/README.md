# ⚡ uCode — Auto GitHub Commit & Revision Tracker

> A premium Chrome Extension (Manifest V3) that automatically commits your accepted LeetCode solutions to GitHub, tracks your progress with spaced-repetition revision scheduling, and displays beautiful analytics dashboards.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 **Auto GitHub Commit** | Detects accepted submissions → fetches code → pushes to GitHub automatically |
| 📔 **Daily Coding Journal** | Every accepted problem is logged with timestamp, difficulty, and time spent |
| 🧠 **Spaced Repetition** | Anki-style revision schedule (1, 3, 7, 15, 30, 60, 120 days) |
| 📊 **Difficulty Dashboard** | Visual Easy/Medium/Hard progress bars and donut chart |
| 🗺️ **Topic Dashboard** | Radar chart + bar charts for DP, Graphs, Trees, and 15+ topics |
| 📅 **Calendar Heatmap** | GitHub-style contribution graph showing consistency |
| 🔥 **Streak Counter** | Current and longest solve streak |
| ⏱️ **Time Analytics** | Average solve time per difficulty level |
| 🏢 **Company Tags** | Problems sorted by FAANG company frequency |
| 📝 **Personal Notes** | Per-problem mistakes, observations, and patterns |

---

## 📁 Repository Structure (Auto-Generated on GitHub)

```
YourRepo/
└── LeetCode/
    ├── DP/
    │   └── 0322-coin-change/
    │       ├── Solution.py
    │       └── README.md
    ├── Arrays/
    │   └── 0001-two-sum/
    │       ├── Solution.java
    │       └── README.md
    └── Graphs/
        └── 0200-number-of-islands/
            ├── Solution.cpp
            └── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Chrome browser
- A GitHub account with a Personal Access Token (`repo` scope)

### 1. Clone & Build
```bash
git clone https://github.com/yourusername/ucode-extension
cd ucode-extension
npm install
npm run build
```

### 2. Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### 3. Configure GitHub
1. Click the uCode icon in your Chrome toolbar
2. Go to **Settings**
3. Enter your **GitHub Personal Access Token** → [Generate one here](https://github.com/settings/tokens)
4. Enter your **GitHub username** and **repository name**
5. Click **Save Settings**

> **Create the repository first** on GitHub (can be empty). uCode will populate it automatically.

---

## 🔑 GitHub Token Setup

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name like `ucode`
4. Check the ✅ `repo` scope
5. Click **Generate token**
6. Copy and paste it into uCode Settings

---

## 🧠 How Spaced Repetition Works

When you solve a problem, uCode schedules 7 automatic revisions:

```
Solved Today (19 Jul)
        ↓
Revisions:
  20 Jul  (1 day)
  22 Jul  (3 days)
  26 Jul  (7 days)
  3 Aug   (15 days)
  18 Aug  (30 days)
  17 Sep  (60 days)
  16 Nov  (120 days)
```

In the **Revisions** tab, for each due problem:
- ✅ **Remembered** → advance to the next scheduled date
- ❌ **Forgot** → reschedule to tomorrow (resets that slot)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Extension | Manifest V3, TypeScript |
| UI | React 19, Framer Motion, Recharts |
| Styling | Tailwind CSS v4 |
| Storage | `chrome.storage.local` |
| Notifications | `chrome.alarms` + `chrome.notifications` |
| GitHub Sync | GitHub REST API v3 |
| Build | Vite 8 |

---

## 📂 Project Structure

```
leetcode-extension/
├── src/
│   ├── background/      # Service Worker (orchestration)
│   ├── content/         # Content Script (LeetCode page observer)
│   ├── popup/           # Extension popup UI
│   ├── dashboard/       # Full-page dashboard (React app)
│   │   ├── App.tsx
│   │   ├── HeatmapView.tsx
│   │   ├── RevisionView.tsx
│   │   ├── JournalView.tsx
│   │   ├── TopicChart.tsx
│   │   ├── DifficultyChart.tsx
│   │   └── SettingsView.tsx
│   └── services/
│       ├── storage.ts   # Chrome storage wrapper
│       ├── leetcode.ts  # LeetCode GraphQL client
│       ├── github.ts    # GitHub REST API client
│       ├── revision.ts  # Spaced repetition scheduler
│       └── analytics.ts # Stats computation
├── icons/
├── manifest.json
├── scripts/
│   └── postbuild.mjs
└── dist/               # Loaded into Chrome
```

---

## 🤝 Contributing

Pull requests welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT © 2026
