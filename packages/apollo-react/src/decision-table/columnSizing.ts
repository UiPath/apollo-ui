/**
 * Pure column-sizing arithmetic for the shared grid — no React, no storage, no table model.
 * `useColumnWidths` wires these into state, drag handlers and persistence. `reservedPx` is the
 * total width of the grid's fixed gutters (row numbers, trailing action/result columns), which
 * never flex and are excluded from the auto-fit split.
 */

import { MIN_COLUMN_WIDTH } from './constants';

export interface SizedColumn {
  id: string;
  defaultWidth: number;
}

/**
 * The auto-fit layout, used on mount, container resize, and column add/delete. A dragged column keeps
 * its override; the remaining columns share the surplus evenly when the defaults do not fill the
 * container, otherwise every column keeps its default and the grid scrolls. The reserved gutters are
 * excluded from the split so the `#` gutter never grows the way `width: 100%` would.
 */
/**
 * An own-property width read. A column id is the consumer's string: one that happens to name an
 * Object prototype member (`constructor`, `toString`) would otherwise resolve to that function,
 * and `Math.max` against it yields NaN — a corrupted width and virtualization offset.
 */
export const widthFor = (map: Record<string, number>, id: string): number | undefined =>
  Object.hasOwn(map, id) ? map[id] : undefined;

export function resolveColumnWidths({
  containerWidth,
  columns,
  overrides,
  reservedPx,
}: {
  containerWidth: number;
  columns: SizedColumn[];
  overrides: Record<string, number>;
  reservedPx: number;
}): number[] {
  const base = columns.map((column) =>
    Math.max(MIN_COLUMN_WIDTH, widthFor(overrides, column.id) ?? column.defaultWidth)
  );
  const total = reservedPx + base.reduce((sum, width) => sum + width, 0);
  if (total >= containerWidth) {
    return base;
  }

  const growIndices = columns.reduce<number[]>((acc, column, index) => {
    if (widthFor(overrides, column.id) === undefined) {
      acc.push(index);
    }
    return acc;
  }, []);
  if (growIndices.length === 0) {
    return base;
  }

  const surplus = containerWidth - total;
  const share = Math.floor(surplus / growIndices.length);
  const remainder = surplus - share * growIndices.length;
  const widths = [...base];
  growIndices.forEach((columnIndex, position) => {
    widths[columnIndex]! += share + (position === growIndices.length - 1 ? remainder : 0);
  });
  return widths;
}

/** Fit a set of columns into `available` px: fill the surplus evenly, or sit at defaults (and let the
 * table extend) when there is not enough room even for the defaults. Never below the default. */
function fitColumns(columns: SizedColumn[], available: number): number[] {
  // The floor applies here too, so redistribution never re-materialises a sub-minimum default.
  const floors = columns.map((column) => Math.max(MIN_COLUMN_WIDTH, column.defaultWidth));
  const defaultsTotal = floors.reduce((sum, width) => sum + width, 0);
  const surplus = available - defaultsTotal;
  if (surplus <= 0) {
    return floors;
  }
  const share = surplus / columns.length;
  return floors.map((width) => width + share);
}

/**
 * The layout after dragging one column to `newWidth`. Columns to the LEFT hold their widths — that is
 * what keeps the dragged edge under the cursor — and the un-overridden columns to the RIGHT re-fit
 * into whatever container space is left: they shrink (back toward their default) as the column widens
 * to keep the table filled, and grow as it narrows. Once the right columns are back at their defaults
 * there is nothing left to give, so the table extends and the grid scrolls. When nothing to the right
 * can flex, the table simply grows or shrinks and the left columns still never move.
 */
export function resizeColumnWidths(
  sizes: Record<string, number>,
  columns: SizedColumn[],
  key: string,
  newWidth: number,
  overrides: Record<string, number>,
  containerWidth: number,
  reservedPx: number
): Record<string, number> {
  const index = columns.findIndex((column) => column.id === key);
  const next = { ...sizes };
  if (index < 0) {
    return next;
  }
  const width = Math.max(MIN_COLUMN_WIDTH, newWidth);
  next[key] = width;

  const rightColumns = columns.slice(index + 1);
  const rightFlexible = rightColumns.filter(
    (column) => widthFor(overrides, column.id) === undefined
  );
  if (rightFlexible.length === 0) {
    return next;
  }

  const widthOf = (column: SizedColumn) => widthFor(next, column.id) ?? column.defaultWidth;
  const heldBefore = columns.slice(0, index).reduce((sum, column) => sum + widthOf(column), 0);
  const heldRightPinned = rightColumns
    .filter((column) => widthFor(overrides, column.id) !== undefined)
    .reduce((sum, column) => sum + widthOf(column), 0);
  const available = containerWidth - reservedPx - heldBefore - width - heldRightPinned;

  const fitted = fitColumns(rightFlexible, available);
  rightFlexible.forEach((column, position) => {
    next[column.id] = fitted[position]!;
  });
  return next;
}
