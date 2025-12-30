import { render, screen } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  SmartHandle,
  SmartSourceHandle,
  SmartTargetHandle,
  SmartHandleProvider,
} from './SmartHandle';

// Mock @xyflow/react
const mockUseStore = vi.fn();
const mockUseNodeId = vi.fn();

vi.mock('@xyflow/react', () => ({
  Handle: ({ children, ...props }: any) => {
    // Filter out styled-component props that shouldn't be passed to DOM elements
    const domProps = Object.keys(props).reduce((acc: any, key) => {
      if (!key.startsWith('$')) {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    return (
      <div
        data-testid="smart-handle"
        data-position={domProps.position}
        data-type={domProps.type}
        data-id={domProps.id}
        {...domProps}
      >
        {children}
      </div>
    );
  },
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
  useStore: (selector: any) => mockUseStore(selector),
  useNodeId: () => mockUseNodeId(),
  useUpdateNodeInternals: () => vi.fn(),
}));

describe('SmartHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNodeId.mockReturnValue('test-node');
    // Default: no nodes, no edges
    mockUseStore.mockImplementation((selector: any) => {
      const state = { nodes: [], edges: [] };
      return selector(state);
    });
  });

  describe('Basic rendering', () => {
    it('renders a source handle with default position', () => {
      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-id', 'output');
      // Default position for source is Right
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('renders a target handle with default position', () => {
      render(<SmartHandle type="target" id="input" />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-id', 'input');
      // Default position for target is Left
      expect(handle).toHaveAttribute('data-position', Position.Left);
    });

    it('respects custom defaultPosition', () => {
      render(<SmartHandle type="source" id="output" defaultPosition={Position.Bottom} />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toHaveAttribute('data-position', Position.Bottom);
    });
  });

  describe('SmartSourceHandle convenience component', () => {
    it('renders as a source handle', () => {
      render(<SmartSourceHandle id="output" />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('accepts custom defaultPosition', () => {
      render(<SmartSourceHandle id="output" defaultPosition={Position.Top} />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toHaveAttribute('data-position', Position.Top);
    });
  });

  describe('SmartTargetHandle convenience component', () => {
    it('renders as a target handle', () => {
      render(<SmartTargetHandle id="input" />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', Position.Left);
    });

    it('accepts custom defaultPosition', () => {
      render(<SmartTargetHandle id="input" defaultPosition={Position.Bottom} />);

      const handle = screen.getByTestId('smart-handle');
      expect(handle).toHaveAttribute('data-position', Position.Bottom);
    });
  });

  describe('Smart positioning based on connected nodes', () => {
    it('positions source handle toward connected target node on the right', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 100, y: 100 }, measured: { width: 100, height: 50 } },
            {
              id: 'target-node',
              position: { x: 400, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'target-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Target node is to the right, so source handle should be on the right
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('positions source handle toward connected target node on the left (adjusts to top due to conflict resolution)', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 400, y: 100 }, measured: { width: 100, height: 50 } },
            {
              id: 'target-node',
              position: { x: 100, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'target-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Target node is to the left, but source handles can't use left (reserved for targets)
      // So it should adjust to top
      expect(handle).toHaveAttribute('data-position', Position.Top);
    });

    it('positions target handle toward connected source node', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 400, y: 100 }, measured: { width: 100, height: 50 } },
            {
              id: 'source-node',
              position: { x: 100, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'source-node',
              sourceHandle: 'output',
              target: 'test-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="target" id="input" />);

      const handle = screen.getByTestId('smart-handle');
      // Source node is to the left, so target handle should be on the left
      expect(handle).toHaveAttribute('data-position', Position.Left);
    });

    it('positions handle based on vertical relationship (bottom)', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 100, y: 100 }, measured: { width: 100, height: 50 } },
            {
              id: 'target-node',
              position: { x: 100, y: 300 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'target-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Target node is below, so source handle should be on the bottom
      expect(handle).toHaveAttribute('data-position', Position.Bottom);
    });

    it('positions handle based on vertical relationship (top)', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 100, y: 300 }, measured: { width: 100, height: 50 } },
            {
              id: 'source-node',
              position: { x: 100, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'source-node',
              sourceHandle: 'output',
              target: 'test-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="target" id="input" />);

      const handle = screen.getByTestId('smart-handle');
      // Source node is above, so target handle should be on the top
      expect(handle).toHaveAttribute('data-position', Position.Top);
    });
  });

  describe('Conflict resolution', () => {
    it('prevents source handles from using left side (reserved for targets)', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 400, y: 100 }, measured: { width: 100, height: 50 } },
            {
              id: 'target-node',
              position: { x: 100, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'target-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Target is to the left but source can't use left, should be top instead
      expect(handle).toHaveAttribute('data-position', Position.Top);
    });

    it('allows target handles to use right side when no source handles exist on the node', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 100, y: 100 }, measured: { width: 100, height: 50 } },
            {
              id: 'source-node',
              position: { x: 400, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [
            {
              id: 'e1',
              source: 'source-node',
              sourceHandle: 'output',
              target: 'test-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="target" id="input" />);

      const handle = screen.getByTestId('smart-handle');
      // Source is to the right and since there are no source handles on this node, target can use right
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });
  });

  describe('SmartHandleProvider context', () => {
    it('renders children without errors', () => {
      render(
        <SmartHandleProvider>
          <SmartHandle type="source" id="output" />
        </SmartHandleProvider>
      );

      expect(screen.getByTestId('smart-handle')).toBeInTheDocument();
    });

    it('supports nodeWidth and nodeHeight props', () => {
      render(
        <SmartHandleProvider nodeWidth={200} nodeHeight={100}>
          <SmartHandle type="source" id="output" />
        </SmartHandleProvider>
      );

      expect(screen.getByTestId('smart-handle')).toBeInTheDocument();
    });

    it('coordinates multiple handles on the same side', () => {
      render(
        <SmartHandleProvider nodeWidth={200} nodeHeight={100}>
          <SmartHandle type="source" id="out-1" nodeWidth={200} nodeHeight={100} />
          <SmartHandle type="source" id="out-2" nodeWidth={200} nodeHeight={100} />
        </SmartHandleProvider>
      );

      const handles = screen.getAllByTestId('smart-handle');
      expect(handles).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('handles missing nodeId gracefully', () => {
      mockUseNodeId.mockReturnValue(null);

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Should use default position when nodeId is null
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('handles node not found in store', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            {
              id: 'other-node',
              position: { x: 100, y: 100 },
              measured: { width: 100, height: 50 },
            },
          ],
          edges: [],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Should use default position when current node not found
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('handles no edges (unconnected)', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 100, y: 100 }, measured: { width: 100, height: 50 } },
          ],
          edges: [],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Should use default position when no edges
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('handles connected node not found', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 100, y: 100 }, measured: { width: 100, height: 50 } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'missing-node',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Should use default position when connected node not found
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });

    it('handles multiple connections (uses average position)', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          nodes: [
            { id: 'test-node', position: { x: 200, y: 200 }, measured: { width: 100, height: 50 } },
            { id: 'target-1', position: { x: 400, y: 100 }, measured: { width: 100, height: 50 } },
            { id: 'target-2', position: { x: 400, y: 300 }, measured: { width: 100, height: 50 } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'target-1',
              targetHandle: 'input',
            },
            {
              id: 'e2',
              source: 'test-node',
              sourceHandle: 'output',
              target: 'target-2',
              targetHandle: 'input',
            },
          ],
        };
        return selector(state);
      });

      render(<SmartHandle type="source" id="output" />);

      const handle = screen.getByTestId('smart-handle');
      // Both targets are to the right (average position is still right)
      expect(handle).toHaveAttribute('data-position', Position.Right);
    });
  });
});
