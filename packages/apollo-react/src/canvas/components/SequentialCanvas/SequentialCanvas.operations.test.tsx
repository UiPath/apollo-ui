import { act, fireEvent, render, screen } from '@testing-library/react';
import type {
  Edge,
  Node,
  OnEdgesChange,
  OnNodesChange,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { type ReactNode, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../core';
import { getToolbarActionStore } from '../../hooks/ToolbarActionContext';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { sequentialWireframeManifests } from '../../storybook-utils/sequential/wireframeManifests';
import { makeDiamondFixture } from '../../utils/sequential/fixtures';
import { SEQ_LANE_PLACEHOLDER_PREFIX } from '../../utils/sequential/graph-helpers';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';
import type { NodeMenuAction } from '../NodeContextMenu';
import { useSequentialInsert } from './edges/useSequentialInsert';
import { useSequentialMoveMenuItems } from './nodes/useSequentialMoveMenuItems';
import { SequentialCanvas } from './SequentialCanvas';
import type { SequentialOperation } from './SequentialCanvas.types';

/**
 * Coverage for `onSequentialOperation`, one case per user entry point. Uses the
 * same capturing `ReactFlow` stub as `SequentialCanvas.integration.test.tsx`, so
 * no node or edge component renders. Entry points that live inside those
 * components are driven through the same hooks they call, from probe children
 * rendered inside the canvas's providers:
 *
 *  - kebab move: `useSequentialMoveMenuItems` (what `SequentialStepNode` renders);
 *  - connector ⊕: `useSequentialInsert().startInsert` with a slot read off a
 *    derived connector edge (what `SequentialConnectorEdge` calls);
 *  - lane placeholder: the `onAdd` the derivation stamps on the placeholder row.
 *
 * `AddNodeManager` is replaced with a stub that captures its props, so a test
 * can play the panel committing a node by calling its `onBeforeNodeAdded`.
 */

const { capturedFlowProps, capturedAddNodeManagerProps, mockReactFlowInstance } = vi.hoisted(
  () => ({
    capturedFlowProps: {
      // biome-ignore lint/suspicious/noExplicitAny: holds whatever BaseCanvas passes ReactFlow
      current: undefined as any,
    },
    capturedAddNodeManagerProps: {
      // biome-ignore lint/suspicious/noExplicitAny: holds whatever SequentialCanvas passes AddNodeManager
      current: undefined as any,
    },
    mockReactFlowInstance: {
      fitView: vi.fn(),
      setViewport: vi.fn(),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      getNode: vi.fn(() => undefined),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      updateNodeData: vi.fn(),
      updateNode: vi.fn(),
    },
  })
);

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  ReactFlow: (props: any) => {
    capturedFlowProps.current = props;
    return <div data-testid="react-flow">{props.children}</div>;
  },
  Background: () => <div data-testid="background" />,
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  ViewportPortal: ({ children }: any) => <div data-testid="viewport-portal">{children}</div>,
  useReactFlow: () => mockReactFlowInstance,
}));

vi.mock('../AddNodePanel/AddNodeManager', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  AddNodeManager: (props: any) => {
    capturedAddNodeManagerProps.current = props;
    return null;
  },
}));

const testManifest = {
  ...defaultWorkflowManifest,
  nodes: [...defaultWorkflowManifest.nodes, ...sequentialWireframeManifests],
};

let operations: SequentialOperation[];
let callOrder: string[];
let hostNodesChange: ReturnType<typeof vi.fn>;
let kebabItems: NodeMenuAction[];
let startInsertProbe: ReturnType<typeof useSequentialInsert>['startInsert'] | undefined;

interface HarnessProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  children?: ReactNode;
}

function Harness({ initialNodes, initialEdges, children }: HarnessProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const onNodesChange: OnNodesChange = (changes) => {
    callOrder.push('onNodesChange');
    hostNodesChange(changes);
    setNodes((current) => applyNodeChanges(changes, current));
  };
  const onEdgesChange: OnEdgesChange = (changes) => {
    callOrder.push('onEdgesChange');
    setEdges((current) => applyEdgeChanges(changes, current));
  };
  return (
    <SequentialCanvas
      view="sequential"
      mode="design"
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onSequentialOperation={(op) => {
        callOrder.push(`op:${op.kind}`);
        operations.push(op);
      }}
    >
      {children}
    </SequentialCanvas>
  );
}

