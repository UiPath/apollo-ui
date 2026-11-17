import type React from 'react';
import { useMemo, useState } from 'react';
import { isComposing } from './gridEvents';
import type { MinimapItem, MinimapRow } from './minimapRows';

export interface MinimapNavigation {
  /** The active row's index in `rows`, -1 when none. */
  activeIndex: number;
  /** Bumped each time the active row should be scrolled into view. */
  revealTick: number;
  /** Makes `id` active and scrolls it into view. */
  land: (id: string | null) => void;
  /** Makes `id` active where it stands. */
  hover: (id: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** The listbox's active row, walked with arrows and Ctrl+Home/End from the search field, and picked with Enter. */
export const useMinimapNavigation = (
  rows: readonly MinimapRow[],
  onEnter: (item: MinimapItem) => void
): MinimapNavigation => {
  const [active, setActive] = useState<string | null>(null);
  const [revealTick, setRevealTick] = useState(0);
  const indexById = useMemo(() => new Map(rows.map((row, index) => [row.item.id, index])), [rows]);
  const activeIndex = active === null ? -1 : (indexById.get(active) ?? -1);

  const land = (id: string | null) => {
    setRevealTick((tick) => tick + 1);
    setActive(id);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing(event)) return;
    const moveTo = (index: number) => {
      event.preventDefault();
      const row = rows[Math.max(0, Math.min(index, rows.length - 1))];
      if (row) land(row.item.id);
    };
    const jump = event.ctrlKey || event.metaKey;
    if (event.key === 'ArrowDown') moveTo(activeIndex + 1);
    else if (event.key === 'ArrowUp') moveTo(Math.max(0, activeIndex - 1));
    else if (event.key === 'Home' && jump) moveTo(0);
    else if (event.key === 'End' && jump) moveTo(rows.length - 1);
    else if (event.key === 'Enter') {
      const row = rows[activeIndex];
      if (!row) return;
      event.preventDefault();
      onEnter(row.item);
    }
  };
  return { activeIndex, revealTick, land, hover: setActive, onKeyDown };
};
