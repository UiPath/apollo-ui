import type React from 'react';
import { DecisionGraphView, type DecisionGraphViewProps } from './DecisionGraphView';
import type { DecisionGraphMode } from './decisionGraphActionTypes';

export type DecisionGraphTextProps = Omit<
  DecisionGraphViewProps<never, never>,
  'mode' | 'dataTestId'
> & {
  /** Container testid; derived ids: `-scroller`, `-empty`, `-decision-{id}`, `-toggle-{id}`, `-hit-policy-{id}`, `-rule-count-{id}`, `-mark-{id}`, `-body-{id}`, `-reference-{id}`, `-reference-link-{id}`, `-live`, `-minimap` (and its `-trigger`, `-content`, `-search`, `-list`, `-row-decision-{id}`, `-row-rule-{id}-{rowId}`, `-row-reference-{id}`, `-no-match`). */
  dataTestId: DecisionGraphViewProps<never, never>['dataTestId'];
};

const READ: DecisionGraphMode<never, never> = { kind: 'read' };

/** A decision graph read as text: one folding card per decision in the order given, the decisions it requires nested under it. */
export const DecisionGraphText: React.FC<DecisionGraphTextProps> = (props) => (
  <DecisionGraphView {...props} mode={READ} />
);
