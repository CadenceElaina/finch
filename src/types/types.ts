import { ReactNode } from "react";

/* import { User } from "../context/AuthContext"; */
export interface User {
  token: string;
  username: string;
  name?: string;
  portfolios?: Portfolio[];
}

export interface Credentials {
  username: string;
  password: string;
}
export interface UserCredentials extends Credentials {
  name: string;
}

export type credentials = Credentials;

export type SnackbarType = "info" | "success" | "error" | "warning";
export interface Security {
  selected?: boolean;
  symbol: string;
  quantity: number;
  purchaseDate: string;
  purchasePrice: number;
}
export interface WatchlistSecurity {
  [x: string]: ReactNode;
  selected?: boolean;
  symbol: string;
  name?: string;
  price?: number;
  priceChange?: number;
  percentChange?: number;
}
export type MostFollowedSecurityWithoutDetails = Omit<
  Security,
  "purchaseDate" | "purchasePrice" | "quantity"
>;
export interface MostFollowedSecurities {
  symbol: string;
  name: string;
  followers: number;
  price?: number;
  priceChange?: number;
  percentChange?: number;
}
export interface Portfolio {
  id: string;
  title: string;
  author: string | undefined;
  securities?: Security[];
  portfolioValue?: Array<{ date: string; value: number }>;
}
export interface Watchlist {
  id: string;
  title: string;
  author: string | undefined;
  securities?: WatchlistSecurity[];
  selected?: boolean;
}
export interface Watchlists {
  id: string;
  title: string;
  securities: MostFollowedSecurities[] | undefined;
  author: string;
  user?: User;
}
// News
export enum NewsSegmentEnum {
  Top = "Top",
  Local = "Local",
  World = "World",
}

export type NewsSegmentType = "Top" | "Local" | "World";
export interface Article {
  id?: string;
  link: string;
  source: string;
  time: string;
  title: string;
  relatedSymbol: string;
  img?: string;
  segment?: NewsSegmentType | NewsSegmentType[];
}

export interface ArticleProps {
  articles: Article[];
  currNewsSegment?: NewsSegmentType;
  symbol?: string;
}

export const newsSegmentEnum = NewsSegmentEnum;
export type newsSegmentType = NewsSegmentType;
export type article = Article;
export type articleProps = ArticleProps;

// Portfolio utilities
export interface PortfolioSymbols {
  [portfolioTitle: string]: { [symbol: string]: number };
}
