import { fireEvent, render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContainerNodeData } from './ContainerNode.types';

const {
  mockUpdateNodeData,
  mockButtonHandles,
  mockExecutionState,
  mockGetContainerResizeMinimums,
  mockManifest,
  mockNodeToolbar,
  mockReadOnlyNodeIds,
  mockValidationState,
} = vi.hoisted(() => ({
  mockUpdateNodeData: vi.fn(),
  // biome-ignore lint/suspicious/noExplicitAny: captures the handle group props for assertions
  mockButtonHandles: vi.fn() as any,
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
  // biome-ignore lint/suspicious/noExplicitAny: captures the toolbar props for assertions
  mockNodeToolbar: vi.fn() as any,
  mockReadOnlyNodeIds: { current: new Set<string>() as ReadonlySet<string> },
  mockValidationState: { current: undefined as unknown },
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
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
  useReactFlow: () => ({ updateNodeData: mockUpdateNodeData }),
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
  useToolbarActionStoreContext: () => undefined,
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

vi.mock('../BaseCanvas/ReadOnlyNodesContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../BaseCanvas/ReadOnlyNodesContext')>()),
  useIsNodeReadOnly: (nodeId: string) => mockReadOnlyNodeIds.current.has(nodeId),
}));

vi.mock('../ButtonHandle', () => ({
  ButtonHandles: (props: Record<string, unknown>) => {
    mockButtonHandles(props);
    return null;
  },
}));

vi.mock('../Toolbar', () => ({
  NodeToolbar: (props: Record<string, unknown>) => {
    mockNodeToolbar(props);
    return null;
  },
}));

import { LoopNode } from '../LoopNode/LoopNode';
import { StageHeaderChipType } from '../StageNode/StageNode.types';
import { ContainerCanvasNode } from './ContainerCanvasNode';
import { ContainerNode } from './ContainerNode';

