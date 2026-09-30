"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { STAGE_HEIGHT } from "@/app/_components/stage";
import type { TemplateHost } from "@/app/_components/template-hosts";
import type { OccupantState } from "@/components/ui/occupant";
import type { OccupantSpec } from "@/lib/composition";
import type { ExampleRole } from "@/lib/occupant-entry";
import { OCCUPANT_REGISTRY } from "@/lib/occupant-registry.generated";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import type { PanelPlacement } from "@/templates/detail-page/detail-page.template";
import { NoFitCard } from "./no-fit-card";
import { StageFrame } from "./stage-frame";
import { slotFit } from "./workbench-url-state";

interface TemplateStageProps {
  host: TemplateHost;
  spec: OccupantSpec;
  slot: string;
  placement: PanelPlacement;
  sample: ExampleRole;
  state: OccupantState;
  pageWidth: number;
}

/**
 * The template view's stage: the template at the page width, with the
 * occupant in its slot, or why it doesn't go there.
 */
export function TemplateStage({
  host,
  spec,
  slot,
  placement,
  sample,
  state,
  pageWidth,
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
    { "--page-width": `${pageWidth}px`, height: STAGE_HEIGHT } as CSSProperties;
  return (
    <StageFrame
      data-template-name={host.spec.name}
      style={size}
      className="flex w-(--page-width) shrink-0 flex-col"
      tag={t("workbench_frame_tag_template", {
        template: host.label,
        slot: slotName,
        width: pageWidth,
      })}
    >
      <LocaleProvider>
        <Frame
          // A fresh template per slot and placement: its panels start as configured.
          key={`${slot}-${placement}`}
          slot={slot}
          spec={spec}
          placement={placement}
          occupant={entry.render(sample, { state })}
        />
      </LocaleProvider>
    </StageFrame>
  );
}
