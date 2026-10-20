import { fireEvent, render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseNodeData } from './BaseNode.types';
import { BaseNodeBar } from './BaseNodeBar';

const {
  mockUpdateNode,
  mockUpdateNodeInternals,
  mockGetNode,
  mockNodeState,
  mockHandleConfigs,
  mockManifest,
  mockOverrideConfig,
  mockMode,
  mockIsReadOnly,
  mockNodeLabel,
  mockSelectionState,
} = vi.hoisted(() => ({
  mockUpdateNode: vi.fn(),
  mockUpdateNodeInternals: vi.fn(),
  mockGetNode: vi.fn(),
  mockNodeState: {
    current: {
      height: undefined as number | undefined,
      width: undefined as number | undefined,
    },
  },
  mockHandleConfigs: { current: undefined as unknown },
  mockManifest: {
    current: {
      display: { label: 'HTTP Request', shape: 'rectangle', icon: 'globe' },
      handleConfiguration: [],
    } as Record<string, unknown>,
  },
  mockOverrideConfig: { current: {} as Record<string, unknown> },
  mockMode: { current: 'design' as string },
  mockIsReadOnly: { current: false },
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
  // Real selectors over a minimal store: presentation reads `connection.inProgress`,
  // BaseNodeBarNode reads its declared width through `nodeLookup`.
  useStore: (selector: (state: unknown) => unknown) =>
    selector({
      connection: { inProgress: false },
      nodeLookup: { get: () => mockNodeState.current },
    }),
  useUpdateNodeInternals: () => mockUpdateNodeInternals,
  useReactFlow: () => ({
    updateNodeData: vi.fn(),
    updateNode: mockUpdateNode,
    getNode: mockGetNode,
  }),
}));

