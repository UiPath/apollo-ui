import { fireEvent, render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationErrorSeverity } from '../../types/validation';
import type { LoopNodeData, LoopNodeExecutionCountState } from './LoopNode.types';

const { mockExecutionState, mockGetContainerResizeMinimums, mockManifest, mockValidationState } =
  vi.hoisted(() => ({
    mockExecutionState: { current: undefined as unknown },
    mockGetContainerResizeMinimums: vi.fn(() => ({
      left: 410,
      right: 420,
      top: 230,
      bottom: 240,
    })),
    mockManifest: {
      current: {
        display: { label: 'Loop', icon: 'repeat', shape: 'container' },
        handleConfiguration: [],
      } as Record<string, unknown>,
    },
    mockValidationState: { current: undefined as unknown },
  }));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  NodeResizeControl: ({
    children,
    minHeight,
    minWidth,
    onResizeEnd,
    onResizeStart,
    position,
  }: {
    children?: React.ReactNode;
    minHeight?: number;
    minWidth?: number;
    onResizeEnd?: () => void;
    onResizeStart?: () => void;
    position?: string;
  }) => (
    <div
      data-testid={`node-resize-control-${position}`}
      data-min-height={minHeight}
      data-min-width={minWidth}
      onMouseDown={onResizeStart}
      onMouseUp={onResizeEnd}
    >
      {children}
    </div>
  ),
  useStore: (selector: unknown) => {
    const state = {
      connection: { inProgress: false },
      nodes: [],
      parentLookup: new Map(),
    };

    return typeof selector === 'function' ? selector(state) : false;
  },
  useUpdateNodeInternals: () => vi.fn(),
}));

vi.mock('../../utils/container', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/container')>()),
  getContainerResizeMinimums: mockGetContainerResizeMinimums,
}));

vi.mock('../../core', () => ({
  useOptionalNodeTypeRegistry: () => ({
    getManifest: () => mockManifest.current,
  }),
}));

vi.mock('../../hooks', () => ({
  useNodeExecutionState: () => mockExecutionState.current,
  useElementValidationStatus: () => mockValidationState.current,
}));

vi.mock('../../utils/icon-registry', () => ({
  CanvasIcon: ({ icon }: { icon: string }) => <span data-testid={`canvas-icon-${icon}`} />,
}));

vi.mock('../../utils/toolbar-resolver', () => ({
  resolveToolbar: () => undefined,
}));

vi.mock('../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => ({ mode: 'design' }),
}));

vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => new Set(),
}));

vi.mock('../BaseCanvas/SelectionStateContext', () => ({
  useSelectionState: () => ({ multipleNodesSelected: false }),
}));

import { LoopNode } from './LoopNode';

const defaultProps: NodeProps<Node<LoopNodeData>> = {
  id: 'loop-1',
  type: 'loop',
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

function renderLoopNode(props: Partial<React.ComponentProps<typeof LoopNode>> = {}) {
  render(<LoopNode {...defaultProps} {...props} />);
  return screen.getByTestId('loop-node-header');
}

function getLoopContainer() {
  return document.querySelector('[data-loop-container]') as HTMLElement;
}

function getResizeControls() {
  return screen.queryAllByTestId(/^node-resize-control-/);
}

function getResizeIndicators() {
  return screen.queryAllByTestId(/^loop-resize-corner-indicator-/);
}

beforeEach(() => {
  mockExecutionState.current = undefined;
  mockGetContainerResizeMinimums.mockClear();
  mockManifest.current = {
    display: { label: 'Loop', icon: 'repeat', shape: 'container' },
    handleConfiguration: [],
  };
  mockValidationState.current = undefined;
});

describe('LoopNode header adornment spacing', () => {
  it('keeps the default header padding when no adornments are visible', () => {
    const header = renderLoopNode();

    expect(header.style.paddingLeft).toBe('');
    expect(header.style.paddingRight).toBe('');
  });

  it('reserves left-side header space when the top-left adornment is visible', () => {
    const header = renderLoopNode({
      adornments: {
        topLeft: <span data-testid="breakpoint-adornment" />,
      },
    });

    expect(header.style.paddingLeft).toBe('34px');
    expect(header.style.paddingRight).toBe('');
  });

  it('reserves right-side header space when the top-right adornment is visible', () => {
    const header = renderLoopNode({
      adornments: {
        topRight: <span data-testid="execution-count-adornment" />,
      },
    });

    expect(header.style.paddingLeft).toBe('');
    expect(header.style.paddingRight).toBe('34px');
  });

  it('reserves both sides independently when both top adornments are visible', () => {
    const header = renderLoopNode({
      adornments: {
        topLeft: <span data-testid="breakpoint-adornment" />,
        topRight: <span data-testid="execution-count-adornment" />,
      },
    });

    expect(header.style.paddingLeft).toBe('34px');
    expect(header.style.paddingRight).toBe('34px');
  });

  it('does not reserve right-side header space for execution status adornment', () => {
    mockExecutionState.current = 'Completed';

    const header = renderLoopNode();

    expect(header.style.paddingRight).toBe('');
  });

  it('still reserves right-side header space for validation adornment', () => {
    mockExecutionState.current = 'Completed';
    mockValidationState.current = {
      validationStatus: ValidationErrorSeverity.ERROR,
      validationError: {
        code: 'REQUIRED',
        message: 'URL is required',
        description: 'URL is required',
        severity: ValidationErrorSeverity.ERROR,
      },
    };

    const header = renderLoopNode();

    expect(header.style.paddingRight).toBe('34px');
  });

  it('uses an unrotated text align icon for sequential mode', () => {
    renderLoopNode({ data: { parallel: false } });

    expect(screen.getByText('Sequential')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-icon-text-align-justify')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-icon-text-align-justify').parentElement).not.toHaveClass(
      'rotate-90'
    );
  });

  it('uses a rotated text align icon for parallel mode', () => {
    renderLoopNode({ data: { parallel: true } });

    expect(screen.getByText('Parallel')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-icon-text-align-justify')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-icon-text-align-justify').parentElement).toHaveClass(
      'rotate-90'
    );
  });
});

