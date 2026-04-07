# Finch

A Google Finance-inspired market intelligence dashboard with AI-powered research capabilities, built with React, TypeScript, and Vite. Features a 4-tier API fallback chain with circuit breakers, request deduplication, Gemini-powered AI analysis, and a full demo mode that activates automatically when API limits are reached.

> **Live demo:** [finch-jade.vercel.app](https://finch-jade.vercel.app) — click **DEMO** in the header or let it auto-activate.

---

## Highlights

- **4-tier API cascade** with per-provider circuit breakers and request deduplication
- **AI research** powered by Gemini 2.5 Flash — market overview, stock snapshots, multi-turn chat, portfolio commentary
- **TradingView charts** (lightweight-charts) with area, candlestick, and volume modes across 8 time intervals
- **Portfolio analytics** — sector look-through for ETFs, return attribution, risk metrics, concentration warnings
- **Morning cron job** — Vercel Cron pre-warms Redis with market snapshot at 5 AM ET (before premarket) → instant page loads
- **Zero backend for user data** — portfolios, watchlists, preferences, AI credits all in localStorage
- **Seamless demo mode** — auto-detects rate limits, switches to static data with full UI functionality

---

## Features

### Market Data

- **Live Quotes** — Real-time prices for stocks, ETFs, crypto, and market indexes
- **Interactive Charts** — 1D / 5D / 1M / 6M / YTD / 1Y / 5Y / MAX with line, candlestick, and volume views (TradingView lightweight-charts)
- **Market Trends** — Most Active, Gainers, Losers, and Trending tickers with sparkline charts
- **Index Cards** — S&P 500, Dow, NASDAQ, Russell 2000, VIX with intraday sparklines
- **Compare Markets** — US, Europe, Asia, Currencies, and Crypto tabs
- **Symbol Search** — Autocomplete with debounced API lookups, recent searches, and popular tickers

### AI Research (Gemini 2.5 Flash)

- **Market Overview** — Daily AI-generated market summary using Google Search grounding for real-time data (1hr cache)
- **Stock Snapshot** — Per-symbol AI analysis with date-locked caching (1 generation/day/symbol)
- **Research Chat** — Multi-turn conversation with web search access, persistent across pages
- **Portfolio Commentary** — AI insights generated from your actual holdings and performance data
- **Credit System** — 10 AI credits/day with visual fuel gauge, resets at local midnight

### Portfolio & Watchlists

- **Portfolios** — Up to 3 user portfolios with cost basis, gain/loss, and XIRR calculations
- **Portfolio Analysis** — Sector breakdown with ETF look-through, asset type allocation, return attribution bar chart, risk & fundamentals (beta, concentration, dividend yield, P/E)
- **Performance Chart** — Historical portfolio value timeline (Recharts)
- **Watchlists** — Up to 3 watchlists with sortable tables and sparklines
- **Demo Portfolios** — 3 pre-built portfolios (Core ETFs, Growth & Crypto, Dividends & Value) + 1 demo watchlist — don't count against user limits

### News

- **Financial News** — Seeking Alpha feed with Top / Local / World segment filters
- **Ticker Chips** — Article cards display related ticker symbols resolved from API
- **Per-Symbol News** — Dedicated news feed on every quote page

### Demo Mode

- Auto-activates on HTTP 429/403 or consecutive API failures
- Static data for 30+ tickers with realistic quotes, charts, financials, and news
- Persistent **DEMO** badge in header — toggle in Settings
- Full functionality: portfolios, watchlists, charts, analysis all work in demo mode

### Appearance

- **Light / Dark theme** — Toggle in header or Settings, persisted to localStorage
- **CSS custom properties** — All colors via `:root` design tokens, no hardcoded hex

---

## Tech Stack

| Layer         | Choice                                                  |
| ------------- | ------------------------------------------------------- |
| Frontend      | React 18 + TypeScript 5.2                               |
| Build         | Vite 5                                                  |
| Routing       | React Router v6                                         |
| Data Fetching | TanStack Query 5 (React Query)                          |
| State         | 9 React Context providers                               |
| Charts        | lightweight-charts 4 (TradingView) + Recharts 2 + MUI X Charts |
| AI            | Google Gemini 2.5 Flash (`@google/genai`)               |
| UI            | Material UI 5 + react-icons                             |
| Market Data   | 4 Yahoo Finance providers via RapidAPI (4-tier cascade) |
| News          | Seeking Alpha via RapidAPI                              |
| Serverless    | Vercel Serverless Functions (Edge + Node.js runtimes)  |
| Cron          | Vercel Cron (weekday 5 AM ET pre-market snapshot)      |
| Cache         | Redis Cloud (server) + localStorage with TTLs (client)  |
| Deployment    | Vercel                                                  |

---

## Architecture

```
                          ┌──────────────────────────────────────────┐
                          │           Vercel Cron (5 AM ET)          │
                          │   api/cron/morning-snapshot.ts           │
                          │   Fetches indices + movers → Redis      │
                          └──────────────────┬───────────────────────┘
                                             │
┌─────────────┐    ┌─────────────────────────▼───────────────────────────────┐
│             │    │              Vercel Serverless Functions                 │
│   React     │◄──►│  /api/yh-finance    (YH Finance 166 proxy)    [Edge]   │
│   SPA       │    │  /api/apidojo       (ApiDojo YF v1 proxy)     [Edge]   │
│             │    │  /api/yf-realtime   (YF Real Time proxy)      [Edge]   │
│  localhost  │    │  /api/yf15          (Yahoo Finance 15 proxy)   [Edge]   │
│  :5173      │    │  /api/seeking-alpha (Seeking Alpha proxy)     [Edge]   │
│             │    │  /api/snapshot      (Redis → client)          [Node]   │
└──────┬──────┘    └─────────────────────────────────────────────────────────┘
       │
       ├── TanStack Query (stale/gc TTLs per endpoint)
       ├── Circuit Breaker (10min cooldown per provider)
       ├── Request Deduplication (shared in-flight promises)
       ├── Google Gemini API (AI research, 3 generation modes)
       └── localStorage (portfolios, watchlists, credits, caches)
```

### API Cascade (yhFetch)

```
Request → YH Finance 166 ──(429/403)──→ ApiDojo YF v1 ──(429/403)──→ YF Real Time ──(429/403)──→ Yahoo Finance 15 → throw
              │                              │                            │                              │
         Circuit Breaker              Circuit Breaker             Circuit Breaker              Circuit Breaker
         (10min cooldown)             (10min cooldown)            (10min cooldown)             (10min cooldown)
```

Each provider has independent circuit breaker state. In-flight request deduplication prevents duplicate API calls when multiple components mount simultaneously. The YF15 fallback uses sequential single-ticker requests (no batch support) and stops on first failure.

### Key Design Decisions

- **4-tier API cascade** — Four Yahoo Finance providers with automatic failover. When all exhaust, graceful fallback to demo mode. Total budget: ~2,000 req/month.
- **Request deduplication** — Identical in-flight requests share a single Promise via a Map keyed on `endpoint?sortedParams`. Prevents 6+ components from making duplicate API calls on page load.
- **Morning cron snapshot** — Weekday 5 AM ET cron pre-warms Redis Cloud with indices, movers, and trending tickers before premarket opens. Client reads from `/api/snapshot` for instant page loads, falling back to live API if stale.
- **ETF sector look-through** — Portfolio sector analysis distributes each ETF's value across its underlying sector weights (from Seeking Alpha), rather than lumping all ETFs into one category.
- **AI credit system** — 10 credits/day per user, tracked in localStorage with local-midnight reset. Fuel gauge in header. Three Gemini modes: basic (no web), grounded (Google Search), and multi-turn chat.
- **Demo mode** — Not a separate code path. Same components, same hooks, same charts — just with static data injected at the fetch layer. Demo portfolios seeded on first visit with `isDemo` flag so they don't count against user limits.

---

## Getting Started

```bash
git clone https://github.com/CadenceElaina/finch.git
cd finch
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Without API keys, Finch runs in demo mode automatically.

### Environment Variables

Create a `.env` file in the project root:

```env
# RapidAPI key — used for all Yahoo Finance providers + Seeking Alpha
VITE_YH_FINANCE_KEY=your_rapidapi_key

# Google Gemini API key (from https://aistudio.google.com/apikey)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Both market data APIs use a single RapidAPI key. The Gemini key is from [Google AI Studio](https://aistudio.google.com/apikey) (free tier: 15 RPM).

**Production:** API keys are proxied through Vercel Edge Functions (`/api/yh-finance`, `/api/seeking-alpha`) — never exposed to the client. **Development:** `VITE_` prefixed keys are used directly.

### Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start Vite dev server         |
| `npm run build`   | Type-check + production build |
| `npm run lint`    | ESLint check                  |
| `npm run preview` | Preview production build      |

---

## Project Structure

```
src/
├── components/
│   ├── ai/              # Gemini panels (MarketOverview, StockSnapshot, ResearchChat, PortfolioSummary)
│   ├── layout/          # Header nav, Layout shell
│   ├── left-column/     # Home page left sidebar (watchlist, news)
│   ├── market-trends/   # Gainers, Losers, MostActive, Trending pages
│   ├── markets/         # IndexCards with sparklines, Markets compare tabs
│   ├── modals/          # Add-to-portfolio, add-to-watchlist modals
│   ├── news/            # Shared ArticleCard component
│   ├── portfolio/       # Portfolio & watchlist views, analysis, performance charts
│   ├── quote-chart/     # TradingView chart, financials, earnings, analyst ratings
│   ├── right-column/    # Home sidebar (portfolios, earnings calendar, most followed)
│   ├── search/          # Autocomplete search with ARIA combobox
│   └── table/           # Reusable sortable data table with sparklines
├── config/              # API clients (api.ts, yf15Api.ts, seekingAlphaApi.ts, gemini.ts)
├── context/             # 9 React Context providers
├── data/demo/           # Static demo data (quotes, charts, financials, news, movers, etc.)
├── pages/               # Route pages (Home, Quote, News, Markets, Settings, Portfolio)
├── services/            # AI credits, ETF holdings, financials, stock metadata, storage
├── types/               # Shared TypeScript interfaces
└── utils/               # Formatting utilities (currency, percent, XIRR calculator)

api/                     # Vercel Serverless Functions (API key proxies + cron)
```

---

## Deployment

Deployed on [Vercel](https://vercel.com) with:

- **Serverless Functions** for API key proxying — Edge runtime for proxies, Node.js for Redis snapshot
- **Cron job** (`vercel.json`) runs `api/cron/morning-snapshot.ts` at Mon–Fri 5:00 AM ET (pre-market)
- **Redis Cloud** stores the morning market snapshot for fast initial page loads
- **SPA fallback** — all routes serve `index.html`

---

## License

MIT
