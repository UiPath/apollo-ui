import { useState } from 'react';
import type { DecisionTextEditLabels, ViewEdit, WordedEdit } from './decisionTextTypes';
import type { SentenceValueId } from './sentenceTypes';
import { valueKey } from './useValueEditing';
import type { CommitRefusal } from './valueTypes';

/** A refusal and the editor it refused. */
interface HeldRefusal extends CommitRefusal {
  key: string;
}

export interface EditState {
  edit: ViewEdit | undefined;
  /** The host's last refusal of the open editor, until it commits again or closes. */
  refusal: CommitRefusal | null;
}

const keyOf = (value: SentenceValueId | null): string | undefined =>
  value ? valueKey(value) : undefined;

/** What the view words and announces for the host's edits. */
export interface EditVoice {
  /** The input columns, in the add-condition menu's order. */
  inputIds: readonly string[];
  announce: (text: string) => void;
  announceMove: (from: number, to: number) => void;
}

/** Which value is open, the host's when it passes `editing` and the view's own otherwise, what the host last refused of it, and the editing strings. */
export const useEditState = (
  edit: WordedEdit | undefined,
  labels: DecisionTextEditLabels,
  voice: EditVoice
): EditState => {
  const [held, setHeld] = useState<SentenceValueId | null>(edit?.editing?.value ?? null);
  const [refusal, setRefusal] = useState<HeldRefusal | null>(null);
  const controlled = edit?.editing;
  const editing = (controlled ? controlled.value : edit && held) ?? null;
  const key = keyOf(editing);
  if (keyOf(held) !== key) setHeld(editing);
  if (refusal && refusal.key !== key) setRefusal(null);
  if (!edit) return { edit: undefined, refusal: null };

  const hold = (next: SentenceValueId | null) => {
    if (!controlled) setHeld(next);
  };
  const shown = refusal && refusal.key === key ? refusal : null;
  const { onMoveRule, editing: _editing, ...rest } = edit;
  return {
    edit: {
      ...rest,
      labels,
      inputIds: voice.inputIds,
      editing,
      onStartEdit: (value) => {
        controlled?.onStart(value);
        hold(value);
      },
      onCommit: (value, commit, move) => {
        const answer = edit.onCommit(value, commit, move);
        if (answer !== undefined) {
          setRefusal((last) => ({
            key: valueKey(value),
            message: answer,
            attempt: (last?.attempt ?? 0) + 1,
          }));
          return;
        }
        setRefusal(null);
        hold(null);
      },
      onClearCell: (cell) => {
        const answer = edit.onClearCell(cell);
        if (answer !== undefined) voice.announce(answer);
      },
      onMoveRule:
        onMoveRule &&
        ((from, to) => {
          onMoveRule(from, to);
          voice.announceMove(from, to);
        }),
      onCancel: () => {
        edit.onCancel();
        hold(null);
      },
    },
    refusal: shown && { message: shown.message, attempt: shown.attempt },
  };
};
