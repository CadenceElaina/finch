import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortfoliosProvider } from "./context/PortfoliosContext.tsx";
import { NewsProvider } from "./context/NewsContext.tsx";
import { WatchlistsProvider } from "./context/WatchlistContext.tsx";
import { IndexQuotesProvider } from "./context/IndexQuotesContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { DemoModeProvider } from "./context/DemoModeContext.tsx";
import { AiProvider } from "./context/AiContext.tsx";
import { SnapshotProvider } from "./context/SnapshotContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
    <DemoModeProvider>
      <AiProvider>
        <NotificationProvider>
        <PortfoliosProvider>
            <WatchlistsProvider>
              <QueryClientProvider client={queryClient}>
                <SnapshotProvider>
                <IndexQuotesProvider>
                  <NewsProvider>
                    <App />
                  </NewsProvider>
                </IndexQuotesProvider>
                </SnapshotProvider>
                {/*      <ReactQueryDevtools /> */}
              </QueryClientProvider>
            </WatchlistsProvider>
          </PortfoliosProvider>
      </NotificationProvider>
      </AiProvider>
    </DemoModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
