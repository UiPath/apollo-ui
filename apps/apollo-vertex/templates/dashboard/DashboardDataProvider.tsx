"use client";

import { useState, type ReactNode } from "react";
import { ecommerceDataset, type DashboardDataset } from "./dashboard-data";
import { DashboardDataContext } from "./dashboard-data-context";

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardDataset>(ecommerceDataset);

  return (
    <DashboardDataContext.Provider value={{ data, setDataset: setData }}>
      {children}
    </DashboardDataContext.Provider>
  );
}