vi.mock('../../hooks', () => ({
  useNodeExecutionState: () => undefined,
  useElementValidationStatus: () => undefined,
  useToolbarActionStoreContext: () => undefined,
}));
vi.mock('../../core', () => ({
  useNodeTypeRegistry: () => ({ getManifest: () => mockManifest.current }),
}));
vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: mockMode.current }),
}));
vi.mock('../BaseCanvas/ReadOnlyNodesContext', () => ({
  useIsNodeReadOnly: () => mockIsReadOnly.current,
}));
vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({ useConnectedHandles: () => new Set() }));
vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => mockSelectionState.current,
}));
vi.mock('../BaseCanvas/CanvasThemeContext', () => ({
  useCanvasTheme: () => ({ isDarkMode: false }),
}));
vi.mock('../Toolbar', () => ({ NodeToolbar: () => null }));
vi.mock('../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
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
import { BaseNodeBarNode } from './BaseNodeBarNode';

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
    mockUpdateNodeInternals.mockClear();
    mockNodeState.current = { height: undefined, width: undefined };
    mockHandleConfigs.current = undefined;
    mockOverrideConfig.current = {};
    mockMode.current = 'design';
    mockIsReadOnly.current = false;
    mockNodeLabel.mockClear();
    mockSelectionState.current = { multipleNodesSelected: false };
    mockManifest.current = {
      display: { label: 'HTTP Request', shape: 'rectangle', icon: 'globe' },
      handleConfiguration: [],
    };
  });

  describe('display parity with the card variant', () => {
    it('renders the identical resolved label and icon', () => {
      const { unmount } = render(<BaseNode {...defaultProps} />);
      const cardLabel = screen.getByTestId('node-label').textContent;
      expect(screen.getAllByTestId('node-icon').length).toBeGreaterThan(0);
      unmount();

      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('node-label').textContent).toBe(cardLabel);
      expect(screen.getAllByTestId('node-icon').length).toBeGreaterThan(0);
    });

    it('feeds the icon shape from the same color source', () => {
      const { unmount } = render(<BaseNode {...defaultProps} />);
      const cardShape = screen.getByTestId('inner-shape');
      const cardBg = cardShape.getAttribute('data-background');
      const cardColor = cardShape.getAttribute('data-color');
      unmount();

      render(<BaseNodeBarNode {...defaultProps} />);
      const barShape = screen.getByTestId('inner-shape');
      expect(barShape.getAttribute('data-background')).toBe(cardBg);
      expect(barShape.getAttribute('data-color')).toBe(cardColor);
      expect(cardBg).toBe('#611f69');
    });
  });

  describe('bar geometry', () => {
    it.each([
      ['circle', '50%'],
      ['pill', '9999px'],
      ['square', '8px'],
      ['rectangle', '8px'],
      [undefined, '8px'],
    ] as const)('rounds the icon tile for the %s card shape to %s', (shape, radius) => {
      render(<BaseNodeBar nodeId="n" icon={<span />} shape={shape} />);
      expect(screen.getByTestId('sequential-bar').style.getPropertyValue('--inner-radius')).toBe(
        radius
      );
    });

    it('renders at the fixed 896x56 bar size regardless of handle count', () => {
      render(<BaseNodeBarNode {...defaultProps} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.style.getPropertyValue('--node-w')).toBe('896px');
      expect(bar.style.getPropertyValue('--node-h')).toBe('56px');
    });

    // xyflow's `width` prop is the measured width, which lags a declared-width change by a render.
    it('sizes the bar from the declared node width, not the measured width prop', () => {
      mockNodeState.current = { ...mockNodeState.current, width: 560 };
      render(<BaseNodeBarNode {...defaultProps} width={400} />);
      expect(screen.getByTestId('sequential-bar').style.getPropertyValue('--node-w')).toBe('560px');
    });

    it.each([96, 288])('honors a declared width of %ipx that matches a card default', (width) => {
      mockNodeState.current = { ...mockNodeState.current, width };
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('sequential-bar').style.getPropertyValue('--node-w')).toBe(
        `${width}px`
      );
    });

    it('falls back to the default bar width when the node declares none', () => {
      render(<BaseNodeBarNode {...defaultProps} width={288} />);
      expect(screen.getByTestId('sequential-bar').style.getPropertyValue('--node-w')).toBe('896px');
    });

    it('does not re-measure handles on mount (xyflow measures the first observe)', () => {
      mockHandleConfigs.current = [
        { position: 'left', handles: [{ id: 'a', type: 'target', handleType: 'input' }] },
      ];
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(mockUpdateNodeInternals).not.toHaveBeenCalled();
    });

    it('re-measures only when the handle set changes, not on a data-only edit', () => {
      mockHandleConfigs.current = [
        { position: 'left', handles: [{ id: 'a', type: 'target', handleType: 'input' }] },
      ];
      const { rerender } = render(<BaseNodeBarNode {...defaultProps} />);

      rerender(<BaseNodeBarNode {...defaultProps} data={{ display: { label: 'Renamed' } }} />);
      expect(mockUpdateNodeInternals).not.toHaveBeenCalled();

      mockHandleConfigs.current = [
        {
          position: 'left',
          handles: [
            { id: 'a', type: 'target', handleType: 'input' },
            { id: 'b', type: 'target', handleType: 'input' },
          ],
        },
      ];
      rerender(<BaseNodeBarNode {...defaultProps} data={{}} />);
      expect(mockUpdateNodeInternals).toHaveBeenCalledTimes(1);
    });

    it('reads the declared height from the store and never writes it back', () => {
      mockNodeState.current = { ...mockNodeState.current, height: 72 };
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('sequential-bar').style.getPropertyValue('--node-h')).toBe('72px');
      expect(mockUpdateNode).not.toHaveBeenCalled();
    });

    it('falls back to the default bar height when the node declares none', () => {
      render(<BaseNodeBarNode {...defaultProps} height={0} />);
      expect(screen.getByTestId('sequential-bar').style.getPropertyValue('--node-h')).toBe('56px');
    });
  });

  it('paints the left accent strip from the resolved icon background', () => {
    render(<BaseNodeBarNode {...defaultProps} />);
    const accent = screen.getByTestId('sequential-bar-accent');
    expect(accent.style.getPropertyValue('--seq-accent')).toBe('#611f69');
    expect(accent).toHaveClass('shadow-[inset_4px_0_0_var(--seq-accent)]');
  });

  it('keeps inline rename enabled in design mode (readonly=false, onChange wired)', () => {
    render(<BaseNodeBarNode {...defaultProps} selected />);
    const labelProps = mockNodeLabel.mock.calls.at(-1)?.[0];
    expect(labelProps.readonly).toBe(false);
    expect(typeof labelProps.onChange).toBe('function');
    expect(labelProps.shape).toBe('rectangle');
  });

  it('disables rename outside design mode', () => {
    mockMode.current = 'view';
    render(<BaseNodeBarNode {...defaultProps} />);
    expect(mockNodeLabel.mock.calls.at(-1)?.[0].readonly).toBe(true);
  });

  describe('per-node read-only (readOnlyNodeIds)', () => {
    beforeEach(() => {
      mockIsReadOnly.current = true;
    });

    it('disables rename on a locked node in design mode and discards the draft', () => {
      render(<BaseNodeBarNode {...defaultProps} selected />);
      const labelProps = mockNodeLabel.mock.calls.at(-1)?.[0];
      expect(labelProps.readonly).toBe(true);
      expect(labelProps.discardDraftOnReadonly).toBe(true);
    });

    it('keeps the kebab but disables its toolbar actions', () => {
      const onAction = vi.fn();
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction }],
        },
      };
      render(<BaseNodeBarNode {...defaultProps} selected />);
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
      const item = screen.getByText('Delete').closest('button');
      expect(item).toBeDisabled();
      fireEvent.click(screen.getByText('Delete'));
      expect(onAction).not.toHaveBeenCalled();
    });

    it('leaves allowWhenLocked actions enabled', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [
            { id: 'open', icon: <span />, label: 'Open', allowWhenLocked: true, onAction: vi.fn() },
          ],
        },
      };
      render(<BaseNodeBarNode {...defaultProps} selected />);
      expect(screen.getByText('Open').closest('button')).not.toBeDisabled();
    });
  });

  describe('trailing group', () => {
    it('renders the toolbar actions as a kebab when selected', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction: vi.fn() }],
        },
      };
      render(<BaseNodeBarNode {...defaultProps} selected />);
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('fires the toolbar action with the node id when the item is selected', () => {
      const onAction = vi.fn();
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction }],
        },
      };
      render(<BaseNodeBarNode {...defaultProps} selected />);
      fireEvent.click(screen.getByText('Delete'));
      expect(onAction).toHaveBeenCalledWith('step-1');
    });

    it('resolves a string toolbar icon through the icon registry instead of rendering it as literal text', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: 'trash', label: 'Delete', onAction: vi.fn() }],
        },
      };
      render(<BaseNodeBarNode {...defaultProps} selected />);
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
      render(<BaseNodeBarNode {...defaultProps} selected />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('hides the kebab when multiple nodes are selected, mirroring the card toolbar gating', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction: vi.fn() }],
        },
      };
      mockSelectionState.current = { multipleNodesSelected: true };
      render(<BaseNodeBarNode {...defaultProps} selected />);
      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });

    it('shows the status indicator when not action-needed', () => {
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
      expect(screen.queryByText('Action needed')).not.toBeInTheDocument();
    });

    it('gives the Action needed pill precedence over the status indicator', () => {
      const onActionNeeded = vi.fn();
      mockOverrideConfig.current = { executionStatusOverride: 'ActionNeeded', onActionNeeded };
      render(<BaseNodeBarNode {...defaultProps} />);

      expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
      const pill = screen.getByText('Action needed');
      fireEvent.click(pill);
      expect(onActionNeeded).toHaveBeenCalledWith('step-1');
    });
  });

  describe('extraMenuItems passthrough', () => {
    it('shows the kebab from extraMenuItems alone, with no toolbar configured', () => {
      render(
        <BaseNodeBarNode
          {...defaultProps}
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
        <BaseNodeBarNode
          {...defaultProps}
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
        <BaseNodeBarNode
          {...defaultProps}
          selected
          extraMenuItems={[{ id: 'move-up', label: 'Move up', onClick }]}
        />
      );
      fireEvent.click(screen.getByText('Move up'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders a disabled extraMenuItems action as disabled', () => {
      render(
        <BaseNodeBarNode
          {...defaultProps}
          selected
          extraMenuItems={[{ id: 'move-up', label: 'Move up', onClick: vi.fn(), disabled: true }]}
        />
      );
      expect(screen.getByText('Move up').closest('button')).toBeDisabled();
    });

    it('renders no kebab at all when there is neither a toolbar nor extraMenuItems', () => {
      render(<BaseNodeBarNode {...defaultProps} selected />);
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
      render(<BaseNodeBarNode {...defaultProps} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.style.background).toContain('linear-gradient');
    });

    it('renders the rest shadow class by default (display.shadow unset)', () => {
      render(<BaseNodeBarNode {...defaultProps} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.className).toContain('shadow-(--canvas-node-shadow-rest)');
    });

    it('omits the rest shadow class when display.shadow is false, like BaseContainer', () => {
      mockManifest.current = {
        display: { label: 'HTTP Request', shape: 'rectangle', icon: 'globe', shadow: false },
        handleConfiguration: [],
      };
      render(<BaseNodeBarNode {...defaultProps} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar.className).not.toContain('shadow-(--canvas-node-shadow-rest)');
    });
  });

  describe('loading accessibility', () => {
    it('sets aria-busy on the bar shell while loading, matching BaseContainer', () => {
      render(<BaseNodeBarNode {...defaultProps} data={{ loading: true }} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).toHaveAttribute('aria-busy', 'true');
    });

    it('omits aria-busy when not loading', () => {
      render(<BaseNodeBarNode {...defaultProps} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).not.toHaveAttribute('aria-busy');
    });
  });

  // `Handle` is stubbed above, so assert on the shared style object xyflow reads for both spine handles.
  describe('handle anchoring', () => {
    it('anchors the invisible top/bottom handles at SEQ_HANDLE_LEFT_OFFSET from the bar left edge, not the horizontal center', () => {
      expect(INVISIBLE_HANDLE_STYLE.left).toBe(SEQ_HANDLE_LEFT_OFFSET);
    });
  });

  describe('card parity: adornments, footer, placeholders, drag', () => {
    const fourCorners = {
      topLeft: <span data-testid="adorn-tl" />,
      topRight: <span data-testid="adorn-tr" />,
      bottomLeft: <span data-testid="adorn-bl" />,
      bottomRight: <span data-testid="adorn-br" />,
    };

    it('renders all four adornment corners', () => {
      mockOverrideConfig.current = { adornments: fourCorners };
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('sequential-bar-adornment-top-left')).toContainElement(
        screen.getByTestId('adorn-tl')
      );
      expect(screen.getByTestId('sequential-bar-adornment-top-right')).toContainElement(
        screen.getByTestId('adorn-tr')
      );
      expect(screen.getByTestId('sequential-bar-adornment-bottom-left')).toContainElement(
        screen.getByTestId('adorn-bl')
      );
      expect(screen.getByTestId('sequential-bar-adornment-bottom-right')).toContainElement(
        screen.getByTestId('adorn-br')
      );
    });

    it('suppresses only topRight while Action needed is shown, like the card', () => {
      mockOverrideConfig.current = {
        adornments: fourCorners,
        executionStatusOverride: 'ActionNeeded',
        onActionNeeded: vi.fn(),
      };
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByText('Action needed')).toBeInTheDocument();
      expect(screen.queryByTestId('adorn-tr')).not.toBeInTheDocument();
      expect(screen.getByTestId('adorn-tl')).toBeInTheDocument();
      expect(screen.getByTestId('adorn-bl')).toBeInTheDocument();
      expect(screen.getByTestId('adorn-br')).toBeInTheDocument();
    });

    it('renders the footer component inline', () => {
      mockOverrideConfig.current = { footerComponent: <span data-testid="footer">3 runs</span> };
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('sequential-bar-footer')).toContainElement(
        screen.getByTestId('footer')
      );
    });

    it('passes label placeholders to NodeLabel', () => {
      mockOverrideConfig.current = {
        labelPlaceholder: 'Name this step',
        subLabelPlaceholder: 'Describe it',
      };
      render(<BaseNodeBarNode {...defaultProps} />);
      const labelProps = mockNodeLabel.mock.calls.at(-1)?.[0];
      expect(labelProps.labelPlaceholder).toBe('Name this step');
      expect(labelProps.subLabelPlaceholder).toBe('Describe it');
    });

    it('hides the kebab while dragging', () => {
      mockOverrideConfig.current = {
        toolbarConfig: {
          actions: [{ id: 'delete', icon: <span />, label: 'Delete', onAction: vi.fn() }],
        },
      };
      render(<BaseNodeBarNode {...defaultProps} selected dragging />);
      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });

    it('exposes the interaction state like BaseContainer', () => {
      render(<BaseNodeBarNode {...defaultProps} selected />);
      expect(screen.getByTestId('sequential-bar')).toHaveAttribute(
        'data-interaction-state',
        'selected'
      );
    });
  });

  describe('attachments', () => {
    const attachments = ['Search', 'Email', 'Calendar', 'CRM', 'Slack'].map((label, i) => ({
      id: `tool-${i}`,
      label,
      icon: <span data-testid={`tool-icon-${i}`} />,
    }));

    it('renders no chips without attachments', () => {
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.queryAllByTestId('sequential-bar-attachment')).toHaveLength(0);
    });

    it('renders up to three chips and an overflow count for the rest', () => {
      render(<BaseNodeBarNode {...defaultProps} attachments={attachments} />);
      expect(screen.getAllByTestId('sequential-bar-attachment')).toHaveLength(3);
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByTestId('tool-icon-0')).toBeInTheDocument();
      expect(screen.getByTestId('sequential-bar-attachment-overflow')).toHaveTextContent('+2');
      expect(screen.queryByText('Slack')).not.toBeInTheDocument();
    });

    it('renders no overflow chip at exactly three attachments', () => {
      render(<BaseNodeBarNode {...defaultProps} attachments={attachments.slice(0, 3)} />);
      expect(screen.getAllByTestId('sequential-bar-attachment')).toHaveLength(3);
      expect(screen.queryByTestId('sequential-bar-attachment-overflow')).not.toBeInTheDocument();
    });
  });

  describe('collapsed stacked treatment', () => {
    it('renders no stacked-layer classes or data-stacked attribute by default', () => {
      render(<BaseNodeBarNode {...defaultProps} />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).not.toHaveAttribute('data-stacked');
      expect(bar.className).not.toContain('before:border-brand');
    });

    it('renders the stacked-layer classes and data-stacked when stacked=true', () => {
      render(<BaseNodeBarNode {...defaultProps} stacked />);
      const bar = screen.getByTestId('sequential-bar');
      expect(bar).toHaveAttribute('data-stacked', 'true');
      expect(bar.className).toContain('before:border-brand');
      expect(bar.className).toContain('before:-z-10');
      expect(bar.className).toContain('before:translate-y-[6px]');
    });

    it('stacks a drillable manifest, like the card', () => {
      mockManifest.current = { ...mockManifest.current, drillable: true };
      render(<BaseNodeBarNode {...defaultProps} />);
      expect(screen.getByTestId('sequential-bar')).toHaveAttribute('data-stacked', 'true');
    });

    it('stacks a node with data.isCollapsed, like the card', () => {
      render(<BaseNodeBarNode {...defaultProps} data={{ isCollapsed: true }} />);
      expect(screen.getByTestId('sequential-bar')).toHaveAttribute('data-stacked', 'true');
    });
  });
});
