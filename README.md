# Trackr ⚡

A premium mobile-first **Habit + Savings** personal productivity web app.

## Features

- 🎯 **Habit Tracking** — Good habits & avoidance habits, Simple/Count/Duration types, Daily/Weekdays/Weekly/Monthly frequencies
- 🔥 **Streak Tracking** — Current streak, best streak, completion rate with proper scheduled-day calculations
- 💰 **Savings Goals** — Multiple goals, quick deposits, withdrawals, transaction history, projections
- 📊 **Insights** — Weekly trends, habit analytics, savings statistics, weekly review
- 🌙 **Dark/Light/System theme** — Premium dark-first design
- 📱 **PWA** — Installable, works offline after first load
- 🔒 **100% Local** — All data in IndexedDB. No account, no cloud, no tracking.

## Tech Stack

- React 18 + TypeScript + Vite
- Dexie.js (IndexedDB)
- Recharts (analytics)
- React Router v6 (HashRouter for GitHub Pages)
- vite-plugin-pwa

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/trackr/

## Build for Production

```bash
npm install
npm run build
```

Output goes to `dist/`. Preview with:
```bash
npm run preview
```

## Data Storage

All data is stored in your browser's IndexedDB (`TrackrDB`). No data ever leaves your device.

**Export** your data from Settings → Export Data → `trackr-backup.json`

**Import** previously exported data from Settings → Import Data

## Deploy to GitHub Pages

1. Push to GitHub
2. Go to Settings → Pages → Source: GitHub Actions
3. The included `.github/workflows/deploy.yml` handles automatic deployment

The app will be available at `https://USERNAME.github.io/trackr/`

## Privacy

No analytics. No tracking. No ads. No external API calls. No account required.
