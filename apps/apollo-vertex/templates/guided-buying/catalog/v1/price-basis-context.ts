"use client";

import { createContext, useContext } from "react";
import type { PriceBasis } from "./types";

/**
 * The active price basis for the whole catalog surface. Components read this to
 * decide which price to show, so removing the EPP filter reverts prices
 * everywhere (grid, detail, cart, compare) without prop-drilling.
 */
const PriceBasisContext = createContext<PriceBasis>("epp");

export const PriceBasisProvider = PriceBasisContext.Provider;

export function usePriceBasis(): PriceBasis {
  return useContext(PriceBasisContext);
}
