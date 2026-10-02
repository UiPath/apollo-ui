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
