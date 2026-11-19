import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  hasLostFocus,
  isComposing,
  isFromTextField,
  isRedoKey,
  isUndoKey,
  onNextGesture,
} from './gridEvents';
import {
  clickedDecision,
  clickedSelection,
  rowIdOf,
  stopDecisionOf,
  valueTokenAt,
} from './sentenceTargets';
import type { useCellHover } from './useCellHover';
import type { RuleMenus } from './useRuleMenus';
import type { RuleWindow } from './useRuleWindow';
import { isIgnoredKey, type SentenceNavigation } from './useSentenceNavigation';
import type { ValueEditing } from './useValueEditing';

/** What of its card a click keeps focused: the citation it hit, unless its host moved focus out of the view, else the card's own stop. */
const clickedCitationOf = (
  target: EventTarget | null,
  view: HTMLElement
): Parameters<SentenceNavigation['select']>[1] => {
  const button =
    target instanceof Element ? target.closest<HTMLElement>('[data-rule-action="citation"]') : null;
  if (!button) return undefined;
  return (card) => {
    const active = button.ownerDocument.activeElement;
    const movedOut =
      active !== null && active !== button.ownerDocument.body && !view.contains(active);
    if (movedOut) return null;
    return card.contains(button) ? button : card;
  };
};

/** The scroll container's props a host may add; the view names the region and owns its tab stop. */
export type DecisionTextContainerProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'aria-label' | 'tabIndex'
> &
  Record<`data-${string}`, string | undefined>;

/** The host's history steps, taken by Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y as the grid takes them. */
export interface TextHistory {
  onUndo: () => void;
  onRedo: () => void;
}

export interface ContainerHandlersParams {
  containerProps: DecisionTextContainerProps | undefined;
  hoverTo: ReturnType<typeof useCellHover>;
  navigation: SentenceNavigation;
  valueEditing: ValueEditing;
  ruleMenus: RuleMenus;
  /** Opens the decision a linked input names; `byKey` when pressed from the keyboard rather than clicked. */
  onOpenDecision: ((decisionId: string, byKey: boolean) => void) | undefined;
  container: RuleWindow['container'];
  /** Whether a selected stop takes Tab into the view in place of the view itself. */
  stopTabbable: boolean;
  /** The rule holding focus, which the view keeps mounted. */
  focusRow: (rowId: string | undefined) => void;
  /** The edit mode's history; null while the view does not edit. */
  history: TextHistory | null;
  /** The view selects nothing, so Enter on it reaches its rules' citations and the arrows move among them. */
  citationKeys: boolean;
  /** The listed rules with citations, in order. */
  citedRows: readonly CitedRow[];
  /** Scrolls a listed rule into view by its index, mounting it. */
  revealRow: RuleWindow['scrollRowIntoView'];
  /** Scrolls a stop of a listed rule into view, clear of the sticky header. */
  revealStop: RuleWindow['scrollStopIntoView'];
}

/** A listed rule with citations: its id, its place among the listed rules and how many it has. */
export interface CitedRow {
  rowId: string;
  index: number;
  count: number;
}

/** A read view's citation stop: one of a cited rule's buttons, or the view itself. */
type CitationStop = { kind: 'citation'; row: CitedRow; button: number } | { kind: 'view' };

const citationButtonsOf = (view: HTMLElement, rowId: string): HTMLElement[] =>
  [...view.querySelectorAll<HTMLElement>('li[data-row-id]')]
    .filter((card) => card.dataset.rowId === rowId)
    .flatMap((card) => [...card.querySelectorAll<HTMLElement>('[data-rule-action="citation"]')]);

const firstStop = (row: CitedRow | undefined): CitationStop | undefined =>
  row && { kind: 'citation', row, button: 0 };

const lastStop = (row: CitedRow | undefined): CitationStop | undefined =>
  row && { kind: 'citation', row, button: row.count - 1 };

/** Where a read view's unmodified key moves focus among its rules' citations, in rule order. */
const citationStopOf = (
  event: React.KeyboardEvent<HTMLElement>,
  citedRows: readonly CitedRow[]
): CitationStop | undefined => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return undefined;
  const view = event.currentTarget;
  if (event.target === view) return event.key === 'Enter' ? firstStop(citedRows[0]) : undefined;
  const target = event.target instanceof HTMLElement ? event.target : null;
  const rowId = target?.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId;
  const at = citedRows.findIndex((row) => row.rowId === rowId);
  const row = citedRows[at];
  const button =
    target && rowId !== undefined ? citationButtonsOf(view, rowId).indexOf(target) : -1;
  if (!row || button < 0) return undefined;
  if (event.key === 'ArrowDown') {
    return button + 1 < row.count
      ? { kind: 'citation', row, button: button + 1 }
      : firstStop(citedRows[at + 1]);
  }
  if (event.key === 'ArrowUp') {
    return button > 0 ? { kind: 'citation', row, button: button - 1 } : lastStop(citedRows[at - 1]);
  }
  if (event.key === 'Home') return firstStop(citedRows[0]);
  if (event.key === 'End') return lastStop(citedRows[citedRows.length - 1]);
  return event.key === 'Escape' ? { kind: 'view' } : undefined;
};

/** Whether a key is a forward Tab pressed on the view itself. */
const isTabOnView = (event: React.KeyboardEvent<HTMLElement>): boolean =>
  event.key === 'Tab' && !event.shiftKey && event.target === event.currentTarget;