describe('LoopNode status border hover treatment', () => {
  it('preserves a resolved status border while hovered', () => {
    renderLoopNode({ executionStatusOverride: 'Completed' });

    const container = getLoopContainer();
    fireEvent.mouseEnter(container);

    expect(container).toHaveClass('border-success');
    expect(container).toHaveClass('shadow-(--canvas-node-shadow-hover)');
    expect(container).not.toHaveClass('border-border-hover');
  });

  it('keeps the hover border for neutral statuses without a resolved status border', () => {
    renderLoopNode({ executionStatusOverride: 'NotExecuted' });

    const container = getLoopContainer();
    fireEvent.mouseEnter(container);

    expect(container).toHaveClass('border-border-hover');
    expect(container).toHaveClass('shadow-(--canvas-node-shadow-hover)');
  });
});

describe('LoopNode execution count', () => {
  it('renders the execution count pill when iterationPillState is provided', () => {
    const iterationPillState: LoopNodeExecutionCountState = {
      activeIndex: 1,
      total: 3,
      onActiveIndexChange: vi.fn(),
      isAll: false,
      onAllChange: vi.fn(),
    };

    renderLoopNode({ iterationPillState, width: 520 });

    expect(
      screen.getByRole('button', { name: 'Show aggregate across all iterations' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous iteration' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next iteration' })).not.toBeDisabled();
  });
});

describe('LoopNode resize controls', () => {
  it('renders resize controls before the loop is selected', () => {
    renderLoopNode({ selected: false });

    expect(getResizeControls()).toHaveLength(4);
  });

  it('does not compute child-aware resize minimums for an idle unselected loop', () => {
    renderLoopNode({ selected: false });

    expect(getResizeControls()).toHaveLength(4);
    expect(mockGetContainerResizeMinimums).not.toHaveBeenCalled();
  });

  it('computes child-aware resize minimums when the loop is selected', () => {
    renderLoopNode({ selected: true });

    expect(mockGetContainerResizeMinimums).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('node-resize-control-bottom-right')).toHaveAttribute(
      'data-min-width',
      '420'
    );
  });

  it('computes child-aware resize minimums while the loop is hovered', () => {
    renderLoopNode({ selected: false });

    fireEvent.mouseEnter(getLoopContainer());

    expect(mockGetContainerResizeMinimums).toHaveBeenCalledTimes(1);
  });

  it('hides resize indicators before the loop is selected', () => {
    renderLoopNode({ selected: false });

    expect(getResizeIndicators()).toHaveLength(4);
    for (const indicator of getResizeIndicators()) {
      expect(indicator).toHaveClass('opacity-0');
    }
  });

  it('shows resize indicators when the loop is selected', () => {
    renderLoopNode({ selected: true });

    expect(getResizeIndicators()).toHaveLength(4);
    for (const indicator of getResizeIndicators()) {
      expect(indicator).toHaveClass('opacity-100');
    }
  });

  it('does not render resize controls while dragging', () => {
    renderLoopNode({ dragging: true, selected: true });

    expect(getResizeControls()).toHaveLength(0);
  });

  it('keeps resize minimums and indicators active during an unselected resize', () => {
    renderLoopNode({ selected: false });

    fireEvent.mouseDown(screen.getByTestId('node-resize-control-bottom-right'));

    expect(mockGetContainerResizeMinimums).toHaveBeenCalledTimes(1);
    for (const indicator of getResizeIndicators()) {
      expect(indicator).toHaveClass('opacity-100');
    }

    fireEvent.mouseUp(screen.getByTestId('node-resize-control-bottom-right'));

    for (const indicator of getResizeIndicators()) {
      expect(indicator).toHaveClass('opacity-0');
    }
  });
});

describe('LoopNode localized labels', () => {
  it('uses the localized fallback title when the manifest has no display label', () => {
    mockManifest.current = {
      display: { icon: 'repeat', shape: 'container' },
      handleConfiguration: [],
    };

    renderLoopNode();

    expect(screen.getByText('Loop')).toBeTruthy();
  });

  it('exposes a localized accessible label for the empty add button', () => {
    renderLoopNode({ onAddFirstChild: vi.fn() });

    expect(screen.getByRole('button', { name: 'Add node to loop' })).toBeTruthy();
  });
});
