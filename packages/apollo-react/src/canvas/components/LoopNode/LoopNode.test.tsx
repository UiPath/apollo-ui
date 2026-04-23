import { fireEvent, render, screen } from '@testing-library/react';
import type { NodeManifest } from '@uipath/apollo-react/canvas';
import { describe, expect, it, vi } from 'vitest';
import { PREVIEW_NODE_ID } from '../../constants';
import { canvasEventBus } from '../../utils/CanvasEventBus';
import { LoopNode } from './LoopNode';
import { DEFAULT_LOOP_ICON, DEFAULT_LOOP_NODE_TYPE } from './LoopNode.constants';
import type { LoopNodeProps } from './LoopNode.types';

const {
  mockManifest,
  mockIsConnecting,
  mockMode,
  mockNodes,
  mockMultipleNodesSelected,
  mockExecutionState,
  mockValidationState,
} = vi.hoisted(() => ({
  mockManifest: { current: undefined as NodeManifest | undefined },
  mockIsConnecting: { current: false },
  mockMode: { current: 'design' },
  mockNodes: { current: [] as Array<{ id: string; parentId?: string }> },
  mockMultipleNodesSelected: { current: false },
  mockExecutionState: { current: undefined as unknown },
  mockValidationState: { current: undefined as unknown },
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const React = await import('react');
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    Handle: React.forwardRef(({ children, id, position, ...props }: any, ref) => (
      <div ref={ref} data-testid={`handle-${id}`} data-position={position} {...props}>
        {children}
      </div>
    )),
    NodeResizeControl: ({ children, position, onResize }: any) => (
      <button
        type="button"
        data-testid={`resize-control-${position}`}
        onClick={() => onResize?.({}, { width: 420, height: 260 })}
      >
        {children}
      </button>
    ),
    useStore: (selector?: (state: any) => unknown) =>
      selector?.({
        connection: { inProgress: mockIsConnecting.current },
        nodes: mockNodes.current,
      }),
    useUpdateNodeInternals: () => vi.fn(),
  };
});

vi.mock('../../core', () => ({
  useOptionalNodeTypeRegistry: () => ({
    getManifest: () => mockManifest.current,
  }),
}));

vi.mock('../../hooks', () => ({
  useNodeExecutionState: () => mockExecutionState.current,
  useElementValidationStatus: () => mockValidationState.current,
}));

vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: mockMode.current }),
}));

vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => new Set<string>(),
}));

vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: mockMultipleNodesSelected.current }),
}));

vi.mock('../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { children: any }) => <>{children}</>,
}));

vi.mock('../Toolbar', () => ({
  NodeToolbar: ({
    config,
    hidden,
  }: {
    config: { actions: Array<{ id: string; label?: string }> };
    hidden?: boolean;
  }) =>
    hidden ? null : (
      <div data-testid="node-toolbar">
        {config.actions
          .filter((action) => action.id !== 'separator')
          .map((action) => (
            <button key={action.id} type="button" aria-label={action.label}>
              {action.label}
            </button>
          ))}
      </div>
    ),
}));

const defaultManifest: NodeManifest = {
  nodeType: DEFAULT_LOOP_NODE_TYPE,
  version: '1.0.0',
  category: 'control-flow',
  tags: ['loop'],
  sortOrder: 0,
  display: {
    label: 'For Each',
    icon: DEFAULT_LOOP_ICON,
  },
  handleConfiguration: [
    {
      position: 'left',
      handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Entry' }],
    },
    {
      position: 'right',
      handles: [
        {
          id: 'success',
          type: 'source',
          handleType: 'output',
          label: 'Completed',
          showButton: true,
        },
      ],
    },
    {
      position: 'left',
      boundary: 'inner',
      handles: [
        {
          id: 'start',
          type: 'source',
          handleType: 'output',
          label: 'Start',
          showButton: true,
        },
      ],
    },
    {
      position: 'right',
      boundary: 'inner',
      handles: [
        {
          id: 'continue',
          type: 'target',
          handleType: 'input',
          label: 'Continue',
        },
        {
          id: 'break',
          type: 'target',
          handleType: 'input',
          label: 'Break',
        },
      ],
    },
  ],
};

