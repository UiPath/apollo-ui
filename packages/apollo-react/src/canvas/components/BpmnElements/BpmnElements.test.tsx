import userEvent from '@testing-library/user-event';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Position,
  ReactFlow,
  ReactFlowProvider,
  useStoreApi,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '../../utils/testing';
import { BaseCanvasModeProvider } from '../BaseCanvas';
import {
  type BpmnActions,
  BpmnActionsProvider,
  BpmnActivityNode,
  BpmnDataNode,
  type BpmnEdge,
  BpmnEventNode,
  BpmnGatewayNode,
  BpmnGroupNode,
  type BpmnNode,
  type BpmnNodeData,
  BpmnOverlayProvider,
  BpmnStringsProvider,
  BpmnSwimlaneNode,
  BpmnTextAnnotationNode,
  bpmnEdgeTypes,
  bpmnHandleId,
  bpmnHandleSide,
  bpmnNodeTypes,
} from '.';

// The shared setup mocks XYFlow; these components are checked against the real one.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

const actions = new Proxy({}, { get: () => vi.fn() }) as BpmnActions;

// Without layout in happy-dom a node is never measured, so fixed dimensions make it visible.
const node = (id: string, type: string, x: number, data: BpmnNodeData = {}): BpmnNode => ({
  id,
  type,
  position: { x, y: 0 },
  width: 100,
  height: 80,
  data,
});

let store: ReturnType<typeof useStoreApi>;
function StoreProbe() {
  store = useStoreApi();
  return null;
}

type NodeOptions = {
  Component?: React.ComponentType<NodeProps<BpmnNode>>;
  type?: string;
  data?: BpmnNodeData;
  selected?: boolean;
  value?: BpmnActions;
  strings?: React.ComponentProps<typeof BpmnStringsProvider>['strings'];
  mode?: React.ComponentProps<typeof BaseCanvasModeProvider>['mode'];
};

/** One element, `task`, outside a ReactFlow; an activity unless another `Component` is given. */
const nodeTree = ({
  Component = BpmnActivityNode,
  type = 'bpmn:UserTask',
  data = {},
  selected = false,
  value = actions,
  strings,
  mode,
}: NodeOptions = {}) => {
  const element = (
    <BpmnStringsProvider strings={strings}>
      <BpmnActionsProvider value={value}>
        <Component
          {...({ id: 'task', type, data, selected, width: 100, height: 80 } as NodeProps<BpmnNode>)}
        />
      </BpmnActionsProvider>
    </BpmnStringsProvider>
  );
  return (
    <ReactFlowProvider>
      <StoreProbe />
      {mode ? <BaseCanvasModeProvider mode={mode}>{element}</BaseCanvasModeProvider> : element}
    </ReactFlowProvider>
  );
};

/** Renders {@link nodeTree}; `rerender` merges new options over the first ones. */
const renderNode = (options: NodeOptions = {}) => {
  const result = render(nodeTree(options));
  return {
    ...result,
    rerender: (next: NodeOptions) => result.rerender(nodeTree({ ...options, ...next })),
  };
};

const renderFlow = (
  nodes: BpmnNode[],
  { edges, overlay = null }: { edges?: BpmnEdge[]; overlay?: { zIndex: number } | null } = {}
) =>
  render(
    <div style={{ width: 800, height: 600 }}>
      <BpmnOverlayProvider value={overlay}>
        <BpmnActionsProvider value={actions}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={bpmnNodeTypes}
            edgeTypes={bpmnEdgeTypes}
          />
        </BpmnActionsProvider>
      </BpmnOverlayProvider>
    </div>
  );

const rename = vi.fn();
const minimalActions = {
  addAfter: vi.fn(),
  rename,
  deleteEdge: vi.fn(),
  setWaypoints: vi.fn(),
} satisfies BpmnActions;
const requiredActions = { ...minimalActions, deleteNode: vi.fn() } satisfies BpmnActions;

beforeEach(() => {
  rename.mockReset();
});

const toolbarButtons = () =>
  screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'))
    .filter((name) => name && name !== 'Add node');

const handle = (kind: 'source' | 'target', side: Position) =>
  document.querySelector(`[data-handleid="${bpmnHandleId('task', kind, side)}"]`) as HTMLElement;

