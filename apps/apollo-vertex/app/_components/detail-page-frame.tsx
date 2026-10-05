"use client";

import { useEffect } from "react";
import { occupantPadding, scrollOwner } from "@/lib/composition";
import type { SlotChoice } from "@/lib/layout";
import { SURFACE_SPECS } from "@/lib/occupants.generated";
import { DetailPage } from "@/templates/detail-page/DetailPage";
import {
  type DetailPagePanels,
  type DetailPageSlotName,
  detailPageTemplate,
  type PanelPlacement,
  type PanelSide,
} from "@/templates/detail-page/detail-page.template";
import { placeholderOccupant } from "@/templates/detail-page/placeholder-occupants";
import { SlotPlaceholder } from "@/templates/detail-page/SlotPlaceholder";
import { useDetailPage } from "@/templates/detail-page/use-detail-page";
import { SURFACE_HOSTS } from "./surface-hosts";
import type { TemplateFrameProps } from "./template-host";

/*
 * Part of the Detail page's entry in the template registry (with
 * detail-page-host.ts): its frame, the one place previews render it.
 */

/** The Detail page's slots, by name, in sentence case. */
const SLOT_LABELS: Record<DetailPageSlotName, string> = {
  header: "Header",
  "start-panel": "Start panel",
  main: "Main",
  "end-panel": "End panel",
};

const PANEL_SLOTS: Record<PanelSide, DetailPageSlotName> = {
  start: "start-panel",
  end: "end-panel",
};

/**
 * The Detail page in the given layout choices, the occupant in its slot,
 * and labeled placeholders in the others. The template's own rules run as
 * usual: its width is the frame's, so a panel closes when main would get
 * too narrow. The occupant's panel counts as the one opened last, so the
 * rule closes the other panel first and never closes the occupant's.
 */
function DetailPageFrame({
  slot,
  contents,
  choices,
  onStatus,
}: TemplateFrameProps) {
  const choice = (side: PanelSide): SlotChoice =>
    choices[PANEL_SLOTS[side]] ?? {};
  const present = {
    start: choice("start").present !== false,
    end: choice("end").present !== false,
  };
  const panels: DetailPagePanels =
    present.start && present.end
      ? "both"
      : present.start
        ? "start"
        : present.end
          ? "end"
          : "none";
  const placement = (side: PanelSide): PanelPlacement =>
    choice(side).placement === "beside-header"
      ? "beside-header"
      : "below-header";
  const own: PanelSide | null =
    slot === PANEL_SLOTS.start
      ? "start"
      : slot === PANEL_SLOTS.end
        ? "end"
        : null;
  const state = useDetailPage({
    panels,
    start: {
      placement: placement("start"),
      defaultOpen: choice("start").open !== false,
    },
    end: {
      placement: placement("end"),
      defaultOpen: choice("end").open !== false,
    },
    ...(own && { latest: own }),
  });
  const { open, closedBy } = state;
  useEffect(() => {
    onStatus?.({
      [PANEL_SLOTS.start]: { open: open.start, closedBy: closedBy.start },
      [PANEL_SLOTS.end]: { open: open.end, closedBy: closedBy.end },
    });
  }, [onStatus, open.start, open.end, closedBy.start, closedBy.end]);
  const content = (name: DetailPageSlotName) => {
    const filled = contents[name];
    const held = filled ? Object.values(filled.occupants) : [];
    const [only] = held;
    // One occupant renders as before; several make a panel of tabs.
    const shown =
      held.length === 1 && only
        ? only.spec
        : placeholderOccupant(SLOT_LABELS[name], "padded");
    const surface = SURFACE_SPECS.find((s) =>
      detailPageTemplate.slots
        .find((t) => t.name === name)
        ?.surfaces.some((accepted) => accepted === s.name),
    );
    const Host = surface && SURFACE_HOSTS[surface.name]?.Host;
    if (!surface || !Host) return null;
    const several = filled && held.length > 1;
    return (
      <Host
        padding={occupantPadding(shown)}
        scroll={scrollOwner(surface, shown)}
        label={SLOT_LABELS[name]}
        side={name === PANEL_SLOTS.start ? "start" : "end"}
        fill={false}
        {...(several && {
          panel: {
            spec: filled.panel,
            occupants: filled.occupants,
            defaultTab: filled.defaultTab,
            ...(filled.onTabChange && { onTabChange: filled.onTabChange }),
          },
        })}
      >
        {several ? null : only ? (
          only.node
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

export { DetailPageFrame, PANEL_SLOTS, SLOT_LABELS };
