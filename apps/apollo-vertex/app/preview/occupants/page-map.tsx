"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutRegion, ResolvedLayout } from "@/lib/layout";
import { cn } from "@/lib/utils";

interface PageMapProps {
  /** The template's layout, from resolveLayout(). */
  layout: ResolvedLayout;
  /** The slots to highlight: where a surface can go, outlined. */
  highlighted: readonly string[];
  /** What's highlighted, for its accessible name, in lowercase. */
  name: string;
}

/** Grid lines covering the used tracks inside a region's first and last. */
function lines(
  tracks: ResolvedLayout["columns"],
  [first, last]: LayoutRegion["columns"],
): string | null {
  const used = tracks.filter((track) => track.used);
  const start = tracks.findIndex((track) => track.name === first);
  const end = tracks.findIndex((track) => track.name === last);
  const inside = used.filter((track) => {
    const at = tracks.indexOf(track);
    return at >= start && at <= end;
  });
  const firstUsed = inside[0];
  const lastUsed = inside.at(-1);
  if (!firstUsed || !lastUsed) return null;
  return `${used.indexOf(firstUsed) + 1} / ${used.indexOf(lastUsed) + 2}`;
}

/** The used tracks' sizes, as grid tracks. */
const sizes = (tracks: ResolvedLayout["columns"]) =>
  tracks.filter((track) => track.used).map((track) => `${track.size}fr`);

/**
 * A small outline of a template's layout, from what its spec declares,
 * with the given slots highlighted. Only the tracks a slot sits in alone
 * take room; closed slots are dashed.
 */
export function PageMap({ layout, highlighted, name }: PageMapProps) {
  const { t } = useTranslation();
  const grid: CSSProperties = {
    gridTemplateColumns: sizes(layout.columns).join(" "),
    gridTemplateRows: sizes(layout.rows).join(" "),
  };
  return (
    <div
      role="img"
      aria-label={t("workbench_map", { surface: name })}
      data-slot="workbench-map"
      style={grid}
      className="grid h-10 w-16 shrink-0 gap-0.5"
    >
      {layout.regions.map((region) => {
        const column = lines(layout.columns, region.columns);
        const row = lines(layout.rows, region.rows);
        if (!column || !row) return null;
        const on = highlighted.includes(region.slot);
        return (
          <span
            key={region.slot}
            data-region={region.slot}
            data-highlighted={on}
            {...(!region.open && { "data-state": "closed" })}
            style={{ gridColumn: column, gridRow: row }}
            className={cn(
              "rounded-sm border border-border",
              // Closed, not missing: a heavier dashed outline, no fill.
              !region.open &&
                "border-2 border-dashed border-muted-foreground/70",
              on && "border-2 border-primary bg-transparent",
            )}
          />
        );
      })}
    </div>
  );
}
