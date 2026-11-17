import { useState } from 'react';
import type { DecisionTextEditLabels, CellEdit, ViewEdit } from './decisionTextTypes';
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

/** Which value is open, the host's when it passes `editing` and the view's own otherwise, what the host last refused of it, and the editing strings. */
export const useEditState = (
  edit: CellEdit | undefined,
  labels: DecisionTextEditLabels
): EditState => {
  const [held, setHeld] = useState<SentenceValueId | null>(edit?.editing ?? null);
  const [refusal, setRefusal] = useState<HeldRefusal | null>(null);
  const controlled = edit?.editing !== undefined;
  const editing = (controlled ? edit?.editing : edit && held) ?? null;
  const key = keyOf(editing);
  if (keyOf(held) !== key) setHeld(editing);
  if (refusal && refusal.key !== key) setRefusal(null);
  if (!edit) return { edit: undefined, refusal: null };

  const hold = (next: SentenceValueId | null) => {
    if (!controlled) setHeld(next);
  };
  const shown = refusal && refusal.key === key && refusal.message.trim() !== '' ? refusal : null;
  return {
    edit: {
      ...edit,
      labels,
      editing,
      onStartEdit: (value) => {
        edit.onStartEdit?.(value);
        hold(value);
      },
      onCommit: (value, commit, move) => {
        const answer = edit.onCommit(value, commit, move);
        if (typeof answer === 'string') {
          setRefusal((last) => ({
            key: valueKey(value),
            message: answer,
            attempt: (last?.attempt ?? 0) + 1,
          }));
          return answer;
        }
        setRefusal(null);
        hold(null);
        return undefined;
      },
      onCancel: () => {
        edit.onCancel?.();
        hold(null);
      },
    },
    refusal: shown && { message: shown.message, attempt: shown.attempt },
  };
};
