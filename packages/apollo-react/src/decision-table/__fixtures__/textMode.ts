import type { DecisionTextMode, DecisionTextProps } from '../DecisionText';

type EditMode = Extract<DecisionTextMode, { kind: 'edit' }>;

/** A test host's mode as separate props: a diff reads what changed, an edit, Add rule or picker edits, an onSelect selects, else the view reads. */
export type ModeProps = Partial<
  Pick<EditMode, 'selected' | 'onSelect' | 'edit' | 'onAddRule' | 'policy'> &
    Pick<Extract<DecisionTextMode, { kind: 'diff' }>, 'diff'>
>;

/** The view's props with its mode given as separate props. */
export type FlatTextProps = Omit<DecisionTextProps, 'mode'> & ModeProps;

const noop = () => {};

/** The mode the separate props name. */
export const modeOf = ({
  selected = null,
  onSelect,
  edit,
  onAddRule,
  policy,
  diff,
}: ModeProps): DecisionTextMode => {
  if (diff) return { kind: 'diff', diff };
  if (edit || onAddRule || policy) {
    return {
      kind: 'edit',
      selected,
      onSelect: onSelect ?? noop,
      edit: edit ?? { onCommit: noop, onClearCell: noop, onDeleteRule: noop },
      onAddRule: onAddRule ?? noop,
      ...(policy ? { policy } : {}),
    };
  }
  return onSelect ? { kind: 'select', selected, onSelect } : { kind: 'read', selected };
};

/** The view's props with the mode the separate props name. */
export const textPropsOf = ({
  selected,
  onSelect,
  edit,
  onAddRule,
  policy,
  diff,
  ...props
}: FlatTextProps): DecisionTextProps => ({
  ...props,
  mode: modeOf({ selected, onSelect, edit, onAddRule, policy, diff }),
});
