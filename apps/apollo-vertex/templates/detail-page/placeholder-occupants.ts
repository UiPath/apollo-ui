import type {
  OccupantSpec,
  ScrollOwner,
  SurfacePadding,
} from "@/lib/composition";

/** Preview-only occupant spec for a labeled placeholder box. */
export function placeholderOccupant(
  label: string,
  padding: SurfacePadding,
  scroll: ScrollOwner | "either" = "either",
): OccupantSpec<"placeholder"> {
  return {
    name: "placeholder",
    label,
    requires: { minWidth: 0, scroll, padding },
  };
}
