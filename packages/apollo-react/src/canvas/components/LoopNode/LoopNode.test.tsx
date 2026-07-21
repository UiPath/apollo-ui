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
  // Stub: the real Handle requires a mounted React Flow store provider.
  Handle: ({ id }: { id?: string }) => <div data-testid={`xy-handle-${id}`} />,
  useReactFlow: () => ({ updateNodeData: vi.fn() }),
  NodeResizeControl: ({
    children,
    minHeight,
    minWidth,
    onResize,
    onResizeEnd,
    onResizeStart,
    position,
  }: {
    children?: React.ReactNode;
    minHeight?: number;
    minWidth?: number;
    onResize?: (
      event: React.MouseEvent<HTMLDivElement>,
      params: { width: number; height: number }
    ) => void;
    onResizeEnd?: () => void;
    onResizeStart?: () => void;
    position?: string;
  }) => (
    <div
      data-testid={`node-resize-control-${position}`}
      data-min-height={minHeight}
      data-min-width={minWidth}
      onMouseDown={onResizeStart}
      onMouseMove={(event) => onResize?.(event, { width: 130, height: 77 })}
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

import { StageHeaderChipType } from '../StageNode/StageNode.types';
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

  it('calls onResizeStart once when resize starts', () => {
    const onResizeStart = vi.fn();
    renderLoopNode({ onResizeStart });

    fireEvent.mouseDown(screen.getByTestId('node-resize-control-bottom-right'));

    expect(onResizeStart).toHaveBeenCalledTimes(1);
  });

  it('calls public onResizeEnd after resize end and preserves live onResize', async () => {
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();
    renderLoopNode({ onResize, onResizeEnd });

    const resizeControl = screen.getByTestId('node-resize-control-bottom-right');
    fireEvent.mouseMove(resizeControl);
    fireEvent.mouseUp(resizeControl);

    expect(onResize).toHaveBeenCalledWith({ width: 128, height: 80 });
    expect(onResizeEnd).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(onResizeEnd).toHaveBeenCalledTimes(1);
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

describe('LoopNode header chips and description', () => {
  it('renders no secondary header row by default', () => {
    renderLoopNode();

    expect(screen.queryByTestId('loop-header-chips')).toBeNull();
    expect(screen.queryByTestId('loop-node-header-description')).toBeNull();
  });

  it('renders rule chips supplied via the headerChips prop', () => {
    renderLoopNode({
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 2 },
        { type: StageHeaderChipType.Completion, count: 1 },
        { type: StageHeaderChipType.Exit, count: 3 },
      ],
    });

    expect(screen.getByTestId('loop-header-chips')).toBeTruthy();
    expect(screen.getByTestId('loop-header-chip-entry').textContent).toContain('2');
    expect(screen.getByTestId('loop-header-chip-completion').textContent).toContain('1');
    expect(screen.getByTestId('loop-header-chip-exit').textContent).toContain('3');
  });

  it('renders rule chips supplied via node data when no prop is set', () => {
    renderLoopNode({
      data: { headerChips: [{ type: StageHeaderChipType.ReturnToOrigin, count: 1 }] },
    });

    expect(screen.getByTestId('loop-header-chip-returnToOrigin')).toBeTruthy();
  });

  it('prefers the headerChips prop over node data chips', () => {
    renderLoopNode({
      data: { headerChips: [{ type: StageHeaderChipType.Exit, count: 9 }] },
      headerChips: [{ type: StageHeaderChipType.Entry, count: 1 }],
    });

    expect(screen.getByTestId('loop-header-chip-entry')).toBeTruthy();
    expect(screen.queryByTestId('loop-header-chip-exit')).toBeNull();
  });

  it('renders localized status pills for Optional and EndsCase chips', () => {
    renderLoopNode({
      headerChips: [{ type: StageHeaderChipType.Optional }, { type: StageHeaderChipType.EndsCase }],
    });

    expect(screen.getByTestId('loop-header-chip-optional').textContent).toContain('Optional');
    expect(screen.getByTestId('loop-header-chip-endsCase').textContent).toContain('Ends case');
  });

  it('invokes chip onClick without selecting the node', () => {
    const onChipClick = vi.fn();
    renderLoopNode({
      headerChips: [{ type: StageHeaderChipType.Entry, count: 2, onClick: onChipClick }],
    });

    fireEvent.click(screen.getByTestId('loop-header-chip-entry'));

    expect(onChipClick).toHaveBeenCalledTimes(1);
  });

  it('renders an instance-supplied description under the title', () => {
    renderLoopNode({
      data: { display: { description: 'Collect and verify claim documents' } },
    });

    expect(screen.getByTestId('loop-node-header-description').textContent).toBe(
      'Collect and verify claim documents'
    );
  });

  it('does not render the manifest description on the canvas', () => {
    mockManifest.current = {
      display: {
        label: 'Loop',
        icon: 'repeat',
        shape: 'container',
        description: 'Manifest copy',
      },
      handleConfiguration: [],
    };

    renderLoopNode();

    expect(screen.queryByTestId('loop-node-header-description')).toBeNull();
  });
});

describe('LoopNode always-visible handle groups', () => {
  const innerGroup = (alwaysVisible: boolean) => ({
    position: 'right',
    boundary: 'inner',
    ...(alwaysVisible ? { alwaysVisible: true } : {}),
    handles: [{ id: 'onComplete', label: 'Complete', type: 'target', handleType: 'input' }],
  });

  function labelElement() {
    const label = screen.getByText('Complete');
    // The opacity class lives on the pill wrapper around the label text.
    return label.parentElement as HTMLElement;
  }

  it('renders handle labels at all times when the group is alwaysVisible', () => {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container' },
      handleConfiguration: [innerGroup(true)],
    };

    renderLoopNode();

    expect(labelElement().className).toContain('opacity-100');
  });

  it('keeps handle labels hover-gated when the group is not alwaysVisible', () => {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container' },
      handleConfiguration: [innerGroup(false)],
    };

    renderLoopNode();

    expect(labelElement().className).toContain('opacity-0');
  });
});