function renderCanvas(props: HarnessProps) {
  return render(
    <NodeRegistryProvider manifest={testManifest}>
      <Harness {...props} />
    </NodeRegistryProvider>
  );
}

function KebabProbe({ nodeId }: { nodeId: string }) {
  kebabItems = useSequentialMoveMenuItems(nodeId) as NodeMenuAction[];
  return null;
}

function InsertProbe() {
  startInsertProbe = useSequentialInsert().startInsert;
  return null;
}

function makeChainFixture(length: number, selectedId?: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Array.from({ length }, (_, index) => ({
    id: `step-${index}`,
    type: 'uipath.http-request',
    position: { x: 0, y: index * 100 },
    data: { display: { label: `Step ${index}` } },
    ...(`step-${index}` === selectedId ? { selected: true } : {}),
  }));
  const edges: Edge[] = nodes.slice(1).map((node, index) => ({
    id: `chain-${index}`,
    source: `step-${index}`,
    sourceHandle: 'output',
    target: node.id,
    targetHandle: 'input',
  }));
  return { nodes, edges };
}

/** Plays the Add Node panel committing a picked node through `onBeforeNodeAdded`. */
function commitPanelNode(): { newNode: Node; newEdges: Edge[] } {
  const previewNode: Node = {
    id: 'picked-node',
    type: 'uipath.http-request',
    position: { x: 0, y: 0 },
    data: { display: { label: 'Picked' } },
  };
  let result: { newNode: Node; newEdges: Edge[] } | undefined;
  act(() => {
    result = capturedAddNodeManagerProps.current.onBeforeNodeAdded(previewNode, []);
  });
  return result!;
}

beforeEach(() => {
  operations = [];
  callOrder = [];
  hostNodesChange = vi.fn();
  kebabItems = [];
  startInsertProbe = undefined;
  capturedFlowProps.current = undefined;
  capturedAddNodeManagerProps.current = undefined;
});

describe('SequentialCanvas onSequentialOperation: remove', () => {
  it('reports a toolbar delete with the cascaded change set, before onNodesChange', () => {
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges });

    act(() => {
      getToolbarActionStore().onToolbarAction?.({
        actionId: 'delete',
        nodeId: 'if',
        mode: 'design',
      });
    });

    expect(operations).toHaveLength(1);
    const op = operations[0]!;
    expect(op.kind).toBe('remove');
    if (op.kind !== 'remove') return;
    expect(op.nodeId).toBe('if');
    expect(op.changeSet.removeNodeIds).toEqual(expect.arrayContaining(['if', 'b', 'c']));
    expect(callOrder).toEqual(['op:remove', 'onNodesChange', 'onEdgesChange']);
  });

  it('reports a Delete-key removal of the selected step', () => {
    const { nodes, edges } = makeChainFixture(3, 'step-1');
    renderCanvas({ initialNodes: nodes, initialEdges: edges });

    fireEvent.keyDown(screen.getByTestId('react-flow'), { key: 'Delete' });

    expect(operations).toHaveLength(1);
    const op = operations[0]!;
    expect(op.kind).toBe('remove');
    if (op.kind !== 'remove') return;
    expect(op.nodeId).toBe('step-1');
    expect(op.changeSet.removeNodeIds).toEqual(['step-1']);
    expect(callOrder.indexOf('op:remove')).toBeLessThan(callOrder.indexOf('onNodesChange'));
  });
});

