import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../../constants';
import type { GraphChangeSet } from '../../utils/sequential/sequential.types';
import { SEQ_INSERTED_FLAG } from './edges/sequentialInsert';
import {
  forwardSequentialEdgeChanges,
  forwardSequentialNodeChanges,
  graphChangeSetToEdgeChanges,
  graphChangeSetToNodeChanges,
} from './sequentialChangeFilters';
import { SEQ_CONNECTOR_EDGE_TYPE, SEQ_START_ROW_ID } from './sequentialGraph.constants';

const SYNTHETIC = new Set([SEQ_START_ROW_ID]);

function canonical(id: string, position = { x: 100, y: 100 }): Node {
  return { id, type: 'uipath.script', position, width: 288, data: { display: { label: id } } };
}

describe('forwardSequentialNodeChanges', () => {
  const canonicalById = new Map([['a', canonical('a')]]);

  it('drops position and dimension changes (the derivation owns geometry)', () => {
    const changes: NodeChange<Node>[] = [
      { type: 'position', id: 'a', position: { x: 9, y: 9 } },
      { type: 'dimensions', id: 'a', dimensions: { width: 896, height: 72 } },
    ];
    expect(forwardSequentialNodeChanges(changes, SYNTHETIC, canonicalById)).toEqual([]);
  });

  it('drops changes referencing synthetic rows and the preview node', () => {
    const changes: NodeChange<Node>[] = [
      { type: 'select', id: SEQ_START_ROW_ID, selected: true },
      { type: 'select', id: PREVIEW_NODE_ID, selected: true },
      { type: 'remove', id: PREVIEW_NODE_ID },
    ];
    expect(forwardSequentialNodeChanges(changes, SYNTHETIC, canonicalById)).toEqual([]);
  });

  it('drops changes referencing synthetic empty-lane placeholder nodes', () => {
    const synthetic = new Set([
      ...SYNTHETIC,
      '__sequential-lane__if::true',
      '__sequential-lane__loop::start',
    ]);
    const changes: NodeChange<Node>[] = [
      { type: 'select', id: '__sequential-lane__if::true', selected: true },
      { type: 'remove', id: '__sequential-lane__loop::start' },
    ];
    expect(forwardSequentialNodeChanges(changes, synthetic, canonicalById)).toEqual([]);
  });

  it('does not drop a canonical node merely because its id resembles a synthetic id', () => {
    const id = '__sequential-lane__consumer-owned';
    const changes: NodeChange<Node>[] = [{ type: 'select', id, selected: true }];

    expect(forwardSequentialNodeChanges(changes, SYNTHETIC, canonicalById)).toEqual(changes);
  });

  it('passes select and remove of real nodes through', () => {
    const changes: NodeChange<Node>[] = [
      { type: 'select', id: 'a', selected: true },
      { type: 'remove', id: 'a' },
    ];
    expect(forwardSequentialNodeChanges(changes, SYNTHETIC, canonicalById)).toEqual(changes);
  });

  it('rewrites a rename replace to merge data onto canonical, preserving geometry', () => {
    const cloneItem: Node = {
      id: 'a',
      type: 'uipath.script',
      position: { x: 0, y: 5000 }, // clone/view position
      width: 896, // bar width
      selected: true,
      data: { display: { label: 'renamed' } },
    };
    const changes: NodeChange<Node>[] = [{ type: 'replace', id: 'a', item: cloneItem }];

    const [out] = forwardSequentialNodeChanges(changes, SYNTHETIC, canonicalById);
    expect(out?.type).toBe('replace');
    const item = (out as { item: Node }).item;
    // Canonical geometry preserved, only data + selection merged.
    expect(item.position).toEqual({ x: 100, y: 100 });
    expect(item.width).toBe(288);
    expect(item.selected).toBe(true);
    expect((item.data as { display: { label: string } }).display.label).toBe('renamed');
  });

  it('forwards an inserted node add, drops non-inserted adds', () => {
    const insertedItem: Node = {
      id: 'new',
      type: 'uipath.slack',
      position: { x: 0, y: 0 },
      data: { [SEQ_INSERTED_FLAG]: true },
    };
    const changes: NodeChange<Node>[] = [
      { type: 'add', item: insertedItem },
      { type: 'add', item: canonical('other') },
    ];
    const out = forwardSequentialNodeChanges(changes, SYNTHETIC, canonicalById);
    expect(out).toHaveLength(1);
    expect((out[0] as { item: Node }).item.id).toBe('new');
  });
});

