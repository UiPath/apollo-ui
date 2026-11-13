import { useCallback, useEffect, useRef } from 'react';
import { type HoveredToken, valueTokenAt } from './sentenceTargets';
import type { SentenceCellId } from './sentenceTypes';

/** Tracks the value chip under the pointer and reports its cell whenever that cell changes or goes away. */
export const useCellHover = (onCellHover: ((cell: SentenceCellId | null) => void) | undefined) => {
  const onCellHoverRef = useRef(onCellHover);
  onCellHoverRef.current = onCellHover;
  const hoveredRef = useRef<HoveredToken | null>(null);
  const hoverTo = useCallback((next: HoveredToken | null) => {
    const current = hoveredRef.current;
    hoveredRef.current = next;
    if (
      current?.cell.rowId !== next?.cell.rowId ||
      current?.cell.columnId !== next?.cell.columnId
    ) {
      onCellHoverRef.current?.(next?.cell ?? null);
    }
  }, []);
  useEffect(() => {
    const chip = hoveredRef.current?.chip;
    if (chip) {
      hoverTo(chip.isConnected ? valueTokenAt(chip) : null);
    }
  });
  useEffect(() => () => hoverTo(null), [hoverTo]);
  return hoverTo;
};
