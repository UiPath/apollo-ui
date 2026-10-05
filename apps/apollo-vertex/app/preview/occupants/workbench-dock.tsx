"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LAYOUT,
  layoutChoices,
} from "@/app/_components/template-hosts";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fitsSurface, type OccupantSpec } from "@/lib/composition";
import { resolveLayout } from "@/lib/layout";
import { surfaceLabel } from "@/lib/surface-labels";
import { cn } from "@/lib/utils";
import { Dock, DockSlider, FitToggleGroup } from "./dock-parts";
import { PageMap } from "./page-map";
import { lowerLabel, type WidthStatus } from "./workbench-model";
import {
  HOSTED_SURFACES,
  TEMPLATE_NAMES,
  templateFor,
  WIDTH_RANGE,
  WIDTH_STEP,
} from "./workbench-url-state";

// The surface view's map is the default template, as it starts.
const MAP_HOST = templateFor(TEMPLATE_NAMES[0] ?? "");
const MAP_LAYOUT = MAP_HOST
  ? resolveLayout(MAP_HOST.spec, layoutChoices(MAP_HOST, DEFAULT_LAYOUT))
  : null;
/** The default template's slots that take the surface. */
const slotsTaking = (surface: string) =>
  MAP_HOST?.spec.slots
    .filter((slot) => slot.surfaces.includes(surface))
    .map((slot) => slot.name) ?? [];

const STATUS_DOT: Record<WidthStatus, string> = {
  in: "bg-success",
  outside: "bg-warning",
  clips: "bg-destructive",
};

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
 * The surface view's dock: the page map, the surface switcher, and the
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
    <Dock>
      {MAP_LAYOUT && (
        <PageMap
          layout={MAP_LAYOUT}
          highlighted={slotsTaking(surface)}
          name={lowerLabel(surface)}
        />
      )}
      <Separator orientation="vertical" className="h-8" />
      <FitToggleGroup
        label={t("workbench_surface")}
        value={surface}
        onChange={onSurface}
        options={HOSTED_SURFACES.map((s) => ({
          value: s.name,
          label: surfaceLabel(s.name),
          fits: fitsSurface(s, spec).fits,
        }))}
      />
      <Separator orientation="vertical" className="h-8" />
      {fitsHere ? (
        <div className="flex items-center gap-3">
          <DockSlider
            label={t("workbench_width")}
            valueText={t("workbench_width_value", {
              width,
              status: `${statusText}. ${statusHint}`,
            })}
            min={WIDTH_RANGE.min}
            max={WIDTH_RANGE.max}
            step={WIDTH_STEP}
            value={width}
            onChange={onWidth}
            measures="width"
          >
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
          </DockSlider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                data-slot="workbench-status"
                data-status={status}
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
    </Dock>
  );
}
