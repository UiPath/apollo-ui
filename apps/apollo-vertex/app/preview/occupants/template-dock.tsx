"use client";

import { useTranslation } from "react-i18next";
import {
  slotRegions,
  type TemplateHost,
} from "@/app/_components/template-hosts";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OccupantSpec } from "@/lib/composition";
import type { PanelPlacement } from "@/templates/detail-page/detail-page.template";
import { Dock, DockSlider, FitToggleGroup } from "./dock-parts";
import { PageMap } from "./page-map";
import { PAGE_WIDTH_MAX, slotFit } from "./workbench-url-state";

const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];
/** The page width moves in larger steps than a surface's. */
const PAGE_WIDTH_STEP = 8;

interface TemplateDockProps {
  host: TemplateHost;
  spec: OccupantSpec;
  slot: string;
  onSlot: (slot: string) => void;
  placement: PanelPlacement;
  onPlacement: (placement: PanelPlacement) => void;
  pageWidth: number;
  onPageWidth: (width: number) => void;
}

/**
 * The template view's dock: the page map with the chosen slot, the slot
 * switcher (fits() against each slot), placement for a side slot, and the
 * page width.
 */
export function TemplateDock({
  host,
  spec,
  slot,
  onSlot,
  placement,
  onPlacement,
  pageWidth,
  onPageWidth,
}: TemplateDockProps) {
  const { t } = useTranslation();
  const slotName = host.slotLabels[slot] ?? slot;
  return (
    <Dock>
      <PageMap
        regions={slotRegions(host, slot)}
        name={slotName.toLowerCase()}
      />
      <Separator orientation="vertical" className="h-8" />
      <FitToggleGroup
        label={t("workbench_slot")}
        value={slot}
        onChange={onSlot}
        options={host.spec.slots.map((s) => ({
          value: s.name,
          label: host.slotLabels[s.name] ?? s.name,
          fits: slotFit(host, s.name, spec).fits,
        }))}
      />
      {host.placeable.includes(slot) && (
        <>
          <Separator orientation="vertical" className="h-8" />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label={t("workbench_placement")}
            value={placement}
            onValueChange={(next) => {
              const chosen = PLACEMENTS.find((p) => p === next);
              if (chosen) onPlacement(chosen);
            }}
          >
            {PLACEMENTS.map((p) => (
              <ToggleGroupItem key={p} value={p}>
                {t(`workbench_placement_${p}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      )}
      <Separator orientation="vertical" className="h-8" />
      <div className="flex items-center gap-3">
        <DockSlider
          label={t("workbench_page_width")}
          valueText={t("workbench_px", { width: pageWidth })}
          min={host.minWidth}
          max={PAGE_WIDTH_MAX}
          step={PAGE_WIDTH_STEP}
          value={pageWidth}
          onChange={onPageWidth}
          measures="page-width"
        />
      </div>
    </Dock>
  );
}
