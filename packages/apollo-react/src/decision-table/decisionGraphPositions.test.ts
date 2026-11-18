import { describe, expect, it } from 'vitest';
import {
  childPositionsOf,
  type DecisionGraphPosition,
  inputIdsOf,
  moveOutOf,
  moveUnderPreviousOf,
  topPositionsOf,
  usersOf,
} from './decisionGraphPositions';
import type { DecisionGraphDecisionNode, DecisionGraphNode } from './decisionGraphTypes';

const decision = (
  id: string,
  children: readonly DecisionGraphNode[] = []
): DecisionGraphDecisionNode => ({
  kind: 'decision',
  id,
  label: id,
  logic: { kind: 'other' },
  children,
});

const reference = (id: string, targetId: string): DecisionGraphNode => ({
  kind: 'reference',
  id,
  label: targetId,
  targetId,
});

const positionAt = (nodes: readonly DecisionGraphNode[], index: number): DecisionGraphPosition => {
  const position = topPositionsOf(nodes)[index];
  if (!position) throw new Error(`No top position ${index}`);
  return position;
};

describe('decisionGraphPositions', () => {
  it('moves a decision under the previous decision, after its inputs, but never under a reference', () => {
    const a = decision('a', [decision('x')]);
    const nodes = [a, reference('ref-b', 'b'), decision('c')];
    const b = nodes[1];
    const c = nodes[2];
    if (!b || !c) throw new Error('No nodes');
    expect(moveUnderPreviousOf(b, positionAt(nodes, 1))).toEqual({
      decisionId: 'b',
      from: { kind: 'top', index: 1 },
      to: { kind: 'under', parentId: 'a', index: 1 },
    });
    expect(moveUnderPreviousOf(c, positionAt(nodes, 2))).toBeNull();
  });

  it('never moves a decision under a previous drawing of itself', () => {
    const nodes = [decision('a'), reference('again', 'a')];
    const again = nodes[1];
    if (!again) throw new Error('No reference');
    expect(moveUnderPreviousOf(again, positionAt(nodes, 1))).toBeNull();
  });

  it('moves a nested decision out to just after the decision it was under', () => {
    const inner = decision('inner');
    const outer = decision('outer', [inner]);
    const nodes = [decision('first'), outer];
    const [innerPosition] = childPositionsOf(outer, positionAt(nodes, 1));
    if (!innerPosition) throw new Error('No child position');
    expect(moveOutOf(inner, innerPosition)).toEqual({
      decisionId: 'inner',
      from: { kind: 'under', parentId: 'outer', index: 0 },
      to: { kind: 'top', index: 2 },
    });
    expect(moveOutOf(outer, positionAt(nodes, 1))).toBeNull();
  });

  it('lists each user and each input once, whether drawn in full or as a reference', () => {
    const shared = decision('shared');
    const twice = decision('twice', [shared, reference('twice-shared', 'shared')]);
    const other = decision('other', [reference('other-shared', 'shared')]);
    expect(
      usersOf([twice, other])
        .get('shared')
        ?.map(({ id }) => id)
    ).toEqual(['twice', 'other']);
    expect(inputIdsOf(twice)).toEqual(['shared']);
  });
});
