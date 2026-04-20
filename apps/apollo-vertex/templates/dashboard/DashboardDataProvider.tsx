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

const DashboardDataSeedContext = createContext<DashboardDataset>(ecommerceDataset);

export function useDashboardData() {
  return useContext(DashboardDataContext);
}

export function DashboardDataSeedProvider({
  children,
  dataset,
}: {
  children: ReactNode;
  dataset: DashboardDataset;
}) {
  return (
    <DashboardDataSeedContext.Provider value={dataset}>
      {children}
    </DashboardDataSeedContext.Provider>
  );
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const seed = useContext(DashboardDataSeedContext);
  const [data, setData] = useState<DashboardDataset>(seed);

  return (
    <DashboardDataContext.Provider value={{ data, setDataset: setData }}>
      {children}
    </DashboardDataContext.Provider>
  );
}
