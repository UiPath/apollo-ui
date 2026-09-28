import { ContentArea } from "@/components/ui/content-area";
import {
  PageHeader,
  PageHeaderBackButton,
  PageHeaderNav,
} from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import { occupantPadding } from "@/lib/composition";
import { DetailPage } from "./DetailPage";
import {
  type StartOccupant,
  useStartPanelControls,
} from "./experimental/use-start-panel-controls";
import { placeholderOccupant } from "./placeholder-occupants";
import {
  START_OCCUPANTS,
  type SlotPaddings,
  type StartOccupantName,
} from "./preview-options";
import { SlotPlaceholder } from "./SlotPlaceholder";
import type { DetailPageState } from "./use-detail-page";

interface DetailPageExampleProps {
  state: DetailPageState;
  paddings: SlotPaddings;
  /** How many of START_OCCUPANTS the start panel offers. */
  occupantCount: 1 | 2;
  activeOccupant: StartOccupantName;
  onActiveOccupantChange: (name: StartOccupantName) => void;
}

export function DetailPageExample({
  state,
  paddings,
  occupantCount,
  activeOccupant,
  onActiveOccupantChange,
}: DetailPageExampleProps) {
  const startOccupants: StartOccupant[] = START_OCCUPANTS.slice(
    0,
    occupantCount,
  ).map(({ name, label, icon }) => ({
    spec: placeholderOccupant(label, paddings["start-panel"], name),
    icon,
  }));

  const controls = useStartPanelControls({
    state,
    occupants: startOccupants,
    activeName: activeOccupant,
    onActiveChange: (name) => {
      const match = START_OCCUPANTS.find((o) => o.name === name);
      if (match) onActiveOccupantChange(match.name);
    },
  });

  const header = placeholderOccupant("Header", paddings.header);
  const main = placeholderOccupant("Main", paddings.main);
  const endPanel = placeholderOccupant("End panel", paddings["end-panel"]);
  const startPanel = controls.active.spec;

  return (
    <DetailPage
      state={state}
      startRail={controls.rail}
      header={
        <PageHeader
          padding={occupantPadding(header)}
          leading={controls.headerLeading}
        >
          <PageHeaderNav className="col-span-full self-stretch">
            {controls.headerHasBack && <PageHeaderBackButton />}
            <SlotPlaceholder
              occupant={header}
              surface="page-header"
              className="min-h-11 flex-row gap-3 self-stretch"
            />
          </PageHeaderNav>
        </PageHeader>
      }
      startPanel={
        <SidePanel
          id={controls.panelId}
          side="start"
          aria-label="Start panel"
          padding={occupantPadding(startPanel)}
          toolbar={controls.panelToolbar}
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
