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
import {
  PAGE_WIDTH_MAX,
  slotFit,
  type WorkbenchZoom,
} from "./workbench-url-state";

const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];
const ZOOMS: readonly WorkbenchZoom[] = ["fit", "actual"];
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
  zoom: WorkbenchZoom;
  onZoom: (zoom: WorkbenchZoom) => void;
  /** The page's current scale on the stage, for the zoom level. */
  scale: number;
}

/**
 * The template view's dock: the page map with the chosen slot, the slot
 * switcher (fits() against each slot), placement for a side slot, the
 * page width, and the zoom.
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
  zoom,
  onZoom,
  scale,
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
      <Separator orientation="vertical" className="h-8" />
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label={t("workbench_zoom")}
          value={zoom}
          onValueChange={(next) => {
            const chosen = ZOOMS.find((z) => z === next);
            if (chosen) onZoom(chosen);
          }}
        >
          {ZOOMS.map((z) => (
            <ToggleGroupItem key={z} value={z}>
              {t(`workbench_zoom_${z}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <output
          data-slot="workbench-zoom-level"
          aria-label={t("workbench_zoom_level")}
          className="w-10 text-sm tabular-nums text-muted-foreground"
        >
          {t("workbench_percent", { percent: Math.round(scale * 100) })}
        </output>
      </div>
    </Dock>
  );
}
