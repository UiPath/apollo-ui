import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import { occupantPadding, scrollOwner } from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { DetailPage } from "./DetailPage";
import type { DetailPageSlotName } from "./detail-page.template";
import { placeholderOccupant } from "./placeholder-occupants";
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
}

export function DetailPageExample({
  state,
  paddings,
  contents,
  scrolls,
}: DetailPageExampleProps) {
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
