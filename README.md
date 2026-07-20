# uCode — LeetCode Auto-Commit + Productivity Suite

> A Chrome Extension (Manifest V3) that auto-pushes your accepted LeetCode solutions to GitHub, schedules Anki-style revisions, and packs a full productivity dashboard — including a curated DSA Pattern Sheet.

---

## Project Structure

```
leetcode_extension/
├── leetcode-extension/ # Chrome Extension + React Dashboard (Vite)
│ ├── src/
│ │ ├── background/ # Service worker — LeetCode listener, GitHub push
│ │ ├── content/ # Content script injected on leetcode.com
│ │ ├── dashboard/ # Full React SPA (popup/dashboard UI)
│ │ │ ├── App.tsx # Root shell, sidebar navigation
│ │ │ ├── LandingPage.tsx # Public landing page
│ │ │ ├── AuthPage.tsx # Login / Sign-up (dual-backend)
│ │ │ ├── OverviewView.tsx # Stats overview
│ │ │ ├── JournalView.tsx # Coding journal
│ │ │ ├── RevisionView.tsx # Spaced-repetition revision system
│ │ │ ├── DSASheetView.tsx # DSA Pattern Sheet (new)
│ │ │ ├── FocusTimerView.tsx # Pomodoro focus timer
│ │ │ ├── TasksView.tsx # Daily task manager
│ │ │ ├── TimeTrackingView.tsx # Hour-by-hour time log
│ │ │ ├── AnalyticsView.tsx # Deep analytics charts
│ │ │ ├── AIInsightsView.tsx # AI-powered coaching (Groq)
│ │ │ ├── ReportsView.tsx # Exportable reports
│ │ │ ├── HeatmapView.tsx # GitHub-style contribution graph
│ │ │ └── SettingsView.tsx # GitHub token + settings
│ │ └── services/
│ │ ├── clario-api.ts # All Clario (productivity) API calls + cache
│ │ ├── ucode-api.ts # uCode backend API calls
│ │ ├── api-cache.ts # Stale-while-revalidate in-memory cache
│ │ └── storage-adapter.ts # chrome.storage ↔ localStorage adapter
│ ├── public/manifest.json
│ └── package.json
│
└── backend/ # Node.js / Express API (deployed on Vercel)
├── src/
│ ├── config/
│ │ ├── db.ts # Neon (PostgreSQL) via Drizzle ORM
│ │ ├── schema.ts # All table definitions
│ │ └── migrate.ts # Idempotent migration script
│ ├── controllers/
│ │ ├── authController.ts
│ │ ├── taskController.ts
│ │ ├── slotController.ts
│ │ ├── focusController.ts
│ │ ├── journalController.ts
│ │ ├── revisionController.ts
│ │ ├── analyticsController.ts
│ │ ├── aiController.ts
│ │ ├── reportController.ts
│ │ └── dsaController.ts # DSA Pattern Sheet CRUD (new)
│ ├── middleware/
│ │ ├── authMiddleware.ts # JWT verification
│ │ └── adminMiddleware.ts # Hardcoded admin gate (new)
│ ├── models/
│ │ └── DsaProblem.ts # Drizzle-based DSA problem model (new)
│ ├── routes/
│ │ └── dsaRoutes.ts # /api/dsa routes (new)
│ └── index.ts # Express app entry point
├── vercel.json
└── package.json
```

---

## Features

### LeetCode Auto-Commit
- Content script detects accepted submissions on `leetcode.com`
- Service worker fetches full solution via LeetCode GraphQL API
- Commits to GitHub under `LeetCode/[Topic]/[Problem]/Solution.[lang]`
- Zero manual effort required

### Spaced Repetition (Revision System)
- 7-stage Anki-style intervals: **1 → 3 → 7 → 15 → 30 → 60 → 120 days**
- Mark each problem as Remembered or Forgot
- Badge in sidebar shows count of problems due today

### Analytics Dashboard
- Difficulty breakdown (Easy / Medium / Hard)
- Topic radar chart
- Calendar heatmap (GitHub-style)
- Streak counter (current & longest)
- Average solve time per difficulty

### Coding Journal
- Auto-populated when a problem is solved
- Add personal notes, links, and reflections
- Searchable history

