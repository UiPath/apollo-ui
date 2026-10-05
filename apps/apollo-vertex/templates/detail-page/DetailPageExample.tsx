import { useTranslation } from "react-i18next";
import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel, type SidePanelOccupants } from "@/components/ui/side-panel";
import type {
  OccupantSpec,
  ScrollOwner,
  SurfacePadding,
} from "@/lib/composition";
import { occupantPadding, scrollOwner } from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { DetailPage } from "./DetailPage";
import type { DetailPageSlotName } from "./detail-page.template";
import { placeholderOccupant } from "./placeholder-occupants";
import { arrangementPanel } from "./preview-panels";
import type {
  PanelArrangements,
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
  /** How each panel arranges its occupants. Defaults to single. */
  arrangements?: PanelArrangements;
  /** Each panel's tab to show first. */
  tabs?: PanelTabs;
  onTabChange?: (slot: PanelSlotName, id: string) => void;
}

export function DetailPageExample({
  state,
  paddings,
  contents,
  scrolls,
  arrangements,
  tabs,
  onTabChange,
}: DetailPageExampleProps) {
  const { t } = useTranslation();
  // A panel's arrangement, with a placeholder box for each occupant in it.
  const panelFor = (slot: PanelSlotName, base: OccupantSpec) => {
    const arranged = arrangementPanel(
      slot,
      arrangements?.[slot] ?? "single",
      base,
      t,
    );
    if (!arranged) return null;
    const long = contents[slot] === "long";
    const occupants: SidePanelOccupants = Object.fromEntries(
      arranged.specs.map((spec) => [
        spec.name,
        {
          spec,
          node: (
            <SlotPlaceholder
              occupant={spec}
              surface="side-panel"
              // The fill stand-in is always long enough to scroll itself.
              long={long || spec.sizing === "fill"}
            />
          ),
        },
      ]),
    );
    return {
      panel: arranged.panel,
      occupants,
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
