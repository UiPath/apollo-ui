import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasIcon } from '@uipath/apollo-react/canvas';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { StoryInfoPanel, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StickyNoteNode, type StickyNoteNodeProps } from './StickyNoteNode';
import type {
  StickyNoteColor,
  StickyNoteData,
  StickyNoteEditorActionContext,
  StickyNoteFormattingAction,
  TextSelection,
} from './StickyNoteNode.types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: 'Components/Nodes/StickyNoteNode',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const LOOP_TYPE = 'uipath.control-flow.foreach';
const STORY_LOOP_START_HANDLE_ID = 'start';
const STORY_LOOP_CONTINUE_HANDLE_ID = 'continue';
const STORY_LOOP_SUCCESS_HANDLE_ID = 'success';

// ============================================================================
// Helper Functions
// ============================================================================

// StickyNote wrapper with console logging for callbacks
const StickyNoteWithCallbacks = (props: StickyNoteNodeProps) => {
  const handleContentChange = (content: string) => {
    console.log('📝 Content changed:', {
      nodeId: props.id,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  const handleColorChange = (color: StickyNoteColor) => {
    console.log('🎨 Color changed:', {
      nodeId: props.id,
      color,
      timestamp: new Date().toISOString(),
    });
  };

  const handleResize = (width: number, height: number) => {
    console.log('📏 Resized:', {
      nodeId: props.id,
      width,
      height,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <StickyNoteNode
      {...props}
      onContentChange={handleContentChange}
      onColorChange={handleColorChange}
      onResize={handleResize}
    />
  );
};

const nodeTypes = {
  stickyNote: StickyNoteNode,
};

const nodeTypesWithCallbacks = {
  stickyNote: StickyNoteWithCallbacks,
};

const DEMO_MEDIA = {
  image: {
    alt: 'Embedded image',
    defaultUrl: 'https://placehold.co/320x180/png?text=Sticky+note+image',
  },
  youtube: {
    alt: 'Embedded YouTube video',
    defaultUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
  },
  publicVideo: {
    alt: 'Embedded public video',
    defaultUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
} as const;

type DemoMediaKind = keyof typeof DEMO_MEDIA;
type DemoEmbedType = 'image' | 'video';

type DemoMediaDialog = {
  context: StickyNoteEditorActionContext;
};

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function getYouTubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;

    const host = url.hostname.replace(/^www\./, '');
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v');
      if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/').filter(Boolean)[1] ?? null;
      }
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

function isYouTubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    return (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'youtu.be'
    );
  } catch {
    return false;
  }
}

function createDemoMediaMarkdown(kind: DemoMediaKind, fullWidth: boolean): string {
  const media = DEMO_MEDIA[kind];
  const layoutTitle = fullWidth ? ' "full-width"' : '';
  return `![${media.alt}](${media.defaultUrl}${layoutTitle})`;
}

function insertMediaAtSelection(
  currentValue: string,
  selection: TextSelection,
  alt: string,
  mediaUrl: string,
  fullWidth: boolean
): TextSelection {
  const layoutTitle = fullWidth ? ' "full-width"' : '';
  const markdown = `![${alt}](${mediaUrl}${layoutTitle})`;
  const selectionIsCurrent = currentValue === selection.value;
  const start = selectionIsCurrent ? selection.selectionStart : currentValue.length;
  const end = selectionIsCurrent ? selection.selectionEnd : currentValue.length;
  const prefix = start > 0 && currentValue[start - 1] !== '\n' ? '\n\n' : '';
  const suffix = end < currentValue.length && currentValue[end] !== '\n' ? '\n\n' : '';
  const value = `${currentValue.slice(0, start)}${prefix}${markdown}${suffix}${currentValue.slice(end)}`;
  const cursor = start + prefix.length + markdown.length;

  return { value, selectionStart: cursor, selectionEnd: cursor };
}

function StickyNoteWithEditorExtensions(props: StickyNoteNodeProps) {
  const [dialog, setDialog] = useState<DemoMediaDialog | null>(null);
  const [embedType, setEmbedType] = useState<DemoEmbedType>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [makeFullWidth, setMakeFullWidth] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const mediaUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dialog) return;
    requestAnimationFrame(() => mediaUrlInputRef.current?.focus());
  }, [dialog]);

  const openMediaDialog = useCallback((context: StickyNoteEditorActionContext) => {
    setEmbedType('image');
    setMediaUrl(DEMO_MEDIA.image.defaultUrl);
    setMakeFullWidth(true);
    setValidationMessage('');
    setDialog({ context });
  }, []);

  const selectEmbedType = useCallback((type: DemoEmbedType) => {
    setEmbedType(type);
    setMediaUrl(type === 'image' ? DEMO_MEDIA.image.defaultUrl : DEMO_MEDIA.youtube.defaultUrl);
    setValidationMessage('');
  }, []);

  const cancelMediaDialog = useCallback(() => {
    dialog?.context.resume();
    setDialog(null);
    setValidationMessage('');
  }, [dialog]);

  const insertMedia = useCallback(() => {
    if (!dialog) return;
    if (!isHttpsUrl(mediaUrl)) {
      setValidationMessage('Enter a valid HTTPS URL.');
      return;
    }
    const youtubeEmbedUrl = embedType === 'video' ? getYouTubeEmbedUrl(mediaUrl) : null;
    if (embedType === 'video' && isYouTubeUrl(mediaUrl) && !youtubeEmbedUrl) {
      setValidationMessage('Enter a valid public YouTube URL.');
      return;
    }

    const media =
      embedType === 'image'
        ? DEMO_MEDIA.image
        : youtubeEmbedUrl
          ? DEMO_MEDIA.youtube
          : DEMO_MEDIA.publicVideo;
    dialog.context.commit(
      insertMediaAtSelection(
        dialog.context.currentValue(),
        dialog.context.selection,
        media.alt,
        mediaUrl,
        makeFullWidth
      )
    );
    setDialog(null);
    setValidationMessage('');
  }, [dialog, embedType, makeFullWidth, mediaUrl]);

  const formattingActions = useMemo<readonly StickyNoteFormattingAction[]>(
    () => [
      {
        id: 'embed-demo-media',
        icon: <CanvasIcon icon="image-plus" size={14} />,
        label: 'Embed media',
        onAction: openMediaDialog,
      },
    ],
    [openMediaDialog]
  );

  const renderMarkdown = useCallback(
    (content: string) => (
      <ReactMarkdown
        components={{
          img: ({ src, alt, title }) => {
            const fullWidth = title === 'full-width';

            if (alt === DEMO_MEDIA.youtube.alt) {
              const embedUrl = getYouTubeEmbedUrl(src ?? '');
              return embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={alt}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: fullWidth ? '100%' : 320,
                    maxWidth: '100%',
                    aspectRatio: '16 / 9',
                    border: 0,
                    borderRadius: 6,
                  }}
                />
              ) : null;
            }

            if (alt === DEMO_MEDIA.publicVideo.alt) {
              return (
                <video
                  src={src}
                  aria-label={alt}
                  controls
                  muted
                  preload="metadata"
                  style={{
                    display: 'block',
                    width: fullWidth ? '100%' : 320,
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 6,
                  }}
                />
              );
            }

            return (
              <img
                src={src}
                alt={alt ?? ''}
                draggable={false}
                style={{
                  display: 'block',
                  width: fullWidth ? '100%' : 'auto',
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 6,
                }}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    ),
    []
  );

  return (
    <>
      <StickyNoteNode
        {...props}
        formattingActions={formattingActions}
        renderMarkdown={renderMarkdown}
      />
      {dialog &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="presentation"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'grid',
              placeItems: 'start center',
              paddingTop: 72,
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) cancelMediaDialog();
            }}
          >
            <form
              role="dialog"
              aria-labelledby="sticky-note-media-dialog-title"
              onSubmit={(event) => {
                event.preventDefault();
                insertMedia();
              }}
              style={{
                width: 'min(380px, calc(100vw - 32px))',
                padding: 16,
                border: '1px solid var(--canvas-border-de-emp)',
                borderRadius: 8,
                color: 'var(--canvas-foreground)',
                background: 'var(--canvas-background-raised)',
                boxShadow: '0 12px 32px rgb(0 0 0 / 28%)',
              }}
            >
              <h2 id="sticky-note-media-dialog-title" style={{ margin: '0 0 8px', fontSize: 18 }}>
                Embed media
              </h2>
              <p
                style={{
                  margin: '0 0 16px',
                  color: 'var(--canvas-foreground-de-emp)',
                  fontSize: 13,
                }}
              >
                Choose an image or video link. YouTube and direct public video URLs use the same
                Video option.
              </p>
              <fieldset style={{ margin: '0 0 14px', padding: 0, border: 0 }}>
                <legend style={{ marginBottom: 6, fontSize: 13 }}>Media type</legend>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input
                      type="radio"
                      name="sticky-note-demo-media-type"
                      checked={embedType === 'image'}
                      onChange={() => selectEmbedType('image')}
                    />
                    Image
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input
                      type="radio"
                      name="sticky-note-demo-media-type"
                      checked={embedType === 'video'}
                      onChange={() => selectEmbedType('video')}
                    />
                    Video
                  </label>
                </div>
              </fieldset>
              <label
                htmlFor="sticky-note-demo-media-url"
                style={{ display: 'block', fontSize: 13 }}
              >
                {embedType === 'image' ? 'HTTPS image URL' : 'YouTube or public video URL'}
              </label>
              <input
                ref={mediaUrlInputRef}
                id="sticky-note-demo-media-url"
                value={mediaUrl}
                onChange={(event) => {
                  setMediaUrl(event.target.value);
                  setValidationMessage('');
                }}
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  marginTop: 6,
                  padding: '9px 10px',
                  border: '1px solid var(--canvas-border)',
                  borderRadius: 6,
                  color: 'var(--canvas-foreground)',
                  background: 'var(--canvas-background)',
                }}
              />
              {embedType === 'video' && (
                <p
                  style={{
                    margin: '6px 0 0',
                    color: 'var(--canvas-foreground-de-emp)',
                    fontSize: 12,
                  }}
                >
                  Accepts YouTube watch, share, Shorts, and embed URLs, or a direct public video URL
                  such as MP4.
                </p>
              )}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={makeFullWidth}
                  onChange={(event) => setMakeFullWidth(event.target.checked)}
                />
                Make full width
              </label>
              {validationMessage && (
                <p role="alert" style={{ margin: '8px 0 0', color: 'var(--canvas-error-icon)' }}>
                  {validationMessage}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button type="button" onClick={cancelMediaDialog} style={{ padding: '8px 14px' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 14px' }}>
                  Insert media
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}

const nodeTypesWithEditorExtensions = {
  stickyNote: StickyNoteWithEditorExtensions,
};

const ReadOnlyStickyNote = (props: StickyNoteNodeProps) => <StickyNoteNode {...props} readOnly />;

const nodeTypesReadOnly = {
  stickyNote: ReadOnlyStickyNote,
};

function createStickyNote(
  id: string,
  color: StickyNoteColor,
  content: string,
  position: { x: number; y: number },
  size: { width: number; height: number } = { width: 250, height: 150 },
  zIndex?: number
): Node<StickyNoteData> {
  return {
    id,
    type: 'stickyNote',
    position,
    data: { color, content },
    width: size.width,
    height: size.height,
    ...(zIndex !== undefined && { zIndex }),
  };
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo<Node<StickyNoteData>[]>(
    () => [
      createStickyNote(
        'sticky-yellow-note',
        'yellow',
        '**Markdown Support!**\n\nDouble-click to edit with *markdown*\n- Drag to move\n- Resize from corners',
        { x: 50, y: 50 }
      ),
      createStickyNote(
        'sticky-pink-note',
        'pink',
        '## Important\n\n~~Strikethrough~~ and `inline code` work too!',
        { x: 350, y: 50 }
      ),
      createStickyNote(
        'sticky-blue-note',
        'blue',
        '**Lists:**\n\n1. First item\n2. Second item\n3. Third item',
        { x: 350, y: 250 }
      ),
      createStickyNote('sticky-green-note', 'green', 'Green note for positive feedback', {
        x: 50,
        y: 250,
      }),
      createStickyNote('sticky-white-note', 'white', 'White note for general notes', {
        x: 50,
        y: 450,
      }),
      createStickyNote(
        'sticky-long-note',
        'yellow',
        'This is a longer sticky note with lots of content to demonstrate scrolling.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDouble-click to edit, then use mouse wheel to scroll through the content.',
        { x: 350, y: 450 },
        { width: 280, height: 200 }
      ),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, additionalNodeTypes: nodeTypes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function createBaseNode(
  id: string,
  iconName: string,
  label: string,
  subLabel: string,
  position: { x: number; y: number },
  handleConfigurations: Array<{
    position: Position;
    handles: Array<{
      id: string;
      type: 'source' | 'target';
      handleType: 'input' | 'output';
      label: string;
    }>;
  }>
): Node {
  return {
    id,
    type: 'uipath.blank-node',
    position,
    data: {
      display: {
        icon: iconName,
        label,
        subLabel,
      },
      handleConfigurations,
    },
    zIndex: 0,
  };
}

function createLoopContainerNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  options?: { parentId?: string; selected?: boolean }
): Node {
  const parentScope = options?.parentId
    ? { parentId: options.parentId, extent: 'parent' as const }
    : {};

  return {
    id,
    type: LOOP_TYPE,
    position,
    ...parentScope,
    selected: options?.selected ?? false,
    data: {
      display: {
        label,
        shape: 'container',
      },
    },
    style: size,
  };
}

function createLoopActivityNode(
  id: string,
  label: string,
  position: { x: number; y: number },
  parentId?: string
): Node {
  const node = createBaseNode(id, 'play', label, '', position, [
    {
      position: Position.Left,
      handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
    },
    {
      position: Position.Right,
      handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
    },
  ]);

  return parentId ? { ...node, parentId, extent: 'parent' as const } : node;
}

function createPipelineNodes(): Node[] {
  return [
    // Data Ingestion Section
    createStickyNote(
      'sticky-ingestion',
      'blue',
      '## Data Ingestion\nCollect and validate incoming data',
      { x: 48, y: 48 },
      { width: 608, height: 512 },
      -10
    ),
    createBaseNode(
      'node-source',
      'cloud-upload',
      'Data Source',
      'Input Stream',
      { x: 128, y: 224 },
      [
        {
          position: Position.Right,
          handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ]
    ),
    createBaseNode('node-filter', 'filter', 'Filter', 'Validation Rules', { x: 416, y: 224 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [
          { id: 'transform', type: 'source', handleType: 'output', label: 'Transform' },
          { id: 'enrich', type: 'source', handleType: 'output', label: 'Enrich' },
        ],
      },
    ]),

    // Data Processing Section
    createStickyNote(
      'sticky-processing',
      'yellow',
      '## Data Processing\nTransform and combine data streams',
      { x: 720, y: 48 },
      { width: 800, height: 512 },
      -10
    ),
    createBaseNode(
      'node-transform',
      'settings',
      'Transform',
      'Data Processing',
      { x: 800, y: 144 },
      [
        {
          position: Position.Left,
          handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
        },
        {
          position: Position.Right,
          handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
        },
      ]
    ),
    createBaseNode('node-enrich', 'plus-circle', 'Enrich', 'Add Metadata', { x: 800, y: 304 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Output' }],
      },
    ]),
    createBaseNode('node-merge', 'git-merge', 'Merge', 'Combine Streams', { x: 1216, y: 224 }, [
      {
        position: Position.Left,
        handles: [
          { id: 'input1', type: 'target', handleType: 'input', label: 'Stream 1' },
          { id: 'input2', type: 'target', handleType: 'input', label: 'Stream 2' },
        ],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Merged' }],
      },
    ]),

    // Data Storage Section
    createStickyNote(
      'sticky-storage',
      'green',
      '## Storage & Analytics\nPersist and analyze processed data',
      { x: 1584, y: 48 },
      { width: 800, height: 512 },
      -10
    ),
    createBaseNode('node-storage', 'database', 'Storage', 'Database', { x: 1664, y: 144 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Logs' }],
      },
    ]),
    createBaseNode('node-index', 'search', 'Index', 'Search Engine', { x: 1664, y: 304 }, [
      {
        position: Position.Left,
        handles: [{ id: 'input', type: 'target', handleType: 'input', label: 'Input' }],
      },
      {
        position: Position.Right,
        handles: [{ id: 'output', type: 'source', handleType: 'output', label: 'Events' }],
      },
    ]),
    createBaseNode('node-monitor', 'bar-chart', 'Monitor', 'Analytics', { x: 2080, y: 224 }, [
      {
        position: Position.Left,
        handles: [
          { id: 'logs', type: 'target', handleType: 'input', label: 'Logs' },
          { id: 'events', type: 'target', handleType: 'input', label: 'Events' },
        ],
      },
    ]),

    // Annotation
    createStickyNote(
      'sticky-annotation',
      'pink',
      '**Data Pipeline Pattern**\n\nThis workflow demonstrates using sticky notes as visual containers to organize and document sections of a data processing pipeline. Each colored section groups related operations while nodes and edges remain fully interactive on top.',
      { x: 48, y: 608 },
      { width: 1024, height: 176 },
      -10
    ),
  ];
}

function createPipelineEdges(): Edge[] {
  return [
    // Data Ingestion flow
    {
      id: 'e-source-filter',
      source: 'node-source',
      sourceHandle: 'output',
      target: 'node-filter',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    // Processing flows - parallel streams
    {
      id: 'e-filter-transform',
      source: 'node-filter',
      sourceHandle: 'transform',
      target: 'node-transform',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    {
      id: 'e-filter-enrich',
      source: 'node-filter',
      sourceHandle: 'enrich',
      target: 'node-enrich',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    // Merge flows
    {
      id: 'e-transform-merge',
      source: 'node-transform',
      sourceHandle: 'output',
      target: 'node-merge',
      targetHandle: 'input1',
      type: 'smoothstep',
    },
    {
      id: 'e-enrich-merge',
      source: 'node-enrich',
      sourceHandle: 'output',
      target: 'node-merge',
      targetHandle: 'input2',
      type: 'smoothstep',
    },
    // Storage flows
    {
      id: 'e-merge-storage',
      source: 'node-merge',
      sourceHandle: 'output',
      target: 'node-storage',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    {
      id: 'e-merge-index',
      source: 'node-merge',
      sourceHandle: 'output',
      target: 'node-index',
      targetHandle: 'input',
      type: 'smoothstep',
    },
    // Analytics flows
    {
      id: 'e-storage-monitor',
      source: 'node-storage',
      sourceHandle: 'output',
      target: 'node-monitor',
      targetHandle: 'logs',
      type: 'smoothstep',
    },
    {
      id: 'e-index-monitor',
      source: 'node-index',
      sourceHandle: 'output',
      target: 'node-monitor',
      targetHandle: 'events',
      type: 'smoothstep',
    },
  ];
}

function WithBaseNodesStory() {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const initialEdges = useMemo(() => createPipelineEdges(), []);

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: nodeTypes,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design" elevateNodesOnSelect>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function StickyNotesInLoopContainersStory() {
  const initialNodes = useMemo<Node[]>(
    () => [
      createLoopActivityNode('ingress', 'Load records', { x: 32, y: 384 }),
      createLoopContainerNode(
        'outer-loop',
        'For Each claim',
        { x: 224, y: 128 },
        { width: 1104, height: 608 },
        { selected: true }
      ),
      createLoopContainerNode(
        'inner-loop',
        'For Each attachment',
        { x: 96, y: 160 },
        { width: 544, height: 288 },
        { parentId: 'outer-loop' }
      ),
      createLoopActivityNode('inner-child', 'Classify attachment', { x: 176, y: 96 }, 'inner-loop'),
      createLoopActivityNode('edge-left', 'Read metadata', { x: 176, y: 448 }, 'outer-loop'),
      createLoopActivityNode('edge-right', 'Validate claim', { x: 800, y: 448 }, 'outer-loop'),
      createLoopActivityNode('review', 'Review finding', { x: 800, y: 256 }, 'outer-loop'),
      createStickyNote(
        'sticky-nested-loop-note',
        'pink',
        '**Nested loop sticky**\n\nInside the inner loop body with a base node nearby.',
        { x: 400, y: 368 },
        { width: 288, height: 176 }
      ),
      createStickyNote(
        'sticky-edge-overlap-note',
        'green',
        '**Edge overlap sticky**\n\nThe Read metadata → Validate claim edge intentionally crosses this note.',
        { x: 600, y: 592 },
        { width: 320, height: 128 }
      ),
      createStickyNote(
        'sticky-outside-control-note',
        'blue',
        '**Outside control**\n\nCompare hover, selection, toolbar, and resize behavior here.',
        { x: 600, y: 768 },
        { width: 320, height: 128 }
      ),
      createLoopActivityNode('egress', 'Publish results', { x: 1440, y: 384 }),
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      {
        id: 'ingress-outer-loop',
        source: 'ingress',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: 'input',
      },
      {
        id: 'outer-loop-inner-loop',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-loop',
        targetHandle: 'input',
      },
      {
        id: 'inner-loop-inner-child',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_START_HANDLE_ID,
        target: 'inner-child',
        targetHandle: 'input',
      },
      {
        id: 'inner-child-inner-loop',
        source: 'inner-child',
        sourceHandle: 'output',
        target: 'inner-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'inner-loop-review',
        source: 'inner-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'review',
        targetHandle: 'input',
      },
      {
        id: 'edge-left-edge-right',
        source: 'edge-left',
        sourceHandle: 'output',
        target: 'edge-right',
        targetHandle: 'input',
      },
      {
        id: 'review-outer-loop',
        source: 'review',
        sourceHandle: 'output',
        target: 'outer-loop',
        targetHandle: STORY_LOOP_CONTINUE_HANDLE_ID,
      },
      {
        id: 'outer-loop-egress',
        source: 'outer-loop',
        sourceHandle: STORY_LOOP_SUCCESS_HANDLE_ID,
        target: 'egress',
        targetHandle: 'input',
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: nodeTypes,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
      <StoryInfoPanel
        title="Sticky Notes In Loop Containers"
        description="Validation story for sticky notes inside selected/nested loops, sticky notes crossed by workflow edges, and an outside-loop control note."
      />
    </BaseCanvas>
  );
}

function WithCallbacksStory() {
  const initialNodes = useMemo<Node<StickyNoteData>[]>(
    () => [
      createStickyNote(
        'sticky-test-1',
        'yellow',
        '**Test Callbacks!**\n\n1. Double-click to edit content\n2. Click the color button to change color\n3. Drag corners to resize\n\nOpen the browser console to see logs! 🔍',
        { x: 480, y: 240 },
        { width: 320, height: 320 }
      ),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: nodeTypesWithCallbacks,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function EditorExtensionsStory() {
  const initialNodes = useMemo<Node<StickyNoteData>[]>(() => {
    const editorNote = createStickyNote(
      'sticky-editor-extensions',
      'yellow',
      '**Complete media playground**\n\nPlace the cursor or select text, then choose **Embed media**. Pick Image or Video, toggle **Make full width**, insert or cancel, then press Escape to preview.',
      { x: 50, y: 190 },
      { width: 420, height: 400 }
    );
    const galleryNote = createStickyNote(
      'sticky-media-gallery',
      'blue',
      [
        '## Rendered media gallery',
        '### Full-width image',
        createDemoMediaMarkdown('image', true),
        '### Full-width YouTube video',
        createDemoMediaMarkdown('youtube', true),
        '### Full-width public video',
        createDemoMediaMarkdown('publicVideo', true),
      ].join('\n\n'),
      { x: 560, y: 80 },
      { width: 360, height: 520 }
    );

    return [
      { ...editorNote, selected: true, data: { ...editorNote.data, autoFocus: true } },
      galleryNote,
    ];
  }, []);

  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: nodeTypesWithEditorExtensions,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Complete Sticky Note Media Extension"
        description="One Embed media action opens one popover. Choose Image or Video; Video automatically handles YouTube and direct public links. Test cursor insertion or selected-text replacement, HTTPS validation, optional full width, cancel/resume, stale-content append fallback, tooltip, and custom rendering. Press Escape after inserting to preview. The blue note shows all three rendered outcomes."
        collapsible
        defaultCollapsed
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function ReadOnlyStory() {
  const initialNodes = useMemo<Node<StickyNoteData>[]>(
    () => [
      createStickyNote(
        'sticky-readonly-yellow',
        'yellow',
        '**Read-only sticky note**\n\nDouble-click does nothing, no toolbar appears, and corners are not resizable.\n\nLinks like [docs](https://example.com) still work.',
        { x: 480, y: 240 },
        { width: 300, height: 300 }
      ),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({
    initialNodes,
    additionalNodeTypes: nodeTypesReadOnly,
  });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const WithBaseNodes: Story = {
  render: () => <WithBaseNodesStory />,
};

export const StickyNotesInLoopContainers: Story = {
  render: () => <StickyNotesInLoopContainersStory />,
};

export const WithCallbacks: Story = {
  render: () => <WithCallbacksStory />,
};

export const EditorExtensions: Story = {
  render: () => <EditorExtensionsStory />,
};

export const ReadOnly: Story = {
  render: () => <ReadOnlyStory />,
};