### DSA Pattern Sheet *(new)*
- **53+ curated problems** across 10 Dynamic Programming patterns
- Checkboxes per problem — progress stored per user in `localStorage`
- Search + difficulty filter
- Per-pattern progress bars + overall completion tracker
- **Admin-only** add / edit / delete (email: `admin@ucode.com`)
- "Newly Created" section for admins to review recent additions

### ⏱️ Productivity Time Tracker
- Log each hour of the day as **Productive**, **Neutral**, or **Wasted**
- Visual slot grid for the full day
- Historical view with daily/weekly summaries

### Focus Timer
- Built-in focus sessions with start / pause / stop
- Session history and daily stats
- Integrates with time tracking

### Task Manager
- Daily task list with completion tracking
- Lightweight — no drag-drop complexity

### AI Insights *(Groq-powered)*
- Pattern recognition across your solve history
- Personalized coaching tips
- Weakness identification by topic

### Reports
- Exportable daily / weekly performance reports
- Tabular history of time slots and focus sessions

---

## ️ Tech Stack

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3, Service Worker |
| Frontend | React 18, Vite, TypeScript |
| Styling | Vanilla CSS design system, `lucide-react` icons |
| Animations | `framer-motion` (minimised — only landing page) |
| Backend | Node.js, Express, TypeScript |
| Database | Neon (serverless PostgreSQL) via Drizzle ORM |
| Auth | JWT — dual backend (uCode + Clario/Productivity) |
| AI | Groq API (llama-3) |
| Deployment | Vercel (CLI deploy for backend) |
| Caching | In-memory stale-while-revalidate (`api-cache.ts`) |

---

## Installation (End User)

1. **Download** the `dist/` folder from [Google Drive](https://drive.google.com/drive/folders/1782kGZje5-djm6OoCpGxnYJ0Q4UklPac?usp=sharing)
2. Go to `chrome://extensions` → enable **Developer Mode** → **Load unpacked** → select the folder
3. Click the uCode icon → **Settings** → paste your GitHub Personal Access Token (scope: `repo`)
4. Enter your GitHub username and repo name → **Save**

---

## ️ Development Setup

### Frontend (Extension)
```bash
cd leetcode-extension
npm install
npm run dev # dashboard dev server (http://localhost:5173)
npm run build:web # build dashboard SPA
npm run build # build extension dist/
```

### Backend
```bash
cd backend
npm install
cp .env.example .env # fill in DATABASE_URL, JWT_SECRET, GROQ_API_KEY

npm run migrate # create all tables in Neon DB (idempotent)
npm run dev # local development server
```

### Backend Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `GROQ_API_KEY` | Groq API key for AI insights |
| `NODE_ENV` | `production` on Vercel |

### Deploy Backend to Vercel
```bash
cd backend
vercel --prod
```

### Seed DSA Problems
```bash
cd backend
node seed-dsa.mjs # inserts 53 DP problems via bulk admin API
```

---

## Admin Access (DSA Sheet)

The DSA Pattern Sheet has a single hardcoded admin account for managing problems:

| Field | Value |
|---|---|
| Email | `admin@ucode.com` |
| Password | `kartikADM15` |

Admin can: **add**, **edit**, **delete** problems, and see the **Newly Created** section.
All other users can only view and check off problems.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |

### DSA Pattern Sheet
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dsa` | Public | All problems grouped by pattern |
| `GET` | `/api/dsa/new?limit=15` | Public | Recently added problems |
| `POST` | `/api/dsa` | Admin | Create a problem |
| `POST` | `/api/dsa/bulk` | Admin | Bulk insert problems |
| `PUT` | `/api/dsa/:id` | Admin | Update a problem |
| `DELETE` | `/api/dsa/:id` | Admin | Delete a problem |

### Productivity (JWT required)
- `GET/POST /api/tasks` — Daily tasks
- `GET/POST /api/slots` — Time slot entries
- `GET/POST /api/focus` — Focus sessions
- `GET/POST /api/journal` — Coding journal
- `GET/POST /api/revision` — Revision topics & reviews
- `GET /api/analytics` — Aggregated stats
- `POST /api/ai/insights` — AI coaching
- `GET /api/reports` — Reports

---

## License

MIT License 2026 — Built with ️ for the DSA community.
