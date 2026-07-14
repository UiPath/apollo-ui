import { fireEvent, render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { BaseNodeData } from './BaseNode.types';

const DEFAULT_MANIFEST = {
  display: { label: 'Test Node', shape: 'square', icon: 'test-icon' },
  handleConfiguration: [],
} as const;

// Hoisted mocks — available inside vi.mock factories
const {
  mockUpdateNode,
  mockGetNode,
  mockNodeState,
  mockHandleConfigs,
  mockManifest,
  mockUseButtonHandles,
  mockOverrideConfig,
  mockMode,
  mockMultipleNodesSelected,
  mockIsConnecting,
  mockNodeToolbar,
} = vi.hoisted(() => ({
  mockUpdateNode: vi.fn(),
  mockGetNode: vi.fn(),
  // Simulates React Flow's stored node: updateNode writes height here, getNode reads it.
  mockNodeState: { current: { height: undefined as number | undefined } },
  mockHandleConfigs: { current: undefined as HandleGroupManifest[] | undefined },
  mockManifest: {
    current: {
      display: { label: 'Test Node', shape: 'square', icon: 'test-icon' },
      handleConfiguration: [],
    } as Record<string, unknown>,
  },
  // biome-ignore lint/suspicious/noExplicitAny: hook receives a broad typed options object
  mockUseButtonHandles: vi.fn() as any,
  mockOverrideConfig: { current: {} as Record<string, unknown> },
  mockMode: { current: 'design' as string },
  mockMultipleNodesSelected: { current: false },
  mockIsConnecting: { current: false },
  // biome-ignore lint/suspicious/noExplicitAny: captures the toolbar props for assertions
  mockNodeToolbar: vi.fn() as any,
}));

// getNode reflects whatever updateNode last wrote, so the height-sync effect converges
// exactly as it does against React Flow's real store.
mockGetNode.mockImplementation(() => mockNodeState.current);
mockUpdateNode.mockImplementation((_id: string, patch: { height?: number }) => {
  if (patch?.height !== undefined) {
    mockNodeState.current = { ...mockNodeState.current, height: patch.height };
  }
});

// xyflow is globally mocked in canvas-mocks.ts; extend with test-specific overrides.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  useStore: () => mockIsConnecting.current,
  useUpdateNodeInternals: () => vi.fn(),
  useReactFlow: () => ({
    updateNodeData: vi.fn(),
    updateNode: mockUpdateNode,
    getNode: mockGetNode,
  }),
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
  useBaseCanvasMode: () => ({ mode: mockMode.current }),
}));
vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({ useConnectedHandles: () => new Set() }));
vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: mockMultipleNodesSelected.current }),
}));
vi.mock('../Toolbar', () => ({
  NodeToolbar: (props: Record<string, unknown>) => {
    mockNodeToolbar(props);
    return null;
  },
}));
vi.mock('../BaseCanvas/CanvasThemeContext', () => ({
  useCanvasTheme: () => ({ isDarkMode: false }),
}));
vi.mock('../ButtonHandle/useButtonHandles', () => ({
  useButtonHandles: (opts: unknown) => {
    mockUseButtonHandles(opts);
    return null;
  },
}));
vi.mock('../ButtonHandle/SmartHandle', () => ({
  SmartHandle: () => null,
  SmartHandleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./BaseNodeConfigContext', () => ({
  useBaseNodeOverrideConfig: () => ({
    handleConfigurations: mockHandleConfigs.current,
    ...mockOverrideConfig.current,
  }),
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
  CanvasIcon: ({ icon }: { icon: string }) => <span data-testid={`canvas-icon-${icon}`} />,
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

import type { HandleGroupManifest } from '../../schema';
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
    mockGetNode.mockClear();
    mockNodeState.current = { height: undefined };
    mockUseButtonHandles.mockClear();
    mockNodeToolbar.mockClear();
    mockHandleConfigs.current = undefined;
    mockManifest.current = { ...DEFAULT_MANIFEST };
    mockOverrideConfig.current = {};
    mockMode.current = 'design';
    mockMultipleNodesSelected.current = false;
    mockIsConnecting.current = false;
  });

  // The handle count sets `--node-h` (the node height), which is also written to
  // React Flow's node.height so measured height, edges, and handle spacing agree.
  // It is a pure function of handles/footer (never reads the measured height), so the
  // write-back is idempotent and converges (no flicker loop).
  // Height = max(96 default | footer height, (maxHandlesPerSide * 2 + 2) * 16).
  describe('Height computation (floor + node.height sync)', () => {
    // Read the `--node-h` CSS var off the outer wrapper (parent of base-container).
    const floorVar = () =>
      screen.getByTestId('base-container').parentElement?.style.getPropertyValue('--node-h');

    it('sets the floor to the 96px default when handles fit within it', () => {
      // 2 handles → (2*2+2)*16 = 96 == default
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      render(<BaseNode {...defaultProps} />);
      expect(floorVar()).toBe('96px');
    });

    it('expands the floor to fit the handle count', () => {
      // 4 handles → (4*2+2)*16 = 160 > 96 default
      mockHandleConfigs.current = makeHandles(Position.Left, 4);
      render(<BaseNode {...defaultProps} />);
      expect(floorVar()).toBe('160px');
    });

    it('uses max of left and right handle counts', () => {
      // 2 left, 4 right → uses 4 → 160px
      mockHandleConfigs.current = [
        ...makeHandles(Position.Left, 2),
        ...makeHandles(Position.Right, 4),
      ];
      render(<BaseNode {...defaultProps} />);
      expect(floorVar()).toBe('160px');
    });

    it('derives height from handles/footer, not the incoming height prop', () => {
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      const { rerender } = render(<BaseNode {...defaultProps} height={500} />);
      expect(floorVar()).toBe('96px');
      rerender(<BaseNode {...defaultProps} height={12} data={{}} />);
      expect(floorVar()).toBe('96px');
    });

    it('writes the floor to node.height and converges without repeat writes', () => {
      // 3 handles → 128px floor, written once to node.height.
      mockHandleConfigs.current = makeHandles(Position.Left, 3);
      const { rerender } = render(<BaseNode {...defaultProps} />);
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 128 });
      expect(mockUpdateNode).toHaveBeenCalledTimes(1);

      // Re-render with the handle set unchanged: node.height already equals the floor,
      // so the guard skips the write — no oscillation.
      mockUpdateNode.mockClear();
      rerender(<BaseNode {...defaultProps} data={{}} />);
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });

    it('does not write when node.height already equals the floor', () => {
      // Persisted node already at the correct height → no redundant write on mount.
      mockNodeState.current = { height: 96 };
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      render(<BaseNode {...defaultProps} />);
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });

    it('deflates the floor and settles when a handle is removed (MST-11677)', () => {
      mockHandleConfigs.current = makeHandles(Position.Left, 3);
      const { rerender } = render(<BaseNode {...defaultProps} />);
      expect(floorVar()).toBe('128px');
      expect(mockUpdateNode).toHaveBeenLastCalledWith('test-node', { height: 128 });

      // Remove a handle → floor drops to 96, written once, then settles.
      mockUpdateNode.mockClear();
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      rerender(<BaseNode {...defaultProps} data={{}} />);
      expect(floorVar()).toBe('96px');
      expect(mockUpdateNode).toHaveBeenCalledWith('test-node', { height: 96 });

      mockUpdateNode.mockClear();
      rerender(<BaseNode {...defaultProps} data={{}} />);
      expect(floorVar()).toBe('96px');
      expect(mockUpdateNode).not.toHaveBeenCalledWith('test-node', { height: 128 });
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });

    it('uses the fixed footer height as the floor when it exceeds the handle floor', () => {
      mockOverrideConfig.current = { footerComponent: 'footer', footerVariant: 'single' };
      mockHandleConfigs.current = makeHandles(Position.Left, 2);
      render(<BaseNode {...defaultProps} />);
      expect(floorVar()).toBe('160px');
    });

    it('passes the computed height to handles, ignoring the measured height prop', () => {
      // 4 handles → computedHeight 160. A stale/small measured prop must be ignored so
      // handles are grid-aligned from the first render (no percentage→grid jump).
      mockHandleConfigs.current = makeHandles(Position.Left, 4);
      render(<BaseNode {...defaultProps} height={12} />);
      const opts = mockUseButtonHandles.mock.calls.at(-1)?.[0] as {
        nodeHeight?: number;
        nodeWidth?: number;
      };
      expect(opts.nodeHeight).toBe(160);
      expect(opts.nodeWidth).toBe(96); // getContainerWidth default for a square node
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

  // Initials badge fallback (Priority 3 in BaseNode's icon resolution): when
  // neither `iconComponent` nor `display.icon` is supplied, render the
  // shared InitialsBadge derived from `display.label` so missing icons look
  // consistent with the canvas ListView's same fallback.
  //
  // Note: the resolveDisplay mock above pre-fills `icon: 'test-icon'`, so
  // tests must explicitly pass an empty-string sentinel to model the
  // "no icon" path that resolveDisplay produces in reality (option-b
  // sentinel — see manifest-resolver.ts).
  describe('Initials badge fallback', () => {
    it('renders the initials badge when display.icon is the empty-string sentinel', () => {
      mockManifest.current = {
        ...DEFAULT_MANIFEST,
        display: { label: 'Microsoft Foundry', shape: 'square', icon: '' },
      };
      render(<BaseNode {...defaultProps} />);
      // The badge renders aria-hidden with the first character of the label.
      const badge = screen.getByText('M', { selector: '[aria-hidden="true"]' });
      expect(badge).toBeInTheDocument();
    });

    it('does not render the initials badge when display.icon is provided', () => {
      mockManifest.current = {
        ...DEFAULT_MANIFEST,
        display: { label: 'Microsoft Foundry', shape: 'square', icon: 'star' },
      };
      render(<BaseNode {...defaultProps} />);
      // No aria-hidden 'M' span — the registered icon takes the slot.
      expect(screen.queryByText('M', { selector: '[aria-hidden="true"]' })).not.toBeInTheDocument();
    });
  });

  // BaseNode forwards the consumer-facing `onHandleMouseEnter`/`onHandleMouseLeave`
  // from `BaseNodeOverrideConfigProvider` into `useButtonHandles` as
  // `handleMouseEnter`/`handleMouseLeave`. Trigger those by reaching into the
  // captured hook arguments and invoking them with a synthetic payload.
  describe('Handle hover handlers', () => {
    it('forwards onHandleMouseEnter/onHandleMouseLeave overrides and fires with the payload', () => {
      const onHandleMouseEnter = vi.fn();
      const onHandleMouseLeave = vi.fn();
      mockOverrideConfig.current = { onHandleMouseEnter, onHandleMouseLeave };

      render(<BaseNode {...defaultProps} />);

      expect(mockUseButtonHandles).toHaveBeenCalled();
      const opts = mockUseButtonHandles.mock.calls.at(-1)?.[0] as {
        handleMouseEnter?: (e: unknown) => void;
        handleMouseLeave?: (e: unknown) => void;
      };
      expect(opts.handleMouseEnter).toBe(onHandleMouseEnter);
      expect(opts.handleMouseLeave).toBe(onHandleMouseLeave);

      const payload = {
        handleId: 'output',
        nodeId: 'test-node',
        handleType: 'output',
        position: Position.Right,
      };
      opts.handleMouseEnter?.(payload);
      opts.handleMouseLeave?.(payload);

      expect(onHandleMouseEnter).toHaveBeenCalledWith(payload);
      expect(onHandleMouseLeave).toHaveBeenCalledWith(payload);
    });
  });

  describe('Action needed badge', () => {
    it('renders as an accessible clickable control and invokes onActionNeeded', () => {
      const onActionNeeded = vi.fn();
      mockOverrideConfig.current = {
        executionStatusOverride: 'ActionNeeded',
        onActionNeeded,
      };

      render(<BaseNode {...defaultProps} />);

      const actionBadge = screen.getByRole('button', { name: 'Action needed' });
      expect(actionBadge).toHaveClass('cursor-pointer');
      expect(actionBadge).toHaveClass('nodrag');
      expect(actionBadge).toHaveClass('focus-visible:outline-2');

      fireEvent.click(actionBadge);

      expect(onActionNeeded).toHaveBeenCalledWith('test-node');
    });
  });

  describe('Toolbar offset', () => {
    type Handle = HandleGroupManifest['handles'][number];

    const TOP_TOOLBAR = {
      actions: [{ id: 'edit', icon: 'edit', label: 'Edit', onAction: vi.fn() }],
      position: 'top',
    };

    const buttonHandle: Handle = {
      id: 'src',
      type: 'source',
      handleType: 'output',
      showButton: true,
    };
    const labelHandle: Handle = {
      id: 'art',
      type: 'source',
      handleType: 'artifact',
      label: 'Memory',
      showButton: false,
    };
    const labelHandleButtonOmitted: Handle = {
      id: 'art',
      type: 'source',
      handleType: 'artifact',
      label: 'Memory',
      showButton: false,
    };
    const buttonAndLabelHandle: Handle = {
      id: 'src-labeled',
      type: 'source',
      handleType: 'output',
      label: 'Output',
      showButton: true,
    };

    const topHandles = (...handles: Handle[]): HandleGroupManifest[] => [
      { position: Position.Top, handles },
    ];

    const renderNode = (overrides: Partial<NodeProps<Node<BaseNodeData>>> = {}) => {
      mockOverrideConfig.current = { toolbarConfig: TOP_TOOLBAR };
      return render(<BaseNode {...defaultProps} {...overrides} />);
    };

    // The latest `offsetToolbar` value handed to NodeToolbar.
    const offset = () => mockNodeToolbar.mock.calls.at(-1)?.[0]?.offsetToolbar;

    it('does not offset when no handle is configured at the toolbar side', () => {
      mockHandleConfigs.current = [];
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it('does not offset when the handle is on a different side than the toolbar', () => {
      mockHandleConfigs.current = [{ position: Position.Bottom, handles: [buttonHandle] }];
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it("offsets for 'button' when a selected node shows a source add button", () => {
      mockHandleConfigs.current = topHandles(buttonHandle);
      renderNode({ selected: true });
      expect(offset()).toBe('button');
    });

    it('does not offset for a button in readonly mode (button is not rendered)', () => {
      mockMode.current = 'readonly';
      mockHandleConfigs.current = topHandles(buttonHandle);
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it("offsets for 'label' when a labeled handle has no visible button", () => {
      mockHandleConfigs.current = topHandles(labelHandle);
      renderNode({ selected: true });
      expect(offset()).toBe('label');
    });

    it("offsets for 'label' when a labeled handle has omitted button in smart handles mode", () => {
      mockHandleConfigs.current = topHandles(labelHandleButtonOmitted);
      renderNode({ selected: true, data: { useSmartHandles: true } });
      expect(offset()).toBe('label');
    });

    it("offsets for 'label' on a labeled handle even in readonly mode", () => {
      mockMode.current = 'readonly';
      mockHandleConfigs.current = topHandles(labelHandle);
      renderNode({ selected: true });
      expect(offset()).toBe('label');
    });

    it("prefers 'button' over 'label' when both are shown", () => {
      mockHandleConfigs.current = topHandles(buttonAndLabelHandle);
      renderNode({ selected: true });
      expect(offset()).toBe('button');
    });

    it("falls back to 'label' when the button is hidden but the label shows", () => {
      mockMode.current = 'readonly';
      mockHandleConfigs.current = topHandles(buttonAndLabelHandle);
      renderNode({ selected: true });
      expect(offset()).toBe('label');
    });

    it('does not offset while multiple nodes are selected', () => {
      mockMultipleNodesSelected.current = true;
      mockHandleConfigs.current = topHandles(labelHandle);
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it('ignores a handle group that is not visible', () => {
      mockHandleConfigs.current = [
        { position: Position.Top, visible: false, handles: [labelHandle] },
      ];
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it('ignores an individually hidden handle', () => {
      mockHandleConfigs.current = topHandles({ ...labelHandle, visible: false });
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it('offsets a ButtonHandle add button on hover alone (not selected)', () => {
      mockHandleConfigs.current = topHandles(buttonHandle);
      const { container } = renderNode({ selected: false });
      expect(offset()).toBe(false);
      fireEvent.mouseEnter(container.firstChild as Element);
      expect(offset()).toBe('button');
    });

    it('requires selection — not just hover — for a SmartHandle add button', () => {
      mockHandleConfigs.current = topHandles(buttonHandle);
      const { container } = renderNode({ selected: false, data: { useSmartHandles: true } });
      fireEvent.mouseEnter(container.firstChild as Element);
      expect(offset()).toBe(false);
    });

    it('does not apply the button offset while a connection is in progress', () => {
      // ButtonHandle add buttons are hidden during connect; the offset must match.
      mockIsConnecting.current = true;
      mockHandleConfigs.current = topHandles(buttonHandle);
      renderNode({ selected: true });
      expect(offset()).toBe(false);
    });

    it('falls back to the label offset while connecting when the handle is labeled', () => {
      mockIsConnecting.current = true;
      mockHandleConfigs.current = topHandles(buttonAndLabelHandle);
      renderNode({ selected: true });
      expect(offset()).toBe('label');
    });

    it('honors a custom shouldShowAddButtonFn (parity with useButtonHandles)', () => {
      // AgentNode-style predicate shows the add button whenever selected — even in
      // readonly, where the default predicate would not. The offset must follow it.
      mockMode.current = 'readonly';
      mockOverrideConfig.current = {
        toolbarConfig: TOP_TOOLBAR,
        shouldShowAddButtonFn: (o: { showAddButton: boolean; selected: boolean }) =>
          o.showAddButton || o.selected,
      };
      mockHandleConfigs.current = topHandles(buttonHandle);
      render(<BaseNode {...defaultProps} selected={true} />);
      expect(offset()).toBe('button');
    });
  });
});
