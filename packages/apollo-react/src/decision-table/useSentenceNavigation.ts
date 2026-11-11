import type React from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { isFromTextField } from './gridEvents';
import { firstValuesOf } from './ruleCardModel';
import type { SentenceRule, SentenceSelection } from './sentenceTypes';
import { ARROW_DELTAS, clamp, GRID_ENTRY_KEYS } from './useGridNavigation';

/** A row and one of its stops: 0 is its rule, then its cells in reading order. */
interface StopPosition {
  row: number;
  stop: number;
}

type Stops = readonly (string | undefined)[];

/** A row's stops: its rule, then each cell by its first value, heading, lead, then lines. */
const stopsOf = (rule: SentenceRule | undefined): Stops => [
  undefined,
  ...(rule ? firstValuesOf(rule).keys() : []),
];

const selectionAt = (
  rules: readonly SentenceRule[],
  { row, stop }: StopPosition
): SentenceSelection | undefined => {
  const target = rules[row];
  if (!target) return undefined;
  const columnId = stopsOf(target)[stop];
  return columnId === undefined ? { rowId: target.rowId } : { rowId: target.rowId, columnId };
};

const sameSelection = (left: SentenceSelection | null, right: SentenceSelection | null): boolean =>
  left?.rowId === right?.rowId && left?.columnId === right?.columnId;

const verticalMove = (
  delta: number,
  meta: boolean,
  from: StopPosition,
  rowCount: number,
  stopsAt: (row: number) => Stops
): StopPosition => {
  const last = rowCount - 1;
  const row = meta ? (delta < 0 ? 0 : last) : clamp(from.row + delta, last);
  return { row, stop: Math.max(0, stopsAt(row).indexOf(stopsAt(from.row)[from.stop])) };
};

const horizontalMove = (delta: number, meta: boolean, from: StopPosition, stops: Stops) => {
  const last = stops.length - 1;
  return { row: from.row, stop: meta ? (delta < 0 ? 0 : last) : clamp(from.stop + delta, last) };
};

const edgeMove = (
  end: boolean,
  meta: boolean,
  from: StopPosition,
  rowCount: number,
  stopsAt: (row: number) => Stops
): StopPosition => {
  const row = meta ? (end ? rowCount - 1 : 0) : from.row;
  return { row, stop: end ? stopsAt(row).length - 1 : 0 };
};

/** Past the row's ends Tab is left alone, so focus leaves the view (WCAG 2.1.2). */
const tabMove = (back: boolean, from: StopPosition, stops: Stops): StopPosition | undefined => {
  const stop = from.stop + (back ? -1 : 1);
  return stop < 0 || stop >= stops.length ? undefined : { row: from.row, stop };
};

/** Where a key moves from `from`, or undefined for a key the view leaves alone. */
const stopAfterKey = (
  event: React.KeyboardEvent,
  from: StopPosition,
  rules: readonly SentenceRule[],
  rtl: boolean
): StopPosition | undefined => {
  const meta = event.metaKey || event.ctrlKey;
  const stopsAt = (row: number) => stopsOf(rules[row]);
  const delta = ARROW_DELTAS[event.key];
  if (delta) {
    return delta.row === 0
      ? horizontalMove(rtl ? -delta.col : delta.col, meta, from, stopsAt(from.row))
      : verticalMove(delta.row, meta, from, rules.length, stopsAt);
  }
  if (event.key === 'Home' || event.key === 'End') {
    return edgeMove(event.key === 'End', meta, from, rules.length, stopsAt);
  }
  if (event.key === 'Tab' && !meta && !event.altKey) {
    return tabMove(event.shiftKey, from, stopsAt(from.row));
  }
  return undefined;
};

/** Whether a key landed on the view itself or one of its rules. */
const isOnStop = (event: React.KeyboardEvent): boolean =>
  event.target === event.currentTarget ||
  (event.target instanceof Element && event.target.closest('li[data-row-id]') !== null);

const isIgnoredKey = (event: React.KeyboardEvent): boolean =>
  event.defaultPrevented ||
  event.nativeEvent.isComposing ||
  !isOnStop(event) ||
  isFromTextField(event.target);

const cardOf = (container: HTMLElement, rowId: string): HTMLElement | undefined =>
  [...container.querySelectorAll<HTMLElement>('li[data-row-id]')].find(
    (card) => card.dataset.rowId === rowId
  );

