import { render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { BaseNodeData } from './BaseNode.types';

const DEFAULT_MANIFEST = {
  display: { label: 'Test Node', shape: 'square', icon: 'test-icon' },
  handleConfiguration: [],
} as const;

// Hoisted mocks — available inside vi.mock factories
const { mockUpdateNode, mockHandleConfigs, mockManifest } = vi.hoisted(() => ({
  mockUpdateNode: vi.fn(),
  mockHandleConfigs: { current: undefined as HandleGroupManifest[] | undefined },
  mockManifest: {
    current: {
      display: { label: 'Test Node', shape: 'square', icon: 'test-icon' },
      handleConfiguration: [],
    } as Record<string, unknown>,
  },
}));

// xyflow is globally mocked in canvas-mocks.ts; extend with test-specific overrides.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  useStore: () => false,
  useUpdateNodeInternals: () => vi.fn(),
  useReactFlow: () => ({ updateNodeData: vi.fn(), updateNode: mockUpdateNode }),
}));

vi.mock('../../hooks', () => ({
  useNodeExecutionState: () => undefined,
  useElementValidationStatus: () => undefined,
}));

vi.mock('../../core', () => ({
  useNodeTypeRegistry: () => ({
    getManifest: () => mockManifest.current,
  }),
}));

vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: 'design' }),
}));
vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({ useConnectedHandles: () => new Set() }));
vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: false }),
}));
vi.mock('../BaseCanvas/CanvasThemeContext', () => ({
  useCanvasTheme: () => ({ isDarkMode: false }),
}));
vi.mock('../ButtonHandle/useButtonHandles', () => ({ useButtonHandles: () => null }));
vi.mock('../ButtonHandle/SmartHandle', () => ({
  SmartHandle: () => null,
  SmartHandleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./BaseNodeConfigContext', () => ({
  useBaseNodeOverrideConfig: () => ({ handleConfigurations: mockHandleConfigs.current }),
}));
vi.mock('../../utils/adornment-resolver', () => ({ resolveAdornments: () => ({}) }));
vi.mock('../../utils/toolbar-resolver', () => ({ resolveToolbar: () => undefined }));
vi.mock('@uipath/apollo-wind', () => ({
  Skeleton: (props: Record<string, unknown>) => <div {...props} />,
  cn: (...args: unknown[]) =>
    args
      .flat(Infinity)
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' '),
}));
vi.mock('@uipath/apollo-react/canvas/utils', () => ({
  cx: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));
vi.mock('../../utils/icon-registry', () => ({
  getIcon: () => () => <div data-testid="node-icon">Icon</div>,
}));
vi.mock('../../utils/manifest-resolver', () => ({
  resolveDisplay: (display: Record<string, unknown> | undefined) => ({
    label: 'Test Node',
    subLabel: 'Test SubLabel',
    shape: 'square',
    icon: 'test-icon',
    ...display,
  }),
  resolveHandles: () => [],
}));

vi.mock('./NodeLabel', () => ({
  NodeLabel: ({ label }: { label?: string }) => <div data-testid="node-label">{label}</div>,
}));

import { HandleGroupManifest } from '../../schema';
import { BaseNode } from './BaseNode';

const defaultProps: NodeProps<Node<BaseNodeData>> = {
  id: 'test-node',
  type: 'test',
  data: {},
  selected: false,
  dragging: false,
  draggable: true,
  zIndex: 0,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  selectable: true,
  deletable: true,
};

// Handle spacing: 2.5 grid units × 16px = 40px per handle
const makeHandles = (position: Position, count: number): HandleGroupManifest[] => [
  {
    position,
    handles: Array.from({ length: count }, (_, i) => ({
      id: `h${i}`,
      type: 'target',
      handleType: 'input',
    })),
  },
];

describe('BaseNode', () => {
  afterEach(() => {
    mockUpdateNode.mockClear();
    mockHandleConfigs.current = undefined;
    mockManifest.current = { ...DEFAULT_MANIFEST };
  });

  describe('Height computation', () => {
    // Override the rAF mock from canvas-mocks to run synchronously
    // so updateNode calls complete during the effect flush within act/render.
    const savedRAF = window.requestAnimationFrame;
    beforeEach(() => {
      window.requestAnimationFrame = (cb) => {
        cb(performance.now());
        return 0;
      };
    });
    afterEach(() => {
      window.requestAnimationFrame = savedRAF;
    });

    it('expands height when handles exceed base height', () => {
      // 4 handles × 40px = 160px > 96px default
      mockHandleConfigs.current = makeHandles(Position.Left, 4);
      render(<BaseNode {...defaultProps} height={96} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 160 });
    });

    it('does not expand when handles fit within base height', () => {
      // 2 handles × 40px = 80px < 96px default
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      render(<BaseNode {...defaultProps} height={96} />);
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });

    it('respects user-provided height as the base', () => {
      // height=200, 2 handles need 80px < 200 → no expansion
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      render(<BaseNode {...defaultProps} height={200} />);
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });

    it('shrinks back to default when handles are removed', () => {
      // Start with 4 handles (160px needed)
      mockHandleConfigs.current = makeHandles(Position.Left, 4);
      const { rerender } = render(<BaseNode {...defaultProps} height={96} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 160 });

      // Simulate React Flow updating height to match our sync
      // Note: new data={{}} ref on each rerender to break through React.memo
      mockUpdateNode.mockClear();
      rerender(<BaseNode {...defaultProps} height={160} data={{}} />);
      expect(mockUpdateNode).not.toHaveBeenCalled();

      // Remove handles — should shrink back to DEFAULT_NODE_SIZE (96)
      mockHandleConfigs.current = [];
      mockUpdateNode.mockClear();
      rerender(<BaseNode {...defaultProps} height={160} data={{}} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 96 });
    });

    it('shrinks back to user-provided height after handle removal', () => {
      // User height=200, 8 handles need 288px
      mockHandleConfigs.current = makeHandles(Position.Left, 8);
      const { rerender } = render(<BaseNode {...defaultProps} height={200} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 288 });

      // Simulate React Flow updating height
      mockUpdateNode.mockClear();
      rerender(<BaseNode {...defaultProps} height={288} data={{}} />);

      // Remove handles — should return to 200, not DEFAULT_NODE_SIZE (96)
      mockHandleConfigs.current = [];
      mockUpdateNode.mockClear();
      rerender(<BaseNode {...defaultProps} height={288} data={{}} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 200 });
    });

    it('uses max of left and right handle counts', () => {
      // 2 left, 4 right → uses 4 → 160px
      mockHandleConfigs.current = [
        ...makeHandles(Position.Left, 2),
        ...makeHandles(Position.Right, 4),
      ];
      render(<BaseNode {...defaultProps} height={96} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 160 });
    });
  });

  describe('Loading state', () => {
    it.each([
      { loading: true, expectSkeleton: true },
      { loading: false, expectSkeleton: false },
      { loading: undefined, expectSkeleton: false },
    ])('renders skeleton=$expectSkeleton when loading=$loading', ({ loading, expectSkeleton }) => {
      const data = loading !== undefined ? { loading } : {};
      render(<BaseNode {...defaultProps} data={data} />);

      if (expectSkeleton) {
        expect(screen.getByTestId('skeleton-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('node-icon')).not.toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('skeleton-icon')).not.toBeInTheDocument();
        expect(screen.getByTestId('node-icon')).toBeInTheDocument();
      }
    });

    it('still renders label when loading', () => {
      render(<BaseNode {...defaultProps} data={{ loading: true }} />);

      expect(screen.getByTestId('skeleton-icon')).toBeInTheDocument();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });
  });

  describe('Stacked treatment', () => {
    it('sets data-stacked when manifest.drillable is true', () => {
      mockManifest.current = { ...DEFAULT_MANIFEST, drillable: true };
      render(<BaseNode {...defaultProps} />);
      expect(screen.getByTestId('base-container')).toHaveAttribute('data-stacked', 'true');
    });

    it('sets data-stacked when data.isCollapsed is true', () => {
      render(<BaseNode {...defaultProps} data={{ isCollapsed: true }} />);
      expect(screen.getByTestId('base-container')).toHaveAttribute('data-stacked', 'true');
    });

    it('omits data-stacked when neither drillable nor collapsed', () => {
      render(<BaseNode {...defaultProps} />);
      expect(screen.getByTestId('base-container')).not.toHaveAttribute('data-stacked');
    });
  });
});
