"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import type { OccupantState } from "@/components/ui/occupant";
import type { OccupantSpec } from "@/lib/composition";
import type { LayoutChoices } from "@/lib/layout";
import type { ExampleRole } from "@/lib/occupant-entry";
import { OCCUPANT_REGISTRY } from "@/lib/occupant-registry.generated";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import {
  PreviewShell,
  type PreviewShellVariant,
} from "@/templates/shell/PreviewShell";
import { NoFitCard } from "./no-fit-card";
import { StageFrame } from "./stage-frame";
import { activeTab, occupantsIn, type SlotContents } from "./workbench-compose";
import { slotFit } from "./workbench-url-state";

/** The slots the choices close, as one key. */
const closedSlots = (layout: LayoutChoices) =>
  Object.entries(layout)
    .filter(([, choice]) => choice.open === false)
    .map(([slot]) => slot)
    .join(",");

interface TemplateStageProps {
  host: TemplateHost;
  spec: OccupantSpec;
  slot: string;
  shell: PreviewShellVariant;
  layout: LayoutChoices;
  /** What each slot holds: the focused occupant, and any added. */
  contents: SlotContents;
  /** The tab each slot shows, when one was chosen. */
  tabs: Readonly<Record<string, string>>;
  onTab: (slot: string, id: string) => void;
  onStatus: (status: Readonly<Record<string, SlotStatus>>) => void;
  sample: ExampleRole;
  state: OccupantState;
  pageWidth: number;
  /** The page's real height: tall enough for the frame to fill the stage. */
  pageHeight: number;
  /** How much the page is shrunk to fit the stage: 1 at its real size. */
  scale: number;
}

/**
 * The template view's stage: the template at the page width, with the
 * occupant in its slot, or why it doesn't go there. The frame takes the
 * scaled size, and the page inside it keeps its real width, so the
 * template's rules and the frame tag see the real page width. The page is
 * the whole window: the template inside the real ApolloShell.
 */
export function TemplateStage({
  host,
  spec,
  slot,
  shell,
  layout,
  contents,
  tabs,
  onTab,
  onStatus,
  sample,
  state,
  pageWidth,
  pageHeight,
  scale,
}: TemplateStageProps) {
  const { t } = useTranslation();
  const slotName = host.slotLabels[slot] ?? slot;
  const result = slotFit(host, slot, spec);
  const entry = OCCUPANT_REGISTRY.find((o) => o.spec.name === spec.name);
  if (!result.fits || !entry)
    return (
      <NoFitCard
        title={t("workbench_no_fit_slot_title", {
          occupant: spec.label,
          slot: slotName.toLowerCase(),
        })}
        reasons={result.reasons}
      />
    );
  const { Frame } = host;
  // The focused occupant in the chosen sample and state; any added beside
  // it in their primary sample, ready.
  const rendered = Object.fromEntries(
    Object.entries(contents).map(([name, panel]) => [
      name,
      {
        panel,
        defaultTab: tabs[name] ?? activeTab(panel, spec.name),
        onTabChange: (id: string) => onTab(name, id),
        occupants: Object.fromEntries(
          occupantsIn(panel).flatMap((occupant) => {
            const found = OCCUPANT_REGISTRY.find(
              (o) => o.spec.name === occupant,
            );
            if (!found) return [];
            const focused = occupant === spec.name;
            const node = found.render(focused ? sample : "primary", {
              state: focused ? state : "ready",
            });
            return [[occupant, { spec: found.spec, node }]];
          }),
        ),
      },
    ]),
  );
  const size =
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
    {
      "--page-width": `${pageWidth}px`,
      "--page-height": `${pageHeight}px`,
      "--zoom": scale,
    } as CSSProperties;
  return (
    <StageFrame
      data-template-name={host.spec.name}
      data-zoom={Math.round(scale * 100)}
      style={size}
      className="h-[calc(var(--page-height)*var(--zoom))] w-[calc(var(--page-width)*var(--zoom))] shrink-0"
      tag={t("workbench_frame_tag_template", {
        template: host.label,
        slot: slotName,
        width: pageWidth,
      })}
    >
      {/* Always scaled, even by 1: a fixed-position part stays in the frame. */}
      <div
        data-slot="workbench-page"
        className="flex h-(--page-height) w-(--page-width) origin-top-left scale-(--zoom) flex-col"
      >
        {/* ApolloShell sizes itself to the window (h-screen); here it fills the page. */}
        <div className="h-full [&_.h-screen]:h-full [&_.min-h-svh]:min-h-0">
          <PreviewShell variant={shell} basePath="/preview/occupants">
            <LocaleProvider>
              <Frame
                // A fresh template when the slot or a slot's open state
                // changes: its slots start as chosen. Placement and which
                // slots it has apply live.
                key={`${slot}-${closedSlots(layout)}`}
                slot={slot}
                contents={rendered}
                choices={layout}
                onStatus={onStatus}
              />
            </LocaleProvider>
          </PreviewShell>
        </div>
      </div>
    </StageFrame>
  );
}
