import type { OccupantSpec, SurfacePadding } from "@/lib/composition";

/** Preview-only occupant spec for a labeled placeholder box. */
export function placeholderOccupant(
  label: string,
  padding: SurfacePadding,
): OccupantSpec<"placeholder"> {
  return {
    name: "placeholder",
    label,
    requires: { minWidth: 0, scroll: "either", padding },
  };
}
