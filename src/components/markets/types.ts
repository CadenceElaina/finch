export enum Exchange {
  US = "US",
  Europe = "Europe",
  Asia = "Asia",
  Currencies = "Currencies",
  Crypto = "Crypto",
}

export interface IndexCard {
  exchange: Exchange;
  name: string;
  symbol: string;
  percentChange: number;
  price: number;
  priceChange: number;
}

export interface IndexCardProps {
  cards: IndexCard[];
  currExchange: Exchange;
}
