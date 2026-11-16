import type { DecisionGraphDecisionNode, DecisionGraphNode } from '../decisionGraphTypes';
import type { Mark } from '../marks';
import { EDITABLE_TABLE, type EditableTable } from './editableSentences.fixtures';

/** A decision's body in a fixture graph: a table, or the text standing for logic that is not one. */
export type GraphBody = EditableTable | string;

export interface GraphFixture {
  nodes: readonly DecisionGraphNode[];
  bodies: Readonly<Record<string, GraphBody>>;
}

const decision = (
  id: string,
  label: string,
  children: readonly DecisionGraphNode[] = [],
  extra: Partial<DecisionGraphDecisionNode> = {}
): DecisionGraphDecisionNode => ({
  kind: 'decision',
  id,
  label,
  hitPolicy: 'Unique',
  ruleCount: EDITABLE_TABLE.rules.length,
  children,
  ...extra,
});

const reference = (id: string, label: string, targetId: string): DecisionGraphNode => ({
  kind: 'reference',
  id,
  label,
  targetId,
});

/** `count` rules cycling through the editable table's, each with its own id. */
export const tableOf = (count: number): EditableTable => ({
  ...EDITABLE_TABLE,
  rules: Array.from({ length: count }, (_, index) => index).flatMap((index) => {
    const rule = EDITABLE_TABLE.rules[index % EDITABLE_TABLE.rules.length];
    return rule ? [{ ...rule, rowId: `r${index + 1}` }] : [];
  }),
});

export const EMPTY_GRAPH: GraphFixture = { nodes: [], bodies: {} };

export const SINGLE_DECISION: GraphFixture = {
  nodes: [decision('risk', 'Risk')],
  bodies: { risk: EDITABLE_TABLE },
};

/** Eligibility and Pricing both require Risk: drawn under Eligibility, referenced under Pricing. */
export const SHARED_DEPENDENCY: GraphFixture = {
  nodes: [
    decision('eligibility', 'Eligibility', [
      decision('risk', 'Risk'),
      decision('net-income', 'Net income'),
    ]),
    decision('pricing', 'Pricing', [reference('pricing-risk', 'Risk', 'risk')]),
  ],
  bodies: {
    eligibility: EDITABLE_TABLE,
    risk: EDITABLE_TABLE,
    'net-income': EDITABLE_TABLE,
    pricing: EDITABLE_TABLE,
  },
};

/** Approval requires Limit, which requires Approval: the cycle ends in a reference. */
export const CYCLE: GraphFixture = {
  nodes: [
    decision('approval', 'Approval', [
      decision('limit', 'Limit', [reference('limit-approval', 'Approval', 'approval')]),
    ]),
  ],
  bodies: { approval: EDITABLE_TABLE, limit: EDITABLE_TABLE },
};

/** A decision whose logic is a literal expression, not a table. */
export const NOT_A_TABLE: GraphFixture = {
  nodes: [
    decision('offer', 'Offer', [
      decision('discount', 'Discount rate', [], { hitPolicy: undefined, ruleCount: undefined }),
    ]),
  ],
  bodies: {
    offer: EDITABLE_TABLE,
    discount: "This decision isn't a decision table. Open it on the diagram to edit it.",
  },
};

const ERROR_MARK: Mark = { tone: 'error', title: 'Rules 1 and 3 overlap', glyph: true };
const WARNING_MARK: Mark = { tone: 'warning', title: 'No rule covers age 60', glyph: true };

/** Headings marked with an error and a warning, each pointing at a rule. */
export const MARKED: GraphFixture = {
  nodes: [
    decision(
      'eligibility',
      'Eligibility',
      [decision('risk', 'Risk', [], { mark: WARNING_MARK, markRowId: 'r20' })],
      { mark: ERROR_MARK, markRowId: 'r3', ruleCount: 30 }
    ),
  ],
  bodies: { eligibility: tableOf(30), risk: { ...tableOf(30) } },
};

/** `decisions` decisions of `rulesEach` rules, nested in threes, every fifth one reusing the first. */
export const largeGraph = (decisions: number, rulesEach: number): GraphFixture => {
  const table = tableOf(rulesEach);
  const bodies: Record<string, GraphBody> = {};
  const node = (index: number): DecisionGraphDecisionNode => {
    const id = `d${index + 1}`;
    bodies[id] = table;
    const children: DecisionGraphNode[] = [];
    for (let child = index * 3 + 1; child <= index * 3 + 3 && child < decisions; child++) {
      children.push(node(child));
    }
    if (index > 0 && index % 5 === 0) children.push(reference(`${id}-uses-d1`, 'Decision 1', 'd1'));
    return decision(id, `Decision ${index + 1}`, children, { ruleCount: rulesEach });
  };
  return { nodes: [node(0)], bodies };
};
