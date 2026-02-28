/**
 * Demo data barrel export.
 * Import everything from here: `import { DEMO_QUOTES, ... } from "../data/demo"`
 */

export { DEMO_QUOTES } from "./quotes";
export { DEMO_GAINERS, DEMO_LOSERS, DEMO_MOST_ACTIVE } from "./movers";
export type { DemoMoverData } from "./movers";
export { DEMO_TRENDING } from "./trending";
export type { DemoTrendingData } from "./trending";
export { DEMO_NEWS, DEMO_SYMBOL_NEWS } from "./news";
export { DEMO_CHART_DATA, getDemoChartData } from "./charts";
export type { DemoChartPoint } from "./charts";
export { DEMO_QUOTE_PAGE_DATA } from "./quotePageData";
export { isDemoActive, setDemoActive } from "./demoState";