const cellOf = (card: HTMLElement, columnId: string): HTMLElement | undefined =>
  [...card.querySelectorAll<HTMLElement>('[data-kind="value"]')].find(
    (token) => token.dataset.columnId === columnId
  );

const stopOf = (container: HTMLElement, selection: SentenceSelection): HTMLElement | undefined => {
  const card = cardOf(container, selection.rowId);
  return card && selection.columnId !== undefined ? cellOf(card, selection.columnId) : card;
};

interface SentenceNavigationSource {
  rules: readonly SentenceRule[];
  selected: SentenceSelection | null | undefined;
  /** The index of `selected`'s row, or null when no row in `rules` is selected. */
  selectedRow: number | null;
  onSelect: ((selection: SentenceSelection | null) => void) | undefined;
  container: () => HTMLElement | null;
  /** The first row the sticky header does not cover, where a first key lands. */
  firstVisibleRow: () => number;
  /** Scrolls the row into view when it fits below the sticky header, then the stop within it. */
  scrollStopIntoView: (rowIndex: number, stop: HTMLElement) => void;
  /** Scrolls a row the host selects into view, as the grid's host does for its selected row. */
  scrollRowIntoView: (rowIndex: number) => void;
}

export interface SentenceNavigation {
  /** The selected row's cell, or null for its rule or a cell it has no value for. */
  selectedColumnId: string | null;
  /** Selects and focuses, from a click or a key. */
  select: (selection: SentenceSelection | null) => void;
  /** Handles a key the view claims, and returns whether it did. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => boolean;
}

/** The sentence view's keyboard: focus follows the controlled selection over rules and cells. */
export const useSentenceNavigation = ({
  rules,
  selected,
  selectedRow,
  onSelect,
  container,
  firstVisibleRow,
  scrollStopIntoView,
  scrollRowIntoView,
}: SentenceNavigationSource): SentenceNavigation => {
  const stops = useMemo(
    () => stopsOf(selectedRow === null ? undefined : rules[selectedRow]),
    [rules, selectedRow]
  );
  const position =
    selectedRow === null
      ? null
      : { row: selectedRow, stop: Math.max(0, stops.indexOf(selected?.columnId)) };
  const current = position && (selectionAt(rules, position) ?? null);
  const selectedRule = selectedRow === null ? undefined : rules[selectedRow];
  const selectedColumnId = current?.columnId ?? null;

  const focusCurrent = () => {
    const element = container();
    if (!element) return;
    if (!current || !position) {
      element.focus({ preventScroll: true });
      return;
    }
    const stop = stopOf(element, current);
    if (stop) {
      stop.focus({ preventScroll: true });
      scrollStopIntoView(position.row, stop);
    }
  };

  const pendingFocusRef = useRef<SentenceSelection | null | undefined>(undefined);
  const shownRowIdRef = useRef(selectedRule?.rowId);
  useLayoutEffect(() => {
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = undefined;
    const moved = selectedRule?.rowId !== shownRowIdRef.current;
    shownRowIdRef.current = selectedRule?.rowId;
    if (pending !== undefined && sameSelection(pending, current)) {
      focusCurrent();
    } else if (moved && selectedRow !== null) {
      const element = container();
      const cell =
        element && current?.columnId !== undefined ? stopOf(element, current) : undefined;
      if (cell) scrollStopIntoView(selectedRow, cell);
      else scrollRowIntoView(selectedRow);
    }
  });

  const select = (selection: SentenceSelection | null) => {
    if (!onSelect) return;
    if (sameSelection(selection, selected ?? null)) {
      focusCurrent();
      return;
    }
    pendingFocusRef.current = selection;
    onSelect(selection);
  };

  const keyTarget = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') return position ? null : undefined;
    if (!position) {
      return GRID_ENTRY_KEYS.includes(event.key)
        ? selectionAt(rules, { row: firstVisibleRow(), stop: 0 })
        : undefined;
    }
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const next = stopAfterKey(event, position, rules, rtl);
    return next && selectionAt(rules, next);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    if (!onSelect || isIgnoredKey(event)) return false;
    const target = keyTarget(event);
    if (target === undefined) return false;
    event.preventDefault();
    select(target);
    return true;
  };

  return { selectedColumnId, select, onKeyDown };
};
