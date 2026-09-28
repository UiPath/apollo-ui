import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { motion } from 'motion/react';

// Sticky notes must be below edges (z-index: 0). We use -10 instead of -1 to allow for future layers between sticky notes and edges if needed.
export const STICKY_NOTE_BELOW_EDGE_Z_INDEX = -10;

const stickyNoteContentStyles = `
  width: 100%;
  height: 100%;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--canvas-foreground);

  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--canvas-border);
    border-radius: 4px;
  }
`;

// Resize controls need to be above the sticky note content to be interactable
export const RESIZE_CONTROL_Z_INDEX = 100;

export const stickyNoteGlobalStyles = css`
  /* Override React Flow's elevateNodesOnSelect behavior for sticky notes */
  /* Edges have z-index: 0, so we use STICKY_NOTE_BELOW_EDGE_Z_INDEX to ensure sticky notes are below edges */
  .react-flow .react-flow__node:has([data-sticky-note]),
  .react-flow .react-flow__node.selected:has([data-sticky-note]) {
    z-index: ${STICKY_NOTE_BELOW_EDGE_Z_INDEX} !important;
  }
`;

export const StickyNoteWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const StickyNoteContainer = styled.div<{
  borderColor: string;
  backgroundColor: string;
  isEditing: boolean;
  selected?: boolean;
  isReadOnly?: boolean;
}>`
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.backgroundColor};
  border-radius: 16px;
  border: 2px solid ${(props) => props.borderColor};
  padding: ${(props) => (props.isEditing ? '8px' : '16px')} 16px 16px 16px;
  display: flex;
  flex-direction: column;
  cursor: ${(props) => (props.isReadOnly ? 'pointer' : props.isEditing ? 'text' : 'move')};
  position: relative;
  /* Ensure resize handles are clickable */
  pointer-events: auto;

  outline: ${(props) =>
    props.selected
      ? `4px solid color-mix(in srgb, ${props.borderColor} 40%, transparent)`
      : 'none'};

  &:hover {
    outline: ${(props) => `4px solid color-mix(in srgb, ${props.borderColor} 40%, transparent)`};
  }
`;

export const StickyNoteTextArea = styled.textarea<{ isEditing: boolean }>`
  flex: 1;
  min-height: 0;
  ${stickyNoteContentStyles}

  background: transparent;
  border: none;
  outline: none;
  resize: none;
  cursor: ${(props) => (props.isEditing ? 'text' : 'move')};
  user-select: ${(props) => (props.isEditing ? 'text' : 'none')};
  pointer-events: ${(props) => (props.isEditing ? 'auto' : 'none')};

  &::placeholder {
    color: var(--canvas-foreground-de-emp);
    opacity: ${(props) => (props.isEditing ? 1 : 0.6)};
  }

  &:focus {
    user-select: text;
    cursor: text;
  }
`;

export const StickyNoteMarkdown = styled.div`
  flex: 1;
  min-height: 0;
  ${stickyNoteContentStyles}

  word-wrap: break-word;

  /* Markdown styles */
  p {
    margin: 0 0 8px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  code {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-family:
      'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: rgba(0, 0, 0, 0.1);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  ul,
  ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }

  li {
    margin: 4px 0;
  }

  a {
    color: var(--canvas-primary);
    text-decoration: underline;
    cursor: pointer;
    pointer-events: auto;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 12px 0 8px 0;
    font-weight: 600;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    font-size: 1.5em;
  }

  h2 {
    font-size: 1.3em;
  }

  h3 {
    font-size: 1.1em;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
    font-size: 0.9em;
  }

  th,
  td {
    border: 1px solid rgba(0, 0, 0, 0.15);
    padding: 6px 10px;
    text-align: left;
  }

  th {
    font-weight: 600;
    background: rgba(0, 0, 0, 0.05);
  }

  tr:nth-of-type(even) {
    background: rgba(0, 0, 0, 0.02);
  }

  blockquote {
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    padding-left: 12px;
    margin: 8px 0;
    color: var(--canvas-foreground-de-emp);
  }
`;

export const ResizeHandle = styled.div<{ selected?: boolean; cursor?: string }>`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: ${(props) => props.cursor || 'nwse-resize'};
  opacity: ${(props) => (props.selected ? 1 : 0)};
  transition: opacity 0.2s ease;
  z-index: 10;
  pointer-events: auto;
`;

export const TopCornerIndicators = styled.div<{ visible?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${(props) => (props.visible ? 1 : 0)};

  /* Top-left corner */
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    width: 6px;
    height: 6px;
    background: var(--canvas-background);
    border: 1px solid var(--canvas-primary);
    border-radius: 1px;
  }

  /* Top-right corner */
  &::after {
    content: '';
    position: absolute;
    top: -5px;
    right: -5px;
    width: 6px;
    height: 6px;
    background: var(--canvas-background);
    border: 1px solid var(--canvas-primary);
    border-radius: 1px;
  }
`;

export const BottomCornerIndicators = styled.div<{ visible?: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${(props) => (props.visible ? 1 : 0)};

  /* Bottom-left corner */
  &::before {
    content: '';
    position: absolute;
    bottom: -5px;
    left: -5px;
    width: 6px;
    height: 6px;
    background: var(--canvas-background);
    border: 1px solid var(--canvas-primary);
    border-radius: 1px;
  }

  /* Bottom-right corner */
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 6px;
    height: 6px;
    background: var(--canvas-background);
    border: 1px solid var(--canvas-primary);
    border-radius: 1px;
  }
`;

export const ColorPickerPanel = styled(motion.div)`
  display: flex;
  height: 30px;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--canvas-background);
  border: 1px solid var(--canvas-border-grid);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
`;

export const ColorOption = styled.button<{ color: string; isSelected: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  border: none;
  cursor: pointer;
  transition: border 0.15s ease;
  padding: 0;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: 2px solid var(--canvas-primary);
    outline-offset: 1px;
  }
`;

export const FormattingToolbarContainer = styled.div<{ borderColor: string }>`
  order: -1;
  display: flex;
  align-items: center;
  gap: 1px;
  padding-bottom: 4px;
  margin-bottom: 8px;
  border-bottom: 1px solid ${(props) => `color-mix(in srgb, ${props.borderColor} 30%, transparent)`};
  flex-shrink: 0;
`;

export const FormattingButton = styled.button<{ isActive: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  color: var(--canvas-foreground);
  background: ${(props) =>
    props.isActive ? 'color-mix(in srgb, var(--canvas-primary) 30%, transparent)' : 'transparent'};

  &:hover {
    background: ${(props) =>
      props.isActive
        ? 'color-mix(in srgb, var(--canvas-primary) 40%, transparent)'
        : 'color-mix(in srgb, var(--canvas-foreground) 10%, transparent)'};
  }
`;

export const ToolbarSeparator = styled.div`
  width: 1px;
  height: 16px;
  background: color-mix(in srgb, var(--canvas-foreground) 15%, transparent);
  margin: 0 4px;
`;
