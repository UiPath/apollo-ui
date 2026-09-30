import type { ComponentType } from "react";
import type { TemplateSpec } from "@/lib/composition";
import {
  detailPageTemplate,
  MAIN_MIN_OUTER_PX,
} from "@/templates/detail-page/detail-page.template";
import { DETAIL_PAGE_SLOT_LABELS } from "./detail-page-slots";
import { MAP_REGIONS, type MapRegion } from "./surface-hosts";
import {
  DetailPageFrame,
  type TemplateFrameProps,
} from "./template-hosts-components";

export interface TemplateHost {
  spec: TemplateSpec;
  /** What people call it, in sentence case. */
  label: string;
  /** Each slot's name, in sentence case. */
  slotLabels: Record<string, string>;
  /**
   * Where a slot sits on the workbench's page map, when that isn't the
   * region with the slot's own name.
   */
  regions?: Record<string, readonly MapRegion[]>;
  /** Slots that sit below or beside the header. */
  placeable: readonly string[];
  /** The narrowest page width where the template still works, in px. */
  minWidth: number;
  /** Renders the template with one occupant in one slot. */
  Frame: ComponentType<TemplateFrameProps>;
}

/**
 * How previews render each template with one occupant in it, by name, in
 * the order pickers list them: the occupant workbench's template view.
 *
 * To add a template (a dashboard, say): add its host here, with its spec,
 * labels, map regions, and a frame. The workbench's template picker shows
 * it with no other change. A unit test fails until every slot has a label
 * and a region.
 */
export const TEMPLATE_HOSTS: Record<string, TemplateHost> = {
  "detail-page": {
    spec: detailPageTemplate,
    label: "Detail page",
    slotLabels: DETAIL_PAGE_SLOT_LABELS,
    placeable: ["start-panel", "end-panel"],
    // Main's own minimum: narrower, and there's no room even without panels.
    minWidth: MAIN_MIN_OUTER_PX,
    Frame: DetailPageFrame,
  },
};

/** Where a template's slot sits on the page map. */
export function slotRegions(
  host: TemplateHost,
  slot: string,
): readonly MapRegion[] {
  const named = MAP_REGIONS.find((region) => region === slot);
  return host.regions?.[slot] ?? (named ? [named] : []);
}
