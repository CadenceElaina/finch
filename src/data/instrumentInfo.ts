/**
 * Hardcoded about descriptions and market-category groupings for indexes,
 * crypto, and currencies.  Keeps the quote page rich without extra API calls.
 */

// ── Market-category symbol maps (mirrors Markets.tsx) ──────────────────
export type MarketCategory = "US" | "Europe" | "Asia" | "Currencies" | "Crypto";

/** Canonical symbol → category mapping.  Symbols are stored exactly as
 *  Yahoo Finance uses them (with ^ for indexes, =X for fx, -USD for crypto). */
export const MARKET_CATEGORY_SYMBOLS: Record<MarketCategory, string[]> = {
  US:         ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"],
  Europe:     ["^GDAXI", "^FTSE", "^FCHI", "^IBEX", "^STOXX50E"],
  Asia:       ["^N225", "000001.SS", "^HSI", "^BSESN", "^NSEI"],
  Crypto:     ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "DOGE-USD"],
  Currencies: ["EURUSD=X", "JPY=X", "GBPUSD=X", "CAD=X", "AUDUSD=X"],
};

/** Resolve the market category a symbol belongs to (if any). */
export function getMarketCategory(symbol: string): MarketCategory | null {
  const upper = symbol.toUpperCase();
  for (const [cat, syms] of Object.entries(MARKET_CATEGORY_SYMBOLS)) {
    if (syms.some((s) => normalizeSymbol(s) === normalizeSymbol(upper))) {
      return cat as MarketCategory;
    }
  }
  return null;
}

/** Get peer symbols for a given symbol (same category, excluding itself). */
export function getPeerSymbols(symbol: string): string[] {
  const cat = getMarketCategory(symbol);
  if (!cat) return [];
  return MARKET_CATEGORY_SYMBOLS[cat].filter(
    (s) => normalizeSymbol(s) !== normalizeSymbol(symbol)
  );
}

/** Normalize a symbol for comparison (strip ^, uppercase) */
function normalizeSymbol(s: string): string {
  return s.replace(/^\^/, "").toUpperCase();
}

/** Check if a symbol is a non-stock instrument (index, crypto, currency) */
export function isInstrument(symbol: string): boolean {
  return getMarketCategory(symbol) !== null;
}

