"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultDataset, type DashboardDataset } from "./dashboard-data";

interface DashboardDataContextValue {
  data: DashboardDataset;
  setDataset: (data: DashboardDataset) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue>({
  data: defaultDataset,
  setDataset: () => {},
});

export function useDashboardData() {
  return useContext(DashboardDataContext);
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardDataset>(defaultDataset);

  return (
    <DashboardDataContext.Provider value={{ data, setDataset: setData }}>
      {children}
    </DashboardDataContext.Provider>
  );
}
