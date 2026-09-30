import type { SidePanelPlacement } from "@/components/ui/side-panel";
import type { SlotWidth, TemplateSpec } from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";

/*
 * Detail page widths, in px: one source for the template's CSS variables and
 * its TypeScript. Surface minimums come from theme tokens.
 */

/** Start panel: not resizable, so it always renders at `default`. */
export const START_PANEL_WIDTH = {
  min: sidePanelSurface.width.min,
  default: 320,
  max: 400,
} as const satisfies SlotWidth;

/** End panel: resizable between its minimum and main's width. */
export const END_PANEL_WIDTH = {
  min: sidePanelSurface.width.min,
  default: 360,
  max: "main",
} as const satisfies SlotWidth;

/**
 * Header: spans the page, so it has no default width of its own. It is
 * always at least as wide as main, so it guarantees main's floor. (The one
 * exception is the user's latest panel open squeezing main below its
 * floor; see the main-width rule.)
 */
export const HEADER_WIDTH = {
  min: contentAreaSurface.width.min,
} as const satisfies SlotWidth;

export const detailPageTemplate = {
  name: "detail-page",
  slots: [
    {
      name: "header",
      required: true,
      width: HEADER_WIDTH,
      surfaces: ["page-header"],
    },
    {
      name: "start-panel",
      required: false,
      width: START_PANEL_WIDTH,
      resizable: false,
      surfaces: ["side-panel"],
    },
    { name: "main", required: true, surfaces: ["content-area"] },
    {
      name: "end-panel",
      required: false,
      width: END_PANEL_WIDTH,
      resizable: true,
      surfaces: ["side-panel"],
    },
  ],
} as const satisfies TemplateSpec;

export type DetailPageSlotName =
  (typeof detailPageTemplate.slots)[number]["name"];

export type PanelSide = "start" | "end";

export type DetailPagePanels = "none" | "start" | "end" | "both";

/**
 * Below the header (it spans the page), or beside it (the panel runs the
 * template's full height). Choosing one: the Detail page docs.
 */
export type PanelPlacement = SidePanelPlacement;

export interface DetailPagePanelConfig {
  placement: PanelPlacement;
  defaultOpen: boolean;
}

/**
 * A resizable panel's chosen width: px, or "max" to always take the
 * largest width the rules allow (the current 50/50 split).
 */
export type PanelWidth = number | "max";

export interface ResizablePanelConfig extends DetailPagePanelConfig {
  /** The width to start at. Defaults to the side panel's default. */
  defaultWidth?: PanelWidth;
}

/** Everything a Detail page lets you configure. Nothing else is. */
export interface DetailPageConfig {
  panels: DetailPagePanels;
  /** Fixed at START_PANEL_WIDTH.default. */
  start: DetailPagePanelConfig;
  /** Resizable. See the end panel width rules below. */
  end: ResizablePanelConfig;
}

/** The start panel's rendered outer width. */
export const START_PANEL_PX = START_PANEL_WIDTH.default;

/** The end panel's minimum outer width. */
export const END_PANEL_MIN_PX = END_PANEL_WIDTH.min;

/** The end panel's width before the user resizes it. */
export const END_PANEL_DEFAULT_PX = END_PANEL_WIDTH.default;

/** Main's outer minimum: the content-area surface's own minimum. */
export const MAIN_MIN_OUTER_PX = contentAreaSurface.width.min;

/**
 * Each panel's outer width for the main-width rule. Dividers are overlays
 * that take no layout space, so panels are exactly their width.
 */
const PANEL_RULE_PX: Record<PanelSide, number> = {
  start: START_PANEL_PX,
  end: END_PANEL_MIN_PX,
};

/** Why a panel is closed: the user closed it, or the main-width rule did. */
export type PanelClosedBy = "user" | "rule";

export interface PanelIntent {
  /** What the user wants: defaultOpen to start, then each open or close. */
  wanted: Record<PanelSide, boolean>;
  /** Wanted-open panels, oldest first. */
  openOrder: readonly PanelSide[];
  /** The panel the user opened most recently, if any. */
  lastOpened: PanelSide | null;
}

