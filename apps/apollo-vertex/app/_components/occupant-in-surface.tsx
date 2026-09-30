"use client";

import type { CSSProperties } from "react";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import type { OccupantState } from "@/components/ui/occupant";
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
  const Host = SURFACE_HOSTS[surfaceName];
  if (!entry || !surface || !Host) return null;
  const { spec } = entry;
  const padding = occupantPadding(spec);
  const content = entry.render(example, { state });
  const style: CSSProperties = {
    width:
      width ??
      spec.requires.minWidth + (padding === "padded" ? 2 * PADDED_INSET_PX : 0),
    // A horizontal surface doesn't grow downward: it takes its content's height.
    height: surface.provides.orientation === "horizontal" ? "auto" : height,
  };

  return (
    <LocaleProvider>
      <div
        data-slot="occupant-fixture"
        data-surface-name={surface.name}
        className="flex max-w-full flex-col"
        style={style}
      >
        <Host
          padding={padding}
          scroll={scrollOwner(surface, spec)}
          label={spec.label}
        >
          {content}
        </Host>
      </div>
    </LocaleProvider>
  );
}
