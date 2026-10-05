import { useTranslation } from "react-i18next";
import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel, type SidePanelOccupants } from "@/components/ui/side-panel";
import type {
  LocaleKey,
  OccupantSpec,
  ScrollOwner,
  SurfacePadding,
} from "@/lib/composition";
import { occupantPadding, scrollOwner } from "@/lib/composition";
import type { PanelSpec } from "@/lib/panel";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { DetailPage } from "./DetailPage";
import type { DetailPageSlotName } from "./detail-page.template";
import {
  fillPlaceholderOccupant,
  namedPlaceholderOccupant,
  placeholderOccupant,
} from "./placeholder-occupants";
import {
  EXTRA_TITLES,
  isSingleOccupant,
  PANEL_TITLES,
  type PanelComposition,
  type PreviewOccupant,
  previewTabId,
  TAB_LABELS,
} from "./preview-panels";
import type {
  PanelCompositions,
  PanelSlotName,
  PanelTabs,
} from "./preview-url-state";
import { SlotPlaceholder } from "./SlotPlaceholder";
import type { DetailPageState } from "./use-detail-page";

export type SlotPaddings = Record<DetailPageSlotName, SurfacePadding>;

/** Slots whose surface can scroll. The page header never does. */
export type ScrollableSlotName = Exclude<DetailPageSlotName, "header">;

export type SlotContents = Record<ScrollableSlotName, "short" | "long">;
export type SlotScrolls = Record<ScrollableSlotName, ScrollOwner>;

interface DetailPageExampleProps {
  state: DetailPageState;
  paddings: SlotPaddings;
  contents: SlotContents;
  scrolls: SlotScrolls;
  /** What each panel holds. Defaults to its own placeholder alone. */
  compositions?: PanelCompositions;
  /** Each panel's tab to show first. */
  tabs?: PanelTabs;
  onTabChange?: (slot: PanelSlotName, id: string) => void;
}

const specName = (occupant: PreviewOccupant) =>
  occupant === "base" ? "placeholder" : `placeholder-${occupant}`;

/**
 * A composed panel's spec and occupants: the panel's own placeholder, now
 * titled, and each placeholder the composer added.
 */
function composedPanel(
  slot: PanelSlotName,
  composition: PanelComposition,
  base: OccupantSpec,
  long: boolean,
  translate: (key: LocaleKey) => string,
): { panel: PanelSpec; occupants: SidePanelOccupants } {
  const occupants: Record<string, SidePanelOccupants[string]> = {};
  for (const occupant of composition.flatMap((tab) => tab.occupants)) {
    let spec: OccupantSpec;
    if (occupant === "base") {
      const titleKey = PANEL_TITLES[slot];
      spec = { ...base, label: translate(titleKey), titleKey };
    } else {
      const title = EXTRA_TITLES[occupant];
      spec =
        occupant === "document"
          ? fillPlaceholderOccupant(translate(title), title)
          : namedPlaceholderOccupant(
              specName(occupant),
              translate(title),
              title,
            );
    }
    occupants[spec.name] = {
      spec,
      node: (
        <SlotPlaceholder
          occupant={spec}
          surface="side-panel"
          // The document stand-in is always long enough to scroll itself.
          long={long || occupant === "document"}
        />
      ),
    };
  }
  return {
    panel: {
      surface: "side-panel",
      tabs: composition.map((tab) => ({
        id: previewTabId(tab),
        ...(tab.label && { label: TAB_LABELS[tab.label] }),
        occupants: tab.occupants.map(specName),
      })),
    },
    occupants,
  };
}

export function DetailPageExample({
  state,
  paddings,
  contents,
  scrolls,
  compositions,
  tabs,
  onTabChange,
}: DetailPageExampleProps) {
  const { t } = useTranslation();
  const panelFor = (slot: PanelSlotName, base: OccupantSpec) => {
    const composition = compositions?.[slot];
    if (!composition || isSingleOccupant(composition)) return null;
    return {
      ...composedPanel(slot, composition, base, contents[slot] === "long", t),
      ...(tabs?.[slot] && { defaultTab: tabs[slot] }),
      ...(onTabChange && {
        onTabChange: (id: string) => onTabChange(slot, id),
      }),
    };
  };
  const header = placeholderOccupant("Header", paddings.header);
  const startPanel = placeholderOccupant(
    "Start panel",
    paddings["start-panel"],
    scrolls["start-panel"],
  );
  const main = placeholderOccupant("Main", paddings.main, scrolls.main);
  const endPanel = placeholderOccupant(
    "End panel",
    paddings["end-panel"],
    scrolls["end-panel"],
  );

  return (
    <DetailPage
      state={state}
      header={
        <PageHeader padding={occupantPadding(header)}>
          <SlotPlaceholder occupant={header} surface="page-header" />
        </PageHeader>
      }
      startPanel={
        <SidePanel
          side="start"
          aria-label="Start panel"
          padding={occupantPadding(startPanel)}
          scroll={scrollOwner(sidePanelSurface, startPanel)}
          {...panelFor("start-panel", startPanel)}
        >
          <SlotPlaceholder
            occupant={startPanel}
            surface="side-panel"
            long={contents["start-panel"] === "long"}
          />
        </SidePanel>
      }
      main={
        <ContentArea
          padding={occupantPadding(main)}
          scroll={scrollOwner(contentAreaSurface, main)}
        >
          <SlotPlaceholder
            occupant={main}
            surface="content-area"
            long={contents.main === "long"}
          />
        </ContentArea>
      }
      endPanel={
        <SidePanel
          side="end"
          aria-label="End panel"
          padding={occupantPadding(endPanel)}
          scroll={scrollOwner(sidePanelSurface, endPanel)}
          {...panelFor("end-panel", endPanel)}
        >
          <SlotPlaceholder
            occupant={endPanel}
            surface="side-panel"
            long={contents["end-panel"] === "long"}
          />
        </SidePanel>
      }
    />
  );
}
