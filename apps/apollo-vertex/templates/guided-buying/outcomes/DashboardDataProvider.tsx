"use client";

import { type ReactNode, useState } from "react";
import type { DashboardDataset } from "./dashboard-data";
import { DashboardDataContext } from "./dashboard-data-context";
import { elenaDataset } from "./elena-data";

export function DashboardDataProvider({
  children,
  initialDataset = elenaDataset,
}: {
  children: ReactNode;
  initialDataset?: DashboardDataset;
}) {
  const [data, setData] = useState<DashboardDataset>(initialDataset);

  return (
    <DashboardDataContext.Provider value={{ data, setDataset: setData }}>
      {children}
    </DashboardDataContext.Provider>
  );
}
