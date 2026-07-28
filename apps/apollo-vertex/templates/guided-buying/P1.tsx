"use client";

import type { ReactNode } from "react";
import { useTier } from "./tier-context";

/** Renders children only when the active tier is P1. */
export function P1({ children }: { children: ReactNode }) {
  const { tier } = useTier();
  if (tier !== "p1") return null;
  return <>{children}</>;
}
