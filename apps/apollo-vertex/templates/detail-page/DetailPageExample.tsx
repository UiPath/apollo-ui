import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import type { SurfacePadding } from "@/lib/composition";
import { occupantPadding } from "@/lib/composition";
import type { DetailPageSlotName } from "./detail-page.template";
import { DetailPage } from "./DetailPage";
import { placeholderOccupant } from "./placeholder-occupants";
import { SlotPlaceholder } from "./SlotPlaceholder";

export type SlotPaddings = Record<DetailPageSlotName, SurfacePadding>;

interface DetailPageExampleProps {
  paddings: SlotPaddings;
}

export function DetailPageExample({ paddings }: DetailPageExampleProps) {
  const header = placeholderOccupant("Header", paddings.header);
  const startPanel = placeholderOccupant(
    "Start panel",
    paddings["start-panel"],
  );
  const main = placeholderOccupant("Main", paddings.main);
  const endPanel = placeholderOccupant("End panel", paddings["end-panel"]);

  return (
    <DetailPage
      header={
        <PageHeader padding={occupantPadding(header)}>
          <SlotPlaceholder
            occupant={header}
            surface="page-header"
            className="col-span-full min-h-11 flex-row gap-3 self-stretch"
          />
        </PageHeader>
      }
      startPanel={
        <SidePanel
          side="start"
          aria-label="Start panel"
          padding={occupantPadding(startPanel)}
        >
          <SlotPlaceholder occupant={startPanel} surface="side-panel" />
        </SidePanel>
      }
      main={
        <ContentArea padding={occupantPadding(main)}>
          <SlotPlaceholder occupant={main} surface="content-area" />
        </ContentArea>
      }
      endPanel={
        <SidePanel
          side="end"
          aria-label="End panel"
          padding={occupantPadding(endPanel)}
        >
          <SlotPlaceholder occupant={endPanel} surface="side-panel" />
        </SidePanel>
      }
    />
  );
}
