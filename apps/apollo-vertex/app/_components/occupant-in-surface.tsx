"use client";

import type { CSSProperties } from "react";
import { ContentArea } from "@/components/ui/content-area";
import type { OccupantState } from "@/components/ui/occupant";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import {
  occupantPadding,
  PADDED_INSET_PX,
  scrollOwner,
} from "@/lib/composition";
import { OCCUPANT_REGISTRY } from "@/lib/occupant-registry.generated";
import { SURFACE_SPECS } from "@/lib/occupants.generated";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

interface OccupantInSurfaceProps {
  /** A registered occupant's name. */
  occupant: string;
  /** A registered surface's name. */
  surface: string;
  /** One of the occupant's examples. Defaults to its first. */
  example?: string;
  state?: OccupantState;
  /** The surface's outer width. Defaults to the occupant's minWidth plus padding. */
  width?: number | string;
  /** The surface's height. */
  height?: number | string;
}

/**
 * One registered occupant inside one surface, with no template: how the
 * occupant checks and the docs demos render occupants.
 */
export function OccupantInSurface({
  occupant,
  surface: surfaceName,
  example = "",
  state = "ready",
  width,
  height = 480,
}: OccupantInSurfaceProps) {
  const entry = OCCUPANT_REGISTRY.find((o) => o.spec.name === occupant);
  const surface = SURFACE_SPECS.find((s) => s.name === surfaceName);
  if (!entry || !surface) return null;
  const { spec } = entry;
  const padding = occupantPadding(spec);
  const content = entry.render(example, { state });
  const style: CSSProperties = {
    width:
      width ??
      spec.requires.minWidth + (padding === "padded" ? 2 * PADDED_INSET_PX : 0),
    height: surface.name === "page-header" ? "auto" : height,
  };

  return (
    <LocaleProvider>
      <div
        data-slot="occupant-fixture"
        data-surface-name={surface.name}
        className="flex max-w-full flex-col"
        style={style}
      >
        {surface.name === "page-header" && (
          <PageHeader padding={padding}>{content}</PageHeader>
        )}
        {surface.name === "side-panel" && (
          <SidePanel
            side="end"
            aria-label={spec.label}
            padding={padding}
            scroll={scrollOwner(surface, spec)}
            className="w-full [--side-panel-width:100%]"
          >
            {content}
          </SidePanel>
        )}
        {surface.name === "content-area" && (
          <ContentArea padding={padding} scroll={scrollOwner(surface, spec)}>
            {content}
          </ContentArea>
        )}
      </div>
    </LocaleProvider>
  );
}