describe('BPMN element family', () => {
  it('renders in a plain ReactFlow, with no canvas mode provider', () => {
    renderFlow(
      [
        node('start', 'bpmn:StartEvent', 0),
        node('task', 'bpmn:UserTask', 200, { label: 'Review' }),
        node('gateway', 'bpmn:ExclusiveGateway', 400),
      ],
      {
        edges: [
          {
            id: 'flow',
            type: 'bpmn:SequenceFlow',
            source: 'start',
            sourceHandle: bpmnHandleId('start', 'source', Position.Right),
            target: 'task',
            targetHandle: bpmnHandleId('task', 'target', Position.Left),
          },
        ],
      }
    );

    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(document.querySelectorAll('.react-flow__node')).toHaveLength(3);
  });

  it('offers a "+" named after the node and the side on hover, with no mode provider', async () => {
    const user = userEvent.setup();
    renderNode({ data: { label: 'Review' } });

    await user.hover(screen.getByText('Review'));

    for (const side of ['top', 'right', 'bottom']) {
      expect(screen.getByTestId(`quick-add-handle-task-${side}`)).toHaveAttribute(
        'aria-label',
        'Add node'
      );
    }
    expect(screen.queryByTestId('quick-add-handle-task-left')).not.toBeInTheDocument();
  });

  it('gives an empty editable label somewhere to double-click', () => {
    renderNode({ selected: true });

    const text = document.querySelector('[data-node-part="label"]')!.firstElementChild!;
    expect(text.className).toContain('min-w-12');
    fireEvent.doubleClick(text);
    expect(screen.getByLabelText('Edit label')).toBeInTheDocument();
  });

  it('outlines a data object and a data store differently', () => {
    const outline = () =>
      screen.getByTestId('base-node-outline').querySelector('path')?.getAttribute('d');
    const { rerender } = renderNode({ Component: BpmnDataNode, type: 'bpmn:DataObjectReference' });
    const dataObject = outline();

    rerender({ type: 'bpmn:DataStoreReference' });

    expect(dataObject).toBeTruthy();
    expect(outline()).toBeTruthy();
    expect(outline()).not.toBe(dataObject);
  });

  describe('glyphs', () => {
    const badge = () => document.querySelector('[data-testid="host-icon"]');

    it("shows data.icon in place of the task type's own glyph", () => {
      const { container, rerender } = renderNode({ data: { label: 'Review' } });
      const glyphCount = container.querySelectorAll('svg').length;
      expect(badge()).toBeNull();
      expect(glyphCount).toBeGreaterThan(0);

      rerender({ data: { label: 'Review', icon: <span data-testid="host-icon" /> } });

      expect(badge()).not.toBeNull();
      expect(container.querySelectorAll('svg')).toHaveLength(glyphCount - 1);
    });

    it('shows data.icon on a task type that has no glyph', () => {
      renderNode({
        type: 'bpmn:Task',
        data: { label: 'Review', icon: <span data-testid="host-icon" /> },
      });

      expect(badge()).not.toBeNull();
    });

    it('renders an event whose definition has no glyph instead of throwing', () => {
      expect(() =>
        renderNode({
          Component: BpmnEventNode,
          type: 'bpmn:StartEvent',
          data: { eventDefinition: 'cancel' as never },
        })
      ).not.toThrow();
    });
  });

  describe('handles', () => {
    it('starts connections only from source handles and ends them only on targets, on every side', () => {
      renderNode();

      for (const side of [Position.Top, Position.Right, Position.Bottom, Position.Left]) {
        expect(handle('source', side)).toHaveClass('connectablestart');
        expect(handle('source', side)).not.toHaveClass('connectableend');
        expect(handle('target', side)).toHaveClass('connectableend');
        expect(handle('target', side)).not.toHaveClass('connectablestart');
        // Inert until a connection is in progress, so the body stays draggable.
        expect(handle('target', side)).not.toHaveClass('connectionindicator');
      }
    });

    it('reads the side of a handle whose node id contains the separator', () => {
      expect(bpmnHandleSide(bpmnHandleId('Task____1', 'source', Position.Right))).toBe(
        Position.Right
      );
    });
  });

  describe('toolbar', () => {
    it('shows every button in order, each with a test id, when the host handles them all', () => {
      renderNode({ data: { label: 'Review' }, selected: true });

      const toolbar = screen.getByTestId('node-toolbar');
      expect(toolbar).toHaveAttribute('role', 'toolbar');
      expect(
        within(toolbar)
          .getAllByRole('button')
          .map((button) => [button.dataset.testid, button.getAttribute('aria-label')])
      ).toEqual([
        ['toolbar-item-change-element', 'Change element'],
        ['toolbar-item-iteration', 'Iteration'],
        ['toolbar-item-boundary-event', 'Add boundary event'],
        ['toolbar-item-bpmn:TextAnnotation', 'Add text annotation'],
        ['toolbar-item-breakpoint', 'Toggle breakpoint'],
        ['toolbar-item-duplicate', 'Duplicate'],
        ['toolbar-item-delete', 'Delete'],
      ]);
    });

    it.each([
      [
        'every unhandled action',
        { ...requiredActions, duplicate: vi.fn() },
        ['Duplicate', 'Delete'],
      ],
      [
        'Delete when the host does not delete nodes',
        { ...minimalActions, duplicate: vi.fn() },
        ['Duplicate'],
      ],
    ])('leaves out the button of %s', (_, value, buttons) => {
      renderNode({ data: { label: 'Review' }, selected: true, value });

      expect(toolbarButtons()).toEqual(buttons);
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });

    it('renders no toolbar for a node left with no actions', () => {
      renderNode({ Component: BpmnGroupNode, selected: true, value: minimalActions });

      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it.each(['view', 'readonly'] as const)('has no toolbar in %s mode', (mode) => {
      renderNode({ data: { label: 'Review' }, selected: true, mode });

      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('offers a text annotation, after the boundary event, only when the host adds them', () => {
      const addAnnotation = vi.fn();
      const value = { ...requiredActions, addBoundaryEvent: vi.fn(), duplicate: vi.fn() };
      const { rerender } = renderNode({ data: { label: 'Review' }, selected: true, value });
      expect(screen.queryByTestId('toolbar-item-bpmn:TextAnnotation')).not.toBeInTheDocument();

      rerender({ value: { ...value, addAnnotation }, strings: { addAnnotation: 'Kommentar' } });

      expect(toolbarButtons()).toEqual(['Add boundary event', 'Kommentar', 'Duplicate', 'Delete']);
      fireEvent.click(screen.getByTestId('toolbar-item-bpmn:TextAnnotation'));
      expect(addAnnotation).toHaveBeenCalledWith('task');
    });

    it('offers "View" on a collapsed sub-process only when the host can drill in', () => {
      const options = { type: 'bpmn:SubProcess', data: { label: 'Ship' } };
      const { rerender } = renderNode({ ...options, value: requiredActions });
      expect(screen.queryByRole('button', { name: 'View Ship' })).not.toBeInTheDocument();

      const view = vi.fn();
      rerender({ value: { ...requiredActions, view } });
      expect(screen.getByTestId('drill-down-button-task')).toHaveAccessibleName('View Ship');
      fireEvent.click(screen.getByTestId('drill-down-button-task'));
      expect(view).toHaveBeenCalledWith('task');
    });

    it('does not scale the toolbar with the zoom by default', () => {
      renderNode({ data: { label: 'Review' }, selected: true });

      expect(screen.getByTestId('node-toolbar').closest('[style*="scale"]')).toBeNull();
    });
  });

  describe('click-to-connect', () => {
    it("hands a press on a source handle to the host's startConnection", () => {
      const startConnection = vi.fn();
      renderNode({ value: { ...requiredActions, startConnection } });

      fireEvent.pointerDown(handle('source', Position.Bottom));
      expect(startConnection).toHaveBeenCalledWith('task', Position.Bottom, expect.anything());

      fireEvent.pointerDown(handle('target', Position.Bottom));
      expect(startConnection).toHaveBeenCalledTimes(1);
    });

    it('hands over a press on the notch too', async () => {
      const user = userEvent.setup();
      const startConnection = vi.fn();
      renderNode({ data: { label: 'Review' }, value: { ...requiredActions, startConnection } });

      // The left side has no "+", so it shows its notch once the node is hovered.
      await user.hover(screen.getByText('Review'));
      const notch = document.querySelector(
        `[data-handle-grab-zone][data-handleid="${bpmnHandleId('task', 'source', Position.Left)}"]`
      ) as HTMLElement;
      fireEvent.pointerDown(notch);

      expect(startConnection).toHaveBeenCalledWith('task', Position.Left, expect.anything());
    });

    it("leaves the host's startConnection alone outside design mode", () => {
      const startConnection = vi.fn();
      renderNode({ mode: 'view', value: { ...requiredActions, startConnection } });

      fireEvent.pointerDown(handle('source', Position.Bottom));
      expect(startConnection).not.toHaveBeenCalled();
    });
  });

  describe('strings', () => {
    it("uses the host's strings and keeps English for the rest", () => {
      renderNode({
        data: { label: 'Review', breakpoint: true },
        selected: true,
        strings: { delete: 'Löschen', breakpoint: 'Haltepunkt' },
      });

      expect(toolbarButtons()).toContain('Löschen');
      expect(toolbarButtons()).toContain('Duplicate');
      expect(screen.getByRole('img', { name: 'Haltepunkt' })).toBeInTheDocument();
    });

    it('translates the sub-process "View" button', () => {
      renderNode({ type: 'bpmn:SubProcess', data: { label: 'Ship' }, strings: { view: 'Öffnen' } });

      expect(screen.getByRole('button', { name: 'Öffnen Ship' })).toHaveTextContent('Öffnen');
    });

    it('translates the label editor', () => {
      renderNode({
        data: { label: 'Review' },
        selected: true,
        strings: { editLabel: 'Namen bearbeiten' },
      });

      fireEvent.doubleClick(screen.getByText('Review'));

      expect(screen.getByLabelText('Namen bearbeiten')).toBeInTheDocument();
    });

    it('translates the accessible name of the "+"', async () => {
      const user = userEvent.setup();
      renderNode({ data: { label: 'Review' }, strings: { quickAdd: 'Knoten hinzufügen' } });

      await user.hover(screen.getByText('Review'));
      expect(screen.getAllByRole('button', { name: 'Knoten hinzufügen' }).length).toBeGreaterThan(
        0
      );
      expect(screen.queryByRole('button', { name: 'Add node' })).toBeNull();
    });
  });

  describe('resize', () => {
    const controls = () => document.querySelectorAll('.react-flow__resize-control');

    it('renders no resize controls unless the host handles resize', () => {
      renderNode({ Component: BpmnGroupNode, selected: true, value: requiredActions });

      expect(controls()).toHaveLength(0);
    });

    it('renders them on a selected resizable element when it does', () => {
      renderNode({
        Component: BpmnGroupNode,
        selected: true,
        value: { ...minimalActions, resize: vi.fn() },
      });

      expect(controls().length).toBeGreaterThan(0);
    });
  });

  describe('text annotation', () => {
    const annotation = (options: NodeOptions = {}) =>
      renderNode({
        Component: BpmnTextAnnotationNode,
        value: minimalActions,
        selected: true,
        ...options,
      });

    it('shows a placeholder for an empty label, which the host can translate', () => {
      annotation({ selected: false, strings: { annotationPlaceholder: 'Text hinzufügen' } });

      expect(screen.getByText('Text hinzufügen')).toHaveClass('text-foreground-muted');
    });

    it('shows the label unclamped, in place of the placeholder', () => {
      annotation({ data: { label: 'One\nTwo' } });

      expect(screen.queryByText('Add text')).not.toBeInTheDocument();
      expect(document.querySelector('[data-node-part="label"] div')).toHaveClass(
        'whitespace-pre-wrap'
      );
      expect(document.querySelector('.line-clamp-3')).toBeNull();
    });

    const editAnnotation = (label?: string) => {
      annotation({ data: { label } });
      fireEvent.doubleClick(screen.getByText(label ?? 'Add text'));
      return screen.getByLabelText('Edit label') as HTMLTextAreaElement;
    };

    it('stores every line on plain Enter', () => {
      const editor = editAnnotation();

      fireEvent.change(editor, { target: { value: 'One\nTwo' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Enter' });

      expect(rename).toHaveBeenCalledWith('task', 'One\nTwo');
      expect(screen.queryByLabelText('Edit label')).not.toBeInTheDocument();
    });

    it('leaves Shift+Enter to the textarea, which adds the line', () => {
      const editor = editAnnotation();

      // Not cancelled, so the textarea handles the key itself.
      expect(fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true })).toBe(true);

      expect(rename).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Edit label')).toBeInTheDocument();
    });

    it('adds a line at the caret on Alt+Enter and keeps editing', () => {
      const editor = editAnnotation('OneTwo');
      editor.setSelectionRange(3, 3);

      fireEvent.keyDown(editor, { key: 'Enter', altKey: true });

      expect(screen.getByLabelText('Edit label')).toHaveValue('One\nTwo');
      expect(rename).not.toHaveBeenCalled();
    });

    it('stores on blur', () => {
      const editor = editAnnotation();

      fireEvent.change(editor, { target: { value: 'One\nTwo' } });
      fireEvent.blur(screen.getByLabelText('Edit label'));

      expect(rename).toHaveBeenCalledWith('task', 'One\nTwo');
    });

    it('keeps a context menu on the editor from reaching the node', () => {
      const onContextMenu = vi.fn();
      render(
        <div onContextMenu={onContextMenu}>
          {nodeTree({
            Component: BpmnTextAnnotationNode,
            value: minimalActions,
            selected: true,
            data: { label: 'Note' },
          })}
        </div>
      );

      fireEvent.contextMenu(screen.getByText('Note'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);

      fireEvent.doubleClick(screen.getByText('Note'));
      fireEvent.contextMenu(screen.getByLabelText('Edit label'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    it('ends editing on Escape without storing', () => {
      annotation({ data: { label: 'Note' } });

      fireEvent.doubleClick(screen.getByText('Note'));
      fireEvent.change(screen.getByLabelText('Edit label'), { target: { value: 'Changed' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Escape' });

      expect(rename).not.toHaveBeenCalled();
      expect(screen.getByText('Note')).toBeInTheDocument();
    });
  });

  describe('overlay', () => {
    const OVERLAY = { zIndex: 2000 };
    const nodes = [
      { ...node('task', 'bpmn:UserTask', 40, { label: 'Review' }), selected: true },
      { ...node('end', 'bpmn:EndEvent', 300, { label: 'Done' }), width: 36, height: 36 },
    ];
    const nodeElement = (id: string) =>
      document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
    const overlayOf = (id: string) =>
      document.querySelector(`[data-bpmn-node-overlay="${id}"]`) as HTMLElement | null;

    it('keeps the toolbar, the handle visuals and the labels in the node by default', () => {
      renderFlow(nodes);

      expect(overlayOf('task')).toBeNull();
      expect(nodeElement('task').querySelector('[role="toolbar"]')).not.toBeNull();
      expect(nodeElement('task').querySelector('[data-handle-visuals]')).not.toBeNull();
      expect(document.querySelector('[data-bpmn-label-overlay]')).toBeNull();
    });

    it("draws a box at the node's position and size in the viewport portal, at the given z-index", () => {
      renderFlow(nodes, { overlay: OVERLAY });

      const box = overlayOf('task')!;
      expect(box.closest('.react-flow__viewport-portal')).not.toBeNull();
      expect(box.style.zIndex).toBe('2000');
      expect(box.style.left).toBe('40px');
      expect(box.style.top).toBe('0px');
      expect(box.style.width).toBe('100px');
      expect(box.style.height).toBe('80px');
    });

    it('marks the box with whether its node is selected', () => {
      renderFlow(nodes, { overlay: OVERLAY });

      expect(overlayOf('task')).toHaveAttribute('data-node-selected', 'true');
      expect(overlayOf('end')).toHaveAttribute('data-node-selected', 'false');
      expect(
        document.querySelector('[data-node-selected="true"] [data-testid="node-toolbar"]')
      ).not.toBeNull();
    });

    it('moves the toolbar and the handle visuals there, and leaves the handles in the node', () => {
      renderFlow(nodes, { overlay: OVERLAY });

      const box = overlayOf('task')!;
      expect(box.querySelector('[role="toolbar"]')).not.toBeNull();
      expect(box.querySelectorAll('[data-handle-visuals]')).toHaveLength(8);
      expect(nodeElement('task').querySelector('[role="toolbar"]')).toBeNull();
      expect(nodeElement('task').querySelector('[data-handle-visuals]')).toBeNull();
      expect(nodeElement('task').querySelectorAll('.react-flow__handle')).toHaveLength(8);
    });

    it('draws a label outside the element there, and keeps the one in the node to click', () => {
      renderFlow(nodes, { overlay: OVERLAY });

      const drawn = overlayOf('end')!.querySelector('[data-bpmn-label-overlay]')!;
      expect(drawn).toHaveTextContent('Done');
      expect(drawn).toHaveAttribute('aria-hidden', 'true');
      const inNode = nodeElement('end').querySelector('[data-node-part="label"]')!;
      expect(inNode).toHaveTextContent('Done');
      // A label inside its element is not lifted.
      expect(overlayOf('task')!.querySelector('[data-bpmn-label-overlay]')).toBeNull();
      expect(nodeElement('task').querySelector('[data-node-part="label"]')).toHaveTextContent(
        'Review'
      );
    });

    it('edits a lifted label in the overlay from a double-click on the one in the node', () => {
      renderFlow([{ ...nodes[1]!, selected: true }], { overlay: OVERLAY });

      fireEvent.doubleClick(
        nodeElement('end').querySelector('[data-node-part="label"]')!.firstElementChild!
      );

      expect(overlayOf('end')!.querySelector('textarea')).toHaveValue('Done');
    });

    it('carries the connection state to the box, where the outside label is drawn', () => {
      renderFlow(
        [
          {
            ...node('end', 'bpmn:EndEvent', 300, { label: 'Done', connectionState: 'unavailable' }),
            width: 36,
            height: 36,
          },
        ],
        { overlay: OVERLAY }
      );

      const box = overlayOf('end')!;
      expect(box).toHaveAttribute('data-connection-state', 'unavailable');
      expect(box.className).toContain('opacity-30');
      expect(box.querySelector('[data-bpmn-label-overlay]')).not.toBeNull();
    });
  });

  describe('connection and drop states', () => {
    const root = () => document.querySelector('.group\\/bpmn-node') as HTMLElement;
    const container = () => screen.getByTestId('base-container');

    it('leaves an element with no state as it is', () => {
      renderNode({ data: { label: 'Review', backgroundColor: 'rgb(1, 2, 3)' } });

      expect(root()).not.toHaveAttribute('data-connection-state');
      expect(root()).not.toHaveAttribute('data-drop-state');
      expect(container().style.borderColor).toBe('');
      expect(container().style.background).toBe('rgb(1, 2, 3)');
    });

    it.each([
      ['connectionState', 'target', 'data-connection-state'],
      ['connectionState', 'target-picked', 'data-connection-state'],
      ['dropState', 'invalid', 'data-drop-state'],
    ] as const)('tints the border and fill for %s "%s", over a custom background', (key, value, attribute) => {
      renderNode({ data: { label: 'Review', backgroundColor: 'rgb(1, 2, 3)', [key]: value } });

      expect(root()).toHaveAttribute(attribute, value);
      expect(container().style.borderColor).toBe('var(--bpmn-element-border)');
      expect(container().style.background).toBe('var(--bpmn-element-fill)');
    });

    it('strokes and fills the outline of an outline-drawn element', () => {
      renderNode({
        Component: BpmnGatewayNode,
        type: 'bpmn:ExclusiveGateway',
        selected: true,
        data: { connectionState: 'target' },
      });

      const outline = screen.getByTestId('base-node-outline').querySelector('path')!;
      expect(outline.style.stroke).toBe('var(--bpmn-element-border)');
      expect(outline.style.fill).toBe('var(--bpmn-element-fill)');
    });

    it('stands in for the status colours while the border is tinted', () => {
      renderNode({ data: { executionStatus: 'Failed', dropState: 'invalid' } });

      expect(container()).not.toHaveAttribute('data-execution-status');
    });

    it('lets a drop state win over a connection state', () => {
      renderNode({ data: { connectionState: 'unavailable', dropState: 'invalid' } });

      expect(root().className).not.toContain('opacity-30');
      expect(container().style.borderColor).toBe('var(--bpmn-element-border)');
    });

    it('fades an unavailable element and takes it off the pointer', () => {
      renderNode({ data: { connectionState: 'unavailable' } });

      expect(root().className).toContain('opacity-30');
      expect(root().className).toContain('pointer-events-none');
      expect(container().style.borderColor).toBe('');
    });

    it('leaves the anchor as it is, with its toolbar', () => {
      renderNode({ data: { connectionState: 'anchor' }, selected: true });

      expect(container().style.borderColor).toBe('');
      expect(toolbarButtons()).toContain('Delete');
    });

    it.each([
      'target',
      'target-picked',
      'unavailable',
    ] as const)('hides the toolbar and "+" of a selected %s', (connectionState) => {
      renderNode({ data: { connectionState }, selected: true });

      expect(screen.queryAllByRole('button')).toEqual([]);
      expect(document.querySelector('[data-testid^="quick-add-handle-"]')).toBeNull();
    });

    it('washes a valid drop target and keeps its border', () => {
      renderNode({ data: { dropState: 'valid' } });

      expect(container().style.background).toBe('var(--bpmn-element-fill)');
      expect(container().style.borderColor).toBe('');
    });

    it('rings a drop onto the border and keeps the fill', () => {
      renderNode({ data: { dropState: 'valid-border', backgroundColor: 'rgb(1, 2, 3)' } });

      expect(document.querySelector('[data-bpmn-drop-ring]')).not.toBeNull();
      expect(container().style.borderColor).toBe('var(--bpmn-element-border)');
      expect(container().style.background).toBe('rgb(1, 2, 3)');
    });

    it('fills an element with no card only while a state is on', () => {
      const { rerender } = renderNode({ Component: BpmnSwimlaneNode, type: 'bpmn:Lane' });
      expect(document.querySelector('.bg-\\(--bpmn-element-fill\\)')).toBeNull();

      rerender({ data: { dropState: 'valid' } });
      expect(document.querySelector('.bg-\\(--bpmn-element-fill\\)')).not.toBeNull();
    });

    it('keeps a selected lane its selection fill while a state sets no fill', () => {
      renderNode({
        Component: BpmnSwimlaneNode,
        type: 'bpmn:Lane',
        selected: true,
        data: { connectionState: 'unavailable' },
      });

      expect(document.querySelector('.bg-foreground-accent-muted\\/5')).not.toBeNull();
    });

    const notchOn = (side: Position) =>
      document.querySelector(
        `[data-handle-visuals="${bpmnHandleId('task', 'source', side)}"] .border-2.opacity-100`
      );

    it("fills the notch on the side the host's own connection is over", () => {
      renderNode({ data: { connectionState: 'target-picked', connectionSide: Position.Right } });

      expect(notchOn(Position.Right)).toHaveClass('bg-brand');
      expect(notchOn(Position.Left)).not.toHaveClass('bg-brand');
    });

    it('fills the notch on the side a dragged connection would end on', () => {
      renderNode();
      // Not hovered or selected, so its notches only show once a connection starts.
      expect(notchOn(Position.Top)).toBeNull();

      const connect = (isValid: boolean) =>
        act(() =>
          store.setState({
            connection: {
              ...store.getState().connection,
              inProgress: true,
              isValid,
              toHandle: {
                id: bpmnHandleId('task', 'target', Position.Top),
                nodeId: 'task',
                type: 'target',
                position: Position.Top,
                x: 0,
                y: 0,
                width: 100,
                height: 80,
              },
            } as never,
          })
        );
      connect(true);
      expect(notchOn(Position.Top)).toHaveClass('bg-brand');
      expect(notchOn(Position.Bottom)).not.toHaveClass('bg-brand');

      connect(false);
      expect(notchOn(Position.Top)).not.toHaveClass('bg-brand');
    });
  });
});
