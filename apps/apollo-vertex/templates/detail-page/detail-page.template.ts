import type { SlotWidth, TemplateSpec } from "@/lib/composition";
import { LAYOUT_TOKENS } from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";

/*
 * Detail page widths, in px. They live here, in the template spec, and the
 * template sets them as CSS variables on its root so CSS and TypeScript
 * read one source. Moves to the theme when the template becomes a
 * registry item. Surface minimums come from theme tokens.
 */

/**
 * Start panel: not resizable, so it always renders at `default` (272px
 * inner when padded). `min` and `max` are recorded for when it becomes
 * resizable; `min` is the side panel surface's own minimum.
 */
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

export const detailPageTemplate = {
  name: "detail-page",
  slots: [
    { name: "header", required: true, surfaces: ["page-header"] },
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
 * - "below-header": the header spans the full width and the panel sits
 *   under it.
 * - "beside-header": the panel runs the full height of the template and the
 *   header shifts over. Inside the minimal shell the template already sits
 *   under the Shell's top bar, so the panel stops there.
 *
 * Choosing placement: placement shows what the panel's content belongs
 * to. Below header: content about this record, which changes when the user
 * opens a different record (source document, activity history, rules
 * applied, line items). Beside header: content that works across records,
 * which stays in place when the user opens a different record (work queue,
 * secondary navigation, the AI assistant). Quick test: if the user opens
 * the next record, does the panel's content change? Yes → below header.
 * No → beside header. Don't choose placement for visual emphasis.
 */
export type PanelPlacement = "below-header" | "beside-header";

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

/** The divider the frame draws between slots: the --slot-divider-width token. */
export const DIVIDER_PX = LAYOUT_TOKENS.slotDividerWidth;

/** The start panel's rendered outer width. */
export const START_PANEL_PX = START_PANEL_WIDTH.default;

/** The end panel's minimum outer width. */
export const END_PANEL_MIN_PX = END_PANEL_WIDTH.min;

/** The end panel's width before the user resizes it. */
export const END_PANEL_DEFAULT_PX = END_PANEL_WIDTH.default;

/** Main's outer minimum: the content-area surface's own minimum. */
export const MAIN_MIN_OUTER_PX = contentAreaSurface.width.min;

/** Each panel's outer width for the main-width rule, divider included. */
const PANEL_RULE_PX: Record<PanelSide, number> = {
  start: START_PANEL_PX + DIVIDER_PX,
  end: END_PANEL_MIN_PX + DIVIDER_PX,
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
 * last is never closed by the rule, even if main ends up below 480px; the
 * minimum only decides which other panel closes. Small screens get an
 * overlay surface in a later step.
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
  // The space main and the end panel share, less the end panel's divider.
  const shared = templateWidth - startPx - DIVIDER_PX;
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
