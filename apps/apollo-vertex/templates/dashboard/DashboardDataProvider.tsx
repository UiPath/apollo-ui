"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ecommerceDataset, type DashboardDataset } from "./dashboard-data";

interface DashboardDataContextValue {
  data: DashboardDataset;
  setDataset: (data: DashboardDataset) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue>({
  data: ecommerceDataset,
  setDataset: () => {},
});

export function useDashboardData() {
  return useContext(DashboardDataContext);
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardDataset>(ecommerceDataset);

  return (
    <DashboardDataContext.Provider value={{ data, setDataset: setData }}>
      {children}
    </DashboardDataContext.Provider>
  );
}
