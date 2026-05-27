import { Global } from '@emotion/react';
import { CanvasIcon } from '@uipath/apollo-react/canvas';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { NodeResizeControl, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ResizeDragEvent, ResizeParams } from '@uipath/apollo-react/canvas/xyflow/system';
import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { useSafeLingui } from '../../../i18n';
import { GRID_SPACING } from '../../constants';
import { NodeViewportOverlay } from '../NodeViewportOverlay';
import type { ToolbarAction } from '../Toolbar';
import { NodeToolbar } from '../Toolbar';
import { FormattingToolbar } from './FormattingToolbar';
import {
  type ActiveFormats,
  activeFormatsEqual,
  continueListOnEnter,
  detectActiveFormats,
} from './markdown-formatting';
import {
  BottomCornerIndicators,
  ColorOption,
  ColorPickerPanel,
  RESIZE_CONTROL_Z_INDEX,
  ResizeHandle,
  StickyNoteContainer,
  StickyNoteMarkdown,
  StickyNoteTextArea,
  StickyNoteWrapper,
  stickyNoteGlobalStyles,
  TopCornerIndicators,
} from './StickyNoteNode.styles';
import type { StickyNoteColor, StickyNoteData, TextSelection } from './StickyNoteNode.types';
import { STICKY_NOTE_COLORS, withAlpha } from './StickyNoteNode.types';
import { preserveNewlines } from './StickyNoteNode.utils';
import { useMarkdownShortcuts } from './useMarkdownShortcuts';
import { useScrollCapture } from './useScrollCapture';

export interface StickyNoteNodeProps extends NodeProps {
  data: StickyNoteData;
  placeholder?: string;
  renderPlaceholderOnSelect?: boolean;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
  onColorChange?: (color: StickyNoteColor) => void;
  onResize?: (width: number, height: number) => void;
}

const minWidth = GRID_SPACING * 8;
const minHeight = GRID_SPACING * 8;

