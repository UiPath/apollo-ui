import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { SEQ_HANDLE_LEFT_OFFSET } from '../../constants';
import { fireEvent, render, screen } from '../../utils/testing';
import type { SequentialConnectorData } from './edges/SequentialConnectorEdge.types';
import {
  buildBarGeometry,
  computeSequentialInsertItems,
  resolveInsertStepLabel,
  SequentialInsertLayer,
} from './SequentialInsertLayer';

// xyflow is mocked globally (test/canvas-mocks.ts); EdgeLabelRenderer renders its children inline.

const translate = ((descriptor: { message: string; values?: Record<string, unknown> }) =>
  descriptor.message.replace(/\{(\w+)\}/g, (_, key) =>
    String(descriptor.values?.[key])
  )) as Parameters<typeof resolveInsertStepLabel>[0];

const BAR = { width: 896, height: 56 };
const OFFSET = SEQ_HANDLE_LEFT_OFFSET;

function bar(id: string, x: number, y: number): Node {
  return { id, type: 'step', position: { x, y }, data: {}, width: BAR.width, height: BAR.height };
}

function edge(id: string, source: string, target: string, data: SequentialConnectorData): Edge {
  return {
    id,
    source,
    target,
    sourceHandle: 'seq-source',
    targetHandle: data.kind === 'branch-entry' ? 'seq-branch-target' : 'seq-target',
    data,
  };
}

const slot = { id: 'slot-1', graphEdgeId: 'g1' };

describe('buildBarGeometry', () => {
  it('reads absolute positions and declared sizes, falling back to the bar defaults', () => {
    const geometry = buildBarGeometry(
      [bar('a', 0, 0), { id: 'b', position: { x: 10, y: 20 }, data: {} }],
      BAR
    );

    expect(geometry.get('a')).toEqual({ x: 0, y: 0, width: 896, height: 56 });
    expect(geometry.get('b')).toEqual({ x: 10, y: 20, width: 896, height: 56 });
  });
});

describe('computeSequentialInsertItems', () => {
  const geometry = buildBarGeometry([bar('a', 0, 0), bar('b', 0, 120), bar('c', 64, 240)], BAR);

  it('centers a step connector between the source bottom handle and the target top handle', () => {
    const [item] = computeSequentialInsertItems(
      [
        edge('e1', 'a', 'b', {
          kind: 'step',
          slot,
          insertAnchor: { kind: 'after', stepNumber: 1 },
        }),
      ],
      geometry,
      { isDesignMode: true, translate }
    );

    expect(item?.button).toEqual({
      x: OFFSET,
      y: (56 + 120) / 2,
      label: 'Insert step after step 1',
    });
    expect(item?.insert).toMatchObject({
      slot,
      source: 'a',
      target: 'b',
      sourceHandleId: 'seq-source',
      targetHandleId: 'seq-target',
      sourcePosition: Position.Bottom,
      position: { x: OFFSET, y: (56 + 120) / 2 },
      connectorEdgeId: 'e1',
    });
  });

  it('puts a branch-entry button on the horizontal jog and a header above the lane head', () => {
    const [item] = computeSequentialInsertItems(
      [
        edge('e2', 'a', 'c', {
          kind: 'branch-entry',
          label: 'Then',
          slot,
          waypoints: [
            { x: OFFSET, y: 100 },
            { x: 64, y: 100 },
          ],
          insertAnchor: { kind: 'branch', stepNumber: 1, branchLabel: 'Then' },
        }),
      ],
      geometry,
      { isDesignMode: true, translate }
    );

    expect(item?.button).toEqual({
      x: (OFFSET + 64) / 2,
      y: 100,
      label: 'Insert step into Then of step 1',
    });
    expect(item?.header).toEqual({ x: 64, targetTopY: 240, label: 'Then', selected: false });
    // The preview drops at the midpoint of the handle points, mid-left entry included.
    expect(item?.insert?.position).toEqual({ x: (OFFSET + 64) / 2, y: (56 + 240 + 28) / 2 });
  });

  it('anchors a straight merge-back above its target and an elbowed one below its source', () => {
    const [straight, elbowed] = computeSequentialInsertItems(
      [
        edge('e3', 'a', 'b', { kind: 'merge-back', slot, waypoints: [] }),
        edge('e4', 'a', 'b', {
          kind: 'merge-back',
          slot,
          waypoints: [
            { x: 0, y: 80 },
            { x: 10, y: 80 },
          ],
        }),
      ],
      geometry,
      { isDesignMode: true, translate }
    );

    expect(straight?.button).toMatchObject({ x: OFFSET, y: 120 - 20 });
    expect(elbowed?.button).toMatchObject({ x: OFFSET, y: 56 + 20 });
  });

  it('renders no button outside design mode or without a slot, but keeps the header', () => {
    const edges = [
      edge('e5', 'a', 'b', { kind: 'step', slot }),
      edge('e6', 'a', 'c', { kind: 'branch-entry', label: 'Else', slot }),
      edge('e7', 'b', 'c', { kind: 'step' }),
    ];

    const viewItems = computeSequentialInsertItems(edges, geometry, {
      isDesignMode: false,
      translate,
    });
    expect(viewItems.map((item) => item.edgeId)).toEqual(['e6']);
    expect(viewItems[0]?.button).toBeUndefined();
    expect(viewItems[0]?.header?.label).toBe('Else');

    const designItems = computeSequentialInsertItems(edges, geometry, {
      isDesignMode: true,
      translate,
    });
    expect(designItems.map((item) => item.edgeId)).toEqual(['e5', 'e6']);
  });

  it('skips connectors whose endpoints are not laid out and edges without connector data', () => {
    const items = computeSequentialInsertItems(
      [edge('e8', 'a', 'missing', { kind: 'step', slot }), { id: 'p', source: 'a', target: 'b' }],
      geometry,
      { isDesignMode: true, translate }
    );

    expect(items).toEqual([]);
  });
});