const defaultProps = {
  id: 'loop-1',
  type: DEFAULT_LOOP_NODE_TYPE,
  data: {},
  width: 320,
  height: 220,
  selected: false,
  dragging: false,
} as unknown as LoopNodeProps;

describe('LoopNode', () => {
  beforeEach(() => {
    canvasEventBus.clear();
    mockManifest.current = defaultManifest;
    mockIsConnecting.current = false;
    mockMode.current = 'design';
    mockNodes.current = [];
    mockMultipleNodesSelected.current = false;
    mockExecutionState.current = undefined;
    mockValidationState.current = undefined;
  });

  it('renders manifest-driven handles, display content, and toolbar actions', () => {
    render(<LoopNode {...defaultProps} selected />);

    expect(screen.getByText('For Each')).toBeInTheDocument();
    expect(screen.getByTestId('loop-body-frame')).toBeInTheDocument();
    expect(screen.getByTestId('handle-input')).toBeInTheDocument();
    expect(screen.getByTestId('handle-success')).toBeInTheDocument();
    expect(screen.getByTestId('handle-start')).toBeInTheDocument();
    expect(screen.getByTestId('handle-continue')).toBeInTheDocument();
    expect(screen.getByTestId('handle-break')).toBeInTheDocument();
    expect(screen.getByTestId('node-toolbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle breakpoint' })).toBeInTheDocument();
  });

  it('suppresses add buttons for inward source handles even when the manifest enables them', () => {
    const handleAction = vi.fn();
    const unsubscribe = canvasEventBus.on('handle:action', handleAction);

    render(<LoopNode {...defaultProps} selected />);

    const addButtons = screen.getAllByRole('button', { name: 'Add node' });

    expect(addButtons).toHaveLength(1);

    fireEvent.click(addButtons[0]!);

    expect(handleAction).toHaveBeenCalledWith(
      expect.objectContaining({
        nodeId: 'loop-1',
        handleId: 'success',
        handleType: 'output',
      })
    );

    unsubscribe();
  });

  it('renders a missing-manifest placeholder for unknown loop types', () => {
    mockManifest.current = undefined;

    render(<LoopNode {...defaultProps} type="missing.loop.type" />);

    expect(screen.getByText('Manifest Undefined')).toBeInTheDocument();
    expect(screen.getByText('missing.loop.type')).toBeInTheDocument();
  });

  it('adds a child at the center of the loop body when the container has no child nodes', () => {
    const onAddFirstChild = vi.fn();

    render(<LoopNode {...defaultProps} onAddFirstChild={onAddFirstChild} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add node to loop' }));

    expect(onAddFirstChild).toHaveBeenCalledWith();
  });

  it('hides the empty-state action when the loop already has child nodes', () => {
    mockNodes.current = [{ id: 'child-1', parentId: 'loop-1' }];

    render(<LoopNode {...defaultProps} onAddFirstChild={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Add node to loop' })).not.toBeInTheDocument();
  });

  it('hides the empty-state action when the loop already has a preview child node', () => {
    mockNodes.current = [{ id: PREVIEW_NODE_ID, parentId: 'loop-1' }];

    render(<LoopNode {...defaultProps} onAddFirstChild={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Add node to loop' })).not.toBeInTheDocument();
  });

  it('gates empty-state actions, resize controls, and add buttons outside design mode', () => {
    mockMode.current = 'debug';

    render(<LoopNode {...defaultProps} selected onAddFirstChild={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Add node to loop' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('resize-control-bottom-right')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add node' })).not.toBeInTheDocument();
  });

  it('renders resize controls in design mode and forwards resize events', () => {
    const onResize = vi.fn();

    render(<LoopNode {...defaultProps} selected onResize={onResize} />);

    fireEvent.click(screen.getByTestId('resize-control-bottom-right'));

    expect(onResize).toHaveBeenCalledWith({ width: 420, height: 260 });
  });

  it('hides the toolbar during multi-select', () => {
    mockMultipleNodesSelected.current = true;

    render(<LoopNode {...defaultProps} selected />);

    expect(screen.queryByTestId('node-toolbar')).not.toBeInTheDocument();
  });
});
