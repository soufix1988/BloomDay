# 🌸 Bloom

**Your all-in-one life planner for wellness, productivity, health and personal growth.**

A cute, pink, all-in-one web app packed with tools for the modern girl.

## ✨ Tools (Milestone 1)

A live **Dashboard** plus 8 flagship tools:

| Tool | What it does |
|------|--------------|
| 🌸 Period Tracker | Log your cycle, predict next period, ovulation & fertile window |
| 📔 Journal | Mood-tagged daily diary entries |
| 💰 Budget Tracker | Income/expenses, balance & category breakdown chart |
| 😊 Mood Tracker | Daily mood check-ins with a 14-day trend chart |
| 🔥 Habit Tracker | Build habits with streaks & a weekly grid |
| 💧 Water Tracker | Hit your daily hydration goal |
| 📅 Planner | Day-by-day tasks with priorities & upcoming view |
| ✨ Goal Planner | Set goals, track progress & deadlines |

The **Dashboard** (`/`) pulls live data from every tool: today's mood, water,
cycle status, task progress, best habit streak, balance, upcoming events and a
daily quote. The marketing landing page lives at `/welcome`.

## 🏗️ Tech

- **React 19 + Vite** (SPA)
- **React Router** for navigation
- **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** for charts
- **lucide-react** icons

## 💾 Data storage

All tool data is currently persisted in the browser via a small storage
abstraction (`src/lib/storage.ts` + `src/hooks/useBloomState.ts`) — the
"memory navigator". Every tool reads/writes through this single interface, so
moving to **Supabase** later only requires changing that one layer, not the
tools themselves.

Shared data shapes & storage keys live in `src/data/schemas.ts`.

## 🚀 Develop

```bash
npm install
npm run dev      # start dev server
npm run build    # production build → dist/
npm run preview  # preview the build
```

Deployed on **Vercel** (static SPA, see `vercel.json`).
