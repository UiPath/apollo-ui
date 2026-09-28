import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { applyDiffHighlight } from './applyDiffHighlight';
import type { DiffHighlight } from './CanvasDiffView.types';

const node = (id: string): Node => ({ id, position: { x: 0, y: 0 }, data: { label: id } });
const edge = (id: string): Edge => ({ id, source: 'a', target: 'b' });

const highlight: DiffHighlight = {
  nodeKind: new Map([
    ['added', 'added'],
    ['removed', 'removed'],
    ['changed', 'changed'],
  ]),
  edgeKind: new Map([
    ['e-added', 'added'],
    ['e-removed', 'removed'],
    ['e-changed', 'changed'],
  ]),
};

const nodes = ['added', 'removed', 'changed', 'same'].map(node);
const edges = ['e-added', 'e-removed', 'e-changed', 'e-same'].map(edge);

const suggestions = (elements: Array<Node | Edge>) =>
  Object.fromEntries(
    elements.map((el) => [el.id, (el.data as { suggestionType?: string })?.suggestionType])
  );

describe('applyDiffHighlight', () => {
  it('maps each change kind to its suggestion type', () => {
    const result = applyDiffHighlight(nodes, edges, highlight);

    expect(suggestions(result.nodes)).toEqual({
      added: 'add',
      removed: 'delete',
      changed: 'update',
      same: undefined,
    });
    expect(suggestions(result.edges)).toEqual({
      'e-added': 'add',
      'e-removed': 'delete',
      'e-changed': 'update',
      'e-same': undefined,
    });
  });

  it('keeps existing data and returns untouched elements by reference', () => {
    const result = applyDiffHighlight(nodes, edges, highlight);

    expect(result.nodes[0]?.data).toEqual({ label: 'added', suggestionType: 'add' });
    expect(result.nodes[3]).toBe(nodes[3]);
    expect(result.edges[3]).toBe(edges[3]);
  });
});
