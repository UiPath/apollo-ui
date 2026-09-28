import type { TemplateSpec } from "@/lib/composition";
import { PADDED_INSET_PX } from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { pageRailSurface } from "./experimental/page-rail.surface";

export const detailPageTemplate = {
  name: "detail-page",
  slots: [
    {
      name: "start-rail",
      required: false,
      experimental: true,
      surfaces: ["page-rail"],
    },
    { name: "header", required: true, surfaces: ["page-header"] },
    { name: "start-panel", required: false, surfaces: ["side-panel"] },
    { name: "main", required: true, surfaces: ["content-area"] },
    { name: "end-panel", required: false, surfaces: ["side-panel"] },
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
 * Experimental: where the start panel's controls live, while two options
 * are compared. One is kept and the other deleted before the PR.
 *
 * - "in-panel" (option B): the panel's top row holds the occupant switcher
 *   and a collapse toggle. When closed, an expand toggle sits in the page
 *   header's leading region, before back.
 * - "rail" (option C): a 44px page rail at the template's start edge holds
 *   back and the occupant icons, and stays when the panel is closed. The
 *   panel's top row shows the occupant label and a collapse toggle.
 */
export type StartPanelControls = "in-panel" | "rail";

/** Everything a Detail page lets you configure. Nothing else is. */
export interface DetailPageConfig {
  panels: DetailPagePanels;
  start: DetailPagePanelConfig;
  end: DetailPagePanelConfig;
  /** Experimental. Defaults to "in-panel". Only applies to the start panel. */
  startControls?: StartPanelControls;
}

/** Width of the divider the frame draws between slots, in px. */
export const DIVIDER_PX = 1;

/** A side panel's outer width: its inner width plus the padded inset. */
export const SIDE_PANEL_OUTER_PX =
  sidePanelSurface.provides.width.min + 2 * PADDED_INSET_PX;

/** The page rail's outer width (experimental, option C). */
export const RAIL_OUTER_PX = pageRailSurface.provides.width.min;

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
 *
 * Anything that always takes width, such as the experimental page rail
 * (44px plus its divider), is passed as `reservedPx` and counted first.
 */
export function resolvePanels(
  intent: PanelIntent,
  templateWidth: number,
  reservedPx = 0,
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
    reservedPx +
    MAIN_MIN_OUTER_PX +
    openSides.length * (SIDE_PANEL_OUTER_PX + DIVIDER_PX);

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

/** Whether the experimental page rail is shown for this config. */
export function hasStartRail(config: DetailPageConfig): boolean {
  return config.startControls === "rail" && enabledPanels(config.panels).start;
}

export function enabledPanels(
  panels: DetailPagePanels,
): Record<PanelSide, boolean> {
  return {
    start: panels === "start" || panels === "both",
    end: panels === "end" || panels === "both",
  };
}
