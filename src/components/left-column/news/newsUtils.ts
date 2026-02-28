import { QueryClient } from "@tanstack/react-query";
// News will be migrated to Seeking Alpha API in a future step.
// For now these functions return empty arrays to avoid build errors.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _calculateTimeDifference = (pubDate: string): string => {
  const currentDate = new Date();
  const publishedDate = new Date(pubDate);
  const timeDifference = currentDate.getTime() - publishedDate.getTime();
  const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

  if (hoursDifference < 24) {
    return `${hoursDifference} hours ago`;
  } else {
    const days = Math.floor(hoursDifference / 24);
    const remainingHours = hoursDifference % 24;
    return `${days} day${days > 1 ? "s" : ""} ${remainingHours} hours ago`;
  }
};

// TODO: Migrate to Seeking Alpha news API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getSymbolsNews = async (_symbol: string) => {
  return [];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNews = async (_queryClient: QueryClient) => {
  return [];
};
