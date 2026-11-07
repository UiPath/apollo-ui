"use client";

import { type RefCallback, useEffect, useState } from "react";

import {
  type DetailPageConfig,
  type DetailPagePanels,
  END_PANEL_DEFAULT_PX,
  END_PANEL_MIN_PX,
  enabledPanels,
  endPanelMaxWidth,
  type PanelClosedBy,
  type PanelIntent,
  type PanelSide,
  type PanelWidth,
  resolveEndWidth,
  resolvePanels,
  withLatest,
} from "./detail-page-rules";

const SIDES: readonly PanelSide[] = ["start", "end"];

interface IntentState extends PanelIntent {
  /** The panels setting this intent was last reconciled against. */
  panels: DetailPagePanels;
}

export interface DetailPageState {
  config: DetailPageConfig;
  /** What is actually open after the main-width rule. */
  open: Record<PanelSide, boolean>;
  /** Why each closed sidebar is closed. Null when open or disabled. */
  closedBy: Record<PanelSide, PanelClosedBy | null>;
  setPanelOpen: (side: PanelSide, open: boolean) => void;
  /** The end sidebar's rendered width in px, after the width rules. */
  endWidth: number;
  /** The width the user chose, px or "max". Kept as chosen when the window resizes. */
  endWidthChosen: PanelWidth;
  /** The current resize range, in px. Meaningful once `measured` is true. */
  endWidthRange: { min: number; max: number };
  /** Whether the page has been measured, so the width rules apply. */
  measured: boolean;
  /** Store a new chosen width. It is clamped to the current range first. */
  setEndWidth: (width: number) => void;
  /** Back to the end sidebar's default width. */
  resetEndWidth: () => void;
  /**
   * The sidebar whose user-driven open or close is animating, if any.
   * Only a real change from setPanelOpen animates.
   */
  transitioning: PanelSide | null;
  /** The page calls this when that sidebar's width transition ends. */
  settleTransition: (side: PanelSide) => void;
  /** Attach to the page root so the main-width rule can measure it. */
  ref: RefCallback<HTMLDivElement | null>;
}

export type {
  DetailPageConfig,
  DetailPagePanelConfig,
  DetailPagePanels,
  PanelPlacement,
  PanelSide,
  PanelWidth,
  ResizablePanelConfig,
} from "./detail-page-rules";

/**
 * The page's border-box width. Measured when the node attaches, then
 * followed with ResizeObserver. Both reads are layout widths, so a CSS
 * transform on a preview measures the same as an unscaled page.
 */
function useTemplateWidth(): [RefCallback<HTMLDivElement | null>, number] {
  const [width, setWidth] = useState(0);
  const ref: RefCallback<HTMLDivElement | null> = (node) => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const initial = node.offsetWidth;
    queueMicrotask(() => setWidth(initial));
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const inline = entry.borderBoxSize[0]?.inlineSize;
      setWidth(inline ?? entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  };
  return [ref, width];
}

/** Newly enabled sidebars take their defaultOpen. Disabled sidebars close. */
function reconcile(state: IntentState, config: DetailPageConfig): IntentState {
  const enabled = enabledPanels(config.panels);
  const wasEnabled = enabledPanels(state.panels);
  const wanted = { ...state.wanted };
  let openOrder = [...state.openOrder];
  let { lastOpened } = state;

  for (const side of SIDES) {
    if (enabled[side] && !wasEnabled[side] && config[side].defaultOpen) {
      wanted[side] = true;
      openOrder.push(side);
    }
    if (!enabled[side]) {
      wanted[side] = false;
      openOrder = openOrder.filter((entry) => entry !== side);
      if (lastOpened === side) lastOpened = null;
    }
  }
  return { wanted, openOrder, lastOpened, panels: config.panels };
}

function initialState(config: DetailPageConfig): IntentState {
  return reconcile(
    {
      wanted: { start: false, end: false },
      openOrder: [],
      lastOpened: null,
      panels: "none",
    },
    config,
  );
}

function applyPanelOpen(
  state: IntentState,
  side: PanelSide,
  open: boolean,
): IntentState {
  if (!enabledPanels(state.panels)[side]) return state;
  const others = state.openOrder.filter((entry) => entry !== side);
  if (open) {
    return {
      ...state,
      wanted: { ...state.wanted, [side]: true },
      openOrder: [...others, side],
      lastOpened: side,
    };
  }
  return {
    ...state,
    wanted: { ...state.wanted, [side]: false },
    openOrder: others,
    lastOpened: state.lastOpened === side ? null : state.lastOpened,
  };
}

/**
 * Owns a detail page's sidebar state. Pass the result to `DetailPage`.
 *
 * Only the user's intent is stored. What is open is derived from that
 * intent and the measured width, so a resize needs no extra updates and
 * sidebars the rule closed come back when there is room.
 */
export function useDetailPage(config: DetailPageConfig): DetailPageState {
  const [ref, width] = useTemplateWidth();
  const [state, setState] = useState(() => initialState(config));
  const [transitioning, setTransitioning] = useState<PanelSide | null>(null);
  const [endWidthChosen, setEndWidthChosen] = useState<PanelWidth>(
    () => config.end.defaultWidth ?? END_PANEL_DEFAULT_PX,
  );

  let intent = state;
  if (state.panels !== config.panels) {
    intent = reconcile(state, config);
    setState(intent);
  }

  const enabled = enabledPanels(config.panels);
  const resolved = resolvePanels(
    config.latest ? withLatest(intent, config.latest) : intent,
    width,
  );
  const closedBy = {
    start: enabled.start ? resolved.closedBy.start : null,
    end: enabled.end ? resolved.closedBy.end : null,
  };

  const setPanelOpen = (side: PanelSide, open: boolean) => {
    if (enabled[side] && resolved.open[side] !== open) setTransitioning(side);
    setState((prev) => applyPanelOpen(prev, side, open));
  };

  useEffect(() => {
    if (!transitioning) return;
    const timer = setTimeout(() => {
      setTransitioning((current) =>
        current === transitioning ? null : current,
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [transitioning]);

  const measured = width > 0;
  const endWidth = resolveEndWidth(endWidthChosen, width, resolved.open.start);
  const endMax = measured
    ? endPanelMaxWidth(width, resolved.open.start)
    : END_PANEL_MIN_PX;
  const setEndWidth = (next: number) => {
    if (!measured) return;
    const clamped = Math.round(
      Math.min(Math.max(next, END_PANEL_MIN_PX), endMax),
    );
    setEndWidthChosen(clamped >= endMax ? "max" : clamped);
  };

  return {
    config,
    open: resolved.open,
    closedBy,
    setPanelOpen,
    endWidth,
    endWidthChosen,
    endWidthRange: { min: END_PANEL_MIN_PX, max: endMax },
    measured,
    setEndWidth,
    resetEndWidth: () => setEndWidthChosen(END_PANEL_DEFAULT_PX),
    transitioning,
    settleTransition: (side: PanelSide) =>
      setTransitioning((current) => (current === side ? null : current)),
    ref,
  };
}
