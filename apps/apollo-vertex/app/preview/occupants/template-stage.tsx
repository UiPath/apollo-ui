"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { STAGE_HEIGHT } from "@/app/_components/stage";
import type {
  PanelStatus,
  TemplateHost,
  TemplateLayout,
} from "@/app/_components/template-hosts";
import type { OccupantState } from "@/components/ui/occupant";
import type { OccupantSpec } from "@/lib/composition";
import type { ExampleRole } from "@/lib/occupant-entry";
import { OCCUPANT_REGISTRY } from "@/lib/occupant-registry.generated";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import type { PanelSide } from "@/templates/detail-page/detail-page.template";
import {
  PreviewShell,
  type PreviewShellVariant,
} from "@/templates/shell/PreviewShell";
import { NoFitCard } from "./no-fit-card";
import { StageFrame } from "./stage-frame";
import { slotFit } from "./workbench-url-state";

interface TemplateStageProps {
  host: TemplateHost;
  spec: OccupantSpec;
  slot: string;
  shell: PreviewShellVariant;
  layout: TemplateLayout;
  onPanels: (panels: Record<PanelSide, PanelStatus>) => void;
  sample: ExampleRole;
  state: OccupantState;
  pageWidth: number;
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
  onPanels,
  sample,
  state,
  pageWidth,
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
  const size =
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
    {
      "--page-width": `${pageWidth}px`,
      "--page-height": `${STAGE_HEIGHT}px`,
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
                // A fresh template when the slot or a panel's open state
                // changes: its panels start as configured. Placement and
                // which panels it has apply live.
                key={`${slot}-${layout.start.open}-${layout.end.open}`}
                slot={slot}
                spec={spec}
                layout={layout}
                onPanels={onPanels}
                occupant={entry.render(sample, { state })}
              />
            </LocaleProvider>
          </PreviewShell>
        </div>
      </div>
    </StageFrame>
  );
}
