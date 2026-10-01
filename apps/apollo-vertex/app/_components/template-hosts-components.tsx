"use client";

import { type ReactNode, useEffect } from "react";
import {
  type OccupantSpec,
  occupantPadding,
  scrollOwner,
} from "@/lib/composition";
import { SURFACE_SPECS } from "@/lib/occupants.generated";
import { DetailPage } from "@/templates/detail-page/DetailPage";
import {
  type DetailPageSlotName,
  detailPageTemplate,
  type PanelSide,
} from "@/templates/detail-page/detail-page.template";
import { placeholderOccupant } from "@/templates/detail-page/placeholder-occupants";
import { SlotPlaceholder } from "@/templates/detail-page/SlotPlaceholder";
import { useDetailPage } from "@/templates/detail-page/use-detail-page";
import { DETAIL_PAGE_SLOT_LABELS } from "./detail-page-slots";
import { SURFACE_HOSTS } from "./surface-hosts";
import type { PanelStatus, TemplateLayout } from "./template-hosts";

/** What a preview gives a template to hold one occupant in one slot. */
export interface TemplateFrameProps {
  /** The slot the occupant goes in. */
  slot: string;
  /** The occupant's spec, for its padding and scroll owner. */
  spec: OccupantSpec;
  /** The occupant, rendered. */
  occupant: ReactNode;
  /** Which panels it has, and each one's open state and placement. */
  layout: TemplateLayout;
  /** Called with each panel's state after the template's rules, as it changes. */
  onPanels?: (panels: Record<PanelSide, PanelStatus>) => void;
}

/**
 * The Detail page in the given layout, the occupant in its slot, and labeled
 * placeholders in the others. The template's own rules run as usual: its
 * width is the frame's, so a panel closes when main would get too narrow.
 * The occupant's panel counts as the one opened last, so the rule closes
 * the other panel first and never closes the occupant's.
 */
export function DetailPageFrame({
  slot,
  spec,
  occupant,
  layout,
  onPanels,
}: TemplateFrameProps) {
  const own: PanelSide | null =
    slot === "start-panel" ? "start" : slot === "end-panel" ? "end" : null;
  const state = useDetailPage({
    panels: layout.panels,
    start: {
      placement: layout.start.placement,
      defaultOpen: layout.start.open,
    },
    end: { placement: layout.end.placement, defaultOpen: layout.end.open },
    ...(own && { latest: own }),
  });
  const { open, closedBy } = state;
  useEffect(() => {
    onPanels?.({
      start: { open: open.start, closedBy: closedBy.start },
      end: { open: open.end, closedBy: closedBy.end },
    });
  }, [onPanels, open.start, open.end, closedBy.start, closedBy.end]);
  const content = (name: DetailPageSlotName) => {
    const isOwn = name === slot;
    const shown = isOwn
      ? spec
      : placeholderOccupant(DETAIL_PAGE_SLOT_LABELS[name], "padded");
    const surface = SURFACE_SPECS.find((s) =>
      detailPageTemplate.slots
        .find((t) => t.name === name)
        ?.surfaces.some((accepted) => accepted === s.name),
    );
    const Host = surface && SURFACE_HOSTS[surface.name]?.Host;
    if (!surface || !Host) return null;
    return (
      <Host
        padding={occupantPadding(shown)}
        scroll={scrollOwner(surface, shown)}
        label={DETAIL_PAGE_SLOT_LABELS[name]}
        side={name === "start-panel" ? "start" : "end"}
        fill={false}
      >
        {isOwn ? (
          occupant
        ) : (
          <SlotPlaceholder occupant={shown} surface={surface.name} />
        )}
      </Host>
    );
  };
  return (
    <DetailPage
      state={state}
      header={content("header")}
      startPanel={content("start-panel")}
      main={content("main")}
      endPanel={content("end-panel")}
    />
  );
}
