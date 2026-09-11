"use client";

import { createContext, useContext } from "react";
import type { DashboardDataset } from "./dashboard-data";
import { elenaDataset } from "./elena-data";

export interface DashboardDataContextValue {
  data: DashboardDataset;
  setDataset: (data: DashboardDataset) => void;
}

export const DashboardDataContext = createContext<DashboardDataContextValue>({
  data: elenaDataset,
  setDataset: () => {
    throw new Error(
      "useDashboardData must be used within DashboardDataProvider",
    );
  },
});

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
