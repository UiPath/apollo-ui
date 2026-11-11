import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import type { DecisionTextEdit, DecisionTextLabels } from './DecisionText';
import type { CellCommitMove } from './gridTypes';
import {
  bandColumnNameOf,
  columnNameOf,
  stopTokensOf,
  tokenText,
  valueTokenOf,
} from './sentenceParts';
import { addConditionOf, clickedAction, clickedValue } from './sentenceTargets';
import type {
  SentenceBand,
  SentenceCellId,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
} from './sentenceTypes';
import { isIgnoredKey, type SentenceNavigation } from './useSentenceNavigation';
import type { SentenceEditorContext } from './ValueEditorOverlay';

export interface ValueEditingParams {
  edit: DecisionTextEdit | undefined;
  rules: readonly SentenceRule[];
  bands: readonly SentenceBand[];
  selected: SentenceSelection | null | undefined;
  onSelect: ((selection: SentenceSelection | null) => void) | undefined;
  navigation: SentenceNavigation;
  labels: DecisionTextLabels;
}

/** How the open editor was last settled, resolved once the host closes it. */
interface PendingSettle {
  from: SentenceValueId;
  move: CellCommitMove | 'cancel';
  /** The rules as they were when it settled, before the host applied the edit. */
  rules: readonly SentenceRule[];
}

export interface ValueEditing {
  /** The open editor's context, or null when no value is being edited. */
  editor: SentenceEditorContext | null;
  /** Identifies the edited value, so each value mounts its own editor. */
  editorKey: string | undefined;
  /** Handles an editing or clearing key on a stop, and returns whether it did. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => boolean;
  /** Starts editing a clicked value or clears a clicked condition, and returns whether it did. */
  onClick: (event: React.MouseEvent<HTMLElement>) => boolean;
}

const isStartKey = (event: React.KeyboardEvent): boolean =>
  event.key === 'Enter' || event.key === 'F2';

const isClearKey = (event: React.KeyboardEvent): boolean =>
  event.key === 'Delete' || event.key === 'Backspace';

const hasStop = (rule: SentenceRule | undefined, columnId: string): boolean =>
  rule !== undefined && stopTokensOf(rule).some((token) => token.columnId === columnId);

const valueKey = ({ rowId, columnId, index }: SentenceValueId): string =>
  JSON.stringify([rowId, columnId, index]);

/** The view's value editing: starting an edit, the editor's context, and where a commit or cancel moves. */
export const useValueEditing = ({
  edit,
  rules,
  bands,
  selected,
  onSelect,
  navigation,
  labels,
}: ValueEditingParams): ValueEditing => {
  const pendingRef = useRef<PendingSettle | null>(null);
  const refocusRef = useRef<string | null>(null);
  const target = edit?.editing ?? null;
  const openedRef = useRef(target ? valueKey(target) : undefined);
  const row = target ? rules.findIndex((rule) => rule.rowId === target.rowId) : -1;
  const rule = rules[row];

  const start = (value: SentenceValueId) => {
    if (!edit) return;
    pendingRef.current = null;
    if (selected?.rowId !== value.rowId || selected?.columnId !== value.columnId) {
      onSelect?.({ rowId: value.rowId, columnId: value.columnId });
    }
    edit.onStartEdit(value);
  };

  const editorOf = (): SentenceEditorContext | null => {
    if (!edit || !target || !rule) return null;
    const token = valueTokenOf(rule, target);
    const column = columnNameOf(rule, target.columnId) || bandColumnNameOf(bands, target.columnId);
    return {
      target,
      value: token?.text ?? '',
      ariaLabel: hasStop(rule, target.columnId)
        ? labels.cell(column, token ? tokenText(token, labels.emptyValue) : '', row + 1)
        : edit.labels.newCondition(column, row + 1),
      onCommit: (text, move) => {
        pendingRef.current = { from: target, move, rules };
        edit.onCommit(target, text, move);
      },
      onCancel: () => {
        pendingRef.current = { from: target, move: 'cancel', rules };
        edit.onCancel();
      },
    };
  };

  const resolve = ({ from, move, rules: before }: PendingSettle) => {
    const cell = { rowId: from.rowId, columnId: from.columnId };
    const rowRule = rules.find((candidate) => candidate.rowId === from.rowId);
    if (move === 'cancel') {
      if (hasStop(rowRule, cell.columnId)) navigation.select(cell);
      else navigation.select({ rowId: from.rowId }, addConditionOf);
      return;
    }
    const sibling = { ...from, index: from.index + (move === 'left' ? -1 : 1) };
    if ((move === 'left' || move === 'right') && rowRule && valueTokenOf(rowRule, sibling)) {
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
    const rowId = refocusRef.current;
    refocusRef.current = null;
    const focused = document.activeElement;
    if (rowId === null || !(focused instanceof HTMLElement)) return;
    if (
      focused === document.body ||
      focused.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId === rowId
    ) {
      navigation.refocus();
    }
  });

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending || target) return;
    pendingRef.current = null;
    resolve(pending);
  });

  const clear = (cell: SentenceCellId) => {
    refocusRef.current = cell.rowId;
    edit?.onClearCell(cell);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    const columnId = navigation.selectedColumnId;
    const rowId = selected?.rowId;
    if (!edit || !(isStartKey(event) || isClearKey(event)) || isIgnoredKey(event)) return false;
    if (columnId === null || rowId === undefined) return false;
    event.preventDefault();
    if (isClearKey(event)) clear({ rowId, columnId });
    else start({ rowId, columnId, index: 0 });
    return true;
  };

  const onClick = (event: React.MouseEvent<HTMLElement>): boolean => {
    const action = edit ? clickedAction(event.target) : null;
    if (edit && action?.action === 'clear') {
      clear(action.cell);
      if (selected?.rowId !== action.cell.rowId) navigation.select({ rowId: action.cell.rowId });
      return true;
    }
    if (edit && action?.action === 'delete') {
      refocusRef.current = action.rowId;
      edit.onDeleteRule(action.rowId);
      return true;
    }
    const value = edit && !action ? clickedValue(event.target) : null;
    if (!value) return false;
    start(value);
    return true;
  };

  return {
    editor: editorOf(),
    editorKey: target ? valueKey(target) : undefined,
    onKeyDown,
    onClick,
  };
};
