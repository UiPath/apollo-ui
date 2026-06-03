import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDeleteElements, mockUpdateNodeData } = vi.hoisted(() => ({
  mockDeleteElements: vi.fn(),
  mockUpdateNodeData: vi.fn(),
}));

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
    deleteElements: mockDeleteElements,
    updateNodeData: mockUpdateNodeData,
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

function startEditing() {
  fireEvent.doubleClick(screen.getByText('Remember the resize lifecycle'));
  const textarea = screen.getByRole('textbox');
  textarea.focus();
  return textarea;
}

beforeEach(() => {
  mockDeleteElements.mockReset();
  mockUpdateNodeData.mockReset();
});

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

  it('commits pending text edits before resize start', () => {
    const events: string[] = [];
    const onContentChange = vi.fn(() => events.push('content-change'));
    const onResizeStart = vi.fn(() => events.push('resize-start'));
    mockUpdateNodeData.mockImplementation(() => events.push('update-node-data'));
    renderStickyNoteNode({ onContentChange, onResizeStart });

    const textarea = startEditing();
    fireEvent.change(textarea, { target: { value: 'Updated note text' } });
    fireEvent.mouseDown(screen.getByTestId('node-resize-control-bottom-right'));

    expect(events).toEqual(['content-change', 'update-node-data', 'resize-start']);
    expect(onContentChange).toHaveBeenCalledWith('Updated note text');
    expect(mockUpdateNodeData).toHaveBeenCalledWith('sticky-note-1', {
      content: 'Updated note text',
    });
  });

  it('does not emit a content update on resize start when text is unchanged', () => {
    const events: string[] = [];
    const onContentChange = vi.fn(() => events.push('content-change'));
    const onResizeStart = vi.fn(() => events.push('resize-start'));
    mockUpdateNodeData.mockImplementation(() => events.push('update-node-data'));
    renderStickyNoteNode({ onContentChange, onResizeStart });

    startEditing();
    fireEvent.mouseDown(screen.getByTestId('node-resize-control-bottom-right'));

    expect(events).toEqual(['resize-start']);
    expect(onContentChange).not.toHaveBeenCalled();
    expect(mockUpdateNodeData).not.toHaveBeenCalled();
  });
});