/** The consumer's container props, with the view's own handlers run before the consumer's. */
export const useContainerHandlers = ({
  containerProps,
  hoverTo,
  navigation,
  valueEditing,
  ruleMenus,
  onOpenDecision,
  container,
  stopTabbable,
  focusRow,
  history,
  citationKeys,
  citedRows,
  revealRow,
  revealStop,
}: ContainerHandlersParams) => {
  const pendingCitationRef = useRef<{ row: CitedRow; button: number } | null>(null);
  const focusPendingCitation = (): boolean => {
    const pending = pendingCitationRef.current;
    const view = container();
    const button =
      pending && view ? citationButtonsOf(view, pending.row.rowId)[pending.button] : undefined;
    if (!pending || !button) return false;
    pendingCitationRef.current = null;
    button.focus({ preventScroll: true });
    revealStop(pending.row.index, button);
    return true;
  };
  const focusWithinRef = useRef(false);
  const pressedRef = useRef(false);
  const stopPressRef = useRef<(() => void) | null>(null);
  const [focusInside, setFocusInside] = useState(false);
  useEffect(() => {
    const view = container();
    if (focusWithinRef.current && view && hasLostFocus(view)) view.focus();
  });
  useEffect(() => () => stopPressRef.current?.(), []);
  useEffect(() => {
    focusPendingCitation();
  });

  const endPress = () => {
    stopPressRef.current?.();
    stopPressRef.current = null;
    pressedRef.current = false;
  };

  const {
    onPointerOver: consumerPointerOver,
    onPointerOut: consumerPointerOut,
    onKeyDown: consumerKeyDown,
    onFocus: consumerFocus,
    onBlur: consumerBlur,
    onClick: consumerClick,
    onPointerDown: consumerPointerDown,
    onPointerCancel: consumerPointerCancel,
    ...restContainerProps
  } = containerProps ?? {};

  const onPointerOver = (event: React.PointerEvent<HTMLElement>) => {
    hoverTo(valueTokenAt(event.target));
    consumerPointerOver?.(event);
  };
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pressedRef.current = true;
    stopPressRef.current = onNextGesture(event.currentTarget, endPress);
    valueEditing.onPointerDown();
    consumerPointerDown?.(event);
  };
  const onPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    endPress();
    consumerPointerCancel?.(event);
  };
  const onPointerOut = (event: React.PointerEvent<HTMLElement>) => {
    const to = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!event.currentTarget.contains(to)) {
      hoverTo(null);
    }
    consumerPointerOut?.(event);
  };
  const openDecision = (
    event: React.SyntheticEvent,
    decisionId: string | undefined,
    byKey: boolean
  ): boolean => {
    if (!onOpenDecision || decisionId === undefined) return false;
    event.preventDefault();
    onOpenDecision(decisionId, byKey);
    return true;
  };
  const openStopDecision = (event: React.KeyboardEvent<HTMLElement>): boolean =>
    event.key === 'Enter' &&
    event.altKey &&
    !isIgnoredKey(event) &&
    openDecision(event, stopDecisionOf(event.target), true);
  const stepHistory = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    const { target } = event;
    if (!history || event.defaultPrevented || isComposing(event) || isFromTextField(target)) {
      return false;
    }
    const dialog = target instanceof Element ? target.closest('dialog') : null;
    if (dialog !== event.currentTarget.closest('dialog')) return false;
    const step = isRedoKey(event) ? history.onRedo : isUndoKey(event) ? history.onUndo : null;
    if (!step) return false;
    event.preventDefault();
    step();
    return true;
  };
  const moveAmongCitations = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    const stop =
      citationKeys && !event.defaultPrevented ? citationStopOf(event, citedRows) : undefined;
    if (!stop) return false;
    event.preventDefault();
    const view = event.currentTarget;
    if (stop.kind === 'view') {
      view.focus();
      return true;
    }
    pendingCitationRef.current = { row: stop.row, button: stop.button };
    focusRow(stop.row.rowId);
    if (!focusPendingCitation()) revealRow(stop.row.index);
    return true;
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (stopTabbable && isTabOnView(event)) {
      event.preventDefault();
      navigation.refocus();
    } else if (
      !moveAmongCitations(event) &&
      (openStopDecision(event) ||
        valueEditing.onKeyDown(event) ||
        navigation.onKeyDown(event) ||
        stepHistory(event))
    ) {
      return;
    }
    consumerKeyDown?.(event);
  };
  const onFocus = (event: React.FocusEvent<HTMLElement>) => {
    const entered = !focusWithinRef.current && event.target === event.currentTarget;
    focusWithinRef.current = true;
    setFocusInside(true);
    focusRow(rowIdOf(event.target));
    if (entered && stopTabbable && !pressedRef.current) navigation.refocus();
    consumerFocus?.(event);
  };
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      focusWithinRef.current = false;
      pendingCitationRef.current = null;
      endPress();
      setFocusInside(false);
      focusRow(undefined);
    }
    consumerBlur?.(event);
  };
  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    const claimed =
      openDecision(event, clickedDecision(event.target), event.detail === 0) ||
      ruleMenus.onClick(event) ||
      valueEditing.onClick(event);
    const selection = claimed ? null : clickedSelection(event.target);
    if (selection) {
      navigation.select(selection, clickedCitationOf(event.target, event.currentTarget), false);
    }
    consumerClick?.(event);
  };

  return {
    ...restContainerProps,
    tabIndex: stopTabbable && focusInside ? -1 : 0,
    onPointerOver,
    onPointerDown,
    onPointerCancel,
    onPointerOut,
    onKeyDown,
    onFocus,
    onBlur,
    onClick,
  };
};