describe('resolveInsertStepLabel', () => {
  it('names each anchor kind and falls back to the bare label', () => {
    expect(resolveInsertStepLabel(translate, { kind: 'after', stepNumber: 3 })).toBe(
      'Insert step after step 3'
    );
    expect(resolveInsertStepLabel(translate, { kind: 'before', stepNumber: 1 })).toBe(
      'Insert step before step 1'
    );
    expect(
      resolveInsertStepLabel(translate, { kind: 'branch', stepNumber: 2, branchLabel: 'Then' })
    ).toBe('Insert step into Then of step 2');
    expect(resolveInsertStepLabel(translate, undefined)).toBe('Insert step');
  });
});

describe('SequentialInsertLayer', () => {
  const nodes = [bar('a', 0, 0), bar('b', 0, 120), bar('c', 64, 240)];
  const edges = [
    edge('e1', 'a', 'b', { kind: 'step', slot, insertAnchor: { kind: 'after', stepNumber: 1 } }),
    edge('e2', 'a', 'c', {
      kind: 'branch-entry',
      label: 'Then',
      slot: { id: 'slot-2' },
      insertAnchor: { kind: 'branch', stepNumber: 1, branchLabel: 'Then' },
    }),
  ];

  it('renders every button and header through one portal and starts the clicked insert', () => {
    const startInsert = vi.fn();
    render(
      <SequentialInsertLayer
        edges={edges}
        nodes={nodes}
        barWidth={BAR.width}
        barHeight={BAR.height}
        isDesignMode
        startInsert={startInsert}
      />
    );

    expect(screen.getAllByTestId('edge-label-renderer')).toHaveLength(1);
    expect(screen.getByTestId('sequential-branch-header')).toHaveTextContent('Then');

    fireEvent.click(screen.getByRole('button', { name: 'Insert step into Then of step 1' }));

    expect(startInsert).toHaveBeenCalledTimes(1);
    expect(startInsert).toHaveBeenCalledWith(
      expect.objectContaining({ slot: { id: 'slot-2' }, connectorEdgeId: 'e2', source: 'a' })
    );
  });

  it('renders nothing when there is nothing to show', () => {
    const { container } = render(
      <SequentialInsertLayer
        edges={[edge('e3', 'a', 'b', { kind: 'step' })]}
        nodes={nodes}
        barWidth={BAR.width}
        barHeight={BAR.height}
        isDesignMode
        startInsert={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
