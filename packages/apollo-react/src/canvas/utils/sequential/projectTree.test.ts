import { describe, expect, it } from 'vitest';
import { buildSequentialEdges } from '../../components/SequentialCanvas/useSequentialGraph';
import { layoutSequence } from './layoutSequence';
import { projectTree, treeAppendPlaceholderId, treeLanePlaceholderId } from './projectTree';
import type { SequenceStep } from './sequential.types';

const leaf = (id: string): SequenceStep => ({ id, type: 'uipath.script', label: id });

/** Main: A, If (Then: T, Else: empty), Try (Try: R, Catches[0]: H, Finally: empty), B. */
function makeTree(): SequenceStep {
  return {
    id: 'main',
    type: 'uipath.sequence',
    label: 'Main',
    slots: [
      {
        name: 'Activities',
        steps: [
          leaf('a'),
          {
            id: 'if',
            type: 'uipath.control-flow.decision',
            label: 'If',
            slots: [
              { name: 'Then', label: 'Then', steps: [leaf('t')] },
              { name: 'Else', label: 'Else', steps: [] },
            ],
          },
          {
            id: 'try',
            type: 'uipath.try-catch',
            label: 'Try Catch',
            slots: [
              { name: 'Try', label: 'Try', steps: [leaf('r')] },
              { name: 'Catches[0]', label: 'Catch (Exception)', steps: [leaf('h')] },
              { name: 'Finally', label: 'Finally', steps: [] },
            ],
          },
          leaf('b'),
        ],
      },
    ],
  };
}

describe('projectTree', () => {
  it('lists a sequence root in pre-order, with lanes, add points and empty-lane placeholders', () => {
    const { projection } = projectTree(makeTree());

    expect(projection.rows.map((row) => row.nodeId)).toEqual([
      'a',
      'if',
      't',
      treeAppendPlaceholderId('t'),
      treeLanePlaceholderId('if', 'Else'),
      'try',
      'r',
      treeAppendPlaceholderId('r'),
      'h',
      treeAppendPlaceholderId('h'),
      treeLanePlaceholderId('try', 'Finally'),
      'b',
    ]);
    expect(
      projection.rows.filter((row) => row.stepNumber !== undefined).map((row) => row.stepNumber)
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const t = projection.rows.find((row) => row.nodeId === 't');
    expect(t).toMatchObject({
      depth: 1,
      parentRowId: 'if',
      branch: { sourceNodeId: 'if', handleId: 'Then', label: 'Then' },
    });
  });

  it('addresses every insertion point in the host terms of slot and sibling', () => {
    const { projection } = projectTree(makeTree());
    const refOf = (id: string) => projection.slots.find((slot) => slot.id === id)?.ref;

    expect(refOf('slot:after:a')).toEqual({ parentId: 'main', slot: 'Activities', after: 'a' });
    expect(refOf('slot:head:if:Then')).toEqual({ parentId: 'if', slot: 'Then', after: null });
    expect(refOf('slot:leaf:t')).toEqual({ parentId: 'if', slot: 'Then', after: 't' });
    expect(refOf('slot:lane:if:Else')).toEqual({ parentId: 'if', slot: 'Else', after: null });
    expect(refOf('slot:leaf:h')).toEqual({ parentId: 'try', slot: 'Catches[0]', after: 'h' });
    expect(projection.headSlot?.ref).toEqual({ parentId: 'main', slot: 'Activities', after: null });
    expect(projection.headSlot?.target?.nodeId).toBe('a');
    expect(projection.tailSlot?.ref).toEqual({ parentId: 'main', slot: 'Activities', after: 'b' });
    // A tree slot never names graph endpoints.
    expect(
      projection.slots.every((slot) => slot.source === undefined && slot.graphEdgeId === undefined)
    ).toBe(true);
  });

  it('joins the step after a step with lanes by a merge-back, and enters lanes by branch-entry', () => {
    const { projection } = projectTree(makeTree());
    const kindOf = (source: string, target: string) =>
      projection.connectors.find((c) => c.sourceRowId === source && c.targetRowId === target)?.kind;

    expect(kindOf('a', 'if')).toBe('step');
    expect(kindOf('if', 'try')).toBe('merge-back');
    expect(kindOf('try', 'b')).toBe('merge-back');
    expect(kindOf('if', 't')).toBe('branch-entry');
    expect(kindOf('if', treeLanePlaceholderId('if', 'Else'))).toBe('branch-entry');
    expect(projection.connectors.some((c) => c.kind === 'goto')).toBe(false);
  });

  it('hides what a collapsed step holds', () => {
    const { projection } = projectTree(makeTree(), { collapsedStepIds: new Set(['if']) });
    const visible = (id: string) => projection.rows.find((row) => row.nodeId === id)?.visible;

    expect(projection.rows.find((row) => row.nodeId === 'if')?.collapsed).toBe(true);
    expect(visible('t')).toBe(false);
    expect(visible(treeLanePlaceholderId('if', 'Else'))).toBe(false);
    expect(visible('try')).toBe(true);
  });

  it('shows a root that is not a list as its own row, with its slots as lanes', () => {
    const tree = makeTree().slots![0]!.steps[1]!;
    const { projection } = projectTree(tree);

    expect(projection.rows[0]).toMatchObject({ nodeId: 'if', depth: 0, stepNumber: 1 });
    expect(projection.rows.find((row) => row.nodeId === 't')?.depth).toBe(1);
    expect(projection.headSlot).toBeUndefined();
    expect(projection.tailSlot).toBeUndefined();
  });

  it('makes one bar node per step, carrying its label and summary', () => {
    const tree = makeTree();
    tree.slots![0]!.steps[0] = { ...leaf('a'), subLabel: 'total = 1' };
    const { nodes } = projectTree(tree);

    expect(nodes.map((node) => node.id)).toEqual(['a', 'if', 't', 'try', 'r', 'h', 'b']);
    expect(nodes[0]).toMatchObject({
      type: 'uipath.script',
      data: { display: { label: 'a', subLabel: 'total = 1' } },
    });
  });

  it('refuses a tree that names one step twice', () => {
    const tree = makeTree();
    tree.slots![0]!.steps.push(leaf('a'));

    expect(() => projectTree(tree)).toThrow(/appears twice/);
  });

  it('lays out and draws through the same layout and connector builder as a graph', () => {
    const { projection } = projectTree(makeTree());
    const layout = layoutSequence(projection);

    for (const row of projection.rows) {
      expect(layout.positions.has(row.nodeId)).toBe(true);
    }
    const edges = buildSequentialEdges(projection, layout);
    // Every connector, plus the start join and the terminal placeholder join.
    expect(edges).toHaveLength(projection.connectors.length + 2);
    const startEdge = edges.find(
      (edge) => (edge.data as { slot?: { id: string } })?.slot?.id === 'slot:head:a'
    );
    expect(startEdge).toBeDefined();
  });
});