// ── Hardcoded About descriptions ───────────────────────────────────────
/** Keyed by the stripped/uppercase symbol (no ^ prefix). */
export const INSTRUMENT_ABOUT: Record<string, string> = {
  // ── US Indexes ──
  DJI:
    "The Dow Jones Industrial Average, Dow Jones, or simply the Dow, is a stock market index of 30 prominent companies listed on stock exchanges in the United States. The DJIA is one of the oldest and most commonly followed equity indices. It is price-weighted, unlike other common indices such as the Nasdaq Composite or S&P 500, which use market capitalization. The primary pitfall of this approach is that a stock's price—not the size of the company—determines its relative importance in the index. For example, as of March 2025, Goldman Sachs represented the largest component of the index with a market capitalization of ~$167B. In contrast, Apple's market capitalization was ~$3.3T at the time, but it fell outside the top 10 components in the index. The DJIA also contains fewer stocks than many other major indices, which could heighten risk due to stock concentration. However, some investors believe it could be less volatile when the market is rapidly rising or falling due to its components being well-established large-cap companies.",

  GSPC:
    "S&P 500 is a stock market index tracking the stock performance of 500 leading companies listed on stock exchanges in the United States. It is one of the most commonly followed equity indices and includes approximately 80% of the total market capitalization of U.S. public companies, with an aggregate market cap of more than $61.1 trillion as of December 31, 2025. The S&P 500 index is a public float weighted/capitalization-weighted index. The ten largest companies on the list of S&P 500 companies account for approximately 38% of the market capitalization of the index and the 50 largest components account for 60% of the index. As of January 2026, the 10 largest components are, in order of highest to lowest weighting: Nvidia, Alphabet, Apple, Microsoft, Amazon, Broadcom, Meta Platforms, Tesla, Berkshire Hathaway, and Lilly. The components that have increased their dividends in 25 consecutive years are known as the S&P 500 Dividend Aristocrats. Companies in the S&P 500 derive a collective 72% of revenues from the United States and 28% from other countries.",

  IXIC:
    "The NASDAQ Composite is a stock market index that includes almost all stocks listed on the Nasdaq stock exchange. Along with the Dow Jones Industrial Average and S&P 500, it is one of the three most-followed stock market indices in the United States. The composition of the NASDAQ Composite is heavily weighted towards companies in the information technology sector. The Nasdaq-100, which includes 100 of the largest non-financial companies in the Nasdaq Composite, accounts for about 80% of the index weighting of the Nasdaq Composite. The Nasdaq Composite is a capitalization-weighted index; its price is calculated by taking the sum of the products of closing price and index share of all of the securities in the index. The sum is then divided by a divisor which reduces the order of magnitude of the result.",

  RUT:
    "The Russell 2000 Index is a small-cap U.S. stock market index that is made up of the smallest 2,000 stocks in the Russell 3000 Index. It was started by the Frank Russell Company in 1984. The index is maintained by FTSE Russell, a subsidiary of the London Stock Exchange Group.",

  VIX:
    'VIX is the ticker symbol and popular name for the Chicago Board Options Exchange\'s CBOE Volatility Index, a popular measure of the stock market\'s expectation of volatility based on S&P 500 index options. It is calculated and disseminated on a real-time basis by the CBOE, and is often referred to as the fear index or fear gauge. The VIX traces its origin to the financial economics research of Menachem Brenner and Dan Galai. In a series of papers beginning in 1989, Brenner and Galai proposed the creation of a series of volatility indices, beginning with an index on stock market volatility, and moving to interest rate and foreign exchange rate volatility. Brenner and Galai proposed, "[the] volatility index, to be named \'Sigma Index\', would be updated frequently and used as the underlying asset for futures and options."',

  // ── European Indexes ──
  GDAXI:
    "The DAX is a stock market index consisting of the 40 major German blue chip companies trading on the Frankfurt Stock Exchange. It is a total return index. Prices are taken from the Xetra trading venue. According to Deutsche Börse, the operator of Xetra, DAX measures the performance of the Prime Standard's 40 largest German companies in terms of order book volume and market capitalization.",

  FTSE:
    "The FTSE 100 Index is a share index of the 100 companies listed on the London Stock Exchange with the highest market capitalization. It is seen as a gauge of prosperity for businesses regulated by UK company law. The index is maintained by the FTSE Group, a subsidiary of the London Stock Exchange Group.",

  FCHI:
    "The CAC 40 is a benchmark French stock market index. The index represents a capitalization-weighted measure of the 40 most significant stocks among the 100 largest market caps on the Euronext Paris. It is one of the main national indices of the pan-European stock exchange group Euronext alongside Brussels' BEL20, Lisbon's PSI-20, and Amsterdam's AEX.",

  IBEX:
    "The IBEX 35 is the benchmark stock market index of the Bolsa de Madrid, Spain's principal stock exchange. It is a market capitalization weighted index comprising the 35 most liquid Spanish stocks traded in the Madrid Stock Exchange General Index.",

  STOXX50E:
    "The EURO STOXX 50 is a stock index of Eurozone stocks designed by STOXX, an index provider owned by Deutsche Börse Group. The index is composed of 50 stocks from 8 Eurozone countries. It is one of the most liquid indices for the Eurozone and is used as a basis for various investment products.",

  // ── Asian Indexes ──
  N225:
    "The Nikkei 225, or the Nikkei Stock Average, more commonly called the Nikkei or the Nikkei index, is a stock market index for the Tokyo Stock Exchange. It has been calculated daily by the Nihon Keizai Shimbun newspaper since 1950. It is a price-weighted index, operating in the Japanese yen, and its components are reviewed once a year.",

  "000001.SS":
    "The SSE Composite Index is a stock market index of all stocks that are traded at the Shanghai Stock Exchange. It is the most commonly used indicator to reflect the market performance of the Shanghai Stock Exchange.",

  HSI:
    "The Hang Seng Index is a freefloat-adjusted market-capitalization-weighted stock-market index in Hong Kong. It is used to record and monitor daily changes of the largest companies of the Hong Kong stock market and is the main indicator of the overall market performance in Hong Kong.",

  BSESN:
    "The SENSEX, also called the BSE 30 or the Bombay Stock Exchange Sensitive Index, is a free-float market-weighted stock market index of 30 well-established and financially sound companies listed on the Bombay Stock Exchange. It is one of the oldest and most widely followed indexes in India.",

  NSEI:
    "The NIFTY 50 is a benchmark Indian stock market index that represents the weighted average of 50 of the largest Indian companies listed on the National Stock Exchange. It is one of the two main stock indices used in India, the other being the SENSEX.",

  // ── Crypto ──
  "BTC-USD":
    "Bitcoin is a decentralized digital currency that can be transferred on the peer-to-peer bitcoin network. Bitcoin transactions are verified by network nodes through cryptography and recorded in a publicly distributed ledger called a blockchain. The cryptocurrency was invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto. It was released as open-source software in 2009. Bitcoin has been described as an economic bubble by multiple Nobel Memorial Prize in Economic Sciences recipients.",

  "ETH-USD":
    "Ethereum is a decentralized blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform. Among cryptocurrencies, ether is second only to bitcoin in market capitalization. Ethereum was conceived in 2013 by programmer Vitalik Buterin. Additional founders of Ethereum included Gavin Wood, Charles Hoskinson, Anthony Di Iorio, and Joseph Lubin.",

  "SOL-USD":
    "Solana is a blockchain platform which uses a proof-of-stake mechanism to provide smart contract functionality. Its native cryptocurrency is SOL. Solana was launched in 2020 by Solana Labs, founded by Anatoly Yakovenko and Raj Gokal. The Solana blockchain is designed for high throughput, claiming to process over 65,000 transactions per second.",

  "XRP-USD":
    "XRP is the native cryptocurrency of the XRP Ledger, created by Ripple Labs. Unlike Bitcoin, which uses proof-of-work mining, the XRP Ledger uses a consensus protocol among a network of validating servers to verify transactions. XRP is used for fast, low-cost international payments and has been adopted by various financial institutions for cross-border settlement.",

  "DOGE-USD":
    "Dogecoin is a cryptocurrency created by software engineers Billy Markus and Jackson Palmer, who decided to create a payment system as a joke, making fun of the wild speculation in cryptocurrencies at the time. It is considered both the first \"meme coin\", and more specifically the first \"dog coin\". Despite its satirical nature, some consider it a legitimate investment prospect. Dogecoin features the face of Kabosu from the \"doge\" meme as its logo and namesake. It was introduced on December 6, 2013, and quickly developed its own online community.",

  // ── Currencies ──
  "EURUSD=X":
    "The euro is the official currency of 21 of the 27 member states of the European Union. This group of states is officially known as the euro area or, more commonly, the eurozone. The euro is divided into 100 euro cents. It is the second-largest reserve currency as well as the second-most traded currency in the world after the United States dollar. As of December 2019, with more than €1.3 trillion in circulation, the euro has one of the highest combined values of banknotes and coins in circulation in the world.",

  "JPY=X":
    "The yen is the official currency of Japan. It is the third-most traded currency in the foreign exchange market, after the United States dollar and the euro. It is also widely used as a third reserve currency after the US dollar and the euro. The New Currency Act of 1871 introduced Japan's modern currency system, with the yen defined as 1.5 g of gold, or 24.26 g of silver, and divided decimally into 100 sen or 1,000 rin.",

  "GBPUSD=X":
    "Sterling is the currency of the United Kingdom and nine of its associated territories. The pound is the main unit of sterling, and the word pound is also used to refer to the British currency generally, often qualified in international contexts as the British pound or the pound sterling. Sterling is the world's oldest currency in continuous use since its inception. In 2022, it was the fourth-most-traded currency in the foreign exchange market.",

  "CAD=X":
    "The Canadian dollar is the currency of Canada. It is abbreviated with the dollar sign $. It is divided into 100 cents. Owing to the image of a common loon on its reverse, the dollar coin, and sometimes the unit of currency itself, may be referred to as the loonie by English-speaking Canadians. Accounting for approximately two per cent of all global reserves, as of January 2024 the Canadian dollar is the fifth-most held reserve currency in the world.",

  "AUDUSD=X":
    "The Australian dollar is the official currency and legal tender of Australia, including all of its external territories, and three independent Pacific Island nations: Kiribati, Nauru, and Tuvalu. It is abbreviated with the dollar sign $, and sometimes A$ to distinguish it from other dollar-denominated currencies. The Australian dollar is the fifth-most-traded currency in the world's foreign exchange markets.",
};

/** Look up the about text for a symbol. Tries raw key, stripped ^, and uppercase. */
export function getInstrumentAbout(symbol: string): string | null {
  const s = symbol.toUpperCase();
  return (
    INSTRUMENT_ABOUT[s] ??
    INSTRUMENT_ABOUT[s.replace(/^\^/, "")] ??
    null
  );
}

/** Category display labels */
export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  US: "Index",
  Europe: "Index",
  Asia: "Index",
  Crypto: "Cryptocurrency",
  Currencies: "Currency",
};
