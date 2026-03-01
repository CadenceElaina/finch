# Finch

A Google Finance-inspired market intelligence dashboard with AI-powered research, built with React, TypeScript, and Vite.

> **Live demo:** [finch-app.vercel.app](https://finch-app.vercel.app) — auto-switches to demo mode if API limits are reached.

---

## Features

### Market Data

- **Market Overview** — Live index cards across US, Europe, Asia, Currencies, and Crypto exchanges
- **Stock Quotes** — Interactive multi-interval charts (1D / 5D / 1M / 6M / YTD / 1Y / 5Y / MAX) via Recharts
- **Market Trends** — Most Active, Gainers, Losers, and Trending tickers
- **Symbol Search** — Autocomplete with live price data from Yahoo Finance

### AI Research (Gemini)

- **AI Market Overview** — Daily AI-generated market summary using Google Search grounding for real-time data
- **Stock Snapshot** — Per-symbol AI analysis with date-locked caching (1 generation/day/symbol)
- **Research Chat** — Multi-turn AI conversation powered by Gemini 2.5 Flash with web access
- **Portfolio Commentary** — AI-generated insights based on your actual holdings
- **Credit System** — 10 AI credits/day with visual fuel gauge, resets at midnight

### Portfolio & Watchlists

- **Portfolios** — Track up to 3 portfolios with holdings, cost basis, and real-time gain/loss
- **Watchlists** — Create up to 3 watchlists to follow stocks with live prices
- **All data stored locally** — localStorage, no accounts, no backend

### News

- **Financial News** — Seeking Alpha feed with Top/Local/World segment filters
- **Ticker Extraction** — Article cards show related ticker chips resolved from API relationships
- **Per-Symbol News** — Dedicated news feed on every quote page

### Demo Mode

- Auto-activates on API rate limits (429/403) or consecutive failures
- Static data for popular tickers (AAPL, GOOGL, MSFT, AMZN, TSLA, NVDA, META)
- Persistent "DEMO" badge in header — clickable to toggle in Settings

---

## Tech Stack

| Layer         | Choice                                    |
| ------------- | ----------------------------------------- |
| Frontend      | React 18 + TypeScript 5.2                 |
| Build         | Vite 5                                    |
| Routing       | React Router v6                           |
| Data Fetching | TanStack Query (React Query)              |
| State         | React Context                             |
| Charts        | Recharts                                  |
| AI            | Google Gemini 2.5 Flash (`@google/genai`) |
| UI Components | Material UI + react-icons                 |
| Market Data   | Yahoo Finance via RapidAPI                |
| News          | Seeking Alpha via RapidAPI                |
| Deployment    | Vercel                                    |

---

## Architecture

```
Client (React SPA)
  ├── Yahoo Finance API (quotes, charts, movers)
  ├── Seeking Alpha API (news, articles)
  ├── Google Gemini API (AI research)
  └── localStorage (portfolios, watchlists, credits, cache)
```

### Key Design Decisions

- **Dual API strategy** — YH Finance for quotes/charts, Seeking Alpha for news. Client-side caching with TTLs via TanStack Query + localStorage to stay within 500 req/mo per API.
- **Demo mode fallback** — Automatic detection of rate limits triggers seamless switch to static demo data. Users see a persistent badge and can toggle in Settings.
- **AI credit system** — 10 credits/day per user, tracked in localStorage. Fuel gauge in the header provides at-a-glance visibility. Supports grounded (web-search) and non-grounded generation.
- **Single chat thread** — AI research chat persists across all pages in React context, not per-symbol.

---

## Getting Started

```bash
git clone https://github.com/your-username/finch.git
cd finch
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_YH_FINANCE_KEY=your_rapidapi_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Both APIs use a single RapidAPI key. The Gemini key is from [Google AI Studio](https://aistudio.google.com/apikey) (free tier).

If no keys are provided, Finch automatically runs in demo mode with static sample data.

---

## Project Structure

```
src/
├── components/
│   ├── ai/              # Gemini-powered panels (MarketOverview, StockSnapshot, ResearchChat)
│   ├── layout/          # Layout shell, Sidebar, SidebarItem
│   ├── left-column/     # Watchlist, HomeNews, article components
│   ├── market-trends/   # Gainers, Losers, MostActive, Trending, SidebarNews
│   ├── markets/         # IndexCards, Markets container
│   ├── modals/          # Add portfolio/watchlist/security modals
│   ├── news/            # Shared ArticleCard component
│   ├── portfolio/       # Portfolio page, PortfolioContent, WatchlistPerformance
│   ├── quote-chart/     # Chart, RelatedStocks, QuoteNews
│   ├── search/          # Autocomplete search with quote data
│   ├── slider/          # DiscoverMore carousel
│   └── table/           # Reusable data table
├── config/              # API clients (YH Finance, Seeking Alpha, Gemini)
├── context/             # React Context providers (AI, Demo, Portfolios, Watchlists, News)
├── data/demo/           # Static demo data (quotes, movers, indexes, news)
├── hooks/               # Custom hooks
├── pages/               # Route pages (Home, Quote, News, Settings, Portfolio, footer pages)
├── services/            # AI credits, storage utilities
├── types/               # Shared TypeScript types
└── utils/               # Formatting helpers (currency, percent, large numbers)
```

---

## License

MIT
