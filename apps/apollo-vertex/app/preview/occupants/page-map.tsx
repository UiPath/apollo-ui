"use client";

import { useTranslation } from "react-i18next";
import { MAP_REGIONS, type MapRegion } from "@/app/_components/surface-hosts";
import { cn } from "@/lib/utils";

interface PageMapProps {
  /** The parts to highlight: a surface's regions, or a template slot's. */
  regions: readonly MapRegion[];
  /** What's highlighted, for its accessible name, in lowercase. */
  name: string;
}

/** Where each part of the outline sits: a header over three columns. */
const PLACEMENT: Record<MapRegion, string> = {
  header: "col-span-3",
  "start-panel": "",
  main: "",
  "end-panel": "",
};

/**
 * A small template outline (header, start panel, main, end panel) with the
 * selected surface's or slot's regions highlighted, from its host.
 */
export function PageMap({ regions, name }: PageMapProps) {
  const { t } = useTranslation();
  return (
    <div
      role="img"
      aria-label={t("workbench_map", { surface: name })}
      data-workbench-map
      className="grid h-10 w-16 shrink-0 grid-cols-[1fr_2fr_1fr] grid-rows-[1fr_3fr] gap-0.5"
    >
      {MAP_REGIONS.map((region) => (
        <span
          key={region}
          data-region={region}
          data-highlighted={regions.includes(region)}
          className={cn(
            "rounded-sm border border-border",
            PLACEMENT[region],
            regions.includes(region) && "border-primary bg-primary",
          )}
        />
      ))}
    </div>
  );
}
