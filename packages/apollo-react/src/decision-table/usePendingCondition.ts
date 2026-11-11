import { useMemo, useState } from 'react';
import type { DecisionTextEdit } from './DecisionText';
import { bandColumnNameOf, hasStop } from './sentenceParts';
import type { SentenceBand, SentenceRule, SentenceValueId } from './sentenceTypes';
import { valueKey } from './useValueEditing';

export interface PendingConditionParams {
  edit: DecisionTextEdit | undefined;
  rules: readonly SentenceRule[];
  bands: readonly SentenceBand[];
}

export interface PendingCondition {
  /** The rules as the cards show them: the edited rule ends with the pending line. */
  rules: readonly SentenceRule[];
  /** The condition the open editor adds, which the rule does not have yet, or null. */
  pending: SentenceValueId | null;
  /** The operator its popover picks, which the line words before Apply. */
  onOperatorChange: (id: string) => void;
}

/** An operator picked for one pending condition. */
interface PickedOperator {
  key: string;
  id: string;
}

/** A condition added from + reads as a line of its rule, its input, its operator's words and a placeholder value, while its editor is open; nothing reaches the host until it commits. */
export const usePendingCondition = ({
  edit,
  rules,
  bands,
}: PendingConditionParams): PendingCondition => {
  const target = edit?.editing ?? null;
  const rule = target ? rules.find((candidate) => candidate.rowId === target.rowId) : undefined;
  const pending = target && rule && !hasStop(rule, target.columnId) ? target : null;
  const [picked, setPicked] = useState<PickedOperator | null>(null);
  const key = pending ? valueKey(pending) : null;
  if (picked && picked.key !== key) setPicked(null);
  const field = pending ? edit?.valueField?.(pending) : undefined;
  const operatorId = picked?.key === key ? picked.id : field?.operator;
  const operator = field?.operators?.find((option) => option.id === operatorId)?.label;
  const columnId = pending?.columnId;
  const index = pending?.index ?? 0;
  const column = columnId ? bandColumnNameOf(bands, columnId) : '';
  const placeholder = edit?.labels.setValue ?? '';
  const shown = useMemo(
    () =>
      rule && columnId
        ? rules.map((candidate) =>
            candidate === rule
              ? {
                  ...candidate,
                  lines: [
                    ...candidate.lines,
                    {
                      columnId,
                      parts: [
                        { kind: 'input' as const, columnId, text: column },
                        operator ? ` ${operator} ` : ' ',
                        { kind: 'value' as const, columnId, index, text: placeholder },
                      ],
                    },
                  ],
                }
              : candidate
          )
        : rules,
    [rules, rule, columnId, index, column, operator, placeholder]
  );
  const onOperatorChange = (id: string) => {
    if (key) setPicked({ key, id });
  };
  return { rules: shown, pending, onOperatorChange };
};
