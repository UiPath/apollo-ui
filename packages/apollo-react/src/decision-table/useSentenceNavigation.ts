import type React from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { activeElementOf, focusStays, isFromTextField } from './gridEvents';
import { firstValuesOf } from './ruleCardModel';
import { cardOf, cellOf } from './sentenceTargets';
import type { SentenceRule, SentenceSelection } from './sentenceTypes';
import { ARROW_DELTAS, clamp, GRID_ENTRY_KEYS } from './useGridNavigation';
import type { RuleWindow } from './useRuleWindow';

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

/** A move to another row, onto `columnId` where that row has it, else onto its rule. */
const verticalMove = (
  delta: number,
  meta: boolean,
  from: StopPosition,
  rowCount: number,
  stopsAt: (row: number) => Stops,
  columnId: SentenceSelection['columnId']
): StopPosition => {
  const last = rowCount - 1;
  const row = meta ? (delta < 0 ? 0 : last) : clamp(from.row + delta, last);
  return { row, stop: Math.max(0, stopsAt(row).indexOf(columnId)) };
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

/** Where a key moves from `from`, ↑ and ↓ onto `columnId`, or undefined for a key the view leaves alone. */
const stopAfterKey = (
  event: React.KeyboardEvent,
  from: StopPosition,
  rules: readonly SentenceRule[],
  rtl: boolean,
  columnId: SentenceSelection['columnId']
): StopPosition | undefined => {
  const meta = event.metaKey || event.ctrlKey;
  const stopsAt = (row: number) => stopsOf(rules[row]);
  const delta = ARROW_DELTAS[event.key];
  if (delta) {
    return delta.row === 0
      ? horizontalMove(rtl ? -delta.col : delta.col, meta, from, stopsAt(from.row))
      : verticalMove(delta.row, meta, from, rules.length, stopsAt, columnId);
  }
  if (event.key === 'Home' || event.key === 'End') {
    return edgeMove(event.key === 'End', meta, from, rules.length, stopsAt);
  }
  return undefined;
};

/** Whether a key landed on the view itself or one of its rules. */
const isOnStop = (event: React.KeyboardEvent): boolean =>
  event.target === event.currentTarget ||
  (event.target instanceof Element && event.target.closest('li[data-row-id]') !== null);

/** Whether the view leaves a key alone: claimed, composing, off its stops or from a text field. */
const isIgnoredKey = (event: React.KeyboardEvent): boolean =>
  event.defaultPrevented ||
  event.nativeEvent.isComposing ||
  !isOnStop(event) ||
  isFromTextField(event.target);

const stopOf = (container: HTMLElement, selection: SentenceSelection): HTMLElement | undefined => {
  const card = cardOf(container, selection.rowId);
  return card && selection.columnId !== undefined ? cellOf(card, selection.columnId) : card;
};

const movedStopOf = (
  element: HTMLElement | null,
  current: SentenceSelection | null
): HTMLElement | undefined => {
  const cell = element && current?.columnId !== undefined ? stopOf(element, current) : undefined;
  const addRule = element?.querySelector<HTMLElement>('[data-add-rule]');
  const focusedAddRule = addRule?.contains(activeElementOf(addRule)) ? addRule : undefined;
  return focusedAddRule ?? cell;
};

export interface SentenceNavigationSource
  extends Pick<
    RuleWindow,
    'selectedRow' | 'container' | 'firstVisibleRow' | 'scrollStopIntoView' | 'scrollRowIntoView'
  > {
  rules: readonly SentenceRule[];
  selected: SentenceSelection | null | undefined;
  onSelect: ((selection: SentenceSelection | null) => void) | undefined;
}

/** A selection the view asked for, whether to scroll it into view once the host applies it, and where focus was when it asked. */
interface PendingFocus {
  selection: SentenceSelection | null;
  scroll: boolean;
  from: Element | null;
}

/** The column ↑ and ↓ keep: the one a run of them started from, while the selection is where the last one landed. */
interface WantedColumn {
  columnId: SentenceSelection['columnId'];
  at: SentenceSelection;
}

/** The column ↑ and ↓ keep from `current`: the wanted one while the selection is where the last of them landed. */
const keptColumnOf = (
  wanted: WantedColumn | undefined,
  current: SentenceSelection | null
): SentenceSelection['columnId'] =>
  wanted && sameSelection(wanted.at, current) ? wanted.columnId : current?.columnId;

const isVerticalKey = (key: string): boolean => (ARROW_DELTAS[key]?.row ?? 0) !== 0;

export interface SentenceNavigation {
  /** The selected row's cell, or null for its rule or a cell it has no value for. */
  selectedColumnId: string | null;
  /** Selects and focuses from a pointer, starting a new run of ↑ and ↓; `scroll` is false when its target is in view. */
  select: (selection: SentenceSelection | null, scroll?: boolean) => void;
  /** Handles a key the view claims, and returns whether it did. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => boolean;
  /** Focuses the selected stop again, its rule when the selected cell is gone, scrolling it into view unless `scroll` is false. */
  refocus: (scroll?: boolean) => void;
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

  const focusCurrent = (scroll = true) => {
    const element = container();
    if (!element) return;
    if (!current || !position) {
      element.focus({ preventScroll: true });
      return;
    }
    const stop = stopOf(element, current);
    if (stop) {
      stop.focus({ preventScroll: true });
      if (scroll) scrollStopIntoView(position.row, stop);
    }
  };

  const pendingFocusRef = useRef<PendingFocus | undefined>(undefined);
  const wantedRef = useRef<WantedColumn | undefined>(undefined);
  const shownRowIdRef = useRef(selectedRule?.rowId);
  const shownSelectionRef = useRef(current);
  useLayoutEffect(() => {
    const changed = !sameSelection(shownSelectionRef.current, current);
    shownSelectionRef.current = current;
    if (changed && !sameSelection(wantedRef.current?.at ?? null, current)) {
      wantedRef.current = undefined;
    }
    const pending = pendingFocusRef.current;
    const moved = selectedRule?.rowId !== shownRowIdRef.current;
    shownRowIdRef.current = selectedRule?.rowId;
    const stayed = focusStays(container(), pending?.from);
    const applied = pending !== undefined && sameSelection(pending.selection, current);
    if (!stayed || applied) pendingFocusRef.current = undefined;
    if (pending !== undefined && applied && stayed) {
      focusCurrent(pending.scroll);
    } else if (moved && selectedRow !== null) {
      const stop = movedStopOf(container(), current);
      if (stop) scrollStopIntoView(selectedRow, stop);
      else scrollRowIntoView(selectedRow);
    }
  });

  const request = (selection: SentenceSelection | null, scroll = true) => {
    if (!onSelect) return;
    if (sameSelection(selection, selected ?? null)) {
      focusCurrent(scroll);
      return;
    }
    const view = container();
    pendingFocusRef.current = { selection, scroll, from: view && activeElementOf(view) };
    onSelect(selection);
  };

  const select = (selection: SentenceSelection | null, scroll = true) => {
    wantedRef.current = undefined;
    request(selection, scroll);
  };

  const keyTarget = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') return position ? null : undefined;
    if (!position) {
      return GRID_ENTRY_KEYS.includes(event.key)
        ? selectionAt(rules, { row: firstVisibleRow(), stop: 0 })
        : undefined;
    }
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const wanted = keptColumnOf(wantedRef.current, current);
    const next = stopAfterKey(event, position, rules, rtl, wanted);
    const target = next && selectionAt(rules, next);
    wantedRef.current =
      target && isVerticalKey(event.key) ? { columnId: wanted, at: target } : undefined;
    return target;
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    if (!onSelect || isIgnoredKey(event)) return false;
    const target = keyTarget(event);
    if (target === undefined) return false;
    event.preventDefault();
    request(target);
    return true;
  };

  return { selectedColumnId, select, onKeyDown, refocus: focusCurrent };
};
