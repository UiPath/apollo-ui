"use client";

import { createContext, useContext } from "react";
import { ecommerceDataset, type DashboardDataset } from "./dashboard-data";

export interface DashboardDataContextValue {
  data: DashboardDataset;
  setDataset: (data: DashboardDataset) => void;
}

export const DashboardDataContext = createContext<DashboardDataContextValue>({
  data: ecommerceDataset,
  setDataset: () => {
    throw new Error(
      "useDashboardData must be used within DashboardDataProvider",
    );
  },
});

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
