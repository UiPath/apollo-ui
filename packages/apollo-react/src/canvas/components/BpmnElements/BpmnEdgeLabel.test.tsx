import { ReactFlowProvider, useStoreApi } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import { BpmnStringsProvider } from '.';
import { BpmnEdgeLabel } from './BpmnEdgeLabel';

// The renderer portals into a container only a mounted ReactFlow provides.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => children,
}));

let store: ReturnType<typeof useStoreApi>;
function StoreProbe() {
  store = useStoreApi();
  return null;
}

const renderLabel = (
  props: Partial<React.ComponentProps<typeof BpmnEdgeLabel>> = {},
  strings?: React.ComponentProps<typeof BpmnStringsProvider>['strings']
) =>
  render(
    <ReactFlowProvider>
      <StoreProbe />
      <BpmnStringsProvider strings={strings}>
        <BpmnEdgeLabel edgeId="flow" x={160} y={40} borderColor="red" selected {...props} />
      </BpmnStringsProvider>
    </ReactFlowProvider>
  );

const label = () => document.querySelector('[data-bpmn-edge-label="flow"]') as HTMLElement;

describe('BPMN edge label', () => {
  describe('renaming', () => {
    it('edits inline on double-click and stores the new label on Enter', () => {
      const onRename = vi.fn();
      renderLabel({ text: 'Yes', onRename });

      fireEvent.doubleClick(screen.getByText('Yes'));
      const editor = screen.getByLabelText('Edit label');
      expect(editor).toHaveValue('Yes');
      fireEvent.change(editor, { target: { value: 'Approved' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Enter' });

      expect(onRename).toHaveBeenCalledWith('flow', 'Approved');
      expect(screen.queryByLabelText('Edit label')).not.toBeInTheDocument();
    });

    it('stores on blur and discards on Escape', () => {
      const onRename = vi.fn();
      renderLabel({ text: 'Yes', onRename });

      fireEvent.doubleClick(screen.getByText('Yes'));
      fireEvent.change(screen.getByLabelText('Edit label'), { target: { value: 'Dropped' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Escape' });
      expect(onRename).not.toHaveBeenCalled();

      fireEvent.doubleClick(screen.getByText('Yes'));
      fireEvent.change(screen.getByLabelText('Edit label'), { target: { value: 'Kept' } });
      fireEvent.blur(screen.getByLabelText('Edit label'));
      expect(onRename).toHaveBeenCalledWith('flow', 'Kept');
    });

    it('keeps a context menu on the editor from reaching the flow', () => {
      const onContextMenu = vi.fn();
      render(
        <div onContextMenu={onContextMenu}>
          <ReactFlowProvider>
            <BpmnEdgeLabel
              edgeId="flow"
              x={0}
              y={0}
              borderColor="red"
              text="Yes"
              onRename={vi.fn()}
            />
          </ReactFlowProvider>
        </div>
      );

      fireEvent.doubleClick(screen.getByText('Yes'));
      fireEvent.contextMenu(screen.getByLabelText('Edit label'));

      expect(onContextMenu).not.toHaveBeenCalled();
    });

    it('starts from a translatable placeholder when there is no label', () => {
      const onRename = vi.fn();
      renderLabel({ onRename }, { edgeLabelPlaceholder: 'Beschriftung' });

      fireEvent.doubleClick(screen.getByText('Beschriftung'));
      fireEvent.change(screen.getByLabelText('Edit label'), { target: { value: 'New' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Enter' });

      expect(onRename).toHaveBeenCalledWith('flow', 'New');
    });

    it('does not edit when the host cannot rename', () => {
      renderLabel({ text: 'Yes', onMove: vi.fn() });

      fireEvent.doubleClick(screen.getByText('Yes'));

      expect(screen.queryByLabelText('Edit label')).not.toBeInTheDocument();
    });
  });

  describe('selecting', () => {
    const selectEdges = () => {
      const addSelectedEdges = vi.fn();
      store.setState({ addSelectedEdges });
      return addSelectedEdges;
    };

    it('carries the flow id, as an edge element does', () => {
      renderLabel({ text: 'Yes' });

      expect(label()).toHaveAttribute('data-id', 'flow');
    });

    it('selects its flow on click', () => {
      renderLabel({ text: 'Yes', selected: false });
      const addSelectedEdges = selectEdges();

      fireEvent.click(label());

      expect(addSelectedEdges).toHaveBeenCalledWith(['flow']);
    });

    it('leaves the selection alone when elements are not selectable', () => {
      renderLabel({ text: 'Yes', selected: false });
      const addSelectedEdges = selectEdges();
      store.setState({ elementsSelectable: false });

      fireEvent.click(label());

      expect(addSelectedEdges).not.toHaveBeenCalled();
    });
  });

  describe('moving', () => {
    const dragBy = (dx: number, dy: number) => {
      fireEvent.pointerDown(label(), { button: 0, clientX: 300, clientY: 200 });
      fireEvent.pointerMove(label(), { clientX: 300 + dx, clientY: 200 + dy });
      fireEvent.pointerUp(label(), { clientX: 300 + dx, clientY: 200 + dy });
    };

    it('reports the label centre in flow coordinates when the drag ends', () => {
      const onMove = vi.fn();
      renderLabel({ text: 'Yes', onMove });

      dragBy(25, -30);

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith('flow', { x: 185, y: 10 });
      expect(label().style.transform).toContain('translate(185px, 10px)');
    });

    it('starts a second drag from where the label is shown, before the host stores the first', () => {
      const onMove = vi.fn();
      renderLabel({ text: 'Yes', onMove });

      dragBy(25, -30);
      dragBy(10, 10);

      expect(onMove).toHaveBeenLastCalledWith('flow', { x: 195, y: 20 });
      expect(label().style.transform).toContain('translate(195px, 20px)');
    });

    it('follows the host back to the point a drag started from', () => {
      const props = { edgeId: 'flow', borderColor: 'red', selected: true, text: 'Yes' };
      const { rerender } = render(
        <ReactFlowProvider>
          <BpmnEdgeLabel {...props} x={160} y={40} onMove={vi.fn()} />
        </ReactFlowProvider>
      );
      const show = (x: number, y: number) =>
        rerender(
          <ReactFlowProvider>
            <BpmnEdgeLabel {...props} x={x} y={y} onMove={vi.fn()} />
          </ReactFlowProvider>
        );

      dragBy(25, -30);
      show(185, 10);
      show(160, 40);

      expect(label().style.transform).toContain('translate(160px, 40px)');
    });

    it('ignores a press that never moves', () => {
      const onMove = vi.fn();
      renderLabel({ text: 'Yes', onMove });

      fireEvent.pointerDown(label(), { button: 0, clientX: 300, clientY: 200 });
      fireEvent.pointerUp(label(), { clientX: 300, clientY: 200 });

      expect(onMove).not.toHaveBeenCalled();
    });

    it('only moves the label of a selected flow', () => {
      const onMove = vi.fn();
      renderLabel({ text: 'Yes', onMove, selected: false });

      dragBy(25, -30);

      expect(onMove).not.toHaveBeenCalled();
      expect(label().style.transform).toContain('translate(160px, 40px)');
    });
  });
});
