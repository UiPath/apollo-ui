"use client";

import { Ban, CircleCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OccupantSpec } from "@/lib/composition";
import type { PanelPlacement } from "@/templates/detail-page/detail-page.template";
import { PageMap } from "./page-map";
import { PAGE_WIDTH_MAX, slotFit } from "./workbench-url-state";

const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];

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
 * The template view's dock, in one piece: the page map with the chosen slot,
 * the slot switcher (fits() against each slot), placement for a side slot,
 * and the page width.
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

  // The slider's thumb takes no props, so it's named here.
  const sliderRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const thumb = sliderRef.current?.querySelector("[role=slider]");
    thumb?.setAttribute("aria-label", t("workbench_page_width"));
    thumb?.setAttribute(
      "aria-valuetext",
      t("workbench_px", { width: pageWidth }),
    );
  });

  return (
    <div
      data-workbench-dock
      // Above the stage, whatever the occupant or template stacks inside it,
      // with the stage blurred behind it.
      className="absolute inset-x-4 bottom-6 z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-4 rounded-xl border border-border bg-background/75 px-4 py-3 shadow-lg backdrop-blur-md"
    >
      <PageMap
        regions={host.regions[slot] ?? []}
        name={slotName.toLowerCase()}
      />
      <Separator orientation="vertical" className="h-8" />
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label={t("workbench_slot")}
        value={slot}
        onValueChange={(next) => {
          if (next) onSlot(next);
        }}
      >
        {host.spec.slots.map((s) => {
          const ok = slotFit(host, s.name, spec).fits;
          const label = host.slotLabels[s.name] ?? s.name;
          return (
            <ToggleGroupItem
              key={s.name}
              value={s.name}
              data-fits={ok}
              aria-label={t(
                ok ? "workbench_slot_fits" : "workbench_slot_no_fit",
                {
                  slot: label,
                },
              )}
            >
              {ok ? (
                <CircleCheck aria-hidden className="text-success" />
              ) : (
                <Ban aria-hidden className="text-muted-foreground" />
              )}
              {label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
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
        <span ref={sliderRef} className="relative block w-56 py-2">
          <Slider
            min={host.minWidth}
            max={PAGE_WIDTH_MAX}
            step={8}
            value={[pageWidth]}
            onValueChange={([next]) => onPageWidth(next ?? pageWidth)}
          />
        </span>
        <output
          data-workbench-page-width
          className="w-16 text-end text-sm tabular-nums"
        >
          {t("workbench_px", { width: pageWidth })}
        </output>
      </div>
    </div>
  );
}
