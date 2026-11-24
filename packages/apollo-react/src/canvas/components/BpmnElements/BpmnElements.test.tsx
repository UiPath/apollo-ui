import userEvent from '@testing-library/user-event';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position, ReactFlow, ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import { BaseCanvasModeProvider } from '../BaseCanvas';
import {
  type BpmnActions,
  BpmnActionsProvider,
  BpmnActivityNode,
  BpmnDataNode,
  type BpmnEdge,
  BpmnGroupNode,
  type BpmnNode,
  type BpmnNodeData,
  BpmnOverlayProvider,
  BpmnStringsProvider,
  BpmnTextAnnotationNode,
  bpmnEdgeTypes,
  bpmnNodeTypes,
  handleId,
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

const renderActivity = (
  data: BpmnNodeData,
  type = 'bpmn:UserTask',
  {
    value = actions,
    selected = false,
    strings,
  }: {
    value?: BpmnActions;
    selected?: boolean;
    strings?: React.ComponentProps<typeof BpmnStringsProvider>['strings'];
  } = {}
) =>
  render(
    <ReactFlowProvider>
      <BpmnStringsProvider strings={strings}>
        <BpmnActionsProvider value={value}>
          <BpmnActivityNode
            {...({
              id: 'task',
              type,
              data,
              selected,
              width: 100,
              height: 80,
            } as NodeProps<BpmnNode>)}
          />
        </BpmnActionsProvider>
      </BpmnStringsProvider>
    </ReactFlowProvider>
  );

const renderNode = (
  Component: React.ComponentType<NodeProps<BpmnNode>>,
  value: BpmnActions,
  props: Partial<NodeProps<BpmnNode>> = {}
) =>
  render(
    <ReactFlowProvider>
      <BpmnActionsProvider value={value}>
        <Component
          {...({ id: 'node', data: {}, selected: true, ...props } as NodeProps<BpmnNode>)}
        />
      </BpmnActionsProvider>
    </ReactFlowProvider>
  );

const rename = vi.fn();
const minimalActions = {
  addAfter: vi.fn(),
  rename,
  deleteEdge: vi.fn(),
  setWaypoints: vi.fn(),
} satisfies BpmnActions;

const requiredActions = {
  addAfter: vi.fn(),
  deleteNode: vi.fn(),
  rename: vi.fn(),
  deleteEdge: vi.fn(),
  setWaypoints: vi.fn(),
} satisfies BpmnActions;

const toolbarButtons = () =>
  screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'))
    .filter((name) => name && name !== 'Add node');

const handle = (kind: 'source' | 'target', side: Position) =>
  document.querySelector(`[data-handleid="${handleId('task', kind, side)}"]`) as HTMLElement;

describe('BPMN element family', () => {
  it('renders in a plain ReactFlow, with no canvas mode provider', () => {
    const nodes = [
      node('start', 'bpmn:StartEvent', 0),
      node('task', 'bpmn:UserTask', 200, { label: 'Review' }),
      node('gateway', 'bpmn:ExclusiveGateway', 400),
    ];
    const edges: BpmnEdge[] = [
      {
        id: 'flow',
        type: 'bpmn:SequenceFlow',
        source: 'start',
        sourceHandle: handleId('start', 'source', Position.Right),
        target: 'task',
        targetHandle: handleId('task', 'target', Position.Left),
      },
    ];

    render(
      <div style={{ width: 800, height: 600 }}>
        <BpmnActionsProvider value={actions}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={bpmnNodeTypes}
            edgeTypes={bpmnEdgeTypes}
          />
        </BpmnActionsProvider>
      </div>
    );

    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(document.querySelectorAll('.react-flow__node')).toHaveLength(3);
  });

  it('is editable outside a mode provider: activities offer a "+" on hover', async () => {
    const user = userEvent.setup();
    renderActivity({ label: 'Review' });

    await user.hover(screen.getByText('Review'));

    expect(screen.getAllByRole('button', { name: 'Add node' }).length).toBeGreaterThan(0);
  });

  describe('task icon', () => {
    const badge = () => document.querySelector('[data-testid="host-icon"]');

    it("shows the task type's own glyph by default", () => {
      const { container } = renderActivity({ label: 'Review' });

      expect(badge()).toBeNull();
      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('shows data.icon in place of the glyph', () => {
      const withGlyph = renderActivity({ label: 'Review' });
      const glyphCount = withGlyph.container.querySelectorAll('svg').length;
      withGlyph.unmount();

      const { container } = renderActivity({
        label: 'Review',
        icon: <span data-testid="host-icon" />,
      });

      expect(badge()).not.toBeNull();
      expect(container.querySelectorAll('svg')).toHaveLength(glyphCount - 1);
    });

    it('shows data.icon on a task type that has no glyph', () => {
      renderActivity({ label: 'Review', icon: <span data-testid="host-icon" /> }, 'bpmn:Task');

      expect(badge()).not.toBeNull();
    });
  });

  describe('handles', () => {
    const sides = [Position.Top, Position.Right, Position.Bottom, Position.Left];

    it.each(sides)('fills the node with its %s handles', (side) => {
      renderActivity({});

      for (const kind of ['source', 'target'] as const) {
        expect(handle(kind, side)).toHaveStyle({
          width: '100%',
          height: '100%',
          transform: 'none',
        });
      }
    });

    it.each(sides)('starts connections from a strip on the %s side', (side) => {
      renderActivity({});

      expect(handle('source', side).style.clipPath).toMatch(/^inset\(/);
      expect(handle('source', side)).toHaveClass('connectablestart');
      expect(handle('source', side)).not.toHaveClass('connectableend');
    });

    it.each(sides)('takes drops on the %s quarter of the node, and never starts one', (side) => {
      renderActivity({});

      expect(handle('target', side).style.clipPath).toMatch(/^polygon\(50% 50%/);
      expect(handle('target', side)).toHaveClass('connectableend');
      expect(handle('target', side)).not.toHaveClass('connectablestart');
      // Inert until a connection is in progress, so the body stays draggable.
      expect(handle('target', side)).not.toHaveClass('connectionindicator');
    });

    it('never shows a notch for a target', () => {
      renderActivity({});

      const visuals = document.querySelector(
        `[data-handle-visuals="${handleId('task', 'target', Position.Left)}"]`
      );
      expect(visuals?.querySelector('.border-2')).toHaveClass('opacity-0');
      expect(visuals?.querySelector('[data-handle-grab-zone]')).toBeNull();
    });
  });

  describe('optional actions', () => {
    it('shows every toolbar button when the host handles them all', () => {
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', { selected: true });

      expect(toolbarButtons()).toEqual([
        'Change element',
        'Iteration',
        'Add boundary event',
        'Add text annotation',
        'Toggle breakpoint',
        'Duplicate',
        'Delete',
      ]);
    });

    it.each(['view', 'readonly'] as const)('has no toolbar in %s mode', (mode) => {
      render(
        <ReactFlowProvider>
          <BaseCanvasModeProvider mode={mode}>
            <BpmnActionsProvider value={actions}>
              <BpmnActivityNode
                {...({
                  id: 'task',
                  type: 'bpmn:UserTask',
                  data: { label: 'Review' },
                  selected: true,
                  width: 100,
                  height: 80,
                } as NodeProps<BpmnNode>)}
              />
            </BpmnActionsProvider>
          </BaseCanvasModeProvider>
        </ReactFlowProvider>
      );

      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('leaves out the button of each action the host does not handle', () => {
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', {
        selected: true,
        value: { ...requiredActions, duplicate: vi.fn() },
      });

      expect(toolbarButtons()).toEqual(['Duplicate', 'Delete']);
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });

    it('offers "View" on a collapsed sub-process only when the host can drill in', () => {
      const { unmount } = renderActivity({ label: 'Ship' }, 'bpmn:SubProcess', {
        value: requiredActions,
      });
      expect(screen.queryByRole('button', { name: 'View Ship' })).not.toBeInTheDocument();
      unmount();

      const view = vi.fn();
      renderActivity({ label: 'Ship' }, 'bpmn:SubProcess', {
        value: { ...requiredActions, view },
      });
      fireEvent.click(screen.getByRole('button', { name: 'View Ship' }));
      expect(view).toHaveBeenCalledWith('task');
    });
  });

  describe('click-to-connect', () => {
    it("hands a press on a source handle to the host's startConnection", () => {
      const startConnection = vi.fn();
      renderActivity({}, 'bpmn:UserTask', { value: { ...requiredActions, startConnection } });

      fireEvent.pointerDown(handle('source', Position.Bottom));
      expect(startConnection).toHaveBeenCalledWith('task', Position.Bottom, expect.anything());

      fireEvent.pointerDown(handle('target', Position.Bottom));
      expect(startConnection).toHaveBeenCalledTimes(1);
    });

    it('hands over a press on the notch too', async () => {
      const user = userEvent.setup();
      const startConnection = vi.fn();
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', {
        value: { ...requiredActions, startConnection },
      });

      // The left side has no "+", so it shows its notch once the node is hovered.
      await user.hover(screen.getByText('Review'));
      const notch = document.querySelector(
        `[data-handle-grab-zone][data-handleid="${handleId('task', 'source', Position.Left)}"]`
      ) as HTMLElement;
      fireEvent.pointerDown(notch);

      expect(startConnection).toHaveBeenCalledWith('task', Position.Left, expect.anything());
    });
  });

  describe('strings', () => {
    it("uses the host's strings and keeps English for the rest", () => {
      renderActivity({ label: 'Review', breakpoint: true }, 'bpmn:UserTask', {
        selected: true,
        strings: { delete: 'Löschen', breakpoint: 'Haltepunkt' },
      });

      expect(toolbarButtons()).toContain('Löschen');
      expect(toolbarButtons()).toContain('Duplicate');
      expect(screen.getByRole('img', { name: 'Haltepunkt' })).toBeInTheDocument();
    });

    it('translates the sub-process "View" button', () => {
      renderActivity({ label: 'Ship' }, 'bpmn:SubProcess', { strings: { view: 'Öffnen' } });

      expect(screen.getByRole('button', { name: 'Öffnen Ship' })).toHaveTextContent('Öffnen');
    });

    it('translates the label editor', () => {
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', {
        selected: true,
        strings: { editLabel: 'Namen bearbeiten' },
      });

      fireEvent.doubleClick(screen.getByText('Review'));

      expect(screen.getByLabelText('Namen bearbeiten')).toBeInTheDocument();
    });
  });

  describe('resize', () => {
    const controls = () => document.querySelectorAll('.react-flow__resize-control');

    it('renders no resize controls unless the host handles resize', () => {
      renderNode(BpmnGroupNode, { ...minimalActions, deleteNode: vi.fn() });

      expect(controls()).toHaveLength(0);
    });

    it('renders them on a selected resizable element when it does', () => {
      renderNode(BpmnGroupNode, { ...minimalActions, resize: vi.fn() });

      expect(controls().length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('leaves out the Delete button when the host does not delete nodes', () => {
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', {
        selected: true,
        value: { ...minimalActions, duplicate: vi.fn() },
      });

      expect(toolbarButtons()).toEqual(['Duplicate']);
    });

    it('renders no toolbar for a node left with no actions', () => {
      renderNode(BpmnGroupNode, minimalActions);

      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });
  });

  describe('end-to-end hooks', () => {
    it('gives the toolbar and each of its buttons a test id', () => {
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', { selected: true });

      expect(screen.getByTestId('node-toolbar')).toHaveAttribute('role', 'toolbar');
      expect(
        ['change-element', 'iteration', 'boundary-event', 'breakpoint', 'duplicate', 'delete'].map(
          (id) => screen.getByTestId(`toolbar-item-${id}`).getAttribute('aria-label')
        )
      ).toEqual([
        'Change element',
        'Iteration',
        'Add boundary event',
        'Toggle breakpoint',
        'Duplicate',
        'Delete',
      ]);
    });

    it('offers a text annotation only when the host adds them, after the boundary event', () => {
      const addAnnotation = vi.fn();
      renderActivity({ label: 'Review' }, 'bpmn:UserTask', {
        selected: true,
        value: { ...requiredActions, addBoundaryEvent: vi.fn(), duplicate: vi.fn(), addAnnotation },
        strings: { addAnnotation: 'Kommentar' },
      });

      expect(toolbarButtons()).toEqual(['Add boundary event', 'Kommentar', 'Duplicate', 'Delete']);
      fireEvent.click(screen.getByTestId('toolbar-item-bpmn:TextAnnotation'));
      expect(addAnnotation).toHaveBeenCalledWith('task');
    });

    it('names the "+" on each side that has one after the node and the side', async () => {
      const user = userEvent.setup();
      renderActivity({ label: 'Review' });

      await user.hover(screen.getByText('Review'));

      for (const side of ['top', 'right', 'bottom']) {
        expect(screen.getByTestId(`quick-add-handle-task-${side}`)).toHaveAttribute(
          'aria-label',
          'Add node'
        );
      }
      expect(screen.queryByTestId('quick-add-handle-task-left')).not.toBeInTheDocument();
    });

    it('gives the drill-in button of a collapsed sub-process a test id', () => {
      const view = vi.fn();
      renderActivity({ label: 'Fulfil' }, 'bpmn:SubProcess', {
        value: { ...requiredActions, view },
      });

      fireEvent.click(screen.getByTestId('drill-down-button-task'));

      expect(view).toHaveBeenCalledWith('task');
    });
  });

  describe('data shapes', () => {
    // happy-dom has no layout, so the outline is drawn in its unmeasured 288x96 box.
    const outline = (type: string) => {
      renderNode(BpmnDataNode, requiredActions, { type, width: 36, height: 50, selected: false });
      return screen.getByTestId('base-node-outline').querySelector('path')!.getAttribute('d')!;
    };

    it('draws a data object with rounded corners and a filled fold', () => {
      const d = outline('bpmn:DataObjectReference');

      expect(d).toContain('Q1 1 4 1');
      // The fold's two edges, then the strokes that fill it.
      expect(d).toContain('M287 10 H278 V1 M278 2 L286 10');
    });

    it('draws a data store with a rim and a band across the middle', () => {
      const d = outline('bpmn:DataStoreReference');

      expect(d).toContain('M287 7 C287 15 1 15 1 7');
      expect(d).toContain('M287 48 C287 56 1 56 1 48');
    });
  });

  describe('text annotation', () => {
    it('shows a placeholder for an empty label, which the host can translate', () => {
      render(
        <ReactFlowProvider>
          <BpmnStringsProvider strings={{ annotationPlaceholder: 'Text hinzufügen' }}>
            <BpmnActionsProvider value={minimalActions}>
              <BpmnTextAnnotationNode {...({ id: 'node', data: {} } as NodeProps<BpmnNode>)} />
            </BpmnActionsProvider>
          </BpmnStringsProvider>
        </ReactFlowProvider>
      );

      expect(screen.getByText('Text hinzufügen')).toHaveClass('text-foreground-muted');
    });

    it('shows the label unclamped, in place of the placeholder', () => {
      renderNode(BpmnTextAnnotationNode, minimalActions, { data: { label: 'One\nTwo' } });

      expect(screen.queryByText('Add text')).not.toBeInTheDocument();
      expect(document.querySelector('[data-node-part="label"] div')).toHaveClass(
        'whitespace-pre-wrap'
      );
      expect(document.querySelector('.line-clamp-3')).toBeNull();
    });

    it('keeps editing on Enter and stores every line on blur', () => {
      rename.mockReset();
      renderNode(BpmnTextAnnotationNode, minimalActions);

      fireEvent.doubleClick(screen.getByText('Add text'));
      const editor = screen.getByLabelText('Edit label');
      expect(fireEvent.keyDown(editor, { key: 'Enter' })).toBe(true);
      expect(rename).not.toHaveBeenCalled();

      fireEvent.change(editor, { target: { value: 'One\nTwo' } });
      fireEvent.blur(screen.getByLabelText('Edit label'));

      expect(rename).toHaveBeenCalledWith('node', 'One\nTwo');
      expect(screen.queryByLabelText('Edit label')).not.toBeInTheDocument();
    });

    it('ends editing on Escape without storing', () => {
      rename.mockReset();
      renderNode(BpmnTextAnnotationNode, minimalActions, { data: { label: 'Note' } });

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
    const renderCanvas = (overlay: typeof OVERLAY | null) =>
      render(
        <div style={{ width: 800, height: 600 }}>
          <BpmnOverlayProvider value={overlay}>
            <BpmnActionsProvider value={actions}>
              <ReactFlow nodes={nodes} nodeTypes={bpmnNodeTypes} />
            </BpmnActionsProvider>
          </BpmnOverlayProvider>
        </div>
      );
    const nodeElement = (id: string) =>
      document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
    const overlayOf = (id: string) =>
      document.querySelector(`[data-bpmn-node-overlay="${id}"]`) as HTMLElement | null;

    it('keeps the toolbar, the handle visuals and the labels in the node by default', () => {
      renderCanvas(null);

      expect(overlayOf('task')).toBeNull();
      expect(nodeElement('task').querySelector('[role="toolbar"]')).not.toBeNull();
      expect(nodeElement('task').querySelector('[data-handle-visuals]')).not.toBeNull();
      expect(document.querySelector('[data-bpmn-label-overlay]')).toBeNull();
    });

    it("draws a box at the node's position and size in the viewport portal, at the given z-index", () => {
      renderCanvas(OVERLAY);

      const box = overlayOf('task')!;
      expect(box.closest('.react-flow__viewport-portal')).not.toBeNull();
      expect(box.style.zIndex).toBe('2000');
      expect(box.style.left).toBe('40px');
      expect(box.style.top).toBe('0px');
      expect(box.style.width).toBe('100px');
      expect(box.style.height).toBe('80px');
    });

    it('moves the toolbar and the handle visuals there, and leaves the handles in the node', () => {
      renderCanvas(OVERLAY);

      const box = overlayOf('task')!;
      expect(box.querySelector('[role="toolbar"]')).not.toBeNull();
      expect(box.querySelectorAll('[data-handle-visuals]')).toHaveLength(8);
      expect(nodeElement('task').querySelector('[role="toolbar"]')).toBeNull();
      expect(nodeElement('task').querySelector('[data-handle-visuals]')).toBeNull();
      expect(nodeElement('task').querySelectorAll('.react-flow__handle')).toHaveLength(8);
    });

    it('draws a label outside the element there, and keeps the one in the node to click', () => {
      renderCanvas(OVERLAY);

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
      render(
        <div style={{ width: 800, height: 600 }}>
          <BpmnOverlayProvider value={OVERLAY}>
            <BpmnActionsProvider value={actions}>
              <ReactFlow nodes={[{ ...nodes[1]!, selected: true }]} nodeTypes={bpmnNodeTypes} />
            </BpmnActionsProvider>
          </BpmnOverlayProvider>
        </div>
      );

      fireEvent.doubleClick(
        nodeElement('end').querySelector('[data-node-part="label"]')!.firstElementChild!
      );

      expect(overlayOf('end')!.querySelector('textarea')).toHaveValue('Done');
    });
  });
});
