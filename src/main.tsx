import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.tsx";
import { PortfoliosProvider } from "./context/PortfoliosContext.tsx";
import { NewsProvider } from "./context/NewsContext.tsx";
import { WatchlistsProvider } from "./context/WatchlistContext.tsx";
import { IndexQuotesProvider } from "./context/IndexQuotesContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <PortfoliosProvider>
          <WatchlistsProvider>
            <QueryClientProvider client={queryClient}>
              <IndexQuotesProvider>
                <NewsProvider>
                  <App />
                </NewsProvider>
              </IndexQuotesProvider>
              {/*      <ReactQueryDevtools /> */}
            </QueryClientProvider>
          </WatchlistsProvider>
        </PortfoliosProvider>
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);
