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
  /**
   * A layout option's picture, decorative: the slot in the text's color,
   * a closed one a narrow strip, the rest faint. Neutral, no accent.
   */
  thumbnail?: boolean;
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

/** The used tracks' sizes, as grid tracks; a closed slot's own tracks narrow. */
const sizes = (tracks: ResolvedLayout["columns"], narrow = new Set<string>()) =>
  tracks
    .filter((track) => track.used)
    .map((track) => (narrow.has(track.name) ? "4px" : `${track.size}fr`));

/** The tracks only closed slots sit in, along one axis. */
function closedTracks(
  layout: ResolvedLayout,
  axis: "columns" | "rows",
): Set<string> {
  const tracks = layout[axis];
  const within = (region: LayoutRegion, name: string) => {
    const [first, last] = region[axis];
    const at = tracks.findIndex((t) => t.name === name);
    return (
      at >= tracks.findIndex((t) => t.name === first) &&
      at <= tracks.findIndex((t) => t.name === last)
    );
  };
  return new Set(
    tracks
      .filter((track) => {
        const over = layout.regions.filter((r) => within(r, track.name));
        return over.length > 0 && over.every((r) => !r.open);
      })
      .map((track) => track.name),
  );
}

/**
 * A small outline of a template's layout, from what its spec declares,
 * with the given slots highlighted. Only the tracks a slot sits in alone
 * take room; closed slots are dashed.
 */
export function PageMap({
  layout,
  highlighted,
  name,
  thumbnail = false,
}: PageMapProps) {
  const { t } = useTranslation();
  // A thumbnail draws a closed slot as the strip it is: its tracks narrow.
  const closedOnly = (axis: "columns" | "rows") =>
    thumbnail ? closedTracks(layout, axis) : new Set<string>();
  const grid: CSSProperties = {
    gridTemplateColumns: sizes(layout.columns, closedOnly("columns")).join(" "),
    gridTemplateRows: sizes(layout.rows, closedOnly("rows")).join(" "),
  };
  return (
    <div
      {...(thumbnail
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": t("workbench_map", { surface: name }) })}
      data-slot={thumbnail ? "workbench-map-thumbnail" : "workbench-map"}
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
              on && !thumbnail && "border-2 border-primary bg-transparent",
              // A thumbnail: neutral, the slot in the text's color.
              thumbnail && "border-border bg-muted",
              thumbnail &&
                on &&
                "border-foreground bg-foreground/80 data-[state=closed]:bg-transparent",
            )}
          />
        );
      })}
    </div>
  );
}
