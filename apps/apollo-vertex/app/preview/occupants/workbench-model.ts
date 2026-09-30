import {
  fits,
  fitsSurface,
  type OccupantSpec,
  occupantPadding,
  PADDED_INSET_PX,
  type SurfaceSpec,
} from "@/lib/composition";
import { surfaceLabel } from "@/lib/surface-labels";
import { HOSTED_SURFACES, occupantInset } from "./workbench-url-state";

/*
 * What the workbench works out from the specs and its measurements, apart
 * from rendering.
 */

/** Where the width sits: in the surface's range, outside it, or narrower than the floor. */
export type WidthStatus = "in" | "outside" | "clips";

export const lowerLabel = (name: string) => surfaceLabel(name).toLowerCase();

/** The surfaces an occupant claims, in the hosts' order. */
export const claimedSurfaces = (spec: OccupantSpec) =>
  HOSTED_SURFACES.filter((surface) => fitsSurface(surface, spec).fits);

/** fits() for a surface held at an outer width, as if a slot held it there. */
export const fitsAt = (
  surface: SurfaceSpec,
  spec: OccupantSpec,
  width: number,
) =>
  fits(
    {
      name: "workbench",
      required: true,
      surfaces: [surface.name],
      width: { min: width, default: width },
    },
    surface,
    spec,
  );

/**
 * The surface a minimum width follows: one it claims whose inner width, for
 * the occupant's padding, is exactly its minimum. That's how
 * --min-width follow writes it.
 */
export function followedSurface(spec: OccupantSpec) {
  const flush = occupantPadding(spec) === "flush";
  return claimedSurfaces(spec).find((surface) => {
    const { min } = surface.provides.width;
    const inner = min + (flush ? 2 * PADDED_INSET_PX : 0);
    return min > 0 && spec.requires.minWidth === inner;
  });
}

/** The surface's range in outer px, where its specs set one: null for none. */
export function surfaceRange(surface: SurfaceSpec, spec: OccupantSpec) {
  const { max } = surface.provides.width;
  return {
    min: surface.width?.min ?? null,
    max: typeof max === "number" ? max + occupantInset(spec) : null,
  };
}

/**
 * Clips comes only from the live overflow check on the stage, which sees
 * exactly what's shown: this sample, this state, this width. The measured
 * floor is a marker, not a verdict.
 */
export function widthStatus(options: {
  width: number;
  range: { min: number | null; max: number | null };
  /** Whether the stage overflows at this width, measured after it settles. */
  overflows: boolean;
}): WidthStatus {
  const { width, range, overflows } = options;
  if (overflows) return "clips";
  if (
    (range.min !== null && width < range.min) ||
    (range.max !== null && width > range.max)
  )
    return "outside";
  return "in";
}
