import type { ComponentType } from "react";
import type { TemplateSpec } from "@/lib/composition";
import type { LayoutChoices } from "@/lib/layout";
import {
  DETAIL_PAGE_PANELS,
  type DetailPagePanels,
  detailPageTemplate,
  enabledPanels,
  MAIN_MIN_OUTER_PX,
  type PanelClosedBy,
  type PanelPlacement,
  type PanelSide,
} from "@/templates/detail-page/detail-page.template";
import { DETAIL_PAGE_SLOT_LABELS } from "./detail-page-slots";
import {
  DetailPageFrame,
  type TemplateFrameProps,
} from "./template-hosts-components";

/** One side panel's layout in a preview: open or closed, and where it sits. */
export interface PanelLayout {
  open: boolean;
  placement: PanelPlacement;
}

/** A template's layout in a preview: which panels it has, and each one's. */
export interface TemplateLayout {
  panels: DetailPagePanels;
  start: PanelLayout;
  end: PanelLayout;
}

/** What a panel ended up as after the template's own rules. */
export interface PanelStatus {
  open: boolean;
  /** Why it's closed, or null when it's open or not there. */
  closedBy: PanelClosedBy | null;
}

const OPEN_BELOW: PanelLayout = { open: true, placement: "below-header" };

/** The layout previews start with: both panels, open, below the header. */
export const DEFAULT_LAYOUT: TemplateLayout = {
  panels: "both",
  start: OPEN_BELOW,
  end: OPEN_BELOW,
};

export interface TemplateHost {
  spec: TemplateSpec;
  /** What people call it, in sentence case. */
  label: string;
  /** Each slot's name, in sentence case. */
  slotLabels: Record<string, string>;
  /**
   * The slot each side panel is: a preview can remove it, open or close
   * it, and place it below or beside the header.
   */
  panels: Record<PanelSide, string>;
  /** The panels settings it offers, from the template's own config. */
  panelSets: readonly DetailPagePanels[];
  /** The narrowest page width where the template still works, in px. */
  minWidth: number;
  /** Renders the template with one occupant in one slot. */
  Frame: ComponentType<TemplateFrameProps>;
}

/**
 * How the workbench renders each template with one occupant in it, in
 * picker order. Adding a template: Creating occupants, "Add a surface or
 * template".
 */
export const TEMPLATE_HOSTS: Record<string, TemplateHost> = {
  "detail-page": {
    spec: detailPageTemplate,
    label: "Detail page",
    slotLabels: DETAIL_PAGE_SLOT_LABELS,
    panels: { start: "start-panel", end: "end-panel" },
    panelSets: DETAIL_PAGE_PANELS,
    // Main's own minimum: narrower, and there's no room even without panels.
    minWidth: MAIN_MIN_OUTER_PX,
    Frame: DetailPageFrame,
  },
};

const SIDES: readonly PanelSide[] = ["start", "end"];

/**
 * A preview's layout as the template's layout choices (see resolveLayout),
 * by its panels' slots: whether each is there, open, and where it's placed.
 * Pass `open` for each panel's state after the template's own rules.
 */
export function layoutChoices(
  host: TemplateHost,
  layout: TemplateLayout,
  open?: Partial<Record<PanelSide, boolean>>,
): LayoutChoices {
  const present = enabledPanels(layout.panels);
  return Object.fromEntries(
    SIDES.map((side) => [
      host.panels[side],
      {
        present: present[side],
        open: open?.[side] ?? layout[side].open,
        placement: layout[side].placement,
      },
    ]),
  );
}

/** The side a slot's panel is on, or null when the slot isn't a side panel. */
export function panelSide(host: TemplateHost, slot: string): PanelSide | null {
  if (host.panels.start === slot) return "start";
  if (host.panels.end === slot) return "end";
  return null;
}
