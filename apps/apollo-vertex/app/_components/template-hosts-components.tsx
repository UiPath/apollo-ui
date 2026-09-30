"use client";

import type { ReactNode } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import {
  type OccupantSpec,
  occupantPadding,
  scrollOwner,
} from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { DetailPage } from "@/templates/detail-page/DetailPage";
import type {
  DetailPageSlotName,
  PanelPlacement,
} from "@/templates/detail-page/detail-page.template";
import { placeholderOccupant } from "@/templates/detail-page/placeholder-occupants";
import { SlotPlaceholder } from "@/templates/detail-page/SlotPlaceholder";
import { useDetailPage } from "@/templates/detail-page/use-detail-page";
import { DETAIL_PAGE_SLOT_LABELS } from "./detail-page-slots";

/** What a preview gives a template to hold one occupant in one slot. */
export interface TemplateFrameProps {
  /** The slot the occupant goes in. */
  slot: string;
  /** The occupant's spec, for its padding and scroll owner. */
  spec: OccupantSpec;
  /** The occupant, rendered. */
  occupant: ReactNode;
  /** Where a side slot sits: below or beside the header. */
  placement: PanelPlacement;
}

/**
 * The Detail page with both panels, the occupant in its slot, and labeled
 * placeholders in the others. The template's own rules run as usual: its
 * width is the frame's, so a panel closes when main would get too narrow.
 */
export function DetailPageFrame({
  slot,
  spec,
  occupant,
  placement,
}: TemplateFrameProps) {
  const state = useDetailPage({
    panels: "both",
    start: {
      placement: slot === "start-panel" ? placement : "below-header",
      defaultOpen: true,
    },
    end: {
      placement: slot === "end-panel" ? placement : "below-header",
      defaultOpen: true,
    },
  });
  const content = (name: DetailPageSlotName) => {
    const own = name === slot;
    const shown = own
      ? spec
      : placeholderOccupant(DETAIL_PAGE_SLOT_LABELS[name], "padded");
    const surface =
      name === "header"
        ? "page-header"
        : name === "main"
          ? "content-area"
          : "side-panel";
    const inner = own ? (
      occupant
    ) : (
      <SlotPlaceholder
        occupant={shown}
        surface={surface}
        className={
          name === "header"
            ? "col-span-full min-h-11 flex-row gap-3 self-stretch"
            : ""
        }
      />
    );
    if (name === "header")
      return <PageHeader padding={occupantPadding(shown)}>{inner}</PageHeader>;
    if (name === "main")
      return (
        <ContentArea
          padding={occupantPadding(shown)}
          scroll={scrollOwner(contentAreaSurface, shown)}
        >
          {inner}
        </ContentArea>
      );
    return (
      <SidePanel
        side={name === "start-panel" ? "start" : "end"}
        aria-label={DETAIL_PAGE_SLOT_LABELS[name]}
        padding={occupantPadding(shown)}
        scroll={scrollOwner(sidePanelSurface, shown)}
      >
        {inner}
      </SidePanel>
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