describe('forwardSequentialEdgeChanges', () => {
  const canonicalEdges: Edge[] = [
    { id: 'e-st', source: 's', target: 't' },
    { id: 'e-other', source: 'x', target: 'y' },
  ];
  const canonicalEdgeIds = new Set(canonicalEdges.map((edge) => edge.id));

  it('drops connector and preview edge adds', () => {
    const changes: EdgeChange<Edge>[] = [
      {
        type: 'add',
        item: { id: 'conn:1', source: 's', target: 't', type: SEQ_CONNECTOR_EDGE_TYPE },
      },
      { type: 'add', item: { id: PREVIEW_EDGE_ID, source: 's', target: PREVIEW_NODE_ID } },
    ];
    expect(forwardSequentialEdgeChanges(changes, canonicalEdgeIds, canonicalEdges)).toEqual([]);
  });

  it('forwards healed default edges and removes the shadowed canonical edge on insert', () => {
    const changes: EdgeChange<Edge>[] = [
      { type: 'add', item: { id: 'edge_s--new-', source: 's', target: 'new', type: 'default' } },
      { type: 'add', item: { id: 'edge_new--t-', source: 'new', target: 't', type: 'default' } },
    ];
    const out = forwardSequentialEdgeChanges(changes, canonicalEdgeIds, canonicalEdges);

    // Both healed edges forwarded.
    expect(out.filter((change) => change.type === 'add')).toHaveLength(2);
    // The canonical s->t edge is now shadowed and removed.
    expect(out).toContainEqual({ type: 'remove', id: 'e-st' });
    // The unrelated canonical edge is untouched.
    expect(out).not.toContainEqual({ type: 'remove', id: 'e-other' });
  });

  it('uses the exact split marker and preserves parallel canonical edges', () => {
    const parallelEdges: Edge[] = [
      { id: 'e-split', source: 's', sourceHandle: 'out', target: 't', targetHandle: 'in' },
      { id: 'e-parallel', source: 's', sourceHandle: 'out', target: 't', targetHandle: 'in' },
    ];
    const ids = new Set(parallelEdges.map((edge) => edge.id));
    const changes: EdgeChange<Edge>[] = [
      {
        type: 'add',
        item: {
          id: 'e-s-new',
          source: 's',
          sourceHandle: 'out',
          target: 'new',
          data: { __sequentialSplitEdgeId: 'e-split', keep: true },
        },
      },
      {
        type: 'add',
        item: {
          id: 'e-new-t',
          source: 'new',
          target: 't',
          targetHandle: 'in',
          data: { __sequentialSplitEdgeId: 'e-split' },
        },
      },
    ];

    const out = forwardSequentialEdgeChanges(changes, ids, parallelEdges);
    expect(out).toContainEqual({ type: 'remove', id: 'e-split' });
    expect(out).not.toContainEqual({ type: 'remove', id: 'e-parallel' });
    const added = out.filter((change) => change.type === 'add');
    expect(added[0]?.item.data).toEqual({ keep: true });
    expect(added[1]?.item.data).toEqual({});
  });

  it('forwards removes/selects of real canonical edges, drops others', () => {
    const changes: EdgeChange<Edge>[] = [
      { type: 'remove', id: 'e-st' },
      { type: 'remove', id: 'conn:1' },
      { type: 'select', id: 'e-other', selected: true },
      { type: 'select', id: 'conn:2', selected: true },
    ];
    const out = forwardSequentialEdgeChanges(changes, canonicalEdgeIds, canonicalEdges);
    expect(out).toEqual([
      { type: 'remove', id: 'e-st' },
      { type: 'select', id: 'e-other', selected: true },
    ]);
  });
});

describe('graphChangeSetToNodeChanges (move operations)', () => {
  it('produces a plain remove for an id that is only in removeNodeIds', () => {
    const changeSet: GraphChangeSet = {
      addNodes: [],
      addEdges: [],
      removeNodeIds: ['a'],
      removeEdgeIds: [],
    };
    expect(graphChangeSetToNodeChanges(changeSet)).toEqual([{ type: 'remove', id: 'a' }]);
  });

  it('produces a plain add for a genuinely new node (not also in removeNodeIds)', () => {
    const node = canonical('new');
    const changeSet: GraphChangeSet = {
      addNodes: [node],
      addEdges: [],
      removeNodeIds: [],
      removeEdgeIds: [],
    };
    expect(graphChangeSetToNodeChanges(changeSet)).toEqual([{ type: 'add', item: node }]);
  });

  it('rewrites a paired remove+add (same id, e.g. a cross-container parentId rewrite) into a single replace, preserving parentId', () => {
    const movedNode: Node = { ...canonical('a'), parentId: 'new-container' };
    const changeSet: GraphChangeSet = {
      addNodes: [movedNode],
      addEdges: [],
      removeNodeIds: ['a'],
      removeEdgeIds: [],
    };
    const changes = graphChangeSetToNodeChanges(changeSet);
    expect(changes).toEqual([{ type: 'replace', id: 'a', item: movedNode }]);
    // The parentId rewrite -- the whole point of the move -- survives.
    expect((changes[0] as { item: Node }).item.parentId).toBe('new-container');
  });

  it('produces no node changes for a same-container move (only edges change)', () => {
    const changeSet: GraphChangeSet = {
      addNodes: [],
      addEdges: [{ id: 'e1', source: 'a', target: 'b' }],
      removeNodeIds: [],
      removeEdgeIds: ['e0'],
    };
    expect(graphChangeSetToNodeChanges(changeSet)).toEqual([]);
  });
});

describe('graphChangeSetToEdgeChanges (move operations)', () => {
  it('translates removeEdgeIds and addEdges into remove/add EdgeChanges', () => {
    const edge: Edge = { id: 'e1', source: 'a', target: 'b' };
    const changeSet: GraphChangeSet = {
      addNodes: [],
      addEdges: [edge],
      removeNodeIds: [],
      removeEdgeIds: ['e0'],
    };
    expect(graphChangeSetToEdgeChanges(changeSet)).toEqual([
      { type: 'remove', id: 'e0' },
      { type: 'add', item: edge },
    ]);
  });

  it('returns an empty array for a no-op GraphChangeSet', () => {
    const changeSet: GraphChangeSet = {
      addNodes: [],
      addEdges: [],
      removeNodeIds: [],
      removeEdgeIds: [],
    };
    expect(graphChangeSetToEdgeChanges(changeSet)).toEqual([]);
  });
});
