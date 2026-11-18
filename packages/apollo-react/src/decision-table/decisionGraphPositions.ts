import type { DecisionGraphMove, DecisionGraphPlace } from './decisionGraphActionTypes';
import type { DecisionGraphDecisionNode, DecisionGraphNode } from './decisionGraphTypes';

/** Where a drawn node stands: its index among its siblings, top-level or under the decision drawn above it. */
export type DecisionGraphPosition =
  | { kind: 'top'; index: number; siblings: readonly DecisionGraphNode[] }
  | {
      kind: 'under';
      index: number;
      siblings: readonly DecisionGraphNode[];
      parent: DecisionGraphDecisionNode;
      parentPosition: DecisionGraphPosition;
    };

/** The decision a node stands for: its own, or the one a reference repeats. */
export const decisionIdOf = (node: DecisionGraphNode): string =>
  node.kind === 'decision' ? node.id : node.targetId;

export const topPositionsOf = (nodes: readonly DecisionGraphNode[]): DecisionGraphPosition[] =>
  nodes.map((_, index) => ({ kind: 'top', index, siblings: nodes }));

export const childPositionsOf = (
  parent: DecisionGraphDecisionNode,
  parentPosition: DecisionGraphPosition
): DecisionGraphPosition[] =>
  parent.children.map((_, index) => ({
    kind: 'under',
    index,
    siblings: parent.children,
    parent,
    parentPosition,
  }));

export const placeOf = (
  position: DecisionGraphPosition,
  index = position.index
): DecisionGraphPlace =>
  position.kind === 'top'
    ? { kind: 'top', index }
    : { kind: 'under', parentId: position.parent.id, index };

const moveTo = (
  node: DecisionGraphNode,
  position: DecisionGraphPosition,
  to: DecisionGraphPlace
): DecisionGraphMove => ({ decisionId: decisionIdOf(node), from: placeOf(position), to });

export const moveUpOf = (
  node: DecisionGraphNode,
  position: DecisionGraphPosition
): DecisionGraphMove | null =>
  position.index > 0 ? moveTo(node, position, placeOf(position, position.index - 1)) : null;

export const moveDownOf = (
  node: DecisionGraphNode,
  position: DecisionGraphPosition
): DecisionGraphMove | null =>
  position.index < position.siblings.length - 1
    ? moveTo(node, position, placeOf(position, position.index + 1))
    : null;

/** The decision drawn just above a node among its siblings, which it can move under. */
export const previousDecisionOf = (
  node: DecisionGraphNode,
  position: DecisionGraphPosition
): DecisionGraphDecisionNode | null => {
  const previous = position.siblings[position.index - 1];
  return previous?.kind === 'decision' && previous.id !== decisionIdOf(node) ? previous : null;
};

export const moveUnderPreviousOf = (
  node: DecisionGraphNode,
  position: DecisionGraphPosition
): DecisionGraphMove | null => {
  const previous = previousDecisionOf(node, position);
  return previous
    ? moveTo(node, position, {
        kind: 'under',
        parentId: previous.id,
        index: previous.children.length,
      })
    : null;
};

export const moveOutOf = (
  node: DecisionGraphNode,
  position: DecisionGraphPosition
): DecisionGraphMove | null =>
  position.kind === 'under'
    ? moveTo(node, position, placeOf(position.parentPosition, position.parentPosition.index + 1))
    : null;

/** Each decision's users by id: the decisions it sits under, in full or as a reference, once each. */
export const usersOf = (
  nodes: readonly DecisionGraphNode[]
): ReadonlyMap<string, readonly DecisionGraphDecisionNode[]> => {
  const users = new Map<string, DecisionGraphDecisionNode[]>();
  const visit = (node: DecisionGraphNode, parent: DecisionGraphDecisionNode | null) => {
    const id = decisionIdOf(node);
    const known = users.get(id) ?? [];
    if (parent && !known.includes(parent)) users.set(id, [...known, parent]);
    if (node.kind === 'decision') for (const child of node.children) visit(child, node);
  };
  for (const node of nodes) visit(node, null);
  return users;
};

/** Every decision drawn in full, in reading order. */
export const decisionsOf = (
  nodes: readonly DecisionGraphNode[]
): readonly DecisionGraphDecisionNode[] => {
  const decisions: DecisionGraphDecisionNode[] = [];
  const visit = (node: DecisionGraphNode) => {
    if (node.kind !== 'decision') return;
    decisions.push(node);
    for (const child of node.children) visit(child);
  };
  for (const node of nodes) visit(node);
  return decisions;
};

/** The decisions a decision requires, in its children's order, once each. */
export const inputIdsOf = (decision: DecisionGraphDecisionNode): readonly string[] => [
  ...new Set(decision.children.map(decisionIdOf)),
];
