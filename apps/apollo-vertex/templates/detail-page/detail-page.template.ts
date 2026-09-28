import type { TemplateSpec } from "@/lib/composition";
import { PADDED_INSET_PX } from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";

export const detailPageTemplate = {
  name: "detail-page",
  slots: [
    { name: "header", required: true, surfaces: ["page-header"] },
    {
      name: "start-panel",
      required: false,
      resizable: false,
      surfaces: ["side-panel"],
    },
    { name: "main", required: true, surfaces: ["content-area"] },
    {
      name: "end-panel",
      required: false,
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
  /** Fixed at the side panel's minimum width. */
  start: DetailPagePanelConfig;
  /** Resizable. See the end panel width rules below. */
  end: ResizablePanelConfig;
}

/** Width of the divider the frame draws between slots, in px. */
export const DIVIDER_PX = 1;

/** A side panel's minimum outer width. The start panel is always this. */
export const SIDE_PANEL_OUTER_PX = sidePanelSurface.width.min;

/** The end panel's width before the user resizes it. */
export const END_PANEL_DEFAULT_PX = sidePanelSurface.width.default;

/** Main's outer minimum: content-area's inner minimum plus the inset. */
export const MAIN_MIN_OUTER_PX =
  contentAreaSurface.provides.width.min + 2 * PADDED_INSET_PX;

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
    MAIN_MIN_OUTER_PX + openSides.length * (SIDE_PANEL_OUTER_PX + DIVIDER_PX);

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
 * - It is never narrower than SIDE_PANEL_OUTER_PX (280px).
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
  const startPx = startOpen ? SIDE_PANEL_OUTER_PX + DIVIDER_PX : 0;
  // The space main and the end panel share, less the end panel's divider.
  const shared = templateWidth - startPx - DIVIDER_PX;
  const halfOfShared = Math.floor(shared / 2);
  const mainMinimum = shared - MAIN_MIN_OUTER_PX;
  return Math.max(SIDE_PANEL_OUTER_PX, Math.min(halfOfShared, mainMinimum));
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
      : Math.max(SIDE_PANEL_OUTER_PX, width);
  }
  const max = endPanelMaxWidth(templateWidth, startOpen);
  if (width === "max") return max;
  return Math.min(Math.max(width, SIDE_PANEL_OUTER_PX), max);
}
