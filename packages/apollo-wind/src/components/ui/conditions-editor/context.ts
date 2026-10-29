import * as React from 'react';
import type { ValueModeStrings } from '@/components/ui/field-addons';
import type { MultiSelectStrings } from '@/components/ui/multi-select';
import type { MatchMode } from '@/components/ui/row-groups';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import type { Condition, ConditionNode, ConditionValueMode } from './model';
import type { ConditionVocabulary } from './status';
import type { ConditionsEditorStrings } from './strings';
import type { ConditionField, ConditionOperator } from './vocabulary';

export interface ConditionValueRenderProps {
  condition: Condition;
  field?: ConditionField;
  operator?: ConditionOperator;
  mode: ConditionValueMode;
  /** Ids of the row name and the visible Value label, for `aria-labelledby`. */
  labelledBy: string;
  invalid: boolean;
  /** The row message's id, for `aria-describedby` and `aria-errormessage`, while it shows. */
  errorId?: string;
  disabled: boolean;
  onChange: (patch: Pick<Condition, 'value' | 'values'>) => void;
}

/**
 * Replaces a value's control, such as with the host's own expression editor. It renders inside the
 * value's `InputGroup`, beside the mode menu, so return an input-group control. Return `undefined`
 * to keep the built-in control; `null` renders no control.
 *
 * It is called during render, not mounted as a component, so it cannot call hooks itself. Return
 * a component that does.
 */
export type RenderConditionValue = (
  props: ConditionValueRenderProps
) => React.ReactNode | undefined;

export type ConditionPatch = Partial<Omit<Condition, 'kind' | 'id'>>;

export interface ConditionsEditorContextValue extends ConditionVocabulary {
  strings: ConditionsEditorStrings;
  valueModeStrings?: Partial<ValueModeStrings>;
  multiSelectStrings?: Partial<MultiSelectStrings>;
  variables?: VariablePickerItem[];
  renderValue?: RenderConditionValue;
  disabled: boolean;
  forceErrors: boolean;
  /** Rows focus has left. Their messages show from then on. */
  touched: ReadonlySet<string>;
  markTouched: (id: string) => void;
  /** Stable across renders, so memoised rows only re-render when their own condition changes. */
  updateCondition: (id: string, patch: ConditionPatch) => void;
  setGroupMode: (id: string, mode: MatchMode) => void;
  addChild: (groupId: string, child: ConditionNode) => void;
  removeChild: (id: string) => void;
}

export const ConditionsEditorContext = React.createContext<ConditionsEditorContextValue | null>(
  null
);

export function useConditionsEditor() {
  const context = React.useContext(ConditionsEditorContext);
  if (!context) throw new Error('ConditionRow must be rendered inside ConditionsEditor.');
  return context;
}
