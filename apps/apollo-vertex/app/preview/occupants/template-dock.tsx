"use client";

import { useTranslation } from "react-i18next";
import {
  type PanelStatus,
  slotRegions,
  type TemplateHost,
  type TemplateLayout,
} from "@/app/_components/template-hosts";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OccupantSpec } from "@/lib/composition";
import type { PanelSide } from "@/templates/detail-page/detail-page.template";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { Dock, DockSlider, FitToggleGroup } from "./dock-parts";
import { PageMap } from "./page-map";
import { TemplateLayoutMenu } from "./template-layout-menu";
import {
  PAGE_WIDTH_MAX,
  pageWidthMin,
  slotFit,
  type WorkbenchZoom,
} from "./workbench-url-state";

const ZOOMS: readonly WorkbenchZoom[] = ["fit", "actual"];
/** The page width moves in larger steps than a surface's. */
const PAGE_WIDTH_STEP = 8;

interface TemplateDockProps {
  host: TemplateHost;
  spec: OccupantSpec;
  slot: string;
  onSlot: (slot: string) => void;
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
  layout: TemplateLayout;
  onLayout: (layout: TemplateLayout) => void;
  /** Each panel after the template's rules, once the template has rendered. */
  panelStatus: Record<PanelSide, PanelStatus> | null;
  pageWidth: number;
  onPageWidth: (width: number) => void;
  zoom: WorkbenchZoom;
  onZoom: (zoom: WorkbenchZoom) => void;
  /** The page's current scale on the stage, for the zoom level. */
  scale: number;
}

/**
 * The template view's dock: the page map with the chosen slot and layout,
 * the slot switcher (fits() against each slot), the Layout menu, the page
 * width (the whole window, shell included), and the zoom.
 */
export function TemplateDock({
  host,
  spec,
  slot,
  onSlot,
  shell,
  onShell,
  layout,
  onLayout,
  panelStatus,
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
        layout={{
          shell,
          panels: layout.panels,
          open: {
            start: panelStatus?.start.open ?? layout.start.open,
            end: panelStatus?.end.open ?? layout.end.open,
          },
          placement: {
            start: layout.start.placement,
            end: layout.end.placement,
          },
        }}
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
      <Separator orientation="vertical" className="h-8" />
      <TemplateLayoutMenu
        host={host}
        slot={slot}
        shell={shell}
        onShell={onShell}
        layout={layout}
        onLayout={onLayout}
        status={panelStatus}
      />
      <Separator orientation="vertical" className="h-8" />
      <div className="flex items-center gap-3">
        <DockSlider
          label={t("workbench_page_width")}
          valueText={t("workbench_px", { width: pageWidth })}
          min={pageWidthMin(host, shell)}
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
