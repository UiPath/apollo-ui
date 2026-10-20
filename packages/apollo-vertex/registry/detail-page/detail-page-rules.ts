/**
 * Detail page widths and the rules that keep main readable.
 * Widths match the detail page on poc/workbench-map: the start sidebar is
 * fixed, the end sidebar resizes, and main keeps a floor.
 */

export const START_PANEL_PX = 320;
export const END_PANEL_MIN_PX = 280;
export const END_PANEL_DEFAULT_PX = 360;
export const MAIN_MIN_OUTER_PX = 480;

export type PanelSide = "start" | "end";

export type DetailPagePanels = "none" | "start" | "end" | "both";

/** Below the header (it spans the page), or beside it (the sidebar is full height). */
export type PanelPlacement = "below-header" | "beside-header";

export interface DetailPagePanelConfig {
  placement: PanelPlacement;
  defaultOpen: boolean;
}

/** A chosen end-sidebar width: px, or "max" to keep the 50/50 split. */
export type PanelWidth = number | "max";

export interface ResizablePanelConfig extends DetailPagePanelConfig {
  /** Width to start at. Defaults to the end sidebar's default. */
  defaultWidth?: PanelWidth;
}

/** Everything a detail page lets you configure. */
export interface DetailPageConfig {
  panels: DetailPagePanels;
  start: DetailPagePanelConfig;
  end: ResizablePanelConfig;
  /**
   * A sidebar that always counts as the one opened most recently, so the
   * main-width rule never closes it.
   */
  latest?: PanelSide;
}

export interface PanelWidths {
  start: number;
  endMin: number;
}

export const DEFAULT_PANEL_WIDTHS: PanelWidths = {
  start: START_PANEL_PX,
  endMin: END_PANEL_MIN_PX,
};

/** Why a sidebar is closed: the user closed it, or the main-width rule did. */
export type PanelClosedBy = "user" | "rule";

export interface PanelIntent {
  /** What the user wants: defaultOpen to start, then each open or close. */
  wanted: Record<PanelSide, boolean>;
  /** Wanted-open sidebars, oldest first. */
  openOrder: readonly PanelSide[];
  /** The sidebar the user opened most recently, if any. */
  lastOpened: PanelSide | null;
}

export interface ResolvedPanels {
  open: Record<PanelSide, boolean>;
  closedBy: Record<PanelSide, PanelClosedBy | null>;
}

export function enabledPanels(
  panels: DetailPagePanels,
): Record<PanelSide, boolean> {
  switch (panels) {
    case "none":
      return { start: false, end: false };
    case "start":
      return { start: true, end: false };
    case "end":
      return { start: false, end: true };
    case "both":
      return { start: true, end: true };
    default: {
      const exhaustive: never = panels;
      return exhaustive;
    }
  }
}

/**
 * Main-width rule. Main should stay at least MAIN_MIN_OUTER_PX wide. When
 * the open sidebars would push it below that, wanted-open sidebars close
 * oldest first until main fits.
 *
 * The sidebar the user opened last stays open, even if main ends up
 * narrower. The rule is recomputed from intent on every width, so sidebars
 * it closed reopen when there is room. Sidebars the user closed stay closed.
 */
export function resolvePanels(
  intent: PanelIntent,
  templateWidth: number,
  widths: PanelWidths = DEFAULT_PANEL_WIDTHS,
): ResolvedPanels {
  const rulePx: Record<PanelSide, number> = {
    start: widths.start,
    end: widths.endMin,
  };
  const open = { ...intent.wanted };
  const closedBy: Record<PanelSide, PanelClosedBy | null> = {
    start: intent.wanted.start ? null : "user",
    end: intent.wanted.end ? null : "user",
  };
  if (templateWidth <= 0) return { open, closedBy };

  const openSides = intent.openOrder.filter((side) => open[side]);
  const required = () =>
    MAIN_MIN_OUTER_PX +
    openSides.reduce((total, side) => total + rulePx[side], 0);

  while (required() > templateWidth) {
    const index = openSides.findIndex((side) => side !== intent.lastOpened);
    if (index === -1) break;
    const closing = openSides[index];
    if (!closing) break;
    openSides.splice(index, 1);
    open[closing] = false;
    closedBy[closing] = "rule";
  }
  return { open, closedBy };
}

/** Mark `side` as the most recently opened sidebar, when it is wanted open. */
export function withLatest(intent: PanelIntent, side: PanelSide): PanelIntent {
  if (!intent.wanted[side]) return intent;
  return {
    ...intent,
    openOrder: [...intent.openOrder.filter((entry) => entry !== side), side],
    lastOpened: side,
  };
}

/**
 * The end sidebar is never narrower than its minimum, never wider than
 * main, and never so wide that main drops below its floor. With no start
 * sidebar open, the maximum is a 50/50 split of the page. With one, it is
 * 50/50 of what remains.
 */
export function endPanelMaxWidth(
  templateWidth: number,
  startOpen: boolean,
  widths: PanelWidths = DEFAULT_PANEL_WIDTHS,
): number {
  const startPx = startOpen ? widths.start : 0;
  const shared = templateWidth - startPx;
  const halfOfShared = Math.floor(shared / 2);
  const mainMinimum = shared - MAIN_MIN_OUTER_PX;
  return Math.max(widths.endMin, Math.min(halfOfShared, mainMinimum));
}

export function resolveEndWidth(
  width: PanelWidth,
  templateWidth: number,
  startOpen: boolean,
  widths: PanelWidths = DEFAULT_PANEL_WIDTHS,
): number {
  if (templateWidth <= 0) {
    return width === "max"
      ? Math.max(END_PANEL_DEFAULT_PX, widths.endMin)
      : Math.max(widths.endMin, width);
  }
  const max = endPanelMaxWidth(templateWidth, startOpen, widths);
  if (width === "max") return max;
  return Math.min(Math.max(width, widths.endMin), max);
}