describe('LoopNode header mode pill', () => {
  it('shows the Sequential mode pill by default', () => {
    renderLoopNode();

    expect(screen.getByText('Sequential')).toBeTruthy();
  });

  it('hides the mode pill when display.showModePill is false', () => {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container', showModePill: false },
      handleConfiguration: [],
    };

    renderLoopNode();

    expect(screen.queryByText('Sequential')).toBeNull();
    expect(screen.queryByText('Parallel')).toBeNull();
  });
});

describe('LoopNode draggable handle pills', () => {
  it('marks pills of draggable handles as drag grips', () => {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container' },
      handleConfiguration: [
        {
          position: 'right',
          boundary: 'inner',
          alwaysVisible: true,
          handles: [
            {
              id: 'onComplete',
              label: 'Complete',
              type: 'target',
              handleType: 'input',
              draggableWalls: ['right', 'bottom'],
              dragMirrors: 'complete',
            },
          ],
        },
      ],
    };

    renderLoopNode();

    const pill = screen.getByText('Complete').parentElement as HTMLElement;
    expect(pill.className).toContain('cursor-grab');
    expect(pill.className).toContain('nodrag');
  });

  it('keeps pills of fixed handles non-interactive', () => {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container' },
      handleConfiguration: [
        {
          position: 'right',
          boundary: 'inner',
          alwaysVisible: true,
          handles: [{ id: 'onComplete', label: 'Complete', type: 'target', handleType: 'input' }],
        },
      ],
    };

    renderLoopNode();

    const pill = screen.getByText('Complete').parentElement as HTMLElement;
    expect(pill.className).toContain('pointer-events-none');
    expect(pill.className).not.toContain('cursor-grab');
  });
});
