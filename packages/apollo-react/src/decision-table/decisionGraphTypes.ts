import type { Mark } from './marks';

/** A decision drawn in full: its card, then the decisions it requires nested under it. */
export interface DecisionGraphDecisionNode {
  kind: 'decision';
  /** Unique among the graph's decisions. */
  id: string;
  label: string;
  /** The hit policy as the heading shows it, e.g. "Unique". */
  hitPolicy?: string;
  /** How many rules its table has; without it the heading shows no count and the minimap counts none. */
  ruleCount?: number;
  /** The decision's own mark, on its heading; an error or warning glyph also tones the card. */
  mark?: Mark;
  /** The rule the heading's mark points at, which its glyph reveals. */
  markRowId?: string;
  children: readonly DecisionGraphNode[];
}

/** A decision drawn in full elsewhere in the tree, shown here as a link to it. */
export interface DecisionGraphReferenceNode {
  kind: 'reference';
  /** Unique among the tree's references. */
  id: string;
  label: string;
  /** The id of the decision it repeats. */
  targetId: string;
}

export type DecisionGraphNode = DecisionGraphDecisionNode | DecisionGraphReferenceNode;

/** A decision, or one of its rules when `rowId` is set. */
export interface DecisionGraphTarget {
  decisionId: string;
  rowId?: string;
}

/** A rule as the minimap lists it. */
export interface DecisionGraphRule {
  rowId: string;
  label: string;
}
