/*
 * How many of a panel's tabs fit its tab bar, from what the bar measures.
 * Pure, so it's tested on its own; side-panel-tab-bar.tsx measures.
 */

/** What the tab bar measures: each tab's width, and the space around them. */
export interface Measured {
  /** Each tab trigger's natural width, by tab id. */
  widths: Readonly<Record<string, number>>;
  /** The gap between two tabs, as the tablist lays them out. */
  gap: number;
  /** The tablist's room for tabs: the bar's inner width, less the tablist's own padding and border. */
  room: number;
  /** The More button's width, with the gap before it. */
  more: number;
}

export const NOTHING_MEASURED: Measured = {
  widths: {},
  gap: 0,
  room: 0,
  more: 0,
};

/** The width of tabs side by side: theirs, and a gap between each two. */
const rowWidth = (widths: readonly number[], gap: number) =>
  widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, widths.length - 1);

/**
 * How many tabs fit, in order: all of them when they do, else as many as
 * fit beside the More button, and always at least one. Before everything
 * is measured, all of them, so each can be measured.
 */
export function fitCount(ids: readonly string[], measured: Measured): number {
  if (measured.room <= 0 || !ids.every((id) => id in measured.widths))
    return ids.length;
  const widths = ids.map((id) => measured.widths[id] ?? 0);
  if (rowWidth(widths, measured.gap) <= measured.room) return ids.length;
  let count = 0;
  while (
    count < widths.length &&
    measured.more + rowWidth(widths.slice(0, count + 1), measured.gap) <=
      measured.room
  )
    count++;
  return Math.max(1, count);
}

/** The order with the active tab moved into the last visible place. */
export function withActiveShown(
  order: readonly string[],
  active: string,
  count: number,
): string[] {
  const shown = [...order];
  const index = shown.indexOf(active);
  if (index >= count) {
    const last = shown[count - 1];
    if (typeof last === "string") {
      shown[count - 1] = active;
      shown[index] = last;
    }
  }
  return shown;
}

/** Whether two measurements are the same, so measuring again changes nothing. */
export const sameMeasured = (a: Measured, b: Measured) =>
  a.gap === b.gap &&
  a.room === b.room &&
  a.more === b.more &&
  Object.keys(a.widths).length === Object.keys(b.widths).length &&
  Object.entries(a.widths).every(([id, w]) => b.widths[id] === w);
