import type React from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';
import type { DecisionTextProps } from './DecisionText';
import { activeElementOf, isFromTextField } from './gridEvents';
import type { CellCommitMove } from './gridTypes';
import { firstValuesOf } from './ruleCardModel';
import { cardOf, cellOf } from './sentenceTargets';
import type { SentenceCellId, SentenceRule, SentenceSelection } from './sentenceTypes';
import { ARROW_DELTAS, clamp, GRID_ENTRY_KEYS } from './useGridNavigation';
import type { RuleWindow } from './useRuleWindow';

/** A row and one of its stops: 0 is its rule, then its cells in reading order. */
interface StopPosition {
  row: number;
  stop: number;
}

type Stops = readonly (string | undefined)[];

/** A row's stops: its rule, then each cell by its stop token, heading, lead, then lines. */
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

/** Where a committed edit moves from a cell: down a rule, or to the row's next or previous cell, staying at its ends. */
const stopAfterCommit = (
  move: CellCommitMove,
  from: StopPosition,
  rules: readonly SentenceRule[]
): StopPosition | undefined => {
  const stopsAt = (row: number) => stopsOf(rules[row]);
  if (move === 'none') return undefined;
  if (move === 'down') return verticalMove(1, false, from, rules.length, stopsAt);
  const next = tabMove(move === 'left', from, stopsAt(from.row));
  return next && next.stop > 0 ? next : from;
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

/** Whether a key landed on the view itself or one of its rules, not on a card's action other than a selected stop's link. */
const isOnStop = (event: React.KeyboardEvent): boolean =>
  event.target === event.currentTarget ||
  (event.target instanceof HTMLElement &&
    event.target.closest('li[data-row-id]') !== null &&
    (event.target.closest('[data-rule-action]') === null ||
      event.target.dataset.selected === 'true'));

/** Whether the view leaves a key alone: claimed, composing, off its stops or from a text field. */
export const isIgnoredKey = (event: React.KeyboardEvent): boolean =>
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

interface SentenceNavigationSource
  extends Pick<
    RuleWindow,
    'selectedRow' | 'container' | 'firstVisibleRow' | 'scrollStopIntoView' | 'scrollRowIntoView'
  > {
  rules: readonly SentenceRule[];
  selected: SentenceSelection | null | undefined;
  onSelect: DecisionTextProps['onSelect'];
}

/** The element of a selected card that takes focus in place of its stop, e.g. one of its actions. */
type CardFocus = (card: HTMLElement) => HTMLElement | null;

/** A selection the view asked for, and what of its card to focus once the host applies it. */
interface PendingFocus {
  selection: SentenceSelection | null;
  focus: CardFocus | undefined;
}

export interface SentenceNavigation {
  /** The selected row's cell, or null for its rule or a cell it has no value for. */
  selectedColumnId: string | null;
  /** Selects and focuses, from a click or a key; `focus` picks another element of the selected card. */
  select: (selection: SentenceSelection | null, focus?: CardFocus) => void;
  /** Handles a key the view claims, and returns whether it did. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => boolean;
  /** Selects and focuses where an edit committed in `from` moves among the rules it committed on, or the current ones for a cell those lacked, as the grid's `commitEdit`. */
  selectAfter: (
    from: SentenceCellId,
    move: CellCommitMove,
    before: readonly SentenceRule[]
  ) => void;
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

  const focusCurrent = (focus?: CardFocus, scroll = true) => {
    const element = container();
    if (!element) return;
    if (!current || !position) {
      element.focus({ preventScroll: true });
      return;
    }
    const card = focus && cardOf(element, current.rowId);
    const stop = card ? focus?.(card) : stopOf(element, current);
    if (stop) {
      stop.focus({ preventScroll: true });
      if (scroll) scrollStopIntoView(position.row, stop);
    }
  };

  const pendingFocusRef = useRef<PendingFocus | undefined>(undefined);
  const shownRowIdRef = useRef(selectedRule?.rowId);
  useLayoutEffect(() => {
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = undefined;
    const moved = selectedRule?.rowId !== shownRowIdRef.current;
    shownRowIdRef.current = selectedRule?.rowId;
    if (pending !== undefined && sameSelection(pending.selection, current)) {
      focusCurrent(pending.focus);
    } else if (moved && selectedRow !== null) {
      const stop = movedStopOf(container(), current);
      if (stop) scrollStopIntoView(selectedRow, stop);
      else scrollRowIntoView(selectedRow);
    }
  });

  const select = (selection: SentenceSelection | null, focus?: CardFocus) => {
    if (!onSelect) return;
    if (sameSelection(selection, selected ?? null)) {
      focusCurrent(focus);
      return;
    }
    pendingFocusRef.current = { selection, focus };
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

  const selectAfter = (
    from: SentenceCellId,
    move: CellCommitMove,
    before: readonly SentenceRule[]
  ) => {
    const committedOn = stopsOf(before.find((rule) => rule.rowId === from.rowId)).includes(
      from.columnId
    )
      ? before
      : rules;
    const row = committedOn.findIndex((rule) => rule.rowId === from.rowId);
    if (row < 0) return;
    const stop = Math.max(0, stopsOf(committedOn[row]).indexOf(from.columnId));
    const next = stopAfterCommit(move, { row, stop }, committedOn);
    const target = next && selectionAt(committedOn, next);
    if (target) select(target);
  };

  return {
    selectedColumnId,
    select,
    onKeyDown,
    selectAfter,
    refocus: (scroll = true) => focusCurrent(undefined, scroll),
  };
};
