/**
 * SnapshotContext — provides the pre-warmed market snapshot to all consumers.
 * Must be rendered inside QueryClientProvider (uses useQueryClient internally).
 *
 * Usage:
 *   const { snapshot, isStale } = useSnapshot();
 *   // If snapshot has indices, skip the live API call
 */

import React, { createContext, useContext } from "react";
import {
  useMarketSnapshot,
  SnapshotResult,
} from "../services/marketSnapshot";

const SnapshotContext = createContext<SnapshotResult | undefined>(undefined);

export const SnapshotProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const result = useMarketSnapshot();

  return (
    <SnapshotContext.Provider value={result}>
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshot = (): SnapshotResult => {
  const ctx = useContext(SnapshotContext);
  if (!ctx) {
    throw new Error("useSnapshot must be used within a SnapshotProvider");
  }
  return ctx;
};