describe('SequentialCanvas onSequentialOperation: move', () => {
  it('reports a kebab move with its direction and resolved slot', () => {
    const { nodes, edges } = makeChainFixture(3);
    renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      children: <KebabProbe nodeId="step-1" />,
    });

    const moveUp = kebabItems.find((item) => item.id === 'move-up');
    expect(moveUp?.disabled).toBe(false);
    act(() => {
      moveUp?.onClick();
    });

    expect(operations).toHaveLength(1);
    const op = operations[0]!;
    expect(op.kind).toBe('move');
    if (op.kind !== 'move') return;
    expect(op.nodeId).toBe('step-1');
    expect(op.direction).toBe('up');
    expect(op.to.target?.nodeId).toBe('step-0');
    expect(op.changeSet.addEdges.length).toBeGreaterThan(0);
    expect(callOrder.indexOf('op:move')).toBeLessThan(callOrder.indexOf('onNodesChange'));
  });

  it('reports an Alt+Arrow move of the selected step', () => {
    const { nodes, edges } = makeChainFixture(3, 'step-1');
    renderCanvas({ initialNodes: nodes, initialEdges: edges });

    fireEvent.keyDown(screen.getByTestId('react-flow'), {
      key: 'ArrowDown',
      altKey: true,
    });

    expect(operations).toHaveLength(1);
    const op = operations[0]!;
    expect(op.kind).toBe('move');
    if (op.kind !== 'move') return;
    expect(op.nodeId).toBe('step-1');
    expect(op.direction).toBe('down');
    expect(op.to.source?.nodeId).toBe('step-2');
  });
});

describe('SequentialCanvas onSequentialOperation: insert', () => {
  it('reports a connector ⊕ insert with the slot passed to startInsert', () => {
    const { nodes, edges } = makeChainFixture(2);
    renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      children: <InsertProbe />,
    });

    const connector = (capturedFlowProps.current.edges as Edge[]).find(
      (edge) =>
        (edge.data as { slot?: InsertionSlot } | undefined)?.slot?.target?.nodeId === 'step-1'
    );
    const slot = (connector?.data as { slot: InsertionSlot } | undefined)?.slot;
    expect(slot).toBeDefined();

    act(() => {
      startInsertProbe?.({
        slot: slot!,
        source: 'step-0',
        target: 'step-1',
        sourcePosition: Position.Bottom,
        position: { x: 0, y: 50 },
        connectorEdgeId: connector!.id,
      });
    });
    const result = commitPanelNode();

    expect(operations).toHaveLength(1);
    const op = operations[0]!;
    expect(op.kind).toBe('insert');
    if (op.kind !== 'insert') return;
    expect(op.slot).toEqual(slot);
    expect(op.node).toBe(result.newNode);
    expect(op.node.id).not.toBe('picked-node');
    expect(op.edges).toBe(result.newEdges);
    // AddNodeManager receives exactly the pre-existing shape.
    expect(Object.keys(result).sort()).toEqual(['newEdges', 'newNode']);
  });

  it('reports an empty-lane placeholder insert with the lane slot', () => {
    const { nodes, edges } = makeDiamondFixture();
    // Empty the `false` lane so it renders a placeholder row.
    const withEmptyLane = {
      nodes: nodes.filter((node) => node.id !== 'c'),
      edges: edges.filter((edge) => edge.id !== 'if-c' && edge.id !== 'c-d'),
    };
    renderCanvas({
      initialNodes: withEmptyLane.nodes,
      initialEdges: withEmptyLane.edges,
    });

    const placeholder = (capturedFlowProps.current.nodes as Node[]).find(
      (node) => node.id === `${SEQ_LANE_PLACEHOLDER_PREFIX}if::false`
    );
    const data = placeholder?.data as { onAdd?: () => void; insertionSlotId?: string } | undefined;
    expect(data?.onAdd).toBeTypeOf('function');

    act(() => {
      data?.onAdd?.();
    });
    commitPanelNode();

    expect(operations).toHaveLength(1);
    const op = operations[0]!;
    expect(op.kind).toBe('insert');
    if (op.kind !== 'insert') return;
    expect(op.slot.id).toBe(data?.insertionSlotId);
    expect(op.slot.source).toEqual({ nodeId: 'if', handleId: 'false' });
    expect(op.slot.target).toBeUndefined();
  });

  it('does not report an insert when no slot is pending', () => {
    const { nodes, edges } = makeChainFixture(2);
    renderCanvas({ initialNodes: nodes, initialEdges: edges });

    commitPanelNode();

    expect(operations).toEqual([]);
  });
});
