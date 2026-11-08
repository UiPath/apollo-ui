import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../core';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { sequentialWireframeManifests } from '../../storybook-utils/sequential/wireframeManifests';
import type { SequenceStep } from '../../utils/sequential/sequential.types';
import { type SequenceIntent, SequenceTreeCanvas } from './SequenceTreeCanvas';

const { capturedFlowProps, mockReactFlowInstance } = vi.hoisted(() => ({
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  capturedFlowProps: { current: undefined as any },
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
}));

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
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  EdgeLabelRenderer: ({ children }: any) => <div data-testid="edge-label-renderer">{children}</div>,
  useReactFlow: () => mockReactFlowInstance,
}));

const manifest = {
  ...defaultWorkflowManifest,
  nodes: [...defaultWorkflowManifest.nodes, ...sequentialWireframeManifests],
};
const leaf = (id: string): SequenceStep => ({ id, type: 'uipath.script', label: id });

/** Main: A, If (Then: T, Else: empty), B. */
const tree: SequenceStep = {
  id: 'main',
  type: 'uipath.script',
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
        leaf('b'),
      ],
    },
  ],
};

let intents: SequenceIntent[];

function renderTree(props: { selectedIds?: string[]; collapsedIds?: string[] } = {}) {
  return render(
    <NodeRegistryProvider manifest={manifest}>
      <SequenceTreeCanvas
        root={tree}
        mode="design"
        onIntent={(intent) => intents.push(intent)}
        {...props}
      />
    </NodeRegistryProvider>
  );
}

describe('SequenceTreeCanvas', () => {
  beforeEach(() => {
    intents = [];
    capturedFlowProps.current = undefined;
  });

  it('draws one bar per step of the tree, and nothing it was not given', () => {
    renderTree();
    const ids = (capturedFlowProps.current.nodes as { id: string }[]).map((node) => node.id);

    for (const id of ['a', 'if', 't', 'b']) expect(ids).toContain(id);
    expect(ids).not.toContain('main');
  });

  it('asks the host to insert where a plus button is, in its own slot terms', () => {
    renderTree();

    fireEvent.click(screen.getByRole('button', { name: 'Insert step after step 1' }));

    expect(intents).toEqual([
      { type: 'insert', at: { parentId: 'main', slot: 'Activities', after: 'a' } },
    ]);
  });

  it('reports a selection instead of keeping it', () => {
    renderTree({ selectedIds: ['b'] });

    act(() =>
      capturedFlowProps.current.onNodesChange([
        { type: 'select', id: 'b', selected: false },
        { type: 'select', id: 'a', selected: true },
      ])
    );

    expect(intents).toEqual([{ type: 'select', ids: ['a'] }]);
  });

  it('reports a rename from the bar', () => {
    renderTree();
    const a = (capturedFlowProps.current.nodes as { id: string }[]).find((node) => node.id === 'a');

    act(() =>
      capturedFlowProps.current.onNodesChange([
        { type: 'replace', id: 'a', item: { ...a, data: { display: { label: 'Renamed' } } } },
      ])
    );

    expect(intents).toEqual([{ type: 'rename', id: 'a', label: 'Renamed' }]);
  });

  it('reports a collapse from the gutter', () => {
    renderTree();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse step 2' }));

    expect(intents).toEqual([{ type: 'collapse', id: 'if', collapsed: true }]);
  });
});
