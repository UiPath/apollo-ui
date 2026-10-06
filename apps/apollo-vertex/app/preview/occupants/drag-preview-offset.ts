import type { Modifier } from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";

/*
 * Where the drag preview sits: down and right of the pointer, so the place
 * under it (an insertion line, a highlighted tab) stays in sight.
 */

/** How far right of the pointer the preview starts, in px. */
export const PREVIEW_OFFSET_X = 16;
/** How far below the pointer it starts: past the bottom of a tab, from its middle. */
export const PREVIEW_OFFSET_Y = 24;
/** A place this tall or less is a tab bar's; a keyboard drag puts the preview below it. */
const BAR_HEIGHT_PX = 64;

/**
 * Offsets the drag preview from the pointer. By pointer, the preview's
 * corner follows the pointer, offset down and right, wherever on the row
 * it was picked up. By keyboard there's no pointer: the preview starts at
 * the place the keyboard moved to, so it goes below a tab bar's place.
 */
export const offsetFromPointer: Modifier = ({
  activatorEvent,
  activeNodeRect,
  over,
  transform,
}) => {
  const pointer = activatorEvent ? getEventCoordinates(activatorEvent) : null;
  if (pointer && activeNodeRect)
    return {
      ...transform,
      x: transform.x + pointer.x - activeNodeRect.left + PREVIEW_OFFSET_X,
      y: transform.y + pointer.y - activeNodeRect.top + PREVIEW_OFFSET_Y,
    };
  const below =
    over && over.rect.height <= BAR_HEIGHT_PX ? over.rect.height : 0;
  return {
    ...transform,
    x: transform.x + PREVIEW_OFFSET_X,
    y: transform.y + below + PREVIEW_OFFSET_Y / 3,
  };
};
