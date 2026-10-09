/*
 * The workbench chrome keeps primary teal for the selected slot, focus
 * rings, and links. A segmented control's chosen segment is neutral: a
 * fill and heavier text, so it reads without color.
 */

/** The chosen segment of a segmented control (a single toggle group's item). */
export const SELECTED_SEGMENT =
  "data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground";

/**
 * The header's view switch, the one inverted control: the text color as
 * the chosen segment's fill and the surface color as its label, in both
 * themes, with no accent hue. Its border goes with the fill.
 */
export const INVERTED_SEGMENT =
  "data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:font-semibold data-[state=on]:text-background data-[state=on]:hover:bg-foreground data-[state=on]:hover:text-background";
