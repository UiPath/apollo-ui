import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Components } from 'react-markdown';
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

vi.mock('../NodeViewportOverlay', () => ({
  NodeViewportOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
  it('merges custom Markdown components into the built-in rendering pipeline', () => {
    const { container } = renderStickyNoteNode({
      enableMediaEmbedding: true,
      data: {
        color: 'yellow',
        content:
          '~~Completed~~\nNext line\n\n![Media](https://example.com/image.png)\n\n[Docs](https://example.com)',
      },
      markdownComponents: {
        img: ({ alt }) => <span>Custom media: {alt}</span>,
        a: ({ children }) => <span>Unsafe custom link: {children}</span>,
      } as Components,
    });

    expect(container.querySelector('del')).toHaveTextContent('Completed');
    expect(container.querySelector('br')).toBeInTheDocument();
    expect(screen.getByText('Custom media: Media')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
  });

  it('lets an editor action commit the captured selection once', () => {
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
    });

    expect(screen.getByText('BeforeAfter')).toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText('BeforeAfter'));
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
        data={{ color: 'yellow', content: '**Externally updated**' }}
        onContentChange={onContentChange}
        formattingActions={formattingActions}
      />
    );

    expect(editorContext?.currentValue()).toBe('**Externally updated**');
    act(() => editorContext?.resume());

    expect(screen.getByRole('textbox')).toHaveValue('**Externally updated**');
    expect(screen.getByRole('button', { name: /^Bold/ })).toHaveAttribute('aria-pressed', 'true');
    expect(onContentChange).not.toHaveBeenCalled();
    expect(mockUpdateNodeData).not.toHaveBeenCalled();
  });

  it('persists pending edits on the first ordinary blur after an action resumes', () => {
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

    renderStickyNoteNode({ onContentChange, formattingActions });

    const editor = startEditing();
    fireEvent.change(editor, { target: { value: 'Pending draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Embed media' }));
    fireEvent.blur(editor);

    act(() => editorContext?.resume());
    fireEvent.blur(screen.getByRole('textbox'));

    expect(onContentChange).toHaveBeenCalledOnce();
    expect(onContentChange).toHaveBeenCalledWith('Pending draft');
    expect(mockUpdateNodeData).toHaveBeenCalledOnce();
    expect(mockUpdateNodeData).toHaveBeenCalledWith('sticky-note-1', {
      content: 'Pending draft',
    });
  });

  it('keeps the toolbar mounted while keyboard focus moves to a custom action', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const formattingActions: readonly StickyNoteFormattingAction[] = [
      {
        id: 'embed-media',
        label: 'Embed media',
        icon: <span aria-hidden="true">M</span>,
        onAction,
      },
    ];

    renderStickyNoteNode({ formattingActions });

    startEditing();
    const embedMediaButton = screen.getByRole('button', { name: 'Embed media' });
    for (
      let attempt = 0;
      attempt < 10 && document.activeElement !== embedMediaButton;
      attempt += 1
    ) {
      await user.tab();
    }

    expect(embedMediaButton).toHaveFocus();
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(onAction).toHaveBeenCalledOnce();
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

describe('StickyNoteNode built-in media embedding', () => {
  it('adds one media action when the consumer opts in', () => {
    renderStickyNoteNode({ enableMediaEmbedding: true });

    startEditing();

    expect(screen.getByRole('button', { name: 'Embed image or video' })).toBeInTheDocument();
  });

  it('closes the dialog and resumes editing when the consumer disables the feature', () => {
    const view = renderStickyNoteNode({ enableMediaEmbedding: true });

    startEditing();
    fireEvent.click(screen.getByRole('button', { name: 'Embed image or video' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    view.rerender(<StickyNoteNode {...defaultProps} enableMediaEmbedding={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Remember the resize lifecycle');
  });

  it('inserts a full-width image at the current cursor without consumer wiring', async () => {
    const onContentChange = vi.fn();
    renderStickyNoteNode({
      data: { color: 'yellow', content: 'BeforeAfter' },
      enableMediaEmbedding: true,
      onContentChange,
    });

    fireEvent.doubleClick(screen.getByText('BeforeAfter'));
    const editor = screen.getByRole<HTMLTextAreaElement>('textbox');
    editor.setSelectionRange(6, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Embed image or video' }));

    fireEvent.change(screen.getByRole('textbox', { name: 'Image URL' }), {
      target: { value: 'https://example.com/image.png' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Alternative text' }), {
      target: { value: 'Overview' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Make full width' }));
    fireEvent.load(screen.getByAltText('Overview'));
    fireEvent.click(screen.getByRole('button', { name: 'Embed media' }));

    const expected =
      'Before\n\n![Overview](<https://example.com/image.png> "sticky-note-media;kind=image;layout=full-width")\n\nAfter';
    expect(onContentChange).toHaveBeenCalledOnce();
    expect(onContentChange).toHaveBeenCalledWith(expected);
    expect(mockUpdateNodeData).toHaveBeenCalledWith('sticky-note-1', { content: expected });
    expect(await screen.findByRole('textbox')).toHaveValue(expected);
  });

  it('renders every supported media type and only shows edit controls while selected', () => {
    const content = [
      '![Overview](<https://example.com/image.png> "sticky-note-media;kind=image;layout=full-width")',
      '![YouTube video](<https://www.youtube.com/watch?v=M7lc1UVf-VE> "sticky-note-media;kind=youtube;layout=natural-width")',
      '![Video](<https://example.com/video.mp4> "sticky-note-media;kind=publicVideo;layout=full-width")',
    ].join('\n\n');
    const view = renderStickyNoteNode({
      data: { color: 'yellow', content },
      enableMediaEmbedding: true,
      selected: false,
    });

    expect(screen.getByRole('img', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument();
    expect(view.container.querySelector('video')).toHaveAttribute('controls');
    expect(screen.queryByRole('button', { name: 'Edit media' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    const youtubeFrame = screen.getByTitle('YouTube video');
    expect(youtubeFrame).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1'
    );
    expect(youtubeFrame).toHaveAttribute(
      'allow',
      'autoplay; encrypted-media; fullscreen; picture-in-picture'
    );

    view.rerender(
      <StickyNoteNode
        {...defaultProps}
        data={{ color: 'yellow', content }}
        enableMediaEmbedding
        selected
      />
    );

    expect(screen.getByTitle('YouTube video')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Edit media' })).toHaveLength(3);
    expect(view.container.querySelectorAll('[data-sticky-full-width="true"]')).toHaveLength(2);
  });

  it('uses the same Video option for YouTube links', () => {
    const onContentChange = vi.fn();
    renderStickyNoteNode({
      data: { color: 'yellow', content: 'Video:' },
      enableMediaEmbedding: true,
      onContentChange,
    });

    fireEvent.doubleClick(screen.getByText('Video:'));
    const editor = screen.getByRole<HTMLTextAreaElement>('textbox');
    editor.setSelectionRange(editor.value.length, editor.value.length);
    fireEvent.click(screen.getByRole('button', { name: 'Embed image or video' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Video' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Video URL' }), {
      target: { value: 'https://youtu.be/M7lc1UVf-VE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Embed media' }));

    expect(onContentChange).toHaveBeenCalledWith(
      'Video:\n\n![YouTube video](<https://www.youtube.com/watch?v=M7lc1UVf-VE> "sticky-note-media;kind=youtube;layout=natural-width")'
    );
  });

  it('edits rendered media and applies the full-width layout', () => {
    const onContentChange = vi.fn();
    const content =
      '![Overview](<https://example.com/image.png> "sticky-note-media;kind=image;layout=natural-width")';
    const view = renderStickyNoteNode({
      data: { color: 'yellow', content },
      enableMediaEmbedding: true,
      onContentChange,
      selected: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit media' }));
    const fullWidth = screen.getByRole('checkbox', { name: 'Make full width' });
    expect(fullWidth).not.toBeChecked();
    fireEvent.click(fullWidth);
    const preview = screen.getAllByAltText('Overview').at(-1);
    expect(preview).toBeDefined();
    fireEvent.load(preview!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onContentChange).toHaveBeenCalledWith(
      '![Overview](<https://example.com/image.png> "sticky-note-media;kind=image;layout=full-width")'
    );
    expect(view.container.querySelector('[data-sticky-full-width="true"]')).toBeInTheDocument();
  });

  it('edits the correct duplicate media after preserved blank lines change rendered offsets', () => {
    const onContentChange = vi.fn();
    const natural =
      '![Overview](<https://example.com/image.png> "sticky-note-media;kind=image;layout=natural-width")';
    const fullWidth =
      '![Overview](<https://example.com/image.png> "sticky-note-media;kind=image;layout=full-width")';
    const content = `${natural}\n\n\n\n${natural}`;
    renderStickyNoteNode({
      data: { color: 'yellow', content },
      enableMediaEmbedding: true,
      onContentChange,
      selected: true,
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit media' })[1]!);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Make full width' }));
    const preview = screen.getAllByAltText('Overview').at(-1);
    expect(preview).toBeDefined();
    fireEvent.load(preview!);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onContentChange).toHaveBeenCalledWith(`${natural}\n\n\n\n${fullWidth}`);
  });

  it('retries rendering when an image URL changes after a load failure', () => {
    const firstContent =
      '![Overview](<https://example.com/first.png> "sticky-note-media;kind=image;layout=natural-width")';
    const view = renderStickyNoteNode({
      data: { color: 'yellow', content: firstContent },
      enableMediaEmbedding: true,
    });

    fireEvent.error(screen.getByRole('img', { name: 'Overview' }));
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();

    view.rerender(
      <StickyNoteNode
        {...defaultProps}
        data={{
          color: 'yellow',
          content:
            '![Overview](<https://example.com/second.png> "sticky-note-media;kind=image;layout=natural-width")',
        }}
        enableMediaEmbedding
      />
    );

    expect(screen.getByRole('img', { name: 'Overview' })).toHaveAttribute(
      'src',
      'https://example.com/second.png'
    );
  });

  it('returns to a thumbnail when the YouTube video changes', () => {
    const view = renderStickyNoteNode({
      data: {
        color: 'yellow',
        content:
          '![YouTube video](<https://www.youtube.com/watch?v=M7lc1UVf-VE> "sticky-note-media;kind=youtube;layout=natural-width")',
      },
      enableMediaEmbedding: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    expect(screen.getByTitle('YouTube video')).toBeInTheDocument();

    view.rerender(
      <StickyNoteNode
        {...defaultProps}
        data={{
          color: 'yellow',
          content:
            '![YouTube video](<https://www.youtube.com/watch?v=ZCuL2e4zC_4> "sticky-note-media;kind=youtube;layout=natural-width")',
        }}
        enableMediaEmbedding
      />
    );

    expect(screen.queryByTitle('YouTube video')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument();
  });
});
