import { fireEvent, render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BaseNodeData } from './BaseNode.types';

// Same hoisted-mock strategy as BaseNode.test.tsx: control the mocked modules
// through refs the tests mutate in each case.
const {
  mockUpdateNode,
  mockGetNode,
  mockNodeState,
  mockHandleConfigs,
  mockManifest,
  mockOverrideConfig,
  mockMode,
  mockNodeLabel,
  mockSelectionState,
} = vi.hoisted(() => ({
  mockUpdateNode: vi.fn(),
  mockGetNode: vi.fn(),
  mockNodeState: { current: { height: undefined as number | undefined } },
  mockHandleConfigs: { current: undefined as unknown },
  mockManifest: {
    current: {
      display: { label: 'HTTP Request', shape: 'rectangle', icon: 'globe' },
      handleConfiguration: [],
    } as Record<string, unknown>,
  },
  mockOverrideConfig: { current: {} as Record<string, unknown> },
  mockMode: { current: 'design' as string },
  // biome-ignore lint/suspicious/noExplicitAny: captures NodeLabel props for assertions
  mockNodeLabel: vi.fn() as any,
  mockSelectionState: { current: { multipleNodesSelected: false } },
}));

mockGetNode.mockImplementation(() => mockNodeState.current);
mockUpdateNode.mockImplementation((_id: string, patch: { height?: number }) => {
  if (patch?.height !== undefined) {
    mockNodeState.current = { ...mockNodeState.current, height: patch.height };
  }
});

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  // Stub Handle so the bar can render without a React Flow zustand provider.
  Handle: () => null,
  useStore: () => false,
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
  useNodeTypeRegistry: () => ({ getManifest: () => mockManifest.current }),
}));
vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: mockMode.current }),
}));
vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({ useConnectedHandles: () => new Set() }));
vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => mockSelectionState.current,
}));
vi.mock('../BaseCanvas/CanvasThemeContext', () => ({
  useCanvasTheme: () => ({ isDarkMode: false }),
}));
vi.mock('../Toolbar', () => ({ NodeToolbar: () => null }));
vi.mock('../ButtonHandle/useButtonHandles', () => ({ useButtonHandles: () => null }));
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
// A resolved trailing status indicator, so the ActionNeeded precedence is testable.
vi.mock('../../utils/adornment-resolver', () => ({
  resolveAdornments: () => ({ topRight: <span data-testid="status-indicator" /> }),
}));
vi.mock('../../utils/toolbar-resolver', () => ({ resolveToolbar: () => undefined }));
vi.mock('../../../i18n', () => ({
  useSafeLingui: () => ({
    _: (d: string | { message?: string; id: string }) =>
      typeof d === 'string' ? d : (d.message ?? d.id),
  }),
}));
vi.mock('@uipath/apollo-wind', () => ({
  Skeleton: (props: Record<string, unknown>) => <div {...props} />,
  Button: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  cn: (...args: unknown[]) =>
    args
      .flat(Infinity)
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' '),
}));
vi.mock('../../utils/icon-registry', () => ({
  getIcon: () => () => <div data-testid="node-icon">Icon</div>,
  CanvasIcon: ({ icon }: { icon: string }) => <span data-testid={`canvas-icon-${icon}`} />,
}));
vi.mock('../../utils/manifest-resolver', () => ({
  resolveDisplay: (display: Record<string, unknown> | undefined) => ({
    label: 'HTTP Request',
    subLabel: 'GET /orders',
    shape: 'rectangle',
    icon: 'globe',
    iconBackground: '#611f69',
    color: '#ffffff',
    ...display,
  }),
  resolveHandles: () => [],
}));
vi.mock('./NodeLabel', () => ({
  NodeLabel: (props: { label?: string }) => {
    mockNodeLabel(props);
    return <div data-testid="node-label">{props.label}</div>;
  },
}));
vi.mock('./BaseNodeInnerShape', () => ({
  BaseInnerShape: ({
    color,
    background,
    children,
  }: {
    color?: string;
    background?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="inner-shape" data-color={color} data-background={background}>
      {children}
    </div>
  ),
}));

import { SEQ_HANDLE_LEFT_OFFSET } from '../../constants';
import { BaseNode } from './BaseNode';
import { INVISIBLE_HANDLE_STYLE } from './BaseNodeBar';

const defaultProps: NodeProps<Node<BaseNodeData>> = {
  id: 'step-1',
  type: 'uipath.http',
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

describe('BaseNodeBar (sequential bar variant)', () => {
  afterEach(() => {
    mockUpdateNode.mockClear();
    mockNodeState.current = { height: undefined };
    mockHandleConfigs.current = undefined;
    mockOverrideConfig.current = {};
    mockMode.current = 'design';
    mockNodeLabel.mockClear();
    mockSelectionState.current = { multipleNodesSelected: false };
    mockManifest.current = {
      display: { label: 'HTTP Request', shape: 'rectangle', icon: 'globe' },
      handleConfiguration: [],
    };
  });

  // The core visual-drift contract: the same node resolves to the same display
  // (label / icon / color source) whether it renders as a card or a bar.
  describe('display parity with the card variant', () => {
    it('renders the identical resolved label and icon', () => {
      const { unmount } = render(<BaseNode {...defaultProps} renderVariant="card" />);
      const cardLabel = screen.getByTestId('node-label').textContent;
      expect(screen.getAllByTestId('node-icon').length).toBeGreaterThan(0);
      unmount();

      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      expect(screen.getByTestId('node-label').textContent).toBe(cardLabel);
      expect(screen.getAllByTestId('node-icon').length).toBeGreaterThan(0);
    });

    it('feeds the icon shape from the same color source', () => {
      const { unmount } = render(<BaseNode {...defaultProps} renderVariant="card" />);
      const cardShape = screen.getByTestId('inner-shape');
      const cardBg = cardShape.getAttribute('data-background');
      const cardColor = cardShape.getAttribute('data-color');
      unmount();

      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const barShape = screen.getByTestId('inner-shape');
      expect(barShape.getAttribute('data-background')).toBe(cardBg);
      expect(barShape.getAttribute('data-color')).toBe(cardColor);
      expect(cardBg).toBe('#611f69');
    });
  });

  describe('bar geometry', () => {
    it('renders at the fixed 896x56 bar size regardless of handle count', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.style.getPropertyValue('--node-w')).toBe('896px');
      expect(bar.style.getPropertyValue('--node-h')).toBe('56px');
    });

    it('writes the fixed bar height (56) back to node.height', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      expect(mockUpdateNode).toHaveBeenCalledWith('step-1', { height: 56 });
    });
  });

  it('paints the left accent strip from the resolved icon background', () => {
    render(<BaseNode {...defaultProps} renderVariant="bar" />);
    const accent = screen.getByTestId('sequential-bar-accent');
    // Rendered as an inset box-shadow so the stripe follows the bar's rounded
    // corners rather than a square-cornered strip.
    expect(accent.style.boxShadow).toContain('#611f69');
  });

  it('keeps inline rename enabled in design mode (readonly=false, onChange wired)', () => {
    render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
    const labelProps = mockNodeLabel.mock.calls.at(-1)?.[0];
    expect(labelProps.readonly).toBe(false);
    expect(typeof labelProps.onChange).toBe('function');
    expect(labelProps.shape).toBe('rectangle');
  });

  it('disables rename outside design mode', () => {
    mockMode.current = 'view';
    render(<BaseNode {...defaultProps} renderVariant="bar" />);
    expect(mockNodeLabel.mock.calls.at(-1)?.[0].readonly).toBe(true);
  });

  describe('trailing group', () => {
    it('renders the toolbar actions as a kebab when selected', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction: vi.fn() }],
        },
      };
      render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('fires the toolbar action with the node id when the item is selected', () => {
      const onAction = vi.fn();
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction }],
        },
      };
      render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
      fireEvent.click(screen.getByText('Delete'));
      expect(onAction).toHaveBeenCalledWith('step-1');
    });

    it('resolves a string toolbar icon through the icon registry instead of rendering it as literal text', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: 'trash', label: 'Delete', onAction: vi.fn() }],
        },
      };
      render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
      expect(screen.getByTestId('canvas-icon-trash')).toBeInTheDocument();
      expect(screen.queryByText('trash')).not.toBeInTheDocument();
    });

    it('still renders a custom React node icon as-is (no double resolution)', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [
            {
              id: 'delete',
              icon: <span data-testid="custom-icon" />,
              label: 'Delete',
              onAction: vi.fn(),
            },
          ],
        },
      };
      render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('hides the kebab when multiple nodes are selected, mirroring the card toolbar gating', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction: vi.fn() }],
        },
      };
      mockSelectionState.current = { multipleNodesSelected: true };
      render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });

    it('shows the status indicator when not action-needed', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
      expect(screen.queryByText('Action needed')).not.toBeInTheDocument();
    });

    it('gives the Action needed pill precedence over the status indicator', () => {
      const onActionNeeded = vi.fn();
      mockOverrideConfig.current = { executionStatusOverride: 'ActionNeeded', onActionNeeded };
      render(<BaseNode {...defaultProps} renderVariant="bar" />);

      expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
      const pill = screen.getByText('Action needed');
      fireEvent.click(pill);
      expect(onActionNeeded).toHaveBeenCalledWith('step-1');
    });
  });

  describe('extraMenuItems passthrough', () => {
    it('shows the kebab from extraMenuItems alone, with no toolbar configured', () => {
      render(
        <BaseNode
          {...defaultProps}
          renderVariant="bar"
          selected
          extraMenuItems={[{ id: 'move-up', label: 'Move up', onClick: vi.fn() }]}
        />
      );
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
      expect(screen.getByText('Move up')).toBeInTheDocument();
    });

    it('appends extraMenuItems after the toolbar actions with a divider between the two groups', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction: vi.fn() }],
        },
      };
      const { container } = render(
        <BaseNode
          {...defaultProps}
          renderVariant="bar"
          selected
          extraMenuItems={[{ id: 'move-up', label: 'Move up', onClick: vi.fn() }]}
        />
      );
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Move up')).toBeInTheDocument();
      // DropdownMenuSeparator is mocked to <hr /> (see the @uipath/apollo-wind mock above).
      expect(container.querySelectorAll('hr')).toHaveLength(1);
    });

    it('fires an extraMenuItems action on click', () => {
      const onClick = vi.fn();
      render(
        <BaseNode
          {...defaultProps}
          renderVariant="bar"
          selected
          extraMenuItems={[{ id: 'move-up', label: 'Move up', onClick }]}
        />
      );
      fireEvent.click(screen.getByText('Move up'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders a disabled extraMenuItems action as disabled', () => {
      render(
        <BaseNode
          {...defaultProps}
          renderVariant="bar"
          selected
          extraMenuItems={[{ id: 'move-up', label: 'Move up', onClick: vi.fn(), disabled: true }]}
        />
      );
      expect(screen.getByText('Move up').closest('button')).toBeDisabled();
    });

    it('renders no kebab at all when there is neither a toolbar nor extraMenuItems', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" selected />);
      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });
  });

  describe('display parity: background and shadow', () => {
    it('applies display.background as an inline background style, like BaseContainer', () => {
      mockManifest.current = {
        display: {
          label: 'HTTP Request',
          shape: 'rectangle',
          icon: 'globe',
          background: 'linear-gradient(90deg, #611f69, #0ea5e9)',
        },
        handleConfiguration: [],
      };
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.style.background).toContain('linear-gradient');
    });

    it('renders the rest shadow class by default (display.shadow unset)', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.className).toContain('shadow-(--canvas-node-shadow-rest)');
    });

    it('omits the rest shadow class when display.shadow is false, like BaseContainer', () => {
      mockManifest.current = {
        display: { label: 'HTTP Request', shape: 'rectangle', icon: 'globe', shadow: false },
        handleConfiguration: [],
      };
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.className).not.toContain('shadow-(--canvas-node-shadow-rest)');
    });
  });

  describe('loading accessibility', () => {
    it('sets aria-busy on the bar shell while loading, matching BaseContainer', () => {
      render(<BaseNode {...defaultProps} data={{ loading: true }} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).toHaveAttribute('aria-busy', 'true');
    });

    it('omits aria-busy when not loading', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).not.toHaveAttribute('aria-busy');
    });
  });

  // Connectors anchor to the bar's bottom-left / top-left
  // region instead of its horizontal center. `Handle` itself is stubbed to
  // `null` above (BaseNode's Handle-rendering internals aren't under test
  // here), so this asserts directly against the shared style object BOTH the
  // top target and bottom source handles use -- the actual source of truth
  // xyflow reads to position the real handle DOM nodes in production.
  describe('handle anchoring', () => {
    it('anchors the invisible top/bottom handles at SEQ_HANDLE_LEFT_OFFSET from the bar left edge, not the horizontal center', () => {
      expect(INVISIBLE_HANDLE_STYLE.left).toBe(SEQ_HANDLE_LEFT_OFFSET);
    });
  });

  // A collapsed collapsible sequential row renders the same
  // decorative "stacked" treatment BaseContainer applies to drillable/collapsed
  // cards (a layered bar peeking out behind), driven by a `stacked` prop
  // (threaded via context by SequentialStepNode, never node.data) rather than
  // any state BaseNodeBar derives itself.
  describe('collapsed stacked treatment', () => {
    it('renders no stacked-layer classes or data-stacked attribute by default', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).not.toHaveAttribute('data-stacked');
      expect(bar.className).not.toContain('before:border-brand');
    });

    it('renders the stacked-layer classes and data-stacked when stacked=true', () => {
      render(<BaseNode {...defaultProps} renderVariant="bar" stacked />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).toHaveAttribute('data-stacked', 'true');
      expect(bar.className).toContain('before:border-brand');
      expect(bar.className).toContain('before:-z-10');
      expect(bar.className).toContain('before:translate-y-[6px]');
    });
  });
});
