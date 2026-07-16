import { act, fireEvent, render, screen } from '@testing-library/react';
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
import type {
  StickyNoteEditorActionContext,
  StickyNoteFormattingAction,
} from './StickyNoteNode.types';

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
  return render(<StickyNoteNode {...defaultProps} {...props} />);
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
    expect(onContentChange).toHaveBeenCalledTimes(1);
    expect(mockUpdateNodeData).toHaveBeenCalledTimes(1);
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

  it('does not commit canceled edits when Escape blurs the textarea', () => {
    const onContentChange = vi.fn();
    renderStickyNoteNode({ onContentChange });

    const textarea = startEditing();
    fireEvent.change(textarea, { target: { value: 'Discard this edit' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });

    expect(onContentChange).not.toHaveBeenCalled();
    expect(mockUpdateNodeData).not.toHaveBeenCalled();
  });
});

describe('StickyNoteNode editor extensions', () => {
  it('renders custom content and lets an editor action commit the captured selection once', () => {
    let editorContext: StickyNoteEditorActionContext | undefined;
    const onContentChange = vi.fn();
    const formattingActions: readonly StickyNoteFormattingAction[] = [
      {
        id: 'embed-media',
        label: 'Embed media',
        icon: <span aria-hidden="true">M</span>,
        onAction: (context) => {
          editorContext = context;
        },
      },
    ];

    renderStickyNoteNode({
      data: { color: 'yellow', content: 'BeforeAfter' },
      onContentChange,
      formattingActions,
      renderMarkdown: (content) => <span>Custom: {content}</span>,
    });

    expect(screen.getByText('Custom: BeforeAfter')).toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText('Custom: BeforeAfter'));
    const editor = screen.getByRole<HTMLTextAreaElement>('textbox');
    fireEvent.change(editor, { target: { value: 'Before draft After' } });
    editor.setSelectionRange(12, 12);
    const embedMediaButton = screen.getByRole('button', { name: 'Embed media' });
    const anchorRect = embedMediaButton.getBoundingClientRect();
    vi.spyOn(embedMediaButton, 'getBoundingClientRect').mockReturnValue(anchorRect);
    fireEvent.click(embedMediaButton);

    expect(editorContext?.selection).toEqual({
      value: 'Before draft After',
      selectionStart: 12,
      selectionEnd: 12,
    });
    expect(editorContext?.currentValue()).toBe('Before draft After');
    expect(editorContext?.anchorRect).toBe(anchorRect);
    expect(onContentChange).not.toHaveBeenCalled();

    act(() => {
      editorContext?.commit({
        value: 'Before draft media After',
        selectionStart: 18,
        selectionEnd: 18,
      });
      editorContext?.commit({
        value: 'A second commit must be ignored',
        selectionStart: 0,
        selectionEnd: 0,
      });
    });

    expect(onContentChange).toHaveBeenCalledOnce();
    expect(onContentChange).toHaveBeenCalledWith('Before draft media After');
    expect(mockUpdateNodeData).toHaveBeenCalledOnce();
    expect(mockUpdateNodeData).toHaveBeenCalledWith('sticky-note-1', {
      content: 'Before draft media After',
    });
    expect(editor).toHaveValue('Before draft media After');
  });

  it('reads and resumes with externally updated content after the editor loses focus', () => {
    let editorContext: StickyNoteEditorActionContext | undefined;
    const onContentChange = vi.fn();
    const formattingActions: readonly StickyNoteFormattingAction[] = [
      {
        id: 'embed-media',
        label: 'Embed media',
        icon: <span aria-hidden="true">M</span>,
        onAction: (context) => {
          editorContext = context;
        },
      },
    ];

    const view = renderStickyNoteNode({
      data: { color: 'yellow', content: 'Original' },
      onContentChange,
      formattingActions,
    });

    fireEvent.doubleClick(screen.getByText('Original'));
    const editor = screen.getByRole<HTMLTextAreaElement>('textbox');
    fireEvent.change(editor, { target: { value: 'Draft' } });
    editor.setSelectionRange(5, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Embed media' }));

    fireEvent.blur(editor);
    view.rerender(
      <StickyNoteNode
        {...defaultProps}
        data={{ color: 'yellow', content: 'Externally updated' }}
        onContentChange={onContentChange}
        formattingActions={formattingActions}
      />
    );

    expect(editorContext?.currentValue()).toBe('Externally updated');
    act(() => editorContext?.resume());

    expect(screen.getByRole('textbox')).toHaveValue('Externally updated');
    expect(onContentChange).not.toHaveBeenCalled();
    expect(mockUpdateNodeData).not.toHaveBeenCalled();
  });

  it('restores normal blur persistence when a consumer action throws', () => {
    const onContentChange = vi.fn();
    const actionError = new Error('Consumer action failed');
    const formattingActions: readonly StickyNoteFormattingAction[] = [
      {
        id: 'embed-media',
        label: 'Embed media',
        icon: <span aria-hidden="true">M</span>,
        onAction: () => {
          throw actionError;
        },
      },
    ];

    renderStickyNoteNode({ onContentChange, formattingActions });

    const editor = startEditing();
    fireEvent.change(editor, { target: { value: 'Persist after action failure' } });

    const handleError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', handleError);
    fireEvent.click(screen.getByRole('button', { name: 'Embed media' }));
    window.removeEventListener('error', handleError);

    fireEvent.blur(editor);

    expect(handleError).toHaveBeenCalledOnce();
    expect(handleError.mock.calls[0]?.[0].error).toBe(actionError);
    expect(onContentChange).toHaveBeenCalledOnce();
    expect(onContentChange).toHaveBeenCalledWith('Persist after action failure');
    expect(mockUpdateNodeData).toHaveBeenCalledWith('sticky-note-1', {
      content: 'Persist after action failure',
    });
  });
});
