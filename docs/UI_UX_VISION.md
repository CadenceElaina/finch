# Finch — UI/UX Vision

> **Status:** Planning (to be implemented after all bugs are fixed and features are functional).

## Target Inspiration

**Google Finance (Beta)** layout & interaction model.

## Layout

### Left Panel (Collapsible)

- User's **watchlists** (editable, drag-reorder)
- User's **portfolios** (quick-glance P&L)
- Collapse to icons on smaller viewports

### Center (Main Content)

- **Market Overview** — index cards, sparkline charts (current `Markets` component)
- **Today's Financial News** — article cards with thumbnails, source, timestamp
- **AI Summary** — Gemini-powered daily/weekly market recap
- **Earnings Calendar** — upcoming & recent earnings for followed symbols
- **Top Stories** — curated/trending articles

### Right Panel / Tabs

- **Research** tab with Gemini AI chat (ask about a stock, get analysis)
- **Market Trends** widget (gainers/losers/most-active mini-table)
- **Most Followed** widget

### Quote Page (per-symbol)

- Price header + sparkline
- Interactive chart (1D / 5D / 1M / 6M / YTD / 1Y / 5Y)
- About section (company profile, CEO, employees, sector)
- Key financials (P/E, Market Cap, Dividend Yield, 52-wk range)
- Symbol-specific news feed
- Gemini AI analysis panel ("What do analysts think?", sentiment, etc.)

## Interaction Patterns

- **Search** — autocomplete with recent searches, keyboard navigation
- **Add to list** — quick-add from any quote card via `+` icon → modal picker
- **Responsive** — desktop-first, but graceful collapse for tablets
- **Theming** — dark/light toggle (already partially implemented via `ThemeToggle`)

## Implementation Order

1. Fix all bugs & ensure feature completeness (current phase)
2. Integrate Gemini API for analysis features
3. UI/UX revamp to match this vision
4. Additional features & testing
