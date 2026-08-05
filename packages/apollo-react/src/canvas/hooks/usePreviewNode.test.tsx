import { act, renderHook } from '@testing-library/react';
import {
  type Edge,
  type Node,
  ReactFlowProvider,
  useStoreApi,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../constants';
import { NodeRegistryProvider } from '../core';
import type { NodeManifest } from '../schema/node-definition';
import { usePreviewNode } from './usePreviewNode';

// These tests assert how the hook subscribes to the React Flow store, so they need the
// real store instead of the stubbed one from the global canvas test mocks.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/apollo-react/canvas/xyflow/react')),
}));

const existingManifest = {
  nodeType: 'existing',
  display: { label: 'Existing', icon: 'agent', shape: 'rectangle' },
  handleConfiguration: [
    {
      position: 'right',
      boundary: 'outer',
      handles: [{ id: 'output', type: 'source', handleType: 'output' }],
    },
  ],
} as NodeManifest;

const otherManifest = {
  nodeType: 'other',
  display: { label: 'Other', icon: 'tool', shape: 'rectangle' },
  handleConfiguration: [
    {
      position: 'right',
      boundary: 'outer',
      handles: [{ id: 'output', type: 'source', handleType: 'output' }],
    },
  ],
} as NodeManifest;

// Hoisted so the provider's registry keeps a stable identity across renders — an inline
// array would rebuild the registry and invalidate the memo the identity tests assert on.
const registrations = [existingManifest, otherManifest];

const existingNode: Node = {
  id: 'existing-node',
  type: 'existing',
  position: { x: 0, y: 0 },
  data: {},
};

const previewNode: Node = {
  id: PREVIEW_NODE_ID,
  type: 'preview',
  position: { x: 100, y: 100 },
  selected: true,
  data: {},
};

const previewEdge: Edge = {
  id: PREVIEW_EDGE_ID,
  source: existingNode.id,
  sourceHandle: 'output',
  target: PREVIEW_NODE_ID,
  targetHandle: 'input',
};

const Wrapper = ({ children }: { children: ReactNode }) => (
  <ReactFlowProvider>
    <NodeRegistryProvider registrations={registrations}>{children}</NodeRegistryProvider>
  </ReactFlowProvider>
);

/** Renders the hook alongside the store api so tests can drive store updates directly. */
function renderPreviewNodeHook({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const result = renderHook(
    () => ({
      preview: usePreviewNode(),
      store: useStoreApi(),
    }),
    { wrapper: Wrapper }
  );

  act(() => {
    result.result.current.store.getState().setNodes(nodes);
    result.result.current.store.getState().setEdges(edges);
  });

  return result;
}

describe('usePreviewNode', () => {
  it('returns connection info for the selected preview node', () => {
    const { result } = renderPreviewNodeHook({
      nodes: [existingNode, previewNode],
      edges: [previewEdge],
    });

    expect(result.current.preview.previewNode?.id).toBe(PREVIEW_NODE_ID);
    expect(result.current.preview.previewNodeConnectionInfo).toEqual([
      {
        addNewNodeAsSource: false,
        existingNodeId: existingNode.id,
        existingHandleId: 'output',
        existingNodeManifest: expect.objectContaining({ nodeType: 'existing' }),
        existingHandleManifest: expect.objectContaining({ id: 'output' }),
        previewEdgeId: PREVIEW_EDGE_ID,
      },
    ]);
  });

  it('returns null when no preview node is selected', () => {
    const { result } = renderPreviewNodeHook({
      nodes: [existingNode, { ...previewNode, selected: false }],
      edges: [previewEdge],
    });

    expect(result.current.preview.previewNode).toBeNull();
    expect(result.current.preview.previewNodeConnectionInfo).toBeNull();
  });

  it('keeps the same connection info reference across unrelated store updates', () => {
    const { result } = renderPreviewNodeHook({
      nodes: [existingNode, previewNode],
      edges: [previewEdge],
    });

    const initial = result.current.preview.previewNodeConnectionInfo;
    expect(initial).toHaveLength(1);

    // Viewport change: touches the store but not the preview connections.
    act(() => {
      result.current.store.setState({ transform: [10, 20, 1.5] });
    });
    expect(result.current.preview.previewNodeConnectionInfo).toBe(initial);

    // Preview node drag: replaces the nodes array and the preview node object.
    act(() => {
      result.current.store
        .getState()
        .setNodes([existingNode, { ...previewNode, position: { x: 400, y: 500 } }]);
    });
    expect(result.current.preview.previewNodeConnectionInfo).toBe(initial);

    // Unrelated edge added: the preview connections are unchanged.
    act(() => {
      result.current.store
        .getState()
        .setEdges([previewEdge, { id: 'other', source: 'a', target: 'b' }]);
    });
    expect(result.current.preview.previewNodeConnectionInfo).toBe(initial);

    // Equivalent edges: new edge objects, identical connection topology. Holds because
    // the signature compares by value rather than by reference.
    act(() => {
      result.current.store.getState().setEdges([{ ...previewEdge }]);
    });
    expect(result.current.preview.previewNodeConnectionInfo).toBe(initial);
  });

  it('ignores a handle change that resolves to the same effective handle', () => {
    // An omitted source handle resolves to 'output', the same value an explicit
    // 'output' resolves to, so the connection info is unchanged either way.
    const { result } = renderPreviewNodeHook({
      nodes: [existingNode, previewNode],
      edges: [{ ...previewEdge, sourceHandle: null }],
    });

    const initial = result.current.preview.previewNodeConnectionInfo;
    expect(initial?.[0]?.existingHandleId).toBe('output');

    act(() => {
      result.current.store.getState().setEdges([{ ...previewEdge, sourceHandle: 'output' }]);
    });

    expect(result.current.preview.previewNodeConnectionInfo).toBe(initial);
  });

  it('recomputes when the connected node changes type', () => {
    // Both manifests are looked up from the node type, so a type change has to invalidate
    // even though every edge field stayed the same.
    const { result } = renderPreviewNodeHook({
      nodes: [existingNode, previewNode],
      edges: [previewEdge],
    });

    const initial = result.current.preview.previewNodeConnectionInfo;
    expect(initial?.[0]?.existingNodeManifest?.nodeType).toBe('existing');

    act(() => {
      result.current.store.getState().setNodes([{ ...existingNode, type: 'other' }, previewNode]);
    });

    expect(result.current.preview.previewNodeConnectionInfo).not.toBe(initial);
    expect(
      result.current.preview.previewNodeConnectionInfo?.[0]?.existingNodeManifest?.nodeType
    ).toBe('other');
  });

  it('recomputes connection info when the preview connections change', () => {
    const { result } = renderPreviewNodeHook({
      nodes: [existingNode, previewNode],
      edges: [previewEdge],
    });

    const initial = result.current.preview.previewNodeConnectionInfo;

    act(() => {
      result.current.store
        .getState()
        .setEdges([{ ...previewEdge, source: PREVIEW_NODE_ID, target: existingNode.id }]);
    });

    expect(result.current.preview.previewNodeConnectionInfo).not.toBe(initial);
    expect(result.current.preview.previewNodeConnectionInfo).toEqual([
      expect.objectContaining({
        addNewNodeAsSource: true,
        existingNodeId: existingNode.id,
        existingHandleId: 'input',
      }),
    ]);
  });
});
