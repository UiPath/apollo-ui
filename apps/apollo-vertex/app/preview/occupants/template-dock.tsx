"use client";

import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OccupantSpec } from "@/lib/composition";
import { type LayoutChoices, resolveLayout } from "@/lib/layout";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { Dock, DockSlider, FitIcon } from "./dock-parts";
import { PageMap } from "./page-map";
import { ShellMenu } from "./shell-menu";
import { SlotPopover, type SlotTarget } from "./slot-popover";
import {
  type ContentsChange,
  occupantsIn,
  type SlotContents,
} from "./workbench-compose";
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
  /** What each slot holds, and changing it. */
  contents: SlotContents;
  onContents: ContentsChange;
  /** The slot whose popover is open, and opening or closing one. */
  opened: SlotTarget | null;
  onOpen: (target: SlotTarget) => void;
  onClose: () => void;
  pageWidth: number;
  onPageWidth: (width: number) => void;
  zoom: WorkbenchZoom;
  onZoom: (zoom: WorkbenchZoom) => void;
  /** The page's current scale on the stage, for the zoom level. */
  scale: number;
}

/**
 * The template view's dock: the page map with the chosen slot and layout,
 * a chip per slot (fits() against each) that opens its popover, the shell,
 * the page width (the whole window, shell included), and the zoom.
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
  contents,
  onContents,
  opened,
  onOpen,
  onClose,
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
        cue="here"
        counts={Object.fromEntries(
          Object.entries(contents).map(([name, panel]) => [
            name,
            occupantsIn(panel).length,
          ]),
        )}
        name={slotName.toLowerCase()}
        shell={shell}
      />
      <Separator orientation="vertical" className="h-8" />
      <ButtonGroup aria-label={t("workbench_slot")}>
        {host.spec.slots.map((s) => {
          const place = host.slotLabels[s.name] ?? s.name;
          const fits = slotFit(host, s.name, spec).fits;
          const here = s.name === slot;
          const open = opened?.slot === s.name;
          return (
            <Button
              key={s.name}
              variant="outline"
              size="sm"
              data-slot="workbench-slot-chip"
              data-chip-slot={s.name}
              data-fits={fits}
              data-here={here}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={
                here
                  ? t("workbench_slot_chip_here", {
                      place,
                      occupant: spec.label,
                    })
                  : t(
                      fits ? "workbench_place_fits" : "workbench_place_no_fit",
                      {
                        place,
                      },
                    )
              }
              className="data-[here=true]:bg-accent data-[here=true]:text-accent-foreground"
              onClick={(event) => {
                if (open) onClose();
                else
                  onOpen({
                    slot: s.name,
                    opener: event.currentTarget,
                    anchor: event.currentTarget,
                  });
              }}
            >
              <FitIcon fits={fits} />
              {place}
            </Button>
          );
        })}
      </ButtonGroup>
      <SlotPopover
        host={host}
        target={opened}
        onClose={onClose}
        spec={spec}
        focusSlot={slot}
        onSlot={onSlot}
        layout={layout}
        onLayout={onLayout}
        status={slotStatus}
        contents={contents}
        onContents={onContents}
      />
      <Separator orientation="vertical" className="h-8" />
      <ShellMenu shell={shell} onShell={onShell} />
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
