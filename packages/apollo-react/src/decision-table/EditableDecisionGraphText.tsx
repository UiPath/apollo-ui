import type React from 'react';
import { DecisionGraphView, type DecisionGraphViewProps } from './DecisionGraphView';

export type EditableDecisionGraphTextProps<Refusal, Logic> = DecisionGraphViewProps<Refusal, Logic>;

/** A decision graph as text whose decisions the host acts on through `mode`. */
export const EditableDecisionGraphText = <Refusal, Logic>(
  props: EditableDecisionGraphTextProps<Refusal, Logic>
): React.ReactElement => <DecisionGraphView {...props} />;
