import {
  detailPageTemplate,
  MAIN_MIN_OUTER_PX,
} from "@/templates/detail-page/detail-page.template";
import { DetailPageFrame, PANEL_SLOTS, SLOT_LABELS } from "./detail-page-frame";
import type { TemplateHost } from "./template-host";

/*
 * The Detail page's entry in the template registry: with its frame
 * (detail-page-frame.tsx), the one place previews know the Detail page.
 * Everything else reads its spec through TemplateHost.
 */

/**
 * The Detail page's links before per-slot params: panels=none|start|end,
 * start and end for placement, start-state and end-state.
 */
function legacyParams(params: URLSearchParams): Record<string, string> {
  const mapped: Record<string, string> = {};
  const panels = params.get("panels");
  for (const side of ["start", "end"] as const) {
    const name = PANEL_SLOTS[side];
    if (panels && panels !== "both" && panels !== side)
      mapped[`${name}-present`] = "false";
    const placement = params.get(side);
    if (placement) mapped[`${name}-placement`] = placement;
    const state = params.get(`${side}-state`);
    if (state) mapped[`${name}-state`] = state;
  }
  return mapped;
}

export const DETAIL_PAGE_HOST: TemplateHost = {
  spec: detailPageTemplate,
  label: "Detail page",
  slotLabels: SLOT_LABELS,
  // Main's own minimum: narrower, and there's no room even without panels.
  minWidth: MAIN_MIN_OUTER_PX,
  Frame: DetailPageFrame,
  legacyParams,
};
