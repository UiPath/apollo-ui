"use client";

import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OccupantSpec } from "@/lib/composition";
import { type LayoutChoices, resolveLayout } from "@/lib/layout";
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

/** The choices with each slot's open state as the template's rules left it. */
const withStatus = (
  layout: LayoutChoices,
  status: Readonly<Record<string, SlotStatus>> | null,
): LayoutChoices => {
  if (!status) return layout;
  const slots = new Set([...Object.keys(layout), ...Object.keys(status)]);
  return Object.fromEntries(
    [...slots].map((slot) => {
      const after = status[slot];
      return [slot, { ...layout[slot], ...(after && { open: after.open }) }];
    }),
  );
};
/** The page width moves in larger steps than a surface's. */
const PAGE_WIDTH_STEP = 8;

interface TemplateDockProps {
  host: TemplateHost;
  spec: OccupantSpec;
  slot: string;
  onSlot: (slot: string) => void;
  shell: PreviewShellVariant;
  onShell: (shell: PreviewShellVariant) => void;
  layout: LayoutChoices;
  onLayout: (layout: LayoutChoices) => void;
  /** Each slot after the template's rules, once the template has rendered. */
  slotStatus: Readonly<Record<string, SlotStatus>> | null;
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
  slotStatus,
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
        layout={resolveLayout(host.spec, withStatus(layout, slotStatus))}
        highlighted={[slot]}
        name={slotName.toLowerCase()}
        shell={shell}
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
        status={slotStatus}
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