const defaultProps: NodeProps<Node<ContainerNodeData>> = {
  id: 'container-1',
  type: 'container',
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

type ContainerProps = Partial<React.ComponentProps<typeof ContainerNode>>;

function renderContainer(props: ContainerProps = {}) {
  render(<ContainerNode {...defaultProps} {...props} />);
  return getRoot();
}

function getRoot() {
  return document.querySelector('[data-container]') as HTMLElement;
}

function getHeader() {
  return document.querySelector('[data-container-header]') as HTMLElement;
}

function setContainerDisplay(container: Record<string, unknown> | undefined) {
  mockManifest.current = {
    display: { label: 'Error handler', icon: 'triangle-alert', shape: 'container', container },
    handleConfiguration: [],
  };
}

beforeEach(() => {
  mockUpdateNodeData.mockClear();
  mockExecutionState.current = undefined;
  mockReadOnlyNodeIds.current = new Set<string>();
  mockValidationState.current = undefined;
  setContainerDisplay(undefined);
});

describe('ContainerNode root', () => {
  it('exposes a labelled group with the container kind', () => {
    const root = renderContainer({ kind: 'error-handler', className: 'host-class' });

    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('Error handler');
    expect(root.getAttribute('data-container-kind')).toBe('error-handler');
    expect(root.hasAttribute('data-loop-container')).toBe(false);
    expect(root.className).toContain('host-class');
  });

  it('defaults the kind to container and uses generic test ids', () => {
    const root = renderContainer();

    expect(root.getAttribute('data-container-kind')).toBe('container');
    expect(screen.getByTestId('container-node-header')).toBeTruthy();
    expect(screen.getByTestId('container-body-frame')).toBeTruthy();
    expect(screen.queryByTestId('loop-node-header')).toBeNull();
  });

  it('takes the kind from the manifest when no prop is passed', () => {
    setContainerDisplay({ kind: 'scope' });

    expect(renderContainer().getAttribute('data-container-kind')).toBe('scope');
  });

  // reactflow-reset.css keys the sticky-note stacking rules off [data-container].
  it.each(['container', 'error-handler', 'loop'])('sets data-container for kind %s', (kind) => {
    expect(renderContainer({ kind }).hasAttribute('data-container')).toBe(true);
  });
});

describe('ContainerNode header', () => {
  it('renders no badge by default', () => {
    renderContainer();

    expect(getHeader().children).toHaveLength(1);
  });

  it('renders a text badge from the manifest', () => {
    setContainerDisplay({ badge: 'Catch' });
    renderContainer();

    expect(screen.getByText('Catch')).toBeTruthy();
  });

  it('lets headerBadges override the manifest badge', () => {
    setContainerDisplay({ badge: 'Catch' });
    renderContainer({ headerBadges: <span>From props</span> });

    expect(screen.queryByText('Catch')).toBeNull();
    expect(screen.getByText('From props')).toBeTruthy();
  });

  it('lets headerBadges={null} hide the preset badge', () => {
    renderContainer({
      defaults: { headerBadges: <span>Preset badge</span> },
      headerBadges: null,
    });

    expect(screen.queryByText('Preset badge')).toBeNull();
  });

  it('lets badge: false in the manifest hide the preset badge', () => {
    setContainerDisplay({ badge: false });
    renderContainer({ defaults: { headerBadges: <span>Preset badge</span> } });

    expect(screen.queryByText('Preset badge')).toBeNull();
  });

  it('renders headerEnd before the badges', () => {
    renderContainer({
      headerBadges: <span>Badge</span>,
      headerEnd: <span>End</span>,
    });

    const trailing = screen.getByText('Badge').parentElement as HTMLElement;
    expect(Array.from(trailing.children).map((child) => child.textContent)).toEqual([
      'End',
      'Badge',
    ]);
  });

  it('renders the subtitle, with props winning over the manifest', () => {
    setContainerDisplay({ subtitle: 'From manifest' });
    const { unmount } = render(<ContainerNode {...defaultProps} />);
    expect(screen.getByText('From manifest')).toBeTruthy();
    unmount();

    renderContainer({ subtitle: 'From props' });
    expect(screen.getByText('From props')).toBeTruthy();
    expect(screen.queryByText('From manifest')).toBeNull();
  });

  it('passes the default parts to renderHeader', () => {
    const renderHeader = vi.fn(({ title, badges }) => (
      <div data-testid="custom-header">
        {title}
        {badges}
      </div>
    ));
    renderContainer({ renderHeader, headerBadges: <span>Badge</span>, subtitle: 'Sub' });

    expect(screen.getByTestId('custom-header').textContent).toBe('Error handlerBadge');
    const parts = renderHeader.mock.calls[0]?.[0];
    expect(parts).toMatchObject({ subtitle: expect.anything(), badges: expect.anything() });
    expect(parts.icon).toBeTruthy();
    // The header shell stays so drag and adornment spacing keep working.
    expect(getHeader().getAttribute('data-testid')).toBe('container-node-header');
  });

  it('falls back to the preset icon, then the generic icon, when the manifest has none', () => {
    mockManifest.current = {
      display: { label: 'Error handler', shape: 'container' },
      handleConfiguration: [],
    };
    const { unmount } = render(<ContainerNode {...defaultProps} defaults={{ icon: 'repeat' }} />);
    expect(screen.getByTestId('canvas-icon-repeat')).toBeTruthy();
    unmount();

    renderContainer();
    expect(screen.getByTestId('canvas-icon-box')).toBeTruthy();
  });
});

describe('ContainerNode empty state', () => {
  it('uses the default label', () => {
    renderContainer({ onAddFirstChild: vi.fn() });

    expect(screen.getByRole('button', { name: 'Add node to container' })).toBeTruthy();
  });

  it('uses the manifest label, then the prop label', () => {
    setContainerDisplay({ emptyStateLabel: 'Add a step to run on error' });
    const { unmount } = render(<ContainerNode {...defaultProps} onAddFirstChild={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add a step to run on error' })).toBeTruthy();
    unmount();

    renderContainer({ onAddFirstChild: vi.fn(), emptyStateLabel: 'From props' });
    expect(screen.getByRole('button', { name: 'From props' })).toBeTruthy();
  });

  it('calls onAddFirstChild from the button', () => {
    const onAddFirstChild = vi.fn();
    renderContainer({ onAddFirstChild });

    fireEvent.click(screen.getByRole('button', { name: 'Add node to container' }));
    expect(onAddFirstChild).toHaveBeenCalledTimes(1);
  });

  it('replaces the button with renderEmptyState', () => {
    const onAddFirstChild = vi.fn();
    renderContainer({
      onAddFirstChild,
      renderEmptyState: ({ onAddFirstChild: add, isLoading }) => (
        <button type="button" onClick={add}>
          Custom {isLoading ? 'loading' : 'ready'}
        </button>
      ),
    });

    expect(screen.queryByRole('button', { name: 'Add node to container' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Custom ready' }));
    expect(onAddFirstChild).toHaveBeenCalledTimes(1);
  });

  it('shows renderEmptyState even without onAddFirstChild', () => {
    renderContainer({ renderEmptyState: () => <span>Nothing here yet</span> });

    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });

  it('hides the empty state when the node is read-only', () => {
    mockReadOnlyNodeIds.current = new Set(['container-1']);
    renderContainer({ onAddFirstChild: vi.fn() });

    expect(screen.queryByRole('button', { name: 'Add node to container' })).toBeNull();
  });
});

describe('ContainerNode appearance', () => {
  it('uses the solid default frame and dashed body', () => {
    const root = renderContainer();

    expect(root.className).toContain('border-border');
    expect(root.className).not.toContain('border-dashed');
    expect(root.className).toContain('rounded-[20px]');
    expect(screen.getByTestId('container-body-frame').getAttribute('data-body-frame')).toBe(
      'dashed'
    );
  });

  it('applies the manifest appearance', () => {
    setContainerDisplay({
      borderStyle: 'dashed',
      accent: 'warning',
      radius: 'xl',
      bodyFrame: 'solid',
    });
    const root = renderContainer();

    expect(root.className).toContain('border-dashed');
    expect(root.className).toContain('border-warning');
    expect(root.className).toContain('rounded-xl');
    expect(screen.getByTestId('container-body-frame').getAttribute('data-body-frame')).toBe(
      'solid'
    );
  });

  it('merges appearance props over the manifest field by field', () => {
    setContainerDisplay({ borderStyle: 'dashed', accent: 'warning' });
    const root = renderContainer({ appearance: { accent: 'error' }, bodyFrame: 'none' });

    expect(root.className).toContain('border-dashed');
    expect(root.className).toContain('border-error');
    expect(root.className).not.toContain('border-warning');
    expect(screen.getByTestId('container-body-frame').getAttribute('data-body-frame')).toBe('none');
  });

  it('lets a status border win over the accent', () => {
    mockExecutionState.current = 'Failed';
    const root = renderContainer({ appearance: { accent: 'warning' } });

    expect(root.className).toContain('border-error');
    expect(root.className).not.toContain('border-warning');
  });
});

describe('LoopNode preset', () => {
  function renderLoop(props: Partial<React.ComponentProps<typeof LoopNode>> = {}) {
    render(<LoopNode {...defaultProps} {...props} />);
    return document.querySelector('[data-loop-container]') as HTMLElement;
  }

  it('keeps the loop markers and mode pill', () => {
    mockManifest.current = {
      display: { label: 'Loop', icon: 'repeat', shape: 'container' },
      handleConfiguration: [],
    };
    const root = renderLoop({ onAddFirstChild: vi.fn() });

    expect(root.getAttribute('data-container-kind')).toBe('loop');
    expect(screen.getByTestId('loop-node-header')).toBeTruthy();
    expect(screen.getByTestId('loop-body-frame')).toBeTruthy();
    expect(screen.getByText('Sequential')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add node to loop' })).toBeTruthy();
  });

  it('lets props and the manifest override the loop defaults', () => {
    setContainerDisplay({ badge: false, emptyStateLabel: 'From manifest' });
    renderLoop({ onAddFirstChild: vi.fn() });

    expect(screen.queryByText('Sequential')).toBeNull();
    expect(screen.getByRole('button', { name: 'From manifest' })).toBeTruthy();
  });
});

describe('ContainerCanvasNode preset selection', () => {
  const innerEntryHandle = [
    {
      position: 'left',
      boundary: 'inner',
      handles: [{ id: 'entry', type: 'source', handleType: 'output' }],
    },
  ];

  it('uses the loop preset when the manifest has no display.container', () => {
    mockManifest.current = {
      display: { label: 'Loop', icon: 'repeat', shape: 'container' },
      handleConfiguration: [],
    };
    render(<ContainerCanvasNode {...defaultProps} />);

    expect(getRoot().getAttribute('data-container-kind')).toBe('loop');
    expect(screen.getByText('Sequential')).toBeTruthy();
  });

  it('uses the generic container when the manifest sets display.container', () => {
    mockManifest.current = {
      display: {
        label: 'Error handler',
        icon: 'triangle-alert',
        shape: 'container',
        container: { kind: 'error-handler', emptyStateLabel: 'Add a step to run on error' },
      },
      handleConfiguration: innerEntryHandle,
    };
    render(<ContainerCanvasNode {...defaultProps} />);

    expect(getRoot().getAttribute('data-container-kind')).toBe('error-handler');
    expect(screen.queryByText('Sequential')).toBeNull();
    // An inner source handle alone is enough for the add-first-step button.
    expect(screen.getByRole('button', { name: 'Add a step to run on error' })).toBeTruthy();
  });

  it('keeps the loop preset when display.container sets kind: loop', () => {
    mockManifest.current = {
      display: {
        label: 'Loop',
        icon: 'repeat',
        shape: 'container',
        container: { kind: 'loop', subtitle: 'For each item' },
      },
      handleConfiguration: [],
    };
    render(<ContainerCanvasNode {...defaultProps} />);

    expect(screen.getByText('Sequential')).toBeTruthy();
    expect(screen.getByText('For each item')).toBeTruthy();
  });
});

describe('ContainerNode inline label editing', () => {
  function titleEl() {
    return screen.getByTestId('container-node-title');
  }

  it('is off by default', () => {
    renderContainer({ selected: true });

    fireEvent.doubleClick(titleEl());
    expect(screen.queryByRole('textbox', { name: 'Edit container name' })).toBeNull();
  });

  it('renames the title and subtitle when enabled', () => {
    renderContainer({ selected: true, labelEditable: true, data: { display: { foo: 1 } } });

    fireEvent.doubleClick(titleEl());
    const title = screen.getByRole('textbox', { name: 'Edit container name' });
    const subtitle = screen.getByRole('textbox', { name: 'Edit container description' });
    expect((title as HTMLTextAreaElement).value).toBe('Error handler');

    fireEvent.change(title, { target: { value: '  On failure  ' } });
    fireEvent.change(subtitle, { target: { value: 'Retries twice' } });
    fireEvent.keyDown(subtitle, { key: 'Enter' });

    expect(mockUpdateNodeData).toHaveBeenCalledWith('container-1', {
      display: { foo: 1, label: 'On failure', subLabel: 'Retries twice' },
    });
  });

  it('can be enabled from the manifest', () => {
    setContainerDisplay({ labelEditable: true });
    renderContainer({ selected: true });

    fireEvent.doubleClick(titleEl());
    expect(screen.getByRole('textbox', { name: 'Edit container name' })).toBeTruthy();
  });

  it('lets the prop turn editing off over the manifest', () => {
    setContainerDisplay({ labelEditable: true });
    renderContainer({ selected: true, labelEditable: false });

    fireEvent.doubleClick(titleEl());
    expect(screen.queryByRole('textbox', { name: 'Edit container name' })).toBeNull();
  });

  it('cancels on Escape without writing', () => {
    renderContainer({ selected: true, labelEditable: true });

    fireEvent.doubleClick(titleEl());
    const title = screen.getByRole('textbox', { name: 'Edit container name' });
    fireEvent.change(title, { target: { value: 'Changed' } });
    fireEvent.keyDown(title, { key: 'Escape' });

    expect(mockUpdateNodeData).not.toHaveBeenCalled();
    expect(titleEl().textContent).toBe('Error handler');
  });

  it('removes a cleared subtitle so the manifest subtitle shows again', () => {
    setContainerDisplay({ subtitle: 'From manifest' });
    renderContainer({
      selected: true,
      labelEditable: true,
      data: { display: { subLabel: 'From node' } },
    });

    expect(screen.getByText('From node')).toBeTruthy();
    fireEvent.doubleClick(screen.getByTestId('container-node-subtitle'));
    const subtitle = screen.getByRole('textbox', { name: 'Edit container description' });
    expect((subtitle as HTMLTextAreaElement).value).toBe('From node');
    fireEvent.change(subtitle, { target: { value: '' } });
    fireEvent.keyDown(subtitle, { key: 'Enter' });

    expect(mockUpdateNodeData).toHaveBeenCalledWith('container-1', { display: {} });
  });

  it('does not offer the subtitle when it comes from a prop', () => {
    renderContainer({ selected: true, labelEditable: true, subtitle: 'Fixed' });

    fireEvent.doubleClick(titleEl());
    expect(screen.queryByRole('textbox', { name: 'Edit container description' })).toBeNull();
    const title = screen.getByRole('textbox', { name: 'Edit container name' });
    fireEvent.change(title, { target: { value: 'Renamed' } });
    fireEvent.keyDown(title, { key: 'Enter' });

    expect(mockUpdateNodeData).toHaveBeenCalledWith('container-1', {
      display: { label: 'Renamed' },
    });
  });

  it('is not editable when the node is locked', () => {
    mockReadOnlyNodeIds.current = new Set(['container-1']);
    renderContainer({ selected: true, labelEditable: true });

    fireEvent.doubleClick(titleEl());
    expect(screen.queryByRole('textbox', { name: 'Edit container name' })).toBeNull();
  });

  it('commits the draft when the node is deselected', () => {
    const { rerender } = render(<ContainerNode {...defaultProps} selected labelEditable />);

    fireEvent.doubleClick(titleEl());
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit container name' }), {
      target: { value: 'Renamed' },
    });
    rerender(<ContainerNode {...defaultProps} selected={false} labelEditable />);

    expect(mockUpdateNodeData).toHaveBeenCalledWith('container-1', {
      display: { label: 'Renamed' },
    });
  });

  it('works on loops when enabled', () => {
    mockManifest.current = {
      display: { label: 'Loop', icon: 'repeat', shape: 'container' },
      handleConfiguration: [],
    };
    render(<LoopNode {...defaultProps} selected labelEditable />);

    fireEvent.doubleClick(titleEl());
    expect(screen.getByRole('textbox', { name: 'Edit container name' })).toBeTruthy();
  });
});

describe('ContainerNode header chips', () => {
  it('renders no chip row by default', () => {
    renderContainer();

    expect(screen.queryByTestId('container-header-chips')).toBeNull();
  });

  it('renders rule chips from the headerChips prop', () => {
    renderContainer({
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 2 },
        { type: StageHeaderChipType.Completion, count: 1 },
        { type: StageHeaderChipType.Exit, count: 3 },
      ],
    });

    expect(screen.getByTestId('container-header-chips')).toBeTruthy();
    expect(screen.getByTestId('container-header-chip-entry').textContent).toContain('2');
    expect(screen.getByTestId('container-header-chip-completion').textContent).toContain('1');
    expect(screen.getByTestId('container-header-chip-exit').textContent).toContain('3');
  });

  it('renders chips from node data when no prop is set, and lets the prop win', () => {
    const { unmount } = render(
      <ContainerNode
        {...defaultProps}
        data={{ headerChips: [{ type: StageHeaderChipType.ReturnToOrigin, count: 1 }] }}
      />
    );
    expect(screen.getByTestId('container-header-chip-returnToOrigin')).toBeTruthy();
    unmount();

    renderContainer({
      data: { headerChips: [{ type: StageHeaderChipType.Exit, count: 9 }] },
      headerChips: [{ type: StageHeaderChipType.Entry, count: 1 }],
    });
    expect(screen.getByTestId('container-header-chip-entry')).toBeTruthy();
    expect(screen.queryByTestId('container-header-chip-exit')).toBeNull();
  });

  it('renders localized status pills for Optional and EndsCase chips', () => {
    renderContainer({
      headerChips: [{ type: StageHeaderChipType.Optional }, { type: StageHeaderChipType.EndsCase }],
    });

    expect(screen.getByTestId('container-header-chip-optional').textContent).toContain('Optional');
    expect(screen.getByTestId('container-header-chip-endsCase').textContent).toContain('Ends case');
  });

  it('invokes chip onClick', () => {
    const onChipClick = vi.fn();
    renderContainer({
      headerChips: [{ type: StageHeaderChipType.Entry, count: 2, onClick: onChipClick }],
    });

    fireEvent.click(screen.getByTestId('container-header-chip-entry'));

    expect(onChipClick).toHaveBeenCalledTimes(1);
  });

  it('stacks the chip row under an intact title row', () => {
    renderContainer({
      headerChips: [{ type: StageHeaderChipType.Entry, count: 1 }],
      headerBadges: <span>Badge</span>,
    });

    const header = getHeader();
    expect(header.className).toContain('flex-col');
    expect(header.children).toHaveLength(2);
    expect(header.lastElementChild?.getAttribute('data-testid')).toBe('container-header-chips');
    expect(screen.getByText('Badge')).toBeTruthy();
  });

  it('passes the chip row to renderHeader', () => {
    const renderHeader = vi.fn(({ title, chips }) => (
      <div data-testid="custom-header">
        {title}
        {chips}
      </div>
    ));
    renderContainer({ renderHeader, headerChips: [{ type: StageHeaderChipType.Entry, count: 4 }] });

    expect(screen.getByTestId('custom-header').textContent).toContain('4');
  });
});

describe('ContainerNode text wrapping', () => {
  it('truncates the title and subtitle by default', () => {
    renderContainer({ subtitle: 'Sub' });

    expect(screen.getByTestId('container-node-title').className).toContain('truncate');
    expect(screen.getByTestId('container-node-subtitle').className).toContain('truncate');
  });

  it('clamps them at two lines when the manifest sets wrapText', () => {
    setContainerDisplay({ wrapText: true, subtitle: 'From manifest' });
    renderContainer();

    expect(screen.getByTestId('container-node-title').className).toContain('line-clamp-2');
    expect(screen.getByTestId('container-node-subtitle').className).toContain('line-clamp-2');
  });

  it('lets the prop turn wrapping off over the manifest', () => {
    setContainerDisplay({ wrapText: true });
    renderContainer({ wrapText: false });

    expect(screen.getByTestId('container-node-title').className).toContain('truncate');
  });
});

describe('ContainerNode handle groups', () => {
  const innerGroup = (extra: Record<string, unknown>) => ({
    position: 'right',
    boundary: 'inner',
    ...extra,
    handles: [{ id: 'onComplete', label: 'Complete', type: 'target', handleType: 'input' }],
  });
  const lastGroupProps = () => mockButtonHandles.mock.calls.at(-1)?.[0];

  function renderWithGroup(extra: Record<string, unknown>) {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container' },
      handleConfiguration: [innerGroup(extra)],
    };
    mockButtonHandles.mockClear();
    renderContainer();
  }

  it('shows alwaysVisible groups without hover or selection', () => {
    renderWithGroup({ alwaysVisible: true });

    expect(lastGroupProps().handles[0].showHandle).toBe(true);
  });

  it('keeps other groups hover-gated', () => {
    renderWithGroup({});

    expect(lastGroupProps().handles[0].showHandle).toBe(false);
  });

  it('forwards slotCount to the handle layout', () => {
    renderWithGroup({ slotCount: 2 });

    expect(lastGroupProps().slotCount).toBe(2);
  });
});

describe('ContainerNode draggable handle pills', () => {
  const lastGroupProps = () => mockButtonHandles.mock.calls.at(-1)?.[0];

  function renderWithHandle(handle: Record<string, unknown>, data?: Record<string, unknown>) {
    mockManifest.current = {
      display: { label: 'Stage', icon: 'repeat', shape: 'container' },
      handleConfiguration: [
        {
          position: 'right',
          boundary: 'inner',
          alwaysVisible: true,
          handles: [
            { id: 'onComplete', label: 'Complete', type: 'target', handleType: 'input', ...handle },
          ],
        },
      ],
    };
    mockButtonHandles.mockClear();
    renderContainer(data ? { data } : {});
  }

  it('turns pills of draggable handles into drag grips', () => {
    renderWithHandle({ draggableWalls: ['right', 'bottom'], dragMirrors: 'complete' });

    expect(typeof lastGroupProps().handles[0].onLabelPointerDown).toBe('function');
  });

  it('keeps pills of fixed handles non-interactive', () => {
    renderWithHandle({});

    expect(lastGroupProps().handles[0].onLabelPointerDown).toBeUndefined();
  });

  it('does not offer the grip when the node is locked', () => {
    mockReadOnlyNodeIds.current = new Set(['container-1']);
    renderWithHandle({ draggableWalls: ['right'] });

    expect(lastGroupProps().handles[0].onLabelPointerDown).toBeUndefined();
  });

  it('renders a dragged handle on its stored wall and offset', () => {
    renderWithHandle(
      { draggableWalls: ['right', 'bottom'] },
      { handleOffsets: { onComplete: { position: 'bottom', offset: 160 } } }
    );

    const props = lastGroupProps();
    expect(props.position).toBe('bottom');
    expect(props.handles[0].offsetPx).toBe(160);
    // Synthetic single-handle groups drop the slot layout.
    expect(props.slotCount).toBeUndefined();
  });
});
