import type React from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { DecisionTextEdit, DecisionTextLabels, DecisionTextProps } from './DecisionText';
import { activeElementOf, focusStays, hasLostFocus, onNextGesture } from './gridEvents';
import type { CellCommitMove } from './gridTypes';
import { cellName } from './ruleCardModel';
import {
  bandColumnNameOf,
  cellTextOf,
  columnNameOf,
  hasStop,
  isOutcome,
  tokenText,
  valueTokenOf,
} from './sentenceParts';
import {
  addConditionOf,
  clickedAction,
  clickedDecision,
  clickedValue,
  type RuleAction,
} from './sentenceTargets';
import type {
  SentenceBand,
  SentenceCellId,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
} from './sentenceTypes';
import type { RuleMenus } from './useRuleMenus';
import type { RuleWindow } from './useRuleWindow';
import { isIgnoredKey, type SentenceNavigation } from './useSentenceNavigation';
import type { OpenValueEditor } from './ValueEditorOverlay';

export interface ValueEditingParams {
  edit: DecisionTextEdit | undefined;
  rules: readonly SentenceRule[];
  bands: readonly SentenceBand[];
  selected: SentenceSelection | null | undefined;
  onSelect: DecisionTextProps['onSelect'];
  navigation: SentenceNavigation;
  labels: DecisionTextLabels;
  container: RuleWindow['container'];
  /** Opens the menu a card action names, and returns whether it did. */
  openMenu: RuleMenus['openFor'];
}

/** How the open editor was last settled, resolved once the host closes it. */
interface PendingSettle {
  from: SentenceValueId;
  move: CellCommitMove | 'cancel';
  /** The rules as they were when it settled, before the host applied the edit. */
  rules: readonly SentenceRule[];
  /** Whether focus was in the editor, so settling in place returns it to the value. */
  refocus: boolean;
  /** Whether the editor edited all the condition's values, so Tab leaves the cell instead of opening its next value. */
  whole: boolean;
  /** Where focus was when it settled, so a close that finds focus moved elsewhere leaves it there. */
  focused: Element | null;
}

/** A cleared cell or deleted rule, its text when asked, and whether to scroll, so focus returns to the selected stop once the host applies it. */
interface PendingRefocus {
  cell: SentenceSelection;
  text: string | undefined;
  scroll: boolean;
}

export interface ValueEditing {
  /** The open value's editor, or null when no value is being edited. */
  editor: OpenValueEditor | null;
  /** Identifies the edited value, so each value mounts its own editor. */
  editorKey: string | undefined;
  /** Handles an editing or clearing key on a stop, and returns whether it did. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => boolean;
  /** Starts editing a clicked value or clears a clicked condition, and returns whether it did. */
  onClick: (event: React.MouseEvent<HTMLElement>) => boolean;
  /** Keeps the card action or value a press lands on. */
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  /** Runs the pressed card action or edits the pressed value once the press's blur commit unmounted or moved it. */
  onPointerUp: () => void;
}

/** A card action or value and the element a press landed on for it. */
interface Pressed {
  action: RuleAction | null;
  value: SentenceValueId | null;
  element: Element;
  at: DOMRect;
}

const isStartKey = (event: React.KeyboardEvent): boolean =>
  event.key === 'Enter' ||
  event.key === 'F2' ||
  (event.key === ' ' && clickedDecision(event.target) === undefined);

const isClearKey = (event: React.KeyboardEvent): boolean =>
  event.key === 'Delete' || event.key === 'Backspace';

export const valueKey = ({ rowId, columnId, index }: SentenceValueId): string =>
  JSON.stringify([rowId, columnId, index]);

const movedAway = ({ element, at }: Pressed): boolean => {
  if (!element.isConnected) return true;
  const { x, y } = element.getBoundingClientRect();
  return x !== at.x || y !== at.y;
};

/** A cell's text, or an empty one for a rule, as the rules hold it; undefined once its rule is gone. */
const textIn = (rules: readonly SentenceRule[], cell: SentenceSelection): string | undefined => {
  const rule = rules.find((candidate) => candidate.rowId === cell.rowId);
  return rule && (cell.columnId === undefined ? '' : cellTextOf(rule, cell.columnId));
};

