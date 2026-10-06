/*
 * The workbench chrome keeps primary teal for the selected slot, focus
 * rings, and links. A segmented control's chosen segment is neutral: a
 * fill and heavier text, so it reads without color.
 */

/** The chosen segment of a segmented control (a single toggle group's item). */
export const SELECTED_SEGMENT =
  "data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground";
