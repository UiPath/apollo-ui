"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Tier = "p1" | "p2";

interface TierContextValue {
  tier: Tier;
  setTier: (t: Tier) => void;
}

const TierContext = createContext<TierContextValue>({
  tier: "p1",
  setTier: () => {},
});

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<Tier>("p1");

  useEffect(() => {
    const stored = localStorage.getItem("gb-tier");
    if (stored === "p1" || stored === "p2") setTierState(stored);
  }, []);

  const setTier = (t: Tier) => {
    setTierState(t);
    localStorage.setItem("gb-tier", t);
  };

  return (
    <TierContext.Provider value={{ tier, setTier }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  return useContext(TierContext);
}
