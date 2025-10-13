import { memo, useCallback, useState, useRef, useEffect } from "react";
import type { NodeProps } from "@uipath/uix/xyflow/react";
import { NodeResizeControl, useReactFlow } from "@uipath/uix/xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NodeToolbar } from "../NodeToolbar";
import type { StickyNoteData, StickyNoteColor } from "./StickyNoteNode.types";
import { STICKY_NOTE_COLORS } from "./StickyNoteNode.types";
import {
  StickyNoteContainer,
  StickyNoteTextArea,
  StickyNoteMarkdown,
  ResizeHandle,
  CornerIndicators,
  BottomCornerIndicators,
  ColorPickerPanel,
  ColorOption,
} from "./StickyNoteNode.styles";
import { BASE_CANVAS_GRID_SPACING } from "../BaseCanvas";

export interface StickyNoteNodeProps extends NodeProps {
  data: StickyNoteData;
}

const minWidth = BASE_CANVAS_GRID_SPACING * 8;
const minHeight = BASE_CANVAS_GRID_SPACING * 8;

const StickyNoteNodeComponent = ({ id, data, selected, dragging }: StickyNoteNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [localContent, setLocalContent] = useState(data.content || "");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const colorButtonRef = useRef<HTMLDivElement>(null);

  const color = (data.color || "yellow") as StickyNoteColor;
  const backgroundColor = STICKY_NOTE_COLORS[color] ?? STICKY_NOTE_COLORS.yellow;

  useEffect(() => {
    setLocalContent(data.content || "");
  }, [data.content]);

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
      if (e.key === "Escape") {
        setIsEditing(false);
        setLocalContent(data.content || "");
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

  // Build toolbar config with only Edit and Color buttons
  const toolbarConfig = {
    actions: [
      {
        id: "edit",
        icon: <ApIcon variant="outlined" name="edit" />,
        label: "Edit",
        onAction: handleEditClick,
      },
      {
        id: "color",
        icon: (
          <div
            ref={colorButtonRef}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor,
              border: "1px solid #d1d5db",
            }}
          />
        ),
        label: "Color",
        onAction: handleToggleColorPicker,
      },
    ],
    position: "top" as const,
    align: "end" as const,
  };

  return (
    <>
      {/* Top-left resize control */}
      <NodeResizeControl
        style={{ background: "transparent", border: "none" }}
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
        style={{ background: "transparent", border: "none" }}
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
        style={{ background: "transparent", border: "none" }}
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
        style={{ background: "transparent", border: "none" }}
        position="bottom-right"
        minWidth={minWidth}
        minHeight={minHeight}
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResizeEnd}
      >
        <ResizeHandle selected={selected} cursor="nwse-resize" />
      </NodeResizeControl>

      <StickyNoteContainer backgroundColor={backgroundColor} isEditing={isEditing} selected={selected} onDoubleClick={handleDoubleClick}>
        <CornerIndicators selected={selected} />
        <BottomCornerIndicators selected={selected} />
        {isEditing ? (
          <StickyNoteTextArea
            ref={textAreaRef}
            value={localContent}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            readOnly={!isEditing}
            placeholder="Add text"
            isEditing={isEditing}
            className="nodrag nowheel"
          />
        ) : (
          <StickyNoteMarkdown>
            {localContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{localContent}</ReactMarkdown>
            ) : (
              <span style={{ color: "var(--color-foreground-de-emp)" }}>Add text</span>
            )}
          </StickyNoteMarkdown>
        )}
      </StickyNoteContainer>

      {selected && !dragging && !isResizing && (
        <NodeToolbar nodeId={id} config={toolbarConfig} visible={selected && !dragging && !isResizing} />
      )}
      <AnimatePresence>
        {selected && !dragging && !isResizing && isColorPickerOpen && (
          <div
            style={{
              position: "absolute",
              top: -74,
              right: 0,
              zIndex: 1000,
            }}
          >
            <ColorPickerPanel
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {Object.keys(STICKY_NOTE_COLORS).map((colorKey) => {
                const colorName = colorKey as StickyNoteColor;
                return (
                  <ColorOption
                    key={colorKey}
                    color={STICKY_NOTE_COLORS[colorName]}
                    isSelected={color === colorName}
                    onClick={() => handleColorChange(colorName)}
                    title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                  />
                );
              })}
            </ColorPickerPanel>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export const StickyNoteNode = memo(StickyNoteNodeComponent);
