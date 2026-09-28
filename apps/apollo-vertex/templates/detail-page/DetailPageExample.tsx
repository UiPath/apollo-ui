import { ContentArea } from "@/components/ui/content-area";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import { DetailPage } from "./DetailPage";
import { SlotPlaceholder } from "./SlotPlaceholder";

export function DetailPageExample() {
  return (
    <DetailPage
      header={
        <PageHeader bordered>
          <SlotPlaceholder
            label="Header"
            surface="page-header"
            className="h-14 flex-row gap-3"
          />
        </PageHeader>
      }
      startPanel={
        <SidePanel side="start" aria-label="Start panel" className="p-4">
          <SlotPlaceholder label="Start panel" surface="side-panel" />
        </SidePanel>
      }
      main={
        <ContentArea className="pt-4">
          <SlotPlaceholder label="Main" surface="content-area" />
        </ContentArea>
      }
      endPanel={
        <SidePanel side="end" aria-label="End panel" className="p-4">
          <SlotPlaceholder label="End panel" surface="side-panel" />
        </SidePanel>
      }
    />
  );
}
