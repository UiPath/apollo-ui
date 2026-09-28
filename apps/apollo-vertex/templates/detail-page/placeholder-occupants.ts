import type { OccupantSpec, SurfacePadding } from "@/lib/composition";

/** Preview-only occupant spec for a labeled placeholder box. */
export function placeholderOccupant(
  label: string,
  padding: SurfacePadding,
  name = "placeholder",
): OccupantSpec {
  return {
    name,
    label,
    requires: { minWidth: 0, scroll: "either", padding },
  };
}
