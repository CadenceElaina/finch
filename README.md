# Finch

A Google Finance-inspired market intelligence dashboard built with React, TypeScript, and Vite.

Track market indices, research stocks, manage watchlists and portfolios — with plans for AI-powered insights via Google Gemini.

## Features

- **Market Overview** — Live index cards (US, Europe, Asia, Currencies, Crypto)
- **Stock Quotes** — Interactive multi-interval charts (1D–MAX) via Recharts
- **Symbol Search** — Autocomplete powered by Alpha Vantage
- **Market Trends** — Most Active, Gainers, Losers, Trending
- **Watchlists** — Create and manage multiple watchlists
- **Portfolios** — Track holdings with gain/loss calculations
- **News** — Financial news feeds on home and quote pages
- **Dark Mode** — Theme toggle

## Tech Stack

| Layer         | Choice                       |
| ------------- | ---------------------------- |
| Frontend      | React 18 + TypeScript        |
| Build         | Vite                         |
| Routing       | React Router v6              |
| Data Fetching | TanStack Query (React Query) |
| State         | React Context + Zustand      |
| Charts        | Recharts                     |
| UI            | Material UI + react-icons    |
| Market Data   | Yahoo Finance via RapidAPI   |
| Search        | Alpha Vantage via RapidAPI   |

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file based on `.env.example` with your RapidAPI keys.

## Roadmap

See [docs/PLAN.md](docs/PLAN.md) for the full project plan.

**Current focus:** Phase 0 — stabilize the codebase, remove legacy backend dependency, clean up dead code.

**Planned:**

- Vercel Edge Function API proxy (hide API keys server-side)
- Vercel KV caching with morning market snapshot
- Demo mode with static data fallback
- AI research panel powered by Google Gemini 1.5 Flash
