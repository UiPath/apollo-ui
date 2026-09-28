import { fireEvent, render, waitFor } from '@testing-library/react';
import type { Node, NodeChange, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider, useNodesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCanvas } from '../BaseCanvas';
import { StickyNoteNode, type StickyNoteNodeProps } from './StickyNoteNode';
import type { StickyNoteData } from './StickyNoteNode.types';

// The shared test setup mocks XYFlow; this regression must exercise its real D3 window listeners.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

const onNodesChangeSpy = vi.fn<(changes: NodeChange[]) => void>();
const onResize = vi.fn<(width: number, height: number) => void>();
const onResizeStart = vi.fn<() => void>();
const onResizeEnd = vi.fn<() => void>();

const initialNode: Node<StickyNoteData> = {
  id: 'sticky-note-1',
  type: 'stickyNote',
  position: { x: 0, y: 0 },
  data: {
    color: 'yellow',
    content: 'Resize me',
  },
  selected: true,
  width: 240,
  height: 160,
};

function TestStickyNoteNode(props: NodeProps<Node<StickyNoteData>>) {
  return (
    <StickyNoteNode
      {...(props as StickyNoteNodeProps)}
      onResize={onResize}
      onResizeStart={onResizeStart}
      onResizeEnd={onResizeEnd}
    />
  );
}

const nodeTypes = { stickyNote: TestStickyNoteNode };

function ResizeCanvas({ readOnly }: Readonly<{ readOnly: boolean }>) {
  const [nodes, , onNodesChange] = useNodesState([initialNode]);
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeSpy(changes);
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  return (
    <div style={{ width: 800, height: 600 }}>
      <BaseCanvas
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        mode="design"
        onlyRenderVisibleElements={false}
        onNodesChange={handleNodesChange}
        stickyNoteOptions={{ readOnly }}
      />
    </div>
  );
}

function mouseEvent(type: string, clientX: number, clientY: number) {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    view: window,
  });
}

function touchEvent(type: string, target: EventTarget, clientX: number, clientY: number) {
  const touch = {
    clientX,
    clientY,
    identifier: 1,
    pageX: clientX,
    pageY: clientY,
    screenX: clientX,
    screenY: clientY,
    target,
  } as Touch;
  const event = new Event(type, { bubbles: true, cancelable: true });
  const activeTouches = type === 'touchend' ? [] : [touch];
  Object.defineProperties(event, {
    changedTouches: { value: [touch] },
    targetTouches: { value: activeTouches },
    touches: { value: activeTouches },
  });
  return event;
}

type ResizeGesture = Readonly<{
  name: string;
  start: (control: HTMLElement, clientX: number, clientY: number) => void;
  move: (control: HTMLElement, clientX: number, clientY: number) => void;
  end: (control: HTMLElement, clientX: number, clientY: number) => void;
}>;

const resizeGestures = [
  {
    name: 'mouse',
    start: (control, clientX, clientY) =>
      fireEvent(control, mouseEvent('mousedown', clientX, clientY)),
    move: (_control, clientX, clientY) =>
      fireEvent(window, mouseEvent('mousemove', clientX, clientY)),
    end: (_control, clientX, clientY) => fireEvent(window, mouseEvent('mouseup', clientX, clientY)),
  },
  {
    name: 'touch',
    start: (control, clientX, clientY) =>
      fireEvent(control, touchEvent('touchstart', control, clientX, clientY)),
    move: (control, clientX, clientY) =>
      fireEvent(control, touchEvent('touchmove', control, clientX, clientY)),
    end: (control, clientX, clientY) =>
      fireEvent(control, touchEvent('touchend', control, clientX, clientY)),
  },
] satisfies readonly ResizeGesture[];

function getDimensionChanges(resizing?: boolean) {
  return onNodesChangeSpy.mock.calls
    .flatMap(([changes]) => changes)
    .filter(
      (change) =>
        change.type === 'dimensions' && (resizing === undefined || change.resizing === resizing)
    );
}

const originalMaxTouchPoints = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');

beforeAll(() => {
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 1 });
});

afterAll(() => {
  if (originalMaxTouchPoints) {
    Object.defineProperty(navigator, 'maxTouchPoints', originalMaxTouchPoints);
  } else {
    Reflect.deleteProperty(navigator, 'maxTouchPoints');
  }
});

beforeEach(() => {
  onNodesChangeSpy.mockReset();
  onResize.mockReset();
  onResizeStart.mockReset();
  onResizeEnd.mockReset();
});

afterEach(() => {
  window.dispatchEvent(mouseEvent('mouseup', 0, 0));
});

describe('StickyNoteNode resize integration', () => {
  it.each(
    resizeGestures
  )('settles an active $name resize before applying a requested read-only transition', async (gesture) => {
    const view = render(
      <ReactFlowProvider>
        <ResizeCanvas readOnly={false} />
      </ReactFlowProvider>
    );

    const resizeControl = await waitFor(() => {
      const control = view.container.querySelector<HTMLElement>(
        '.react-flow__resize-control.bottom.right'
      );
      expect(control).not.toBeNull();
      return control!;
    });

    gesture.start(resizeControl, 240, 160);
    gesture.move(resizeControl, 280, 200);

    expect(onResizeStart).toHaveBeenCalledOnce();
    await waitFor(() => expect(getDimensionChanges(true).length).toBeGreaterThan(0));
    view.rerender(
      <ReactFlowProvider>
        <ResizeCanvas readOnly />
      </ReactFlowProvider>
    );
    const activeChangeCountWhenReadOnlyApplied = getDimensionChanges(true).length;

    expect(view.container.querySelector('.react-flow__resize-control')).toBeInTheDocument();
    expect(onResize).not.toHaveBeenCalled();
    expect(onResizeEnd).not.toHaveBeenCalled();

    gesture.move(resizeControl, 360, 280);
    await waitFor(() =>
      expect(getDimensionChanges(true).length).toBeGreaterThan(activeChangeCountWhenReadOnlyApplied)
    );
    const activeDimensionChanges = getDimensionChanges(true);
    const activeDimensionChange = activeDimensionChanges[activeDimensionChanges.length - 1];
    if (activeDimensionChange?.type !== 'dimensions' || !activeDimensionChange.dimensions) {
      throw new Error('Expected the real resize gesture to emit active dimensions');
    }

    gesture.end(resizeControl, 360, 280);

    await waitFor(() => expect(onResizeEnd).toHaveBeenCalledOnce());
    const settledDimensionChanges = getDimensionChanges(false);
    const settledDimensionChange = settledDimensionChanges[settledDimensionChanges.length - 1];
    if (settledDimensionChange?.type !== 'dimensions' || !settledDimensionChange.dimensions) {
      throw new Error('Expected the real resize gesture to settle its dimensions');
    }

    expect(settledDimensionChange.dimensions).toEqual(activeDimensionChange.dimensions);
    expect(onResize).toHaveBeenCalledOnce();
    expect(onResize).toHaveBeenCalledWith(
      activeDimensionChange.dimensions.width,
      activeDimensionChange.dimensions.height
    );
    expect(onResize.mock.invocationCallOrder[0]!).toBeLessThan(
      onResizeEnd.mock.invocationCallOrder[0]!
    );
    expect(view.container.querySelector('.react-flow__resize-control')).not.toBeInTheDocument();

    const settledDimensionChangeCount = getDimensionChanges().length;
    gesture.move(resizeControl, 400, 320);
    expect(getDimensionChanges()).toHaveLength(settledDimensionChangeCount);
  });
});
