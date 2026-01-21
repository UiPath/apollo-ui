import { Global } from '@emotion/react';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { NodeResizeControl, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GRID_SPACING } from '../../constants';
import type { ToolbarAction } from '../Toolbar';
import { NodeToolbar } from '../Toolbar';
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
import type { StickyNoteColor, StickyNoteData } from './StickyNoteNode.types';
import { STICKY_NOTE_COLORS, withAlpha } from './StickyNoteNode.types';

export interface StickyNoteNodeProps extends NodeProps {
  data: StickyNoteData;
  placeholder?: string;
  renderPlaceholderOnSelect?: boolean;
}

const minWidth = GRID_SPACING * 8;
const minHeight = GRID_SPACING * 8;

const StickyNoteNodeComponent = ({ id, data, selected, dragging, placeholder = 'Add text', renderPlaceholderOnSelect = false }: StickyNoteNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(data.autoFocus ?? false);
  const [isResizing, setIsResizing] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [localContent, setLocalContent] = useState(data.content || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const colorButtonRef = useRef<HTMLDivElement>(null);

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
    if (data.autoFocus) {
      updateNodeData(id, { autoFocus: false });
    }
  }, [isEditing, data.autoFocus, id, updateNodeData]);

  useEffect(() => {
    if (!selected || isResizing) {
      setIsColorPickerOpen(false);
    }
  }, [selected, isResizing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      }
    }, 0);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (localContent !== data.content) {
      updateNodeData(id, { content: localContent });
    }
  }, [id, localContent, data.content, updateNodeData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  }, []);

  // Handle key down for saving on Enter (optional, depends on UX preference)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setLocalContent(data.content || '');
        textAreaRef.current?.blur();
      }
      // Allow Enter for new lines, use Ctrl+Enter or blur to save
    },
    [data.content]
  );

  // Resize handlers
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Color change handler
  const handleColorChange = useCallback(
    (newColor: StickyNoteColor) => {
      updateNodeData(id, { color: newColor });
      setIsColorPickerOpen(false);
    },
    [id, updateNodeData]
  );

  // Toggle color picker
  const handleToggleColorPicker = useCallback(() => {
    setIsColorPickerOpen((prev) => !prev);
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      }
    }, 0);
  }, []);

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
        id: 'edit',
        icon: <ApIcon variant="outlined" name="edit" />,
        label: 'Edit',
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
        label: 'Color',
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
  }, [handleEditClick, handleToggleColorPicker, color]);

  return (
    <>
      <Global styles={stickyNoteGlobalStyles} />
      <StickyNoteWrapper>
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

        <StickyNoteContainer
          backgroundColor={colorWithAlpha}
          borderColor={color}
          isEditing={isEditing}
          selected={selected}
          onDoubleClick={handleDoubleClick}
        >
          <TopCornerIndicators selected={selected} />
          <BottomCornerIndicators selected={selected} />
          {isEditing ? (
            <StickyNoteTextArea
              ref={textAreaRef}
              value={localContent}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              readOnly={!isEditing}
              placeholder={placeholder}
              isEditing={isEditing}
              className="nodrag nowheel"
            />
          ) : (
            <StickyNoteMarkdown>
              {localContent ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {localContent}
                </ReactMarkdown>
              ) : (
                // Render placeholder if renderPlaceholderOnSelect is enabled, node is selected, and the content is empty
                renderPlaceholderOnSelect &&
                selected && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {placeholder}
                  </ReactMarkdown>
                )
              )}
            </StickyNoteMarkdown>
          )}
        </StickyNoteContainer>

        {selected && !dragging && !isResizing && (
          <NodeToolbar
            nodeId={id}
            config={toolbarConfig}
            expanded={selected && !dragging && !isResizing}
          />
        )}
        <AnimatePresence>
          {selected && !dragging && !isResizing && isColorPickerOpen && (
            <div
              style={{
                position: 'absolute',
                top: -40,
                left: '50%',
                transform: 'translateX(40px)',
                zIndex: 1000,
              }}
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
      </StickyNoteWrapper>
    </>
  );
};

export const StickyNoteNode = memo(StickyNoteNodeComponent);
