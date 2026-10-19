import type { Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockShowPreviewGraph, mockCreatePreviewGraph, mockApplyPreviewGraph } = vi.hoisted(() => ({
  mockShowPreviewGraph: vi.fn(),
  mockCreatePreviewGraph: vi.fn(),
  mockApplyPreviewGraph: vi.fn(),
}));

vi.mock('../../utils/createPreviewGraph', () => ({
  showPreviewGraph: mockShowPreviewGraph,
  createPreviewGraph: mockCreatePreviewGraph,
  applyPreviewGraphToReactFlow: mockApplyPreviewGraph,
}));

import { PREVIEW_NODE_ID } from '../../constants';
import { isUnconnectedPreviewNode } from '../../utils/createPreviewNode';
import {
  showCenteredContainerPreview,
  showUnconnectedContainerPreview,
} from './ContainerNodePreview';

const container: Node = {
  id: 'container',
  position: { x: 0, y: 0 },
  data: {},
  width: 560,
  height: 320,
};

const reactFlowInstance = {
  getNode: (id: string) => (id === container.id ? container : undefined),
  getNodes: () => [container],
} as unknown as ReactFlowInstance;

beforeEach(() => {
  mockShowPreviewGraph.mockClear();
  mockCreatePreviewGraph.mockReset();
  mockApplyPreviewGraph.mockClear();
});

describe('showUnconnectedContainerPreview', () => {
  it('applies a parented first-child preview with no edges, flagged as unconnected', () => {
    const previewNode: Node = {
      id: PREVIEW_NODE_ID,
      position: { x: 0, y: 0 },
      parentId: 'container',
      extent: 'parent',
      data: {},
    };
    mockCreatePreviewGraph.mockReturnValue({ node: previewNode, edges: [{ id: 'primary' }] });

    showUnconnectedContainerPreview({ containerId: 'container', reactFlowInstance });

    const options = mockCreatePreviewGraph.mock.calls[0]?.[0];
    expect(options.containerId).toBe('container');
    expect(options.positionMode).toBe('center');
    expect(options.target).toBeUndefined();
    expect(options.data.placement).toMatchObject({ containerId: 'container', mode: 'first-child' });
    expect(isUnconnectedPreviewNode({ data: options.data })).toBe(true);
    expect(mockApplyPreviewGraph).toHaveBeenCalledWith(
      { node: previewNode, edges: [] },
      reactFlowInstance
    );
  });

  it('does nothing when the container is missing', () => {
    showUnconnectedContainerPreview({ containerId: 'missing', reactFlowInstance });

    expect(mockCreatePreviewGraph).not.toHaveBeenCalled();
    expect(mockApplyPreviewGraph).not.toHaveBeenCalled();
  });
});

describe('showCenteredContainerPreview', () => {
  it('draws a return edge to the inner target handle when there is one', () => {
    showCenteredContainerPreview({
      containerId: 'container',
      reactFlowInstance,
      previewHandles: {
        sourceHandleId: 'start',
        sourceHandlePosition: Position.Right,
        targetHandleId: 'continue',
      },
    });

    expect(mockShowPreviewGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        source: { nodeId: 'container', handleId: 'start' },
        target: { nodeId: 'container', handleId: 'continue' },
      })
    );
  });

  it('wires only the entry edge for an entry-only container', () => {
    showCenteredContainerPreview({
      containerId: 'container',
      reactFlowInstance,
      previewHandles: { sourceHandleId: 'entry', sourceHandlePosition: Position.Right },
    });

    const options = mockShowPreviewGraph.mock.calls[0]?.[0];
    expect(options.source).toEqual({ nodeId: 'container', handleId: 'entry' });
    expect(options.target).toBeUndefined();
    expect(options.containerId).toBe('container');
  });
});
