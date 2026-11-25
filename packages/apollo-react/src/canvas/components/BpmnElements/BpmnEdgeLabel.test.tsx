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

type LabelProps = Partial<React.ComponentProps<typeof BpmnEdgeLabel>>;

/** Renders a selected label; `rerender` merges new props over the first ones. */
const show = (
  props: LabelProps = {},
  strings?: React.ComponentProps<typeof BpmnStringsProvider>['strings']
) => {
  const ui = (next: LabelProps) => (
    <ReactFlowProvider>
      <StoreProbe />
      <BpmnStringsProvider strings={strings}>
        <BpmnEdgeLabel edgeId="flow" x={160} y={40} borderColor="red" selected {...next} />
      </BpmnStringsProvider>
    </ReactFlowProvider>
  );
  const result = render(ui(props));
  return { ...result, rerender: (next: LabelProps) => result.rerender(ui({ ...props, ...next })) };
};

const label = () => document.querySelector('[data-bpmn-edge-label="flow"]') as HTMLElement;

describe('BPMN edge label', () => {
  it('fades and ignores the pointer only when dimmed', () => {
    const { rerender } = show({ text: 'Yes' });
    expect(label()).not.toHaveAttribute('data-dimmed');
    expect(label().className).toContain('pointer-events-auto');

    rerender({ dimmed: true });
    expect(label()).toHaveAttribute('data-dimmed', 'true');
    expect(label().className).toContain('pointer-events-none');
    expect(label().className).not.toContain('pointer-events-auto');
  });

  describe('renaming', () => {
    it('edits inline on double-click and stores the new label on Enter', () => {
      const onRename = vi.fn();
      show({ text: 'Yes', onRename });

      fireEvent.doubleClick(screen.getByText('Yes'));
      const editor = screen.getByLabelText('Edit label');
      expect(editor).toHaveValue('Yes');
      fireEvent.change(editor, { target: { value: 'Approved' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Enter' });

      expect(onRename).toHaveBeenCalledWith('flow', 'Approved');
      expect(screen.queryByLabelText('Edit label')).not.toBeInTheDocument();
    });

    it('keeps editing on a click or double-click inside the editor', () => {
      const onRename = vi.fn();
      show({ text: 'Yes', onRename });

      fireEvent.doubleClick(screen.getByText('Yes'));
      const editor = screen.getByLabelText('Edit label');
      fireEvent.change(editor, { target: { value: 'Approved' } });
      fireEvent.click(editor);
      fireEvent.doubleClick(editor);

      expect(screen.getByLabelText('Edit label')).toHaveValue('Approved');
      expect(onRename).not.toHaveBeenCalled();
    });

    it('stores on blur and discards on Escape', () => {
      const onRename = vi.fn();
      show({ text: 'Yes', onRename });

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
      const { container } = show({ text: 'Yes', onRename: vi.fn() });
      // React handles events at its root, so a listener above it sees what propagates past.
      const onContextMenu = vi.fn();
      container.parentElement!.addEventListener('contextmenu', onContextMenu);

      fireEvent.contextMenu(screen.getByText('Yes'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);

      fireEvent.doubleClick(screen.getByText('Yes'));
      fireEvent.contextMenu(screen.getByLabelText('Edit label'));
      expect(onContextMenu).toHaveBeenCalledTimes(1);
      container.parentElement!.removeEventListener('contextmenu', onContextMenu);
    });

    it('starts from a translatable placeholder when there is no label', () => {
      const onRename = vi.fn();
      show({ onRename }, { edgeLabelPlaceholder: 'Beschriftung' });

      fireEvent.doubleClick(screen.getByText('Beschriftung'));
      fireEvent.change(screen.getByLabelText('Edit label'), { target: { value: 'New' } });
      fireEvent.keyDown(screen.getByLabelText('Edit label'), { key: 'Enter' });

      expect(onRename).toHaveBeenCalledWith('flow', 'New');
    });

    it('does not edit when the host cannot rename', () => {
      show({ text: 'Yes', onMove: vi.fn() });

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

    it('selects its flow on click, carrying its id as an edge element does', () => {
      show({ text: 'Yes', selected: false });
      const addSelectedEdges = selectEdges();

      expect(label()).toHaveAttribute('data-id', 'flow');
      fireEvent.click(label());

      expect(addSelectedEdges).toHaveBeenCalledWith(['flow']);
    });

    it('leaves the selection alone when elements are not selectable', () => {
      show({ text: 'Yes', selected: false });
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

    it('treats a press that barely moves as a click, not a drag', () => {
      const onMove = vi.fn();
      show({ text: 'Yes', onMove });

      dragBy(1, 1);

      expect(onMove).not.toHaveBeenCalled();
    });

    it('reports the label centre in flow coordinates when the drag ends', () => {
      const onMove = vi.fn();
      show({ text: 'Yes', onMove });

      dragBy(25, -30);

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith('flow', { x: 185, y: 10 });
      expect(label().style.transform).toContain('translate(185px, 10px)');
    });

    it('starts a second drag from where the label is shown, before the host stores the first', () => {
      const onMove = vi.fn();
      show({ text: 'Yes', onMove });

      dragBy(25, -30);
      dragBy(10, 10);

      expect(onMove).toHaveBeenLastCalledWith('flow', { x: 195, y: 20 });
      expect(label().style.transform).toContain('translate(195px, 20px)');
    });

    it('follows the host back to the point a drag started from', () => {
      const { rerender } = show({ text: 'Yes', onMove: vi.fn() });

      dragBy(25, -30);
      rerender({ x: 185, y: 10 });
      rerender({ x: 160, y: 40 });

      expect(label().style.transform).toContain('translate(160px, 40px)');
    });

    it('ignores a press that never moves', () => {
      const onMove = vi.fn();
      show({ text: 'Yes', onMove });

      fireEvent.pointerDown(label(), { button: 0, clientX: 300, clientY: 200 });
      fireEvent.pointerUp(label(), { clientX: 300, clientY: 200 });

      expect(onMove).not.toHaveBeenCalled();
    });

    it('only moves the label of a selected flow', () => {
      const onMove = vi.fn();
      show({ text: 'Yes', onMove, selected: false });

      dragBy(25, -30);

      expect(onMove).not.toHaveBeenCalled();
      expect(label().style.transform).toContain('translate(160px, 40px)');
    });
  });
});
