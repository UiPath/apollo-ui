"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutRegion, ResolvedLayout } from "@/lib/layout";
import { cn } from "@/lib/utils";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";

interface PageMapProps {
  /** The template's layout, from resolveLayout(). */
  layout: ResolvedLayout;
  /** The slots to highlight: where a surface can go, or the occupant's slot. */
  highlighted: readonly string[];
  /**
   * How they're highlighted: "here", the occupant is in it (filled), or
   * "could", the surface could go there (outlined).
   */
  cue: "here" | "could";
  /** What's highlighted, for its accessible name, in lowercase. */
  name: string;
  /** The shell around the page. Without it, the map is the page alone. */
  shell?: PreviewShellVariant;
}

/** Grid lines covering the used tracks inside a region's first and last. */
function lines(
  tracks: ResolvedLayout["columns"],
  [first, last]: LayoutRegion["columns"],
  offset: number,
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
  return `${used.indexOf(firstUsed) + 1 + offset} / ${used.indexOf(lastUsed) + 2 + offset}`;
}

/** The used tracks' sizes, as grid tracks. */
const sizes = (tracks: ResolvedLayout["columns"]) =>
  tracks.filter((track) => track.used).map((track) => `${track.size}fr`);

/**
 * A small outline of a template's layout, from what its spec declares,
 * with the given slots highlighted. Only the tracks a slot sits in alone
 * take room; closed slots are dashed. With a shell, it sits beside the
 * page (sidebar) or above it (minimal).
 */
export function PageMap({
  layout,
  highlighted,
  cue,
  name,
  shell,
}: PageMapProps) {
  const { t } = useTranslation();
  const sidebar = shell === "sidebar";
  const above = shell === "minimal";
  const grid: CSSProperties = {
    gridTemplateColumns: [
      ...(sidebar ? ["1fr"] : []),
      ...sizes(layout.columns),
    ].join(" "),
    gridTemplateRows: [...(above ? ["1fr"] : []), ...sizes(layout.rows)].join(
      " ",
    ),
  };
  return (
    <div
      role="img"
      aria-label={t("workbench_map", { surface: name })}
      data-slot="workbench-map"
      data-shell={shell}
      style={grid}
      className="grid h-10 w-16 shrink-0 gap-0.5"
    >
      {shell && (
        <span
          data-region="shell"
          style={
            sidebar
              ? { gridColumn: "1 / 2", gridRow: "1 / -1" }
              : { gridColumn: "1 / -1", gridRow: "1 / 2" }
          }
          className="rounded-sm border border-border bg-muted"
        />
      )}
      {layout.regions.map((region) => {
        const column = lines(layout.columns, region.columns, sidebar ? 1 : 0);
        const row = lines(layout.rows, region.rows, above ? 1 : 0);
        if (!column || !row) return null;
        const on = highlighted.includes(region.slot);
        return (
          <span
            key={region.slot}
            data-region={region.slot}
            data-highlighted={on}
            {...(on && { "data-cue": cue })}
            {...(!region.open && { "data-state": "closed" })}
            style={{ gridColumn: column, gridRow: row }}
            className={cn(
              "rounded-sm border border-border",
              // Closed, not missing: a heavier dashed outline, no fill.
              !region.open &&
                "border-2 border-dashed border-muted-foreground/70",
              on && cue === "here" && "border-primary bg-primary",
              on && cue === "could" && "border-2 border-primary bg-transparent",
            )}
          />
        );
      })}
    </div>
  );
}
