"use client";

import { Ban, CircleCheck } from "lucide-react";
import { type CSSProperties, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fitsSurface, type OccupantSpec } from "@/lib/composition";
import { surfaceLabel } from "@/lib/surface-labels";
import { cn } from "@/lib/utils";
import { PageMap } from "./page-map";
import type { WidthStatus } from "./workbench-model";
import { HOSTED_SURFACES, WIDTH_RANGE } from "./workbench-url-state";

const STATUS_DOT: Record<WidthStatus, string> = {
  in: "bg-success",
  outside: "bg-warning",
  clips: "bg-destructive",
};

/** A mark's place along the slider, as a custom property. */
const markAt = (value: number) =>
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
  ({
    "--at": `${((value - WIDTH_RANGE.min) / (WIDTH_RANGE.max - WIDTH_RANGE.min)) * 100}%`,
  }) as CSSProperties;

interface WorkbenchDockProps {
  spec: OccupantSpec;
  surface: string;
  onSurface: (name: string) => void;
  /** Whether the occupant goes in the selected surface. */
  fitsHere: boolean;
  width: number;
  onWidth: (width: number) => void;
  /** Slider marks in outer px: the surface's range and the measured floor. */
  marks: { min: number | null; max: number | null; floor: number | null };
  status: WidthStatus;
}

/**
 * The dock, in one piece: the page map, the surface switcher, and the
 * width slider with its status, or a note where the occupant doesn't fit.
 */
export function WorkbenchDock({
  spec,
  surface,
  onSurface,
  fitsHere,
  width,
  onWidth,
  marks,
  status,
}: WorkbenchDockProps) {
  const { t } = useTranslation();
  const statusText = t(`workbench_status_${status}`);
  const statusHint = t(`workbench_status_${status}_hint`);

  // The slider's thumb takes no props, so it's named here.
  const sliderRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const thumb = sliderRef.current?.querySelector("[role=slider]");
    thumb?.setAttribute("aria-label", t("workbench_width"));
    thumb?.setAttribute(
      "aria-valuetext",
      t("workbench_width_value", {
        width,
        status: `${statusText}. ${statusHint}`,
      }),
    );
  });

  const ticks = [
    { at: marks.min, tone: "bg-muted-foreground", name: "min" },
    { at: marks.max, tone: "bg-muted-foreground", name: "max" },
    { at: marks.floor, tone: "bg-destructive", name: "floor" },
  ].filter(
    (tick): tick is { at: number; tone: string; name: string } =>
      tick.at !== null &&
      tick.at >= WIDTH_RANGE.min &&
      tick.at <= WIDTH_RANGE.max,
  );

  return (
    <div
      data-workbench-dock
      // Above the stage, whatever the occupant or template stacks inside it,
      // with the stage blurred behind it.
      className="absolute inset-x-4 bottom-6 z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-4 rounded-xl border border-border bg-background/75 px-4 py-3 shadow-lg backdrop-blur-md"
    >
      <PageMap
        regions={SURFACE_HOSTS[surface]?.regions ?? []}
        name={surfaceLabel(surface).toLowerCase()}
      />
      <Separator orientation="vertical" className="h-8" />
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label={t("workbench_surface")}
        value={surface}
        onValueChange={(name) => {
          if (name) onSurface(name);
        }}
      >
        {HOSTED_SURFACES.map((s) => {
          const ok = fitsSurface(s, spec).fits;
          return (
            <ToggleGroupItem
              key={s.name}
              value={s.name}
              data-fits={ok}
              aria-label={t(
                ok ? "workbench_surface_fits" : "workbench_surface_no_fit",
                { surface: surfaceLabel(s.name) },
              )}
            >
              {ok ? (
                <CircleCheck aria-hidden className="text-success" />
              ) : (
                <Ban aria-hidden className="text-muted-foreground" />
              )}
              {surfaceLabel(s.name)}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      <Separator orientation="vertical" className="h-8" />
      {fitsHere ? (
        <div className="flex items-center gap-3">
          <span ref={sliderRef} className="relative block w-56 py-2">
            <Slider
              min={WIDTH_RANGE.min}
              max={WIDTH_RANGE.max}
              step={4}
              value={[width]}
              onValueChange={([next]) => onWidth(next ?? width)}
            />
            {ticks.map((tick) => (
              <span
                key={tick.name}
                aria-hidden="true"
                data-mark={tick.name}
                data-at={tick.at}
                style={markAt(tick.at)}
                className={cn(
                  "pointer-events-none absolute start-(--at) bottom-0 h-1.5 w-px",
                  tick.tone,
                )}
              />
            ))}
          </span>
          <output
            data-workbench-width
            className="w-16 text-end text-sm tabular-nums"
          >
            {t("workbench_px", { width })}
          </output>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                data-workbench-status={status}
                className="flex shrink-0 items-center gap-1.5 text-sm"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    STATUS_DOT[status],
                  )}
                />
                {statusText}
              </span>
            </TooltipTrigger>
            <TooltipContent>{statusHint}</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("workbench_width_unavailable")}
        </p>
      )}
    </div>
  );
}