const StickyNoteNodeComponent = ({
  id,
  data,
  selected,
  dragging,
  placeholder = 'Add text',
  renderPlaceholderOnSelect = false,
  readOnly = false,
  onContentChange,
  onColorChange,
  onResize,
}: StickyNoteNodeProps) => {
  const { _ } = useSafeLingui();
  const { updateNodeData, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(!readOnly && (data.autoFocus ?? false));
  const [isResizing, setIsResizing] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [localContent, setLocalContent] = useState(data.content || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { ref: markdownRef, scrollCaptureProps } = useScrollCapture();
  const colorButtonRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    strikethrough: false,
    bulletList: false,
    numberedList: false,
  });

  const colorKey = (data.color || 'yellow') as StickyNoteColor;
  const color = STICKY_NOTE_COLORS[colorKey] ?? STICKY_NOTE_COLORS.yellow;
  const colorWithAlpha = withAlpha(color);

  useEffect(() => {
    setLocalContent(data.content || '');
  }, [data.content]);

  // Handle autoFocus - focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
    // Clear autoFocus from data after initial focus to prevent re-focusing on re-renders
    if (!readOnly && data.autoFocus) {
      updateNodeData(id, { autoFocus: false });
    }
  }, [isEditing, data.autoFocus, id, updateNodeData, readOnly]);

  useEffect(() => {
    if (!selected || isResizing) {
      setIsColorPickerOpen(false);
    }
  }, [selected, isResizing]);

  useEffect(() => {
    if (readOnly) {
      setIsEditing(false);
      setLocalContent(data.content || '');
    }
  }, [readOnly, data.content]);

  const handleDoubleClick = useCallback(() => {
    if (readOnly || isEditing) return;
    setIsEditing(true);
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      }
    }, 0);
  }, [isEditing, readOnly]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (readOnly) return;
    if (localContent !== data.content) {
      onContentChange?.(localContent);
      updateNodeData(id, { content: localContent });
    }
  }, [id, localContent, data.content, updateNodeData, onContentChange, readOnly]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  }, []);

  const handleFormat = useCallback((result: TextSelection) => {
    setLocalContent(result.value);
    setActiveFormats(detectActiveFormats(result));
    requestAnimationFrame(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = result.selectionStart;
        textAreaRef.current.selectionEnd = result.selectionEnd;
      }
    });
  }, []);

  const updateActiveFormats = useCallback(() => {
    if (!textAreaRef.current) return;
    const next = detectActiveFormats({
      value: textAreaRef.current.value,
      selectionStart: textAreaRef.current.selectionStart,
      selectionEnd: textAreaRef.current.selectionEnd,
    });
    setActiveFormats((prev) => (activeFormatsEqual(prev, next) ? prev : next));
  }, []);

  const shortcutKeyDown = useMarkdownShortcuts(textAreaRef, handleFormat);

  // Handle key down for saving on Enter (optional, depends on UX preference)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setLocalContent(data.content || '');
        textAreaRef.current?.blur();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const textarea = textAreaRef.current;
        if (textarea) {
          const result = continueListOnEnter({
            value: textarea.value,
            selectionStart: textarea.selectionStart,
            selectionEnd: textarea.selectionEnd,
          });
          if (result) {
            e.preventDefault();
            handleFormat(result);
          }
        }
        return;
      }
      shortcutKeyDown(e);
    },
    [data.content, shortcutKeyDown, handleFormat]
  );

  // Resize handlers
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(
    (_event: ResizeDragEvent, params: ResizeParams) => {
      setIsResizing(false);
      onResize?.(params.width, params.height);
    },
    [onResize]
  );

  // Color change handler
  const handleColorChange = useCallback(
    (newColor: StickyNoteColor) => {
      onColorChange?.(newColor);
      updateNodeData(id, { color: newColor });
      setIsColorPickerOpen(false);
    },
    [id, updateNodeData, onColorChange]
  );

  // Toggle color picker
  const handleToggleColorPicker = useCallback(() => {
    setIsColorPickerOpen((prev) => !prev);
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    if (readOnly) return;
    setIsEditing(true);
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      }
    }, 0);
  }, [readOnly]);

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  // Custom markdown components to handle link clicks properly in React Flow nodes
  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
        >
          {children}
        </a>
      ),
    }),
    []
  );

  // Build toolbar config with only Edit and Color buttons
  const toolbarConfig = useMemo(() => {
    const actions: ToolbarAction[] = [
      {
        id: 'delete',
        icon: <CanvasIcon icon="trash" size={14} />,
        label: _({ id: 'sticky-note.toolbar.delete', message: 'Delete' }),
        onAction: handleDelete,
      },
      {
        id: 'edit',
        icon: <CanvasIcon icon="pencil" size={14} />,
        label: _({ id: 'sticky-note.toolbar.edit', message: 'Edit' }),
        onAction: handleEditClick,
      },
      { id: 'separator' },
      {
        id: 'color',
        icon: (
          <div
            ref={colorButtonRef}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: color,
              border: '1px solid transparent',
            }}
          />
        ),
        label: _({ id: 'sticky-note.toolbar.color', message: 'Color' }),
        onAction: handleToggleColorPicker,
      },
    ];
    return {
      actions,
      overflowActions: [],
      overflowLabel: '',
      position: 'top' as const,
      align: 'center' as const,
    };
  }, [_, handleEditClick, handleToggleColorPicker, color, handleDelete]);

  return (
    <>
      <Global styles={stickyNoteGlobalStyles} />
      <StickyNoteWrapper data-sticky-note>
        {!readOnly && (
          <>
            {/* Top-left resize control */}
            <NodeResizeControl
              style={{ background: 'transparent', border: 'none', zIndex: RESIZE_CONTROL_Z_INDEX }}
              position="top-left"
              minWidth={minWidth}
              minHeight={minHeight}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            >
              <ResizeHandle selected={selected} cursor="nwse-resize" />
            </NodeResizeControl>

            {/* Top-right resize control */}
            <NodeResizeControl
              style={{ background: 'transparent', border: 'none', zIndex: RESIZE_CONTROL_Z_INDEX }}
              position="top-right"
              minWidth={minWidth}
              minHeight={minHeight}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            >
              <ResizeHandle selected={selected} cursor="nesw-resize" />
            </NodeResizeControl>

            {/* Bottom-left resize control */}
            <NodeResizeControl
              style={{ background: 'transparent', border: 'none', zIndex: RESIZE_CONTROL_Z_INDEX }}
              position="bottom-left"
              minWidth={minWidth}
              minHeight={minHeight}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            >
              <ResizeHandle selected={selected} cursor="nesw-resize" />
            </NodeResizeControl>

            {/* Bottom-right resize control */}
            <NodeResizeControl
              style={{ background: 'transparent', border: 'none', zIndex: RESIZE_CONTROL_Z_INDEX }}
              position="bottom-right"
              minWidth={minWidth}
              minHeight={minHeight}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            >
              <ResizeHandle selected={selected} cursor="nwse-resize" />
            </NodeResizeControl>
          </>
        )}

        <StickyNoteContainer
          backgroundColor={colorWithAlpha}
          borderColor={color}
          isEditing={isEditing}
          selected={selected}
          isReadOnly={readOnly}
          onDoubleClick={handleDoubleClick}
        >
          <TopCornerIndicators visible={selected && !readOnly} />
          <BottomCornerIndicators visible={selected && !readOnly} />
          {isEditing ? (
            <>
              <FormattingToolbar
                textAreaRef={textAreaRef}
                borderColor={color}
                activeFormats={activeFormats}
                onFormat={handleFormat}
              />
              <StickyNoteTextArea
                ref={textAreaRef}
                value={localContent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onSelect={updateActiveFormats}
                onKeyUp={updateActiveFormats}
                placeholder={placeholder}
                isEditing={isEditing}
                className="nodrag nowheel"
              />
            </>
          ) : (
            <StickyNoteMarkdown ref={markdownRef} {...scrollCaptureProps}>
              {localContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={markdownComponents}
                >
                  {preserveNewlines(localContent)}
                </ReactMarkdown>
              ) : (
                // Render placeholder if renderPlaceholderOnSelect is enabled, node is selected, and the content is empty
                renderPlaceholderOnSelect &&
                selected && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={markdownComponents}
                  >
                    {placeholder}
                  </ReactMarkdown>
                )
              )}
            </StickyNoteMarkdown>
          )}
        </StickyNoteContainer>

        {!readOnly && selected && !dragging && !isResizing && (
          <NodeToolbar nodeId={id} config={toolbarConfig} expanded={true} portalToNodeOverlay />
        )}
        {!readOnly && selected && !dragging && !isResizing && (
          <NodeViewportOverlay nodeId={id} layer="nodeToolbar">
            <AnimatePresence>
              {isColorPickerOpen && (
                <div
                  className="nodrag nopan nowheel"
                  style={{
                    position: 'absolute',
                    top: -40,
                    left: '50%',
                    transform: 'translateX(40px)',
                    zIndex: 1000,
                    pointerEvents: 'auto',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ColorPickerPanel
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {Object.keys(STICKY_NOTE_COLORS).map((stickyColorKey) => {
                      const colorName = stickyColorKey as StickyNoteColor;
                      return (
                        <ColorOption
                          type="button"
                          key={stickyColorKey}
                          color={STICKY_NOTE_COLORS[colorName]}
                          isSelected={colorKey === colorName}
                          onClick={() => handleColorChange(colorName)}
                          title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                        />
                      );
                    })}
                  </ColorPickerPanel>
                </div>
              )}
            </AnimatePresence>
          </NodeViewportOverlay>
        )}
      </StickyNoteWrapper>
    </>
  );
};

export const StickyNoteNode = memo(StickyNoteNodeComponent);
