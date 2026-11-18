import { useState } from 'react';
import type { CellEdit, DecisionTextEdit, DecisionTextEditLabels } from './decisionTextTypes';
import { hostCommitOf, refusedValuesOf, viewFieldOf } from './hostValues';
import type { SentenceBandColumn, SentenceCellId } from './sentenceTypes';
import { type EditState, type EditVoice, useEditState } from './useEditState';
import { valueKey } from './useValueEditing';
import type { OperatorOffer, ValueFieldData } from './valueTypes';

/** The open value's key, and the host's field its editor opened on. */
interface OpenField<Op> {
  key: string;
  field: ValueFieldData<Op>;
}

/** One render's open value key, known once the edit state is. */
interface RenderedKey {
  key: string | null;
}

/** The host's edit with each operator by its place in the field its editor opened on, its allowed values live, and each refusal worded with its column's name. */
const wordedEditOf = <Op, Type, Refusal>(
  {
    onCommit,
    onClearCell,
    wordRefusal,
    valueField: hostField,
    column: _column,
    ...rest
  }: DecisionTextEdit<Op, Type, Refusal>,
  opened: OpenField<Op> | null,
  rendered: RenderedKey,
  keep: (open: OpenField<Op>) => void,
  columnNameOf: (columnId: string) => string
): CellEdit => {
  const keptField = () => (opened && opened.key === rendered.key ? opened.field : null);
  const valueField = (cell: SentenceCellId): ValueFieldData<Op> => {
    const live = hostField(cell);
    const kept = keptField();
    if (kept) return { ...kept, allowedValues: live.allowedValues };
    if (rendered.key !== null) keep({ key: rendered.key, field: live });
    return live;
  };
  const offersOf = (cell: SentenceCellId): readonly OperatorOffer<Op>[] => {
    const field = keptField() ?? hostField(cell);
    return field.kind === 'condition' ? field.operators : [];
  };
  return {
    ...rest,
    valueField: (cell) => viewFieldOf(valueField(cell)),
    onCommit: (value, commit, move) => {
      const hostCommit = hostCommitOf(commit, offersOf(value));
      if (!hostCommit) return undefined;
      const refusal = onCommit(value, hostCommit, move);
      return refusal === undefined
        ? undefined
        : wordRefusal(refusal, {
            action: 'commit',
            column: columnNameOf(value.columnId),
            values: refusedValuesOf(hostCommit),
          });
    },
    onClearCell: (cell) => {
      const refusal = onClearCell(cell);
      return refusal === undefined
        ? undefined
        : wordRefusal(refusal, { action: 'clear', column: columnNameOf(cell.columnId) });
    },
  };
};

/** The view's edit state on the host's edit: each open value keeps the field its editor opened on, and each refusal is worded with its column's name. */
export const useHostValueEdit = <Op, Type, Refusal>(
  edit: DecisionTextEdit<Op, Type, Refusal> | undefined,
  columns: readonly Pick<SentenceBandColumn<Type>, 'id' | 'name'>[],
  labels: DecisionTextEditLabels,
  voice: EditVoice
): EditState => {
  const [openField, setOpenField] = useState<OpenField<Op> | null>(null);
  const rendered: RenderedKey = { key: null };
  const columnNameOf = (columnId: string): string =>
    columns.find((column) => column.id === columnId)?.name ?? '';
  const state = useEditState(
    edit && wordedEditOf(edit, openField, rendered, setOpenField, columnNameOf),
    labels,
    voice
  );
  rendered.key = state.edit?.editing ? valueKey(state.edit.editing) : null;
  if (openField && openField.key !== rendered.key) setOpenField(null);
  return state;
};
