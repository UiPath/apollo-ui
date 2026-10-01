import type { CSSProperties } from "react";

/**
 * The narrowest an item gets in a horizontal row before the row wraps, in
 * px: a label and its value stay readable side by side.
 */
export const OCCUPANT_ROW_ITEM_MIN_PX = 128;

/**
 * Sets --occupant-row-item-min for a row's grid:
 * grid-cols-[repeat(auto-fill,minmax(var(--occupant-row-item-min),1fr))].
 */
export const occupantRowStyle =
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
  {
    "--occupant-row-item-min": `${OCCUPANT_ROW_ITEM_MIN_PX}px`,
  } as CSSProperties;