export interface ResolvedPanels {
  open: Record<PanelSide, boolean>;
  closedBy: Record<PanelSide, PanelClosedBy | null>;
}

/**
 * Main-width rule. Main should not get narrower than MAIN_MIN_OUTER_PX
 * (480px). When the open panels would push it below that, the rule closes
 * wanted-open panels oldest first until main fits.
 *
 * The user's most recent action always wins. The panel the user opened
 * last is never closed by the rule, even if main ends up narrower; the
 * minimum only decides which other panel closes.
 *
 * The rule is recomputed from the user's intent on every width change, so
 * it runs on resize too. Panels it closed reopen when there is room again.
 * Panels the user closed stay closed.
 */
export function resolvePanels(
  intent: PanelIntent,
  templateWidth: number,
): ResolvedPanels {
  const open = { ...intent.wanted };
  const closedBy: Record<PanelSide, PanelClosedBy | null> = {
    start: intent.wanted.start ? null : "user",
    end: intent.wanted.end ? null : "user",
  };
  // Width is 0 until the template is first measured; skip the rule until then.
  if (templateWidth <= 0) return { open, closedBy };

  const openSides = intent.openOrder.filter((side) => open[side]);
  const required = () =>
    MAIN_MIN_OUTER_PX +
    openSides.reduce((total, side) => total + PANEL_RULE_PX[side], 0);

  while (required() > templateWidth) {
    const index = openSides.findIndex((side) => side !== intent.lastOpened);
    if (index === -1) break;
    const [closing] = openSides.splice(index, 1);
    if (closing) {
      open[closing] = false;
      closedBy[closing] = "rule";
    }
  }
  return { open, closedBy };
}

export function enabledPanels(
  panels: DetailPagePanels,
): Record<PanelSide, boolean> {
  return {
    start: panels === "start" || panels === "both",
    end: panels === "end" || panels === "both",
  };
}

/**
 * End panel width rules. The end panel is the only resizable slot.
 *
 * - It is never narrower than END_PANEL_MIN_PX.
 * - It is never wider than main. With no start panel open that is a 50/50
 *   split of the template; with one, a 50/50 split of what remains.
 * - Main keeps its MAIN_MIN_OUTER_PX (480px) minimum, so on narrow windows
 *   the maximum shrinks further.
 * - If even the minimum does not fit, the main-width rule closes a panel.
 *   A panel it cannot close (the user's latest) stays at the minimum.
 *
 * The user's chosen width is stored as is and clamped on every render, so
 * resizing the window never changes it and the panel returns to it when
 * there is room again. A change that reaches the maximum stores "max"
 * instead of px, so it keeps resolving to the current 50/50 split as the
 * window resizes. Any other change stores the visible px width.
 */
export function endPanelMaxWidth(
  templateWidth: number,
  startOpen: boolean,
): number {
  const startPx = startOpen ? PANEL_RULE_PX.start : 0;
  // The space main and the end panel share.
  const shared = templateWidth - startPx;
  const halfOfShared = Math.floor(shared / 2);
  const mainMinimum = shared - MAIN_MIN_OUTER_PX;
  return Math.max(END_PANEL_MIN_PX, Math.min(halfOfShared, mainMinimum));
}

export function resolveEndWidth(
  width: PanelWidth,
  templateWidth: number,
  startOpen: boolean,
): number {
  // Width is 0 until the template is first measured. Until then "max" has
  // no px value to report; the grid lays it out regardless (see DetailPage).
  if (templateWidth <= 0) {
    return width === "max"
      ? END_PANEL_DEFAULT_PX
      : Math.max(END_PANEL_MIN_PX, width);
  }
  const max = endPanelMaxWidth(templateWidth, startOpen);
  if (width === "max") return max;
  return Math.min(Math.max(width, END_PANEL_MIN_PX), max);
}