const rowIdOf = (element: Element | null): string | undefined =>
  element instanceof HTMLElement
    ? element.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId
    : undefined;

/** The view's value editing: starting an edit, the editor's context, and where a commit or cancel moves. */
export const useValueEditing = ({
  edit,
  rules,
  bands,
  selected,
  onSelect,
  navigation,
  labels,
  container,
  openMenu,
}: ValueEditingParams): ValueEditing => {
  const pendingRef = useRef<PendingSettle | null>(null);
  const stopAwaitingRef = useRef<(() => void) | null>(null);
  const pressedRef = useRef<Pressed | null>(null);
  const recoveredRef = useRef(false);
  const refocusRef = useRef<PendingRefocus | null>(null);
  const goneRef = useRef<string | null>(null);
  const target = edit?.editing ?? null;
  const openedRef = useRef(target ? valueKey(target) : undefined);
  const row = target ? rules.findIndex((rule) => rule.rowId === target.rowId) : -1;
  const rule = rules[row];

  const awaitHost = (pending: Omit<PendingSettle, 'focused'> | null) => {
    stopAwaitingRef.current?.();
    const view = container();
    pendingRef.current = pending && { ...pending, focused: view && activeElementOf(view) };
    stopAwaitingRef.current = pending && view ? onNextGesture(view, () => awaitHost(null)) : null;
  };
  useEffect(() => () => stopAwaitingRef.current?.(), []);

  const start = (value: SentenceValueId) => {
    if (!edit) return;
    awaitHost(null);
    if (selected?.rowId !== value.rowId || selected?.columnId !== value.columnId) {
      navigation.select({ rowId: value.rowId, columnId: value.columnId }, () => null, false);
    }
    edit.onStartEdit(value);
  };

  const editorOf = (): OpenValueEditor | null => {
    if (!edit || !target || !rule) return null;
    const token = valueTokenOf(rule, target);
    const column = columnNameOf(rule, target.columnId) || bandColumnNameOf(bands, target.columnId);
    const field = edit.valueField?.(target) ?? {};
    const cancel = () => {
      awaitHost({ from: target, move: 'cancel', rules, refocus: true, whole: false });
      edit.onCancel();
    };
    return {
      target,
      value: token?.text ?? '',
      ariaLabel: hasStop(rule, target.columnId)
        ? cellName(labels, column, token ? tokenText(token, labels.emptyValue) : '', row + 1)
        : edit.labels.newCondition(column, row + 1),
      column,
      field,
      onCommit: (commit, move, refocus, expression) => {
        const whole = expression || field.values !== undefined || commit.values.length > 1;
        awaitHost({ from: target, move, rules, refocus, whole });
        edit.onCommit(target, commit, move);
      },
      onCancel: cancel,
      onClear:
        token?.text && isOutcome(rule, target.columnId)
          ? () => clear({ rowId: target.rowId, columnId: target.columnId }, true, true)
          : undefined,
    };
  };

  const resolve = ({ from, move, rules: before, refocus, whole }: PendingSettle) => {
    const cell = { rowId: from.rowId, columnId: from.columnId };
    const rowRule = rules.find((candidate) => candidate.rowId === from.rowId);
    if (move === 'cancel' || (move === 'none' && refocus)) {
      if (hasStop(rowRule, cell.columnId)) navigation.select(cell);
      else navigation.select({ rowId: from.rowId }, addConditionOf);
      return;
    }
    const sibling = { ...from, index: from.index + (move === 'left' ? -1 : 1) };
    if (
      (move === 'left' || move === 'right') &&
      !whole &&
      rowRule &&
      valueTokenOf(rowRule, sibling)
    ) {
      start(sibling);
      return;
    }
    navigation.selectAfter(cell, move, before);
  };

  useLayoutEffect(() => {
    const opened = target ? valueKey(target) : undefined;
    if (opened === openedRef.current) return;
    openedRef.current = opened;
    if (target && (selected?.rowId !== target.rowId || selected?.columnId !== target.columnId)) {
      onSelect?.({ rowId: target.rowId, columnId: target.columnId });
    }
  });

  useLayoutEffect(() => {
    const gone = target && !rule ? valueKey(target) : null;
    if (gone !== null && gone !== goneRef.current) edit?.onCancel();
    goneRef.current = gone;
  });

  const staysOn = (rowId: string): boolean => {
    const view = container();
    const focused = view && activeElementOf(view);
    return view !== null && (hasLostFocus(view) || focused === view || rowIdOf(focused) === rowId);
  };

  useLayoutEffect(() => {
    const refocus = refocusRef.current;
    if (refocus === null) return;
    const stayed = staysOn(refocus.cell.rowId);
    if (stayed && textIn(rules, refocus.cell) === refocus.text) return;
    refocusRef.current = null;
    if (stayed) navigation.refocus(refocus.scroll);
  });

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending || (target && valueKey(target) === valueKey(pending.from))) return;
    awaitHost(null);
    if (!target && focusStays(container(), pending.focused)) resolve(pending);
  });

  const cancelEditOf = (cell: SentenceSelection) => {
    if (target?.rowId !== cell.rowId || (cell.columnId && target.columnId !== cell.columnId))
      return;
    awaitHost(null);
    edit?.onCancel();
  };

  const clear = (cell: SentenceCellId, refocusNow: boolean, scroll: boolean) => {
    refocusRef.current = { cell, text: textIn(rules, cell), scroll };
    edit?.onClearCell(cell);
    cancelEditOf(cell);
    if (refocusNow && staysOn(cell.rowId)) navigation.refocus(scroll);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    const columnId = navigation.selectedColumnId;
    const rowId = selected?.rowId;
    if (!edit || !(isStartKey(event) || isClearKey(event)) || isIgnoredKey(event)) return false;
    if (columnId === null || rowId === undefined) return false;
    event.preventDefault();
    if (isClearKey(event)) clear({ rowId, columnId }, true, true);
    else start({ rowId, columnId, index: 0 });
    return true;
  };

  const onAction = (action: RuleAction): boolean => {
    if (action.action === 'clear') {
      clear(action.cell, selected?.rowId === action.cell.rowId, false);
      if (selected?.rowId !== action.cell.rowId) {
        navigation.select({ rowId: action.cell.rowId }, undefined, false);
      }
      return true;
    }
    if (action.action !== 'delete') return false;
    refocusRef.current = {
      cell: { rowId: action.rowId },
      text: textIn(rules, { rowId: action.rowId }),
      scroll: true,
    };
    edit?.onDeleteRule(action.rowId);
    cancelEditOf({ rowId: action.rowId });
    if (staysOn(action.rowId)) navigation.refocus();
    return true;
  };

  const onClick = (event: React.MouseEvent<HTMLElement>): boolean => {
    if (recoveredRef.current) {
      recoveredRef.current = false;
      return true;
    }
    const action = edit ? clickedAction(event.target) : null;
    if (action) return onAction(action);
    const value = edit ? clickedValue(event.target) : null;
    if (!value) return false;
    start(value);
    return true;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    recoveredRef.current = false;
    const action = edit ? clickedAction(event.target) : null;
    const value = edit && !action ? clickedValue(event.target) : null;
    pressedRef.current =
      (action || value) && event.target instanceof Element
        ? { action, value, element: event.target, at: event.target.getBoundingClientRect() }
        : null;
  };

  const recover = ({ action, value }: Pressed): boolean => {
    if (action) return onAction(action) || openMenu(action);
    if (value) start(value);
    return value !== null;
  };

  const onPointerUp = () => {
    const pressed = pressedRef.current;
    pressedRef.current = null;
    if (!pressed || !movedAway(pressed)) return;
    recoveredRef.current = recover(pressed);
  };

  return {
    editor: editorOf(),
    editorKey: target ? valueKey(target) : undefined,
    onKeyDown,
    onClick,
    onPointerDown,
    onPointerUp,
  };
};
