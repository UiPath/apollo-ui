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
  // Default collapsed (orb): the catalog page already carries the agent's work
  // (intent line, Picked-for-you, filter chips), so the rail steps back until
  // re-summoned. Honors a manual expand once set this session.
  const [pref, setPref] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) === "1";
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
