"use client";

import type { ReactNode } from "react";
import { useTier } from "./tier-context";

/** Renders children only when the active tier is P2. */
export function P2({ children }: { children: ReactNode }) {
  const { tier } = useTier();
  if (tier !== "p2") return null;
  return <>{children}</>;
}
