import type { Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockShowPreviewGraph } = vi.hoisted(() => ({ mockShowPreviewGraph: vi.fn() }));

vi.mock('../../utils/createPreviewGraph', () => ({
  showPreviewGraph: mockShowPreviewGraph,
}));

import { showCenteredContainerPreview } from './ContainerNodePreview';

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
