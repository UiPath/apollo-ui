import type { Mark } from './marks';
import type { OpenCitation, SentenceCitation } from './sentenceTypes';

/** A decision's logic as its heading shows it: a table's hit policy, worded by the host, and rule count, or nothing for any other logic. */
export type DecisionGraphLogic =
  | { kind: 'table'; hitPolicy: string; ruleCount: number }
  | { kind: 'other' };

/** A heading's mark, and what its glyph reveals: the decision, or one of its rules. */
export type DecisionGraphMark =
  | { kind: 'decision'; mark: Mark }
  | { kind: 'rule'; mark: Mark; rowId: string };

/** A decision drawn in full: its card, then the decisions it requires nested under it. */
export interface DecisionGraphDecisionNode {
  kind: 'decision';
  /** Unique among the graph's decisions. */
  id: string;
  label: string;
  /** Logic that is not a table shows no policy or count, and the minimap counts none. */
  logic: DecisionGraphLogic;
  /** An error or warning glyph also tones the card. */
  mark?: DecisionGraphMark;
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

/** A decision, or one of its rules. */
export type DecisionGraphTarget =
  | { kind: 'decision'; decisionId: string }
  | { kind: 'rule'; decisionId: string; rowId: string };

/** The open decisions when the host keeps them, and where a toggle sends the next set. */
export interface DecisionGraphExpansion {
  expanded: ReadonlySet<string>;
  onChange: (expanded: ReadonlySet<string>) => void;
}

/** What an open decision's body can ask of the graph. */
export interface DecisionGraphBodyContext {
  /** Opens, scrolls to and flashes a decision in the graph, focusing its heading when `byKey`; an id not drawn in full goes to `onOpenDecision`. */
  revealDecision: (decisionId: string, byKey: boolean) => void;
}

/** The graph's citations: none, or each decision's list by id, opened by the host. */
export type DecisionGraphCitations =
  | { kind: 'none' }
  | {
      kind: 'cited';
      decisions: ReadonlyMap<string, readonly SentenceCitation[]>;
      onOpenCitation: OpenCitation;
    };
