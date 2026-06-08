import { useEffect, useState } from "react";

const STORAGE_KEY = "gb-rail-open";

export interface RailController {
  /** The user's manual open preference (persisted for the session). */
  open: boolean;
  /** Manual collapse (chevron). */
  collapse: () => void;
  /** Manual expand (launcher). */
  expand: () => void;
}

/**
 * Tracks the user's manual open/collapse preference for the docked assistant
 * rail, persisted for the session. Surfaces that need the right edge (cart,
 * compare) collapse the rail by deriving visibility from their own open state —
 * see `railVisible` in Selection — which restores the user's choice on close.
 */
export function useRail(): RailController {
  const [pref, setPref] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(STORAGE_KEY) !== "0";
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, pref ? "1" : "0");
  }, [pref]);

  return {
    open: pref,
    collapse: () => setPref(false),
    expand: () => setPref(true),
  };
}
