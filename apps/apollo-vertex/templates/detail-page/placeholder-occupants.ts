import type {
  LocaleKey,
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
    // A preview box shows its label; a panel that titles it sets its own.
    titleKey: "detail_page_preview_placeholder",
    // A dashed box works in any shape of space.
    orientations: ["horizontal", "vertical"],
    requires: { minWidth: 0, scroll, padding },
  };
}

/**
 * Preview-only stand-in for a document viewer: a "fill" occupant, so it is
 * alone in its tab, takes the tab's whole height, and scrolls itself. Pass
 * the translated label for its placeholder box.
 */
export function fillPlaceholderOccupant(
  label: string,
  titleKey: LocaleKey,
): OccupantSpec<"placeholder-document"> {
  return {
    name: "placeholder-document",
    label,
    titleKey,
    sizing: "fill",
    orientations: ["vertical"],
    requires: { minWidth: 0, scroll: "occupant", padding: "flush" },
  };
}

/**
 * Preview-only placeholder with its own name and title, so several can
 * share a panel: tabs and stacks need each occupant once, with a title.
 * Pass the translated label for its placeholder box.
 */
export function namedPlaceholderOccupant<TName extends string>(
  name: TName,
  label: string,
  titleKey: LocaleKey,
  padding: SurfacePadding = "padded",
  scroll: ScrollOwner | "either" = "either",
): OccupantSpec<TName> {
  return {
    name,
    label,
    titleKey,
    orientations: ["vertical"],
    requires: { minWidth: 0, scroll, padding },
  };
}
