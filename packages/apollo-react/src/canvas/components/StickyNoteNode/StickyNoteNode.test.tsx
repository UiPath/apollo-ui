import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  NodeResizeControl: ({
    children,
    onResizeEnd,
    onResizeStart,
    position,
  }: {
    children?: React.ReactNode;
    onResizeEnd?: (
      event: React.MouseEvent<HTMLDivElement>,
      params: { width: number; height: number }
    ) => void;
    onResizeStart?: () => void;
    position?: string;
  }) => (
    <div
      data-testid={`node-resize-control-${position}`}
      onMouseDown={onResizeStart}
      onMouseUp={(event) => onResizeEnd?.(event, { width: 256, height: 192 })}
    >
      {children}
    </div>
  ),
  useReactFlow: () => ({
    deleteElements: vi.fn(),
    updateNodeData: vi.fn(),
  }),
}));

import { StickyNoteNode, type StickyNoteNodeProps } from './StickyNoteNode';

const defaultProps: StickyNoteNodeProps = {
  id: 'sticky-note-1',
  type: 'stickyNote',
  data: {
    color: 'yellow',
    content: 'Remember the resize lifecycle',
  },
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

function renderStickyNoteNode(props: Partial<StickyNoteNodeProps> = {}) {
  render(<StickyNoteNode {...defaultProps} {...props} />);
}

describe('StickyNoteNode resize lifecycle', () => {
  it('calls onResizeStart once when resize starts', () => {
    const onResizeStart = vi.fn();
    renderStickyNoteNode({ onResizeStart });

    fireEvent.mouseDown(screen.getByTestId('node-resize-control-bottom-right'));

    expect(onResizeStart).toHaveBeenCalledTimes(1);
  });

  it('calls public onResizeEnd after resize end and preserves existing onResize', async () => {
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();
    renderStickyNoteNode({ onResize, onResizeEnd });

    fireEvent.mouseUp(screen.getByTestId('node-resize-control-bottom-right'));

    expect(onResize).toHaveBeenCalledWith(256, 192);
    expect(onResizeEnd).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });
});
