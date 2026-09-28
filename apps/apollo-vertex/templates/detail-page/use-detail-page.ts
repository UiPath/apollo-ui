import { type RefCallback, useState } from "react";
import {
  type DetailPageConfig,
  type DetailPagePanels,
  END_PANEL_DEFAULT_PX,
  enabledPanels,
  endPanelMaxWidth,
  type PanelClosedBy,
  type PanelIntent,
  type PanelSide,
  type PanelWidth,
  resolveEndWidth,
  resolvePanels,
  END_PANEL_MIN_PX,
} from "./detail-page.template";

const SIDES: readonly PanelSide[] = ["start", "end"];

interface IntentState extends PanelIntent {
  /** The panels setting the intent was last reconciled against. */
  panels: DetailPagePanels;
}

export interface DetailPageState {
  config: DetailPageConfig;
  /** What is actually open after the main-width rule. */
  open: Record<PanelSide, boolean>;
  /** Why each closed panel is closed. Null when open or disabled. */
  closedBy: Record<PanelSide, PanelClosedBy | null>;
  setPanelOpen: (side: PanelSide, open: boolean) => void;
  /** The end panel's rendered width in px, after the width rules. */
  endWidth: number;
  /** The width the user chose, px or "max". Kept as is on window resize. */
  endWidthChosen: PanelWidth;
  /**
   * The current range the end panel can be resized within, in px. Only
   * meaningful once `measured` is true.
   */
  endWidthRange: { min: number; max: number };
  /** Whether the template has been measured, so the width rules apply. */
  measured: boolean;
  /** Store a new chosen width. It is clamped to the current range first. */
  setEndWidth: (width: number) => void;
  /** Back to the side panel's default width. */
  resetEndWidth: () => void;
  /**
   * Replace the user's panel intent (open or closed, open order, latest
   * opened) and chosen end width with what `config` starts with, as on a
   * fresh load. Rule-closed state follows, since it is derived. Pass the
   * config the template will render with next.
   */
  restore: (config: DetailPageConfig) => void;
  /** Attach to the template root so the main-width rule can measure it. */
  ref: RefCallback<HTMLDivElement | null>;
}

/**
 * The template's border-box width. It measures synchronously when the node
 * attaches (during commit, before paint) and then follows ResizeObserver
 * directly, without requestAnimationFrame. rAF never fires in a hidden tab,
 * and ResizeObserver only delivers during rendering, which hidden tabs
 * skip, so the initial measurement must not wait on either.
 */
function useTemplateWidth(): [RefCallback<HTMLDivElement | null>, number] {
  const [width, setWidth] = useState(0);
  const ref = (node: HTMLDivElement | null) => {
    if (!node) return;
    // Measure now, but apply after this commit finishes: an update made
    // while React is still attaching the node does not reach the router's
    // subtree on first mount. A microtask still runs in hidden tabs.
    const initial = node.getBoundingClientRect().width;
    queueMicrotask(() => setWidth(initial));
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setWidth(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  };
  return [ref, width];
}

/** Newly enabled panels take their defaultOpen; disabled panels close. */
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
      openOrder = openOrder.filter((s) => s !== side);
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

/**
 * Owns a Detail page's panel state. Pass the result to
 * `<DetailPage state={...} />`.
 *
 * It stores only the user's intent. What is actually open is derived from
 * that intent and the measured width on every render, using the main-width
 * rule in detail-page.template.ts. So resizing needs no state updates, and
 * panels the rule closed come back on their own when there is room.
 *
 * The end panel's chosen width works the same way: it is stored as chosen
 * and clamped on every render by the end panel width rules.
 */
export function useDetailPage(config: DetailPageConfig): DetailPageState {
  const [ref, width] = useTemplateWidth();
  const [state, setState] = useState(() => initialState(config));
  const [endWidthChosen, setEndWidthChosen] = useState<PanelWidth>(
    () => config.end.defaultWidth ?? END_PANEL_DEFAULT_PX,
  );

  // Adjust intent while rendering when the enabled panels change.
  let intent = state;
  if (state.panels !== config.panels) {
    intent = reconcile(state, config);
    setState(intent);
  }

  const enabled = enabledPanels(config.panels);
  const resolved = resolvePanels(intent, width);
  const closedBy = {
    start: enabled.start ? resolved.closedBy.start : null,
    end: enabled.end ? resolved.closedBy.end : null,
  };

  const setPanelOpen = (side: PanelSide, open: boolean) =>
    setState((prev) => {
      if (!enabledPanels(prev.panels)[side]) return prev;
      const others = prev.openOrder.filter((s) => s !== side);
      if (open) {
        // An explicit open always moves the panel to newest and protects it,
        // even if it was already wanted but closed by the rule.
        return {
          ...prev,
          wanted: { ...prev.wanted, [side]: true },
          openOrder: [...others, side],
          lastOpened: side,
        };
      }
      return {
        ...prev,
        wanted: { ...prev.wanted, [side]: false },
        openOrder: others,
        lastOpened: prev.lastOpened === side ? null : prev.lastOpened,
      };
    });

  const measured = width > 0;
  const endWidth = resolveEndWidth(endWidthChosen, width, resolved.open.start);
  const endWidthRange = {
    min: END_PANEL_MIN_PX,
    max: measured
      ? endPanelMaxWidth(width, resolved.open.start)
      : END_PANEL_MIN_PX,
  };

  // A drag or key press stores what the user can see, so the stored width
  // never sits outside the range it was chosen in. Reaching the maximum
  // stores "max", which keeps tracking the 50/50 split on resize.
  const setEndWidth = (next: number) => {
    if (!measured) return;
    const clamped = Math.round(
      Math.min(Math.max(next, endWidthRange.min), endWidthRange.max),
    );
    setEndWidthChosen(clamped >= endWidthRange.max ? "max" : clamped);
  };
  const resetEndWidth = () => setEndWidthChosen(END_PANEL_DEFAULT_PX);
  const restore = (next: DetailPageConfig) => {
    setState(initialState(next));
    setEndWidthChosen(next.end.defaultWidth ?? END_PANEL_DEFAULT_PX);
  };

  return {
    config,
    open: resolved.open,
    closedBy,
    setPanelOpen,
    endWidth,
    endWidthChosen,
    endWidthRange,
    measured,
    setEndWidth,
    resetEndWidth,
    restore,
    ref,
  };
}
