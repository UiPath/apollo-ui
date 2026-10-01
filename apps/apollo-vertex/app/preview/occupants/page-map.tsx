"use client";

import { useTranslation } from "react-i18next";
import { MAP_REGIONS, type MapRegion } from "@/app/_components/surface-hosts";
import { cn } from "@/lib/utils";
import {
  type DetailPagePanels,
  enabledPanels,
  type PanelPlacement,
  type PanelSide,
} from "@/templates/detail-page/detail-page.template";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";

/** A template's current layout, as the map draws it. */
interface PageMapLayout {
  shell: PreviewShellVariant;
  panels: DetailPagePanels;
  /** Whether each panel is open after the template's rules. */
  open: Record<PanelSide, boolean>;
  placement: Record<PanelSide, PanelPlacement>;
}

interface PageMapProps {
  /** The parts to highlight: a surface's regions, or a template slot's. */
  regions: readonly MapRegion[];
  /** What's highlighted, for its accessible name, in lowercase. */
  name: string;
  /** The template's layout. Without it, the map shows the whole outline. */
  layout?: PageMapLayout;
}

/** A grid line pair covering one track, from `from`. */
const span = (from: number) => `${from} / ${from + 1}`;

type Placed = {
  region: MapRegion | "shell";
  column: string;
  row: string;
  closed?: boolean;
};

/**
 * Where each part sits on the map's grid for a layout: the shell beside or
 * above the page, only the panels it has, and beside-header panels running
 * the page's full height.
 */
function placeParts(layout: PageMapLayout): {
  columns: string;
  rows: string;
  parts: Placed[];
} {
  const present = enabledPanels(layout.panels);
  const sidebar = layout.shell === "sidebar";
  const columns = [
    sidebar && "1fr",
    present.start && "2fr",
    "4fr",
    present.end && "2fr",
  ].filter(Boolean);
  let column = 1;
  const shellColumn = sidebar ? column++ : 0;
  const startColumn = present.start ? column++ : 0;
  const mainColumn = column++;
  const endColumn = present.end ? column++ : 0;
  const firstPageColumn = sidebar ? 2 : 1;
  const top = sidebar ? 1 : 2;
  const header = top;
  const body = top + 1;
  const beside = (side: PanelSide) =>
    present[side] && layout.placement[side] === "beside-header";
  const panel = (side: PanelSide, at: number): Placed => ({
    region: side === "start" ? "start-panel" : "end-panel",
    column: span(at),
    row: beside(side) ? `${header} / ${body + 1}` : span(body),
    closed: !layout.open[side],
  });
  const parts: Placed[] = [
    sidebar
      ? { region: "shell", column: span(shellColumn), row: "1 / -1" }
      : { region: "shell", column: "1 / -1", row: "1 / 2" },
    {
      region: "header",
      column: `${beside("start") ? startColumn + 1 : firstPageColumn} / ${
        beside("end") ? endColumn : column
      }`,
      row: span(header),
    },
    { region: "main", column: span(mainColumn), row: span(body) },
  ];
  if (present.start) parts.push(panel("start", startColumn));
  if (present.end) parts.push(panel("end", endColumn));
  return {
    columns: columns.join(" "),
    rows: sidebar ? "1fr 3fr" : "1fr 1fr 3fr",
    parts,
  };
}

/**
 * A small template outline with the selected surface's or slot's regions
 * highlighted, from its host. With a layout, it follows the template's
 * shell, panels, and placement; closed panels are dashed.
 */
export function PageMap({ regions, name, layout }: PageMapProps) {
  const { t } = useTranslation();
  const placed = layout && placeParts(layout);
  return (
    <div
      role="img"
      aria-label={t("workbench_map", { surface: name })}
      data-slot="workbench-map"
      data-shell={layout?.shell}
      style={
        placed && {
          gridTemplateColumns: placed.columns,
          gridTemplateRows: placed.rows,
        }
      }
      className={cn(
        "grid h-10 w-16 shrink-0 gap-0.5",
        !placed && "grid-cols-[1fr_2fr_1fr] grid-rows-[1fr_3fr]",
      )}
    >
      {placed
        ? placed.parts.map((part) => {
            const highlighted =
              part.region !== "shell" && regions.includes(part.region);
            return (
              <span
                key={part.region}
                data-region={part.region}
                data-highlighted={highlighted}
                {...(part.closed && { "data-state": "closed" })}
                style={{ gridColumn: part.column, gridRow: part.row }}
                className={cn(
                  "rounded-sm border border-border",
                  part.region === "shell" && "bg-muted",
                  part.closed && "border-dashed",
                  highlighted && "border-primary bg-primary",
                )}
              />
            );
          })
        : MAP_REGIONS.map((region) => (
            <span
              key={region}
              data-region={region}
              data-highlighted={regions.includes(region)}
              className={cn(
                "rounded-sm border border-border",
                region === "header" && "col-span-3",
                regions.includes(region) && "border-primary bg-primary",
              )}
            />
          ))}
    </div>
  );
}
